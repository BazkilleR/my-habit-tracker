# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Skills

For any frontend design work (styling, redesigns, new UI components, visual improvements), always invoke the `frontend-design` skill before writing any code.

## Running the app

No build step. Open `index.html` directly in a browser (`File > Open`, or use a local server):

```
npx serve .
# or
python -m http.server
```

## Architecture

A zero-dependency, vanilla JS/CSS/HTML single-page app. All state lives in `localStorage` under the key `"habits"`.

### Data model

Each habit stored in the array has this shape:

```js
{
  id:          string,          // crypto.randomUUID()
  name:        string,
  emoji:       string,          // auto-picked by keyword match or cycling DEFAULT_EMOJIS
  color:       string,          // CSS gradient string, cycled from HABIT_COLORS[]
  createdAt:   string,          // "YYYY-MM-DD" — used to scope calendar history
  completions: { [dateStr]: true }  // only truthy dates are stored; missing key = not done
}
```

**Important:** the old format had `completed: boolean` instead of `completions`. `loadHabits()` in `app.js` auto-migrates on load.

### Tab / view system

- Two tab panels: `#todayView` and `#calendarView`. Switching adds/removes the `.hidden` class.
- `activeTab` state string drives whether `renderCalendar()` is called after a toggle.

### Calendar dot logic (`getDotStatus`)

For any date string `"YYYY-MM-DD"`:
1. Filter habits whose `createdAt <= dateStr` (habit must have existed that day).
2. Count completions for that date.
3. All done → `'green'`, none done → `'red'`, partial → `'yellow'`, no habits existed → `null`.

Future dates (`dateStr > todayStr()`) are never passed to `getDotStatus`; their cells render with no dot.

### Emoji assignment

`pickEmoji(name)` does a substring match against `EMOJI_KEYWORDS` (50+ entries). Falls back to cycling `DEFAULT_EMOJIS[]` using `habits.length` as the index at the time of creation.

### Rendering pattern

- `renderAll()` rebuilds `#habitsList` from scratch each call — no virtual DOM or diffing.
- `renderCalendar()` rebuilds `#calGrid` from scratch each call.
- Individual `toggleHabit()` updates the specific `<li>` in-place (classList) rather than re-rendering the full list, then calls `updateBadge()`.

## CSS conventions

- Design tokens are CSS variables in `:root` (`--accent`, `--radius-lg`, `--shadow-card`, etc.).
- Habit card colors come from the `HABIT_COLORS` array in `app.js` and are applied as inline `style.background`.
- Status dots are `.dot.dot-green/yellow/red` — sized 7 px normally, 8 px with a white ring on the gradient today-cell.
- The `.hidden` utility class is `display: none` and is the only mechanism for hiding tab panels.
