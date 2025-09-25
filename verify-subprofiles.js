// 🧪 Data Gems Subprofile Verification Script
// Run this in the browser console when the extension is loaded

console.log('🧪 Starting Data Gems Subprofile Verification...');

// Helper function to simulate the extension's storage access
async function verifySubprofileSystem() {
    console.log('\n📊 === SUBPROFILE SYSTEM VERIFICATION ===\n');
    
    try {
        // This would normally use chrome.storage.local.get, but we'll simulate
        console.log('🔍 Step 1: Checking Extension Storage');
        console.log('   📋 To manually verify:');
        console.log('   1. Open Chrome DevTools > Application tab');
        console.log('   2. Go to Storage > Local Storage');
        console.log('   3. Find your Data Gems extension entry');
        console.log('   4. Look for keys: "contextItems", "subprofiles_data", "active_subprofile_id"');
        
        console.log('\n🔍 Step 2: ID Format Analysis');
        console.log('   Expected ID formats:');
        console.log('   • Context Item IDs: UUID or timestamp-based (e.g., "1234567890123-abc" or "uuid-v4")');
        console.log('   • Subprofile IDs: Same format as context items');
        
        console.log('\n🔍 Step 3: Filtering Logic Test');
        console.log('   The core logic should work like this:');
        console.log('   ```javascript');
        console.log('   const activeSubprofile = subprofiles.find(s => s.id === activeSubprofileId);');
        console.log('   const selectedIds = activeSubprofile.includedFields.contextItems; // Array of strings');
        console.log('   const filteredItems = contextItems.filter(item => selectedIds.includes(item.id));');
        console.log('   ```');
        
        console.log('\n🎯 Step 4: Common Issues to Check');
        console.log('   ❌ ID type mismatch (string vs number)');
        console.log('   ❌ Empty contextItems array in subprofile');
        console.log('   ❌ Malformed checkbox values during creation');
        console.log('   ❌ Async timing issues');
        
        console.log('\n📋 Step 5: Manual Test Procedure');
        console.log('   1. Open Data Gems extension popup');
        console.log('   2. Add 2-3 context items if none exist');
        console.log('   3. Create a subprofile:');
        console.log('      • Click "+" next to subprofile dropdown');
        console.log('      • Name it "TEST_PROFILE"');
        console.log('      • Check 2 of your context items');
        console.log('      • Click "Create Subprofile"');
        console.log('   4. Watch console for creation logs');
        console.log('   5. Select the new subprofile from dropdown');
        console.log('   6. Watch console for filtering logs');
        console.log('   7. Verify only selected items are visible');
        
        console.log('\n🔍 Step 6: Key Debug Logs to Watch For');
        console.log('   During subprofile creation:');
        console.log('   • "🔧 Creating subprofile with data:" - Should show contextItems array');
        console.log('   • "📊 Selected contextItems:" - Should show array of IDs');
        console.log('   ');
        console.log('   During subprofile switching:');
        console.log('   • "🔍 Filtering for subprofile:" - Shows active subprofile ID');
        console.log('   • "✅ Subprofile has contextItems field:" - Shows stored IDs');
        console.log('   • "🔍 ID Matching Debug:" - Shows detailed ID comparison');
        console.log('   • "🎯 Filtered items:" - Shows final count');
        
        console.log('\n✅ Expected Success Pattern:');
        console.log('   🔧 Creating subprofile with data: {contextItems: ["id1", "id2"]}');
        console.log('   📊 Selected contextItems: ["id1", "id2"]');
        console.log('   🔍 Filtering for subprofile: subprofile-uuid');
        console.log('   ✅ Subprofile has contextItems field: ["id1", "id2"]');
        console.log('   🔍 ID Matching Debug:');
        console.log('      📋 Expected IDs: ["id1", "id2"]');
        console.log('      💾 Available IDs: ["id1", "id2", "id3", "id4"]');
        console.log('   🎯 Filtered items: 2');
        console.log('   🎯 Filtered item IDs: ["id1", "id2"]');
        
        console.log('\n❌ Failure Pattern to Look For:');
        console.log('   ❌ Subprofile missing contextItems field or empty');
        console.log('   🔍 includedFields: {contextItems: []}');
        console.log('   🎯 Filtered items: 0');
        console.log('   OR:');
        console.log('   ❌ Item "some-id" not found in subprofile contextItems');
        
        console.log('\n💡 Diagnosis Guide:');
        console.log('   If contextItems array is empty in subprofile:');
        console.log('   → Form checkbox collection failed during creation');
        console.log('   → Check popup.js line ~1235: FormData processing');
        console.log('   ');
        console.log('   If IDs don\'t match between arrays:');
        console.log('   → ID generation inconsistency');
        console.log('   → Check popup.js generateId() function');
        console.log('   ');
        console.log('   If type mismatch errors:');
        console.log('   → One array has strings, other has numbers');
        console.log('   → Check storage serialization/deserialization');
        
        return true;
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
        return false;
    }
}

// Helper function to test ID generation consistency
function testIdGeneration() {
    console.log('\n🔢 === ID GENERATION TEST ===\n');
    
    // Simulate the generateId function from popup.js
    function generateId() {
        return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    console.log('🔧 Testing generateId() function:');
    const testIds = [];
    for (let i = 0; i < 5; i++) {
        const id = generateId();
        testIds.push(id);
        console.log(`   ID ${i + 1}:`, id, `(type: ${typeof id})`);
    }
    
    console.log('\n✅ ID Generation Analysis:');
    console.log('   • All IDs are strings:', testIds.every(id => typeof id === 'string'));
    console.log('   • All IDs are unique:', new Set(testIds).size === testIds.length);
    console.log('   • ID format consistent:', testIds[0].includes('-') ? 'UUID format' : 'Timestamp format');
    
    return testIds;
}

// Helper function to simulate the filtering logic
function simulateFiltering(contextItems, subprofile) {
    console.log('\n🔄 === FILTERING SIMULATION ===\n');
    
    if (!subprofile || !subprofile.includedFields || !subprofile.includedFields.contextItems) {
        console.log('❌ Subprofile missing contextItems field');
        return [];
    }
    
    console.log('📋 Input Data:');
    console.log('   Context Items:', contextItems.map(item => `${item.id} ("${item.question}")`));
    console.log('   Subprofile Filter:', subprofile.includedFields.contextItems);
    
    const filtered = contextItems.filter(item => 
        subprofile.includedFields.contextItems.includes(item.id)
    );
    
    console.log('\n📊 Filtering Results:');
    console.log('   Matched Items:', filtered.length);
    console.log('   Matched IDs:', filtered.map(item => item.id));
    
    // Check for mismatches
    const missingIds = subprofile.includedFields.contextItems.filter(id => 
        !contextItems.some(item => item.id === id)
    );
    
    if (missingIds.length > 0) {
        console.log('❌ IDs in subprofile but not in contextItems:', missingIds);
    }
    
    return filtered;
}

// Run the verification
console.log('🚀 Running verification...\n');
verifySubprofileSystem();

console.log('\n🎯 Next Steps:');
console.log('1. Follow the manual test procedure above');
console.log('2. Check the browser console for the specific debug logs');
console.log('3. If you see issues, run testIdGeneration() to check ID consistency');
console.log('4. Report any error messages or unexpected behavior');

console.log('\n💻 Additional Debug Commands:');
console.log('• testIdGeneration() - Test ID generation consistency');
console.log('• simulateFiltering(contextItems, subprofile) - Test filtering logic with sample data');

// Make functions globally available
window.testIdGeneration = testIdGeneration;
window.simulateFiltering = simulateFiltering;
window.verifySubprofileSystem = verifySubprofileSystem;

console.log('\n✅ Verification script loaded! Follow the steps above to test your subprofiles.');