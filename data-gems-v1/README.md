# Prompt Profile Injector

A privacy-preserving Chromium extension that lets users define and maintain a personal data profile (preferences, affinities, constraints) and inject selected parts into AI web UIs like ChatGPT, Claude, Gemini, Perplexity, and Poe.

## Key Features

✅ **Privacy-First**: All data encrypted locally with AES-GCM, never sent to servers  
✅ **Site Support**: Works with ChatGPT, Claude, Gemini, Perplexity, Poe + fallback for other sites  
✅ **Flexible Templates**: Compact, full, selected fields, or custom templates with variable interpolation  
✅ **Security**: Auto-lock, passphrase protection, red flags detection for sensitive data  
✅ **Easy Import/Export**: Encrypted backup files for data portability  

## Installation

1. Clone or download this repository
2. Open Chrome/Edge and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. Grant permissions for the AI sites you use

## Quick Start

1. **Setup**: Click the extension icon → "Options" → set a passphrase
2. **Create Profile**: Use the form editor or JSON editor to define your preferences
3. **Use**: On any AI site, click extension → select template → preview → insert

## Profile Structure

```json
{
  "version": "1",
  "identity": {
    "displayName": "Your name",
    "languages": ["English", "German"],
    "roles": ["Developer", "Designer"]
  },
  "preferences": {
    "tone": "professional",
    "formatting": "bullet-points", 
    "topics": ["Technology", "AI", "Privacy"],
    "tools": ["JavaScript", "Python"]
  },
  "affinities": ["Open source", "Sustainability"],
  "constraints": {
    "avoid": ["Jargon", "Assumptions"],
    "privacyNotes": "Don't mention personal details"
  }
}
```

## Template Types

- **Compact**: Brief summary (≤600 chars)
- **Full**: Structured enumeration of all fields  
- **Selected Fields**: Choose specific profile sections
- **Custom**: Templates with variables like `{{tone}}`, `{{topics}}`

## Keyboard Shortcuts

- `Ctrl+Shift+1` (Mac: `Cmd+Shift+1`): Insert compact profile
- `Ctrl+Shift+2` (Mac: `Cmd+Shift+2`): Insert full profile  
- `Ctrl+Shift+3` (Mac: `Cmd+Shift+3`): Insert last used template

## Security Features

- **Encryption**: AES-GCM 256-bit with PBKDF2 key derivation (≥200k iterations)
- **Auto-lock**: Configurable timeout (default: 10 minutes)
- **Red Flags**: Warns about potentially sensitive data in profiles
- **Local Only**: No cloud sync, no telemetry, no network requests

## Supported Sites

- **ChatGPT** (chat.openai.com)
- **Claude** (claude.ai) 
- **Gemini** (gemini.google.com)
- **Perplexity** (www.perplexity.ai)
- **Poe** (poe.com)
- **Fallback**: Any site with textarea or contentEditable inputs

## Development

### Architecture

- `manifest.json`: MV3 extension configuration
- `src/background.js`: Service worker handling encryption, profiles, messaging
- `src/content.js`: Site-specific injection with smart selectors
- `src/popup.{html,js}`: Extension popup for template selection
- `src/options.{html,js}`: Settings page with form/JSON editors
- `src/crypto.js`: WebCrypto helpers for PBKDF2 + AES-GCM
- `src/schema.js`: Profile validation and cleaning

### Security Design

1. **Encryption at Rest**: All profile data encrypted in `chrome.storage.local`
2. **Memory Protection**: Decrypted data only in background service worker
3. **Minimal Exposure**: Content scripts never see full profile or encryption keys
4. **User Control**: Explicit user action required for all insertions

## Privacy & Data

- ✅ All data stored locally and encrypted
- ✅ No analytics, telemetry, or external requests  
- ✅ Only user-approved text inserted into web pages
- ✅ Red flags detection for sensitive information
- ❌ No cloud sync or account system
- ❌ No automatic injection without user consent

## Troubleshooting

**Extension not working on a site?**
- Check if you've granted host permissions in `chrome://extensions`
- Try using a different template type
- The extension may not recognize the site's input fields (uses fallback)

**Forgot passphrase?**
- Data cannot be recovered without the passphrase
- Export an encrypted backup regularly
- Reset by removing extension data (all profiles lost)

**Red flags warnings?**
- Review your profile for potentially sensitive information
- These are heuristic warnings, may have false positives
- Remove or modify flagged content if concerned

## Contributing

1. Fork the repository
2. Make your changes
3. Test with multiple AI sites
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Roadmap

- [ ] Side panel support
- [ ] More template variables  
- [ ] Snippet management UI
- [ ] Additional site adapters
- [ ] Improved accessibility
- [ ] Localization (German)
