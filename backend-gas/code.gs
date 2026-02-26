/**
 * ===============================
 * CONFIG
 * ===============================
 */
const SPREADSHEET_ID = "1lIJhyNlLL2Iee6LBAp3yMjzkYJ1JsII4qbd7XklSEhM";


/**
 * ===============================
 * ENTRY POINT
 * ===============================
 */
function doGet(e) {
  return route(e, "GET");
}

function doPost(e) {
  return route(e, "POST");
}


/**
 * ===============================
 * ROUTER SYSTEM
 * ===============================
 */
function route(e, method) {
  try {

    const path = e.parameter.path || "";

    let body = {};
    if (method === "POST" && e.postData) {
      body = JSON.parse(e.postData.contents);
    }

    /**
     * ========= PRESENCE =========
     */

    if (method === "POST" && path === "presence/qr/generate") {
      return generateQR(body);
    }

    if (method === "POST" && path === "presence/checkin") {
      return checkinPresence(body);
    }

    if (method === "GET" && path === "presence/status") {
      return getPresenceStatus(e.parameter);
    }

    return jsonResponse({
      ok: false,
      error: "route_not_found"
    });

  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err.message
    });
  }
}


/**
 * ===============================
 * DATABASE HELPER
 * ===============================
 */
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}


/**
 * ===============================
 * TIME HELPER
 * ===============================
 */
function nowISO() {
  return new Date().toISOString();
}

function addMinutesISO(minutes) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}


/**
 * ===============================
 * TOKEN GENERATOR
 * ===============================
 */
function generateToken() {

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let result = "TKN-";

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return result;
}


/**
 * ===============================
 * MODULE 1
 * GENERATE QR TOKEN
 * ===============================
 */
function generateQR(body) {

  const sheet = getSheet("tokens");

  const qr_token = generateToken();
  const created_at = nowISO();
  const expires_at = addMinutesISO(1);

  sheet.appendRow([
    qr_token,
    body.course_id,
    body.session_id,
    expires_at,
    created_at
  ]);

  return jsonResponse({
    ok: true,
    data: {
      qr_token,
      expires_at
    }
  });
}


/**
 * ===============================
 * TEMP (STEP 6 NEXT)
 * ===============================
 */
function checkinPresence(body) {
  return jsonResponse({
    ok: true,
    data: {
      message: "checkin endpoint ready"
    }
  });
}

function getPresenceStatus(params) {
  return jsonResponse({
    ok: true,
    data: {
      message: "status endpoint ready"
    }
  });
}


/**
 * ===============================
 * STANDARD RESPONSE
 * ===============================
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}