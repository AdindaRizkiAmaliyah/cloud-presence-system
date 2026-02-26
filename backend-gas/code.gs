/**
 * ===============================
 * CONFIG
 * ===============================
 */
const SPREADSHEET_ID =
"1lIJhyNlLL2Iee6LBAp3yMjzkYJ1JsII4qbd7XklSEhM";


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
 * ROUTER
 * ===============================
 */
function route(e, method) {

  try {

    const path = e.parameter.path || "";

    let body = {};
    if (method === "POST" && e.postData) {
      body = JSON.parse(e.postData.contents);
    }

    /** ========= PRESENCE ========= */

    if (method === "POST" && path === "presence/qr/generate")
      return generateQR(body);

    if (method === "POST" && path === "presence/checkin")
      return checkinPresence(body);

    if (method === "GET" && path === "presence/status")
      return getPresenceStatus(e.parameter);

    return jsonResponse({
      ok:false,
      error:"route_not_found"
    });

  } catch(err) {
    return jsonResponse({
      ok:false,
      error:err.message
    });
  }
}


/**
 * ===============================
 * SHEET HELPER
 * ===============================
 */
function getSheet(name){
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}


/**
 * ===============================
 * TIME HELPER
 * ===============================
 */
function nowISO(){
  return new Date().toISOString();
}

function addMinutesISO(min){
  const d = new Date();
  d.setMinutes(d.getMinutes()+min);
  return d.toISOString();
}


/**
 * ===============================
 * TOKEN GENERATOR
 * ===============================
 */
function generateToken(){

  const chars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let result="TKN-";

  for(let i=0;i<6;i++){
    result+=chars.charAt(
      Math.floor(Math.random()*chars.length)
    );
  }

  return result;
}


/**
 * ===============================
 * STEP 5
 * GENERATE QR
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

  // ✅ QR IMAGE
  const qr_image =
    "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data="
    + encodeURIComponent(qr_token);

  return jsonResponse({
    ok: true,
    data: {
      qr_token,
      qr_image,
      expires_at
    }
  });
}


/**
 * ===============================
 * STEP 6
 * CHECKIN PRESENCE
 * ===============================
 */
function checkinPresence(body){

  const tokenSheet=getSheet("tokens");
  const presenceSheet=getSheet("presence");

  const tokenData=tokenSheet
    .getDataRange()
    .getValues();

  const qr_token=body.qr_token;
  const student_id=body.student_id;

  let tokenRow=null;

  // ==== FIND TOKEN ====
  for(let i=1;i<tokenData.length;i++){
    if(tokenData[i][0]===qr_token){
      tokenRow=tokenData[i];
      break;
    }
  }

  if(!tokenRow){
    return jsonResponse({
      ok:false,
      error:"invalid_token"
    });
  }

  const course_id=tokenRow[1];
  const session_id=tokenRow[2];
  const expires_at=new Date(tokenRow[3]);

  // ==== EXPIRED CHECK ====
  if(new Date()>expires_at){
    return jsonResponse({
      ok:false,
      error:"token_expired"
    });
  }

  // ==== DOUBLE CHECKIN ====
  const presenceData=
    presenceSheet.getDataRange().getValues();

  for(let i=1;i<presenceData.length;i++){
    if(
      presenceData[i][0]===student_id &&
      presenceData[i][1]===qr_token
    ){
      return jsonResponse({
        ok:false,
        error:"already_checkin"
      });
    }
  }

  // ==== SAVE CHECKIN ====
  presenceSheet.appendRow([
    student_id,
    qr_token,
    course_id,
    session_id,
    nowISO()
  ]);

  return jsonResponse({
    ok:true,
    message:"checkin_success"
  });
}


/**
 * ===============================
 * STATUS
 * ===============================
 */
function getPresenceStatus(params){

  const sheet=getSheet("presence");
  const data=sheet.getDataRange().getValues();

  for(let i=1;i<data.length;i++){
    if(
      data[i][0]===params.student_id &&
      data[i][1]===params.qr_token
    ){
      return jsonResponse({
        ok:true,
        checked_in:true
      });
    }
  }

  return jsonResponse({
    ok:true,
    checked_in:false
  });
}


/**
 * ===============================
 * RESPONSE
 * ===============================
 */
function jsonResponse(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}