// Debug script for Data Gems subprofiles
// Run this in the extension popup's console (F12 -> paste and run)

console.log("🧪 Starting Data Gems Subprofile Debug");

// Function to debug current state
async function debugSubprofileState() {
    console.log("\n=== DEBUGGING SUBPROFILE STATE ===\n");
    
    try {
        // 1. Check contextItems in storage
        const contextItemsResult = await new Promise(resolve => {
            chrome.storage.local.get(['contextItems'], resolve);
        });
        
        console.log("📋 Context Items from Storage:");
        console.log("   Count:", contextItemsResult.contextItems?.length || 0);
        if (contextItemsResult.contextItems) {
            console.log("   IDs:", contextItemsResult.contextItems.map(item => item.id));
            console.log("   Sample items:", contextItemsResult.contextItems.slice(0, 2));
        }
        
        // 2. Check subprofiles in storage
        const subprofilesResult = await new Promise(resolve => {
            chrome.storage.local.get(['subprofiles_data'], resolve);
        });
        
        console.log("\n🏷️ Subprofiles from Storage:");
        console.log("   Count:", subprofilesResult.subprofiles_data?.length || 0);
        if (subprofilesResult.subprofiles_data) {
            subprofilesResult.subprofiles_data.forEach((subprofile, index) => {
                console.log(`   ${index + 1}. "${subprofile.name}" (${subprofile.id})`);
                console.log("      contextItems:", subprofile.includedFields?.contextItems || []);
            });
        }
        
        // 3. Check active subprofile
        const activeResult = await new Promise(resolve => {
            chrome.storage.local.get(['active_subprofile_id'], resolve);
        });
        
        console.log("\n🎯 Active Subprofile:");
        console.log("   ID:", activeResult.active_subprofile_id || "null (Full Profile)");
        
        // 4. Test filtering logic
        if (contextItemsResult.contextItems && subprofilesResult.subprofiles_data && activeResult.active_subprofile_id) {
            const activeSubprofile = subprofilesResult.subprofiles_data.find(s => s.id === activeResult.active_subprofile_id);
            
            console.log("\n🔍 Filtering Test:");
            console.log("   Active subprofile found:", !!activeSubprofile);
            
            if (activeSubprofile) {
                console.log("   Expected contextItems:", activeSubprofile.includedFields?.contextItems || []);
                
                const filteredItems = contextItemsResult.contextItems.filter(item => 
                    activeSubprofile.includedFields?.contextItems?.includes(item.id)
                );
                
                console.log("   Filtered result count:", filteredItems.length);
                console.log("   Filtered item IDs:", filteredItems.map(item => item.id));
                
                // Check for mismatches
                const expectedIds = activeSubprofile.includedFields?.contextItems || [];
                const availableIds = contextItemsResult.contextItems.map(item => item.id);
                const missingIds = expectedIds.filter(id => !availableIds.includes(id));
                
                if (missingIds.length > 0) {
                    console.log("   ❌ Missing IDs (in subprofile but not in contextItems):", missingIds);
                } else {
                    console.log("   ✅ All expected IDs found in contextItems");
                }
            }
        }
        
        return true;
        
    } catch (error) {
        console.error("❌ Debug failed:", error);
        return false;
    }
}

// Function to manually create a test subprofile
async function createTestSubprofile() {
    console.log("\n=== CREATING TEST SUBPROFILE ===\n");
    
    try {
        // Get current contextItems
        const result = await new Promise(resolve => {
            chrome.storage.local.get(['contextItems'], resolve);
        });
        
        const contextItems = result.contextItems || [];
        if (contextItems.length === 0) {
            console.log("❌ No context items found. Add some items first.");
            return false;
        }
        
        // Select first item for test subprofile
        const selectedItemId = contextItems[0].id;
        console.log("📋 Using first context item:", selectedItemId);
        
        const testSubprofile = {
            id: 'debug-test-' + Date.now(),
            name: 'Debug Test Profile',
            description: 'Test subprofile created by debug script',
            icon: '🧪',
            color: '#ff6b35',
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            isActive: true,
            includedFields: {
                identity: {},
                style: { topics: [] },
                answers: [],
                affinities: [],
                constraints: {},
                snippets: [],
                contextItems: [selectedItemId]
            }
        };
        
        console.log("💾 Test subprofile created:", testSubprofile);
        
        // Save via background script
        const saveResult = await new Promise(resolve => {
            chrome.runtime.sendMessage({ type: 'SAVE_SUBPROFILE', subprofile: testSubprofile }, resolve);
        });
        
        if (saveResult?.ok) {
            console.log("✅ Test subprofile saved successfully!");
            
            // Set as active
            const setActiveResult = await new Promise(resolve => {
                chrome.runtime.sendMessage({ 
                    type: 'SET_ACTIVE_SUBPROFILE', 
                    subprofileId: testSubprofile.id 
                }, resolve);
            });
            
            if (setActiveResult?.ok) {
                console.log("✅ Test subprofile set as active!");
                console.log("🎯 Now switch to the new 'Debug Test Profile' in the dropdown and see if it shows 1 item");
                return true;
            } else {
                console.log("❌ Failed to set as active:", setActiveResult?.error);
            }
        } else {
            console.log("❌ Failed to save test subprofile:", saveResult?.error);
        }
        
        return false;
        
    } catch (error) {
        console.error("❌ Test subprofile creation failed:", error);
        return false;
    }
}

// Function to clean up test subprofiles
async function cleanupTestSubprofiles() {
    console.log("\n=== CLEANING UP TEST SUBPROFILES ===\n");
    
    try {
        const result = await new Promise(resolve => {
            chrome.storage.local.get(['subprofiles_data'], resolve);
        });
        
        const subprofiles = result.subprofiles_data || [];
        const testSubprofiles = subprofiles.filter(s => s.name.includes('Debug Test'));
        
        console.log("🧹 Found", testSubprofiles.length, "test subprofiles to clean up");
        
        for (const testSubprofile of testSubprofiles) {
            const deleteResult = await new Promise(resolve => {
                chrome.runtime.sendMessage({ type: 'DELETE_SUBPROFILE', subprofileId: testSubprofile.id }, resolve);
            });
            
            if (deleteResult?.ok) {
                console.log("✅ Deleted test subprofile:", testSubprofile.name);
            } else {
                console.log("❌ Failed to delete:", testSubprofile.name);
            }
        }
        
        return true;
        
    } catch (error) {
        console.error("❌ Cleanup failed:", error);
        return false;
    }
}

// Make functions globally available for manual testing
window.debugSubprofileState = debugSubprofileState;
window.createTestSubprofile = createTestSubprofile;
window.cleanupTestSubprofiles = cleanupTestSubprofiles;

console.log("\n🎯 Available commands:");
console.log("• debugSubprofileState() - Check current state");
console.log("• createTestSubprofile() - Create a working test subprofile");
console.log("• cleanupTestSubprofiles() - Remove test subprofiles");
console.log("\n🚀 Start with: debugSubprofileState()");

// Auto-run initial debug
debugSubprofileState();