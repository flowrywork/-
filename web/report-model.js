(function (root) {
  "use strict";
  const PHOTO_FIELDS = Object.freeze([
    ["scaleLoaded", "Весы с грузом"], ["scaleEmpty", "Весы без груза"],
    ["vehicleLoaded", "ТС с грузом"], ["vehicleEmpty", "ТС без груза"],
    ["ttn", "ТТН"], ["vehicleFront", "ТС спереди"]
  ]);
  const MASS_FIELDS = Object.freeze([
    "upnsh08Night", "upnsh08Day", "upnsh11Night", "upnsh11Day", "upnsh13Night", "upnsh13Day",
    "customerWaste", "ownCollection", "contractorWaste", "accumulatedWaste", "nzgImport", "btmImport",
    "nveRocking", "pressed", "stored", "dieselReceived", "dieselBalance"
  ]);
  function number(value) {
    const parsed = Number(String(value == null ? "" : value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function validate(report) {
    const errors = [];
    if (!report.date) errors.push("Укажите дату");
    if (!String(report.landfill || "").trim()) errors.push("Укажите полигон");
    MASS_FIELDS.forEach((field) => { if (number(report[field]) < 0) errors.push("Масса не может быть отрицательной"); });
    if (number(report.ownCollection) > number(report.customerWaste)) errors.push("Наш сбор не может превышать массу от заказчика");
    const photos = report.photos || {};
    PHOTO_FIELDS.forEach(([key, label]) => { if (!photos[key]) errors.push("Добавьте фото: " + label); });
    if (Object.keys(photos).filter((key) => photos[key]).length !== PHOTO_FIELDS.length) errors.push("Нужно ровно шесть фотографий");
    return [...new Set(errors)];
  }
  function format(report) {
    const totalWaste = number(report.customerWaste) + number(report.contractorWaste);
    return [
      "Суточный отчёт за " + (report.date || "—"), "Полигон: " + (report.landfill || "—"),
      "УПНШ 08: ночь " + number(report.upnsh08Night) + " т; день " + number(report.upnsh08Day) + " т",
      "УПНШ 11: ночь " + number(report.upnsh11Night) + " т; день " + number(report.upnsh11Day) + " т",
      "УПНШ 13: ночь " + number(report.upnsh13Night) + " т; день " + number(report.upnsh13Day) + " т",
      "ТБО: заказчик " + number(report.customerWaste) + " т (наш сбор " + number(report.ownCollection) + " т), подрядчики " + number(report.contractorWaste) + " т, итого " + totalWaste + " т",
      "Состояние установки: " + (report.plantState || "—"), "Ремонт: " + (report.repair || "—"), "Комментарий: " + (report.comment || "—")
    ].join("\n");
  }
  const api = { PHOTO_FIELDS, MASS_FIELDS, number, validate, format };
  root.EcoReportModel = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
