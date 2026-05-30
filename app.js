'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────
const EMOJI_KEYWORDS = {
  run: '🏃', running: '🏃', jog: '🏃', sprint: '🏃',
  walk: '🚶', walking: '🚶', hike: '🥾', hiking: '🥾',
  gym: '🏋️', workout: '🏋️', exercise: '💪', lift: '🏋️', weight: '🏋️',
  yoga: '🧘', stretch: '🤸', pilates: '🤸',
  swim: '🏊', swimming: '🏊', bike: '🚴', cycling: '🚴', cycle: '🚴',
  dance: '💃', sport: '⚽',
  sleep: '😴', rest: '😴', nap: '😴', bed: '🛏️',
  water: '💧', drink: '💧', hydrat: '💧',
  eat: '🥗', meal: '🍽️', diet: '🥗', nutrition: '🥗', food: '🍎',
  vitamin: '💊', supplement: '💊', medic: '💊', pill: '💊',
  meditat: '🧘', mindful: '🧘', breathe: '🌬️', breathing: '🌬️',
  gratitude: '🙏', pray: '🙏', journal: '✍️',
  read: '📚', book: '📖', study: '📖', learn: '🎓', course: '🎓',
  write: '✍️', diary: '📔', note: '📝',
  code: '💻', program: '💻', develop: '💻', hack: '💻',
  clean: '🧹', tidy: '🧹', organiz: '🗂️', declutter: '🗂️',
  cook: '👨‍🍳', cooking: '👨‍🍳', bake: '🧁',
  music: '🎵', guitar: '🎸', piano: '🎹', sing: '🎤',
  draw: '🎨', paint: '🎨', art: '🎨', sketch: '✏️',
  garden: '🌱', plant: '🌿', nature: '🌿',
  call: '📞', friend: '👫', family: '👨‍👩‍👧', social: '👥',
  save: '💰', budget: '💵', finance: '💰', invest: '📈', money: '💰',
  plan: '📋', work: '💼', meeting: '📅', focus: '🎯', goal: '🎯',
  project: '📁', task: '✅',
};

const DEFAULT_EMOJIS = ['🌟', '✨', '🔥', '💫', '🚀', '🌈', '⚡', '🎯', '🦋', '🌺', '🎪', '🏆'];

const HABIT_COLORS = [
  'linear-gradient(145deg, #3d1500 0%, #b45309 100%)',  // Burnt Amber
  'linear-gradient(145deg, #011c0f 0%, #047857 100%)',  // Forest Emerald
  'linear-gradient(145deg, #05091f 0%, #1d4ed8 100%)',  // Deep Sapphire
  'linear-gradient(145deg, #160429 0%, #6d28d9 100%)',  // Night Violet
  'linear-gradient(145deg, #200000 0%, #b91c1c 100%)',  // Deep Crimson
  'linear-gradient(145deg, #001414 0%, #0f766e 100%)',  // Abyss Teal
  'linear-gradient(145deg, #1f0009 0%, #be123c 100%)',  // Dark Burgundy
  'linear-gradient(145deg, #040210 0%, #4338ca 100%)',  // Prussian Indigo
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── App state ────────────────────────────────────────────────────────────────
let habits    = [];
let activeTab = 'today';
let calYear   = new Date().getFullYear();
let calMonth  = new Date().getMonth();

// ─── Date helpers ─────────────────────────────────────────────────────────────
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Persistence & migration ──────────────────────────────────────────────────
function loadHabits() {
  const raw   = JSON.parse(localStorage.getItem('habits') ?? '[]');
  const today = todayStr();

  // Migrate old format: { completed: boolean } → { completions: {}, createdAt }
  return raw.map(h => {
    if (!h.completions) {
      const completions = {};
      if (h.completed) completions[today] = true;
      return { id: h.id, name: h.name, emoji: h.emoji, color: h.color,
               createdAt: today, completions };
    }
    return h.createdAt ? h : { ...h, createdAt: today };
  });
}

function save() {
  localStorage.setItem('habits', JSON.stringify(habits));
}

// ─── Utility helpers ──────────────────────────────────────────────────────────
function pickEmoji(name) {
  const lower = name.toLowerCase();
  for (const [kw, emoji] of Object.entries(EMOJI_KEYWORDS)) {
    if (lower.includes(kw)) return emoji;
  }
  return DEFAULT_EMOJIS[habits.length % DEFAULT_EMOJIS.length];
}

function pickColor() {
  return HABIT_COLORS[habits.length % HABIT_COLORS.length];
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Returns 'green' | 'yellow' | 'red' | null for a given date string.
// A habit only counts for a day if it was created on or before that day.
function getDotStatus(dateStr) {
  const active = habits.filter(h => h.createdAt <= dateStr);
  if (active.length === 0) return null;

  const done = active.filter(h => !!h.completions[dateStr]).length;
  if (done === active.length) return 'green';
  if (done === 0)             return 'red';
  return 'yellow';
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function updateBadge() {
  const today = todayStr();
  const total = habits.length;
  const done  = habits.filter(h => !!h.completions[today]).length;
  document.getElementById('habitsBadge').textContent =
    total === 0 ? '0 habits' : `${done} / ${total} done`;
}

// ─── Today view ───────────────────────────────────────────────────────────────
function renderHabitItem(habit) {
  const done = !!habit.completions[todayStr()];

  const li = document.createElement('li');
  li.className       = `habit-item${done ? ' completed' : ''}`;
  li.style.background = habit.color;
  li.dataset.id      = habit.id;

  li.innerHTML = `
    <input
      type="checkbox"
      class="habit-checkbox"
      ${done ? 'checked' : ''}
      aria-label="Mark '${escapeHtml(habit.name)}' as complete"
    />
    <span class="habit-emoji" aria-hidden="true">${habit.emoji}</span>
    <span class="habit-name">${escapeHtml(habit.name)}</span>
    <button class="delete-btn" aria-label="Delete '${escapeHtml(habit.name)}'">✕</button>
  `;

  li.querySelector('.habit-checkbox').addEventListener('change', () => toggleHabit(habit.id, li));
  li.querySelector('.delete-btn').addEventListener('click', e => {
    e.stopPropagation();
    removeHabit(habit.id, li);
  });

  return li;
}

function renderAll() {
  const list = document.getElementById('habitsList');
  list.innerHTML = '';

  if (habits.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.innerHTML  = '<span class="empty-icon">🌱</span><p>No habits yet — add one above!</p>';
    list.appendChild(li);
  } else {
    habits.forEach(h => list.appendChild(renderHabitItem(h)));
  }

  updateBadge();
}

// ─── Today actions ────────────────────────────────────────────────────────────
function addHabit() {
  const input = document.getElementById('habitInput');
  const name  = input.value.trim();

  if (!name) {
    input.focus();
    input.classList.remove('shake');
    void input.offsetWidth; // restart animation if triggered twice quickly
    input.classList.add('shake');
    input.addEventListener('animationend', () => input.classList.remove('shake'), { once: true });
    return;
  }

  habits.unshift({
    id:          crypto.randomUUID(),
    name,
    emoji:       pickEmoji(name),
    color:       pickColor(),
    createdAt:   todayStr(),
    completions: {},
  });

  save();
  input.value = '';
  input.focus();
  renderAll();
}

function toggleHabit(id, li) {
  const habit = habits.find(h => h.id === id);
  if (!habit) return;

  const today = todayStr();
  if (habit.completions[today]) {
    delete habit.completions[today];
  } else {
    habit.completions[today] = true;
  }

  save();
  li.classList.toggle('completed', !!habit.completions[today]);
  updateBadge();

  // Keep calendar in sync if it is currently visible
  if (activeTab === 'calendar') renderCalendar();
}

function removeHabit(id, li) {
  li.style.animation = 'slideOut 0.26s ease forwards';
  li.addEventListener('animationend', () => {
    habits = habits.filter(h => h.id !== id);
    save();
    renderAll();
  }, { once: true });
}

// ─── Calendar view ────────────────────────────────────────────────────────────
function renderCalendar() {
  const today = todayStr();

  document.getElementById('calMonthLabel').textContent =
    `${MONTH_NAMES[calMonth]} ${calYear}`;

  const grid        = document.getElementById('calGrid');
  grid.innerHTML    = '';

  const firstWeekday  = new Date(calYear, calMonth, 1).getDay();   // 0 = Sun
  const daysInMonth   = new Date(calYear, calMonth + 1, 0).getDate();

  // Empty leading cells
  for (let i = 0; i < firstWeekday; i++) {
    const blank = document.createElement('div');
    blank.className = 'cal-cell empty';
    grid.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr  = toDateStr(calYear, calMonth, day);
    const isToday  = dateStr === today;
    const isFuture = dateStr > today;

    const cell = document.createElement('div');
    cell.className = `cal-cell${isToday ? ' today' : ''}${isFuture ? ' future' : ''}`;

    const num = document.createElement('span');
    num.className   = 'cal-day-num';
    num.textContent = day;
    cell.appendChild(num);

    if (!isFuture) {
      const status = getDotStatus(dateStr);
      if (status) {
        const dot = document.createElement('span');
        dot.className = `dot dot-${status}`;
        cell.appendChild(dot);
      }
    }

    grid.appendChild(cell);
  }
}

// ─── Tab switching ────────────────────────────────────────────────────────────
function switchTab(tab) {
  activeTab = tab;

  document.querySelectorAll('.tab').forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  document.getElementById('todayView').classList.toggle('hidden', tab !== 'today');
  document.getElementById('calendarView').classList.toggle('hidden', tab !== 'calendar');

  if (tab === 'calendar') renderCalendar();
}

// ─── Event listeners ──────────────────────────────────────────────────────────
document.getElementById('addBtn').addEventListener('click', addHabit);

document.getElementById('habitInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addHabit();
});

document.querySelectorAll('.tab').forEach(btn =>
  btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

document.getElementById('prevMonth').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
habits = loadHabits();
save(); // persist any format migrations
renderAll();
