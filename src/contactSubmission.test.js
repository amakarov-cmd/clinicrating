import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("contact integration sends the fields expected by Google Apps Script", () => {
  const frontend = readFileSync(new URL("./contactSubmission.js", import.meta.url), "utf8");
  const backend = readFileSync(new URL("../google-apps-script/Code.gs", import.meta.url), "utf8");
  const fields = ["requestId", "source", "name", "phone", "consent", "submittedAt", "pageUrl", "referrer", "timezone", "utmSource", "utmMedium", "utmCampaign", "yclid", "gclid"];

  fields.forEach((field) => {
    assert.match(frontend, new RegExp(`\\b${field}\\b`));
    assert.match(backend, new RegExp(`\\b${field}\\b`));
  });
});

test("deployment workflow passes the Apps Script URL into the Vite build", () => {
  const workflow = readFileSync(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8");
  assert.match(workflow, /VITE_GOOGLE_SHEETS_WEB_APP_URL/);
  assert.match(workflow, /secrets\.GOOGLE_SHEETS_WEB_APP_URL/);
});
