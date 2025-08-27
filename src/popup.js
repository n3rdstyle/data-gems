// State management
let contextItems = [];
let filteredItems = [];
let selectedCategory = null;
let searchQuery = '';
let editingItem = null;
let isAddingItem = false;
let currentEditingItem = null;

// DOM Elements
const elements = {
  // Header
  itemCount: document.getElementById('itemCount'),
  searchInput: document.getElementById('searchInput'),
  importBtn: document.getElementById('importBtn'),
  exportBtn: document.getElementById('exportBtn'),
  profileAvatar: document.querySelector('.profile-avatar'),
  
  // Profile Modal
  profileModal: document.getElementById('profileModal'),
  closeModal: document.getElementById('closeModal'),
  profileImageInput: document.getElementById('profileImageInput'),
  uploadImageBtn: document.getElementById('uploadImageBtn'),
  removeImageBtn: document.getElementById('removeImageBtn'),
  privacyLink: document.getElementById('privacyLink'),
  
  // Edit Modal
  editModal: document.getElementById('editModal'),
  closeEditModal: document.getElementById('closeEditModal'),
  editItemForm: document.getElementById('editItemForm'),
  editCategory: document.getElementById('editCategory'),
  editQuestion: document.getElementById('editQuestion'),
  editAnswer: document.getElementById('editAnswer'),
  favoriteBtn: document.getElementById('favoriteBtn'),
  deleteItemBtn: document.getElementById('deleteItemBtn'),
  saveEditBtn: document.getElementById('saveEditBtn'),
  
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
        
        // Remove duplicates from existing data
        const uniqueItems = [];
        const seen = new Set();
        
        for (const item of contextItems) {
          const itemKey = `${item.category}:${item.question}:${item.answer}`;
          if (!seen.has(itemKey)) {
            seen.add(itemKey);
            uniqueItems.push(item);
          }
        }
        
        // If duplicates were found, update the storage
        if (uniqueItems.length < contextItems.length) {
          contextItems = uniqueItems;
          saveItems();
          console.log(`Removed ${result.contextItems.length - uniqueItems.length} duplicate items`);
        }
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
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by creation date, newest first
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
    // If clicking the already selected category, deselect it (go back to All)
    if (selectedCategory === value) {
      selectedCategory = null;
    } else {
      selectedCategory = value;
    }
    filterItems();
    updateUI();
    centerSelectedCategory();
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

// Get category icon and color
function getCategoryIcon(category) {
  const iconMap = {
    'Hobbies': {
      color: '#04214E',
      icon: '🎯'
    },
    'Food & Drink': {
      color: '#04214E',
      icon: '🍽️'
    },
    'Entertainment & Media': {
      color: '#04214E',
      icon: '🎬'
    },
    'Travel & Activities': {
      color: '#04214E',
      icon: '✈️'
    },
    'Lifestyle & Preferences': {
      color: '#04214E',
      icon: '💜'
    },
    'Work & Professional': {
      color: '#04214E',
      icon: '💼'
    },
    'Technology & Communication': {
      color: '#04214E',
      icon: '📱'
    },
    'Transportation': {
      color: '#04214E',
      icon: '🚗'
    },
    'Social & Personal': {
      color: '#04214E',
      icon: '👥'
    },
    'Weather & Environment': {
      color: '#04214E',
      icon: '☀️'
    }
  };
  
  return iconMap[category] || {
    color: '#9E9E9E',
    icon: '❓'
  };
}

// Create context card element
function createContextCard(item) {
  const card = document.createElement('div');
  card.className = 'context-card';
  
  card.innerHTML = `
    <div class="context-content">
      <div class="context-icon" style="background-color: ${getCategoryIcon(item.category).color}20">
        ${getCategoryIcon(item.category).icon}
      </div>
      <div class="context-text">
        <div class="context-question">${escapeHtml(item.question)}</div>
        <div class="context-answer">${escapeHtml(item.answer)}</div>
      </div>
    </div>
  `;
  
  // Add event listeners
  card.addEventListener('click', () => {
    openEditModal(item);
  });
  
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
          let itemsToImport = [];
          
          // Handle array format (original format)
          if (Array.isArray(imported)) {
            itemsToImport = imported.map(item => ({
              ...item,
              id: item.id || generateId(),
              createdAt: new Date(item.createdAt || Date.now()),
              updatedAt: new Date(item.updatedAt || Date.now())
            }));
          }
          // Handle categorized format (profile_json.json format)
          else if (imported.categories && typeof imported.categories === 'object') {
            // Convert categorized format to flat array
            for (const [category, items] of Object.entries(imported.categories)) {
              if (Array.isArray(items)) {
                const categoryItems = items.map(item => ({
                  id: generateId(),
                  category: category,
                  question: item.question || '',
                  answer: item.answer || '',
                  createdAt: new Date(),
                  updatedAt: new Date()
                }));
                itemsToImport.push(...categoryItems);
              }
            }
          }
          // Handle single object that might be a profile
          else if (imported && typeof imported === 'object') {
            // Try to extract meaningful data from other formats
            showNotification('Unrecognized format. Please use the correct JSON format.', 'error');
            return;
          }
          
          if (itemsToImport.length > 0) {
            // Check for duplicates and only add new items
            const existingSet = new Set(
              contextItems.map(item => `${item.category}:${item.question}:${item.answer}`)
            );
            
            const newItems = itemsToImport.filter(item => {
              const itemKey = `${item.category}:${item.question}:${item.answer}`;
              return !existingSet.has(itemKey);
            });
            
            if (newItems.length > 0) {
              contextItems = [...newItems, ...contextItems];
              saveItems();
              filterItems();
              updateUI();
              
              const skippedCount = itemsToImport.length - newItems.length;
              if (skippedCount > 0) {
                showNotification(`Imported ${newItems.length} new items (${skippedCount} duplicates skipped)`);
              } else {
                showNotification(`Imported ${newItems.length} context items!`);
              }
            } else {
              showNotification('All items already exist. No new items imported.', 'info');
            }
          } else {
            showNotification('No valid items found in the imported file.', 'error');
          }
        } catch (error) {
          showNotification('Failed to import file. Please check the format.', 'error');
          console.error('Import error:', error);
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
  
  // Profile Modal
  elements.profileAvatar.addEventListener('click', openProfileModal);
  elements.closeModal.addEventListener('click', closeProfileModal);
  elements.uploadImageBtn.addEventListener('click', () => elements.profileImageInput.click());
  elements.profileImageInput.addEventListener('change', handleImageUpload);
  elements.removeImageBtn.addEventListener('click', removeProfileImage);
  elements.privacyLink.addEventListener('click', openPrivacyStatement);
  
  // Close modal on outside click
  elements.profileModal.addEventListener('click', (e) => {
    if (e.target === elements.profileModal) {
      closeProfileModal();
    }
  });
  
  // Edit Modal
  elements.closeEditModal.addEventListener('click', closeEditModal);
  elements.saveEditBtn.addEventListener('click', saveEditedItem);
  elements.favoriteBtn.addEventListener('click', toggleFavorite);
  elements.deleteItemBtn.addEventListener('click', deleteCurrentItem);
  
  // Close edit modal on outside click
  elements.editModal.addEventListener('click', (e) => {
    if (e.target === elements.editModal) {
      closeEditModal();
    }
  });
  
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

// Profile Modal Functions
function openProfileModal() {
  elements.profileModal.style.display = 'flex';
  loadProfileImage();
}

function closeProfileModal() {
  elements.profileModal.style.display = 'none';
}

function handleImageUpload(e) {
  const file = e.target.files?.[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      // Store image in localStorage
      chrome.storage.local.set({ profileImage: imageData }, () => {
        updateProfileImage(imageData);
        showNotification('Profile image updated!');
      });
    };
    reader.readAsDataURL(file);
  }
}

function removeProfileImage() {
  chrome.storage.local.remove('profileImage', () => {
    updateProfileImage(null);
    showNotification('Profile image removed');
  });
}

function updateProfileImage(imageData) {
  const avatars = document.querySelectorAll('.profile-avatar .avatar-letter, .current-avatar .avatar-letter');
  avatars.forEach(avatar => {
    if (imageData) {
      avatar.parentElement.style.backgroundImage = `url(${imageData})`;
      avatar.parentElement.style.backgroundSize = 'cover';
      avatar.parentElement.style.backgroundPosition = 'center';
      avatar.style.display = 'none';
    } else {
      avatar.parentElement.style.backgroundImage = '';
      avatar.style.display = 'flex';
    }
  });
}

function loadProfileImage() {
  chrome.storage.local.get(['profileImage'], (result) => {
    if (result.profileImage) {
      updateProfileImage(result.profileImage);
    }
  });
}

function openPrivacyStatement(e) {
  e.preventDefault();
  // Open the privacy statement in a new tab
  chrome.tabs.create({ 
    url: 'https://github.com/n3rdstyle/data-gems/blob/main/PRIVACY.md' 
  });
}

// Edit Modal Functions
function openEditModal(item) {
  currentEditingItem = item;
  
  // Populate form fields
  elements.editCategory.value = item.category;
  elements.editQuestion.value = item.question;
  elements.editAnswer.value = item.answer;
  
  // Update favorite button state
  updateFavoriteButton(item.isFavorite || false);
  
  // Show modal
  elements.editModal.style.display = 'flex';
}

function closeEditModal() {
  elements.editModal.style.display = 'none';
  currentEditingItem = null;
  elements.editItemForm.reset();
}

function updateFavoriteButton(isFavorite) {
  if (isFavorite) {
    elements.favoriteBtn.classList.add('favorited');
    elements.favoriteBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      Favorited
    `;
  } else {
    elements.favoriteBtn.classList.remove('favorited');
    elements.favoriteBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      Favorite
    `;
  }
}

function toggleFavorite() {
  if (!currentEditingItem) return;
  
  const newFavoriteState = !currentEditingItem.isFavorite;
  currentEditingItem.isFavorite = newFavoriteState;
  
  // Update the item in contextItems array
  const itemIndex = contextItems.findIndex(item => item.id === currentEditingItem.id);
  if (itemIndex !== -1) {
    contextItems[itemIndex].isFavorite = newFavoriteState;
    saveItems();
  }
  
  updateFavoriteButton(newFavoriteState);
  showNotification(newFavoriteState ? 'Added to favorites!' : 'Removed from favorites');
}

function deleteCurrentItem() {
  if (!currentEditingItem) return;
  
  if (confirm('Are you sure you want to delete this item?')) {
    const itemIndex = contextItems.findIndex(item => item.id === currentEditingItem.id);
    if (itemIndex !== -1) {
      contextItems.splice(itemIndex, 1);
      saveItems();
      filterItems();
      updateUI();
      closeEditModal();
      showNotification('Item deleted successfully');
    }
  }
}

function saveEditedItem() {
  if (!currentEditingItem) return;
  
  // Validate form
  if (!elements.editCategory.value || !elements.editQuestion.value.trim() || !elements.editAnswer.value.trim()) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  // Update the item
  currentEditingItem.category = elements.editCategory.value;
  currentEditingItem.question = elements.editQuestion.value.trim();
  currentEditingItem.answer = elements.editAnswer.value.trim();
  currentEditingItem.updatedAt = new Date();
  
  // Update in contextItems array
  const itemIndex = contextItems.findIndex(item => item.id === currentEditingItem.id);
  if (itemIndex !== -1) {
    contextItems[itemIndex] = { ...currentEditingItem };
    saveItems();
    filterItems();
    updateUI();
    closeEditModal();
    showNotification('Item updated successfully');
  }
}

// Center selected category function
function centerSelectedCategory() {
  const categoryFilter = elements.categoryFilter;
  const activeChip = categoryFilter.querySelector('.category-chip.active');
  
  if (!activeChip) {
    // No active chip (All is selected), scroll to beginning
    categoryFilter.scrollTo({
      left: 0,
      behavior: 'smooth'
    });
    return;
  }
  
  // If "All" is selected, keep it on the left
  if (selectedCategory === null) {
    categoryFilter.scrollTo({
      left: 0,
      behavior: 'smooth'
    });
    return;
  }
  
  // Calculate the position to center the active chip
  const containerWidth = categoryFilter.offsetWidth;
  const chipLeft = activeChip.offsetLeft;
  const chipWidth = activeChip.offsetWidth;
  const chipCenter = chipLeft + (chipWidth / 2);
  
  // Calculate scroll position to center the chip
  const scrollLeft = chipCenter - (containerWidth / 2);
  
  // Smooth scroll to center the selected category
  categoryFilter.scrollTo({
    left: Math.max(0, scrollLeft),
    behavior: 'smooth'
  });
}

// Load profile image on startup
loadProfileImage();

// Add keyboard shortcut for quick insert (Ctrl/Cmd + Enter)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    insertContextToPage();
  }
});