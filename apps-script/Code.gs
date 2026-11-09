/**
 * Poker Night signup backend.
 *
 * Deployment:
 *   1. Open (or create) a Google Sheet, then Extensions > Apps Script.
 *   2. Paste this whole file in, replacing any boilerplate, and save.
 *   3. Deploy > New deployment > type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   4. Click Deploy, authorize when prompted, and copy the Web App URL.
 *   5. Paste that URL into the SCRIPT_URL constant near the top of app.js.
 */

const SHEET_NAME = "Signups";
const HEADER_ROW = ["Timestamp", "Name", "Email", "Phone", "Payment Method", "Paid?", "Notes"];

function getSignupsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
  }

  return sheet;
}

function doPost(e) {
  // Guards the read-then-append below against a race when two people
  // submit at nearly the same moment.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "Could not acquire lock, please retry." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getSignupsSheet_();

    // "Paid?" is left blank on purpose. Joey checks Venmo and fills this in
    // manually (Y/N or a note like "cash"). Payment is never auto-detected.
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || "",
      data.email || "",
      data.phone || "",
      data.paymentMethod || "",
      "",
      data.notes || "",
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    const sheet = getSignupsSheet_();
    const count = Math.max(sheet.getLastRow() - 1, 0);

    return ContentService
      .createTextOutput(JSON.stringify({ count: count }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
