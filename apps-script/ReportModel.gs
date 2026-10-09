var DAILY_PHOTO_FIELDS = ["scaleLoaded","scaleEmpty","vehicleLoaded","vehicleEmpty","ttn","vehicleFront"];
var DAILY_HEADERS = ["ID","Request ID","Автор","Дата создания","Дата","Полигон","Данные JSON","Фото JSON"];

function validateDailyReport_(report) {
  if (!report.date || !String(report.landfill || "").trim()) throw new Error("Укажите дату и полигон");
  var photos = report.photos || {};
  var supplied = Object.keys(photos).filter(function (key) { return photos[key]; });
  if (supplied.length !== DAILY_PHOTO_FIELDS.length) throw new Error("Нужно ровно шесть фотографий");
  DAILY_PHOTO_FIELDS.forEach(function (key) { if (!photos[key]) throw new Error("Отсутствует обязательное фото: " + key); });
  if (Number(report.ownCollection || 0) > Number(report.customerWaste || 0)) throw new Error("Наш сбор не может превышать массу от заказчика");
}
