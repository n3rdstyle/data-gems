console.log('🚀 DATA GEMS CONTENT SCRIPT LOADED!!! 🚀');
console.log('Prompt Profile Injector: Content script loaded on', window.location.hostname);
console.log('🌍 Current URL:', window.location.href);
console.log('📅 Script loaded at:', new Date().toISOString());

// Content script is running - ready for /prompt command!

// Configuration for different AI platforms
const AI_PLATFORMS = {
  'chatgpt.com': {
    selector: 'textarea[placeholder*="Message"], textarea[data-id="root"], #prompt-textarea',
    buttonPosition: 'above'
  },
  'chat.openai.com': {
    selector: 'textarea[placeholder*="Message"], textarea[data-id="root"], #prompt-textarea',
    buttonPosition: 'above'
  },
  'claude.ai': {
    // Updated selectors for Claude's current interface
    selector: 'div[contenteditable="true"], div.ProseMirror, fieldset div[contenteditable="true"], div[enterkeyhint="enter"], .prose-mirror-editor',
    buttonPosition: 'above'
  },
  'gemini.google.com': {
    selector: 'rich-textarea .ql-editor, .ql-editor[contenteditable="true"], .input-area, div[contenteditable="true"], [class*="query-input"]',
    buttonPosition: 'above'
  },
  'perplexity.ai': {
    selector: 'textarea[placeholder*="Ask"], textarea[placeholder*="follow"], textarea[placeholder*="Follow"], div[contenteditable="true"], textarea.rounded-3xl',
    buttonPosition: 'above'
  },
  'www.perplexity.ai': {
    selector: 'textarea[placeholder*="Ask"], textarea[placeholder*="follow"], textarea[placeholder*="Follow"], div[contenteditable="true"], textarea.rounded-3xl',
    buttonPosition: 'above'
  },
  // Default selector for any other site with common input patterns
  'default': {
    selector: 'textarea, div[contenteditable="true"], input[type="text"][placeholder*="ask" i], input[type="text"][placeholder*="message" i], input[type="text"][placeholder*="prompt" i]',
    buttonPosition: 'above'
  }
};

// Store references to created buttons to avoid duplicates
const injectedButtons = new WeakMap();
let buttonIdCounter = 0;
let lastButtonCreateTime = 0;

// Auto-injection settings
let autoInjectSettings = {
  enabled: false,
  delay: 2 // seconds
};
let autoInjectTimeouts = new Set();

// Simple one-time auto-injection flag
let hasAutoInjected = false;

// Prompt command functionality
let promptLibrary = [];

// Load prompt library from storage
async function loadPromptLibrary() {
  try {
    console.log('📥 Loading prompt library from storage...');
    const result = await chrome.storage.local.get(['promptLibrary']);
    promptLibrary = result.promptLibrary || [];
    console.log('📚 Loaded prompt library:', promptLibrary.length, 'prompts');
    console.log('📚 Prompt library contents:', promptLibrary);
  } catch (error) {
    console.error('❌ Failed to load prompt library:', error);
    promptLibrary = [];
  }
}

// Create the inject button with dropdown
function createInjectButton() {
  const buttonId = `prompt-profile-btn-${++buttonIdCounter}`;
  const container = document.createElement('div');
  container.className = 'prompt-profile-inject-container';
  container.id = buttonId;
  
  // Main button
  const button = document.createElement('button');
  button.className = 'prompt-profile-inject-btn';
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    <span>Inject my profile</span>
  `;
  
  // Dropdown menu
  const dropdown = document.createElement('div');
  dropdown.className = 'prompt-profile-dropdown';
  dropdown.style.display = 'none';
  dropdown.innerHTML = `
    <div class="dropdown-item" data-action="full">
      <span class="item-label">Full Profile</span>
      <span class="item-description">All your information</span>
    </div>
    <div class="dropdown-loading">
      Loading subprofiles...
    </div>
  `;
  
  container.appendChild(button);
  container.appendChild(dropdown);
  
  // Add styles if not already added
  const styleId = 'prompt-profile-inject-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .prompt-profile-inject-container {
        position: absolute !important;
        z-index: 10000;
      }
      
      .prompt-profile-inject-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: linear-gradient(135deg, #e84c88 0%, #f47b6a 25%, #f9a05c 50%, #fdb863 75%, #ffd194 100%);
        color: #04214E;
        border: none;
        border-radius: 20px;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-weight: 500;
        cursor: pointer;
        z-index: 99999;
        box-shadow: none !important;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      
      .prompt-profile-inject-btn:hover {
        transform: translateY(-1px);
        background: linear-gradient(135deg, #ec5a92 0%, #f58874 25%, #faae66 50%, #fdc46d 75%, #ffd89e 100%);
        box-shadow: none !important;
      }
      
      .prompt-profile-inject-btn:active {
        transform: translateY(0);
      }
      
      .prompt-profile-inject-btn svg {
        width: 16px;
        height: 16px;
        color: #04214E;
      }
      
      .prompt-profile-inject-btn.loading {
        opacity: 0.7;
        cursor: wait;
      }
      
      .prompt-profile-inject-btn.loading span::after {
        content: '...';
        animation: dots 1.5s infinite;
      }
      
      .prompt-profile-inject-btn.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      }
      
      @keyframes dots {
        0%, 20% { content: '.'; }
        40% { content: '..'; }
        60%, 100% { content: '...'; }
      }
      
      
      .prompt-profile-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: white;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        z-index: 10001;
        min-width: 200px;
      }
      
      .dropdown-item {
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        transition: background-color 0.2s ease;
      }
      
      .dropdown-item:last-child {
        border-bottom: none;
      }
      
      .dropdown-item:hover {
        background-color: #f8f9fa;
      }
      
      .item-label {
        display: block;
        font-weight: 500;
        color: #374151;
        font-size: 13px;
      }
      
      .item-description {
        display: block;
        font-size: 11px;
        color: #6b7280;
        margin-top: 2px;
      }
      
      .dropdown-loading {
        padding: 12px 16px;
        color: #6b7280;
        font-size: 12px;
        text-align: center;
      }
      
      /* Adjust for dark mode sites */
      @media (prefers-color-scheme: dark) {
        .prompt-profile-inject-btn {
          /* No special shadow for dark mode */
        }
      }
      
      /* Prompt Command Dropdown Styles */
      .prompt-command-dropdown {
        position: fixed !important;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        z-index: 999999 !important;
        min-width: 300px;
        max-width: 400px;
        max-height: 300px;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      .prompt-command-header {
        padding: 8px 12px;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
        font-size: 11px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .prompt-command-item {
        padding: 10px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f3f4f6;
        transition: background-color 0.15s ease;
      }
      
      .prompt-command-item:hover {
        background: #f3f4f6;
      }
      
      .prompt-command-item.selected {
        background: #e0f2fe;
      }
      
      .prompt-command-item:last-child {
        border-bottom: none;
      }
      
      .prompt-command-name {
        font-weight: 500;
        color: #1f2937;
        font-size: 13px;
        margin-bottom: 2px;
      }
      
      .prompt-command-preview {
        font-size: 11px;
        color: #6b7280;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      .prompt-command-empty {
        padding: 16px;
        text-align: center;
        color: #6b7280;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add click handler for dropdown toggle
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleDropdown(container, dropdown);
  });
  
  // Add click handlers for dropdown items
  dropdown.addEventListener('click', async (e) => {
    const item = e.target.closest('.dropdown-item');
    if (item) {
      e.preventDefault();
      e.stopPropagation();

      const action = item.dataset.action;
      hideDropdown(container, dropdown);

      if (action === 'full') {
        await injectProfile(button, null); // Full profile
      } else if (action.startsWith('import:')) {
        // Handle imported data injection
        const importId = action.substring(7); // Remove 'import:' prefix
        await injectImportedData(button, importId);
      } else {
        await injectProfile(button, action); // Subprofile ID
      }
    }
  });
  
  // Load subprofiles and populate dropdown
  loadSubprofilesForDropdown(dropdown);
  
  console.log('Created inject button with dropdown, ID:', buttonId);
  return container;
}

// Dropdown functionality
function toggleDropdown(container, dropdown) {
  const isOpen = container.classList.contains('open');
  if (isOpen) {
    hideDropdown(container, dropdown);
  } else {
    showDropdown(container, dropdown);
  }
}

function showDropdown(container, dropdown) {
  container.classList.add('open');
  dropdown.style.display = 'block';
  
  // Close dropdown when clicking outside
  setTimeout(() => {
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        hideDropdown(container, dropdown);
      }
    }, { once: true });
  }, 100);
}

function hideDropdown(container, dropdown) {
  container.classList.remove('open');
  dropdown.style.display = 'none';
}

// Load subprofiles for dropdown
async function loadSubprofilesForDropdown(dropdown) {
  try {
    // Load subprofiles
    const response = await chrome.runtime.sendMessage({ type: 'LOAD_SUBPROFILES' });

    // Load imported external data
    const importedDataResult = await chrome.storage.local.get(['importedData']);
    const importedData = importedDataResult.importedData || [];

    // Remove loading message
    const loading = dropdown.querySelector('.dropdown-loading');
    if (loading) {
      loading.remove();
    }

    // Add subprofile items
    if (response?.ok && response.subprofiles && response.subprofiles.length > 0) {
      const subprofiles = response.subprofiles;

      subprofiles.forEach(subprofile => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.dataset.action = subprofile.id;
        item.innerHTML = `
          <span class="item-label">${subprofile.icon} ${subprofile.name}</span>
          <span class="item-description">${subprofile.description || 'Custom subprofile'}</span>
        `;
        dropdown.appendChild(item);
      });
    }

    // Add external files section if there are imported files
    if (importedData.length > 0) {
      // Add divider if there are subprofiles
      if (response?.ok && response.subprofiles && response.subprofiles.length > 0) {
        const divider = document.createElement('div');
        divider.className = 'dropdown-divider';
        divider.style.cssText = 'height: 1px; background: #e5e7eb; margin: 8px 0;';
        dropdown.appendChild(divider);
      }

      // Add External Files header
      const header = document.createElement('div');
      header.className = 'dropdown-header';
      header.style.cssText = 'padding: 6px 12px; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;';
      header.textContent = 'External Files';
      dropdown.appendChild(header);

      // Add each imported file as an option
      importedData.forEach(importRecord => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.dataset.action = `import:${importRecord.id}`;
        item.innerHTML = `
          <span class="item-label">📥 ${importRecord.source} Import</span>
          <span class="item-description">${new Date(importRecord.importDate).toLocaleDateString()} • ${importRecord.itemCount} items</span>
        `;
        dropdown.appendChild(item);
      });
    }

    // Show message if no subprofiles and no imported data
    if ((!response?.ok || !response.subprofiles || response.subprofiles.length === 0) && importedData.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'dropdown-loading';
      emptyMessage.textContent = 'No subprofiles or imported data found';
      dropdown.appendChild(emptyMessage);
    }
  } catch (error) {
    console.error('Failed to load subprofiles:', error);
    const loading = dropdown.querySelector('.dropdown-loading');
    if (loading) {
      loading.textContent = 'Failed to load subprofiles';
    }
  }
}

// Find the actual prompt container (not just the input element)
function findPromptContainer(inputElement) {
  const hostname = window.location.hostname;
  let container = inputElement;
  
  console.log('Finding container for:', hostname, 'Input element:', inputElement);
  
  // Platform-specific container detection
  if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
    // ChatGPT: Look for the form or main container
    container = inputElement.closest('form') || 
                inputElement.closest('[class*="prompt"]') ||
                inputElement.closest('[class*="input"]') ||
                inputElement.parentElement?.parentElement ||
                inputElement;
  } else if (hostname.includes('claude.ai')) {
    // Claude: Look for the fieldset or contenteditable container
    container = inputElement.closest('fieldset') ||
                inputElement.closest('[class*="composer"]') ||
                inputElement.closest('[class*="input"]') ||
                inputElement.parentElement?.parentElement ||
                inputElement;
  } else if (hostname.includes('gemini.google.com')) {
    // Gemini: Look for the text-input-field or input-area containers (not the gradient)
    let current = inputElement;
    let bestContainer = inputElement;
    let maxWidth = inputElement.getBoundingClientRect().width;
    
    // Go up the tree looking for the right container
    for (let i = 0; i < 10 && current.parentElement; i++) {
      current = current.parentElement;
      const rect = current.getBoundingClientRect();
      const classes = current.className || '';
      
      // Log each parent for debugging
      console.log(`Gemini parent ${i}:`, classes || current.tagName, 'width:', rect.width);
      
      // Look for the actual input field container (not the full-width gradient)
      if (classes.includes('text-input-field') || classes.includes('input-area-container')) {
        // Make sure it's not too wide (avoid full viewport containers)
        if (rect.width < window.innerWidth * 0.7) {
          console.log('Found suitable Gemini container:', classes, 'width:', rect.width);
          container = current;
          break;
        }
      }
      
      // Track reasonable sized containers
      if (rect.width > maxWidth && rect.width < window.innerWidth * 0.7) {
        maxWidth = rect.width;
        bestContainer = current;
      }
    }
    
    if (container === inputElement) {
      container = bestContainer;
    }
  } else if (hostname.includes('perplexity.ai')) {
    // Perplexity: Look for the rounded border container (the visual search box)
    let current = inputElement;
    let bestContainer = inputElement;
    
    // Go up the tree looking for the container with rounded borders
    for (let i = 0; i < 10 && current.parentElement; i++) {
      current = current.parentElement;
      const rect = current.getBoundingClientRect();
      const classes = current.className || '';
      
      // Log each parent for debugging
      console.log(`Perplexity parent ${i}:`, classes || current.tagName, 'width:', rect.width);
      
      // Look for the container with rounded borders (the visual search box)
      if (classes.includes('rounded') && classes.includes('border')) {
        console.log('Found rounded border container at parent', i);
        container = current;
        break;
      }
      
      // Also stop if we find a reasonably wide container
      if (rect.width > 500 && rect.width < window.innerWidth * 0.8) {
        bestContainer = current;
        if (!container || container === inputElement) {
          container = current;
        }
      }
    }
    
    if (container === inputElement) {
      container = bestContainer;
    }
  }
  
  // Verify we found a reasonable container
  const containerRect = container.getBoundingClientRect();
  const inputRect = inputElement.getBoundingClientRect();
  
  // If container is too small or same as input, try parent
  if (containerRect.width <= inputRect.width + 20) {
    let parent = container.parentElement;
    let attempts = 0;
    
    // Try up to 5 parent levels to find a suitable container
    while (parent && attempts < 5) {
      const parentRect = parent.getBoundingClientRect();
      
      // Check if this parent is a better container
      if (parentRect.width > containerRect.width && 
          parentRect.width < window.innerWidth * 0.9 &&
          parentRect.width > inputRect.width + 40) {
        container = parent;
        break;
      }
      
      parent = parent.parentElement;
      attempts++;
    }
  }
  
  // For Gemini and Perplexity, do one more check for wider containers
  if ((hostname.includes('gemini.google.com') || hostname.includes('perplexity.ai')) && 
      container.getBoundingClientRect().width < 500) {
    let widerParent = container.parentElement;
    let attempts = 0;
    
    while (widerParent && attempts < 3) {
      const widerRect = widerParent.getBoundingClientRect();
      if (widerRect.width > 500 && widerRect.width < window.innerWidth * 0.8) {
        container = widerParent;
        break;
      }
      widerParent = widerParent.parentElement;
      attempts++;
    }
  }
  
  console.log('Found container:', container, 'for input:', inputElement);
  return container;
}

// Position the button relative to an input field
function positionButton(button, inputElement) {
  // Find the actual container to align with
  const container = findPromptContainer(inputElement);
  const rect = container.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // Get button dimensions
  const buttonWidth = 160; // Approximate button width
  const buttonHeight = 36; // Approximate button height
  let spacing = 4; // Default spacing from input field
  
  // Platform-specific spacing adjustments
  const hostname = window.location.hostname;
  if (hostname.includes('gemini.google.com')) {
    spacing = 16; // Extra spacing for Gemini to clear the input field border (was 12, now 16)
  }
  
  // Calculate position - align with right edge of container
  button.style.position = 'absolute';
  button.style.top = `${rect.top + scrollTop - buttonHeight - spacing}px`;
  button.style.left = `${rect.right + scrollLeft - buttonWidth}px`;
  button.style.right = 'auto';
  button.style.bottom = 'auto';
  
  // Ensure button stays within viewport
  requestAnimationFrame(() => {
    const buttonRect = button.getBoundingClientRect();
    
    // Adjust if button goes off right edge
    if (buttonRect.right > window.innerWidth - 10) {
      button.style.left = `${window.innerWidth - buttonWidth - 10}px`;
    }
    
    // Adjust if button goes off left edge
    if (buttonRect.left < 10) {
      button.style.left = '10px';
    }
    
    // If no room above, position below
    if (buttonRect.top < 10) {
      button.style.top = `${rect.bottom + scrollTop + spacing}px`;
    }
  });
  
  console.log('Positioned button at:', {
    position: button.style.position,
    top: button.style.top,
    left: button.style.left,
    containerRect: {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width
    },
    inputElement: inputElement.tagName,
    container: container.tagName
  });
}

// Build context text from items
function buildContextText(contextItems) {
  if (contextItems.length === 0) {
    return '';
  }
  
  const grouped = contextItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});
  
  let text = '# Personal Context\n\n';
  
  Object.entries(grouped).forEach(([category, items]) => {
    text += `## ${category}\n`;
    items.forEach(item => {
      text += `- **${item.question}**: ${item.answer}\n`;
    });
    text += '\n';
  });
  
  return text.trim();
}

// Inject imported external data
async function injectImportedData(button, importId) {
  console.log('Injecting imported data, ID:', importId);
  button.classList.add('loading');
  button.querySelector('span').textContent = 'Loading';

  try {
    // Get imported data from storage
    const result = await chrome.storage.local.get(['importedData']);
    const importedData = result.importedData || [];

    // Find the specific import record
    const importRecord = importedData.find(record => record.id === importId);

    if (!importRecord) {
      throw new Error('Import record not found');
    }

    console.log('Found import record:', importRecord.source, importRecord.itemCount, 'items');

    // Create profile JSON with imported data
    const importedProfileData = {
      version: "2.2",
      type: "imported_data",
      source: importRecord.source,
      importDate: importRecord.importDate,
      timestamp: new Date().toISOString(),
      itemCount: importRecord.itemCount,
      data: {}
    };

    // Group items by category for better organization
    const categorizedData = {};
    importRecord.items.forEach(item => {
      const category = item.category || 'Other';
      if (!categorizedData[category]) {
        categorizedData[category] = [];
      }
      categorizedData[category].push({
        question: item.question,
        answer: item.answer
      });
    });

    importedProfileData.data = categorizedData;

    // Create a file with the imported data
    const filename = `imported-${importRecord.source.toLowerCase()}-${new Date(importRecord.importDate).toISOString().split('T')[0]}.json`;
    const jsonBlob = new Blob([JSON.stringify(importedProfileData, null, 2)], { type: 'application/json' });
    const file = new File([jsonBlob], filename, { type: 'application/json' });

    // Use the same file upload logic as the regular profile injection
    await uploadFileToChat(file);

    // Update button state
    button.classList.remove('loading');
    button.querySelector('span').textContent = 'Imported data injected!';

    // Reset button after delay
    setTimeout(() => {
      button.querySelector('span').textContent = 'Inject my profile';
    }, 2000);

  } catch (error) {
    console.error('Failed to inject imported data:', error);
    button.classList.remove('loading');
    button.querySelector('span').textContent = 'Injection failed';

    setTimeout(() => {
      button.querySelector('span').textContent = 'Inject my profile';
    }, 2000);
  }
}

// Reusable file upload function extracted from profile injection
async function uploadFileToChat(file) {
  const hostname = window.location.hostname;
  let fileInput = null;
  let fileInputSelectors = [];

  // Platform-specific file input selectors
  if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
    fileInputSelectors = ['input[type="file"]', 'input[accept*="text"]', 'input[accept*="json"]'];
  } else if (hostname.includes('claude.ai')) {
    fileInputSelectors = ['input[type="file"]', 'input[accept]'];
  } else if (hostname.includes('gemini.google.com')) {
    fileInputSelectors = [
      'input[type="file"]',
      'input[accept]',
      'input[accept*="application"]',
      'input[accept*="text"]',
      'input[accept*="json"]',
      'input.file-upload-input',
      '[class*="file"] input[type="file"]'
    ];
  } else if (hostname.includes('perplexity.ai')) {
    fileInputSelectors = ['input[type="file"]', 'input[accept]'];
  }

  // Try to find existing file input
  for (const selector of fileInputSelectors) {
    fileInput = document.querySelector(selector);
    if (fileInput) break;
  }

  // If no file input found, try to trigger file upload button click
  if (!fileInput) {
    console.log('No file input found, looking for upload button...');

    // Common upload button selectors
    let uploadButtonSelectors = [
      'button[aria-label*="attach" i]',
      'button[aria-label*="upload" i]',
      'button[aria-label*="file" i]',
      '[data-testid*="file" i]',
      'button svg[class*="paperclip" i]',
      'button svg[class*="attach" i]',
      'button[title*="attach" i]',
      'button[title*="upload" i]'
    ];

    // Platform-specific upload button selectors
    if (hostname.includes('gemini.google.com')) {
      uploadButtonSelectors = [
        'button[aria-label*="upload" i]',
        'button.upload-card-button',
        'button[class*="upload"]',
        'button mat-icon-button[aria-label*="upload" i]',
        ...uploadButtonSelectors
      ];
    }

    let uploadButton = null;
    for (const selector of uploadButtonSelectors) {
      uploadButton = document.querySelector(selector);
      if (uploadButton) {
        console.log('Found upload button:', uploadButton);
        uploadButton.click();

        // Wait for file input to appear
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Try multiple times to find the file input
        let attempts = 0;
        while (!fileInput && attempts < 5) {
          await new Promise(resolve => setTimeout(resolve, 200));

          // First try our specific selectors
          for (const selector of fileInputSelectors) {
            fileInput = document.querySelector(selector);
            if (fileInput) break;
          }

          // If not found, search all file inputs on the page
          if (!fileInput) {
            const allFileInputs = document.querySelectorAll('input[type="file"]');
            for (const input of allFileInputs) {
              // Check if the input is visible or recently added
              const rect = input.getBoundingClientRect();
              const isVisible = rect.width > 0 && rect.height > 0;
              const computedStyle = window.getComputedStyle(input);
              const isDisplayed = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';

              // Take any file input that's not explicitly hidden
              if (!fileInput && (isVisible || isDisplayed || input.offsetParent !== null)) {
                fileInput = input;
                console.log('Selected file input:', input);
                break;
              }
            }
          }

          attempts++;
          console.log(`File input search attempt ${attempts}, found:`, !!fileInput);
        }

        if (fileInput) {
          console.log('Found file input after', attempts, 'attempts');
        }
        break;
      }
    }
  }

  if (!fileInput) {
    throw new Error('Could not find file input on this platform');
  }

  // Upload the file
  console.log('Uploading file to:', fileInput);

  // Create a DataTransfer object with the file
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);

  // Set the files property
  fileInput.files = dataTransfer.files;

  // Trigger change event
  const changeEvent = new Event('change', { bubbles: true });
  fileInput.dispatchEvent(changeEvent);

  console.log('File uploaded successfully');
}


// Attach profile as a file
async function injectProfile(button, subprofileId = null) {
  console.log('Injecting profile...', subprofileId ? `Subprofile: ${subprofileId}` : 'Full profile');
  button.classList.add('loading');
  button.querySelector('span').textContent = 'Loading';
  
  try {
    let contextItems = [];
    let personalDescription = null;
    
    // Get personal description from storage
    const personalDescData = await chrome.storage.local.get(['personalDescription']);
    personalDescription = personalDescData.personalDescription || null;
    
    if (subprofileId) {
      // Get subprofile data
      const response = await chrome.runtime.sendMessage({ 
        type: 'GENERATE_SUBPROFILE_DATA', 
        subprofileId: subprofileId 
      });
      
      if (response?.ok && response.data) {
        // Extract context items from subprofile data
        if (response.data.contextItems) {
          contextItems = response.data.contextItems;
        }
        console.log('Found subprofile context items:', contextItems.length);
      } else {
        throw new Error('Failed to load subprofile data');
      }
    } else {
      // Get full profile context items from storage
      const result = await chrome.storage.local.get(['contextItems']);
      contextItems = result.contextItems || [];
      console.log('Found full profile context items:', contextItems.length);
    }
    
    if (contextItems.length === 0 && !personalDescription) {
      const noDataText = subprofileId ? 'Subprofile empty' : 'No profile data';
      button.querySelector('span').textContent = noDataText;
      setTimeout(() => {
        button.classList.remove('loading');
        button.querySelector('span').textContent = 'Inject my profile';
      }, 2000);
      return;
    }

    // Create profile JSON with structured data including personal description and favorites
    const profileData = {
      version: "2.3",
      timestamp: new Date().toISOString(),
      personalDescription: personalDescription,
      categories: {},
      favorites: [],
      totalItems: contextItems.length
    };

    // Group items by category and collect favorites
    contextItems.forEach(item => {
      if (!profileData.categories[item.category]) {
        profileData.categories[item.category] = [];
      }
      profileData.categories[item.category].push({
        question: item.question,
        answer: item.answer,
        isFavorite: item.isFavorite === true
      });

      // Add to favorites array if favorited
      if (item.isFavorite === true) {
        profileData.favorites.push({
          question: item.question,
          answer: item.answer,
          category: item.category
        });
      }
    });
    
    // Create a blob and file with dynamic filename
    let filename = 'my-personal-profile.json';
    if (subprofileId) {
      // Get subprofile name for filename
      try {
        const subprofileResponse = await chrome.runtime.sendMessage({ 
          type: 'LOAD_SUBPROFILES'
        });
        if (subprofileResponse?.ok && subprofileResponse.subprofiles) {
          const subprofile = subprofileResponse.subprofiles.find(s => s.id === subprofileId);
          if (subprofile && subprofile.name) {
            // Sanitize filename (remove invalid characters)
            const sanitizedName = subprofile.name.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-').toLowerCase();
            filename = `my-${sanitizedName}-profile.json`;
          }
        }
      } catch (error) {
        console.warn('Could not get subprofile name for filename:', error);
      }
    }
    const jsonBlob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
    const file = new File([jsonBlob], filename, { type: 'application/json' });
    
    // Find file input based on platform
    const hostname = window.location.hostname;
    let fileInput = null;
    let fileInputSelectors = [];
    
    // Platform-specific file input selectors
    if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      fileInputSelectors = ['input[type="file"]', 'input[accept*="text"]', 'input[accept*="json"]'];
    } else if (hostname.includes('claude.ai')) {
      fileInputSelectors = ['input[type="file"]', 'input[accept]'];
    } else if (hostname.includes('gemini.google.com')) {
      fileInputSelectors = [
        'input[type="file"]', 
        'input[accept]',
        'input[accept*="application"]',
        'input[accept*="text"]',
        'input[accept*="json"]',
        'input.file-upload-input',
        '[class*="file"] input[type="file"]'
      ];
    } else if (hostname.includes('perplexity.ai')) {
      fileInputSelectors = ['input[type="file"]', 'input[accept]'];
    }
    
    // Try to find existing file input
    for (const selector of fileInputSelectors) {
      fileInput = document.querySelector(selector);
      if (fileInput) break;
    }
    
    // If no file input found, try to trigger file upload button click
    if (!fileInput) {
      console.log('No file input found, looking for upload button...');
      
      // Common upload button selectors
      let uploadButtonSelectors = [
        'button[aria-label*="attach" i]',
        'button[aria-label*="upload" i]',
        'button[aria-label*="file" i]',
        '[data-testid*="file" i]',
        'button svg[class*="paperclip" i]',
        'button svg[class*="attach" i]',
        'button[title*="attach" i]',
        'button[title*="upload" i]'
      ];
      
      // Platform-specific upload button selectors
      if (hostname.includes('gemini.google.com')) {
        uploadButtonSelectors = [
          'button[aria-label*="upload" i]',
          'button.upload-card-button',
          'button[class*="upload"]',
          'button mat-icon-button[aria-label*="upload" i]',
          ...uploadButtonSelectors
        ];
      }
      
      let uploadButton = null;
      for (const selector of uploadButtonSelectors) {
        uploadButton = document.querySelector(selector);
        if (uploadButton) {
          console.log('Found upload button:', uploadButton);
          uploadButton.click();
          
          // Wait longer for file input to appear (Gemini needs more time)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try multiple times to find the file input
          let attempts = 0;
          while (!fileInput && attempts < 5) {
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // First try our specific selectors
            for (const selector of fileInputSelectors) {
              fileInput = document.querySelector(selector);
              if (fileInput) break;
            }
            
            // If not found, search all file inputs on the page and in shadow DOM
            if (!fileInput) {
              const allFileInputs = document.querySelectorAll('input[type="file"]');
              console.log(`Found ${allFileInputs.length} file inputs on page:`, allFileInputs);
              
              // Also check for shadow DOM inputs
              const shadowHosts = document.querySelectorAll('*');
              for (const host of shadowHosts) {
                if (host.shadowRoot) {
                  const shadowFileInputs = host.shadowRoot.querySelectorAll('input[type="file"]');
                  if (shadowFileInputs.length > 0) {
                    console.log(`Found ${shadowFileInputs.length} file inputs in shadow DOM of:`, host);
                    allFileInputs.push(...shadowFileInputs);
                  }
                }
              }
              
              for (const input of allFileInputs) {
                // Check if the input is visible or recently added
                const rect = input.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0;
                const computedStyle = window.getComputedStyle(input);
                const isDisplayed = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
                
                console.log('File input:', input, 'visible:', isVisible, 'displayed:', isDisplayed, 'style:', input.style.cssText, 'computed:', computedStyle.display);
                
                // Take any file input that's not explicitly hidden
                if (!fileInput && (isVisible || isDisplayed || input.offsetParent !== null)) {
                  fileInput = input;
                  console.log('Selected file input:', input);
                  break;
                }
              }
            }
            
            attempts++;
            console.log(`File input search attempt ${attempts}, found:`, !!fileInput);
          }
          
          if (fileInput) {
            console.log('Found file input after', attempts, 'attempts');
          }
          break;
        }
      }
    }
    
    if (!fileInput) {
      console.log('No traditional file input found, trying alternative approaches...');
      
      // Try multiple approaches for platforms like Gemini
      try {
        // Approach 1: Try to trigger Gemini's native file handler
        if (hostname.includes('gemini.google.com')) {
          console.log('Attempting Gemini-specific file handling...');
          
          // Look for Gemini's file upload zone more specifically
          const fileUploadZones = document.querySelectorAll('[class*="drop"], [class*="upload"], [data-testid*="file"]');
          console.log('Found file upload zones:', fileUploadZones);
          
          // Try to trigger native file selection
          const fileEvent = new Event('change', { bubbles: true });
          Object.defineProperty(fileEvent, 'target', {
            writable: false,
            value: { files: [file] }
          });
          
          // Dispatch to various potential targets
          for (const zone of fileUploadZones) {
            zone.dispatchEvent(fileEvent);
          }
          
          // Also try dispatching to the upload button
          const uploadBtn = document.querySelector('button[aria-label*="upload" i]');
          if (uploadBtn) {
            uploadBtn.dispatchEvent(fileEvent);
          }
        }
        
        // Approach 2: Enhanced drag-and-drop approach
        let dropTarget = null;
        
        if (hostname.includes('gemini.google.com')) {
          // Try various drop targets for Gemini in order of preference
          dropTarget = document.querySelector('[class*="input-area"][class*="drop"]') ||
                      document.querySelector('.input-area') ||
                      document.querySelector('[class*="input-area"]') ||
                      document.querySelector('[class*="upload-zone"]') ||
                      document.querySelector('.text-input-field') ||
                      document.querySelector('[contenteditable="true"]') ||
                      document.body;
        }
        
        if (dropTarget) {
          console.log('Using drop target:', dropTarget);
          
          // Create more realistic file for drag-and-drop
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          
          // Create and dispatch drag events with proper event handling
          const dragEnterEvent = new DragEvent('dragenter', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
          });
          
          const dragOverEvent = new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
          });
          
          const dropEvent = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
          });
          
          // Prevent default handling to allow our custom drop
          dropTarget.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
          }, { once: true });
          
          dropTarget.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
          }, { once: true });
          
          dropTarget.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Drop event intercepted:', e);
          }, { once: true });
          
          // Dispatch the events in sequence with delays
          dropTarget.dispatchEvent(dragEnterEvent);
          await new Promise(resolve => setTimeout(resolve, 100));
          dropTarget.dispatchEvent(dragOverEvent);
          await new Promise(resolve => setTimeout(resolve, 100));
          dropTarget.dispatchEvent(dropEvent);
          
          console.log('Dispatched drag-and-drop events');
          
          // Approach 3: Try clipboard paste approach as final fallback
          setTimeout(async () => {
            console.log('Trying clipboard paste approach...');
            try {
              const clipboardData = new DataTransfer();
              clipboardData.items.add(file);
              
              const pasteEvent = new ClipboardEvent('paste', {
                bubbles: true,
                cancelable: true,
                clipboardData: clipboardData
              });
              
              const focusElement = document.querySelector('[contenteditable="true"]') || dropTarget;
              focusElement.focus();
              focusElement.dispatchEvent(pasteEvent);
              console.log('Dispatched paste event');
            } catch (pasteError) {
              console.log('Clipboard paste failed:', pasteError);
            }
          }, 500);
          
          // Success feedback
          const successText = subprofileId ? 'Subprofile injected!' : 'Profile injected!';
          button.querySelector('span').textContent = successText;
          button.classList.add('success');
          
          setTimeout(() => {
            button.style.display = 'none';
            // Find and remove from injected buttons map
            const inputElement = document.querySelector('div[contenteditable="true"]');
            if (inputElement && injectedButtons.has(inputElement)) {
              injectedButtons.delete(inputElement);
            }
          }, 1500);
          
          return; // Exit successfully
        }
      } catch (dragError) {
        console.error('Drag-and-drop approach failed:', dragError);
      }
      
      console.error('No file input or drop target found');
      button.classList.remove('loading');
      button.querySelector('span').textContent = 'No file support';
      setTimeout(() => {
        button.querySelector('span').textContent = 'Attach my profile';
      }, 2000);
      return;
    }
    
    console.log('Found file input:', fileInput);
    
    // Create a DataTransfer object and add our file
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    // Set the files on the input
    fileInput.files = dataTransfer.files;
    
    // Trigger change and input events
    const changeEvent = new Event('change', { bubbles: true });
    const inputEvent = new Event('input', { bubbles: true });
    fileInput.dispatchEvent(changeEvent);
    fileInput.dispatchEvent(inputEvent);
    
    // Success feedback
    const successText = subprofileId ? 'Subprofile injected!' : 'Profile injected!';
    button.querySelector('span').textContent = successText;
    button.classList.add('success');
    
    setTimeout(() => {
      // Hide the button after successful attachment
      button.style.display = 'none';
      // Also remove from the injected buttons map so it can be recreated later
      for (const [input, btn] of injectedButtons) {
        if (btn === button) {
          injectedButtons.delete(input);
          break;
        }
      }
    }, 1500);
    
  } catch (error) {
    console.error('Error attaching profile:', error);
    button.classList.remove('loading');
    button.querySelector('span').textContent = 'Error';
    
    setTimeout(() => {
      button.querySelector('span').textContent = 'Attach my profile';
    }, 2000);
  }
}

// Find the nearest input element to a button
function findNearestInput(button) {
  const hostname = window.location.hostname;
  const config = AI_PLATFORMS[hostname] || AI_PLATFORMS.default;
  const inputs = document.querySelectorAll(config.selector);
  
  console.log('Searching for inputs with selector:', config.selector);
  console.log('Found potential inputs:', inputs.length);
  
  // Find the first valid input
  for (const input of inputs) {
    if (isValidInput(input)) {
      console.log('Found valid input:', input);
      return input;
    }
  }
  
  return null;
}

// Load auto-injection settings from storage
async function loadAutoInjectSettings() {
  try {
    const result = await chrome.storage.local.get(['autoInjectSettings']);
    if (result.autoInjectSettings) {
      autoInjectSettings = { ...autoInjectSettings, ...result.autoInjectSettings };
      console.log('🔧 Loaded auto-inject settings:', autoInjectSettings);
    }
  } catch (error) {
    console.error('Error loading auto-inject settings:', error);
  }
}

// Auto-inject profile when enabled
async function autoInjectProfile() {
  console.log('🔍 === AUTO-INJECT DEBUG START ===');
  console.log('autoInjectSettings:', autoInjectSettings);
  console.log('hasAutoInjected:', hasAutoInjected);
  console.log('isNewChatState():', isNewChatState());
  console.log('Current URL:', window.location.href);
  console.log('Stack trace:', new Error().stack);
  
  if (!autoInjectSettings.enabled) {
    console.log('❌ Auto-injection disabled, returning');
    return;
  }
  
  if (!isNewChatState()) {
    console.log('❌ Not in new chat state, returning');
    return;
  }
  
  // Simple check: if we've already auto-injected, never do it again
  if (hasAutoInjected) {
    console.log('🚫 Auto-injection already performed, skipping');
    console.log('🔍 === AUTO-INJECT DEBUG END (SKIPPED) ===');
    return;
  }
  
  console.log('🤖 Auto-injection enabled, scheduling injection in', autoInjectSettings.delay, 'seconds');
  
  // Mark that we're about to auto-inject (prevent multiple timeouts)
  hasAutoInjected = true;
  console.log('✅ Set hasAutoInjected to true');
  
  const timeoutId = setTimeout(async () => {
    console.log('🔥 === AUTO-INJECT TIMEOUT FIRED ===');
    console.log('hasAutoInjected at timeout:', hasAutoInjected);
    
    autoInjectTimeouts.delete(timeoutId);
    
    try {
      // Double-check we're still in new chat state
      if (!isNewChatState()) {
        console.log('🚫 No longer in new chat state, canceling auto-injection');
        return;
      }
      
      console.log('🚀 Performing auto-injection...');
      
      // Get the active subprofile ID from storage
      const result = await chrome.storage.local.get(['activeSubprofileId']);
      const subprofileId = result.activeSubprofileId || null;
      
      // Find a valid input field
      const hostname = window.location.hostname;
      const config = AI_PLATFORMS[hostname] || AI_PLATFORMS.default;
      const inputs = document.querySelectorAll(config.selector);
      
      let targetInput = null;
      for (const input of inputs) {
        if (isValidInput(input)) {
          targetInput = input;
          break;
        }
      }
      
      if (!targetInput) {
        console.error('🚫 No valid input found for auto-injection');
        return;
      }
      
      // Perform the injection using existing logic
      console.log('📝 Auto-injecting into input:', targetInput);
      await performDirectInjection(targetInput, subprofileId);
      
      console.log('✅ Auto-injection completed - will not auto-inject again until extension reload');
      
    } catch (error) {
      console.error('❌ Auto-injection failed:', error);
    }
  }, autoInjectSettings.delay * 1000);
  
  autoInjectTimeouts.add(timeoutId);
}

// Perform direct file injection (for auto-injection) - same as manual injection
async function performDirectInjection(inputElement, subprofileId = null) {
  console.log('📎 Performing direct injection...', subprofileId ? `Subprofile: ${subprofileId}` : 'Full profile');
  
  try {
    let contextItems = [];
    let personalDescription = null;
    
    // Get personal description from storage
    const personalDescData = await chrome.storage.local.get(['personalDescription']);
    personalDescription = personalDescData.personalDescription || null;
    
    if (subprofileId) {
      // Get subprofile data
      const response = await chrome.runtime.sendMessage({ 
        type: 'GENERATE_SUBPROFILE_DATA', 
        subprofileId: subprofileId 
      });
      
      if (response?.ok && response.data) {
        if (response.data.contextItems) {
          contextItems = response.data.contextItems;
        }
        console.log('Found subprofile context items:', contextItems.length);
      } else {
        throw new Error('Failed to load subprofile data');
      }
    } else {
      // Get full profile context items from storage
      const result = await chrome.storage.local.get(['contextItems']);
      contextItems = result.contextItems || [];
      console.log('Found full profile context items:', contextItems.length);
    }
    
    if (contextItems.length === 0 && !personalDescription) {
      console.log('⚠️ No profile data to inject');
      return;
    }

    // Create profile JSON with structured data including personal description and favorites
    const profileData = {
      version: "2.3",
      timestamp: new Date().toISOString(),
      personalDescription: personalDescription,
      categories: {},
      favorites: [],
      totalItems: contextItems.length
    };

    // Group items by category and collect favorites
    contextItems.forEach(item => {
      if (!profileData.categories[item.category]) {
        profileData.categories[item.category] = [];
      }
      profileData.categories[item.category].push({
        question: item.question,
        answer: item.answer,
        isFavorite: item.isFavorite === true
      });

      // Add to favorites array if favorited
      if (item.isFavorite === true) {
        profileData.favorites.push({
          question: item.question,
          answer: item.answer,
          category: item.category
        });
      }
    });
    
    // Create a blob and file with dynamic filename
    let filename = 'my-personal-profile.json';
    if (subprofileId) {
      // Get subprofile name for filename
      try {
        const subprofileResponse = await chrome.runtime.sendMessage({ 
          type: 'LOAD_SUBPROFILES'
        });
        if (subprofileResponse?.ok && subprofileResponse.subprofiles) {
          const subprofile = subprofileResponse.subprofiles.find(s => s.id === subprofileId);
          if (subprofile && subprofile.name) {
            // Sanitize filename (remove invalid characters)
            const sanitizedName = subprofile.name.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-').toLowerCase();
            filename = `my-${sanitizedName}-profile.json`;
          }
        }
      } catch (error) {
        console.warn('Could not get subprofile name for filename:', error);
      }
    }
    const jsonBlob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
    const file = new File([jsonBlob], filename, { type: 'application/json' });
    
    console.log('📄 Created profile JSON file:', file.name, 'Size:', file.size, 'bytes');
    
    // Use the same file attachment logic as manual injection
    const success = await attachFileToInput(file);
    
    if (success) {
      console.log('✅ Auto-injection file attachment successful');
    } else {
      console.error('❌ Auto-injection file attachment failed');
    }
    
  } catch (error) {
    console.error('❌ Direct file injection failed:', error);
  }
}

// Attach file to input using the same logic as manual injection
async function attachFileToInput(file) {
  const hostname = window.location.hostname;
  let fileInput = null;
  let fileInputSelectors = [];
  
  // Platform-specific file input selectors (same as manual injection)
  if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
    fileInputSelectors = ['input[type="file"]', 'input[accept*="text"]', 'input[accept*="json"]'];
  } else if (hostname.includes('claude.ai')) {
    fileInputSelectors = ['input[type="file"]', 'input[accept]'];
  } else if (hostname.includes('gemini.google.com')) {
    fileInputSelectors = [
      'input[type="file"]', 
      'input[accept]',
      'input[accept*="application"]',
      'input[accept*="text"]',
      'input[accept*="json"]',
      'input.file-upload-input',
      '[class*="file"] input[type="file"]'
    ];
  } else if (hostname.includes('perplexity.ai')) {
    fileInputSelectors = ['input[type="file"]', 'input[accept]'];
  }
  
  // Try to find existing file input
  for (const selector of fileInputSelectors) {
    fileInput = document.querySelector(selector);
    if (fileInput) break;
  }
  
  // If no file input found, try to trigger file upload button click
  if (!fileInput) {
    console.log('🔍 No file input found, looking for upload button...');
    
    // Common upload button selectors (same as manual injection)
    let uploadButtonSelectors = [
      'button[aria-label*="attach" i]',
      'button[aria-label*="upload" i]',
      'button[aria-label*="file" i]',
      '[data-testid*="file" i]',
      'button svg[class*="paperclip" i]',
      'button svg[class*="attach" i]',
      'button[title*="attach" i]',
      'button[title*="upload" i]'
    ];
    
    // Platform-specific upload button selectors
    if (hostname.includes('gemini.google.com')) {
      uploadButtonSelectors = [
        'button[aria-label*="upload" i]',
        'button.upload-card-button',
        'button[class*="upload"]',
        'button mat-icon-button[aria-label*="upload" i]',
        ...uploadButtonSelectors
      ];
    }
    
    let uploadButton = null;
    for (const selector of uploadButtonSelectors) {
      uploadButton = document.querySelector(selector);
      if (uploadButton) {
        console.log('📤 Found upload button:', uploadButton);
        uploadButton.click();
        
        // Wait for file input to appear
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to find file input again
        for (const selector of fileInputSelectors) {
          fileInput = document.querySelector(selector);
          if (fileInput) break;
        }
        break;
      }
    }
  }
  
  if (!fileInput) {
    console.error('❌ No file input or upload mechanism found');
    return false;
  }
  
  console.log('📎 Found file input:', fileInput);
  
  // Create a DataTransfer object and add our file
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  
  // Set the files on the input
  fileInput.files = dataTransfer.files;
  
  // Trigger change and input events
  const changeEvent = new Event('change', { bubbles: true });
  const inputEvent = new Event('input', { bubbles: true });
  fileInput.dispatchEvent(changeEvent);
  fileInput.dispatchEvent(inputEvent);
  
  console.log('✅ File attached and events triggered');
  return true;
}

// Clear auto-injection timeouts
function clearAutoInjectTimeouts() {
  autoInjectTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  autoInjectTimeouts.clear();
  console.log('🧹 Cleared auto-injection timeouts');
}

// Check if we're in a new chat state
function isNewChatState() {
  const hostname = window.location.hostname;
  
  if (hostname.includes('claude.ai')) {
    // For Claude.ai, check multiple indicators of a new chat
    const indicators = {
      // Check if URL is the base URL or a new chat URL
      isNewChatUrl: window.location.pathname === '/' ||
                   window.location.pathname === '/chat' ||
                   window.location.pathname === '/new' ||
                   window.location.pathname.startsWith('/chat/new'),
      
      // Check if there are no existing messages in the conversation
      // Look for more specific Claude.ai message indicators
      hasNoMessages: document.querySelectorAll(
        '[data-testid*="conversation"], .conversation, [class*="message"], [class*="Message"], ' +
        '[role="article"], article, [data-testid*="message"], ' +
        '.prose, [class*="prose"], [class*="chat"], [data-testid*="chat"]'
      ).length === 0,
      
      // Check for empty state indicators - more specific to Claude
      hasEmptyState: document.querySelector(
        '[class*="empty"], [class*="welcome"], [data-testid*="empty"], ' +
        '[class*="onboarding"], [class*="start"], [class*="new-chat"], [class*="placeholder"]'
      ) !== null,
      
      // Check if there's a chat history in the URL (Claude uses /chat/{chat-id})
      isExistingChatUrl: /\/chat\/[a-zA-Z0-9-]+/.test(window.location.pathname),
      
      // Check if the input is clean/empty
      hasEmptyInput: true // We'll check this below
    };
    
    // Check if the main input is empty
    const inputs = document.querySelectorAll('div[contenteditable="true"], textarea');
    for (const input of inputs) {
      const text = input.textContent || input.value || '';
      if (text.trim().length > 0) {
        indicators.hasEmptyInput = false;
        break;
      }
    }
    
    // More lenient detection: New chat if it's a new URL OR no messages are visible
    const isNewChat = indicators.isNewChatUrl || 
                     (indicators.hasNoMessages && !indicators.isExistingChatUrl) ||
                     (indicators.hasNoMessages && indicators.hasEmptyState);
    
    console.log('🔍 New chat state check:', {
      ...indicators,
      finalDecision: isNewChat,
      url: window.location.href
    });
    
    return isNewChat;
  }
  
  // For other platforms, use similar logic
  if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
    return window.location.pathname === '/' || 
           document.querySelectorAll('[data-testid*="conversation-turn"]').length === 0;
  }
  
  if (hostname.includes('gemini.google.com')) {
    return document.querySelectorAll('[class*="conversation"], [class*="message"]').length === 0;
  }
  
  // Default: assume it's always a new chat for other platforms
  return true;
}

// Add inject buttons to input fields
function addInjectButtons(forceCleanup = false, skipNewChatCheck = false) {
  console.log('🎯 === ADD INJECT BUTTONS CALLED ===');
  console.log('Stack trace:', new Error().stack);
  
  const hostname = window.location.hostname;
  const config = AI_PLATFORMS[hostname] || AI_PLATFORMS.default;
  
  console.log('Looking for inputs on', hostname, 'with selector:', config.selector);
  
  // Check if we're in a new chat state (unless we're skipping this check)
  if (!skipNewChatCheck && !isNewChatState()) {
    console.log('🚫 Not in a new chat state, skipping button creation');
    // Remove any existing buttons since we're no longer in new chat mode (but not immediately)
    const existingButtons = document.querySelectorAll('.prompt-profile-inject-container');
    if (existingButtons.length > 0) {
      console.log('🧹 Removing buttons - no longer in new chat state');
      removeAllInjectButtons('not in new chat state', false); // Don't force immediate removal
    }
    // Clear any pending auto-injection timeouts
    clearAutoInjectTimeouts();
    return;
  }
  
  console.log('✅ In new chat state, checking auto-injection settings...');
  
  // If auto-injection is enabled, don't show buttons and trigger auto-injection instead
  if (autoInjectSettings.enabled) {
    console.log('🤖 Auto-injection enabled, skipping button creation');
    // Remove any existing buttons
    const existingButtons = document.querySelectorAll('.prompt-profile-inject-container');
    if (existingButtons.length > 0) {
      console.log('🧹 Removing buttons - auto-injection is enabled');
      removeAllInjectButtons('auto-injection enabled', true);
    }
    
    // BUT STILL SET UP /prompt COMMAND LISTENERS on all inputs!
    console.log('⚡ Setting up /prompt command listeners even with auto-injection enabled...');
    const autoInjectionInputs = document.querySelectorAll(config.selector);
    autoInjectionInputs.forEach(input => {
      // Check if we already set up prompt listeners for this input
      if (!input.hasPromptListener) {
        console.log('🎧 Setting up /prompt command listener for input:', input);
        setupPromptCommandListener(input);
        input.hasPromptListener = true; // Mark to avoid duplicate setup
      }
    });
    
    // Trigger auto-injection
    console.log('📍 CALLER: addInjectButtons() triggering autoInjectProfile');
    autoInjectProfile();
    return;
  }
  
  console.log('🔘 Auto-injection disabled, proceeding with button creation');
  
  // Check if we already have buttons before cleaning up
  const existingButtons = document.querySelectorAll('.prompt-profile-inject-container');
  console.log('Found', existingButtons.length, 'existing buttons');
  
  // Only clean up if forced or if we have too many existing buttons
  if (forceCleanup || existingButtons.length > 1) {
    console.log('Cleaning up existing buttons...');
    const reason = forceCleanup ? 'forced cleanup' : `duplicate buttons (${existingButtons.length})`;
    removeAllInjectButtons(reason);
  }
  
  const inputs = document.querySelectorAll(config.selector);
  console.log('Found', inputs.length, 'potential input elements');
  
  let buttonAdded = false;
  
  inputs.forEach((input, index) => {
    console.log(`Processing input ${index + 1}/${inputs.length}:`, input);
    
    // Check if we already have a button for this input (using both WeakMap and DOM check)
    const hasExistingButtonInMap = injectedButtons.has(input);

    // Check if button exists in DOM - look globally since buttons are positioned absolutely
    let hasExistingButtonInDom = false;

    // First, get the button from WeakMap if it exists
    const buttonFromMap = injectedButtons.get(input);
    if (buttonFromMap) {
      // Check if the button from WeakMap still exists in DOM
      hasExistingButtonInDom = document.body.contains(buttonFromMap);
      if (!hasExistingButtonInDom) {
        // Button was removed from DOM but WeakMap is stale - clean it up
        console.log('🧹 Cleaning up stale WeakMap entry - button no longer in DOM');
        injectedButtons.delete(input);
      }
    }

    // If no button in WeakMap, do a broader DOM search
    if (!hasExistingButtonInDom) {
      // Look for any button container that might be associated with this input
      // Check by proximity or by checking which input the button is positioned near
      const allButtons = document.querySelectorAll('.prompt-profile-inject-container');
      for (const button of allButtons) {
        // Check if this button is positioned near this input (simple heuristic)
        const buttonRect = button.getBoundingClientRect();
        const inputRect = input.getBoundingClientRect();
        const distance = Math.abs(buttonRect.top - inputRect.top) + Math.abs(buttonRect.left - inputRect.left);
        if (distance < 100) { // Within 100px - likely the same input
          hasExistingButtonInDom = true;
          // Update WeakMap to fix the inconsistency
          injectedButtons.set(input, button);
          break;
        }
      }
    }

    const hasExistingButton = hasExistingButtonInMap || hasExistingButtonInDom;

    console.log('Has existing button:', hasExistingButton, '(map:', hasExistingButtonInMap, ', dom:', hasExistingButtonInDom, ')');

    if (hasExistingButton) {
      console.log('Skipping: Button already exists for this input');
      // Update WeakMap if DOM has button but map doesn't
      if (!hasExistingButtonInMap && hasExistingButtonInDom) {
        const existingButton = input.parentElement.querySelector('.prompt-profile-inject-container');
        injectedButtons.set(input, existingButton);
      }
      return;
    }
    
    // Set up prompt command listener for this input
    console.log('🎧 Setting up /prompt command listener for input:', input);
    setupPromptCommandListener(input);
    
    // Skip small inputs (likely not for prompts) - but be more lenient for contenteditable
    const rect = input.getBoundingClientRect();
    console.log('Input dimensions:', rect.width, 'x', rect.height);
    
    if (input.tagName !== 'DIV' && (rect.width < 200 || rect.height < 40)) {
      console.log('Skipping: Input too small:', rect.width, 'x', rect.height);
      return;
    }
    
    // Skip hidden or invisible inputs
    const isValid = isValidInput(input);
    console.log('Input valid:', isValid);
    
    if (!isValid) {
      console.log('Skipping: Input not valid (hidden or disabled)');
      return;
    }
    
    console.log('✓ Adding button for valid input:', input);
    
    // Create and position the button
    const button = createInjectButton();
    document.body.appendChild(button);
    
    // Record the time when button was created
    lastButtonCreateTime = Date.now();
    
    // Position the button
    positionButton(button, input);
    
    // Store reference
    injectedButtons.set(input, button);
    buttonAdded = true;
    
    // Reposition on window resize/scroll
    const reposition = () => {
      if (document.body.contains(button) && document.body.contains(input)) {
        positionButton(button, input);
      }
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition);
    
    // Update position when input is focused (in case of animations)
    input.addEventListener('focus', () => {
      setTimeout(() => positionButton(button, input), 100);
    });
    
    // Watch for parent container changes (especially for dynamic layouts)
    const observer = new MutationObserver(() => {
      if (document.body.contains(button) && document.body.contains(input)) {
        requestAnimationFrame(() => positionButton(button, input));
      }
    });
    
    // Observe the input's parent for size/position changes
    if (input.parentElement) {
      observer.observe(input.parentElement, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        childList: false,
        subtree: false
      });
    }
    
    // Monitor for message sending instead of just typing
    // Look for send button clicks or enter key presses that actually send messages
    const monitorForMessageSending = () => {
      // Listen for send button clicks
      const sendButtons = document.querySelectorAll('button[data-testid*="send"], button[aria-label*="send" i], button[type="submit"], [data-testid*="send-button"]');
      sendButtons.forEach(sendBtn => {
        if (!sendBtn.hasInjectionListener) {
          sendBtn.hasInjectionListener = true;
          sendBtn.addEventListener('click', () => {
            console.log('📤 Send button clicked, hiding inject button');
            if (button && button.style.display !== 'none') {
              button.style.display = 'none';
              if (injectedButtons.has(input)) {
                injectedButtons.delete(input);
              }
            }
          });
        }
      });

      // Listen for Enter key that sends message (Ctrl+Enter or just Enter depending on platform)
      if (!input.hasEnterListener) {
        input.hasEnterListener = true;
        input.addEventListener('keydown', (e) => {
          const isEnterToSend = e.key === 'Enter' && !e.shiftKey;
          const isCtrlEnterToSend = e.key === 'Enter' && (e.ctrlKey || e.metaKey);

          if (isEnterToSend || isCtrlEnterToSend) {
            // Check if input has content that would be sent
            const hasContent = input.tagName === 'TEXTAREA' || input.tagName === 'INPUT'
              ? input.value.trim().length > 0
              : input.textContent.trim().length > 0;

            if (hasContent) {
              console.log('⌨️ Enter pressed to send message, hiding inject button');
              setTimeout(() => {
                if (button && button.style.display !== 'none') {
                  button.style.display = 'none';
                  if (injectedButtons.has(input)) {
                    injectedButtons.delete(input);
                  }
                }
              }, 100);
            }
          }
        });
      }
    };

    // Initial setup and periodic re-setup for dynamically added send buttons
    monitorForMessageSending();
    const sendButtonInterval = setInterval(monitorForMessageSending, 2000);

    // Clean up interval when button is removed
    if (button) {
      button.sendButtonInterval = sendButtonInterval;
    }
  });
  
  if (buttonAdded) {
    console.log('Successfully added inject button(s)');
  } else {
    console.log('No suitable inputs found for inject button');
  }
}

// Reset all state for a truly fresh start
function resetAllState(reason = 'unknown') {
  console.log('🔄 === RESETTING ALL STATE ===', reason);

  // Reset auto-injection flag
  hasAutoInjected = false;

  // Clear any pending auto-injection timeouts
  clearAutoInjectTimeouts();

  // Reset last button create time to prevent delays
  lastButtonCreateTime = 0;

  console.log('✅ All state reset complete');
}

// Debug function to analyze current button state
function debugButtonState(context = 'unknown') {
  const allButtons = document.querySelectorAll('.prompt-profile-inject-container');
  const hostname = window.location.hostname;
  const config = AI_PLATFORMS[hostname] || AI_PLATFORMS.default;
  const inputs = document.querySelectorAll(config.selector);

  console.log(`🐛 DEBUG BUTTON STATE (${context}):`);
  console.log('  DOM buttons found:', allButtons.length);
  console.log('  Valid inputs found:', inputs.length);

  inputs.forEach((input, index) => {
    const hasButtonInMap = injectedButtons.has(input);
    const hasButtonInDom = input.parentElement && input.parentElement.querySelector('.prompt-profile-inject-container') !== null;
    console.log(`  Input ${index + 1}: map=${hasButtonInMap}, dom=${hasButtonInDom}, element=`, input);
  });

  allButtons.forEach((button, index) => {
    console.log(`  Button ${index + 1}: id=${button.id}, parent=`, button.parentElement);
  });

  console.log('  URL:', window.location.href);
  console.log('  isNewChatState:', isNewChatState());
}

// Remove all injection buttons and clear the tracking map
function removeAllInjectButtons(reason = 'unknown', force = false) {
  const timeSinceLastCreate = Date.now() - lastButtonCreateTime;
  const minTimeBeforeRemoval = 3000; // 3 seconds minimum
  
  if (!force && timeSinceLastCreate < minTimeBeforeRemoval) {
    console.log(`⏳ Delaying button removal (${reason}) - only ${timeSinceLastCreate}ms since creation. Waiting ${minTimeBeforeRemoval - timeSinceLastCreate}ms more.`);
    setTimeout(() => {
      removeAllInjectButtons(reason, true);
    }, minTimeBeforeRemoval - timeSinceLastCreate);
    return;
  }
  
  console.log('🗑️ Removing all inject buttons. Reason:', reason);
  console.trace('Button removal stack trace:');

  // Debug state before removal
  debugButtonState(`before removal - ${reason}`);

  // Special logging for navigation-related removals
  if (reason.includes('navigated') || reason.includes('URL change') || reason.includes('forced cleanup')) {
    console.log('🚨 NAVIGATION-RELATED BUTTON REMOVAL DETECTED!');
    console.log('🚨 This might be the cause of the "second chat" disappearance');
    console.log('🚨 Current URL:', window.location.href);
    console.log('🚨 Timestamp:', new Date().toISOString());
  }
  
  // Remove all button containers from DOM and clean up WeakMap references
  document.querySelectorAll('.prompt-profile-inject-container').forEach(container => {
    console.log('Removing button container:', container.id);

    // Clean up any intervals associated with this button
    const button = container.querySelector('.prompt-profile-inject-btn');
    if (button && button.sendButtonInterval) {
      clearInterval(button.sendButtonInterval);
      console.log('Cleared send button monitoring interval');
    }

    container.remove();
  });

  // Clean up ALL WeakMap entries to prevent stale references
  // Since we're removing all buttons, we need to clear all WeakMap entries
  const allInputs = document.querySelectorAll('div[contenteditable="true"], textarea, input');
  allInputs.forEach(input => {
    if (injectedButtons.has(input)) {
      console.log('🧹 Cleaning up WeakMap entry for input during removeAll');
      injectedButtons.delete(input);
    }
  });

  // Also remove standalone buttons (in case some exist)
  document.querySelectorAll('.prompt-profile-inject-btn').forEach(button => {
    console.log('Removing standalone button');
    button.remove();
  });
  
  // Note: WeakMap doesn't have clear() method, but entries will be garbage collected when DOM elements are removed
  
  console.log('All inject buttons removed');
}

// Remove buttons for inputs that no longer exist or when chat state changes
function cleanupButtons() {
  console.log('🧹 cleanupButtons called');
  
  const hostname = window.location.hostname;
  const config = AI_PLATFORMS[hostname] || AI_PLATFORMS.default;
  const inputs = document.querySelectorAll(config.selector);
  
  console.log('Cleanup: found', inputs.length, 'potential inputs');
  
  let validInputs = [];
  for (const input of inputs) {
    if (isValidInput(input)) {
      validInputs.push(input);
    }
  }
  
  console.log('Cleanup: found', validInputs.length, 'valid inputs');
  
  // Be more conservative - only remove buttons if there are definitely no valid inputs
  // AND if we haven't just added buttons recently
  const existingButtons = document.querySelectorAll('.prompt-profile-inject-container');
  console.log('Cleanup: found', existingButtons.length, 'existing buttons');
  
  if (validInputs.length === 0 && existingButtons.length > 0) {
    // Wait a bit to see if inputs appear (they might be loading)
    console.log('⏳ No valid inputs found, waiting 2 seconds before cleanup...');
    setTimeout(() => {
      // Double-check after waiting
      const recheckInputs = document.querySelectorAll(config.selector);
      let recheckValidInputs = 0;
      for (const input of recheckInputs) {
        if (isValidInput(input)) {
          recheckValidInputs++;
        }
      }
      
      if (recheckValidInputs === 0) {
        console.log('🗑️ Still no valid inputs after wait, removing buttons');
        removeAllInjectButtons('no valid inputs after wait');
      } else {
        console.log('✅ Found valid inputs after wait, keeping buttons');
      }
    }, 2000);
  } else {
    console.log('✅ Valid inputs exist or no buttons to clean up');
  }
}

// Original insertion function (keep for compatibility)
function insertIntoElement(el, text) {
  if (!el) return false;
  
  console.log('Inserting into element:', el.tagName, el.className);
  
  const isContentEditable = el.isContentEditable || el.contentEditable === 'true';
  if (isContentEditable) {
    el.focus();
    
    // Special handling for ProseMirror editors (like Claude)
    if (el.classList.contains('ProseMirror') || el.className.includes('prose')) {
      console.log('Using ProseMirror insertion method');
      const existingText = el.innerText.trim();
      const separator = existingText ? '\n\n---\n\n' : '';
      const newText = existingText + separator + text;
      
      // Clear and set new text
      el.innerText = newText;
      
      // Trigger multiple events to ensure editor updates
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new InputEvent('input', { 
        bubbles: true, 
        cancelable: true,
        inputType: 'insertText',
        data: text 
      }));
      
      // Also try setting via textContent for some editors
      if (el.textContent !== newText) {
        el.textContent = newText;
      }
      
      return true;
    }
    
    // Standard contentEditable handling
    console.log('Using standard contentEditable insertion');
    const existingText = el.innerText.trim();
    const separator = existingText ? '\n\n---\n\n' : '';
    const newText = existingText + separator + text;
    el.innerText = newText;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  
  // Standard input/textarea handling
  if (typeof el.value === 'string') {
    console.log('Using value-based insertion');
    const existingText = el.value.trim();
    const separator = existingText ? '\n\n---\n\n' : '';
    const newText = existingText + separator + text;
    
    el.value = newText;
    el.selectionStart = el.selectionEnd = newText.length;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  
  console.log('Could not insert - element type not supported');
  return false;
}

// Check if an input is valid
function isValidInput(el) {
  if (!el) return false;
  
  // Check if element is visible
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }
  
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  
  // Check if it's disabled or readonly
  if (el.disabled || el.readOnly) return false;
  
  // Check if it's a valid input type
  const isValid = (
    el.tagName === 'TEXTAREA' ||
    el.isContentEditable ||
    el.contentEditable === 'true' ||
    (el.tagName === 'INPUT' && ['text', 'search'].includes(el.type))
  );
  
  return isValid;
}

// Original site adapters and functions (keep for compatibility with popup)
const SITE_ADAPTERS = {
  'chat.openai.com': {
    selectors: [
      '#prompt-textarea',
      'textarea[data-id="root"]',
      'div[contenteditable="true"][data-id="root"]',
      'textarea[placeholder*="Message"]'
    ],
    insertMethod: 'value'
  },
  'claude.ai': {
    selectors: [
      'div.ProseMirror',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"].ProseMirror',
      'div[contenteditable="true"]',
      'fieldset div[contenteditable="true"]'
    ],
    insertMethod: 'contentEditable'
  },
  'gemini.google.com': {
    selectors: [
      'div[contenteditable="true"][data-test-id="input-area"]',
      'rich-textarea[placeholder*="Enter a prompt"]',
      'div[contenteditable="true"]'
    ],
    insertMethod: 'contentEditable'
  },
  'www.perplexity.ai': {
    selectors: [
      'textarea[placeholder*="Ask anything"]',
      'textarea[placeholder*="Follow-up"]',
      'div[contenteditable="true"]'
    ],
    insertMethod: 'value'
  },
  'poe.com': {
    selectors: [
      'textarea[class*="TextArea"]',
      'div[contenteditable="true"]'
    ],
    insertMethod: 'value'
  }
};

function getHostname() {
  try {
    return window.location.hostname;
  } catch {
    return '';
  }
}

function findAiInput() {
  const hostname = getHostname();
  const adapter = SITE_ADAPTERS[hostname];
  
  if (adapter) {
    for (const selector of adapter.selectors) {
      const el = document.querySelector(selector);
      if (el && isValidInput(el)) {
        return { element: el, method: adapter.insertMethod };
      }
    }
  }

  // Fallback selectors for any AI site
  const fallbackSelectors = [
    'textarea[placeholder*="message" i]',
    'textarea[placeholder*="prompt" i]',
    'textarea[placeholder*="ask" i]',
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"]',
    'textarea'
  ];

  for (const selector of fallbackSelectors) {
    const el = document.querySelector(selector);
    if (el && isValidInput(el)) {
      const method = el.isContentEditable ? 'contentEditable' : 'value';
      return { element: el, method };
    }
  }

  // Final fallback to active element
  const active = document.activeElement;
  if (active && isValidInput(active)) {
    const method = active.isContentEditable ? 'contentEditable' : 'value';
    return { element: active, method };
  }

  return null;
}

// Listen for manual text insertion requests from popup
chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
  console.log('Prompt Profile Injector: Message received', msg);
  
  if (!msg) {
    console.log('Prompt Profile Injector: No message');
    return;
  }
  
  if (msg.type === 'AUTO_INJECT_SETTINGS_CHANGED') {
    console.log('🔧 Auto-inject settings changed:', msg.settings);
    autoInjectSettings = { ...autoInjectSettings, ...msg.settings };
    
    // Clear any pending timeouts
    clearAutoInjectTimeouts();
    
    // If we're in a new chat and auto-injection is now enabled, trigger it
    if (autoInjectSettings.enabled && isNewChatState()) {
      // Remove any existing buttons
      removeAllInjectButtons('settings changed - auto-injection enabled', true);
      // Trigger auto-injection
      console.log('📍 CALLER: Message listener triggering autoInjectProfile');
      autoInjectProfile();
    } else if (!autoInjectSettings.enabled && isNewChatState()) {
      // Auto-injection disabled, show buttons if appropriate
      addInjectButtons();
    }
    
    return;
  }
  
  if (msg.type !== 'INSERT_TEXT') {
    console.log('Prompt Profile Injector: Wrong message type');
    return;
  }
  
  console.log('Prompt Profile Injector: Looking for input field...');
  const input = findAiInput();
  
  if (!input) {
    console.warn('Prompt Profile Injector: No suitable input field found');
    console.log('Available elements:', {
      textareas: document.querySelectorAll('textarea'),
      contentEditables: document.querySelectorAll('[contenteditable="true"]'),
      proseMirrors: document.querySelectorAll('.ProseMirror')
    });
    return;
  }

  console.log('Prompt Profile Injector: Found input element:', input.element);
  console.log('Prompt Profile Injector: Inserting text:', msg.text);
  
  const success = insertIntoElement(input.element, msg.text || '');
  console.log('Prompt Profile Injector: Insertion result:', success);
  
  if (!success) {
    console.warn('Prompt Profile Injector: Failed to insert text');
  }
});

// Initialize and monitor for changes
async function initialize() {
  console.log('🚀 Initializing Prompt Profile Injector...');
  console.log('🌐 Current hostname:', window.location.hostname);
  
  // Load auto-injection settings
  await loadAutoInjectSettings();
  
  // Load prompt library for /prompt command
  await loadPromptLibrary();
  console.log('✅ Initialization complete - /prompt command ready!');
  
  // Wait a bit for dynamic content to load
  setTimeout(() => {
    addInjectButtons();
  }, 1000);
  
  // Try again after more time for slow-loading content
  setTimeout(() => {
    if (document.querySelectorAll('.prompt-profile-inject-container').length === 0) {
      console.log('No buttons found after 3 seconds, trying again...');
      addInjectButtons();
    }
  }, 3000);
  
  // Detect URL changes for single-page applications like Claude.ai
  let currentUrl = window.location.href;
  let previousPath = window.location.pathname;
  const urlObserver = new MutationObserver((mutations) => {
    if (window.location.href !== currentUrl) {
      console.log('🔄 URL changed from', currentUrl, 'to', window.location.href);
      const newPath = window.location.pathname;
      previousPath = new URL(currentUrl).pathname;
      currentUrl = window.location.href;
      
      // Check if new URL is a new chat and reinitialize accordingly
      const currentPath = window.location.pathname;
      const isChatRelatedPage = currentPath === '/' ||
                                currentPath === '/chat' ||
                                currentPath === '/new' ||
                                currentPath.startsWith('/chat/');

      // If navigating away from chat pages, remove buttons immediately
      if (!isChatRelatedPage) {
        console.log('📤 Navigated away from chat page, removing buttons immediately');
        const existingButtons = document.querySelectorAll('.prompt-profile-inject-container');
        if (existingButtons.length > 0) {
          removeAllInjectButtons('navigated away from chat page');
        }
        return; // Don't continue with chat-related logic
      }

      // For chat-to-chat navigation, use delay to let DOM settle
      const delay = (previousPath.startsWith('/chat') && currentPath.startsWith('/chat')) ? 2000 : 500;
      setTimeout(() => {
        console.log('🔍 Checking new chat state after URL change...');

        if (isNewChatState()) {
          console.log('✅ New URL is a new chat, checking if we need to reset state...');
          console.log('📍 Previous path:', previousPath, '→ Current path:', window.location.pathname);

          // Only force cleanup if we're coming from a different type of page
          const currentPath = window.location.pathname;
          const needsCleanup = previousPath !== currentPath &&
                              (previousPath !== '/new' || !currentPath.startsWith('/new'));

          console.log('🤔 needsCleanup:', needsCleanup, '(paths different:', previousPath !== currentPath, ')');

          if (needsCleanup) {
            console.log('🔄 Coming from different page type, resetting state');
            resetAllState('URL change to new chat from different page');
            addInjectButtons(true, true); // Force cleanup, skip new chat check
          } else {
            console.log('✅ Staying on same page type, gentle addition');
            addInjectButtons(false, true); // Don't force cleanup, skip new chat check
          }
        } else {
          // Be conservative about removing on navigation - only remove if clearly in existing conversation
          const existingButtons = document.querySelectorAll('.prompt-profile-inject-container');
          if (existingButtons.length > 0) {
            // Check if we're actually in an active conversation with messages
            const hasActiveConversation = document.querySelectorAll(
              '[data-testid*="conversation"], .conversation, [class*="message"], [class*="Message"], ' +
              '[role="article"], article, [data-testid*="message"], [data-testid*="conversation-turn"]'
            ).length > 2; // Need more than just system/welcome messages

            if (hasActiveConversation) {
              console.log('📝 Navigated to active conversation, removing button');
              removeAllInjectButtons('navigated to active conversation');
            } else {
              console.log('📝 Navigation detected but no clear conversation, keeping button');
            }
          }
        }
      }, delay); // Dynamic delay: 2000ms for chat-to-chat, 500ms for other navigation
    }
  });
  
  // Watch for changes that might indicate navigation (title changes, etc.)
  urlObserver.observe(document, { childList: true, subtree: true });
  
  // Also listen to popstate events for back/forward navigation
  window.addEventListener('popstate', () => {
    console.log('Popstate event detected, reinitializing...');
    setTimeout(() => {
      // Reset all state on navigation
      resetAllState('popstate navigation');
      addInjectButtons(true); // Force cleanup on navigation
    }, 1000);
  });
  
  // Monitor for new inputs (for SPAs and dynamic content) - but be more selective
  const observer = new MutationObserver((mutations) => {
    // Check if we need to add buttons
    let shouldCheck = false;
    let hasRemovedElements = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Check if any added nodes might be inputs
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // Element node
              if (node.matches && (
                node.matches('div[contenteditable="true"], textarea, input, fieldset, form') ||
                (node.querySelector && node.querySelector('div[contenteditable="true"], textarea, input'))
              )) {
                console.log('📝 New input-related element detected:', node.tagName);
                shouldCheck = true;
                break;
              }
            }
          }
        }
        
        // Also check if any elements were removed that might affect our buttons
        if (mutation.removedNodes.length > 0) {
          hasRemovedElements = true;
        }
      }
      if (shouldCheck) break;
    }
    
    if (shouldCheck) {
      console.log('🔄 DOM changed, checking if it\'s a new chat...');
      setTimeout(() => {
        // Only check for new chat if we're on a chat-related URL
        const currentPath = window.location.pathname;
        const isChatRelatedPage = currentPath === '/' ||
                                  currentPath === '/chat' ||
                                  currentPath === '/new' ||
                                  currentPath.startsWith('/chat/');

        if (isChatRelatedPage && isNewChatState()) {
          console.log('✅ DOM change detected new chat on chat page, adding button');
          addInjectButtons(false, true); // Don't force cleanup, skip new chat check (already verified)
        } else {
          console.log('📝 DOM change but not on chat page or not new chat, checking if buttons should be removed');
          // Be much more conservative about removing buttons on DOM changes
          const existingButtons = document.querySelectorAll('.prompt-profile-inject-container');
          if (existingButtons.length > 0) {
            // Only remove if we have clear evidence of an active conversation
            const messageElements = document.querySelectorAll(
              '[data-testid*="conversation"], .conversation, [class*="message"], [class*="Message"], ' +
              '[role="article"], article, [data-testid*="message"], [data-testid*="conversation-turn"]'
            );
            const hasVisibleMessages = Array.from(messageElements).some(el =>
              el.offsetParent !== null && // Element is visible
              (el.textContent || '').trim().length > 10 // Has substantial content
            );

            if (hasVisibleMessages) {
              console.log('📝 DOM change with visible messages, scheduling gentle removal...');
              removeAllInjectButtons('DOM change - conversation detected', false);
            } else {
              console.log('📝 DOM change but no clear conversation, keeping buttons');
            }
          }
        }
      }, 1500); // Increased delay to allow DOM to settle completely
    } else if (hasRemovedElements) {
      // Elements were removed, might affect new chat state - check later
      console.log('📤 Elements removed from DOM, will check chat state later...');
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Check periodically for new chats that might need buttons - much less aggressive
  setInterval(() => {
    // More accurate button counting - check if any valid inputs have buttons
    const hostname = window.location.hostname;
    const config = AI_PLATFORMS[hostname] || AI_PLATFORMS.default;
    const inputs = document.querySelectorAll(config.selector);

    let buttonsFoundForInputs = 0;
    inputs.forEach(input => {
      const buttonFromMap = injectedButtons.get(input);
      let hasValidButton = false;

      if (buttonFromMap) {
        // Check if button from WeakMap still exists in DOM
        hasValidButton = document.body.contains(buttonFromMap);
      }

      if (hasValidButton) {
        buttonsFoundForInputs++;
      }
    });

    const existingButtons = buttonsFoundForInputs;
    const isNewChat = isNewChatState();

    console.log('⏰ Periodic check - buttons:', existingButtons, 'inputs:', inputs.length, 'isNewChat:', isNewChat, 'hasAutoInjected:', hasAutoInjected, 'autoInjectEnabled:', autoInjectSettings.enabled);

    // Debug state during periodic check if there's a mismatch
    if ((isNewChat && existingButtons === 0) || (!isNewChat && existingButtons > 0)) {
      debugButtonState('periodic check mismatch detected');
    }

    if (isNewChat && existingButtons === 0) {
      // If auto-injection is enabled and already performed, don't do anything
      if (autoInjectSettings.enabled && hasAutoInjected) {
        console.log('✅ Periodic check: auto-injection already performed, skipping');
        return;
      }
      console.log('🔍 New chat detected without button, adding...');
      addInjectButtons(false, true); // Don't force cleanup, skip new chat check
    } else if (!isNewChat && existingButtons > 0) {
      // Be much more conservative about removing buttons - only remove if we're clearly in an active conversation
      const messageElements = document.querySelectorAll(
        '[data-testid*="conversation"], .conversation, [class*="message"], [class*="Message"], ' +
        '[role="article"], article, [data-testid*="message"], [data-testid*="conversation-turn"]'
      );
      const hasMessages = messageElements.length > 0;
      const hasTypedContent = Array.from(document.querySelectorAll('div[contenteditable="true"], textarea'))
        .some(input => (input.textContent || input.value || '').trim().length > 0);

      // Only remove if there are clearly messages AND user has typed something
      if (hasMessages && hasTypedContent) {
        console.log('📝 Clear existing conversation with content, scheduling gentle removal...');
        removeAllInjectButtons('periodic check - active conversation', false);
      } else {
        console.log('📝 Ambiguous state, keeping buttons to avoid false positives');
      }
    } else {
      console.log('✅ Periodic check: state is correct');
    }
  }, 30000); // Reduced frequency to every 30 seconds
}

// Prompt Command Functionality
function createPromptDropdown(inputElement, prompts) {
  const dropdown = document.createElement('div');
  dropdown.className = 'prompt-command-dropdown';
  dropdown.style.position = 'fixed';
  dropdown.style.display = 'none';
  
  if (prompts.length === 0) {
    dropdown.innerHTML = `
      <div class="prompt-command-empty">
        No prompts saved yet. Create prompts in the extension's Beta Lab.
      </div>
    `;
  } else {
    dropdown.innerHTML = `
      <div class="prompt-command-header">Choose a prompt</div>
      ${prompts.map((prompt, index) => `
        <div class="prompt-command-item" data-prompt-id="${prompt.id}" data-index="${index}">
          <div class="prompt-command-name">${escapeHtml(prompt.name)}</div>
          <div class="prompt-command-preview">${escapeHtml(prompt.text.substring(0, 150))}${prompt.text.length > 150 ? '...' : ''}</div>
        </div>
      `).join('')}
    `;
  }
  
  // Position the dropdown (fixed positioning relative to viewport)
  const rect = inputElement.getBoundingClientRect();
  
  dropdown.style.left = rect.left + 'px';
  dropdown.style.top = (rect.bottom + 5) + 'px';
  
  console.log('📍 Dropdown positioned at:', {
    left: rect.left + 'px',
    top: (rect.bottom + 5) + 'px',
    inputRect: rect
  });
  
  // Add click handlers
  dropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.prompt-command-item');
    if (item) {
      const promptId = item.dataset.promptId;
      const prompt = prompts.find(p => p.id === promptId);
      if (prompt) {
        insertPromptText(inputElement, prompt.text);
        hidePromptDropdown();
      }
    }
  });
  
  document.body.appendChild(dropdown);
  return dropdown;
}

async function showPromptDropdown(inputElement) {
  console.log('🎪 showPromptDropdown called');
  console.log('📚 Current prompt library:', promptLibrary);
  
  // Load prompt library if not already loaded
  if (promptLibrary.length === 0) {
    console.log('📚 Prompt library empty, attempting to load...');
    await loadPromptLibrary();
    console.log('📚 After loading, prompt library has:', promptLibrary.length, 'prompts');
  }
  
  // Hide any existing dropdown
  hidePromptDropdown();
  
  // Create new dropdown
  console.log('🎨 Creating dropdown with', promptLibrary.length, 'prompts');
  activePromptDropdown = createPromptDropdown(inputElement, promptLibrary);
  activePromptDropdown.style.display = 'block';
  console.log('✅ Dropdown created and displayed');
  
  // Add keyboard navigation
  let selectedIndex = -1;
  const items = activePromptDropdown.querySelectorAll('.prompt-command-item');
  
  function updateSelection() {
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === selectedIndex);
    });
  }
  
  function handleKeydown(e) {
    if (!activePromptDropdown || activePromptDropdown.style.display === 'none') {
      document.removeEventListener('keydown', handleKeydown);
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateSelection();
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        updateSelection();
        break;
      case 'Enter':
        if (selectedIndex >= 0 && items[selectedIndex]) {
          e.preventDefault();
          items[selectedIndex].click();
        }
        break;
      case 'Escape':
        e.preventDefault();
        hidePromptDropdown();
        break;
    }
  }
  
  document.addEventListener('keydown', handleKeydown);
  
  // Hide dropdown when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function hideOnClickOutside(e) {
      if (activePromptDropdown && !activePromptDropdown.contains(e.target)) {
        hidePromptDropdown();
        document.removeEventListener('click', hideOnClickOutside);
      }
    });
  }, 100);
}

function hidePromptDropdown() {
  if (activePromptDropdown) {
    activePromptDropdown.remove();
    activePromptDropdown = null;
  }
}

function insertPromptText(inputElement, promptText) {
  console.log('📝 Inserting prompt text:', promptText.substring(0, 100) + '...');
  console.log('📝 Into input element:', inputElement);
  
  const isContentEditable = inputElement.contentEditable === 'true';
  
  if (isContentEditable) {
    // For contenteditable elements (like Claude's ProseMirror)
    inputElement.focus();
    
    try {
      // Clear the current content completely and replace with prompt
      inputElement.innerHTML = '';
      
      // Create a text node with the prompt content
      const textNode = document.createTextNode(promptText);
      inputElement.appendChild(textNode);
      
      // Move cursor to the end
      const selection = window.getSelection();
      const range = document.createRange();
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger comprehensive events to notify Claude's editor
      const events = [
        new Event('input', { bubbles: true, cancelable: true }),
        new Event('change', { bubbles: true, cancelable: true }),
        new KeyboardEvent('keyup', { bubbles: true, cancelable: true }),
        new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: promptText })
      ];
      
      events.forEach(event => {
        inputElement.dispatchEvent(event);
      });
      
      console.log('✅ Prompt text inserted successfully using modern approach');
      
    } catch (error) {
      console.log('❌ Modern approach failed, trying fallback:', error);
      
      // Fallback: use the clipboard approach
      insertTextViaClipboard(inputElement, promptText);
    }
    
  } else {
    // For regular textarea/input elements
    const currentText = inputElement.value || '';
    const cursorPos = inputElement.selectionStart || 0;
    const beforeCursor = currentText.substring(0, cursorPos);
    const afterCursor = currentText.substring(cursorPos);
    
    // Find and replace the /prompt:tag command if it exists
    let beforePromptCommand = beforeCursor;
    let afterPromptCommand = afterCursor;

    // Look for the complete /prompt:tag pattern at the end
    const promptMatch = beforeCursor.match(/^(.*?)\/prompt:[a-zA-Z0-9\-_]+$/i);
    if (promptMatch) {
      beforePromptCommand = promptMatch[1];
      // Keep the afterCursor as is since /prompt:tag should be at the cursor position
    }
    
    const newText = beforePromptCommand + promptText + afterPromptCommand;
    inputElement.value = newText;
    
    // Set cursor position after the inserted prompt
    const newCursorPos = beforePromptCommand.length + promptText.length;
    inputElement.setSelectionRange(newCursorPos, newCursorPos);
    
    // Trigger events
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('✅ Prompt text inserted successfully into regular input');
  }
}

function insertTextViaClipboard(inputElement, text) {
  console.log('📋 Using clipboard approach to insert text');
  
  // Store original clipboard content
  let originalClipboard = '';
  
  navigator.clipboard.readText().then(clipText => {
    originalClipboard = clipText;
  }).catch(() => {
    console.log('Could not read original clipboard');
  });
  
  // Write our text to clipboard
  navigator.clipboard.writeText(text).then(() => {
    // Focus the input
    inputElement.focus();
    
    // Clear current content
    inputElement.innerHTML = '';
    
    // Simulate Ctrl+V
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: new DataTransfer()
    });
    
    // Add our text to the clipboard data
    pasteEvent.clipboardData.setData('text/plain', text);
    
    inputElement.dispatchEvent(pasteEvent);
    
    // Restore original clipboard after a short delay
    setTimeout(() => {
      if (originalClipboard) {
        navigator.clipboard.writeText(originalClipboard).catch(() => {
          console.log('Could not restore original clipboard');
        });
      }
    }, 100);
    
    console.log('✅ Text inserted via clipboard approach');
    
  }).catch(error => {
    console.log('❌ Clipboard approach failed:', error);
    
    // Ultimate fallback: just set the content directly
    inputElement.innerHTML = '';
    inputElement.textContent = text;
    
    // Trigger events
    const events = [
      new Event('input', { bubbles: true }),
      new Event('change', { bubbles: true })
    ];
    
    events.forEach(event => inputElement.dispatchEvent(event));
    
    console.log('✅ Text inserted using direct content approach');
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function setupPromptCommandListener(inputElement) {
  console.log('🎧 Setting up prompt command listener for input:', inputElement);
  console.log('🔍 Input element details:', {
    tagName: inputElement.tagName,
    contentEditable: inputElement.contentEditable,
    type: inputElement.type,
    className: inputElement.className,
    id: inputElement.id,
    placeholder: inputElement.placeholder,
    isConnected: inputElement.isConnected
  });
  
  let lastValue = '';
  
  async function handleInput(event) {
    console.log('🔥 INPUT EVENT FIRED! Type:', event.type, 'Target:', event.target, 'Current target:', event.currentTarget);
    
    const currentValue = inputElement.contentEditable === 'true' 
      ? (inputElement.textContent || inputElement.innerText || '')
      : (inputElement.value || '');
    
    console.log('📄 Current value:', `"${currentValue}"`);
    console.log('📄 Last value:', `"${lastValue}"`);
    
    // Check if user typed a complete "/prompt:tag" command
    if (currentValue !== lastValue) {
      const cursorPos = inputElement.contentEditable === 'true'
        ? getContentEditableCursorPosition(inputElement)
        : inputElement.selectionStart || 0;

      // Look for "/prompt:tag" at the cursor position
      const textBeforeCursor = currentValue.substring(0, cursorPos);

      const promptCommandMatch = textBeforeCursor.match(/\/prompt:([a-zA-Z0-9\-_]+)$/i);

      // Only log when we actually find a valid prompt command
      if (promptCommandMatch) {
        console.log('🎯 VALUE CHANGED! Looking for /prompt command...');
        console.log('📍 Cursor position:', cursorPos);
        console.log('📍 Text before cursor:', `"${textBeforeCursor}"`);
        console.log('🎯 Prompt command match:', promptCommandMatch);
      }
      
      if (promptCommandMatch) {
        const tag = promptCommandMatch[1]; // Extract the required tag
        console.log('✅ /prompt:tag command detected with tag:', tag);
        
        // Load prompt library if not already loaded
        if (promptLibrary.length === 0) {
          console.log('📚 Prompt library empty, attempting to load...');
          await loadPromptLibrary();
          console.log('📚 After loading, prompt library has:', promptLibrary.length, 'prompts');
        }
        
        // Check if we have any prompts
        if (promptLibrary.length > 0) {
          // Find prompt by tag
          const selectedPrompt = promptLibrary.find(p => p.tag && p.tag.toLowerCase() === tag.toLowerCase());
          if (selectedPrompt) {
            console.log('🎯 Found prompt by tag:', selectedPrompt.name);
            
            // Remove the "/prompt:tag" text first
            const newValue = currentValue.replace(/\/prompt:[a-zA-Z0-9\-_]+$/i, '');
            
            // Set the new value without /prompt:tag
            if (inputElement.contentEditable === 'true') {
              inputElement.textContent = newValue;
            } else {
              inputElement.value = newValue;
            }
            
            // Insert the selected prompt text
            await insertPromptText(inputElement, selectedPrompt.text);
            
          } else {
            console.log('❌ No prompt found with tag:', tag, '- leaving command as-is');
            // Don't remove the command if no matching prompt is found
            // Let the user know the tag doesn't exist but keep the text
          }
        } else {
          console.log('❌ No prompts available in prompt library - leaving command as-is');
          // Don't remove the command if no prompts are available at all
          // The user might add prompts later or the library might not be loaded yet
        }
      }
    } else {
      console.log('📄 Value unchanged, no action needed');
    }
    
    lastValue = currentValue;
  }
  
  // Add multiple event types to catch all possible input events
  const eventTypes = ['input', 'keyup', 'keydown', 'keypress', 'change', 'paste'];
  
  console.log('🔗 Adding event listeners to input element for events:', eventTypes);
  
  eventTypes.forEach(eventType => {
    inputElement.addEventListener(eventType, (event) => {
      console.log(`🎪 ${eventType.toUpperCase()} EVENT on input!`, event);
      handleInput(event);
    }, true); // Use capture phase
  });
  
  // Test if events are working by adding a simple listener
  inputElement.addEventListener('focus', (event) => {
    console.log('🔍 INPUT FOCUSED! Ready for /prompt command', event);
  }, true);
  
  inputElement.addEventListener('blur', (event) => {
    console.log('😴 INPUT BLURRED!', event);
  }, true);
  
  // Also try listening to the document for all input events to see what's actually happening
  const documentListener = (event) => {
    if (event.target === inputElement) {
      console.log('📺 Document caught event on our input element:', event.type, event);
    }
  };
  
  eventTypes.forEach(eventType => {
    document.addEventListener(eventType, documentListener, true);
  });
  
  // Test if the input is still connected and functional
  setTimeout(() => {
    console.log('⏰ Testing input connection after 1 second:', {
      isConnected: inputElement.isConnected,
      parentElement: inputElement.parentElement,
      value: inputElement.contentEditable === 'true' ? inputElement.textContent : inputElement.value
    });
  }, 1000);
  
  // Add a test function to manually trigger events
  window.testPromptCommand = function() {
    console.log('🧪 MANUAL TEST: Simulating /prompt input');
    
    // Set the value
    if (inputElement.contentEditable === 'true') {
      inputElement.textContent = '/prompt';
    } else {
      inputElement.value = '/prompt';
    }
    
    // Trigger events manually
    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    const keyupEvent = new KeyboardEvent('keyup', { key: 't', bubbles: true, cancelable: true });
    
    console.log('🧪 Dispatching events...');
    inputElement.dispatchEvent(inputEvent);
    inputElement.dispatchEvent(keyupEvent);
    
    console.log('🧪 Manual test complete');
  };
  
  console.log('🧪 Added window.testPromptCommand() for manual testing');
}

function getContentEditableCursorPosition(element) {
  let caretPos = 0;
  const sel = window.getSelection();
  if (sel.rangeCount) {
    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    caretPos = preCaretRange.toString().length;
  }
  return caretPos;
}

// Debug function to test prompt command manually
window.testPromptCommand = function() {
  console.log('🧪 Testing prompt command functionality...');
  console.log('📚 Current prompt library:', promptLibrary);
  
  // Find any input element on the page
  const hostname = window.location.hostname;
  const config = AI_PLATFORMS[hostname] || AI_PLATFORMS.default;
  const inputs = document.querySelectorAll(config.selector);
  
  console.log('🔍 Found', inputs.length, 'input elements');
  
  if (inputs.length > 0) {
    const input = inputs[0];
    console.log('🎯 Testing with first input:', input);
    
    // Force show dropdown
    showPromptDropdown(input);
  } else {
    console.log('❌ No input elements found to test with');
  }
};

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}