// Minimal test content script
console.log('🔥 MINIMAL TEST SCRIPT LOADED 🔥');
alert('Data Gems Test - Content Script Works!');

// Test if we can access the page
console.log('Page title:', document.title);
console.log('Page URL:', window.location.href);

// Try to inject a visible element
setTimeout(() => {
  const testDiv = document.createElement('div');
  testDiv.innerHTML = '✅ DATA GEMS TEST SUCCESS!';
  testDiv.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 300px !important;
    height: 50px !important;
    background: lime !important;
    color: black !important;
    z-index: 999999 !important;
    font-size: 20px !important;
    text-align: center !important;
    line-height: 50px !important;
  `;
  document.body.appendChild(testDiv);
  
  setTimeout(() => testDiv.remove(), 5000);
}, 1000);