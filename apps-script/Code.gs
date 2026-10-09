var SHEETS = { users:"Пользователи", sessions:"Сессии", entries:"Приёмка", daily:"Суточные отчёты" };
var ENTRY_HEADERS = ["ID","Request ID","Автор","Дата создания","Тип","ТС","Масса, т","ТТН","Фото JSON","Подтверждено","Подтвердил","Дата подтверждения"];

function setup() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty("SPREADSHEET_ID");
  var ss = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.create("Сервис Экология — данные");
  if (!spreadsheetId) props.setProperty("SPREADSHEET_ID", ss.getId());
  var folderId = props.getProperty("PHOTO_FOLDER_ID");
  if (!folderId) props.setProperty("PHOTO_FOLDER_ID", DriveApp.createFolder("Сервис Экология — закрытые фото").getId());
  ensureSheet_(ss,SHEETS.users,["Логин","Имя","Роль","Соль","Хеш","Активен"]);
  ensureSheet_(ss,SHEETS.sessions,["Токен","Логин","Роль","Создана","Истекает","Отозвана"]);
  ensureSheet_(ss,SHEETS.entries,ENTRY_HEADERS);
  ensureSheet_(ss,SHEETS.daily,DAILY_HEADERS);
  seedUser_(ss,"master","Мастер","master","MasterDemo123!");
  seedUser_(ss,"itr","ИТР","itr","ItrDemo123!");
  return { spreadsheetId:ss.getId(), folderId:props.getProperty("PHOTO_FOLDER_ID") };
}

function doGet() { return output_({ok:true,data:{service:"Сервис Экология",version:"0.3.0"}}); }
function doPost(event) {
  try {
    var request = JSON.parse((event.postData && event.postData.contents) || "{}");
    var action = request.action, payload = request.payload || {};
    if (action === "login") return output_({ok:true,data:login_(payload)});
    var actor = authorize_(request.sessionToken);
    var result;
    if (action === "listEntries") result = listEntries_(actor);
    else if (action === "saveEntry") result = saveEntry_(actor,payload);
    else if (action === "confirmEntry") result = confirmEntry_(actor,payload);
    else if (action === "saveDaily") result = saveDaily_(actor,payload);
    else if (action === "listDaily") result = listDaily_(actor);
    else throw new Error("Неизвестное действие");
    return output_({ok:true,data:result});
  } catch (error) { return output_({ok:false,error:error.message}); }
}

function output_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function db_() { return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID")); }
function ensureSheet_(ss,name,headers) {
  var sheet=ss.getSheetByName(name)||ss.insertSheet(name); var range=sheet.getRange(1,1,1,headers.length); range.setValues([headers]); range.setFontWeight("bold"); sheet.setFrozenRows(1); return sheet;
}
function seedUser_(ss,login,name,role,password) {
  var sheet=ss.getSheetByName(SHEETS.users),values=sheet.getDataRange().getValues();
  if(values.slice(1).some(function(row){return row[0]===login;})) return;
  var salt=randomHex_(32); sheet.appendRow([login,name,role,salt,hashPassword_(password,salt),true]);
}
function login_(payload) {
  var login=String(payload.login||"").trim(),cache=CacheService.getScriptCache(),attemptKey="login:"+login,attempts=Number(cache.get(attemptKey)||0);
  if(attempts>=5) throw new Error("Слишком много попыток. Повторите позже");
  var rows=db_().getSheetByName(SHEETS.users).getDataRange().getValues(),row=rows.slice(1).find(function(item){return item[0]===login;});
  if(!row||row[5]!==true||!safeEqual_(hashPassword_(String(payload.password||""),row[3]),row[4])){cache.put(attemptKey,String(attempts+1),600);throw new Error("Неверный логин или пароль");}
  cache.remove(attemptKey); var token=randomHex_(64),now=new Date(),expires=new Date(now.getTime()+12*60*60*1000);
  db_().getSheetByName(SHEETS.sessions).appendRow([token,row[0],row[2],now,expires,false]); return {token:token,login:row[0],role:row[2],name:row[1]};
}
function authorize_(token) {
  var rows=db_().getSheetByName(SHEETS.sessions).getDataRange().getValues();
  for(var i=rows.length-1;i>0;i--){var row=rows[i];if(row[0]===token&&!row[5]&&new Date(row[4]).getTime()>Date.now())return{login:row[1],role:row[2]};}
  throw new Error("Сессия недействительна");
}
function listEntries_(actor) {
  var values=db_().getSheetByName(SHEETS.entries).getDataRange().getValues().slice(1);
  return values.filter(function(r){return actor.role==="itr"||r[2]===actor.login;}).map(function(r){return{id:r[0],requestId:r[1],author:r[2],createdAt:r[3],type:r[4],vehicle:r[5],mass:r[6],ttn:r[7],photos:JSON.parse(r[8]||"[]"),confirmed:r[9]===true};});
}
function saveEntry_(actor,payload) {
  if(actor.role!=="master")throw new Error("Недостаточно прав");
  var expected=payload.type==="NSO"?3:1;if(["NSO","TBO"].indexOf(payload.type)<0||!payload.vehicle||Number(payload.mass)<=0||(payload.photos||[]).length!==expected)throw new Error("Проверьте обязательные поля и фотографии");
  var sheet=db_().getSheetByName(SHEETS.entries),rows=sheet.getDataRange().getValues(),existing=rows.slice(1).find(function(r){return r[1]===payload.requestId;});if(existing)return{id:existing[0],requestId:existing[1]};
  var id=Utilities.getUuid(),photos=savePhotos_(payload.photos,id);sheet.appendRow([id,payload.requestId,actor.login,new Date(),payload.type,payload.vehicle,Number(payload.mass),payload.ttn||"",JSON.stringify(photos),false,"",""]);return{id:id,requestId:payload.requestId};
}
function confirmEntry_(actor,payload) {
  if(actor.role!=="itr")throw new Error("Недостаточно прав");var sheet=db_().getSheetByName(SHEETS.entries),values=sheet.getDataRange().getValues();
  for(var i=1;i<values.length;i++)if(values[i][0]===payload.id){sheet.getRange(i+1,10,1,3).setValues([[true,actor.login,new Date()]]);return{id:payload.id,confirmed:true};}throw new Error("Запись не найдена");
}
function savePhotos_(photos,prefix) {
  var folder=DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty("PHOTO_FOLDER_ID"));
  return (photos||[]).map(function(photo,index){if(!photo.data)throw new Error("Файл фотографии не передан");var match=photo.data.match(/^data:([^;]+);base64,(.+)$/);if(!match)throw new Error("Некорректное фото");var file=folder.createFile(Utilities.newBlob(Utilities.base64Decode(match[2]),match[1],prefix+"-"+(index+1)));return{id:file.getId(),name:photo.name||file.getName()};});
}
