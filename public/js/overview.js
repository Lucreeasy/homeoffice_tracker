const WEEKDAY_LABELS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const REFRESH_INTERVAL_MS = 45000;

const weekInfoEl = document.getElementById('week-info');
const table = document.getElementById('overview-table');
const thead = table.querySelector('thead');
const tbody = table.querySelector('tbody');

function formatDate(iso) {
  const [, m, d] = iso.split('-');
  return `${d}.${m}.`;
}

function cellHtml(entry) {
  if (!entry) {
    return `<div class="cell-block"><div class="cell-half unset">—</div></div>`;
  }
  if (entry.mode === 'full') {
    const cls = entry.value === 'homeoffice' ? 'homeoffice' : 'ausserhalb';
    const label = entry.value === 'homeoffice' ? 'Homeoffice' : 'In Office';
    return `<div class="cell-block"><div class="cell-half ${cls}">${label}</div></div>`;
  }
  const amCls = entry.am ? entry.am : 'unset';
  const pmCls = entry.pm ? entry.pm : 'unset';
  const amLabel = entry.am ? 'VM' : '—';
  const pmLabel = entry.pm ? 'NM' : '—';
  return `<div class="cell-block"><div class="cell-half ${amCls}">${amLabel}</div><div class="cell-half ${pmCls}">${pmLabel}</div></div>`;
}

async function load() {
  let weekData;
  try {
    weekData = await Api.getWeek();
  } catch (err) {
    weekInfoEl.textContent = 'Fehler beim Laden: ' + err.message;
    return;
  }

  const first = weekData.dates[0];
  const last = weekData.dates[weekData.dates.length - 1];
  weekInfoEl.textContent = `Woche ${weekData.week.split('-W')[1]} (${formatDate(first)}–${formatDate(last)})`;

  thead.innerHTML =
    '<tr><th class="name-col">Name</th>' +
    weekData.dates.map((d, i) => `<th>${WEEKDAY_LABELS[i]}<br>${formatDate(d)}</th>`).join('') +
    '</tr>';

  tbody.innerHTML = weekData.members
    .map((member) => {
      const cells = weekData.dates
        .map((date) => {
          const entry = weekData.entries[date] && weekData.entries[date][member.id];
          return `<td>${cellHtml(entry)}</td>`;
        })
        .join('');
      return `<tr><td class="name-col">${member.name}</td>${cells}</tr>`;
    })
    .join('');

  if (weekData.members.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="hint">Keine Teammitglieder konfiguriert.</td></tr>';
  }
}

load();
setInterval(load, REFRESH_INTERVAL_MS);
