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
  betaLabBtn: document.getElementById('betaLabBtn'),
  profileAvatar: document.querySelector('.profile-avatar'),
  
  // Subprofile Creation Modal
  subprofileCreationModal: document.getElementById('subprofileCreationModal'),
  closeSubprofileModal: document.getElementById('closeSubprofileModal'),
  customSubprofileForm: document.getElementById('customSubprofileForm'),
  subprofileName: document.getElementById('subprofileName'),
  subprofileCategorySelect: document.getElementById('subprofileCategorySelect'),
  dataSelectionContainer: document.getElementById('dataSelectionContainer'),
  cancelSubprofileBtn: document.getElementById('cancelSubprofileBtn'),
  createSubprofileBtn: document.getElementById('createSubprofileBtn'),
  
  // Profile Modal
  profileModal: document.getElementById('profileModal'),
  closeModal: document.getElementById('closeModal'),
  profileImageInput: document.getElementById('profileImageInput'),
  uploadImageBtn: document.getElementById('uploadImageBtn'),
  removeImageBtn: document.getElementById('removeImageBtn'),
  personalDescription: document.getElementById('personalDescription'),
  privacyLink: document.getElementById('privacyLink'),
  profileName: document.getElementById('profileName'),
  
  // Edit Modal
  editModal: document.getElementById('editModal'),
  closeEditModal: document.getElementById('closeEditModal'),
  editItemForm: document.getElementById('editItemForm'),
  editCategory: document.getElementById('editCategory'),
  customCategoryGroup: document.getElementById('customCategoryGroup'),
  customCategory: document.getElementById('customCategory'),
  editQuestion: document.getElementById('editQuestion'),
  editAnswer: document.getElementById('editAnswer'),
  favoriteBtn: document.getElementById('favoriteBtn'),
  deleteItemBtn: document.getElementById('deleteItemBtn'),
  saveEditBtn: document.getElementById('saveEditBtn'),
  
  // Category Filter
  searchFilterSection: document.querySelector('.search-filter-section'),
  categoryFilterSection: document.getElementById('categoryFilterSection'),
  categoryFilter: document.getElementById('categoryFilter'),
  categoryToggleBtn: document.getElementById('categoryToggleBtn'),
  
  // Form
  formSection: document.getElementById('formSection'),
  contextForm: document.getElementById('contextForm'),
  formTitle: document.getElementById('formTitle'),
  formSubtitle: document.getElementById('formSubtitle'),
  categorySelect: document.getElementById('categorySelect'),
  mainCustomCategoryGroup: document.getElementById('mainCustomCategoryGroup'),
  mainCustomCategory: document.getElementById('mainCustomCategory'),
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
  settingsMainView: document.getElementById('settingsMainView'),

  // Beta Lab Elements
  betaLabModal: document.getElementById('betaLabModal'),
  closeBetaLabModal: document.getElementById('closeBetaLabModal'),
  betaAutoInjectToggle: document.getElementById('betaAutoInjectToggle'),
  betaAutoInjectDelay: document.getElementById('betaAutoInjectDelay'),
  betaAutoInjectSettings: document.getElementById('betaAutoInjectSettings'),
  betaCurrentProfile: document.getElementById('betaCurrentProfile'),
  promptLibraryBtn: document.getElementById('openPromptLibraryBtn'),
  promptLibraryModal: document.getElementById('promptLibraryModal'),
  closePromptLibraryModal: document.getElementById('closePromptLibraryModal'),
  promptLibraryForm: document.getElementById('promptLibraryForm'),
  promptName: document.getElementById('promptName'),
  promptTag: document.getElementById('promptTag'),
  promptText: document.getElementById('promptText'),
  addPromptBtn: document.getElementById('addPromptBtn'),
  promptForm: document.getElementById('promptForm'),
  promptFormTitle: document.getElementById('promptFormTitle'),
  savePromptBtn: document.getElementById('savePromptBtn'),
  cancelPromptBtn: document.getElementById('cancelPromptBtn'),
  promptsList: document.getElementById('promptLibraryContent'),
  
  addBtn: document.getElementById('addBtn')
};

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize editing state
  window.editingSubprofile = null;
  
  await loadItems();
  await loadSubprofiles();
  await loadAutoInjectSettings();
  await loadPromptLibrary();
  // Load active subprofile ID
  const result = await chrome.storage.local.get(['activeSubprofileId']);
  activeSubprofileId = result.activeSubprofileId || null;
  setupEventListeners();
  initializeCategoryFilterState(); // Initialize collapsed/expanded state
  // updateUI() is already called in loadItems(), no need to call it again
  loadProfileImage(); // Load profile image after DOM is ready
  loadPersonalDescription(); // Load personal description after DOM is ready
  loadProfileName(); // Load profile name after DOM is ready
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
    let matchesCategory;
    if (!selectedCategory) {
      matchesCategory = true; // Show all
    } else if (selectedCategory === 'favorites') {
      matchesCategory = item.isFavorite === true; // Show only favorites
    } else {
      matchesCategory = item.category === selectedCategory; // Show by category
    }

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
  
  // Show/hide category filter section
  if (contextItems.length > 0 && !isAddingItem && !editingItem) {
    // Ensure itemsToFilter is initialized, fallback to contextItems if not
    const itemsForFilter = (itemsToFilter && itemsToFilter.length >= 0) ? itemsToFilter : contextItems;
    updateCategoryFilter(itemsForFilter); // Pass subprofile-filtered items
    elements.categoryFilterSection.style.display = 'block';
  } else {
    elements.categoryFilterSection.style.display = 'none';
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

  // Count favorites (with safety check)
  const favoritesCount = itemsToShow.filter(item => item.isFavorite === true).length;

  console.log('📊 Categories found:', categories, 'with counts:', counts);

  elements.categoryFilter.innerHTML = '';

  // Add "All" category
  const allChip = createCategoryChip(null, 'All', itemsToShow.length);
  elements.categoryFilter.appendChild(allChip);

  // Add "Favorites" category if there are any favorites
  if (favoritesCount > 0) {
    const favoritesChip = createCategoryChip('favorites', 'Favorites', favoritesCount);
    elements.categoryFilter.appendChild(favoritesChip);
  }

  // Add other categories
  categories.forEach(category => {
    const chip = createCategoryChip(category, category, counts[category]);
    elements.categoryFilter.appendChild(chip);
  });
}

// Toggle category filter collapse/expand
function toggleCategoryFilter() {
  const section = elements.searchFilterSection;
  const categorySection = elements.categoryFilterSection;
  const isCollapsed = section.classList.contains('collapsed');

  if (isCollapsed) {
    section.classList.remove('collapsed');
    categorySection.style.display = 'block';
    localStorage.setItem('categoryFilterCollapsed', 'false');
  } else {
    section.classList.add('collapsed');
    categorySection.style.display = 'none';
    localStorage.setItem('categoryFilterCollapsed', 'true');
  }
}

// Initialize category filter state from localStorage
function initializeCategoryFilterState() {
  const isCollapsed = localStorage.getItem('categoryFilterCollapsed') === 'true';
  if (isCollapsed) {
    elements.searchFilterSection.classList.add('collapsed');
    elements.categoryFilterSection.style.display = 'none';
  } else {
    elements.searchFilterSection.classList.remove('collapsed');
    elements.categoryFilterSection.style.display = 'block';
  }
}

// Create category chip element
function createCategoryChip(value, label, count) {
  const chip = document.createElement('button');
  chip.className = 'category-chip';
  if (selectedCategory === value) {
    chip.classList.add('active');
  }

  // Add special class for favorites
  if (value === 'favorites') {
    chip.classList.add('favorites');
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
    },
    'Favorites': {
      color: '#FF5A5F',
      icon: '❤️'
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

  const gradientId = `heartGradient-${item.id}`;
  const favoriteIcon = item.isFavorite === true ? `
    <button class="context-favorite-btn favorited" data-item-id="${item.id}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="url(#${gradientId})" stroke="url(#${gradientId})" stroke-width="2">
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#04214E;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#87CEEB;stop-opacity:1" />
          </linearGradient>
        </defs>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    </button>
  ` : `
    <button class="context-favorite-btn" data-item-id="${item.id}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    </button>
  `;

  card.innerHTML = `
    <div class="context-content">
      <div class="context-text">
        <div class="context-question">${escapeHtml(item.question)}</div>
        <div class="context-answer">${escapeHtml(item.answer)}</div>
      </div>
      <div class="context-actions">
        ${favoriteIcon}
      </div>
    </div>
  `;

  // Add event listeners
  card.addEventListener('click', (e) => {
    // Don't open modal if clicking on favorite button
    if (e.target.closest('.context-favorite-btn')) {
      return;
    }
    openEditModal(item);
  });

  // Add favorite button event listener
  const favoriteBtn = card.querySelector('.context-favorite-btn');
  if (favoriteBtn) {
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleItemFavorite(item.id);
    });
  }

  return card;
}

// Toggle favorite status for item in main list
function toggleItemFavorite(itemId) {
  const itemIndex = contextItems.findIndex(item => item.id === itemId);
  if (itemIndex !== -1) {
    const newFavoriteState = !contextItems[itemIndex].isFavorite;
    contextItems[itemIndex].isFavorite = newFavoriteState;
    saveItems();

    // Re-render the items to update the UI
    filterItems();
    updateUI();

    // Show notification
    showNotification(newFavoriteState ? 'Added to favorites!' : 'Removed from favorites');
  }
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
  
  let category = elements.categorySelect.value;
  const question = elements.questionInput.value.trim();
  const answer = elements.answerInput.value.trim();
  
  // Handle custom category
  if (category === 'Other') {
    const customCategory = elements.mainCustomCategory.value.trim();
    if (!customCategory) {
      showNotification('Please enter a custom category name', 'error');
      return;
    }
    category = customCategory;
  }
  
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
async function handleExport() {
  // Load personal description, prompt library, and subprofiles from storage
  const storageData = await chrome.storage.local.get(['personalDescription', 'promptLibrary']);

  // Load subprofiles
  const subprofileResponse = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'LOAD_SUBPROFILES' }, resolve);
  });
  const currentSubprofiles = subprofileResponse?.ok ? subprofileResponse.subprofiles : [];

  // Extract favorites from context items (with safety check)
  const favorites = contextItems.filter(item => item.isFavorite === true);

  // Create comprehensive export data
  const exportData = {
    version: '2.3',
    exportedAt: new Date().toISOString(),
    personalDescription: storageData.personalDescription || null,
    contextItems: contextItems,
    favorites: favorites,
    subprofiles: currentSubprofiles,
    promptLibrary: storageData.promptLibrary || [],
    // Include metadata
    metadata: {
      totalItems: contextItems.length,
      totalFavorites: favorites.length,
      totalSubprofiles: currentSubprofiles.length,
      totalPrompts: (storageData.promptLibrary || []).length,
      categories: [...new Set(contextItems.map(item => item.category))],
      hasPersonalDescription: !!storageData.personalDescription,
      hasFavorites: favorites.length > 0,
      hasSubprofiles: currentSubprofiles.length > 0,
      hasPromptLibrary: (storageData.promptLibrary || []).length > 0
    }
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'personal-context-backup.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  const promptCount = (storageData.promptLibrary || []).length;
  let message = 'Data exported successfully!';
  if (promptCount > 0) {
    message = `Context and ${promptCount} prompts exported successfully!`;
  }
  showNotification(message);
}

// Handle import
function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          let itemsToImport = [];
          let importedPromptCount = 0;
          let importedSubprofileCount = 0;
          let importedFavoriteCount = 0;

          // Handle new format (v2.3 with favorites and subprofiles, v2.2 with prompt library, or v2.1 with personal description)
          if (imported.version === '2.3' || imported.version === '2.2' || imported.version === '2.1') {
            // Import personal description if present
            if (imported.personalDescription) {
              chrome.storage.local.set({ personalDescription: imported.personalDescription });
              // Update UI if personal description textarea exists
              if (elements.personalDescription) {
                elements.personalDescription.value = imported.personalDescription;
              }
            }

            // Import prompt library if present (v2.2+ feature)
            if (imported.promptLibrary && Array.isArray(imported.promptLibrary)) {
              chrome.storage.local.set({ promptLibrary: imported.promptLibrary });
              // Update the global promptLibrary variable if it exists
              if (typeof promptLibrary !== 'undefined') {
                promptLibrary = imported.promptLibrary;
              }
              importedPromptCount = imported.promptLibrary.length;
            }

            // Import subprofiles if present (v2.3+ feature)
            if (imported.subprofiles && Array.isArray(imported.subprofiles)) {
              try {
                // Import subprofiles via background script
                const subprofileResponse = await new Promise((resolve) => {
                  chrome.runtime.sendMessage({
                    type: 'IMPORT_SUBPROFILES',
                    subprofiles: imported.subprofiles
                  }, resolve);
                });

                if (subprofileResponse?.ok) {
                  console.log(`Imported ${imported.subprofiles.length} subprofiles`);
                  importedSubprofileCount = imported.subprofiles.length;
                  // Reload subprofiles to update UI
                  await loadSubprofiles();
                } else {
                  console.error('Failed to import subprofiles:', subprofileResponse?.error);
                }
              } catch (error) {
                console.error('Failed to import subprofiles:', error);
              }
            }

            // Import context items if they exist
            if (imported.contextItems && Array.isArray(imported.contextItems)) {
              itemsToImport = imported.contextItems.map(item => ({
                ...item,
                id: item.id || generateId(),
                createdAt: new Date(item.createdAt || Date.now()),
                updatedAt: new Date(item.updatedAt || Date.now())
              }));

              // Count favorites in the imported data (with safety check)
              importedFavoriteCount = imported.contextItems.filter(item => item.isFavorite === true).length;
            }
          }
          // Handle array format (original format)
          else if (Array.isArray(imported)) {
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
              let message = `Imported ${newItems.length} context items`;

              try {
                if (importedPromptCount > 0) {
                  message += `, ${importedPromptCount} prompts`;
                }
                if (importedSubprofileCount > 0) {
                  message += `, ${importedSubprofileCount} subprofiles`;
                }
                if (importedFavoriteCount > 0) {
                  message += ` (including ${importedFavoriteCount} favorites)`;
                }
                if (skippedCount > 0) {
                  message += ` (${skippedCount} duplicates skipped)`;
                }
                showNotification(message + '!');
              } catch (error) {
                console.error('Error building notification message:', error);
                showNotification(`Imported ${newItems.length} context items!`);
              }
            } else {
              // Handle case where no context items but prompts were imported
              if (importedPromptCount > 0) {
                showNotification(`Imported ${importedPromptCount} prompts! All context items already exist.`, 'info');
              } else {
                showNotification('All items already exist. No new items imported.', 'info');
              }
            }
          } else {
            // Handle case where no context items but prompts were imported
            if (importedPromptCount > 0) {
              showNotification(`Imported ${importedPromptCount} prompts successfully!`);
            } else {
              showNotification('No valid items found in the imported file.', 'error');
            }
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

  // Category Filter Toggle
  elements.categoryToggleBtn.addEventListener('click', toggleCategoryFilter);

  // Import/Export
  elements.importBtn.addEventListener('click', handleImport);
  elements.exportBtn.addEventListener('click', handleExport);
  
  // Settings
  elements.settingsBtn.addEventListener('click', openSettingsModal);
  elements.closeSettingsModal.addEventListener('click', closeSettingsModal);

  // Beta Lab Button
  if (elements.betaLabBtn) {
    elements.betaLabBtn.addEventListener('click', openBetaLabModal);
  }
  
  if (elements.closeBetaLabModal) {
    elements.closeBetaLabModal.addEventListener('click', closeBetaLabModal);
  }
  
  if (elements.betaAutoInjectToggle) {
    elements.betaAutoInjectToggle.addEventListener('change', onBetaAutoInjectToggleChange);
  }
  
  if (elements.betaAutoInjectDelay) {
    elements.betaAutoInjectDelay.addEventListener('change', onBetaAutoInjectDelayChange);
  }
  
  if (elements.promptLibraryBtn) {
    elements.promptLibraryBtn.addEventListener('click', openPromptLibraryModal);
  }
  
  if (elements.addPromptBtn) {
    elements.addPromptBtn.addEventListener('click', showPromptForm);
  }
  
  if (elements.closePromptLibraryModal) {
    elements.closePromptLibraryModal.addEventListener('click', closePromptLibraryModal);
  }
  
  if (elements.promptLibraryForm) {
    elements.promptLibraryForm.addEventListener('submit', handleSavePrompt);
  }
  
  if (elements.cancelPromptBtn) {
    elements.cancelPromptBtn.addEventListener('click', hidePromptForm);
  }
  
  // Close modals on outside click
  if (elements.betaLabModal) {
    elements.betaLabModal.addEventListener('click', (e) => {
      if (e.target === elements.betaLabModal) {
        closeBetaLabModal();
      }
    });
  }
  
  if (elements.promptLibraryModal) {
    elements.promptLibraryModal.addEventListener('click', (e) => {
      if (e.target === elements.promptLibraryModal) {
        closePromptLibraryModal();
      }
    });
  }
  
  // Profile Modal
  elements.profileAvatar.addEventListener('click', openProfileModal);
  elements.closeModal.addEventListener('click', closeProfileModal);
  elements.uploadImageBtn.addEventListener('click', () => elements.profileImageInput.click());
  elements.profileImageInput.addEventListener('change', handleImageUpload);
  elements.removeImageBtn.addEventListener('click', removeProfileImage);
  elements.personalDescription.addEventListener('input', handlePersonalDescriptionChange);
  elements.privacyLink.addEventListener('click', openPrivacyStatement);
  elements.profileName.addEventListener('input', handleProfileNameChange);
  elements.profileName.addEventListener('blur', handleProfileNameBlur);
  
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
    // Hide custom category field when canceling
    if (elements.mainCustomCategoryGroup) {
      elements.mainCustomCategoryGroup.style.display = 'none';
    }
    updateUI();
  });
  
  // Category selection handlers
  if (elements.categorySelect) {
    elements.categorySelect.addEventListener('change', handleMainCategoryChange);
  }
  if (elements.editCategory) {
    elements.editCategory.addEventListener('change', handleEditCategoryChange);
  }
  
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
  
  // Category selection for subprofiles
  if (elements.subprofileCategorySelect) {
    elements.subprofileCategorySelect.addEventListener('change', handleCategorySelection);
  }
}

// Category selection handlers
function handleMainCategoryChange(e) {
  const selectedCategory = e.target.value;
  if (selectedCategory === 'Other') {
    elements.mainCustomCategoryGroup.style.display = 'block';
    elements.mainCustomCategory.required = true;
  } else {
    elements.mainCustomCategoryGroup.style.display = 'none';
    elements.mainCustomCategory.required = false;
    elements.mainCustomCategory.value = '';
  }
}

function handleEditCategoryChange(e) {
  const selectedCategory = e.target.value;
  if (selectedCategory === 'Other') {
    elements.customCategoryGroup.style.display = 'block';
    elements.customCategory.required = true;
  } else {
    elements.customCategoryGroup.style.display = 'none';
    elements.customCategory.required = false;
    elements.customCategory.value = '';
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
  
  // Build context text from items (now async)
  const contextText = await buildContextText();
  
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
async function buildContextText() {
  // Load personal description from storage
  const personalDescriptionData = await chrome.storage.local.get(['personalDescription']);

  let text = '# Personal Context\n\n';

  // Add personal description at the top if available
  if (personalDescriptionData.personalDescription) {
    text += `## About Me\n${personalDescriptionData.personalDescription}\n\n`;
  }

  // Use filtered items (respects subprofile selection) instead of all contextItems
  const itemsToInclude = itemsToFilter && itemsToFilter.length >= 0 ? itemsToFilter : contextItems;

  if (itemsToInclude.length === 0) {
    // Return text with just personal description if no context items
    return personalDescriptionData.personalDescription ? text : '';
  }

  // Separate favorites from regular items
  const favorites = itemsToInclude.filter(item => item.isFavorite === true);
  const regularItems = itemsToInclude.filter(item => item.isFavorite !== true);

  // Add favorites section first if there are any
  if (favorites.length > 0) {
    text += `## ⭐ Favorites\n`;
    favorites.forEach(item => {
      text += `- **${item.question}**: ${item.answer}\n`;
    });
    text += '\n';
  }

  // Group regular items by category
  const grouped = regularItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

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
  loadPersonalDescription();
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

function handlePersonalDescriptionChange(e) {
  const description = e.target.value;
  // Auto-save with a small debounce to avoid excessive storage writes
  clearTimeout(window.descriptionSaveTimeout);
  window.descriptionSaveTimeout = setTimeout(() => {
    chrome.storage.local.set({ personalDescription: description }, () => {
      console.log('Personal description saved');
    });
  }, 500);
}

function loadPersonalDescription() {
  chrome.storage.local.get(['personalDescription'], (result) => {
    if (result.personalDescription && elements.personalDescription) {
      elements.personalDescription.value = result.personalDescription;
    }
  });
}

// Profile Name Functions
function handleProfileNameChange() {
  const name = elements.profileName.textContent.trim();
  
  // Update avatar letter immediately while typing
  updateAvatarLetter(name);
  
  // Save with debouncing
  clearTimeout(window.nameChangeTimeout);
  window.nameChangeTimeout = setTimeout(() => {
    saveProfileName(name);
  }, 500);
}

function handleProfileNameBlur() {
  const name = elements.profileName.textContent.trim();
  
  // If name is empty, show placeholder by clearing content
  if (!name) {
    elements.profileName.textContent = '';
  }
  
  // Save immediately on blur
  clearTimeout(window.nameChangeTimeout);
  saveProfileName(name);
}

function saveProfileName(name) {
  chrome.storage.local.set({ profileName: name }, () => {
    console.log('Profile name saved:', name);
    updateAvatarLetter(name);
  });
}

function loadProfileName() {
  chrome.storage.local.get(['profileName'], (result) => {
    if (result.profileName) {
      elements.profileName.textContent = result.profileName;
      updateAvatarLetter(result.profileName);
    } else {
      // Show placeholder if no name is set
      elements.profileName.textContent = '';
      updateAvatarLetter('');
    }
  });
}

function updateAvatarLetter(name) {
  const avatarLetter = document.querySelector('.avatar-letter');
  if (avatarLetter) {
    if (name && name.trim()) {
      // Use first letter of the name, capitalized
      avatarLetter.textContent = name.trim().charAt(0).toUpperCase();
    } else {
      // Default to '?' when no name is set
      avatarLetter.textContent = '?';
    }
  }
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
  
  // Check if the item's category is a predefined one
  const predefinedCategories = [
    'Hobbies', 'Food & Drink', 'Entertainment & Media', 'Travel & Activities',
    'Lifestyle & Preferences', 'Work & Professional', 'Technology & Communication',
    'Transportation', 'Social & Personal', 'Weather & Environment'
  ];
  
  if (predefinedCategories.includes(item.category)) {
    // Standard category - select it in dropdown
    elements.editCategory.value = item.category;
    elements.customCategoryGroup.style.display = 'none';
    elements.customCategory.required = false;
    elements.customCategory.value = '';
  } else {
    // Custom category - select "Other" and show custom field
    elements.editCategory.value = 'Other';
    elements.customCategoryGroup.style.display = 'block';
    elements.customCategory.required = true;
    elements.customCategory.value = item.category;
  }
  
  // Populate other form fields
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
  // Hide custom category field
  elements.customCategoryGroup.style.display = 'none';
  elements.customCategory.required = false;
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
  
  let category = elements.editCategory.value;
  
  // Handle custom category
  if (category === 'Other') {
    const customCategory = elements.customCategory.value.trim();
    if (!customCategory) {
      showNotification('Please enter a custom category name', 'error');
      return;
    }
    category = customCategory;
  }
  
  // Validate form
  if (!category || !elements.editQuestion.value.trim() || !elements.editAnswer.value.trim()) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  // Update the item
  currentEditingItem.category = category;
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
// Update subprofile category selector with custom categories
async function updateSubprofileCategoryOptions() {
  if (!elements.subprofileCategorySelect) return;
  
  // Get all unique categories from context items
  const result = await chrome.storage.local.get(['contextItems']);
  const contextItems = result.contextItems || [];
  
  const predefinedCategories = [
    { value: 'Hobbies', label: '🎯 Hobbies' },
    { value: 'Food & Drink', label: '🍽️ Food & Drink' },
    { value: 'Entertainment & Media', label: '🎬 Entertainment & Media' },
    { value: 'Travel & Activities', label: '✈️ Travel & Activities' },
    { value: 'Lifestyle & Preferences', label: '💜 Lifestyle & Preferences' },
    { value: 'Work & Professional', label: '💼 Work & Professional' },
    { value: 'Technology & Communication', label: '📱 Technology & Communication' },
    { value: 'Transportation', label: '🚗 Transportation' },
    { value: 'Social & Personal', label: '👥 Social & Personal' },
    { value: 'Weather & Environment', label: '☀️ Weather & Environment' }
  ];
  
  // Get all unique categories from items
  const allCategories = [...new Set(contextItems.map(item => item.category))];
  
  // Find custom categories (not in predefined list)
  const predefinedValues = predefinedCategories.map(cat => cat.value);
  const customCategories = allCategories.filter(cat => !predefinedValues.includes(cat));
  
  // Clear existing options except the first one
  const selector = elements.subprofileCategorySelect;
  while (selector.children.length > 1) {
    selector.removeChild(selector.lastChild);
  }
  
  // Add predefined categories
  predefinedCategories.forEach(category => {
    if (allCategories.includes(category.value)) {
      const option = document.createElement('option');
      option.value = category.value;
      option.textContent = category.label;
      selector.appendChild(option);
    }
  });
  
  // Add custom categories
  customCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = `📝 ${category}`;
    selector.appendChild(option);
  });
}

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
  
  // Update category options with custom categories
  await updateSubprofileCategoryOptions();
  
  // Reset category selector to default
  if (elements.subprofileCategorySelect) {
    elements.subprofileCategorySelect.value = '';
  }
  
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

// Handle category selection in subprofile creation
async function handleCategorySelection(e) {
  const selectedCategory = e.target.value;
  
  if (!selectedCategory) {
    // If no category selected, just refresh the data selection to show all items
    await populateDataSelection(window.editingSubprofile);
    return;
  }
  
  console.log('🏷️ Category selected:', selectedCategory);
  
  // Wait for data selection to be populated, then auto-select category items
  setTimeout(async () => {
    await selectCategoryItems(selectedCategory);
  }, 100);
}

// Auto-select all items from a specific category
async function selectCategoryItems(category) {
  console.log('🎯 Auto-selecting items from category:', category);
  
  // Load context items first
  const result = await chrome.storage.local.get(['contextItems']);
  const contextItems = result.contextItems || [];
  
  // Find all checkboxes in the data selection container
  const container = elements.dataSelectionContainer;
  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  
  let selectedCount = 0;
  
  checkboxes.forEach(checkbox => {
    // For context items, the name attribute is "contextItems" and value contains the item ID
    const nameAttr = checkbox.getAttribute('name');
    const itemId = checkbox.getAttribute('value');
    
    // Check if this is a context item from the selected category
    if (nameAttr === 'contextItems' && itemId) {
      // Find the actual context item to check its category
      const item = contextItems.find(item => item.id === itemId);
      
      if (item && item.category === category) {
        checkbox.checked = true;
        selectedCount++;
        console.log('✅ Selected item:', item.question);
      }
    }
  });
  
  // Show notification about auto-selection
  if (selectedCount > 0) {
    showNotification(`Auto-selected ${selectedCount} items from ${category} category`);
  } else {
    showNotification(`No items found in ${category} category`);
  }
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

  // Always include favorites in subprofiles (with safety check)
  const favoriteItems = contextItems.filter(item => item.isFavorite === true);
  favoriteItems.forEach(item => {
    if (!selectedData.contextItems.includes(item.id)) {
      selectedData.contextItems.push(item.id);
    }
  });
  
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
      updateBetaLabCurrentProfile();
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
  
  // Add subprofile options with category divider
  if (subprofiles.length > 0) {
    // Create optgroup for subprofiles
    const subprofileGroup = document.createElement('optgroup');
    subprofileGroup.label = 'Subprofiles';
    
    subprofiles.forEach(subprofile => {
      const option = document.createElement('option');
      option.value = subprofile.id;
      option.textContent = subprofile.name;
      
      if (subprofile.id === activeSubprofileId) {
        option.selected = true;
      }
      
      subprofileGroup.appendChild(option);
    });
    
    selector.appendChild(subprofileGroup);
  }
  
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
      
      // Update Beta Lab current profile display
      updateBetaLabCurrentProfile();
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
  
  // Always show main view when opening settings
  showSettingsMainView();
  elements.settingsModal.style.display = 'flex';
  console.log('✅ Settings modal opened');
}

function closeSettingsModal() {
  console.log('⚙️ Closing settings modal');
  elements.settingsModal.style.display = 'none';
  console.log('✅ Settings modal closed');
}


// Beta Lab Functions

function updateBetaLabCurrentProfile() {
  // Update current profile display in Beta Lab
  if (elements.betaCurrentProfile) {
    const currentProfileText = activeSubprofileId 
      ? subprofiles.find(s => s.id === activeSubprofileId)?.name || 'Unknown Subprofile'
      : 'Full Profile';
    elements.betaCurrentProfile.textContent = currentProfileText;
  }
}

function openBetaLabModal() {
  console.log('🧪 Opening Beta Lab modal');

  // Show the Beta Lab modal
  elements.betaLabModal.style.display = 'flex';

  // Update auto-injection settings in Beta Lab from current settings
  elements.betaAutoInjectToggle.checked = autoInjectSettings.enabled;
  elements.betaAutoInjectDelay.value = autoInjectSettings.delay.toString();

  // Set initial visibility state with CSS class
  if (autoInjectSettings.enabled) {
    elements.betaAutoInjectSettings.classList.add('show');
  } else {
    elements.betaAutoInjectSettings.classList.remove('show');
  }

  // Update current profile display
  updateBetaLabCurrentProfile();
}

function showSettingsMainView() {
  console.log('📱 Showing settings main view');
  elements.settingsMainView.style.display = 'block';
}

function closeBetaLabModal() {
  elements.betaLabModal.style.display = 'none';
  console.log('Beta Lab modal closed');
}

async function onBetaAutoInjectToggleChange() {
  console.log('🔄 Beta auto-inject toggle changed to:', elements.betaAutoInjectToggle.checked);
  
  // Update settings
  autoInjectSettings.enabled = elements.betaAutoInjectToggle.checked;
  
  // Show/hide delay settings with smooth transition
  if (autoInjectSettings.enabled) {
    elements.betaAutoInjectSettings.classList.add('show');
  } else {
    elements.betaAutoInjectSettings.classList.remove('show');
  }
  
  // Auto-save
  await saveAutoInjectSettings();
  console.log('✅ Beta auto-inject toggle auto-saved');
}

async function onBetaAutoInjectDelayChange() {
  console.log('🔄 Beta auto-inject delay changed to:', elements.betaAutoInjectDelay.value);
  
  // Update settings
  autoInjectSettings.delay = parseInt(elements.betaAutoInjectDelay.value, 10);
  
  // Auto-save
  await saveAutoInjectSettings();
  console.log('✅ Beta auto-inject delay auto-saved');
}

// Prompt Library Functions

let promptLibrary = [];
let editingPromptId = null;

async function loadPromptLibrary() {
  try {
    const result = await chrome.storage.local.get(['promptLibrary']);
    promptLibrary = result.promptLibrary || [];
    updatePromptsList();
  } catch (error) {
    console.error('Error loading prompt library:', error);
  }
}

async function savePromptLibrary() {
  try {
    await chrome.storage.local.set({ promptLibrary });
    console.log('Prompt library saved:', promptLibrary);
  } catch (error) {
    console.error('Error saving prompt library:', error);
  }
}

function openPromptLibraryModal() {
  console.log('📝 Opening Prompt Library modal');
  loadPromptLibrary();
  elements.promptLibraryModal.style.display = 'flex';
  console.log('✅ Prompt Library modal opened');
}

function showPromptForm(isEditing = false) {
  if (elements.promptForm) {
    elements.promptForm.style.display = 'block';
    
    // Update form title and button text based on mode
    if (elements.promptFormTitle) {
      const titleText = isEditing ? 'Edit Prompt' : 'Add New Prompt';
      elements.promptFormTitle.textContent = titleText;
    }
    
    // Focus on name input
    if (elements.promptName) {
      elements.promptName.focus();
    }
  }
}

function hidePromptForm() {
  if (elements.promptForm) {
    elements.promptForm.style.display = 'none';
    // Reset form and editing state
    if (elements.promptLibraryForm) {
      elements.promptLibraryForm.reset();
    }
    editingPromptId = null;
    
    // Reset form title
    if (elements.promptFormTitle) {
      elements.promptFormTitle.textContent = 'Add New Prompt';
    }
  }
}

function closePromptLibraryModal() {
  elements.promptLibraryModal.style.display = 'none';
  // Hide and reset form
  hidePromptForm();
  console.log('Prompt Library modal closed');
}

async function handleSavePrompt(e) {
  e.preventDefault();
  
  const name = elements.promptName.value.trim();
  const tag = elements.promptTag.value.trim();
  const text = elements.promptText.value.trim();
  
  if (!name || !text) {
    showNotification('Please fill in both name and prompt text', 'error');
    return;
  }
  
  if (editingPromptId) {
    // Update existing prompt
    const promptIndex = promptLibrary.findIndex(p => p.id === editingPromptId);
    if (promptIndex !== -1) {
      promptLibrary[promptIndex] = {
        ...promptLibrary[promptIndex],
        name,
        tag,
        text,
        updatedAt: new Date().toISOString()
      };
      showNotification(`Prompt "${name}" updated successfully!`);
    } else {
      showNotification('Prompt not found', 'error');
      return;
    }
  } else {
    // Create new prompt
    const newPrompt = {
      id: generateId(),
      name,
      tag,
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to library
    promptLibrary.push(newPrompt);
    showNotification(`Prompt "${name}" saved successfully!`);
  }
  
  // Save to storage
  await savePromptLibrary();
  
  // Update UI
  updatePromptsList();
  
  // Hide and reset form
  hidePromptForm();
}

function updatePromptsList() {
  if (!elements.promptsList) return;
  
  if (promptLibrary.length === 0) {
    elements.promptsList.innerHTML = '<div class="empty-message">No prompts saved yet</div>';
    return;
  }
  
  const html = promptLibrary.map(prompt => `
    <div class="prompt-item" data-id="${prompt.id}">
      <div class="prompt-item-content">
        <div class="prompt-item-title">${escapeHtml(prompt.name)}</div>
        ${prompt.tag ? `<div class="prompt-item-tag">/prompt:${escapeHtml(prompt.tag)}</div>` : ''}
        <div class="prompt-item-preview">${escapeHtml(prompt.text.substring(0, 100))}${prompt.text.length > 100 ? '...' : ''}</div>
      </div>
      <div class="prompt-item-actions">
        <button class="button secondary prompt-edit-btn" data-prompt-id="${prompt.id}" title="Edit prompt">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="button secondary prompt-copy-btn" data-prompt-id="${prompt.id}" title="Copy prompt">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button class="button secondary prompt-delete-btn" data-prompt-id="${prompt.id}" title="Delete prompt">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
  
  elements.promptsList.innerHTML = html;
  
  // Add event listeners using event delegation
  setupPromptListEventListeners();
}

function setupPromptListEventListeners() {
  if (!elements.promptsList) return;
  
  // Remove any existing listeners to avoid duplicates
  const clonedPromptsList = elements.promptsList.cloneNode(true);
  elements.promptsList.parentNode.replaceChild(clonedPromptsList, elements.promptsList);
  elements.promptsList = clonedPromptsList;
  
  // Add event delegation for all button clicks
  elements.promptsList.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    
    const promptId = button.getAttribute('data-prompt-id');
    if (!promptId) return;
    
    if (button.classList.contains('prompt-edit-btn')) {
      editPrompt(promptId);
    } else if (button.classList.contains('prompt-copy-btn')) {
      copyPrompt(promptId);
    } else if (button.classList.contains('prompt-delete-btn')) {
      deletePrompt(promptId);
    }
  });
}

// Prompt actions functions
function editPrompt(promptId) {
  const prompt = promptLibrary.find(p => p.id === promptId);
  
  if (!prompt) {
    showNotification('Prompt not found', 'error');
    return;
  }
  
  // Set editing state
  editingPromptId = promptId;
  
  // Populate form with prompt data
  if (elements.promptName) {
    elements.promptName.value = prompt.name;
  }
  
  if (elements.promptTag) {
    elements.promptTag.value = prompt.tag || '';
  }
  
  if (elements.promptText) {
    elements.promptText.value = prompt.text;
  }
  
  // Show form in edit mode
  showPromptForm(true);
}

async function copyPrompt(promptId) {
  const prompt = promptLibrary.find(p => p.id === promptId);
  if (!prompt) return;
  
  try {
    await navigator.clipboard.writeText(prompt.text);
    showNotification(`Copied "${prompt.name}" to clipboard`);
  } catch (error) {
    console.error('Failed to copy prompt:', error);
    showNotification('Failed to copy prompt', 'error');
  }
}

async function deletePrompt(promptId) {
  const prompt = promptLibrary.find(p => p.id === promptId);
  if (!prompt) return;

  if (confirm(`Are you sure you want to delete "${prompt.name}"?`)) {
    promptLibrary = promptLibrary.filter(p => p.id !== promptId);
    await savePromptLibrary();
    updatePromptsList();
    showNotification(`Deleted "${prompt.name}"`);
  }
}

// ============================================
// External Data Import Functions
// ============================================

let extractedInsights = [];
let selectedInsights = new Set();

// Initialize external data import elements and event listeners
function initializeDataImport() {
  // Get elements
  const openDataImportBtn = document.getElementById('openDataImportBtn');
  const dataImportModal = document.getElementById('dataImportModal');
  const closeDataImportModal = document.getElementById('closeDataImportModal');
  const dataImportFileInput = document.getElementById('dataImportFileInput');
  const importBackBtn = document.getElementById('importBackBtn');
  const selectAllImports = document.getElementById('selectAllImports');
  const importCategoryFilter = document.getElementById('importCategoryFilter');
  const cancelImportBtn = document.getElementById('cancelImportBtn');
  const confirmImportBtn = document.getElementById('confirmImportBtn');

  // Event listeners
  if (openDataImportBtn) {
    openDataImportBtn.addEventListener('click', openDataImportModal);
  }

  if (closeDataImportModal) {
    closeDataImportModal.addEventListener('click', closeDataImportModalFunc);
  }

  // Source card selection
  document.querySelectorAll('.source-select-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const source = e.target.dataset.source;
      if (source === 'chatgpt') {
        dataImportFileInput.click();
      }
    });
  });

  if (dataImportFileInput) {
    dataImportFileInput.addEventListener('change', handleFileSelection);
  }

  if (importBackBtn) {
    importBackBtn.addEventListener('click', () => {
      showImportSection('source');
    });
  }

  if (selectAllImports) {
    selectAllImports.addEventListener('change', handleSelectAll);
  }

  if (importCategoryFilter) {
    importCategoryFilter.addEventListener('change', filterImportedInsights);
  }

  if (cancelImportBtn) {
    cancelImportBtn.addEventListener('click', closeDataImportModalFunc);
  }

  if (confirmImportBtn) {
    confirmImportBtn.addEventListener('click', confirmImport);
  }

  // History section buttons
  const importNewBtn = document.getElementById('importNewBtn');
  if (importNewBtn) {
    importNewBtn.addEventListener('click', () => {
      showImportSection('source');
    });
  }

  const importDetailsBackBtn = document.getElementById('importDetailsBackBtn');
  if (importDetailsBackBtn) {
    importDetailsBackBtn.addEventListener('click', () => {
      showImportHistory();
    });
  }
}

async function openDataImportModal() {
  console.log('📥 Opening Data Import modal');
  const modal = document.getElementById('dataImportModal');
  if (modal) {
    modal.style.display = 'flex';

    // Check if there are existing imports
    const result = await chrome.storage.local.get(['importedData']);
    const importedData = result.importedData || [];

    if (importedData.length > 0) {
      // Show history if there are existing imports
      showImportHistory();
    } else {
      // Show source selection for first import
      showImportSection('source');
    }

    // Reset file input
    const fileInput = document.getElementById('dataImportFileInput');
    if (fileInput) {
      fileInput.value = '';
    }
  }
}

function closeDataImportModalFunc() {
  const modal = document.getElementById('dataImportModal');
  if (modal) {
    modal.style.display = 'none';
  }
  // Reset state
  extractedInsights = [];
  selectedInsights.clear();
  showImportSection('source');
}

function showImportSection(section) {
  const sourceSection = document.getElementById('importSourceSection');
  const progressSection = document.getElementById('importProgressSection');
  const previewSection = document.getElementById('importPreviewSection');
  const historySection = document.getElementById('importHistorySection');
  const detailsSection = document.getElementById('importDetailsSection');

  if (sourceSection) sourceSection.style.display = section === 'source' ? 'block' : 'none';
  if (progressSection) progressSection.style.display = section === 'progress' ? 'block' : 'none';
  if (previewSection) previewSection.style.display = section === 'preview' ? 'block' : 'none';
  if (historySection) historySection.style.display = section === 'history' ? 'block' : 'none';
  if (detailsSection) detailsSection.style.display = section === 'details' ? 'block' : 'none';
}

async function handleFileSelection(event) {
  const file = event.target.files[0];
  if (!file) return;

  showImportSection('progress');
  updateProgressText('Reading file...');

  try {
    let conversations = [];

    if (file.name.endsWith('.zip')) {
      // Handle ChatGPT export ZIP file
      conversations = await processChatGPTZip(file);
    } else if (file.name.endsWith('.json')) {
      // Handle direct JSON file
      const text = await file.text();
      const data = JSON.parse(text);
      conversations = data.conversations || data;
    }

    updateProgressText('Analyzing conversations...');
    extractedInsights = await extractInsightsFromConversations(conversations);

    // Initialize all insights as selected
    extractedInsights.forEach(insight => {
      selectedInsights.add(insight.id);
    });

    // Display preview
    displayImportPreview();
    showImportSection('preview');

  } catch (error) {
    console.error('Error processing file:', error);
    showNotification('Failed to process file. Please check the file format.', 'error');
    showImportSection('source');
  }
}

async function processChatGPTZip(file) {
  // Use JSZip library to extract conversations.json from the ZIP
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        // Load JSZip if not already loaded
        if (!window.JSZip) {
          await loadJSZip();
        }

        const zip = await window.JSZip.loadAsync(e.target.result);

        // Find conversations.json file
        let conversationsFile = null;
        for (let filename in zip.files) {
          if (filename.endsWith('conversations.json')) {
            conversationsFile = zip.files[filename];
            break;
          }
        }

        if (!conversationsFile) {
          throw new Error('conversations.json not found in ZIP file');
        }

        const content = await conversationsFile.async('text');
        const data = JSON.parse(content);
        resolve(data);

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function loadJSZip() {
  // Dynamically load JSZip library
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => resolve(window.JSZip);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function extractInsightsFromConversations(conversations) {
  const insights = [];
  const seenTexts = new Set(); // To avoid duplicates

  // Ensure conversations is an array
  const convArray = Array.isArray(conversations) ? conversations : [conversations];

  convArray.forEach(conv => {
    // Extract insights from conversation title
    if (conv.title && conv.title.length > 5 && !seenTexts.has(conv.title)) {
      const category = categorizeText(conv.title);
      if (category !== 'other') { // Only add if it's a meaningful category
        insights.push({
          id: generateId(),
          category: category,
          question: 'Conversation Topic',
          answer: conv.title,
          source: 'ChatGPT',
          selected: true
        });
        seenTexts.add(conv.title);
      }
    }

    // Extract insights from messages
    if (conv.mapping) {
      Object.values(conv.mapping).forEach(node => {
        if (node.message && node.message.author && node.message.author.role === 'user') {
          const content = node.message.content?.parts?.join(' ') || '';

          // Extract meaningful insights from user messages
          const extractedInfo = extractPersonalInfo(content);
          extractedInfo.forEach(info => {
            const key = `${info.question}:${info.answer}`;
            if (!seenTexts.has(key)) {
              insights.push({
                id: generateId(),
                ...info,
                source: 'ChatGPT',
                selected: true
              });
              seenTexts.add(key);
            }
          });
        }
      });
    }
  });

  return insights;
}

function extractPersonalInfo(text) {
  const insights = [];

  // Skip very short texts
  if (!text || text.length < 20) return insights;

  // Pattern matching for personal information
  const patterns = [
    {
      regex: /I (?:work|am employed|freelance) (?:as|at|in|for|with) ([^.!?,]+)/gi,
      category: 'work',
      question: 'Professional Background'
    },
    {
      regex: /I (?:like|love|enjoy|prefer|am passionate about) ([^.!?,]+)/gi,
      category: 'preferences',
      question: 'Personal Preferences'
    },
    {
      regex: /My favorite (\w+) (?:is|are) ([^.!?,]+)/gi,
      category: 'preferences',
      question: 'Favorites',
      captureGroup: 2
    },
    {
      regex: /I (?:am|'m) (?:interested in|passionate about|studying) ([^.!?,]+)/gi,
      category: 'interests',
      question: 'Interests'
    },
    {
      regex: /I (?:live|reside|am based|am located) (?:in|at|near) ([^.!?,]+)/gi,
      category: 'personal',
      question: 'Location'
    },
    {
      regex: /My (?:goal|objective|aim|plan) is (?:to )?([^.!?,]+)/gi,
      category: 'personal',
      question: 'Goals'
    },
    {
      regex: /I (?:use|prefer using|work with) ([^.!?,]+) for (?:coding|programming|development)/gi,
      category: 'work',
      question: 'Tech Stack'
    }
  ];

  patterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.regex);
    while ((match = regex.exec(text)) !== null) {
      const captureGroup = pattern.captureGroup || 1;
      const value = match[captureGroup].trim();

      // Filter out too short or too long values
      if (value.length > 3 && value.length < 200) {
        // Clean up the value
        const cleanedValue = value
          .replace(/\s+/g, ' ')
          .replace(/^(and|or|but|so|then)\s+/i, '');

        if (cleanedValue.length > 3) {
          insights.push({
            category: pattern.category,
            question: pattern.question,
            answer: cleanedValue
          });
        }
      }
    }
  });

  return insights;
}

function categorizeText(text) {
  const categories = {
    work: ['work', 'job', 'career', 'professional', 'business', 'project', 'coding', 'programming', 'developer'],
    interests: ['hobby', 'interest', 'passion', 'enjoy', 'fun', 'game', 'sport', 'music', 'art'],
    preferences: ['prefer', 'like', 'favorite', 'best', 'love', 'choose'],
    knowledge: ['learn', 'study', 'know', 'understand', 'research', 'education'],
    personal: ['family', 'home', 'life', 'personal', 'health', 'travel']
  };

  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }

  return 'other'; // Default category
}

function displayImportPreview() {
  // Update stats
  document.getElementById('conversationCount').textContent =
    new Set(extractedInsights.map(i => i.source)).size;
  document.getElementById('insightCount').textContent = extractedInsights.length;
  document.getElementById('topicCount').textContent =
    new Set(extractedInsights.map(i => i.category)).size;

  // Display insights list
  renderImportPreviewList();
  updateSelectedCount();
}

function renderImportPreviewList() {
  const list = document.getElementById('importPreviewList');
  const filter = document.getElementById('importCategoryFilter').value;

  if (!list) return;

  const filteredInsights = filter
    ? extractedInsights.filter(i => i.category === filter)
    : extractedInsights;

  if (filteredInsights.length === 0) {
    list.innerHTML = '<div class="import-empty-state">No insights found in this category</div>';
    return;
  }

  list.innerHTML = filteredInsights.map(insight => `
    <div class="import-preview-item ${selectedInsights.has(insight.id) ? 'selected' : ''}"
         data-insight-id="${insight.id}">
      <label class="import-item-checkbox">
        <input type="checkbox"
               ${selectedInsights.has(insight.id) ? 'checked' : ''}
               data-insight-id="${insight.id}">
        <div class="import-item-content">
          <div class="import-item-header">
            <span class="import-item-category">${getCategoryEmoji(insight.category)} ${insight.category}</span>
            <span class="import-item-source">${insight.source}</span>
          </div>
          <div class="import-item-question">${escapeHtml(insight.question)}</div>
          <div class="import-item-answer">${escapeHtml(insight.answer)}</div>
        </div>
      </label>
    </div>
  `).join('');

  // Add event listeners to checkboxes
  list.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', handleInsightSelection);
  });
}

function getCategoryEmoji(category) {
  const emojis = {
    work: '💼',
    interests: '🎯',
    preferences: '💜',
    knowledge: '📚',
    personal: '👤',
    other: '📝'
  };
  return emojis[category] || '📝';
}

function handleInsightSelection(event) {
  const insightId = event.target.dataset.insightId;

  if (event.target.checked) {
    selectedInsights.add(insightId);
  } else {
    selectedInsights.delete(insightId);
  }

  updateSelectedCount();

  // Update select all checkbox
  const selectAll = document.getElementById('selectAllImports');
  if (selectAll) {
    selectAll.checked = selectedInsights.size === extractedInsights.length;
  }
}

function handleSelectAll(event) {
  if (event.target.checked) {
    extractedInsights.forEach(insight => {
      selectedInsights.add(insight.id);
    });
  } else {
    selectedInsights.clear();
  }

  renderImportPreviewList();
  updateSelectedCount();
}

function filterImportedInsights() {
  renderImportPreviewList();
}

function updateSelectedCount() {
  const countElement = document.getElementById('selectedCount');
  if (countElement) {
    countElement.textContent = selectedInsights.size;
  }
}

function updateProgressText(text) {
  const element = document.getElementById('importProgressText');
  if (element) {
    element.textContent = text;
  }
}

async function confirmImport() {
  const itemsToImport = extractedInsights.filter(insight =>
    selectedInsights.has(insight.id)
  );

  if (itemsToImport.length === 0) {
    showNotification('Please select at least one item to import', 'warning');
    return;
  }

  showImportSection('progress');
  updateProgressText('Importing data...');

  try {
    // Create import record with metadata
    const importRecord = {
      id: generateId(),
      source: 'ChatGPT',
      importDate: Date.now(),
      itemCount: itemsToImport.length,
      items: itemsToImport.map(item => ({
        id: generateId(),
        category: mapImportCategory(item.category),
        question: item.question,
        answer: item.answer,
        originalCategory: item.category
      }))
    };

    // Load existing imported data
    const result = await chrome.storage.local.get(['importedData']);
    const importedData = result.importedData || [];

    // Add new import record
    importedData.push(importRecord);

    // Save imported data separately from profile items
    await chrome.storage.local.set({ importedData });

    showNotification(`Successfully imported ${itemsToImport.length} items from ChatGPT`, 'success');

    // Show import history instead of closing
    showImportHistory();

  } catch (error) {
    console.error('Error importing data:', error);
    showNotification('Failed to import data', 'error');
    showImportSection('preview');
  }
}

// Add function to display import history
function showImportHistory() {
  showImportSection('history');
  loadImportHistory();
}

async function loadImportHistory() {
  const result = await chrome.storage.local.get(['importedData']);
  const importedData = result.importedData || [];

  const historyList = document.getElementById('importHistoryList');
  if (!historyList) return;

  if (importedData.length === 0) {
    historyList.innerHTML = `
      <div class="import-empty-state">
        <p>No imported data yet. Click "Import New" to add your first ChatGPT export.</p>
      </div>
    `;
    return;
  }

  // Display import history - show most recent first
  const sortedImports = [...importedData].reverse();
  historyList.innerHTML = `
    <div class="import-history-list">
      ${sortedImports.map(record => `
        <div class="import-history-item" data-import-id="${record.id}">
          <div class="import-history-main">
            <div class="import-history-info">
              <span class="import-history-source">${record.source}</span>
              <span class="import-history-date">${new Date(record.importDate).toLocaleDateString()}</span>
            </div>
            <span class="import-history-count">${record.itemCount} items</span>
          </div>
          <div class="import-history-actions">
            <button class="button button-outline view-import-btn" data-import-id="${record.id}">
              View Details
            </button>
            <button class="button button-outline delete-import-btn" data-import-id="${record.id}">
              Delete
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Add event listeners
  historyList.querySelectorAll('.view-import-btn').forEach(btn => {
    btn.addEventListener('click', (e) => viewImportDetails(e.target.dataset.importId));
  });

  historyList.querySelectorAll('.delete-import-btn').forEach(btn => {
    btn.addEventListener('click', (e) => deleteImport(e.target.dataset.importId));
  });
}

async function viewImportDetails(importId) {
  const result = await chrome.storage.local.get(['importedData']);
  const importedData = result.importedData || [];
  const record = importedData.find(r => r.id === importId);

  if (!record) return;

  // Display the details of this import
  const detailsContent = document.getElementById('importDetailsContent');
  if (!detailsContent) return;

  detailsContent.innerHTML = `
    <div class="import-details">
      <div class="import-details-info">
        <h4>Import from ${record.source}</h4>
        <p class="import-details-date">Imported on ${new Date(record.importDate).toLocaleString()}</p>
        <p class="import-details-count">${record.itemCount} insights extracted</p>
      </div>
      <div class="import-details-list">
        ${record.items.map(item => `
          <div class="import-detail-item">
            <div class="import-detail-category">${getCategoryEmoji(item.originalCategory)} ${item.category}</div>
            <div class="import-detail-question">${escapeHtml(item.question)}</div>
            <div class="import-detail-answer">${escapeHtml(item.answer)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  showImportSection('details');
}

async function deleteImport(importId) {
  if (!confirm('Are you sure you want to delete this imported data?')) return;

  const result = await chrome.storage.local.get(['importedData']);
  let importedData = result.importedData || [];

  // Remove the import record
  importedData = importedData.filter(r => r.id !== importId);

  // Save updated data
  await chrome.storage.local.set({ importedData });

  showNotification('Import deleted successfully');
  loadImportHistory();
}

function mapImportCategory(category) {
  // Map import categories to existing app categories
  const categoryMap = {
    work: 'Work & Professional',
    interests: 'Hobbies',
    preferences: 'Lifestyle & Preferences',
    knowledge: 'Work & Professional',
    personal: 'Social & Personal',
    other: 'Other'
  };

  return categoryMap[category] || 'Other';
}

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize data import when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeDataImport();
});

// Fix: Add subprofile selector to the existing setupEventListeners function
// We need to find and modify the original function instead of overriding it