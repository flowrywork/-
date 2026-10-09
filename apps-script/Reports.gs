function saveDaily_(actor,report) {
  if(actor.role!=="master")throw new Error("Недостаточно прав");validateDailyReport_(report);
  var sheet=db_().getSheetByName(SHEETS.daily),rows=sheet.getDataRange().getValues(),existing=rows.slice(1).find(function(r){return r[1]===report.requestId;});if(existing)return{id:existing[0],requestId:existing[1]};
  var id=Utilities.getUuid(),photoList=DAILY_PHOTO_FIELDS.map(function(key){var item=report.photos[key];item.field=key;return item;}),saved=savePhotos_(photoList,id);
  var photoMap={};saved.forEach(function(item,index){photoMap[DAILY_PHOTO_FIELDS[index]]=item;});
  var data=JSON.parse(JSON.stringify(report));delete data.photos;sheet.appendRow([id,report.requestId,actor.login,new Date(),report.date,report.landfill,JSON.stringify(data),JSON.stringify(photoMap)]);return{id:id,requestId:report.requestId};
}
function listDaily_(actor) {
  var rows=db_().getSheetByName(SHEETS.daily).getDataRange().getValues().slice(1);
  return rows.filter(function(r){return actor.role==="itr"||r[2]===actor.login;}).map(function(r){var report=JSON.parse(r[6]);report.id=r[0];report.author=r[2];report.createdAt=r[3];report.photos=JSON.parse(r[7]);return report;});
}
