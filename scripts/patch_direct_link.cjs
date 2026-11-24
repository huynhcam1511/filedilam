const fs = require('fs');

let s = fs.readFileSync('storefront.js', 'utf8');

// 1. Lưu hash ban đầu khi script vừa load
const bannerTag = '// ==========================================\n  // HỆ THỐNG LINK DIRECT SẢN PHẨM (R1, R2, R3)\n  // ==========================================';
const initialHashCapture = bannerTag + '\n  var initialPageHash = window.location.hash || "";\n  var initialProductDirectParam = parseProductDirectHash(initialPageHash);';

if (!s.includes('initialProductDirectParam')) {
  s = s.replace(bannerTag, initialHashCapture);
}

// 2. Nâng cấp clearProductHashFromUrl và checkAndHandleDirectProductHash
const oldClearAndCheck = `  function clearProductHashFromUrl() {
    var hash = window.location.hash || '';
    if (parseProductDirectHash(hash)) {
      var cleanUrl = window.location.pathname + window.location.search;
      if (window.history && typeof window.history.replaceState === 'function') {
        window.history.replaceState(null, document.title, cleanUrl);
      } else {
        window.location.hash = '';
      }
    }
  }

  var hasAutoOpenedDirectProduct = false;
  var isHandlingDirectHash = false;

  function checkAndHandleDirectProductHash() {
    if (isHandlingDirectHash) return;
    var param = parseProductDirectHash(window.location.hash);
    if (!param || !data || !data.products || !data.products.length) return;

    var product = findProductByIdOrSlug(data.products, param);
    if (product) {
      hasAutoOpenedDirectProduct = true;
      if (!detailModal || !detailModal.classList.contains("is-open") || state.selectedProductId !== product.id) {
        isHandlingDirectHash = true;
        try {
          openDetail(product.id);
        } finally {
          isHandlingDirectHash = false;
        }
      }
    }
  }`;

const newClearAndCheck = `  function clearProductHashFromUrl() {
    initialProductDirectParam = null;
    var hash = window.location.hash || '';
    if (parseProductDirectHash(hash)) {
      var cleanUrl = window.location.pathname + window.location.search;
      if (window.history && typeof window.history.replaceState === 'function') {
        window.history.replaceState(null, document.title, cleanUrl);
      } else {
        window.location.hash = '';
      }
    }
  }

  var hasAutoOpenedDirectProduct = false;
  var isHandlingDirectHash = false;

  function checkAndHandleDirectProductHash() {
    if (isHandlingDirectHash) return;
    var currentParam = parseProductDirectHash(window.location.hash);
    var param = currentParam || initialProductDirectParam;
    if (!param || !data || !data.products || !data.products.length) return;

    var product = findProductByIdOrSlug(data.products, param);
    if (product) {
      hasAutoOpenedDirectProduct = true;
      initialProductDirectParam = null;
      if (!detailModal || !detailModal.classList.contains("is-open") || state.selectedProductId !== product.id) {
        isHandlingDirectHash = true;
        try {
          openDetail(product.id);
        } finally {
          isHandlingDirectHash = false;
        }
      }
    }
  }`;

s = s.replace(oldClearAndCheck, newClearAndCheck);

// 3. Sửa đoạn History State trong openDetail
const oldHistorySnippet = `      if (currentHashParam !== directParam) {
        // Nếu là lần đầu mở trang qua link direct (chưa có state), chuẩn bị entry gốc sạch sẽ để khi bấm Back sẽ quay về trang chủ
        if (!window.history.state || window.history.state.modal !== 'product-detail') {
          if (currentHashParam && window.history && typeof window.history.replaceState === 'function') {
            window.history.replaceState({ modal: null }, document.title, baseCleanUrl);
          }
        }
        if (window.history && typeof window.history.pushState === 'function') {
          window.history.pushState({ modal: 'product-detail', productId: product.id }, document.title, baseCleanUrl + directHash);
        } else {
          window.location.hash = directHash;
        }
      } else {
        // Nếu đã ở đúng direct hash, chuẩn bị history state để Back button gỡ hash sạch sẽ
        if (!window.history.state || window.history.state.modal !== 'product-detail') {
          var curFullUrl = baseCleanUrl + window.location.hash;
          if (window.history && typeof window.history.replaceState === 'function' && typeof window.history.pushState === 'function') {
            window.history.replaceState({ modal: null }, document.title, baseCleanUrl);
            window.history.pushState({ modal: 'product-detail', productId: product.id }, document.title, curFullUrl);
          }
        }
      }`;

const newHistorySnippet = `      if (currentHashParam !== directParam) {
        if (window.history && typeof window.history.pushState === 'function') {
          window.history.pushState({ modal: 'product-detail', productId: product.id }, document.title, baseCleanUrl + directHash);
        } else {
          window.location.hash = directHash;
        }
      } else {
        if (!window.history.state || window.history.state.modal !== 'product-detail') {
          var curFullUrl = baseCleanUrl + window.location.hash;
          if (window.history && typeof window.history.replaceState === 'function') {
            window.history.replaceState({ modal: 'product-detail', productId: product.id }, document.title, curFullUrl);
          }
        }
      }`;

s = s.replace(oldHistorySnippet, newHistorySnippet);

// 4. Sửa exit-intent trap ở cuối file storefront.js để không pushState trap khi đang xem direct link hoặc modal
const oldTrapSnippet = `    // 4. Mobile Back Button (Popstate interception)
    try {
      setTimeout(function() {
        if (!sessionStorage.getItem("filedilam_exit_intent_shown") && window.history && window.history.pushState) {
          window.history.pushState({ filedilam_trap: true }, "");
          window.addEventListener("popstate", function(event) {
            var modal = document.getElementById("exitIntentModal");
            var isModalOpen = modal && modal.classList.contains("is-open");
            if (!isExitIntentSuppressed() && !sessionStorage.getItem("filedilam_exit_intent_shown") && !isModalOpen) {
              showExitIntentModal();
            }
          });
        }
      }, 1500);
    } catch(err) {}`;

const newTrapSnippet = `    // 4. Mobile Back Button (Popstate interception)
    try {
      setTimeout(function() {
        var hasDirectHash = !!parseProductDirectHash(window.location.hash);
        var isModalDetailOpen = detailModal && detailModal.classList.contains("is-open");
        if (!hasDirectHash && !isModalDetailOpen && !sessionStorage.getItem("filedilam_exit_intent_shown") && window.history && window.history.pushState) {
          window.history.pushState({ filedilam_trap: true }, "");
          window.addEventListener("popstate", function(event) {
            var modal = document.getElementById("exitIntentModal");
            var isModalOpen = modal && modal.classList.contains("is-open");
            if (!isExitIntentSuppressed() && !sessionStorage.getItem("filedilam_exit_intent_shown") && !isModalOpen) {
              showExitIntentModal();
            }
          });
        }
      }, 1500);
    } catch(err) {}`;

s = s.replace(oldTrapSnippet, newTrapSnippet);

fs.writeFileSync('storefront.js', s, 'utf8');
console.log('Successfully updated storefront.js');
