import { StorageKeys } from './crypto.js';
import { validateProfile, cleanProfile } from './schema.js';
import { QUESTIONS } from './questions.js';

const profileEl = document.getElementById('profile');
const loadEl = document.getElementById('load');
const saveEl = document.getElementById('save');
const errorEl = document.getElementById('error');
const exportEl = document.getElementById('export');
const importEl = document.getElementById('import');
const importFileEl = document.getElementById('importFile');

// UI elements
const profileFormEl = document.getElementById('profileForm');
const questionsContainerEl = document.getElementById('questionsContainer');
const formatEl = document.getElementById('format');
const loadFormEl = document.getElementById('loadForm');
const saveFormEl = document.getElementById('saveForm');

// Form fields
const formFields = {
  displayName: document.getElementById('displayName'),
  languages: document.getElementById('languages'),
  location: document.getElementById('location'),
  tone: document.getElementById('tone'),
  formatting: document.getElementById('formatting'),
  topics: document.getElementById('topics'),
  additionalPreferences: document.getElementById('additionalPreferences'),
  avoid: document.getElementById('avoid'),
  privacyNotes: document.getElementById('privacyNotes')
};

// Store question inputs for easy access
const questionInputs = new Map();

async function request(type, payload = {}) {
  return new Promise((resolve) => chrome.runtime.sendMessage({ type, ...payload }, resolve));
}


loadEl.addEventListener('click', async () => {
  const res = await request('LOAD_PROFILE');
  if (!res?.ok) {
    errorEl.textContent = res?.error || 'Load failed';
    return;
  }
  profileEl.value = JSON.stringify(res.profile, null, 2);
});

saveEl.addEventListener('click', async () => {
  try {
    const obj = JSON.parse(profileEl.value || '{}');
    
    // Validate profile
    const errors = validateProfile(obj);
    if (errors.length > 0) {
      errorEl.textContent = `Validation errors: ${errors.slice(0, 3).join('; ')}`;
      return;
    }
    
    // Clean and save
    const cleaned = cleanProfile(obj);
    const res = await request('SAVE_PROFILE', { profile: cleaned });
    errorEl.textContent = res?.ok ? 'Profile saved successfully' : (res?.error || 'Save failed');
    
    // Update UI with cleaned version
    if (res?.ok) {
      profileEl.value = JSON.stringify(cleaned, null, 2);
    }
  } catch (e) {
    errorEl.textContent = 'Invalid JSON';
  }
});

exportEl.addEventListener('click', async () => {
  const res = await request('EXPORT_ENCRYPTED');
  if (!res?.ok || !res.blob) return;
  const blob = new Blob([JSON.stringify(res.blob)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'profile.encrypted.json';
  a.click();
  URL.revokeObjectURL(url);
});

importEl.addEventListener('click', async () => {
  const file = importFileEl.files?.[0];
  if (!file) return;
  const text = await file.text();
  try {
    const obj = JSON.parse(text);
    const res = await request('IMPORT_ENCRYPTED', { blob: obj });
    errorEl.textContent = res?.ok ? '' : (res?.error || 'Import failed');
  } catch (e) {
    errorEl.textContent = 'Invalid file';
  }
});

function arrayFromString(str) {
  return str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
}

function stringFromArray(arr) {
  return Array.isArray(arr) ? arr.join(', ') : '';
}

function renderQuestionsSection() {
  questionsContainerEl.innerHTML = '';
  
  QUESTIONS.forEach(question => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    
    let input;
    if (question.type === 'boolean') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `q_${question.id}`;
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.id = `q_${question.id}`;
      input.placeholder = 'Your answer...';
    }
    
    const label = document.createElement('span');
    label.className = 'question-text';
    label.textContent = question.text;
    
    questionDiv.appendChild(input);
    questionDiv.appendChild(label);
    questionsContainerEl.appendChild(questionDiv);
    
    // Store reference for easy access
    questionInputs.set(question.id, input);
  });
}

function profileToForm(profile) {
  try {
    // Handle backward compatibility: use style or preferences
    const style = profile?.style ?? profile?.preferences ?? {};
    
    // Identity fields
    formFields.displayName.value = profile?.identity?.displayName || '';
    formFields.languages.value = stringFromArray(profile?.identity?.languages);
    formFields.location.value = profile?.identity?.location || '';
    
    // Style fields (was preferences)
    formFields.tone.value = style.tone || '';
    formFields.formatting.value = style.formatting || '';
    formFields.topics.value = stringFromArray(style.topics);
    
    // Additional preferences
    formFields.additionalPreferences.value = profile?.identity?.additionalPreferences || '';
    
    // Constraints
    formFields.avoid.value = stringFromArray(profile?.constraints?.avoid);
    formFields.privacyNotes.value = profile?.constraints?.privacyNotes || '';
    
    // Load answers into question inputs
    const answersById = new Map();
    if (profile?.answers) {
      profile.answers.forEach(answer => {
        answersById.set(answer.id, answer.value);
      });
    }
    
    // Apply answers to question inputs
    QUESTIONS.forEach(question => {
      const input = questionInputs.get(question.id);
      const value = answersById.get(question.id);
      
      if (input && value !== undefined) {
        if (question.type === 'boolean') {
          input.checked = Boolean(value);
        } else {
          input.value = String(value);
        }
      }
    });
    
  } catch (e) {
    errorEl.textContent = 'Error loading profile to form';
    console.error('Profile to form error:', e);
  }
}

function formToProfile() {
  // Collect answers from question inputs
  const answers = [];
  QUESTIONS.forEach(question => {
    const input = questionInputs.get(question.id);
    if (input) {
      let value;
      if (question.type === 'boolean') {
        value = input.checked;
      } else {
        value = input.value.trim();
      }
      
      // Only include answers that have been set
      if (question.type === 'boolean' || (question.type === 'text' && value)) {
        answers.push({
          id: question.id,
          type: question.type,
          value: value
        });
      }
    }
  });
  
  return {
    version: '2',
    identity: {
      displayName: formFields.displayName.value.trim() || undefined,
      languages: arrayFromString(formFields.languages.value),
      location: formFields.location.value.trim() || undefined,
      additionalPreferences: formFields.additionalPreferences.value.trim() || undefined
    },
    style: {
      tone: formFields.tone.value || undefined,
      formatting: formFields.formatting.value || undefined,
      topics: arrayFromString(formFields.topics.value)
    },
    constraints: {
      avoid: arrayFromString(formFields.avoid.value),
      privacyNotes: formFields.privacyNotes.value.trim() || undefined
    },
    answers: answers
  };
}

formatEl.addEventListener('click', () => {
  try {
    const obj = JSON.parse(profileEl.value || '{}');
    profileEl.value = JSON.stringify(obj, null, 2);
    errorEl.textContent = '';
  } catch (e) {
    errorEl.textContent = 'Invalid JSON';
  }
});

loadFormEl.addEventListener('click', async () => {
  const res = await request('LOAD_PROFILE');
  if (!res?.ok) {
    errorEl.textContent = res?.error || 'Load failed';
    return;
  }
  profileToForm(res.profile);
  errorEl.textContent = 'Profile loaded successfully';
});

saveFormEl.addEventListener('click', async () => {
  try {
    const profile = formToProfile();
    
    // Validate and clean
    const errors = validateProfile(profile);
    if (errors.length > 0) {
      errorEl.textContent = `Validation errors: ${errors.slice(0, 3).join('; ')}`;
      return;
    }
    
    const cleaned = cleanProfile(profile);
    const res = await request('SAVE_PROFILE', { profile: cleaned });
    errorEl.textContent = res?.ok ? 'Profile saved successfully' : (res?.error || 'Save failed');
  } catch (e) {
    errorEl.textContent = 'Form validation error';
    console.error('Form save error:', e);
  }
});

// Initialize questions rendering
renderQuestionsSection();

// Auto-load profile on page load
(async function init() {
  // Try to auto-load profile
  try {
    const res = await request('LOAD_PROFILE');
    if (res?.ok) {
      profileToForm(res.profile);
    }
  } catch (e) {
    // Profile doesn't exist yet
    console.log('Auto-load failed (normal if no profile exists):', e);
  }
})();

