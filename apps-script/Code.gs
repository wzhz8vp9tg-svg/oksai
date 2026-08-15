const SHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE';
const SHEET_NAME = 'Results';

function doPost(e) {
  try {
    const payload = JSON.parse((e.parameter && e.parameter.payload) || '{}');
    if (!payload.session_id || !payload.name) return text_({ok:false,error:'missing fields'});
    const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const found = sh.createTextFinder(String(payload.session_id)).matchEntireCell(true).findNext();
      const row = toRow_(payload);
      if (found) sh.getRange(found.getRow(),1,1,row.length).setValues([row]);
      else sh.appendRow(row);
    } finally { lock.releaseLock(); }
    return text_({ok:true});
  } catch (err) { return text_({ok:false,error:String(err)}); }
}

function doGet(e) {
  const action = (e.parameter && e.parameter.action) || '';
  const callback = (e.parameter && e.parameter.callback) || '';
  if (action !== 'results') return jsonp_({ok:true,status:'oksai-api'}, callback);
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PIN');
  const pin = (e.parameter && e.parameter.pin) || '';
  if (!expected || pin !== expected) return jsonp_({ok:false,error:'관리자 PIN이 올바르지 않습니다.'}, callback);
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const values = sh.getDataRange().getValues();
  const results = values.slice(1).filter(r=>r[0]).map(r=>({
    session_id:r[0],name:r[1],start_time:r[2],finish_time:r[3],duration_ms:Number(r[4])||0,
    first_choices:[r[5],r[7],r[9],r[11],r[13],r[15]],
    attempts:[r[6],r[8],r[10],r[12],r[14],r[16]].map(Number),
    first_correct:Number(r[17])||0,trait_choices:String(r[18]||'').split(' | ').filter(Boolean),
    predicted_card:r[19],self_card:r[20],self_match:r[21]===true || String(r[21]).toUpperCase()==='TRUE'
  }));
  return jsonp_({ok:true,results}, callback);
}

function toRow_(p){
  const first=p.first_choices||[], att=p.attempts||[];
  const accuracy=(Number(p.first_correct)||0)*10, match=p.self_match?15:0;
  return [p.session_id,p.name,p.start_time,p.finish_time,Number(p.duration_ms)||0,
    first[0]||'',att[0]||0,first[1]||'',att[1]||0,first[2]||'',att[2]||0,
    first[3]||'',att[3]||0,first[4]||'',att[4]||0,first[5]||'',att[5]||0,
    Number(p.first_correct)||0,(p.trait_choices||[]).join(' | '),p.predicted_card||'',p.self_card||'',!!p.self_match,
    accuracy,'',match,'',true];
}

function text_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)}
function jsonp_(obj,callback){
  const json=JSON.stringify(obj);
  if(!callback) return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  const safe=String(callback).replace(/[^a-zA-Z0-9_$.]/g,'');
  return ContentService.createTextOutput(`${safe}(${json});`).setMimeType(ContentService.MimeType.JAVASCRIPT);
}
