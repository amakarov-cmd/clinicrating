export const ratingColumns = [
  { key: "rank", label: "Место", type: "number" },
  { key: "name", label: "Клиника / сеть", type: "text" },
  { key: "avgMinutes", label: "Среднее время до первого звонка (чч:мм:сс)", type: "number" },
  { key: "callbacks", label: "Перезвон по заявкам", type: "status" },
  { key: "onlineBooking", label: "Онлайн-запись", type: "status" },
  { key: "metrikaGoal", label: "Цель в Яндекс Метрике", type: "status" },
  { key: "thankYou", label: "«Спасибо за заявку»", type: "status" },
  { key: "autoConfirmation", label: "Автоподтверждение записи", type: "status" },
  { key: "reminder", label: "Напоминание о записи", type: "status" },
  { key: "reminderChannels", label: "Каналы напоминаний", type: "text" },
  { key: "afterCancellation", label: "Взаимодействие после отмены", type: "status" },
];

const collator = new Intl.Collator("ru", { numeric: true, sensitivity: "base" });
const statusOrder = {
  "Нет": 0,
  "Не перезвонили": 0,
  "В меньшинстве случаев": 1,
  "Частично": 1,
  "В большинстве случаев": 2,
  "Да": 3,
  "Полная": 3,
  "По всем заявкам": 3,
};
const isMissing = (value) => value == null || value === "" || value === "Нет данных" || value === "—";

export function sortClinics(rows, key, direction) {
  const column = ratingColumns.find((item) => item.key === key);
  if (!column) return [...rows];
  const sign = direction === "descending" ? -1 : 1;

  return [...rows].sort((a, b) => {
    const left = a[key];
    const right = b[key];
    // Missing observations remain at the end in either direction.
    if (isMissing(left) !== isMissing(right)) return isMissing(left) ? 1 : -1;
    if (isMissing(left)) return a.rank - b.rank;

    let comparison;
    if (column.type === "number") comparison = left - right;
    else if (column.type === "status" && left in statusOrder && right in statusOrder) {
      comparison = statusOrder[left] - statusOrder[right];
    } else comparison = collator.compare(left, right);
    return comparison * sign || a.rank - b.rank;
  });
}
