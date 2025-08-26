// State management
let contextItems = [];
let filteredItems = [];
let selectedCategory = null;
let searchQuery = '';
let editingItem = null;
let isAddingItem = false;

// DOM Elements
const elements = {
  // Header
  itemCount: document.getElementById('itemCount'),
  searchInput: document.getElementById('searchInput'),
  importBtn: document.getElementById('importBtn'),
  exportBtn: document.getElementById('exportBtn'),
  
  // Category Filter
  categoryFilter: document.getElementById('categoryFilter'),
  
  // Form
  formSection: document.getElementById('formSection'),
  contextForm: document.getElementById('contextForm'),
  formTitle: document.getElementById('formTitle'),
  formSubtitle: document.getElementById('formSubtitle'),
  categorySelect: document.getElementById('categorySelect'),
  questionInput: document.getElementById('questionInput'),
  answerInput: document.getElementById('answerInput'),
  saveButtonText: document.getElementById('saveButtonText'),
  cancelBtn: document.getElementById('cancelBtn'),
  
  // Content
  content: document.getElementById('content'),
  emptyState: document.getElementById('emptyState'),
  emptyTitle: document.getElementById('emptyTitle'),
  emptyDescription: document.getElementById('emptyDescription'),
  firstAddBtn: document.getElementById('firstAddBtn'),
  itemsList: document.getElementById('itemsList'),
  
  // Footer
  footer: document.getElementById('footer'),
  addBtn: document.getElementById('addBtn')
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  loadItems();
  setupEventListeners();
  updateUI();
});

// Load items from chrome.storage
async function loadItems() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['contextItems'], (result) => {
      if (result.contextItems) {
        contextItems = result.contextItems.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }));
      } else {
        contextItems = [];
      }
      filterItems();
      updateUI();
      resolve();
    });
  });
}

// Save items to chrome.storage
function saveItems() {
  chrome.storage.local.set({ contextItems: contextItems }, () => {
    console.log('Context items saved');
  });
}

// Filter items based on search and category
function filterItems() {
  filteredItems = contextItems.filter(item => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
}

// Update UI based on state
function updateUI() {
  // Item count display removed per design requirements
  
  // Show/hide form section
  elements.formSection.style.display = (isAddingItem || editingItem) ? 'block' : 'none';
  
  // Update form title if editing
  if (editingItem) {
    elements.formTitle.textContent = 'Edit Context';
    elements.formSubtitle.textContent = 'Update your personal information';
    elements.saveButtonText.textContent = 'Update';
  } else {
    elements.formTitle.textContent = 'Add New Context';
    elements.formSubtitle.textContent = 'Share something about yourself';
    elements.saveButtonText.textContent = 'Save';
  }
  
  // Show/hide category filter
  if (contextItems.length > 0 && !isAddingItem && !editingItem) {
    updateCategoryFilter();
    elements.categoryFilter.style.display = 'flex';
  } else {
    elements.categoryFilter.style.display = 'none';
  }
  
  // Show/hide empty state or items list
  if (filteredItems.length === 0) {
    elements.emptyState.style.display = 'flex';
    elements.itemsList.style.display = 'none';
    
    if (contextItems.length === 0) {
      elements.emptyTitle.textContent = 'Ready to personalize your AI?';
      elements.emptyDescription.textContent = 'Add your personal info to your profile and help your AI understand you better. No worries, your data stays private and local.';
      elements.firstAddBtn.style.display = 'inline-flex';
    } else {
      elements.emptyTitle.textContent = 'No items found';
      elements.emptyDescription.textContent = 'Try adjusting your search or filters to find what you\'re looking for.';
      elements.firstAddBtn.style.display = 'none';
    }
  } else {
    elements.emptyState.style.display = 'none';
    elements.itemsList.style.display = 'block';
    renderItems();
  }
  
  // Show/hide footer add button
  elements.footer.style.display = (contextItems.length > 0 && !isAddingItem && !editingItem) ? 'block' : 'none';
}

// Update category filter
function updateCategoryFilter() {
  const categories = [...new Set(contextItems.map(item => item.category))].sort();
  const counts = contextItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  
  elements.categoryFilter.innerHTML = '';
  
  // Add "All" category
  const allChip = createCategoryChip(null, 'All', contextItems.length);
  elements.categoryFilter.appendChild(allChip);
  
  // Add other categories
  categories.forEach(category => {
    const chip = createCategoryChip(category, category, counts[category]);
    elements.categoryFilter.appendChild(chip);
  });
}

// Create category chip element
function createCategoryChip(value, label, count) {
  const chip = document.createElement('button');
  chip.className = 'category-chip';
  if (selectedCategory === value) {
    chip.classList.add('active');
  }
  
  chip.innerHTML = `
    ${label}
    <span class="category-count">${count}</span>
  `;
  
  chip.addEventListener('click', () => {
    selectedCategory = value;
    filterItems();
    updateUI();
  });
  
  return chip;
}

// Render context items
function renderItems() {
  elements.itemsList.innerHTML = '';
  
  filteredItems.forEach(item => {
    const card = createContextCard(item);
    elements.itemsList.appendChild(card);
  });
}

// Create context card element
function createContextCard(item) {
  const card = document.createElement('div');
  card.className = 'context-card';
  
  card.innerHTML = `
    <div class="context-card-header">
      <span class="context-category">${item.category}</span>
      <div class="context-actions">
        <button class="edit-btn" data-id="${item.id}" title="Edit">
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="delete-btn" data-id="${item.id}" title="Delete">
          <svg class="icon" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
    <div class="context-question">${escapeHtml(item.question)}</div>
    <div class="context-answer">${escapeHtml(item.answer)}</div>
  `;
  
  // Add event listeners
  card.querySelector('.edit-btn').addEventListener('click', () => handleEdit(item));
  card.querySelector('.delete-btn').addEventListener('click', () => handleDelete(item.id));
  
  return card;
}

// Handle edit
function handleEdit(item) {
  editingItem = item;
  isAddingItem = false;
  
  // Populate form
  elements.categorySelect.value = item.category;
  elements.questionInput.value = item.question;
  elements.answerInput.value = item.answer;
  
  updateUI();
}

// Handle delete
function handleDelete(id) {
  if (confirm('Are you sure you want to delete this context item?')) {
    contextItems = contextItems.filter(item => item.id !== id);
    saveItems();
    filterItems();
    updateUI();
    showNotification('Context deleted successfully!');
  }
}

// Handle form submission
function handleSubmit(e) {
  e.preventDefault();
  
  const category = elements.categorySelect.value;
  const question = elements.questionInput.value.trim();
  const answer = elements.answerInput.value.trim();
  
  if (!question || !answer) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  const now = new Date();
  
  if (editingItem) {
    // Update existing item
    const index = contextItems.findIndex(item => item.id === editingItem.id);
    if (index !== -1) {
      contextItems[index] = {
        ...contextItems[index],
        category,
        question,
        answer,
        updatedAt: now
      };
    }
    editingItem = null;
    showNotification('Context updated successfully!');
  } else {
    // Add new item
    const newItem = {
      id: generateId(),
      category,
      question,
      answer,
      createdAt: now,
      updatedAt: now
    };
    contextItems.unshift(newItem);
    showNotification('Context added successfully!');
  }
  
  // Reset form
  elements.contextForm.reset();
  isAddingItem = false;
  
  // Save and update
  saveItems();
  filterItems();
  updateUI();
}

// Handle export
function handleExport() {
  const dataStr = JSON.stringify(contextItems, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'personal-context-backup.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showNotification('Context exported successfully!');
}

// Handle import
function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (Array.isArray(imported)) {
            const itemsWithDates = imported.map(item => ({
              ...item,
              id: item.id || generateId(),
              createdAt: new Date(item.createdAt || Date.now()),
              updatedAt: new Date(item.updatedAt || Date.now())
            }));
            contextItems = [...itemsWithDates, ...contextItems];
            saveItems();
            filterItems();
            updateUI();
            showNotification(`Imported ${imported.length} context items!`);
          }
        } catch (error) {
          showNotification('Failed to import file. Please check the format.', 'error');
        }
      };
      reader.readAsText(file);
    }
  };
  
  input.click();
}

// Setup event listeners
function setupEventListeners() {
  // Search
  elements.searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    filterItems();
    updateUI();
  });
  
  // Import/Export
  elements.importBtn.addEventListener('click', handleImport);
  elements.exportBtn.addEventListener('click', handleExport);
  
  // Add buttons
  elements.firstAddBtn.addEventListener('click', () => {
    isAddingItem = true;
    editingItem = null;
    elements.contextForm.reset();
    updateUI();
  });
  
  elements.addBtn.addEventListener('click', () => {
    isAddingItem = true;
    editingItem = null;
    elements.contextForm.reset();
    updateUI();
  });
  
  // Form
  elements.contextForm.addEventListener('submit', handleSubmit);
  elements.cancelBtn.addEventListener('click', () => {
    isAddingItem = false;
    editingItem = null;
    elements.contextForm.reset();
    updateUI();
  });
}

// Utility functions
function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'success') {
  // Simple notification (could be enhanced with a toast library)
  console.log(`[${type}] ${message}`);
  
  // You could add a visual notification here
  // For now, we'll just log to console
}

// Integration with content injection
async function insertContextToPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  
  // Build context text from items
  const contextText = buildContextText();
  
  if (contextText) {
    // Ensure content script is injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content.js']
      });
    } catch (e) {
      console.log('Content script injection:', e.message);
    }
    
    // Send message to content script
    try {
      await chrome.tabs.sendMessage(tab.id, { 
        type: 'INSERT_TEXT', 
        text: contextText 
      });
      window.close(); // Close popup after insertion
    } catch (e) {
      console.error('Failed to send message to content script:', e);
    }
  }
}

// Build context text from items
function buildContextText() {
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
  
  return text;
}

// Add keyboard shortcut for quick insert (Ctrl/Cmd + Enter)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    insertContextToPage();
  }
});