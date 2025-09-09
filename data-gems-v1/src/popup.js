// State management
let contextItems = [];
let filteredItems = [];
let itemsToFilter = []; // Items after subprofile filtering, before search/category filtering
let selectedCategory = null;
let searchQuery = '';
let editingItem = null;
let isAddingItem = false;
let currentEditingItem = null;

// Subprofile management
let subprofiles = [];
let activeSubprofileId = null;

// Auto-injection settings
let autoInjectSettings = {
  enabled: false,
  delay: 2 // seconds
};

// DOM Elements
const elements = {
  // Header
  itemCount: document.getElementById('itemCount'),
  searchInput: document.getElementById('searchInput'),
  subprofileSelector: document.getElementById('subprofileSelector'),
  createSubprofileQuickBtn: document.getElementById('createSubprofileQuickBtn'),
  editSubprofileBtn: document.getElementById('editSubprofileBtn'),
  deleteSubprofileBtn: document.getElementById('deleteSubprofileBtn'),
  importBtn: document.getElementById('importBtn'),
  exportBtn: document.getElementById('exportBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  profileAvatar: document.querySelector('.profile-avatar'),
  
  // Subprofile Creation Modal
  subprofileCreationModal: document.getElementById('subprofileCreationModal'),
  closeSubprofileModal: document.getElementById('closeSubprofileModal'),
  customSubprofileForm: document.getElementById('customSubprofileForm'),
  subprofileName: document.getElementById('subprofileName'),
  dataSelectionContainer: document.getElementById('dataSelectionContainer'),
  cancelSubprofileBtn: document.getElementById('cancelSubprofileBtn'),
  createSubprofileBtn: document.getElementById('createSubprofileBtn'),
  
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
  
  // Settings Modal
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsModal: document.getElementById('closeSettingsModal'),
  autoInjectToggle: document.getElementById('autoInjectToggle'),
  autoInjectDelay: document.getElementById('autoInjectDelay'),
  autoInjectDelayRow: document.getElementById('autoInjectDelayRow'),
  currentAutoProfile: document.getElementById('currentAutoProfile'),
  addBtn: document.getElementById('addBtn')
};

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize editing state
  window.editingSubprofile = null;
  
  await loadItems();
  await loadSubprofiles();
  await loadAutoInjectSettings();
  // Load active subprofile ID
  const result = await chrome.storage.local.get(['activeSubprofileId']);
  activeSubprofileId = result.activeSubprofileId || null;
  setupEventListeners();
  // updateUI() is already called in loadItems(), no need to call it again
  loadProfileImage(); // Load profile image after DOM is ready
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
  // First filter by active subprofile if one is selected
  itemsToFilter = contextItems;
  
  if (activeSubprofileId) {
    const activeSubprofile = subprofiles.find(s => s.id === activeSubprofileId);
    console.log('🔍 Filtering for subprofile:', activeSubprofileId);
    console.log('📋 Active subprofile data:', activeSubprofile);
    console.log('💾 Available contextItems:', contextItems.length, 'items');
    console.log('🎯 contextItems IDs:', contextItems.map(item => item.id));
    
    if (activeSubprofile && activeSubprofile.includedFields && activeSubprofile.includedFields.contextItems) {
      console.log('✅ Subprofile has contextItems field:', activeSubprofile.includedFields.contextItems);
      console.log('🔍 ID Matching Debug:');
      console.log('   📋 Expected IDs (from subprofile):', activeSubprofile.includedFields.contextItems);
      console.log('   💾 Available IDs (from contextItems):', contextItems.map(item => item.id));
      console.log('   🔄 ID Type Check - Subprofile IDs:', typeof activeSubprofile.includedFields.contextItems[0]);
      console.log('   🔄 ID Type Check - Item IDs:', typeof contextItems[0]?.id);
      
      // Only show items that are included in the active subprofile
      itemsToFilter = contextItems.filter(item => {
        const isIncluded = activeSubprofile.includedFields.contextItems.includes(item.id);
        if (!isIncluded) {
          console.log(`   ❌ Item "${item.id}" not found in subprofile contextItems`);
        }
        return isIncluded;
      });
      console.log('🎯 Filtered items:', itemsToFilter.length);
      console.log('🎯 Filtered item IDs:', itemsToFilter.map(item => item.id));
    } else {
      console.log('❌ Subprofile missing contextItems field or empty');
      console.log('🔍 includedFields:', activeSubprofile?.includedFields);
      // If subprofile exists but has no context items, show none
      itemsToFilter = [];
    }
  } else {
    console.log('🌐 No active subprofile - showing all items');
  }
  
  // Then apply search and category filters
  filteredItems = itemsToFilter.filter(item => {
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
    // Ensure itemsToFilter is initialized, fallback to contextItems if not
    const itemsForFilter = (itemsToFilter && itemsToFilter.length >= 0) ? itemsToFilter : contextItems;
    updateCategoryFilter(itemsForFilter); // Pass subprofile-filtered items
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
    } else if (activeSubprofileId) {
      // Show subprofile-specific empty message
      const activeSubprofile = subprofiles.find(s => s.id === activeSubprofileId);
      const subprofileName = activeSubprofile ? activeSubprofile.name : 'This subprofile';
      elements.emptyTitle.textContent = `${subprofileName} is empty`;
      elements.emptyDescription.textContent = 'This subprofile doesn\'t contain any information yet. Switch to "Full Profile" to add data or create a new subprofile with your existing information.';
      elements.firstAddBtn.style.display = 'none';
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
function updateCategoryFilter(itemsToShow = contextItems) {
  console.log('🏷️ Updating category filter with', itemsToShow.length, 'items');
  const categories = [...new Set(itemsToShow.map(item => item.category))].sort();
  const counts = itemsToShow.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  console.log('📊 Categories found:', categories, 'with counts:', counts);
  
  elements.categoryFilter.innerHTML = '';
  
  // Add "All" category
  const allChip = createCategoryChip(null, 'All', itemsToShow.length);
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
  
  // Settings
  elements.settingsBtn.addEventListener('click', openSettingsModal);
  
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
  
  // Settings Modal
  console.log('🔗 Setting up settings event listeners...');
  
  if (elements.closeSettingsModal) {
    elements.closeSettingsModal.addEventListener('click', closeSettingsModal);
    console.log('✅ Close settings modal listener added');
  }
  
  if (elements.autoInjectToggle) {
    elements.autoInjectToggle.addEventListener('change', onAutoInjectToggleChange);
    console.log('✅ Auto inject toggle listener added');
  }
  
  if (elements.autoInjectDelay) {
    elements.autoInjectDelay.addEventListener('change', onAutoInjectDelayChange);
    console.log('✅ Auto inject delay listener added');
  }
  
  // Close settings modal on outside click
  elements.settingsModal.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) {
      closeSettingsModal();
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
  elements.firstAddBtn.addEventListener('click', async () => {
    // If a subprofile is active, switch to full profile first
    if (activeSubprofileId) {
      await switchSubprofile(null); // Switch to full profile
    }
    isAddingItem = true;
    editingItem = null;
    elements.contextForm.reset();
    updateUI();
  });
  
  elements.addBtn.addEventListener('click', async () => {
    // If a subprofile is active, switch to full profile first
    if (activeSubprofileId) {
      await switchSubprofile(null); // Switch to full profile
    }
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
  
  // Subprofile selector
  if (elements.subprofileSelector) {
    elements.subprofileSelector.addEventListener('change', (e) => {
      switchSubprofile(e.target.value);
    });
  }
  
  // Subprofile management buttons
  if (elements.createSubprofileQuickBtn) {
    elements.createSubprofileQuickBtn.addEventListener('click', () => openSubprofileCreationModal());
  }
  
  if (elements.editSubprofileBtn) {
    elements.editSubprofileBtn.addEventListener('click', editActiveSubprofile);
  }
  
  if (elements.deleteSubprofileBtn) {
    elements.deleteSubprofileBtn.addEventListener('click', deleteActiveSubprofile);
  }
  
  if (elements.closeSubprofileModal) {
    elements.closeSubprofileModal.addEventListener('click', closeSubprofileCreationModal);
  }
  
  if (elements.cancelSubprofileBtn) {
    elements.cancelSubprofileBtn.addEventListener('click', closeSubprofileCreationModal);
  }
  
  // Close subprofile modal on outside click
  if (elements.subprofileCreationModal) {
    elements.subprofileCreationModal.addEventListener('click', (e) => {
      if (e.target === elements.subprofileCreationModal) {
        closeSubprofileCreationModal();
      }
    });
  }
  
  // Form submission
  if (elements.customSubprofileForm) {
    elements.customSubprofileForm.addEventListener('submit', handleCustomSubprofileCreation);
  }
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
    `;
  } else {
    elements.favoriteBtn.classList.remove('favorited');
    elements.favoriteBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
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

// Add keyboard shortcut for quick insert (Ctrl/Cmd + Enter)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    insertContextToPage();
  }
});

// Custom Subprofile Creation Modal Functions
async function openSubprofileCreationModal(subprofileToEdit = null) {
  console.log('🎯 Opening subprofile modal:', {
    subprofileToEdit: subprofileToEdit,
    isEditing: !!subprofileToEdit,
    type: typeof subprofileToEdit
  });
  
  if (!elements.subprofileCreationModal) {
    console.error('❌ Subprofile creation modal element not found!');
    return;
  }
  
  elements.subprofileCreationModal.style.display = 'flex';
  
  // Store the subprofile being edited (if any)
  window.editingSubprofile = subprofileToEdit;
  console.log('✅ Set window.editingSubprofile to:', window.editingSubprofile);
  
  // Reset form or populate with existing data
  elements.customSubprofileForm.reset();
  
  if (subprofileToEdit) {
    // Editing mode - populate with existing data
    elements.subprofileName.value = subprofileToEdit.name;
    
    // Update modal title and button text
    const modalTitle = elements.subprofileCreationModal.querySelector('h2');
    const submitButton = elements.createSubprofileBtn;
    
    if (modalTitle) modalTitle.textContent = 'Edit Subprofile';
    if (submitButton) submitButton.textContent = 'Update Subprofile';
  } else {
    // Creation mode - reset modal title and button text
    const modalTitle = elements.subprofileCreationModal.querySelector('h2');
    const submitButton = elements.createSubprofileBtn;
    
    if (modalTitle) modalTitle.textContent = 'Create New Subprofile';
    if (submitButton) submitButton.textContent = 'Create Subprofile';
  }
  
  // Load and populate profile data for selection
  await populateDataSelection(subprofileToEdit);
}

function closeSubprofileCreationModal() {
  elements.subprofileCreationModal.style.display = 'none';
  elements.customSubprofileForm.reset();
  
  // Clear editing state
  window.editingSubprofile = null;
}

async function populateDataSelection(subprofileToEdit = null) {
  const container = elements.dataSelectionContainer;
  
  try {
    // Load both profile data and context items
    const profileResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'LOAD_PROFILE' }, resolve);
    });
    
    // Also load context items (popup data)
    const contextItemsData = await new Promise((resolve) => {
      chrome.storage.local.get(['contextItems'], resolve);
    });
    
    const profile = profileResponse?.ok ? profileResponse.profile : null;
    const contextItems = contextItemsData?.contextItems || [];
    
    // If we have neither structured profile data nor context items, show empty message
    if ((!profile || Object.keys(profile).length <= 1) && contextItems.length === 0) {
      container.innerHTML = '<div class="loading-message">Please create your main profile first by adding some information.</div>';
      return;
    }
    let html = '';
    
    // Identity section
    if (profile.identity && Object.keys(profile.identity).some(key => profile.identity[key])) {
      html += '<div class="data-section"><div class="data-section-title">Identity</div>';
      
      if (profile.identity.displayName) {
        html += `<div class="data-item">
          <input type="checkbox" id="identity_displayName" name="identity.displayName" value="true">
          <div class="data-item-content">
            <div class="data-item-label">Display Name</div>
            <div class="data-item-value">${profile.identity.displayName}</div>
          </div>
        </div>`;
      }
      
      if (profile.identity.languages && profile.identity.languages.length > 0) {
        html += `<div class="data-item">
          <input type="checkbox" id="identity_languages" name="identity.languages" value="true">
          <div class="data-item-content">
            <div class="data-item-label">Languages</div>
            <div class="data-item-value">${profile.identity.languages.join(', ')}</div>
          </div>
        </div>`;
      }
      
      if (profile.identity.location) {
        html += `<div class="data-item">
          <input type="checkbox" id="identity_location" name="identity.location" value="true">
          <div class="data-item-content">
            <div class="data-item-label">Location</div>
            <div class="data-item-value">${profile.identity.location}</div>
          </div>
        </div>`;
      }
      
      html += '</div>';
    }
    
    // Style/Preferences section
    const style = profile.style || profile.preferences || {};
    if (Object.keys(style).some(key => style[key])) {
      html += '<div class="data-section"><div class="data-section-title">Style & Preferences</div>';
      
      if (style.tone) {
        html += `<div class="data-item">
          <input type="checkbox" id="style_tone" name="style.tone" value="true">
          <div class="data-item-content">
            <div class="data-item-label">Tone</div>
            <div class="data-item-value">${style.tone}</div>
          </div>
        </div>`;
      }
      
      if (style.formatting) {
        html += `<div class="data-item">
          <input type="checkbox" id="style_formatting" name="style.formatting" value="true">
          <div class="data-item-content">
            <div class="data-item-label">Formatting</div>
            <div class="data-item-value">${style.formatting}</div>
          </div>
        </div>`;
      }
      
      if (style.topics && style.topics.length > 0) {
        html += `<div class="data-item">
          <input type="checkbox" id="style_topics" name="style.topics" value="true">
          <div class="data-item-content">
            <div class="data-item-label">Topics</div>
            <div class="data-item-value">${style.topics.join(', ')}</div>
          </div>
        </div>`;
      }
      
      html += '</div>';
    }
    
    // Personal info/answers section (from structured profile)
    if (profile && profile.answers && profile.answers.length > 0) {
      html += '<div class="data-section"><div class="data-section-title">Personal Information (Profile)</div>';
      
      profile.answers.forEach((answer, index) => {
        const displayValue = answer.type === 'boolean' 
          ? (answer.value ? 'Yes' : 'No')
          : answer.value;
        
        // Get question text from QUESTIONS array
        const questionText = getQuestionText(answer.id);
        
        html += `<div class="data-item">
          <input type="checkbox" id="answer_${answer.id}" name="answers" value="${answer.id}">
          <div class="data-item-content">
            <div class="data-item-label">${questionText}</div>
            <div class="data-item-value">${displayValue}</div>
          </div>
        </div>`;
      });
      
      html += '</div>';
    }
    
    // Context Items section (from popup data)
    if (contextItems.length > 0) {
      html += '<div class="data-section"><div class="data-section-title">Your Information</div>';
      
      contextItems.forEach((item, index) => {
        // Escape HTML to prevent issues
        const safeQuestion = item.question.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeAnswer = item.answer.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Check if this item is already selected in the subprofile being edited
        const isChecked = subprofileToEdit && 
          subprofileToEdit.includedFields?.contextItems?.includes(item.id) ? 'checked' : '';
        
        html += `<div class="data-item">
          <input type="checkbox" id="contextItem_${item.id}" name="contextItems" value="${item.id}" ${isChecked}>
          <div class="data-item-content">
            <div class="data-item-label">${safeQuestion}</div>
            <div class="data-item-value">${safeAnswer}</div>
          </div>
        </div>`;
      });
      
      html += '</div>';
    }
    
    // Constraints section
    if (profile && profile.constraints && (profile.constraints.avoid?.length > 0 || profile.constraints.privacyNotes)) {
      html += '<div class="data-section"><div class="data-section-title">Constraints</div>';
      
      if (profile.constraints.avoid && profile.constraints.avoid.length > 0) {
        html += `<div class="data-item">
          <input type="checkbox" id="constraints_avoid" name="constraints.avoid" value="true">
          <div class="data-item-content">
            <div class="data-item-label">Things to Avoid</div>
            <div class="data-item-value">${profile.constraints.avoid.join(', ')}</div>
          </div>
        </div>`;
      }
      
      if (profile.constraints.privacyNotes) {
        html += `<div class="data-item">
          <input type="checkbox" id="constraints_privacy" name="constraints.privacyNotes" value="true">
          <div class="data-item-content">
            <div class="data-item-label">Privacy Notes</div>
            <div class="data-item-value">${profile.constraints.privacyNotes}</div>
          </div>
        </div>`;
      }
      
      html += '</div>';
    }
    
    if (html === '') {
      html = '<div class="loading-message">No profile data available. Please add some information to your main profile first.</div>';
    }
    
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading profile data:', error);
    container.innerHTML = '<div class="loading-message">Error loading profile data. Please try again.</div>';
  }
}

function getQuestionText(answerId) {
  // Import questions to get the text
  const questions = [
    { id: "favorite_food", text: "What is my favorite food?" },
    { id: "clothing_style", text: "What style of clothes do I wear?" },
    { id: "like_spicy_food", text: "Do I like spicy food?" },
    { id: "enjoy_puzzles", text: "Do I enjoy puzzles?" },
    { id: "prefer_mornings", text: "Am I a morning person?" },
    { id: "coffee_or_tea", text: "Do I prefer coffee or tea?" },
    { id: "like_travel", text: "Do I like to travel?" },
    { id: "prefer_beach", text: "Do I prefer the beach?" },
    { id: "prefer_mountains", text: "Do I prefer the mountains?" },
    { id: "like_cooking", text: "Do I like to cook?" },
    { id: "like_reading", text: "Do I like reading?" },
    { id: "favorite_music", text: "What is my favorite music genre?" },
    { id: "like_podcasts", text: "Do I like podcasts?" },
    { id: "like_movies", text: "Do I like movies?" },
    { id: "favorite_movie_genre", text: "What is my favorite movie genre?" },
    { id: "like_sports", text: "Do I like sports?" },
    { id: "favorite_sport", text: "What is my favorite sport?" },
    { id: "like_gaming", text: "Do I like gaming?" },
    { id: "prefer_outdoors", text: "Do I prefer the outdoors?" },
    { id: "like_animals", text: "Do I like animals?" },
    { id: "have_pets", text: "Do I have pets?" },
    { id: "like_art", text: "Do I like art?" },
    { id: "favorite_color", text: "What is my favorite color?" },
    { id: "like_learning", text: "Do I like learning new things?" },
    { id: "enjoy_diy", text: "Do I enjoy DIY projects?" },
    { id: "prefer_minimalism", text: "Do I prefer minimalism?" },
    { id: "like_plants", text: "Do I like plants?" },
    { id: "like_museums", text: "Do I like museums?" },
    { id: "like_theater", text: "Do I like theater?" },
    { id: "like_dancing", text: "Do I like dancing?" },
    { id: "prefer_text_over_video", text: "Do I prefer text over video?" },
    { id: "like_writing", text: "Do I like writing?" },
    { id: "like_photography", text: "Do I like photography?" },
    { id: "like_cycling", text: "Do I like cycling?" },
    { id: "like_running", text: "Do I like running?" },
    { id: "like_swimming", text: "Do I like swimming?" },
    { id: "like_board_games", text: "Do I like board games?" },
    { id: "like_coding", text: "Do I like coding?" },
    { id: "like_history", text: "Do I like history?" },
    { id: "like_science", text: "Do I like science?" },
    { id: "like_technology", text: "Do I like technology?" },
    { id: "like_fashion", text: "Do I like fashion?" },
    { id: "like_trendy", text: "Do I like trendy things?" },
    { id: "prefer_quiet", text: "Do I prefer quiet places?" },
    { id: "like_large_groups", text: "Do I like large groups?" },
    { id: "like_volunteering", text: "Do I like volunteering?" },
    { id: "like_gardening", text: "Do I like gardening?" },
    { id: "prefer_home", text: "Do I prefer staying at home?" },
    { id: "like_city_life", text: "Do I like city life?" },
    { id: "like_country_life", text: "Do I like country life?" }
  ];
  
  const question = questions.find(q => q.id === answerId);
  return question ? question.text : answerId.replace(/_/g, ' ');
}

async function handleCustomSubprofileCreation(e) {
  e.preventDefault();
  console.log('🎯 Form submitted - editing mode:', !!window.editingSubprofile);
  
  const name = elements.subprofileName.value.trim();
  const icon = '📝'; // Default icon for all subprofiles
  
  if (!name) {
    showNotification('Please enter a name for your subprofile', 'error');
    return;
  }
  
  // Collect selected data
  const formData = new FormData(elements.customSubprofileForm);
  const selectedData = {
    identity: {},
    style: { topics: [] },
    answers: [],
    affinities: [],
    constraints: {},
    snippets: [],
    contextItems: [] // Add support for context items
  };
  
  // Process form data
  for (const [key, value] of formData.entries()) {
    if (key === 'answers') {
      selectedData.answers.push(value);
    } else if (key === 'contextItems') {
      selectedData.contextItems.push(value);
    } else if (key.startsWith('identity.')) {
      const field = key.replace('identity.', '');
      selectedData.identity[field] = true;
    } else if (key.startsWith('style.')) {
      const field = key.replace('style.', '');
      selectedData.style[field] = true;
    } else if (key.startsWith('constraints.')) {
      const field = key.replace('constraints.', '');
      selectedData.constraints[field] = true;
    }
  }
  
  // Create subprofile object
  const totalItems = selectedData.answers.length + selectedData.contextItems.length + 
    Object.keys(selectedData.identity).length + Object.keys(selectedData.style).length + 
    Object.keys(selectedData.constraints).length;
    
  console.log('🔧 Processing subprofile with data:', selectedData);
  console.log('📊 Selected contextItems:', selectedData.contextItems);
  
  const isEditing = window.editingSubprofile !== null && window.editingSubprofile !== undefined;
  console.log('🔍 Editing state check:', {
    editingSubprofile: window.editingSubprofile,
    isEditing: isEditing,
    type: typeof window.editingSubprofile
  });
  let subprofileData;
  
  if (isEditing) {
    // Update existing subprofile
    subprofileData = {
      ...window.editingSubprofile,
      name: name,
      icon: icon,
      description: `Custom subprofile with ${totalItems} selected items`,
      lastModified: new Date().toISOString(),
      includedFields: selectedData
    };
    console.log('📝 Updating existing subprofile:', subprofileData.id);
  } else {
    // Create new subprofile
    subprofileData = {
      id: generateId(),
      name: name,
      description: `Custom subprofile with ${totalItems} selected items`,
      icon: icon,
      color: '#6B7280', // Default color
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isActive: true,
      includedFields: selectedData
    };
    console.log('🆕 Creating new subprofile:', subprofileData.id);
  }
  
  console.log('💾 Final subprofile object:', subprofileData);
  
  try {
    // Import validation functions
    const { cleanSubprofile, validateSubprofile } = await import('./schema.js');
    
    const cleaned = cleanSubprofile(subprofileData);
    const errors = validateSubprofile(cleaned);
    
    if (errors.length > 0) {
      showNotification(`Validation errors: ${errors.join('; ')}`, 'error');
      return;
    }
    
    // Save subprofile
    const saveResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'SAVE_SUBPROFILE', subprofile: cleaned }, resolve);
    });
    
    if (saveResponse?.ok) {
      await loadSubprofiles(); // Refresh the dropdown
      const action = isEditing ? 'updated' : 'created';
      showNotification(`Subprofile "${name}" ${action} successfully!`, 'success');
      
      // Auto-switch to the subprofile and close modal
      await switchSubprofile(cleaned.id);
      closeSubprofileCreationModal();
      
      // Clear editing state
      window.editingSubprofile = null;
    } else {
      const action = isEditing ? 'update' : 'create';
      showNotification(saveResponse?.error || `Failed to ${action} subprofile`, 'error');
    }
  } catch (error) {
    const action = isEditing ? 'update' : 'create';
    console.error(`Failed to ${action} subprofile:`, error);
    showNotification(`Failed to ${action} subprofile`, 'error');
  }
}

// Subprofile Management Functions
async function loadSubprofiles() {
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'LOAD_SUBPROFILES' }, resolve);
    });
    
    if (response?.ok) {
      subprofiles = response.subprofiles || [];
      await loadActiveSubprofile();
      updateSubprofileSelector();
    }
  } catch (error) {
    console.error('Failed to load subprofiles:', error);
  }
}

async function loadActiveSubprofile() {
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_ACTIVE_SUBPROFILE' }, resolve);
    });
    
    if (response?.ok) {
      activeSubprofileId = response.activeSubprofileId;
    }
  } catch (error) {
    console.error('Failed to load active subprofile:', error);
  }
}

function updateSubprofileSelector() {
  const selector = elements.subprofileSelector;
  if (!selector) return;
  
  // Clear existing options except the first one (Full Profile)
  while (selector.children.length > 1) {
    selector.removeChild(selector.lastChild);
  }
  
  // Add subprofile options
  subprofiles.forEach(subprofile => {
    const option = document.createElement('option');
    option.value = subprofile.id;
    option.textContent = `${subprofile.icon} ${subprofile.name}`;
    
    if (subprofile.id === activeSubprofileId) {
      option.selected = true;
    }
    
    selector.appendChild(option);
  });
  
  // Set the current value
  if (activeSubprofileId) {
    selector.value = activeSubprofileId;
  } else {
    selector.value = '';
  }
  
  // Show/hide edit and delete buttons based on active subprofile
  updateSubprofileManagementButtons();
}

function updateSubprofileManagementButtons() {
  const hasActiveSubprofile = activeSubprofileId && activeSubprofileId !== '';
  
  if (elements.editSubprofileBtn) {
    elements.editSubprofileBtn.style.display = hasActiveSubprofile ? 'inline-flex' : 'none';
  }
  
  if (elements.deleteSubprofileBtn) {
    elements.deleteSubprofileBtn.style.display = hasActiveSubprofile ? 'inline-flex' : 'none';
  }
}

async function deleteActiveSubprofile() {
  if (!activeSubprofileId) {
    showNotification('No subprofile selected to delete', 'error');
    return;
  }
  
  // Find the active subprofile
  const activeSubprofile = subprofiles.find(s => s.id === activeSubprofileId);
  if (!activeSubprofile) {
    showNotification('Active subprofile not found', 'error');
    return;
  }
  
  // Confirm deletion
  const confirmMessage = `Are you sure you want to delete "${activeSubprofile.name}"?\n\nThis action cannot be undone.`;
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    // Delete the subprofile
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ 
        type: 'DELETE_SUBPROFILE', 
        subprofileId: activeSubprofileId 
      }, resolve);
    });
    
    if (response?.ok) {
      showNotification(`Subprofile "${activeSubprofile.name}" deleted successfully!`);
      
      // Switch back to full profile
      await switchSubprofile(null);
      
      // Reload subprofiles to update UI
      await loadSubprofiles();
    } else {
      showNotification(response?.error || 'Failed to delete subprofile', 'error');
    }
  } catch (error) {
    console.error('Failed to delete subprofile:', error);
    showNotification('Failed to delete subprofile', 'error');
  }
}

function editActiveSubprofile() {
  if (!activeSubprofileId) {
    showNotification('No subprofile selected to edit', 'error');
    return;
  }
  
  // Find the active subprofile
  const activeSubprofile = subprofiles.find(s => s.id === activeSubprofileId);
  if (!activeSubprofile) {
    showNotification('Active subprofile not found', 'error');
    return;
  }
  
  // Open the creation modal in edit mode
  openSubprofileCreationModal(activeSubprofile);
}

async function switchSubprofile(subprofileId) {
  try {
    console.log('🔄 Switching to subprofile:', subprofileId);
    
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ 
        type: 'SET_ACTIVE_SUBPROFILE', 
        subprofileId: subprofileId || null 
      }, resolve);
    });
    
    if (response?.ok) {
      activeSubprofileId = subprofileId || null;
      console.log('✅ Active subprofile set to:', activeSubprofileId);
      
      // Store the active subprofile ID for content script access
      await chrome.storage.local.set({ activeSubprofileId });
      
      // Refresh the items display to show only items from the active subprofile
      filterItems();
      updateUI();
      
      // Show feedback to user
      const subprofileName = subprofileId 
        ? subprofiles.find(s => s.id === subprofileId)?.name || 'Unknown'
        : 'Full Profile';
      
      console.log(`🎯 Switched to: ${subprofileName}`);
      
      // Update the dropdown to reflect the change
      updateSubprofileSelector();
    } else {
      console.error('❌ Failed to switch subprofile:', response?.error);
    }
  } catch (error) {
    console.error('❌ Failed to switch subprofile:', error);
  }
}

// DEBUG: Add debugging functions for subprofiles
window.debugSubprofiles = async function() {
  console.log("🧪 === SUBPROFILE DEBUG ===");
  
  console.log("📋 Context Items:", contextItems.length);
  console.log("   IDs:", contextItems.map(item => item.id));
  
  console.log("🏷️ Subprofiles:", subprofiles.length);
  subprofiles.forEach((sub, i) => {
    console.log(`   ${i+1}. "${sub.name}": contextItems =`, sub.includedFields?.contextItems || []);
  });
  
  console.log("🎯 Active Subprofile ID:", activeSubprofileId);
  
  if (activeSubprofileId) {
    const active = subprofiles.find(s => s.id === activeSubprofileId);
    console.log("🔍 Active Subprofile Data:", active);
    
    if (active?.includedFields?.contextItems) {
      const expectedIds = active.includedFields.contextItems;
      const availableIds = contextItems.map(item => item.id);
      const matchingItems = contextItems.filter(item => expectedIds.includes(item.id));
      
      console.log("   Expected IDs:", expectedIds);
      console.log("   Available IDs:", availableIds);  
      console.log("   Matching Items:", matchingItems.length, matchingItems.map(item => item.id));
      
      const missingIds = expectedIds.filter(id => !availableIds.includes(id));
      if (missingIds.length > 0) {
        console.log("   ❌ Missing IDs:", missingIds);
      } else {
        console.log("   ✅ All IDs found");
      }
    }
  }
  
  console.log("🧪 === DEBUG COMPLETE ===");
};

console.log("🧪 Debug function loaded! Run: debugSubprofiles()");

// Settings Management Functions

async function loadAutoInjectSettings() {
  try {
    console.log('📥 Loading auto-inject settings...');
    const result = await chrome.storage.local.get(['autoInjectSettings']);
    console.log('Storage result:', result);
    
    if (result.autoInjectSettings) {
      autoInjectSettings = { ...autoInjectSettings, ...result.autoInjectSettings };
      console.log('✅ Loaded auto-inject settings:', autoInjectSettings);
    } else {
      console.log('ℹ️ No auto-inject settings found in storage, using defaults:', autoInjectSettings);
    }
  } catch (error) {
    console.error('❌ Error loading auto-inject settings:', error);
  }
}

async function saveAutoInjectSettings() {
  try {
    await chrome.storage.local.set({ autoInjectSettings });
    console.log('Saved auto-inject settings:', autoInjectSettings);
    
    // Notify content scripts about the settings change
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      if (tab.url && (tab.url.includes('claude.ai') || tab.url.includes('chatgpt.com') || tab.url.includes('gemini.google.com'))) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'AUTO_INJECT_SETTINGS_CHANGED',
          settings: autoInjectSettings
        }).catch(() => {}); // Ignore errors if content script not loaded
      }
    });
  } catch (error) {
    console.error('Error saving auto-inject settings:', error);
  }
}

function openSettingsModal() {
  console.log('⚙️ Opening settings modal');
  console.log('Current autoInjectSettings:', autoInjectSettings);
  
  // Update UI with current settings
  elements.autoInjectToggle.checked = autoInjectSettings.enabled;
  elements.autoInjectDelay.value = autoInjectSettings.delay.toString();
  elements.autoInjectDelayRow.style.display = autoInjectSettings.enabled ? 'flex' : 'none';
  
  console.log('Set toggle to:', elements.autoInjectToggle.checked);
  console.log('Set delay to:', elements.autoInjectDelay.value);
  
  // Update current profile display
  const currentProfileText = activeSubprofileId 
    ? subprofiles.find(s => s.id === activeSubprofileId)?.name || 'Unknown Subprofile'
    : 'Full Profile';
  elements.currentAutoProfile.textContent = currentProfileText;
  
  elements.settingsModal.style.display = 'flex';
  console.log('✅ Settings modal opened');
}

function closeSettingsModal() {
  elements.settingsModal.style.display = 'none';
  console.log('Settings modal closed');
}

// Auto-save when toggle changes
async function onAutoInjectToggleChange() {
  console.log('🔄 Auto-inject toggle changed to:', elements.autoInjectToggle.checked);
  
  // Update settings
  autoInjectSettings.enabled = elements.autoInjectToggle.checked;
  
  // Show/hide delay row
  elements.autoInjectDelayRow.style.display = autoInjectSettings.enabled ? 'flex' : 'none';
  
  // Auto-save
  await saveAutoInjectSettings();
  console.log('✅ Auto-inject toggle auto-saved');
}

// Auto-save when delay changes
async function onAutoInjectDelayChange() {
  console.log('🔄 Auto-inject delay changed to:', elements.autoInjectDelay.value);
  
  // Update settings
  autoInjectSettings.delay = parseInt(elements.autoInjectDelay.value, 10);
  
  // Auto-save
  await saveAutoInjectSettings();
  console.log('✅ Auto-inject delay auto-saved');
}

// Fix: Add subprofile selector to the existing setupEventListeners function
// We need to find and modify the original function instead of overriding it