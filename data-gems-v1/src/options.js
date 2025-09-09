import { StorageKeys } from './crypto.js';
import { validateProfile, cleanProfile, validateSubprofile, cleanSubprofile, SUBPROFILE_TEMPLATES } from './schema.js';
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

// Subprofile elements
const subprofilesListEl = document.getElementById('subprofilesList');
const createSubprofileBtn = document.getElementById('createSubprofileBtn');

// Global state
let currentProfile = null;
let subprofiles = [];
let editingSubprofile = null;

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
      currentProfile = res.profile;
      profileToForm(res.profile);
    }
  } catch (e) {
    // Profile doesn't exist yet
    console.log('Auto-load failed (normal if no profile exists):', e);
  }
  
  // Load subprofiles
  await loadSubprofiles();
})();

// Subprofile Management Functions
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function loadSubprofiles() {
  const res = await request('LOAD_SUBPROFILES');
  if (res?.ok) {
    subprofiles = res.subprofiles || [];
    renderSubprofilesList();
  }
}

function renderSubprofilesList() {
  if (subprofiles.length === 0) {
    subprofilesListEl.innerHTML = '<div style="padding: 16px; text-align: center; color: #666;">No subprofiles created yet. Use a template below to get started.</div>';
    return;
  }
  
  subprofilesListEl.innerHTML = subprofiles.map(subprofile => {
    const itemCount = calculateSubprofileItemCount(subprofile);
    return `
      <div class="subprofile-item">
        <div class="subprofile-icon" style="background-color: ${subprofile.color}">
          ${subprofile.icon}
        </div>
        <div class="subprofile-info">
          <h4>${subprofile.name}</h4>
          <p>${subprofile.description || 'No description'} • ${itemCount} items selected</p>
        </div>
        <div class="subprofile-actions">
          <button class="btn" onclick="editSubprofile('${subprofile.id}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteSubprofile('${subprofile.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function calculateSubprofileItemCount(subprofile) {
  let count = 0;
  const fields = subprofile.includedFields;
  
  // Count identity fields
  if (fields.identity) {
    count += Object.values(fields.identity).filter(Boolean).length;
  }
  
  // Count style fields
  if (fields.style) {
    count += Object.values(fields.style).filter(v => v === true || (Array.isArray(v) && v.length > 0)).length;
  }
  
  // Count arrays
  count += (fields.answers || []).length;
  count += (fields.affinities || []).length;
  count += (fields.snippets || []).length;
  
  // Count constraints
  if (fields.constraints) {
    count += Object.values(fields.constraints).filter(v => v === true || (Array.isArray(v) && v.length > 0)).length;
  }
  
  return count;
}

async function createSubprofileFromTemplate(templateName) {
  if (!currentProfile) {
    errorEl.textContent = 'Please save your main profile first before creating subprofiles';
    return;
  }
  
  const template = SUBPROFILE_TEMPLATES[templateName];
  if (!template) {
    errorEl.textContent = 'Invalid template';
    return;
  }
  
  // Create new subprofile with template data
  const newSubprofile = {
    ...template,
    id: generateUUID(),
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    isActive: true
  };
  
  // Auto-populate fields based on current profile data
  populateSubprofileFromProfile(newSubprofile, currentProfile, templateName);
  
  const cleaned = cleanSubprofile(newSubprofile);
  const errors = validateSubprofile(cleaned);
  
  if (errors.length > 0) {
    errorEl.textContent = `Validation errors: ${errors.join('; ')}`;
    return;
  }
  
  const res = await request('SAVE_SUBPROFILE', { subprofile: cleaned });
  if (res?.ok) {
    await loadSubprofiles();
    errorEl.textContent = `Subprofile "${template.name}" created successfully`;
  } else {
    errorEl.textContent = res?.error || 'Failed to create subprofile';
  }
}

function populateSubprofileFromProfile(subprofile, profile, templateName) {
  // Auto-select relevant answers based on template type
  if (profile.answers) {
    const relevantAnswers = profile.answers.filter(answer => {
      return isAnswerRelevantForTemplate(answer, templateName);
    }).map(answer => answer.id);
    
    subprofile.includedFields.answers = relevantAnswers.slice(0, 10); // Limit to 10 items
  }
  
  // Auto-select relevant affinities
  if (profile.affinities) {
    subprofile.includedFields.affinities = profile.affinities.slice(0, 5); // Include some affinities
  }
  
  // Auto-select relevant topics
  if (profile.style?.topics) {
    subprofile.includedFields.style.topics = profile.style.topics.slice(0, 3); // Include some topics
  }
}

function isAnswerRelevantForTemplate(answer, templateName) {
  const workRelatedIds = ['like_coding', 'like_technology', 'like_learning'];
  const personalIds = ['like_travel', 'like_cooking', 'like_reading', 'like_movies', 'favorite_food', 'favorite_music'];
  const creativeIds = ['like_art', 'like_photography', 'like_writing', 'like_dancing', 'favorite_color'];
  const learningIds = ['like_learning', 'like_reading', 'like_history', 'like_science'];
  
  switch (templateName) {
    case 'professional':
      return workRelatedIds.includes(answer.id);
    case 'personal':
      return personalIds.includes(answer.id);
    case 'creative':
      return creativeIds.includes(answer.id);
    case 'learning':
      return learningIds.includes(answer.id);
    default:
      return false;
  }
}

async function deleteSubprofile(subprofileId) {
  if (!confirm('Are you sure you want to delete this subprofile?')) {
    return;
  }
  
  const res = await request('DELETE_SUBPROFILE', { subprofileId });
  if (res?.ok) {
    await loadSubprofiles();
    errorEl.textContent = 'Subprofile deleted successfully';
  } else {
    errorEl.textContent = res?.error || 'Failed to delete subprofile';
  }
}

// Make functions global for onclick handlers
window.editSubprofile = async function(subprofileId) {
  // For now, just show an alert - we'll implement full editing in next phase
  alert('Subprofile editing will be implemented in the next phase. For now, you can delete and recreate subprofiles.');
};

window.deleteSubprofile = deleteSubprofile;

// Event listeners
createSubprofileBtn.addEventListener('click', () => {
  // For now, just create a basic custom subprofile
  alert('Custom subprofile creation will be implemented in the next phase. Please use the templates below for now.');
});

// Template card click handlers
document.addEventListener('click', async (e) => {
  const templateCard = e.target.closest('.template-card');
  if (templateCard) {
    const templateName = templateCard.dataset.template;
    await createSubprofileFromTemplate(templateName);
  }
});

