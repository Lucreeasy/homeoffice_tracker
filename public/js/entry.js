const WEEKDAY_LABELS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const STORAGE_KEY = 'homeoffice-tracker:memberId';

const memberSelect = document.getElementById('member-select');
const weekInfoEl = document.getElementById('week-info');
const dayListEl = document.getElementById('day-list');
const addMemberForm = document.getElementById('add-member-form');
const newMemberNameInput = document.getElementById('new-member-name');
const addMemberBtn = document.getElementById('add-member-btn');
const cancelMemberBtn = document.getElementById('cancel-member-btn');
const addMemberErrorEl = document.getElementById('add-member-error');

const ADD_NEW_OPTION_VALUE = '__add_new__';

let weekData = null; // last payload from GET/PUT /api/week
let splitState = {}; // date -> boolean, local UI-only override for "show halves"

function formatDate(iso) {
  const [, m, d] = iso.split('-');
  return `${d}.${m}.`;
}

function populateMemberOptions(members, selectedId) {
  memberSelect.querySelectorAll('option[data-member]').forEach((opt) => opt.remove());
  const addNewOption = memberSelect.querySelector(`option[value="${ADD_NEW_OPTION_VALUE}"]`);
  for (const member of members) {
    const opt = document.createElement('option');
    opt.value = member.id;
    opt.textContent = member.name;
    opt.dataset.member = '1';
    memberSelect.insertBefore(opt, addNewOption);
  }
  if (selectedId && members.some((m) => m.id === selectedId)) {
    memberSelect.value = selectedId;
  }
}

async function init() {
  let members;
  try {
    ({ members } = await Api.getTeam());
  } catch (err) {
    dayListEl.textContent = 'Team konnte nicht geladen werden: ' + err.message;
    return;
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  populateMemberOptions(members, saved);

  memberSelect.addEventListener('change', onMemberChange);
  addMemberBtn.addEventListener('click', onAddMember);
  cancelMemberBtn.addEventListener('click', onCancelAddMember);
  newMemberNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') onAddMember();
  });

  await loadWeek();
  render();
}

function onMemberChange() {
  if (memberSelect.value === ADD_NEW_OPTION_VALUE) {
    addMemberErrorEl.textContent = '';
    addMemberForm.hidden = false;
    newMemberNameInput.value = '';
    newMemberNameInput.focus();
    return;
  }

  addMemberForm.hidden = true;

  if (memberSelect.value) {
    localStorage.setItem(STORAGE_KEY, memberSelect.value);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  splitState = {};
  render();
}

function onCancelAddMember() {
  addMemberForm.hidden = true;
  const saved = localStorage.getItem(STORAGE_KEY);
  memberSelect.value = saved || '';
}

async function onAddMember() {
  const name = newMemberNameInput.value.trim();
  if (!name) {
    addMemberErrorEl.textContent = 'Bitte einen Namen eingeben';
    return;
  }
  try {
    const { member, members } = await Api.addMember(name);
    populateMemberOptions(members, member.id);
    addMemberForm.hidden = true;
    localStorage.setItem(STORAGE_KEY, member.id);
    splitState = {};
    render();
  } catch (err) {
    addMemberErrorEl.textContent = err.message;
  }
}

async function loadWeek() {
  weekData = await Api.getWeek();
  const first = weekData.dates[0];
  const last = weekData.dates[weekData.dates.length - 1];
  weekInfoEl.textContent = `Woche ${weekData.week.split('-W')[1]} (${formatDate(first)}–${formatDate(last)})`;
}

function getEntry(date, memberId) {
  return (weekData.entries[date] && weekData.entries[date][memberId]) || null;
}

function render() {
  dayListEl.innerHTML = '';
  const memberId = memberSelect.value;

  if (!memberId) {
    dayListEl.innerHTML = '<p class="hint">Bitte zuerst deinen Namen auswählen.</p>';
    return;
  }

  weekData.dates.forEach((date, i) => {
    const entry = getEntry(date, memberId);
    const isSplit = splitState[date] !== undefined ? splitState[date] : entry?.mode === 'half';
    dayListEl.appendChild(renderDayCard(memberId, date, WEEKDAY_LABELS[i], entry, isSplit));
  });
}

function renderDayCard(memberId, date, label, entry, isSplit) {
  const card = document.createElement('div');
  card.className = 'day-card';

  const header = document.createElement('div');
  header.className = 'day-card-header';
  header.innerHTML = `<div><span class="day-name">${label}</span><span class="day-date">${formatDate(date)}</span></div>`;

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'split-toggle';
  toggleBtn.textContent = isSplit ? 'Zusammenführen' : 'Aufteilen';
  toggleBtn.addEventListener('click', () => onToggleSplit(memberId, date, entry, isSplit));
  header.appendChild(toggleBtn);
  card.appendChild(header);

  const indicator = document.createElement('div');
  indicator.className = 'save-indicator';

  if (isSplit) {
    const halfRow = document.createElement('div');
    halfRow.className = 'half-row';
    halfRow.appendChild(renderHalfGroup(memberId, date, 'Vormittag', 'am', entry, indicator));
    halfRow.appendChild(renderHalfGroup(memberId, date, 'Nachmittag', 'pm', entry, indicator));
    card.appendChild(halfRow);
  } else {
    const isHomeofficeActive = entry?.mode === 'full' && entry.value === 'homeoffice';
    const isAusserhalbActive = entry?.mode === 'full' && entry.value === 'ausserhalb';
    const statusRow = document.createElement('div');
    statusRow.className = 'status-row';
    statusRow.appendChild(
      renderStatusBtn('Homeoffice', 'homeoffice', isHomeofficeActive, () =>
        onSetFull(memberId, date, 'homeoffice', isHomeofficeActive, indicator)
      )
    );
    statusRow.appendChild(
      renderStatusBtn('In Office', 'ausserhalb', isAusserhalbActive, () =>
        onSetFull(memberId, date, 'ausserhalb', isAusserhalbActive, indicator)
      )
    );
    card.appendChild(statusRow);
  }

  card.appendChild(indicator);
  return card;
}

function renderHalfGroup(memberId, date, label, half, entry, indicator) {
  const group = document.createElement('div');
  group.className = 'half-group';
  const value = entry?.mode === 'half' ? entry[half] : null;

  const labelEl = document.createElement('div');
  labelEl.className = 'half-label';
  labelEl.textContent = label;
  group.appendChild(labelEl);

  const row = document.createElement('div');
  row.className = 'status-row';
  row.appendChild(
    renderStatusBtn('Homeoffice', 'homeoffice', value === 'homeoffice', () =>
      onSetHalf(memberId, date, half, 'homeoffice', value === 'homeoffice', entry, indicator)
    )
  );
  row.appendChild(
    renderStatusBtn('In Office', 'ausserhalb', value === 'ausserhalb', () =>
      onSetHalf(memberId, date, half, 'ausserhalb', value === 'ausserhalb', entry, indicator)
    )
  );
  group.appendChild(row);
  return group;
}

function renderStatusBtn(text, kind, active, onClick) {
  const btn = document.createElement('button');
  btn.className = `status-btn ${kind}${active ? ' active' : ''}`;
  btn.textContent = text;
  btn.addEventListener('click', onClick);
  return btn;
}

async function onSetFull(memberId, date, value, isActive, indicator) {
  if (isActive) {
    await clearEntry(memberId, date, indicator);
  } else {
    await saveEntry(memberId, date, { mode: 'full', value }, indicator);
  }
}

async function onSetHalf(memberId, date, half, value, isActive, entry, indicator) {
  const newValue = isActive ? null : value;
  const am = half === 'am' ? newValue : entry?.mode === 'half' ? entry.am : null;
  const pm = half === 'pm' ? newValue : entry?.mode === 'half' ? entry.pm : null;
  await saveEntry(memberId, date, { mode: 'half', am, pm }, indicator);
}

async function onToggleSplit(memberId, date, entry, currentlySplit) {
  if (currentlySplit) {
    const newValue = entry?.mode === 'half' ? entry.am || entry.pm : null;
    splitState[date] = false;
    if (newValue) {
      await saveEntry(memberId, date, { mode: 'full', value: newValue });
    } else {
      await clearEntry(memberId, date);
    }
  } else {
    const prefill = entry?.mode === 'full' ? entry.value : null;
    splitState[date] = true;
    await saveEntry(memberId, date, { mode: 'half', am: prefill, pm: prefill });
  }
}

async function saveEntry(memberId, date, body, indicator) {
  try {
    weekData = await Api.setEntry(memberId, date, body);
    if (indicator) showSaved(indicator);
    render();
  } catch (err) {
    if (indicator) showError(indicator, err.message);
    else render();
  }
}

async function clearEntry(memberId, date, indicator) {
  try {
    weekData = await Api.clearEntry(memberId, date);
    if (indicator) showSaved(indicator);
    render();
  } catch (err) {
    if (indicator) showError(indicator, err.message);
    else render();
  }
}

function showSaved(indicator) {
  indicator.textContent = 'Gespeichert';
  indicator.classList.remove('error');
  setTimeout(() => {
    if (indicator.isConnected) indicator.textContent = '';
  }, 1500);
}

function showError(indicator, message) {
  indicator.textContent = 'Fehler: ' + message;
  indicator.classList.add('error');
}

init();
