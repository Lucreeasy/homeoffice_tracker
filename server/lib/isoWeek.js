function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Monday of the ISO week containing `date`.
function startOfIsoWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = Sunday ... 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

// ISO week number + week-year for `date` (date must be a Monday for our use case,
// but this works for any date).
function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { week: weekNo, year: d.getUTCFullYear() };
}

function getCurrentWeekInfo(now = new Date()) {
  const monday = startOfIsoWeek(now);
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(toDateString(d));
  }
  const { week, year } = isoWeekNumber(monday);
  return {
    week: `${year}-W${pad(week)}`,
    dates,
  };
}

module.exports = { getCurrentWeekInfo };
