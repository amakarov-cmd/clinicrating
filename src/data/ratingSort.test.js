import test from "node:test";
import assert from "node:assert/strict";
import { clinics } from "./clinics.js";
import { ratingColumns, sortClinics } from "./ratingSort.js";

test("sorts places and minutes numerically without changing source rows", () => {
  const rows = [{ rank: 3, avgMinutes: 100 }, { rank: 1, avgMinutes: 9 }, { rank: 2, avgMinutes: 20 }];
  const original = structuredClone(rows);
  assert.deepEqual(sortClinics(rows, "avgMinutes", "ascending").map((row) => row.avgMinutes), [9, 20, 100]);
  assert.deepEqual(sortClinics(rows, "avgMinutes", "descending").map((row) => row.avgMinutes), [100, 20, 9]);
  assert.deepEqual(sortClinics(rows, "rank", "ascending").map((row) => row.rank), [1, 2, 3]);
  assert.deepEqual(rows, original);
});

test("sorts Russian names alphabetically", () => {
  const rows = ["Ясно", "Омикрон", "Альфа"].map((name, rank) => ({ name, rank }));
  assert.deepEqual(sortClinics(rows, "name", "ascending").map((row) => row.name), ["Альфа", "Омикрон", "Ясно"]);
  assert.deepEqual(sortClinics(rows, "name", "descending").map((row) => row.name), ["Ясно", "Омикрон", "Альфа"]);
});

test("orders statuses logically and keeps missing observations last", () => {
  const rows = ["Да", "Нет данных", "Частично", "Нет"].map((reminder, rank) => ({ reminder, rank }));
  assert.deepEqual(sortClinics(rows, "reminder", "ascending").map((row) => row.reminder), ["Нет", "Частично", "Да", "Нет данных"]);
  assert.deepEqual(sortClinics(rows, "reminder", "descending").map((row) => row.reminder), ["Да", "Частично", "Нет", "Нет данных"]);
});

test("sorts all actual columns in both directions with deterministic ties", () => {
  const before = structuredClone(clinics);
  for (const { key } of ratingColumns) {
    for (const direction of ["ascending", "descending"]) {
      const sorted = sortClinics(clinics, key, direction);
      assert.equal(sorted.length, clinics.length);
      assert.equal(new Set(sorted.map((row) => row.rank)).size, clinics.length);
      assert.deepEqual(sortClinics(sorted, key, direction), sorted);
      for (let index = 1; index < sorted.length; index += 1) {
        assert.deepEqual(sortClinics([sorted[index - 1], sorted[index]], key, direction), [sorted[index - 1], sorted[index]]);
      }
    }
  }
  assert.deepEqual(clinics, before);
});

test("sorts a filtered subset before taking the first page", () => {
  const filtered = clinics.filter((row) => row.cities.includes("Казань"));
  const sorted = sortClinics(filtered, "rank", "descending");
  assert.equal(sorted[0].rank, Math.max(...filtered.map((row) => row.rank)));
  assert.ok(sorted.every((row) => row.cities.includes("Казань")));
  assert.ok(sorted.slice(0, 15).every((row, index, rows) => index === 0 || rows[index - 1].rank > row.rank));
});
