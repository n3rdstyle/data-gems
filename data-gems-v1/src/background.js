let profile = null;
let subprofiles = [];
let activeSubprofileId = null;

const PROFILE_STORAGE_KEY = 'profile_data';
const SUBPROFILES_STORAGE_KEY = 'subprofiles_data';
const ACTIVE_SUBPROFILE_KEY = 'active_subprofile_id';

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
          if (!subprofiles.length) subprofiles = await loadSubprofilesFromStorage();
          if (!activeSubprofileId) activeSubprofileId = await loadActiveSubprofileId();
          
          // Load personal description and add it to profile
          const personalDescriptionData = await chrome.storage.local.get(['personalDescription']);
          const enrichedProfile = {
            ...profile,
            personalDescription: personalDescriptionData.personalDescription || null
          };
          
          const effectiveProfile = activeSubprofileId 
            ? await generateSubprofileData(enrichedProfile, activeSubprofileId, subprofiles)
            : enrichedProfile;
          const text = generateInsertionText(msg.selection ?? { kind: 'compact' }, effectiveProfile);
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
          // Store the encrypted blob for future decryption
          await chrome.storage.local.set({ [PROFILE_STORAGE_KEY]: msg.blob });
          // Don't update the in-memory profile with encrypted data
          // Profile will be loaded and decrypted when needed
          profile = null; // Clear cache to force reload
          sendResponse({ ok: true });
          break;
        }
        
        // Subprofile management
        case 'LOAD_SUBPROFILES': {
          if (!subprofiles.length) subprofiles = await loadSubprofilesFromStorage();
          sendResponse({ ok: true, subprofiles });
          break;
        }
        case 'SAVE_SUBPROFILE': {
          const { subprofile } = msg;
          if (!subprofile || !subprofile.id) throw new Error('Invalid subprofile');
          
          const existingIndex = subprofiles.findIndex(s => s.id === subprofile.id);
          if (existingIndex >= 0) {
            subprofiles[existingIndex] = subprofile;
          } else {
            subprofiles.push(subprofile);
          }
          
          await persistSubprofiles(subprofiles);
          sendResponse({ ok: true });
          break;
        }
        case 'DELETE_SUBPROFILE': {
          const { subprofileId } = msg;
          if (!subprofileId) throw new Error('Invalid subprofile ID');
          
          subprofiles = subprofiles.filter(s => s.id !== subprofileId);
          await persistSubprofiles(subprofiles);
          
          // Clear active subprofile if it was deleted
          if (activeSubprofileId === subprofileId) {
            activeSubprofileId = null;
            await persistActiveSubprofileId(null);
          }
          
          sendResponse({ ok: true });
          break;
        }
        case 'SET_ACTIVE_SUBPROFILE': {
          const { subprofileId } = msg;
          activeSubprofileId = subprofileId;
          await persistActiveSubprofileId(subprofileId);
          sendResponse({ ok: true });
          break;
        }
        case 'GET_ACTIVE_SUBPROFILE': {
          if (!activeSubprofileId) activeSubprofileId = await loadActiveSubprofileId();
          if (!subprofiles.length) subprofiles = await loadSubprofilesFromStorage();
          
          const activeSubprofile = activeSubprofileId 
            ? subprofiles.find(s => s.id === activeSubprofileId) 
            : null;
          sendResponse({ ok: true, activeSubprofileId, activeSubprofile });
          break;
        }
        case 'GENERATE_SUBPROFILE_DATA': {
          const { subprofileId } = msg;
          if (!subprofileId) throw new Error('Invalid subprofile ID');
          
          if (!profile) profile = await loadProfileFromStorage();
          if (!subprofiles.length) subprofiles = await loadSubprofilesFromStorage();
          
          const filteredData = await generateSubprofileData(profile, subprofileId, subprofiles);
          
          sendResponse({ 
            ok: true, 
            data: filteredData 
          });
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

async function loadSubprofilesFromStorage() {
  const { [SUBPROFILES_STORAGE_KEY]: storedSubprofiles } = await chrome.storage.local.get(SUBPROFILES_STORAGE_KEY);
  return storedSubprofiles || [];
}

async function persistSubprofiles(subprofiles) {
  await chrome.storage.local.set({ [SUBPROFILES_STORAGE_KEY]: subprofiles });
}

async function loadActiveSubprofileId() {
  const { [ACTIVE_SUBPROFILE_KEY]: activeId } = await chrome.storage.local.get(ACTIVE_SUBPROFILE_KEY);
  return activeId || null;
}

async function persistActiveSubprofileId(subprofileId) {
  await chrome.storage.local.set({ [ACTIVE_SUBPROFILE_KEY]: subprofileId });
}

async function generateSubprofileData(fullProfile, subprofileId, subprofiles) {
  const subprofile = subprofiles.find(s => s.id === subprofileId);
  if (!subprofile || !fullProfile) return fullProfile;
  
  const { includedFields } = subprofile;
  const filteredProfile = { version: fullProfile.version };
  
  // Always include personal description in subprofiles (core user information)
  if (fullProfile.personalDescription) {
    filteredProfile.personalDescription = fullProfile.personalDescription;
  }
  
  // Filter identity fields
  if (includedFields.identity) {
    filteredProfile.identity = {};
    if (includedFields.identity.displayName && fullProfile.identity?.displayName) {
      filteredProfile.identity.displayName = fullProfile.identity.displayName;
    }
    if (includedFields.identity.languages && fullProfile.identity?.languages) {
      filteredProfile.identity.languages = fullProfile.identity.languages;
    }
    if (includedFields.identity.location && fullProfile.identity?.location) {
      filteredProfile.identity.location = fullProfile.identity.location;
    }
  }
  
  // Filter style fields
  if (includedFields.style) {
    filteredProfile.style = {};
    if (includedFields.style.tone && fullProfile.style?.tone) {
      filteredProfile.style.tone = fullProfile.style.tone;
    }
    if (includedFields.style.formatting && fullProfile.style?.formatting) {
      filteredProfile.style.formatting = fullProfile.style.formatting;
    }
    if (includedFields.style.topics && includedFields.style.topics.length > 0 && fullProfile.style?.topics) {
      filteredProfile.style.topics = fullProfile.style.topics.filter(topic => 
        includedFields.style.topics.includes(topic)
      );
    }
  }
  
  // Filter answers by ID
  if (includedFields.answers && includedFields.answers.length > 0 && fullProfile.answers) {
    filteredProfile.answers = fullProfile.answers.filter(answer => 
      includedFields.answers.includes(answer.id)
    );
  }
  
  // Filter affinities
  if (includedFields.affinities && includedFields.affinities.length > 0 && fullProfile.affinities) {
    filteredProfile.affinities = fullProfile.affinities.filter(affinity => 
      includedFields.affinities.includes(affinity)
    );
  }
  
  // Filter constraints
  if (includedFields.constraints) {
    filteredProfile.constraints = {};
    if (includedFields.constraints.privacyNotes && fullProfile.constraints?.privacyNotes) {
      filteredProfile.constraints.privacyNotes = fullProfile.constraints.privacyNotes;
    }
    if (includedFields.constraints.avoid && includedFields.constraints.avoid.length > 0 && fullProfile.constraints?.avoid) {
      filteredProfile.constraints.avoid = fullProfile.constraints.avoid.filter(item => 
        includedFields.constraints.avoid.includes(item)
      );
    }
  }
  
  // Filter snippets
  if (includedFields.snippets && includedFields.snippets.length > 0 && fullProfile.snippets) {
    filteredProfile.snippets = fullProfile.snippets.filter(snippet => 
      includedFields.snippets.includes(snippet.name)
    );
  }
  
  // Handle context items (popup data) - add them as a custom field
  if (includedFields.contextItems && includedFields.contextItems.length > 0) {
    // Load context items from storage asynchronously
    const contextItemsData = await chrome.storage.local.get(['contextItems']);
    if (contextItemsData.contextItems) {
      const selectedContextItems = contextItemsData.contextItems.filter(item => 
        includedFields.contextItems.includes(item.id)
      );
      filteredProfile.contextItems = selectedContextItems;
    }
  }
  
  return filteredProfile;
}

async function handleInsert(tabId, selection) {
  try {
    if (!profile) profile = await loadProfileFromStorage();
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
  
  // Personal description (prioritized at the top)
  if (profile?.personalDescription) parts.push(`About me: ${profile.personalDescription}`);
  
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
  
  // Context items from popup (custom Q&A data)
  if (profile?.contextItems?.length) {
    profile.contextItems.forEach(item => {
      parts.push(`${item.question}: ${item.answer}`);
    });
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

