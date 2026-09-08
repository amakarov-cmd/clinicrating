const GOOGLE_APPS_SCRIPT_URL_PATTERN = /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/;

export function buildContactPayload(form, location = window.location) {
  const formData = new FormData(form);
  const query = new URLSearchParams(location.search);

  return {
    requestId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    source: "clinicrating",
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    website: String(formData.get("website") || ""),
    consent: formData.get("consent") === "on" ? "Да" : "Нет",
    submittedAt: new Date().toISOString(),
    pageUrl: location.href,
    pageTitle: document.title,
    referrer: document.referrer,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    language: navigator.language || "",
    screen: `${window.screen.width}×${window.screen.height}`,
    userAgent: navigator.userAgent,
    utmSource: query.get("utm_source") || "",
    utmMedium: query.get("utm_medium") || "",
    utmCampaign: query.get("utm_campaign") || "",
    utmContent: query.get("utm_content") || "",
    utmTerm: query.get("utm_term") || "",
    yclid: query.get("yclid") || "",
    gclid: query.get("gclid") || "",
  };
}

export function getContactEndpoint() {
  const endpoint = String(import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL || "").trim();
  return GOOGLE_APPS_SCRIPT_URL_PATTERN.test(endpoint) ? endpoint : "";
}

export async function sendContactSubmission(endpoint, payload) {
  const body = new URLSearchParams(payload);
  await fetch(endpoint, {
    method: "POST",
    mode: "no-cors",
    cache: "no-store",
    keepalive: true,
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
}
