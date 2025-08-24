## Product Requirements Document (PRD)

### Title
Prompt Profile Injector – A Privacy-Preserving Chromium Extension

### Overview
A lightweight Chromium extension that lets users define and maintain a personal data profile (preferences, affinities, constraints) and inject selected parts of that profile into prompts inside AI web UIs (e.g., ChatGPT, Claude, Gemini, Perplexity, Poe). All data is stored locally and encrypted; only user-approved snippets are ever inserted into pages.

### Decisions (v1)
- Import/Export (encrypted file): Included in v1.
- "Red flags" checker for sensitive fields: Included in v1 and enabled by default.

### Problem Statement
Users repeatedly retype their preferences and style constraints into AI prompts. Existing solutions don’t offer a secure, local, granular, and reusable way to inject a controlled "profile" into any AI site while ensuring that sites cannot access the full profile.

### Goals
- Provide a secure local profile store with encryption at rest.
- Allow users to curate structured preferences/affinities and compose reusable prompt snippets.
- Inject selected, minimal profile segments into AI text inputs on supported sites with one click or keyboard shortcut.
- Ensure no website can access the profile except for text explicitly inserted by the user.

### Non-Goals
- Cloud sync or account system (v1).
- Automatic injection without explicit user action.
- Server-side services or telemetry.
- Cross-browser sync in v1.

### Target Users
- Power users of web-based AI tools who want consistent, personalized prompts.
- Privacy-conscious users who want local-only storage and explicit control.

### Key Use Cases / User Stories
- As a user, I can set a passphrase and create a structured profile (topics, tone, formatting preferences, constraints, affinities).
- As a user, I can choose a template (short/compact, full, custom) and select which profile sections to insert.
- As a user, I can inject the selected profile into the current AI input via popup, context menu, or keyboard shortcut.
- As a user, I can preview the exact text before inserting it.
- As a user, I can import/export my encrypted profile file for backup/transfer.
- As a user, I see "red flags" warnings if my profile contains potentially sensitive data.
- As a user, I can quickly lock/unlock the profile (passphrase required after lock/timeout).

### Success Metrics
- Time-to-first-insert < 2 minutes post-install.
- ≥ 80% users use a keyboard shortcut or context menu after onboarding.
- Zero plaintext profile data found in storage on audit.
- No background exceptions during typical use (error rate < 0.1% of actions).

### Scope (v1)
- Manifest V3 Chromium extension.
- Encrypted local storage with passphrase.
- Minimal UI: Options (onboarding + editor), Popup (selection + preview + insert), optional Side Panel.
- Site adapters: ChatGPT, Claude, Gemini, Perplexity, Poe. Fallback to active input element.
- Keyboard shortcuts and context menu entries.
- Import/Export as encrypted file (in-scope for v1).
- Red-Flags checker enabled by default.
- No cloud, no telemetry.

### Functional Requirements
- Profile Management
  - Create, update, delete a structured profile.
  - Schema validation with versioning.
  - Manage reusable prompt snippets.
  - Import/Export as an encrypted file (JSON blob, readable only with passphrase).
- Security & Encryption
  - Encrypt at rest using AES-GCM 256.
  - Derive key from user passphrase via PBKDF2 (≥ 200k iterations), random salt stored.
  - Store only ciphertext, IV, and salt in `chrome.storage.local`.
  - Decrypt only in the background service worker; never in content scripts.
  - Auto-lock after configurable inactivity.
- Red Flags Checker
  - Heuristic detection of potentially sensitive fields (e.g., IDs, payment data, addresses, phone, email) in the profile.
  - Display a non-blocking warning in the popup preview; do not append warnings to the actual inserted text.
  - Provide a brief explainer and a link to review profile fields.
- Injection
  - Detect AI site input fields using site-specific selectors; fallback to `document.activeElement`.
  - Provide templates (compact, full, custom subset with simple variable interpolation like `{{tone}}`, `{{topics}}`).
  - Insert via popup button, context menu, or keyboard shortcut.
  - Show preview before insert.
- Permissions
  - Minimal: `storage`, `scripting`, `tabs`, `activeTab`, `contextMenus`, `commands`.
  - `optional_host_permissions` for specific AI domains; request on first use.
- Messaging
  - Use `chrome.runtime.sendMessage` with strict type/whitelisting.
  - Validate `sender.id` and message schema; deny by default.
- Localization
  - English (primary) and German (secondary) UI scaffolding.
- Accessibility
  - Keyboard navigable; sufficient contrast; ARIA roles/labels.

### Non-Functional Requirements
- Privacy-first: no network calls except Chromium extension update channel.
- Performance: popup open → render in < 150ms; insertion < 50ms after click.
- Resilience: background service worker handles sleep/wakeup; no data loss.
- Compatibility: Latest Chrome and Edge stable, Manifest V3.

### Data Model
Versioned JSON schema:
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "UserProfile",
  "type": "object",
  "properties": {
    "version": { "type": "string" },
    "identity": {
      "type": "object",
      "properties": {
        "displayName": { "type": "string" },
        "languages": { "type": "array", "items": { "type": "string" } },
        "roles": { "type": "array", "items": { "type": "string" } }
      }
    },
    "preferences": {
      "type": "object",
      "properties": {
        "topics": { "type": "array", "items": { "type": "string" } },
        "tone": { "type": "string" },
        "formatting": { "type": "string" },
        "tools": { "type": "array", "items": { "type": "string" } }
      }
    },
    "affinities": { "type": "array", "items": { "type": "string" } },
    "constraints": {
      "type": "object",
      "properties": {
        "avoid": { "type": "array", "items": { "type": "string" } },
        "privacyNotes": { "type": "string" }
      }
    },
    "snippets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": { "name": { "type": "string" }, "text": { "type": "string" } },
        "required": ["name", "text"]
      }
    }
  },
  "required": ["version", "preferences"]
}
```

Storage layout:
- `storage.local.profile`: ciphertext blob `{ version, salt, iv, ciphertext }`.
- No plaintext fields in any `storage.*`.

### Architecture
- `manifest.json` (MV3)
- Background service worker: `src/background.js`
  - Holds decrypted profile in memory during an unlocked session.
  - Key derivation with PBKDF2; encrypt/decrypt with WebCrypto AES-GCM.
  - Handles messages: load/save profile, lock/unlock, generate insertion text, initiate content script injection, import/export encrypted blob.
  - Maintains last-used template selection and auto-lock timer.
- Content script: `src/content.js`
  - Receives an insertion payload (plain text only) and inserts into the focused input on supported pages.
  - Site adapters: per-domain selectors and event triggers; fallback to `document.activeElement`.
- Popup UI: `src/popup.html`, `src/popup.js`
  - Select subset/template; preview; insert; lock/unlock quick action; surface red-flags warnings.
- Options UI: `src/options.html`, `src/options.js`
  - Onboarding, passphrase, profile editor with schema validation, import/export encrypted.
- Optional side panel: `src/sidepanel.html`, `src/sidepanel.js` (future)
- Crypto helpers: `src/crypto.js`

### Example Manifest (excerpt)
```json
{
  "manifest_version": 3,
  "name": "Prompt Profile Injector",
  "version": "0.1.0",
  "action": { "default_popup": "src/popup.html" },
  "background": { "service_worker": "src/background.js", "type": "module" },
  "options_page": "src/options.html",
  "permissions": ["storage", "scripting", "tabs", "activeTab", "contextMenus", "commands"],
  "optional_host_permissions": [
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://www.perplexity.ai/*",
    "https://poe.com/*"
  ]
}
```

### Messaging Contracts
- Request from popup to background:
```json
{ "type": "GENERATE_INSERTION", "selection": { "include": ["preferences.topics", "constraints"], "template": "compact" } }
```
- Response:
```json
{ "type": "GENERATE_INSERTION_RESULT", "text": "Please consider my profile: ..." }
```
- Command from background to content script:
```json
{ "type": "INSERT_TEXT", "text": "Please consider my profile: ..." }
```
- Lock/unlock:
```json
{ "type": "UNLOCK", "passphrase": "•••••" }
```

### Site Adapters
- Domains: ChatGPT, Claude, Gemini, Perplexity, Poe.
- Each adapter defines:
  - Input selector(s)
  - Insertion method (value set + `input` event, or simulated typing if needed)
  - Submit behavior (off by default; user submits)
- Fallback: `document.activeElement` if it is an editable input/textarea/contentEditable.

### Templates
- Compact: ≤ 600 chars summary from selected fields.
- Full: Structured but concise enumeration of selected fields.
- Custom: Arbitrary user-defined snippet with variable interpolation (e.g., `{{tone}}`, `{{topics}}`).

### Keyboard Shortcuts (default)
- Cmd/Ctrl+Shift+1: Insert compact selection.
- Cmd/Ctrl+Shift+2: Insert full selection.
- Cmd/Ctrl+Shift+3: Re-insert last used selection/template.

### Error States
- Wrong passphrase: show error, throttle retries.
- Locked state: insertion disabled; prompt to unlock.
- No compatible input found: show guidance toast.
- Storage quota exceeded: prompt to slim profile or remove large snippets.
- Import validation failed: show descriptive error.

### Security & Privacy
- All profile data encrypted at rest (AES-GCM 256).
- Key derived from passphrase (PBKDF2; ≥ 200k iterations; per-user salt).
- Decrypt only in background; content script never sees the key or full profile.
- Only user-initiated insertion adds plaintext to page inputs.
- No analytics/telemetry in v1; optional crashless error logging off by default.

### Accessibility
- Keyboard-only operation.
- ARIA roles/labels for popup/options.
- High-contrast theme support.

### Testing & QA
- Unit tests: crypto helpers, schema validation, templating, red-flags.
- Integration tests: message contracts, lock/unlock lifecycle, background sleep/wakeup.
- E2E tests: Puppeteer with extension loaded; per-site adapter insertion success.
- Security checks: verify no plaintext in `storage.*`; verify message validation; CSP checks.

### Milestones
- M1: MV3 skeleton with popup/options, encrypted storage, lock/unlock, import/export, red-flags surface in UI.
- M2: Templating + selection + preview; keyboard shortcuts; context menu.
- M3: Site adapters (ChatGPT, Claude, Gemini) + fallback; E2E coverage.
- M4: Polish, accessibility, i18n (en/de), docs, store packaging.

### Acceptance Criteria
- Profile stored only as ciphertext in `chrome.storage.local`.
- Successful insertion on three target sites and via fallback.
- Preview always shown before insertion; red-flags warnings visible in popup (not appended to insertion text).
- Locked state enforced; auto-lock after inactivity.
- Keyboard shortcuts and context menu operational.
- Import and export (encrypted) succeed with valid data; invalid imports are rejected with clear errors.
- No console errors in background/content during typical flows.

### Risks & Mitigations
- Selector changes on target sites → adapter registry + fallback path; easy updates.
- User forgets passphrase → no recovery by design; clear warning and reset flow.
- Service worker lifecycle → rehydrate state on demand; prompt unlock as needed.
- Heuristic red-flags → may create false positives; allow dismissing from popup.

### Open Questions
- Should we add per-field sensitivity labels to suppress/force warnings?
- Do we need an optional side panel in v1 or defer to v1.1?
