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