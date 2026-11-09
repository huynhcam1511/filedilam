const fs = require('fs');

const originalHtml = fs.readFileSync('STANDARDS_TEMPLATE/CONGNO_Index.html', 'utf8');
const scriptContent = fs.readFileSync('.agents/teamwork/worker_m2/full_monolithic_script.js', 'utf8');

// Find where the main script tag begins (after statement-modal, near line 1196)
const scriptTagMarker = '<script>';
const scriptTagIndex = originalHtml.indexOf(scriptTagMarker, originalHtml.indexOf('id="statement-modal"'));
if (scriptTagIndex === -1) {
  console.error('Could not find main script tag after statement modal!');
  process.exit(1);
}

const endScriptTagIndex = originalHtml.lastIndexOf('</script>');
const htmlBeforeScript = originalHtml.slice(0, scriptTagIndex);
const htmlAfterScript = originalHtml.slice(endScriptTagIndex + '</script>'.length);

console.log('HTML before script length:', htmlBeforeScript.length);
console.log('HTML after script length:', htmlAfterScript.length);

let updatedHtml = htmlBeforeScript;

// 1. Update Title if needed
updatedHtml = updatedHtml.replace(/<title>[\s\S]*?<\/title>/i, '<title>QUẢN LÝ CÔNG NỢ KHÁCH HÀNG & NCC — WEB APP v1.0 — FILE ĐI LÀM</title>');

// 2. Standardize Sidebar Nav Buttons
updatedHtml = updatedHtml.replace(/onclick="switchTab\('dashboard'\)"\s+id="nav-btn-dashboard"/g, `onclick="switchTab('tab-dashboard')" id="nav-tab-dashboard"`);
updatedHtml = updatedHtml.replace(/onclick="switchTab\('transactions'\)"\s+id="nav-btn-transactions"/g, `onclick="switchTab('tab-transactions')" id="nav-tab-transactions"`);
updatedHtml = updatedHtml.replace(/onclick="switchTab\('invoices'\)"\s+id="nav-btn-invoices"/g, `onclick="switchTab('tab-invoices')" id="nav-tab-invoices"`);
updatedHtml = updatedHtml.replace(/onclick="switchTab\('partners'\)"\s+id="nav-btn-partners"/g, `onclick="switchTab('tab-partners')" id="nav-tab-partners"`);
updatedHtml = updatedHtml.replace(/onclick="switchTab\('categories'\)"\s+id="nav-btn-categories"/g, `onclick="switchTab('tab-categories')" id="nav-tab-categories"`);
updatedHtml = updatedHtml.replace(/onclick="switchTab\('settings'\)"\s+id="nav-btn-settings"/g, `onclick="switchTab('tab-settings')" id="nav-tab-settings"`);
updatedHtml = updatedHtml.replace(/onclick="switchTab\('help'\)"\s+id="nav-btn-help"/g, `onclick="switchTab('tab-help')" id="nav-tab-help"`);

// 3. Standardize Mobile Dock Buttons
updatedHtml = updatedHtml.replace(/onclick="switchTab\('dashboard'\)"\s+id="dock-btn-dashboard"/g, `onclick="switchTab('tab-dashboard')" id="mobile-tab-dashboard"`);
updatedHtml = updatedHtml.replace(/onclick="switchTab\('transactions'\)"\s+id="dock-btn-transactions"/g, `onclick="switchTab('tab-transactions')" id="mobile-tab-transactions"`);
updatedHtml = updatedHtml.replace(/onclick="switchTab\('invoices'\)"\s+id="dock-btn-invoices"/g, `onclick="switchTab('tab-invoices')" id="mobile-tab-invoices"`);
updatedHtml = updatedHtml.replace(/onclick="switchTab\('partners'\)"\s+id="dock-btn-partners"/g, `onclick="switchTab('tab-partners')" id="mobile-tab-partners"`);

// 4. Standardize Container Tab Pane IDs
updatedHtml = updatedHtml.replace(/id="mod-dashboard"/g, 'id="tab-dashboard"');
updatedHtml = updatedHtml.replace(/id="mod-transactions"/g, 'id="tab-transactions"');
updatedHtml = updatedHtml.replace(/id="mod-invoices"/g, 'id="tab-invoices"');
updatedHtml = updatedHtml.replace(/id="mod-partners"/g, 'id="tab-partners"');
updatedHtml = updatedHtml.replace(/id="mod-categories"/g, 'id="tab-categories"');
updatedHtml = updatedHtml.replace(/id="mod-settings"/g, 'id="tab-settings"');
updatedHtml = updatedHtml.replace(/id="mod-help"/g, 'id="tab-help"');

// 5. Ensure Action Drawer has hidden class and proper styling
updatedHtml = updatedHtml.replace(/<aside id="action-drawer" class="([^"]*)"/i, (m, classes) => {
  let c = classes;
  if (!c.includes('hidden')) c += ' hidden';
  return `<aside id="action-drawer" class="${c.trim()}"`;
});

// 6. Update action buttons to direct flat functions in the HTML
updatedHtml = updatedHtml.replace(/ModuleTransactions\.setFilter\(/g, 'filterTransactions(');
updatedHtml = updatedHtml.replace(/ModuleTransactions\.onSearch\(/g, 'searchTransactions(');
updatedHtml = updatedHtml.replace(/ModuleTransactions\.openDrawer\(/g, 'openTransactionDrawer(');

updatedHtml = updatedHtml.replace(/ModuleInvoices\.filter\(/g, 'filterInvoices(');
updatedHtml = updatedHtml.replace(/ModuleInvoices\.search\(/g, 'searchInvoices(');
updatedHtml = updatedHtml.replace(/ModuleInvoices\.openCreateDrawer\(/g, 'openInvoiceDrawer(');
updatedHtml = updatedHtml.replace(/ModuleInvoices\.closeStatementModal\(/g, 'closeStatementModal(');

updatedHtml = updatedHtml.replace(/ModulePartners\.filter\(/g, 'filterPartners(');
updatedHtml = updatedHtml.replace(/ModulePartners\.search\(/g, 'searchPartners(');
updatedHtml = updatedHtml.replace(/ModulePartners\.openCreateDrawer\(/g, 'openPartnerDrawer(');

updatedHtml = updatedHtml.replace(/ModuleCategories\.filterType\(/g, 'filterCategories(');
updatedHtml = updatedHtml.replace(/ModuleCategories\.search\(/g, 'searchCategories(');
updatedHtml = updatedHtml.replace(/ModuleCategories\.openDrawer\(/g, 'openCategoryDrawer(');

updatedHtml = updatedHtml.replace(/ModuleSettings\.save\(/g, 'handleSettingsSubmit(');
updatedHtml = updatedHtml.replace(/ModuleSettings\.updateQRPreview\(/g, 'updateQRPreview(');
updatedHtml = updatedHtml.replace(/ModuleSettings\.resetZaloTemplate\(/g, 'resetZaloTemplate(');
updatedHtml = updatedHtml.replace(/ModuleSettings\.insertTag\(/g, 'insertZaloTag(');

// Combine
const finalHtml = updatedHtml + '<script>\n' + scriptContent + '\n</script>' + htmlAfterScript;

fs.writeFileSync('STANDARDS_TEMPLATE/CONGNO_Index.html', finalHtml, 'utf8');
console.log('STANDARDS_TEMPLATE/CONGNO_Index.html updated successfully! Total lines:', finalHtml.split('\n').length);
