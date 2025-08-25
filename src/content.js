console.log('Prompt Profile Injector: Content script loaded on', window.location.hostname);

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
    selector: 'rich-textarea .ql-editor, .input-area, div[contenteditable="true"]',
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

// Create the inject button
function createInjectButton() {
  const buttonId = `prompt-profile-btn-${++buttonIdCounter}`;
  const button = document.createElement('button');
  button.className = 'prompt-profile-inject-btn';
  button.id = buttonId;
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    <span>Attach my profile</span>
  `;
  
  // Add styles if not already added
  const styleId = 'prompt-profile-inject-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .prompt-profile-inject-btn {
        position: absolute !important;
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
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      
      .prompt-profile-inject-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
        background: linear-gradient(135deg, #ec5a92 0%, #f58874 25%, #faae66 50%, #fdc46d 75%, #ffd89e 100%);
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
      
      /* Adjust for dark mode sites */
      @media (prefers-color-scheme: dark) {
        .prompt-profile-inject-btn {
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.6);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add click handler
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await injectProfile(button);
  });
  
  console.log('Created inject button with ID:', buttonId);
  return button;
}

// Find the actual prompt container (not just the input element)
function findPromptContainer(inputElement) {
  const hostname = window.location.hostname;
  let container = inputElement;
  
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
    // Gemini: Look for the rich-textarea or parent container
    container = inputElement.closest('rich-textarea') ||
                inputElement.closest('[class*="input"]') ||
                inputElement.parentElement?.parentElement ||
                inputElement;
  } else if (hostname.includes('perplexity.ai')) {
    // Perplexity: Look for the textarea container
    container = inputElement.closest('[class*="input"]') ||
                inputElement.closest('[class*="search"]') ||
                inputElement.parentElement ||
                inputElement;
  }
  
  // Verify we found a reasonable container
  const containerRect = container.getBoundingClientRect();
  const inputRect = inputElement.getBoundingClientRect();
  
  // If container is too small or same as input, try parent
  if (containerRect.width <= inputRect.width + 20) {
    const parent = container.parentElement;
    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      if (parentRect.width > containerRect.width && parentRect.width < window.innerWidth * 0.9) {
        container = parent;
      }
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
  const spacing = 4; // Reduced spacing from input field (was 12, now 4)
  
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

// Attach profile as a file
async function injectProfile(button) {
  console.log('Attaching profile...');
  button.classList.add('loading');
  button.querySelector('span').textContent = 'Loading';
  
  try {
    // Get context items from storage
    const result = await chrome.storage.local.get(['contextItems']);
    const contextItems = result.contextItems || [];
    
    console.log('Found context items:', contextItems.length);
    
    if (contextItems.length === 0) {
      button.querySelector('span').textContent = 'No profile data';
      setTimeout(() => {
        button.classList.remove('loading');
        button.querySelector('span').textContent = 'Attach my profile';
      }, 2000);
      return;
    }
    
    // Create profile JSON
    const profileData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      categories: {},
      totalItems: contextItems.length
    };
    
    // Group items by category
    contextItems.forEach(item => {
      if (!profileData.categories[item.category]) {
        profileData.categories[item.category] = [];
      }
      profileData.categories[item.category].push({
        question: item.question,
        answer: item.answer
      });
    });
    
    // Create a blob and file
    const jsonBlob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
    const file = new File([jsonBlob], 'my-profile.json', { type: 'application/json' });
    
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
      fileInputSelectors = ['input[type="file"]', 'input[accept]'];
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
      const uploadButtonSelectors = [
        'button[aria-label*="attach" i]',
        'button[aria-label*="upload" i]',
        'button[aria-label*="file" i]',
        '[data-testid*="file" i]',
        'button svg[class*="paperclip" i]',
        'button svg[class*="attach" i]',
        'button[title*="attach" i]',
        'button[title*="upload" i]'
      ];
      
      let uploadButton = null;
      for (const selector of uploadButtonSelectors) {
        uploadButton = document.querySelector(selector);
        if (uploadButton) {
          console.log('Found upload button:', uploadButton);
          uploadButton.click();
          
          // Wait a bit for file input to appear
          await new Promise(resolve => setTimeout(resolve, 500));
          
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
      console.error('No file input found');
      button.classList.remove('loading');
      button.querySelector('span').textContent = 'No file input';
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
    button.querySelector('span').textContent = 'Attached!';
    button.classList.add('success');
    
    setTimeout(() => {
      // Hide the button after successful attachment
      button.style.display = 'none';
      // Also remove from the injected buttons map so it can be recreated later
      for (const [input, btn] of injectedButtons.entries()) {
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

// Add inject buttons to input fields
function addInjectButtons() {
  const hostname = window.location.hostname;
  const config = AI_PLATFORMS[hostname] || AI_PLATFORMS.default;
  
  console.log('Looking for inputs on', hostname, 'with selector:', config.selector);
  
  // For Claude.ai, check if we're in a conversation already
  if (hostname === 'claude.ai') {
    const messages = document.querySelectorAll('[data-testid*="message"], .message, [role="article"]');
    if (messages.length > 0) {
      console.log('Already in conversation, not adding inject button');
      return;
    }
  }
  
  const inputs = document.querySelectorAll(config.selector);
  console.log('Found', inputs.length, 'potential input elements');
  
  let buttonAdded = false;
  
  inputs.forEach(input => {
    // Skip if button already exists for this input
    if (injectedButtons.has(input)) {
      console.log('Button already exists for input');
      return;
    }
    
    // Skip small inputs (likely not for prompts) - but be more lenient for contenteditable
    const rect = input.getBoundingClientRect();
    if (input.tagName !== 'DIV' && (rect.width < 200 || rect.height < 40)) {
      console.log('Input too small:', rect.width, 'x', rect.height);
      return;
    }
    
    // Skip hidden or invisible inputs
    if (!isValidInput(input)) {
      console.log('Input not valid (hidden or disabled)');
      return;
    }
    
    console.log('Adding button for input:', input);
    
    // Create and position the button
    const button = createInjectButton();
    document.body.appendChild(button);
    
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
    
    // Hide button when input is cleared or when user starts typing after injection
    input.addEventListener('input', () => {
      // Small delay to check if input was actually cleared
      setTimeout(() => {
        const isEmpty = input.tagName === 'TEXTAREA' || input.tagName === 'INPUT' 
          ? !input.value.trim() 
          : !input.textContent.trim();
        
        if (isEmpty && button.style.display === 'none') {
          // Input was cleared, show button again
          button.style.display = 'inline-flex';
          console.log('Input cleared, showing inject button again');
        }
      }, 100);
    });
  });
  
  if (buttonAdded) {
    console.log('Successfully added inject button(s)');
  } else {
    console.log('No suitable inputs found for inject button');
  }
}

// Remove buttons for inputs that no longer exist or when chat state changes
function cleanupButtons() {
  document.querySelectorAll('.prompt-profile-inject-btn').forEach(button => {
    // Check if there's still a valid input on the page
    const hostname = window.location.hostname;
    const config = AI_PLATFORMS[hostname] || AI_PLATFORMS.default;
    const inputs = document.querySelectorAll(config.selector);
    
    let hasValidInput = false;
    for (const input of inputs) {
      if (isValidInput(input)) {
        hasValidInput = true;
        break;
      }
    }
    
    // For Claude.ai, also check if we're in a conversation state (messages exist)
    if (hostname === 'claude.ai') {
      const messages = document.querySelectorAll('[data-testid*="message"], .message, [role="article"]');
      if (messages.length > 0) {
        // If there are messages visible, hide the button
        console.log('Messages detected, hiding inject button');
        button.style.display = 'none';
        return;
      }
    }
    
    if (!hasValidInput) {
      console.log('Removing orphaned button');
      button.remove();
    }
  });
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
  
  if (!msg || msg.type !== 'INSERT_TEXT') {
    console.log('Prompt Profile Injector: Wrong message type or no message');
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
function initialize() {
  console.log('Initializing Prompt Profile Injector...');
  
  // Wait a bit for dynamic content to load
  setTimeout(() => {
    addInjectButtons();
  }, 1000);
  
  // Try again after more time for slow-loading content
  setTimeout(() => {
    if (document.querySelectorAll('.prompt-profile-inject-btn').length === 0) {
      console.log('No buttons found after 3 seconds, trying again...');
      addInjectButtons();
    }
  }, 3000);
  
  // Monitor for new inputs (for SPAs and dynamic content)
  const observer = new MutationObserver((mutations) => {
    // Check if we need to add buttons
    let shouldCheck = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if any added nodes might be inputs
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) { // Element node
            if (node.matches && (
              node.matches('div[contenteditable="true"], textarea, input') ||
              node.querySelector && node.querySelector('div[contenteditable="true"], textarea, input')
            )) {
              shouldCheck = true;
              break;
            }
          }
        }
      }
      if (shouldCheck) break;
    }
    
    if (shouldCheck) {
      console.log('DOM changed, checking for new inputs...');
      setTimeout(() => {
        addInjectButtons();
        cleanupButtons();
      }, 500);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also check periodically for dynamic content
  setInterval(() => {
    const existingButtons = document.querySelectorAll('.prompt-profile-inject-btn').length;
    if (existingButtons === 0) {
      console.log('No inject buttons found, checking for inputs...');
      addInjectButtons();
    }
    cleanupButtons();
  }, 5000);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}