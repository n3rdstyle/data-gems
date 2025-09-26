// Basic JSON schema validation for user profiles
export const PROFILE_SCHEMA = {
  type: 'object',
  properties: {
    version: { type: 'string', enum: ['1', '2'] },
    identity: {
      type: 'object',
      properties: {
        displayName: { type: 'string', maxLength: 100 },
        languages: { type: 'array', items: { type: 'string', maxLength: 50 } },
        location: { type: 'string', maxLength: 100 },
        // Legacy support
        roles: { type: 'array', items: { type: 'string', maxLength: 50 } }
      }
    },
    // New v2 fields
    style: {
      type: 'object',
      properties: {
        topics: { type: 'array', items: { type: 'string', maxLength: 100 } },
        tone: { type: 'string', maxLength: 50 },
        formatting: { type: 'string', maxLength: 50 }
      }
    },
    answers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', maxLength: 50 },
          type: { type: 'string', enum: ['boolean', 'text'] },
          value: { oneOf: [{ type: 'boolean' }, { type: 'string', maxLength: 200 }] }
        },
        required: ['id', 'type', 'value']
      }
    },
    // Legacy v1 fields (kept for backward compatibility)
    preferences: {
      type: 'object',
      properties: {
        topics: { type: 'array', items: { type: 'string', maxLength: 100 } },
        tone: { type: 'string', maxLength: 50 },
        formatting: { type: 'string', maxLength: 50 },
        tools: { type: 'array', items: { type: 'string', maxLength: 50 } }
      }
    },
    affinities: { type: 'array', items: { type: 'string', maxLength: 100 } },
    constraints: {
      type: 'object',
      properties: {
        avoid: { type: 'array', items: { type: 'string', maxLength: 100 } },
        privacyNotes: { type: 'string', maxLength: 500 }
      }
    },
    snippets: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 100 },
          text: { type: 'string', maxLength: 2000 }
        },
        required: ['name', 'text']
      }
    }
  },
  required: ['version']
};

export function validateProfile(profile) {
  const errors = [];
  
  if (!profile || typeof profile !== 'object') {
    return ['Profile must be an object'];
  }
  
  if (!profile.version || !['1', '2'].includes(profile.version)) {
    errors.push('Profile must have version "1" or "2"');
  }
  
  // Validate identity
  if (profile.identity) {
    if (typeof profile.identity !== 'object') {
      errors.push('Identity must be an object');
    } else {
      if (profile.identity.displayName && typeof profile.identity.displayName !== 'string') {
        errors.push('Display name must be a string');
      }
      if (profile.identity.languages && !Array.isArray(profile.identity.languages)) {
        errors.push('Languages must be an array');
      }
      if (profile.identity.roles && !Array.isArray(profile.identity.roles)) {
        errors.push('Roles must be an array');
      }
    }
  }
  
  // Validate style (v2) or preferences (v1)
  if (profile.style) {
    if (typeof profile.style !== 'object') {
      errors.push('Style must be an object');
    } else {
      if (profile.style.topics && !Array.isArray(profile.style.topics)) {
        errors.push('Style topics must be an array');
      }
      if (profile.style.tone && typeof profile.style.tone !== 'string') {
        errors.push('Style tone must be a string');
      }
      if (profile.style.formatting && typeof profile.style.formatting !== 'string') {
        errors.push('Style formatting must be a string');
      }
    }
  }
  
  // Validate legacy preferences
  if (profile.preferences) {
    if (typeof profile.preferences !== 'object') {
      errors.push('Preferences must be an object');
    } else {
      if (profile.preferences.topics && !Array.isArray(profile.preferences.topics)) {
        errors.push('Topics must be an array');
      }
      if (profile.preferences.tools && !Array.isArray(profile.preferences.tools)) {
        errors.push('Tools must be an array');
      }
      if (profile.preferences.tone && typeof profile.preferences.tone !== 'string') {
        errors.push('Tone must be a string');
      }
    }
  }

  // Validate answers (v2)
  if (profile.answers) {
    if (!Array.isArray(profile.answers)) {
      errors.push('Answers must be an array');
    } else {
      profile.answers.forEach((answer, i) => {
        if (!answer || typeof answer !== 'object') {
          errors.push(`Answer ${i} must be an object`);
        } else {
          if (!answer.id || typeof answer.id !== 'string') {
            errors.push(`Answer ${i} must have a string id`);
          }
          if (!answer.type || !['boolean', 'text'].includes(answer.type)) {
            errors.push(`Answer ${i} must have type 'boolean' or 'text'`);
          }
          if (answer.value === undefined || answer.value === null) {
            errors.push(`Answer ${i} must have a value`);
          } else if (answer.type === 'boolean' && typeof answer.value !== 'boolean') {
            errors.push(`Answer ${i} with type 'boolean' must have boolean value`);
          } else if (answer.type === 'text' && typeof answer.value !== 'string') {
            errors.push(`Answer ${i} with type 'text' must have string value`);
          }
        }
      });
    }
  }
  
  // Validate affinities
  if (profile.affinities && !Array.isArray(profile.affinities)) {
    errors.push('Affinities must be an array');
  }
  
  // Validate constraints
  if (profile.constraints) {
    if (typeof profile.constraints !== 'object') {
      errors.push('Constraints must be an object');
    } else {
      if (profile.constraints.avoid && !Array.isArray(profile.constraints.avoid)) {
        errors.push('Constraints.avoid must be an array');
      }
    }
  }
  
  // Validate snippets
  if (profile.snippets) {
    if (!Array.isArray(profile.snippets)) {
      errors.push('Snippets must be an array');
    } else {
      profile.snippets.forEach((snippet, i) => {
        if (!snippet || typeof snippet !== 'object') {
          errors.push(`Snippet ${i} must be an object`);
        } else {
          if (!snippet.name || typeof snippet.name !== 'string') {
            errors.push(`Snippet ${i} must have a name`);
          }
          if (!snippet.text || typeof snippet.text !== 'string') {
            errors.push(`Snippet ${i} must have text`);
          }
        }
      });
    }
  }
  
  // Check sizes
  const jsonSize = JSON.stringify(profile).length;
  if (jsonSize > 50000) {
    errors.push('Profile too large (max 50KB)');
  }
  
  return errors;
}

// Subprofile schema definition
export const SUBPROFILE_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 }, // UUID
    name: { type: 'string', maxLength: 50 },
    description: { type: 'string', maxLength: 200 },
    icon: { type: 'string', maxLength: 10 }, // Emoji
    color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }, // Hex color
    createdAt: { type: 'string' }, // ISO timestamp
    lastModified: { type: 'string' }, // ISO timestamp
    isActive: { type: 'boolean' },
    
    // Selection configuration
    includedFields: {
      type: 'object',
      properties: {
        identity: {
          type: 'object',
          properties: {
            displayName: { type: 'boolean' },
            languages: { type: 'boolean' },
            location: { type: 'boolean' }
          }
        },
        style: {
          type: 'object',
          properties: {
            topics: { type: 'array', items: { type: 'string', maxLength: 100 } },
            tone: { type: 'boolean' },
            formatting: { type: 'boolean' }
          }
        },
        answers: { type: 'array', items: { type: 'string', maxLength: 50 } },
        affinities: { type: 'array', items: { type: 'string', maxLength: 100 } },
        constraints: {
          type: 'object',
          properties: {
            avoid: { type: 'array', items: { type: 'string', maxLength: 100 } },
            privacyNotes: { type: 'boolean' }
          }
        },
        snippets: { type: 'array', items: { type: 'string', maxLength: 100 } }
      }
    }
  },
  required: ['id', 'name']
};

// Subprofile templates for quick setup
export const SUBPROFILE_TEMPLATES = {
  professional: {
    name: 'Professional',
    description: 'Work-related information and preferences',
    icon: '💼',
    color: '#2563EB',
    includedFields: {
      identity: { displayName: true, languages: true, location: false },
      style: { tone: true, formatting: true, topics: [] },
      answers: [], // Will be populated with work-related answer IDs
      affinities: [], // Will be populated with professional affinities
      constraints: { avoid: [], privacyNotes: true },
      snippets: [] // Will be populated with work-related snippets
    }
  },
  personal: {
    name: 'Personal',
    description: 'Hobbies, preferences, and lifestyle',
    icon: '🏠',
    color: '#10B981',
    includedFields: {
      identity: { displayName: true, languages: false, location: true },
      style: { tone: true, formatting: false, topics: [] },
      answers: [], // Will be populated with personal answer IDs
      affinities: [], // Will be populated with personal affinities
      constraints: { avoid: [], privacyNotes: false },
      snippets: [] // Will be populated with personal snippets
    }
  },
  creative: {
    name: 'Creative',
    description: 'Artistic preferences and creative projects',
    icon: '🎨',
    color: '#8B5CF6',
    includedFields: {
      identity: { displayName: true, languages: false, location: false },
      style: { tone: true, formatting: true, topics: [] },
      answers: [], // Will be populated with creative answer IDs
      affinities: [], // Will be populated with creative affinities
      constraints: { avoid: [], privacyNotes: false },
      snippets: [] // Will be populated with creative snippets
    }
  },
  learning: {
    name: 'Learning',
    description: 'Educational preferences and learning style',
    icon: '📚',
    color: '#F59E0B',
    includedFields: {
      identity: { displayName: false, languages: true, location: false },
      style: { tone: true, formatting: true, topics: [] },
      answers: [], // Will be populated with learning answer IDs
      affinities: [], // Will be populated with learning affinities
      constraints: { avoid: [], privacyNotes: false },
      snippets: [] // Will be populated with learning snippets
    }
  }
};

export function validateSubprofile(subprofile) {
  const errors = [];
  
  if (!subprofile || typeof subprofile !== 'object') {
    return ['Subprofile must be an object'];
  }
  
  if (!subprofile.id || typeof subprofile.id !== 'string') {
    errors.push('Subprofile must have a valid ID');
  }
  
  if (!subprofile.name || typeof subprofile.name !== 'string' || subprofile.name.trim().length === 0) {
    errors.push('Subprofile must have a name');
  }
  
  if (subprofile.name && subprofile.name.length > 50) {
    errors.push('Subprofile name must be 50 characters or less');
  }
  
  if (subprofile.description && (typeof subprofile.description !== 'string' || subprofile.description.length > 200)) {
    errors.push('Subprofile description must be a string of 200 characters or less');
  }
  
  if (subprofile.color && !/^#[0-9A-Fa-f]{6}$/.test(subprofile.color)) {
    errors.push('Subprofile color must be a valid hex color');
  }
  
  if (subprofile.includedFields && typeof subprofile.includedFields !== 'object') {
    errors.push('includedFields must be an object');
  }
  
  // Validate arrays in includedFields
  if (subprofile.includedFields) {
    const fields = subprofile.includedFields;
    
    if (fields.answers && !Array.isArray(fields.answers)) {
      errors.push('includedFields.answers must be an array');
    }
    
    if (fields.affinities && !Array.isArray(fields.affinities)) {
      errors.push('includedFields.affinities must be an array');
    }
    
    if (fields.snippets && !Array.isArray(fields.snippets)) {
      errors.push('includedFields.snippets must be an array');
    }
    
    if (fields.style && fields.style.topics && !Array.isArray(fields.style.topics)) {
      errors.push('includedFields.style.topics must be an array');
    }
    
    if (fields.constraints && fields.constraints.avoid && !Array.isArray(fields.constraints.avoid)) {
      errors.push('includedFields.constraints.avoid must be an array');
    }
    
    if (fields.contextItems && !Array.isArray(fields.contextItems)) {
      errors.push('includedFields.contextItems must be an array');
    }
  }
  
  return errors;
}

export function cleanSubprofile(subprofile) {
  if (!subprofile || typeof subprofile !== 'object') {
    return null;
  }
  
  const cleaned = {
    id: subprofile.id,
    name: (subprofile.name || '').trim().slice(0, 50),
    description: (subprofile.description || '').trim().slice(0, 200),
    icon: (subprofile.icon || '📝').slice(0, 10),
    color: subprofile.color || '#6B7280',
    createdAt: subprofile.createdAt || new Date().toISOString(),
    lastModified: new Date().toISOString(),
    isActive: Boolean(subprofile.isActive),
    includedFields: {
      identity: {
        displayName: Boolean(subprofile.includedFields?.identity?.displayName),
        languages: Boolean(subprofile.includedFields?.identity?.languages),
        location: Boolean(subprofile.includedFields?.identity?.location)
      },
      style: {
        topics: Array.isArray(subprofile.includedFields?.style?.topics) 
          ? subprofile.includedFields.style.topics.filter(t => t && typeof t === 'string').slice(0, 20)
          : [],
        tone: Boolean(subprofile.includedFields?.style?.tone),
        formatting: Boolean(subprofile.includedFields?.style?.formatting)
      },
      answers: Array.isArray(subprofile.includedFields?.answers)
        ? subprofile.includedFields.answers.filter(a => a && typeof a === 'string').slice(0, 50)
        : [],
      affinities: Array.isArray(subprofile.includedFields?.affinities)
        ? subprofile.includedFields.affinities.filter(a => a && typeof a === 'string').slice(0, 20)
        : [],
      constraints: {
        avoid: Array.isArray(subprofile.includedFields?.constraints?.avoid)
          ? subprofile.includedFields.constraints.avoid.filter(a => a && typeof a === 'string').slice(0, 20)
          : [],
        privacyNotes: Boolean(subprofile.includedFields?.constraints?.privacyNotes)
      },
      snippets: Array.isArray(subprofile.includedFields?.snippets)
        ? subprofile.includedFields.snippets.filter(s => s && typeof s === 'string').slice(0, 20)
        : [],
      contextItems: Array.isArray(subprofile.includedFields?.contextItems)
        ? subprofile.includedFields.contextItems.filter(id => id && typeof id === 'string').slice(0, 100)
        : []
    }
  };
  
  return cleaned;
}

export function cleanProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    return { version: '1', preferences: {} };
  }

  // Remove empty arrays and objects
  const clean = (obj) => {
    if (Array.isArray(obj)) {
      return obj.filter(item => item != null && item !== '').slice(0, 20); // Limit array size
    }
    if (obj && typeof obj === 'object') {
      const cleaned = {};
      Object.entries(obj).forEach(([key, value]) => {
        if (value != null && value !== '') {
          if (Array.isArray(value)) {
            const arr = clean(value);
            if (arr.length > 0) cleaned[key] = arr;
          } else if (typeof value === 'object') {
            const obj = clean(value);
            if (Object.keys(obj).length > 0) cleaned[key] = obj;
          } else if (typeof value === 'string' && value.trim()) {
            cleaned[key] = value.trim().slice(0, 2000); // Limit string length
          } else {
            cleaned[key] = value;
          }
        }
      });
      return cleaned;
    }
    return obj;
  };

  return {
    version: '1',
    ...clean(profile)
  };
}