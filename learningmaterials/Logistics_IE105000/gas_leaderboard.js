/**
 * Google Apps Script — Logistics Game Leaderboard
 *
 * Setup:
 *  1. Open Google Sheets, rename the first sheet to "scores"
 *  2. Open Extensions > Apps Script, paste this file
 *  3. Deploy > New deployment > Web app
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  4. Copy the deployment URL into config.js → leaderboard.gasUrl
 */

const SHEET_NAME = 'scores';

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['id', 'submitted_at', 'name', 'profit', 'units', 'chain']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet(e) {
  const action = (e.parameter.action || 'read');

  // ── Read all scores ────────────────────────────────────────────────────────
  if (action === 'read') {
    const sheet = getSheet();
    const data  = sheet.getDataRange().getValues();
    if (data.length <= 1) return output([]);
    const rows = data.slice(1)
      .map(row => ({
        id:           String(row[0]),
        submitted_at: String(row[1]),
        name:         String(row[2]),
        profit:       Number(row[3]),
        units:        Number(row[4]),
        chain:        String(row[5]),
      }))
      .sort((a, b) => b.profit - a.profit);
    return output(rows);
  }

  // ── Insert a score ─────────────────────────────────────────────────────────
  if (action === 'insert') {
    const sheet = getSheet();
    const id    = Date.now();
    sheet.appendRow([
      id,
      new Date().toISOString(),
      e.parameter.name   || '',
      Number(e.parameter.profit) || 0,
      Number(e.parameter.units)  || 0,
      e.parameter.chain  || '',
    ]);
    return output({ success: true, id });
  }

  // ── Delete one score or all ────────────────────────────────────────────────
  if (action === 'delete') {
    const sheet = getSheet();
    if (e.parameter.id === 'all') {
      const last = sheet.getLastRow();
      if (last > 1) sheet.deleteRows(2, last - 1);
    } else {
      const data = sheet.getDataRange().getValues();
      for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][0]) === String(e.parameter.id)) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
    }
    return output({ success: true });
  }

  return output({ error: 'Unknown action' });
}

function output(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
