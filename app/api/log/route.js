import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { google } from "googleapis";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const entry = await req.json();
  const SHEET_ID = process.env.SHEET_ID;

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: session.accessToken });

  const sheets = google.sheets({ version: "v4", auth });

  try {
    // Ensure header row exists
    const meta = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Food Log!A1",
    });

    if (!meta.data.values || meta.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: "Food Log!A1",
        valueInputOption: "RAW",
        requestBody: {
          values: [["ID","Date","Time","Food Item","Nos","Weight","Calories","Source","Protein","Carbs","Fat","Daily Total"]],
        },
      });
    }

    // Get existing data to check for duplicates and calc daily total
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Food Log!A:L",
    });

    const rows = existing.data.values || [];
    const existingIds = new Set(rows.slice(1).map(r => r[0]));

    if (existingIds.has(entry.id)) {
      return Response.json({ status: "duplicate" });
    }

    // Calculate daily total
    let dailyTotal = parseFloat(entry.calories) || 0;
    rows.slice(1).forEach(r => {
      if (r[1] === entry.date) {
        dailyTotal += parseFloat(r[6]) || 0;
      }
    });

    // Append the new row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Food Log!A:L",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          entry.id, entry.date, entry.time, entry.name,
          entry.nos || "", entry.weight || "",
          entry.calories, entry.source,
          entry.protein, entry.carbs, entry.fat,
          dailyTotal
        ]],
      },
    });

    return Response.json({ status: "ok", dailyTotal });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
