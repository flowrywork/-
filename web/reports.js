(function (root) {
  "use strict";
  const M = root.EcoReportModel;
  const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  function input(name, label, type, value) {
    return `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type || "text"}" value="${esc(value)}" ${type === "number" ? 'min="0" step="0.001" inputmode="decimal"' : ""}></div>`;
  }
  function dailyForm(draft) {
    const d = draft || {};
    const mass = [
      ["upnsh08Night","УПНШ 08 — ночь, т"],["upnsh08Day","УПНШ 08 — день, т"],["upnsh11Night","УПНШ 11 — ночь, т"],["upnsh11Day","УПНШ 11 — день, т"],
      ["upnsh13Night","УПНШ 13 — ночь, т"],["upnsh13Day","УПНШ 13 — день, т"],["customerWaste","ТБО от заказчика, т"],["ownCollection","Наш сбор (часть заказчика), т"],
      ["contractorWaste","ТБО подрядчиков, т"],["accumulatedWaste","Накопление ТБО, т"],["nzgImport","Завоз НЗГ/НШ, т"],["btmImport","Завоз БТМ, т"],
      ["nveRocking","Раскачка НВЭ, т"],["pressed","Прессование, т"],["stored","Складирование, т"],["dieselReceived","Поступление ДТ, т"],["dieselBalance","Остаток ДТ, т"]
    ];
    return `<section class="card"><h2>Суточный отчёт мастера</h2><form id="daily-form" class="grid">
      ${input("date","Дата","date",d.date || new Date().toISOString().slice(0,10))}${input("landfill","Полигон","text",d.landfill)}${mass.map(([n,l]) => input(n,l,"number",d[n])).join("")}
      ${input("shiftPeople","Численность вахты","number",d.shiftPeople)}${input("transport","Транспорт и спецтехника","text",d.transport)}
      ${input("plantState","Состояние установки","text",d.plantState)}${input("mapState","Состояние карты","text",d.mapState)}${input("geyser1","Гейзер-1","text",d.geyser1)}${input("geyser2","Гейзер-2","text",d.geyser2)}
      <div class="field full"><label for="repair">Ремонт</label><textarea id="repair" name="repair">${esc(d.repair)}</textarea></div><div class="field full"><label for="comment">Комментарий</label><textarea id="comment" name="comment">${esc(d.comment)}</textarea></div>
      <div class="full"><h3>Шесть обязательных фото</h3><div class="photo-grid">${M.PHOTO_FIELDS.map(([key,label]) => `<div class="photo"><label for="photo-${key}">${label}</label><input id="photo-${key}" name="photo-${key}" type="file" accept="image/*" capture="environment" required></div>`).join("")}</div></div>
      <div id="daily-error" class="error full"></div><div id="daily-preview" class="preview full">${d.date ? esc(M.format(d)) : "Предпросмотр появится после заполнения"}</div>
      <div class="actions full"><button class="secondary" type="button" id="save-draft">Сохранить черновик</button><button class="primary" type="submit">Отправить отчёт</button></div></form></section>`;
  }
  function collect(form, existingPhotos) {
    const data = Object.fromEntries(new FormData(form).entries());
    const photos = Object.assign({}, existingPhotos || {});
    M.PHOTO_FIELDS.forEach(([key]) => { const file = form.elements["photo-" + key].files[0]; if (file) photos[key] = { name:file.name, size:file.size, type:file.type }; delete data["photo-" + key]; });
    data.photos = photos; return data;
  }
  root.EcoReports = { dailyForm, collect, esc };
})(window);
