const SPREADSHEET_ID = "1lIJhyNlLL2Iee6LBAp3yMjzkYJ1JsII4qbd7XklSEhM";

/**
 * ENTRY POINT
 */
function doGet(e) {
  return route(e, "GET");
}

function doPost(e) {
  return route(e, "POST");
}

/**
 * ROUTER UTAMA
 */
function route(e, method) {
  try {

    const path = e.parameter.path || "";

    // parsing body JSON (POST)
    let body = {};
    if (method === "POST" && e.postData) {
      body = JSON.parse(e.postData.contents);
    }

    /**
     * ======================
     * PRESENCE ROUTES
     * ======================
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
 * ======================
 * TEMP FUNCTIONS
 * ======================
 */

function generateQR(body) {
  return jsonResponse({
    ok: true,
    data: { message: "generateQR endpoint ready" }
  });
}

function checkinPresence(body) {
  return jsonResponse({
    ok: true,
    data: { message: "checkin endpoint ready" }
  });
}

function getPresenceStatus(params) {
  return jsonResponse({
    ok: true,
    data: { message: "status endpoint ready" }
  });
}

/**
 * RESPONSE FORMAT
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}