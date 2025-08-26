# Claude Code Task: Update the Options Data Profile Configurator

## Goal
Update the profile schema and Options UI:
- Identity: keep Display Name, keep Languages, add Location.
- Preferences → rename to Style; keep Tone, Formatting, Topics.
- Affinities → replace with 50 simple questions (boolean/text) that capture a basic sense of the user.

## Scope
- Backward compatible: support old profiles (with `preferences`, `affinities`) and new profiles (`style`, `answers`).
- Structured form UI replaces the raw JSON as primary editor, but keep JSON textarea as an advanced view.

## Files to change
- `src/options.html`
- `src/options.js`
- `src/background.js`
- New: `src/questions.js`
- Optional docs: `PRD.md`, `README.md`

## Data model changes
- Add `identity.location: string`
- Rename `preferences` → `style` (object): `{ tone: string, formatting: string, topics: string[] }`
- Remove `affinities` array.
- Add `answers: Array<{ id: string, type: 'boolean' | 'text', value: boolean | string }>`

Backward compatibility on read:
- If `style` missing but `preferences` exists → use `style = preferences`.
- Ignore legacy `affinities` (do not display, do not delete automatically).

Versioning on write:
- Save with `version: "2"` (or retain higher if already present).

## Questions (50) — `src/questions.js`
Create a new file exporting these questions:

```javascript
export const QUESTIONS = [
  { id: "favorite_food", type: "text", text: "What is my favorite food?" },
  { id: "clothing_style", type: "text", text: "What style of clothes do I wear?" },
  { id: "like_spicy_food", type: "boolean", text: "Do I like spicy food?" },
  { id: "enjoy_puzzles", type: "boolean", text: "Do I enjoy puzzles?" },
  { id: "prefer_mornings", type: "boolean", text: "Am I a morning person?" },
  { id: "coffee_or_tea", type: "text", text: "Do I prefer coffee or tea?" },
  { id: "like_travel", type: "boolean", text: "Do I like to travel?" },
  { id: "prefer_beach", type: "boolean", text: "Do I like the beach?" },
  { id: "prefer_mountains", type: "boolean", text: "Do I like the mountains?" },
  { id: "like_cooking", type: "boolean", text: "Do I like to cook?" },
  { id: "like_reading", type: "boolean", text: "Do I like reading?" },
  { id: "favorite_music", type: "text", text: "What is my favorite music genre?" },
  { id: "like_podcasts", type: "boolean", text: "Do I like podcasts?" },
  { id: "like_movies", type: "boolean", text: "Do I like movies?" },
  { id: "favorite_movie_genre", type: "text", text: "What is my favorite movie genre?" },
  { id: "like_sports", type: "boolean", text: "Do I like sports?" },
  { id: "favorite_sport", type: "text", text: "What is my favorite sport?" },
  { id: "like_gaming", type: "boolean", text: "Do I like gaming?" },
  { id: "prefer_outdoors", type: "boolean", text: "Do I prefer the outdoors?" },
  { id: "like_animals", type: "boolean", text: "Do I like animals?" },
  { id: "have_pets", type: "boolean", text: "Do I have pets?" },
  { id: "like_art", type: "boolean", text: "Do I like art?" },
  { id: "favorite_color", type: "text", text: "What is my favorite color?" },
  { id: "like_learning", type: "boolean", text: "Do I like learning new things?" },
  { id: "enjoy_diy", type: "boolean", text: "Do I enjoy DIY projects?" },
  { id: "prefer_minimalism", type: "boolean", text: "Do I prefer minimalism?" },
  { id: "like_plants", type: "boolean", text: "Do I like plants?" },
  { id: "like_museums", type: "boolean", text: "Do I like museums?" },
  { id: "like_theater", type: "boolean", text: "Do I like theater?" },
  { id: "like_dancing", type: "boolean", text: "Do I like dancing?" },
  { id: "prefer_text_over_video", type: "boolean", text: "Do I prefer text over video?" },
  { id: "like_writing", type: "boolean", text: "Do I like writing?" },
  { id: "like_photography", type: "boolean", text: "Do I like photography?" },
  { id: "like_cycling", type: "boolean", text: "Do I like cycling?" },
  { id: "like_running", type: "boolean", text: "Do I like running?" },
  { id: "like_swimming", type: "boolean", text: "Do I like swimming?" },
  { id: "like_board_games", type: "boolean", text: "Do I like board games?" },
  { id: "like_coding", type: "boolean", text: "Do I like coding?" },
  { id: "like_history", type: "boolean", text: "Do I like history?" },
  { id: "like_science", type: "boolean", text: "Do I like science?" },
  { id: "like_technology", type: "boolean", text: "Do I like technology?" },
  { id: "like_fashion", type: "boolean", text: "Do I like fashion?" },
  { id: "like_trendy", type: "boolean", text: "Do I like trendy things?" },
  { id: "prefer_quiet", type: "boolean", text: "Do I prefer quiet places?" },
  { id: "like_large_groups", type: "boolean", text: "Do I like large groups?" },
  { id: "like_volunteering", type: "boolean", text: "Do I like volunteering?" },
  { id: "like_gardening", type: "boolean", text: "Do I like gardening?" },
  { id: "prefer_home", type: "boolean", text: "Do I prefer staying at home?" },
  { id: "like_city_life", type: "boolean", text: "Do I like city life?" },
  { id: "like_country_life", type: "boolean", text: "Do I like country life?" }
];
```

## Options UI changes
- Primary structured form (keep Unlock/Lock and Auto-lock controls):
  - Identity: Display Name (text), Languages (comma-separated), Location (text)
  - Style: Tone (text), Formatting (text), Topics (comma-separated)
  - About Me: render 50 questions with appropriate inputs (switch/checkbox for boolean, input for text)
- Keep JSON textarea as a collapsible “Advanced JSON” section.

## `options.js` changes
- Import questions: `import { QUESTIONS } from './questions.js';`
- Render helpers:
  - `renderIdentitySection(profile)`
  - `renderStyleSection(profile)`
  - `renderQuestionsSection(answers)`
- Load flow:
  - `LOAD_PROFILE` → map legacy: `const style = profile.style ?? profile.preferences ?? {};`
  - Initialize `answers` from `QUESTIONS` if missing.
- Save flow:
  - Build `profileToSave`:

```javascript
const profileToSave = {
  version: profile.version || '2',
  identity: { displayName, languages, location },
  style: { tone, formatting, topics },
  answers // aligned with QUESTIONS (id/type/value)
};
```

- Call `SAVE_PROFILE` and show success/error.
- Import/Export logic remains unchanged.

## `background.js` changes
- Update `buildProfileChunks`:
  - Prefer `profile.style` over `profile.preferences` (fallback for old data).
  - Include `identity.location` if present.
  - Optionally summarize answers minimally (non-sensitive):

```javascript
if (profile?.answers?.length) {
  const byId = Object.fromEntries(profile.answers.map(a => [a.id, a.value]));
  if (byId.favorite_food) parts.push(`Favorite food: ${byId.favorite_food}`);
  if (byId.clothing_style) parts.push(`Clothing: ${byId.clothing_style}`);
  const yesCount = profile.answers.filter(a => a.type === 'boolean' && a.value === true).length;
  parts.push(`General likes: ${yesCount} items`);
}
```

- Keep red-flags logic as-is.

## Migration & compatibility
- Do not modify or delete legacy fields automatically.
- On load, map `preferences` → `style` if needed; ignore `affinities` in UI.
- When saving, write only the new fields (`identity`, `style`, `answers`, `version`).

## Acceptance criteria
- Options shows Identity (Display Name, Languages, Location), Style (Tone, Formatting, Topics), and 50 questions.
- Saving persists the new fields and version `"2"`.
- Background preview uses `style`/`preferences` and may include a minimal answers summary.
- JSON textarea remains available as advanced view.
- No console errors.

## How to run
- Implement changes, reload the extension (chrome://extensions → Reload), unlock in Options, fill new fields, test preview and insertion on a target AI page.


