const CONFIG = {
  SPREADSHEET_ID: "ВСТАВЬТЕ_ID_GOOGLE_ТАБЛИЦЫ",
  SHEET_NAME: "Заявки",
  SOURCE: "clinicrating",
};

const COLUMNS = [
  ["createdAt", "Время получения"],
  ["submittedAt", "Время на устройстве"],
  ["name", "Имя"],
  ["phone", "Телефон"],
  ["consent", "Согласие"],
  ["timezone", "Часовой пояс / регион"],
  ["language", "Язык браузера"],
  ["pageUrl", "Страница"],
  ["pageTitle", "Заголовок страницы"],
  ["referrer", "Источник перехода"],
  ["utmSource", "utm_source"],
  ["utmMedium", "utm_medium"],
  ["utmCampaign", "utm_campaign"],
  ["utmContent", "utm_content"],
  ["utmTerm", "utm_term"],
  ["yclid", "yclid"],
  ["gclid", "gclid"],
  ["screen", "Экран"],
  ["userAgent", "User Agent"],
  ["requestId", "ID заявки"],
];

function doGet() {
  return json_({ ok: true, service: "clinicrating-leads" });
}

function doPost(event) {
  try {
    const data = (event && event.parameter) || {};
    if (data.website) return json_({ ok: true }); // Honeypot: silently discard bots.
    if (data.source !== CONFIG.SOURCE) throw new Error("Unknown source");

    const name = clean_(data.name, 120);
    const phone = clean_(data.phone, 80);
    if (!name || !phone) throw new Error("Name and phone are required");

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME) || spreadsheet.insertSheet(CONFIG.SHEET_NAME);
      ensureHeader_(sheet);

      const normalized = { ...data, name, phone, createdAt: new Date() };
      sheet.appendRow(COLUMNS.map(([key]) => key === "createdAt" ? normalized[key] : clean_(normalized[key], 2000)));
    } finally {
      lock.releaseLock();
    }

    return json_({ ok: true });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: String(error.message || error) });
  }
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() > 0) return;
  const headers = COLUMNS.map(([, label]) => label);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#130F33").setFontColor("#FFFFFF");
  sheet.getRange("A:A").setNumberFormat("dd.mm.yyyy hh:mm:ss");
  sheet.autoResizeColumns(1, headers.length);
}

function clean_(value, maxLength) {
  const text = String(value == null ? "" : value).trim().slice(0, maxLength);
  // Prevent values submitted by visitors from becoming spreadsheet formulas.
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
