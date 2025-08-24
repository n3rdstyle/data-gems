let profile = null;
let lastUsedTemplate = { kind: 'compact', selection: [] };

const PROFILE_STORAGE_KEY = 'profile_data';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'insert_compact', title: 'Insert compact profile', contexts: ['editable'] });
  chrome.contextMenus.create({ id: 'insert_full', title: 'Insert full profile', contexts: ['editable'] });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;
  if (info.menuItemId === 'insert_compact') {
    handleInsert(tab.id, { kind: 'compact' });
  } else if (info.menuItemId === 'insert_full') {
    handleInsert(tab.id, { kind: 'full' });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  if (command === 'insert-compact') return handleInsert(tab.id, { kind: 'compact' });
  if (command === 'insert-full') return handleInsert(tab.id, { kind: 'full' });
  if (command === 'insert-last') return handleInsert(tab.id, lastUsedTemplate ?? { kind: 'compact' });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') return;
      switch (msg.type) {
        case 'SAVE_PROFILE': {
          await persistProfile(profile = msg.profile);
          sendResponse({ ok: true });
          break;
        }
        case 'LOAD_PROFILE': {
          if (!profile) profile = await loadProfileFromStorage();
          sendResponse({ ok: true, profile });
          break;
        }
        case 'GENERATE_INSERTION': {
          if (!profile) profile = await loadProfileFromStorage();
          const text = generateInsertionText(msg.selection ?? { kind: 'compact' }, profile);
          sendResponse({ ok: true, text });
          break;
        }
        case 'EXPORT_ENCRYPTED': {
          const data = await chrome.storage.local.get(PROFILE_STORAGE_KEY);
          sendResponse({ ok: true, blob: data[PROFILE_STORAGE_KEY] ?? null });
          break;
        }
        case 'IMPORT_ENCRYPTED': {
          if (!msg.blob || typeof msg.blob !== 'object') throw new Error('Invalid blob');
          await chrome.storage.local.set({ [PROFILE_STORAGE_KEY]: msg.blob });
          profile = msg.blob; // Update in-memory copy
          sendResponse({ ok: true });
          break;
        }
        default:
          break;
      }
    } catch (err) {
      sendResponse({ ok: false, error: String(err?.message || err) });
    }
  })();
  return true; // async response
});

async function loadProfileFromStorage() {
  const { [PROFILE_STORAGE_KEY]: storedProfile } = await chrome.storage.local.get(PROFILE_STORAGE_KEY);
  return storedProfile || { version: '2', identity: {}, style: {}, constraints: {}, answers: [] };
}

async function persistProfile(profile) {
  await chrome.storage.local.set({ [PROFILE_STORAGE_KEY]: profile });
}

async function handleInsert(tabId, selection) {
  try {
    if (!profile) profile = await loadProfileFromStorage();
    lastUsedTemplate = selection;
    const text = generateInsertionText(selection, profile || {});
    await ensureContentScript(tabId);
    await chrome.tabs.sendMessage(tabId, { type: 'INSERT_TEXT', text });
  } catch (e) {
    console.warn('Insert failed', e);
  }
}

async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content.js']
    });
  } catch (_) {
    // ignore if already injected
  }
}

function generateInsertionText(selection, profile) {
  const { kind = 'compact', template, fields } = selection || {};
  const redFlags = detectRedFlags(profile);
  
  // Custom template with variable interpolation
  if (kind === 'custom' && template) {
    const interpolated = interpolateTemplate(template, profile);
    const redFlagNote = redFlags.length ? `\n[Privacy flags: ${redFlags.join(', ')}]` : '';
    return interpolated + redFlagNote;
  }

  // Selected fields template
  if (kind === 'selected' && fields && fields.length) {
    const selectedChunks = buildSelectedChunks(profile, fields);
    const text = selectedChunks.length 
      ? `Please consider these profile details: ${selectedChunks.join('; ')}.`
      : 'No profile data selected.';
    const redFlagNote = redFlags.length ? `\n[Privacy flags: ${redFlags.join(', ')}]` : '';
    return text + redFlagNote;
  }

  // Default templates
  const chunks = buildProfileChunks(profile);
  const redFlagNote = redFlags.length ? `\n[Privacy flags: ${redFlags.join(', ')}]` : '';

  if (kind === 'full') {
    return `Please consider my profile when responding:\n${chunks.join('\n')}\n` + redFlagNote;
  }
  
  // compact default
  const compact = chunks.join('; ');
  return `Consider this profile summary: ${compact}.` + redFlagNote;
}

function interpolateTemplate(template, profile) {
  const variables = {
    displayName: profile?.identity?.displayName || '',
    languages: Array.isArray(profile?.identity?.languages) ? profile.identity.languages.join(', ') : '',
    roles: Array.isArray(profile?.identity?.roles) ? profile.identity.roles.join(', ') : '',
    additionalPreferences: profile?.identity?.additionalPreferences || '',
    tone: profile?.preferences?.tone || '',
    formatting: profile?.preferences?.formatting || '',
    topics: Array.isArray(profile?.preferences?.topics) ? profile.preferences.topics.join(', ') : '',
    tools: Array.isArray(profile?.preferences?.tools) ? profile.preferences.tools.join(', ') : '',
    affinities: Array.isArray(profile?.affinities) ? profile.affinities.join(', ') : '',
    avoid: Array.isArray(profile?.constraints?.avoid) ? profile.constraints.avoid.join(', ') : '',
    privacyNotes: profile?.constraints?.privacyNotes || ''
  };

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

function buildSelectedChunks(profile, fields) {
  const parts = [];
  const fieldMap = {
    'identity.displayName': profile?.identity?.displayName,
    'identity.languages': Array.isArray(profile?.identity?.languages) ? profile.identity.languages.join(', ') : null,
    'identity.roles': Array.isArray(profile?.identity?.roles) ? profile.identity.roles.join(', ') : null,
    'identity.additionalPreferences': profile?.identity?.additionalPreferences,
    'preferences.tone': profile?.preferences?.tone,
    'preferences.formatting': profile?.preferences?.formatting,
    'preferences.topics': Array.isArray(profile?.preferences?.topics) ? profile.preferences.topics.join(', ') : null,
    'preferences.tools': Array.isArray(profile?.preferences?.tools) ? profile.preferences.tools.join(', ') : null,
    'affinities': Array.isArray(profile?.affinities) ? profile.affinities.join(', ') : null,
    'constraints.avoid': Array.isArray(profile?.constraints?.avoid) ? profile.constraints.avoid.join(', ') : null,
    'constraints.privacyNotes': profile?.constraints?.privacyNotes
  };

  for (const field of fields) {
    const value = fieldMap[field];
    if (value) {
      const label = field.split('.').pop();
      parts.push(`${label}: ${value}`);
    }
  }

  return parts;
}

function buildProfileChunks(profile) {
  const parts = [];
  
  // Identity information
  if (profile?.identity?.displayName) parts.push(`Name: ${profile.identity.displayName}`);
  if (Array.isArray(profile?.identity?.languages) && profile.identity.languages.length) {
    parts.push(`Languages: ${profile.identity.languages.join(', ')}`);
  }
  if (profile?.identity?.location) parts.push(`Location: ${profile.identity.location}`);
  if (profile?.identity?.additionalPreferences) parts.push(`Additional preferences: ${profile.identity.additionalPreferences}`);
  
  // Style preferences (v2) or legacy preferences (v1)
  const style = profile?.style ?? profile?.preferences ?? {};
  if (style.tone) parts.push(`Tone: ${style.tone}`);
  if (style.formatting) parts.push(`Formatting: ${style.formatting}`);
  if (Array.isArray(style.topics) && style.topics.length) {
    parts.push(`Topics: ${style.topics.join(', ')}`);
  }
  
  // Legacy tools support (from v1 preferences)
  if (Array.isArray(profile?.preferences?.tools) && profile.preferences.tools.length) {
    parts.push(`Tools: ${profile.preferences.tools.join(', ')}`);
  }
  
  // Constraints
  if (Array.isArray(profile?.constraints?.avoid) && profile.constraints.avoid.length) {
    parts.push(`Avoid: ${profile.constraints.avoid.join(', ')}`);
  }
  
  // Legacy affinities support (v1)
  if (Array.isArray(profile?.affinities) && profile.affinities.length) {
    parts.push(`Affinities: ${profile.affinities.join(', ')}`);
  }
  
  // New answers summary (v2)
  if (profile?.answers?.length) {
    const byId = Object.fromEntries(profile.answers.map(a => [a.id, a.value]));
    
    // Include specific interesting answers
    if (byId.favorite_food) parts.push(`Favorite food: ${byId.favorite_food}`);
    if (byId.clothing_style) parts.push(`Clothing style: ${byId.clothing_style}`);
    if (byId.favorite_music) parts.push(`Music: ${byId.favorite_music}`);
    if (byId.coffee_or_tea) parts.push(`Drinks: ${byId.coffee_or_tea}`);
    if (byId.favorite_color) parts.push(`Favorite color: ${byId.favorite_color}`);
    
    // Count boolean preferences
    const yesCount = profile.answers.filter(a => a.type === 'boolean' && a.value === true).length;
    const totalBooleans = profile.answers.filter(a => a.type === 'boolean').length;
    if (totalBooleans > 0) {
      parts.push(`Personal preferences: ${yesCount}/${totalBooleans} items liked`);
    }
  }
  
  return parts;
}

function detectRedFlags(profile) {
  const flags = [];
  const patterns = [
    {
      regex: /passport|social\s*security|ssn|sozialversicherungsnummer|ausweis|driver['\s]*license/i,
      label: 'ID documents'
    },
    {
      regex: /credit\s*card|debit\s*card|cvv|cvc|iban|routing\s*number|account\s*number|konto\s*n?ummer/i,
      label: 'Financial info'
    },
    {
      regex: /\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)|address|anschrift|straße|strasse/i,
      label: 'Address'
    },
    {
      regex: /\+?\d{1,4}[\s\-\.]?\(?\d{1,4}\)?[\s\-\.]?\d{1,4}[\s\-\.]?\d{1,9}|phone|telefon|handy|mobil/i,
      label: 'Phone number'
    },
    {
      regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
      label: 'Email address'
    },
    {
      regex: /\d{4}\s*\d{4}\s*\d{4}\s*\d{4}|\d{16}/,
      label: 'Card number'
    },
    {
      regex: /\d{3}-\d{2}-\d{4}|\d{9}/,
      label: 'SSN pattern'
    },
    {
      regex: /api[_\s]*key|secret|token|password|pwd/i,
      label: 'API credentials'
    },
    {
      regex: /\$\d+|\d+\s*(usd|eur|gbp|dollars?|euros?)/i,
      label: 'Financial amounts'
    }
  ];

  const flat = JSON.stringify(profile || {});
  for (const pattern of patterns) {
    if (pattern.regex.test(flat)) {
      flags.push(pattern.label);
    }
  }
  
  return [...new Set(flags)].slice(0, 5); // Remove duplicates and limit
}

