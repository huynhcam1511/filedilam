function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}


  function formatProductRichContent(content, fallbackHighlights) {
  if (!content && (!fallbackHighlights || !fallbackHighlights.length)) return '';
  var text = content || (fallbackHighlights || []).map(function(h) { return '- ' + h; }).join('\n');
  
  var lines = text.split('\n');
  var html = '';
  var inList = false;
  
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) {
      if (inList) { html += '</ul>'; inList = false; }
      continue;
    }
    
    // Heading 1 (# Title)
    if (line.indexOf('# ') === 0) {
      if (inList) { html += '</ul>'; inList = false; }
      var h1Text = line.replace(/^#\s*/, '');
      html += '<h2 class="product-rich-h1">' + escapeHtml(h1Text) + '</h2>';
    }
    // Heading 2 (## Subheading)
    else if (line.indexOf('## ') === 0) {
      if (inList) { html += '</ul>'; inList = false; }
      var h2Text = line.replace(/^##\s*/, '');
      html += '<h3 class="product-rich-h2">' + escapeHtml(h2Text) + '</h3>';
    }
    // Heading 3 (### Module heading)
    else if (line.indexOf('###') === 0) {
      if (inList) { html += '</ul>'; inList = false; }
      var title = line.replace(/^###\s*/, '');
      html += '<div class="product-module-header">' +
                '<h4 class="product-module-title">' + escapeHtml(title) + '</h4>' +
              '</div>';
    }
    // Bullet item (- or *)
    else if (line.indexOf('- ') === 0 || line.indexOf('* ') === 0) {
      if (!inList) { html += '<ul class="product-module-list">'; inList = true; }
      var bulletText = line.replace(/^[-*]\s*/, '');
      bulletText = escapeHtml(bulletText)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      html += '<li class="product-module-item"><span class="module-check"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span><span>' + bulletText + '</span></li>';
    }
    // Numbered step (1. Step)
    else if (/^\d+\.\s/.test(line)) {
      if (inList) { html += '</ul>'; inList = false; }
      var numText = escapeHtml(line)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      html += '<p class="product-module-step">' + numText + '</p>';
    }
    // Regular paragraph
    else {
      if (inList) { html += '</ul>'; inList = false; }
      var normalText = escapeHtml(line)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      html += '<p class="product-module-p">' + normalText + '</p>';
    }
  }
  if (inList) { html += '</ul>'; }
  return '<div class="product-features-rich-wrapper">' + html + '</div>';
}

(function () {
  var data = window.StorefrontData;
  if (!data) {
    return;
  }

  var state = {
    activeCategoryId: "all",
    activePriceId: "all",
    searchTerm: "",
    cart: loadCart(),
    selectedProductId: null,
    checkoutTransferCode: "",
    user: null,
    profile: null,
    pendingCheckout: false,
    selectedPackage: "standard",
    appliedCoupon: null,
    appliedCoupons: [],
    discountAmount: 0,
  };

  var folderGrid = document.getElementById("folderGrid");
  var priceGrid = document.getElementById("priceGrid");
  var categorySelect = document.getElementById("categorySelect");
  var priceSelect = document.getElementById("priceSelect");
  var productGrid = document.getElementById("productGrid");
  var coverWindowContent = document.getElementById("coverWindowContent");
  var catalogTitle = document.getElementById("catalogTitle");
  var catalogDescription = document.getElementById("catalogDescription");
  var searchInput = document.getElementById("searchInput");
  var cartDrawer = document.getElementById("cartDrawer");
  var cartItems = document.getElementById("cartItems");
  var cartTotal = document.getElementById("cartTotal");
  var cartCount = document.getElementById("cartCount");
  var cartFab = document.getElementById("cartFab");
  var openCartButton = document.getElementById("openCartNav");
  var openMobileMenuBtn = document.getElementById("openMobileMenu");
  var closeMobileMenuBtn = document.getElementById("closeMobileMenu");
  var mobileNavDrawer = document.getElementById("mobileNavDrawer");
  var checkoutModal = document.getElementById("checkoutModal");
  var checkoutFooterMount = document.getElementById("checkoutFooterMount");
  var detailModal = document.getElementById("detailModal");
  var detailTitle = document.getElementById("detailTitle");
  var detailBody = document.getElementById("detailBody");
  var detailFooter = document.getElementById("detailFooter");
  var checkoutItems = document.getElementById("checkoutItems");
  var checkoutTotal = document.getElementById("checkoutTotal");
  var bankName = document.getElementById("bankName");
  var bankOwner = document.getElementById("bankOwner");
  var bankNumber = document.getElementById("bankNumber");
  var bankTransferNote = document.getElementById("bankTransferNote");
  var qrBox = document.getElementById("qrBox");
  var saveQrBtn = document.getElementById("saveQrBtn");
  var openBankBtn = document.getElementById("openBankBtn");
  var copyBankNumberBtn = document.getElementById("copyBankNumberBtn");
  var copyTransferNoteBtn = document.getElementById("copyTransferNoteBtn");
  var bankPickerModal = document.getElementById("bankPickerModal");
  var closeBankPicker = document.getElementById("closeBankPicker");
  var bankGrid = document.getElementById("bankGrid");
  var bankSearchInput = document.getElementById("bankSearchInput");
  var currentQrImageUrl = "";
  var toast = document.getElementById("toast");
  var registerButton = document.getElementById("registerButton");
  var loginButton = document.getElementById("loginButton");
  var userProfile = document.getElementById("userProfile");
  var userMenuBtn = document.getElementById("userMenuBtn");
  var userDropdownPanel = document.getElementById("userDropdownPanel");
  var userDropdownEmail = document.getElementById("userDropdownEmail");
  var userNameDisplay = document.getElementById("userNameDisplay");
  var logoutButton = document.getElementById("logoutButton");
  var purchasesDrawer = document.getElementById("purchasesDrawer");
  var myPurchasesBtn = document.getElementById("myPurchasesBtn");
  var closePurchases = document.getElementById("closePurchases");
  var purchasesItems = document.getElementById("purchasesItems");

  // Review Modal elements
  var reviewModal = document.getElementById("reviewModal");
  var closeReviewModal = document.getElementById("closeReviewModal");
  var cancelReviewBtn = document.getElementById("cancelReviewBtn");
  var reviewForm = document.getElementById("reviewForm");
  var reviewOrderId = document.getElementById("reviewOrderId");
  var reviewProductId = document.getElementById("reviewProductId");
  var reviewStars = document.getElementById("reviewStars");
  var reviewProductName = document.getElementById("reviewProductName");
  var starRatingPicker = document.getElementById("starRatingPicker");
  var starRatingLabel = document.getElementById("starRatingLabel");
  var reviewComment = document.getElementById("reviewComment");
  var submitReviewBtn = document.getElementById("submitReviewBtn");

  var authModal = document.getElementById("authModal");
  var closeAuth = document.getElementById("closeAuth");
  var btnGoogleLogin = document.getElementById("btnGoogleLogin");
  var authForm = document.getElementById("authForm");
  var authToggleLink = document.getElementById("authToggleLink");
  var authPhoneGroup = document.getElementById("authPhoneGroup");
  var authPhone = document.getElementById("authPhone");
  var isRegisterMode = false;

  // Unified checkout page elements
  var checkoutModalTitle = document.getElementById("checkoutModalTitle");
  var checkoutBackBtn = document.getElementById("checkoutBackBtn");
  var currentActiveOrderId = null;
  var checkoutSummaryBar = document.getElementById("checkoutSummaryBar");
  var checkoutSummaryName = document.getElementById("checkoutSummaryName");
  var checkoutSummaryBadge = document.getElementById("checkoutSummaryBadge");
  var checkoutSummaryPrice = document.getElementById("checkoutSummaryPrice");
  var checkoutSummaryOriginal = document.getElementById("checkoutSummaryOriginal");
  var checkoutAuthStep = document.getElementById("checkoutAuthStep");
  var btnGoogleCheckout = document.getElementById("btnGoogleCheckout");
  var checkoutDividerText = document.getElementById("checkoutDividerText");
  var quickBuyForm = document.getElementById("quickBuyForm");
  var quickPhoneLabel = document.getElementById("quickPhoneLabel");
  var quickName = document.getElementById("quickName");
  var quickNameGroup = document.getElementById("quickNameGroup");
  var quickPhone = document.getElementById("quickPhone");
  var quickPassGroup = document.getElementById("quickPassGroup");
  var quickPassword = document.getElementById("quickPassword");
  var quickEmailGroup = document.getElementById("quickEmailGroup");
  var quickEmail = document.getElementById("quickEmail");
  var checkoutCustomerName = document.getElementById("checkoutCustomerName");
  var checkoutCustomerPhone = document.getElementById("checkoutCustomerPhone");
  var checkoutCustomerEmail = document.getElementById("checkoutCustomerEmail");
  var btnEditCheckoutCustomer = document.getElementById("btnEditCheckoutCustomer");
  var btnQuickSubmit = document.getElementById("btnQuickSubmit");
  var btnQuickSubmitText = document.getElementById("btnQuickSubmitText");
  var quickToggleText = document.getElementById("quickToggleText");
  var quickToggleLink = document.getElementById("quickToggleLink");
  var checkoutPaymentStep = document.getElementById("checkoutPaymentStep");
  var backToInfoBtn = document.getElementById("backToInfoBtn");
  var isQuickLoginMode = false;

  // Package Upsell Elements (99k vs 199k)
  var pkgOptionStandard = document.getElementById("pkgOptionStandard");
  var pkgOptionCoaching = document.getElementById("pkgOptionCoaching");
  var radioPkgStandard = document.getElementById("radioPkgStandard");
  var radioPkgCoaching = document.getElementById("radioPkgCoaching");
  var btnSwitchPkgStandard = document.getElementById("btnSwitchPkgStandard");
  var btnSwitchPkgCoaching = document.getElementById("btnSwitchPkgCoaching");
  var pkgPriceStandard = document.getElementById("pkgPriceStandard");
  var pkgPriceCoaching = document.getElementById("pkgPriceCoaching");
  var pillPriceStandard = document.getElementById("pillPriceStandard");
  var pillPriceCoaching = document.getElementById("pillPriceCoaching");

  function getCartBaseTotal() {
    if (!state.cart || !state.cart.length) return 0;
    return state.cart.reduce(function (sum, entry) {
      var product = getProductById(entry.productId);
      return sum + (product ? product.price * entry.quantity : 0);
    }, 0);
  }

  function setCheckoutPackage(pkgType, updateOrder) {
    var firstItem = state.cart.find(function(entry) {
      return !!getProductById(entry.productId);
    }) || state.cart[0];
    var product = getProductById(firstItem ? firstItem.productId : null);
    var hasCoaching = product && product.hasCoaching && product.coachingPrice && product.coachingPrice > product.price;

    if (!hasCoaching) {
      state.selectedPackage = "standard";
    } else {
      state.selectedPackage = pkgType === "coaching" ? "coaching" : "standard";
    }

    // 1. Update Step 1 Radio & Card visual state
    var rStd = document.getElementById("radioPkgStandard");
    var rCoach = document.getElementById("radioPkgCoaching");
    var cStd = document.getElementById("pkgOptionStandard");
    var cCoach = document.getElementById("pkgOptionCoaching");
    var pkgTitleCoachEl = document.getElementById("pkgTitleCoaching");
    var pillTitleCoachEl = document.getElementById("pillTitleCoaching");

    var baseTotal = getCartBaseTotal();
    var pkgPriceStdEl = document.getElementById("pkgPriceStandard");
    var pkgPriceCoachEl = document.getElementById("pkgPriceCoaching");
    var pillPriceStdEl = document.getElementById("pillPriceStandard");
    var pillPriceCoachEl = document.getElementById("pillPriceCoaching");
    if (pkgPriceStdEl) pkgPriceStdEl.textContent = formatCurrency(baseTotal);
    if (pillPriceStdEl) pillPriceStdEl.textContent = Math.round(baseTotal / 1000) + "k";

    if (hasCoaching) {
      var coachingTotal = baseTotal + (product.coachingPrice - product.price);
      if (pkgPriceCoachEl) pkgPriceCoachEl.textContent = formatCurrency(coachingTotal);
      if (pillPriceCoachEl) pillPriceCoachEl.textContent = Math.round(coachingTotal / 1000) + "k";
    }

    if (product && product.coachingTitle) {
      if (pkgTitleCoachEl) pkgTitleCoachEl.textContent = product.coachingTitle;
      if (pillTitleCoachEl) pillTitleCoachEl.textContent = "🎓 " + product.coachingTitle.replace(/\(.*?\)/g, "").trim();
    }

    if (rStd) rStd.checked = (state.selectedPackage === "standard");
    if (rCoach) rCoach.checked = (state.selectedPackage === "coaching");

    if (cStd) {
      if (state.selectedPackage === "standard") {
        cStd.style.border = "2px solid var(--mint-strong, #059669)";
        cStd.style.background = "#f0fdf4";
      } else {
        cStd.style.border = "1.5px solid #e2e8f0";
        cStd.style.background = "#ffffff";
      }
    }

    if (cCoach) {
      if (state.selectedPackage === "coaching") {
        cCoach.style.border = "2px solid var(--mint-strong, #059669)";
        cCoach.style.background = "#f0fdf4";
      } else {
        cCoach.style.border = "1.5px solid #e2e8f0";
        cCoach.style.background = "#ffffff";
      }
    }

    // 2. Update Step 2 Switcher Pills visual state
    var pStd = document.getElementById("btnSwitchPkgStandard");
    var pCoach = document.getElementById("btnSwitchPkgCoaching");
    if (pStd) {
      if (state.selectedPackage === "standard") {
        pStd.style.border = "1.5px solid var(--mint-strong, #059669)";
        pStd.style.background = "#f0fdf4";
        pStd.style.color = "#065f46";
      } else {
        pStd.style.border = "1.5px solid #e2e8f0";
        pStd.style.background = "#ffffff";
        pStd.style.color = "#475569";
      }
    }
    if (pCoach) {
      if (state.selectedPackage === "coaching") {
        pCoach.style.border = "1.5px solid var(--mint-strong, #059669)";
        pCoach.style.background = "#f0fdf4";
        pCoach.style.color = "#065f46";
      } else {
        pCoach.style.border = "1.5px solid #e2e8f0";
        pCoach.style.background = "#ffffff";
        pCoach.style.color = "#475569";
      }
    }

    // 3. Update summary labels
    var currentTotal = getCartTotal();
    if (checkoutSummaryPrice) checkoutSummaryPrice.textContent = formatCurrency(currentTotal);
    var bankAmt = document.getElementById("bankAmount");
    if (bankAmt) bankAmt.textContent = formatCurrency(currentTotal);
    if (checkoutTotal) checkoutTotal.textContent = formatCurrency(currentTotal);

    // 4. If switched while on Step 2 (payment step), refresh order & QR code
    if (updateOrder && checkoutPaymentStep && checkoutPaymentStep.style.display !== "none") {
      createOrderAndRenderQr({
        customer_phone: getResolvedPhone(),
        customer_email: state.user ? state.user.email : ""
      });
    }
  }

  // Cache check for instant product display
  var isFirestoreProductsLoaded = false;
  try {
    // Clear all legacy and temporary cache keys
    localStorage.removeItem("filedilam_cached_products");
    localStorage.removeItem("filedilam_cached_products_v2");
    localStorage.removeItem("filedilam_cached_products_v3");
    localStorage.removeItem("filedilam_cached_products_v4");

    var cachedProductsStr = localStorage.getItem("filedilam_cached_products_v5");
    if (cachedProductsStr) {
      var cachedList = JSON.parse(cachedProductsStr);
      if (Array.isArray(cachedList) && cachedList.length > 0) {
        data.products = cachedList;
        isFirestoreProductsLoaded = true;
      }
    }
  } catch(e) {}

  renderFolders();
  renderPriceFilter();
  renderProducts();
  renderCart();
  mountCheckoutFooter();
  bindEvents();
  initAuth();

  if (window.location.hash === "#thanh-toan") {
    window.setTimeout(function () { openCheckout(true); }, 0);
  }

  // Load dynamic products from Firestore (Single Source of Truth)
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    var db = firebase.firestore();
    // Real-time synchronization: Any change in Admin Dashboard reflects immediately on Storefront!
    syncLandingCouponTicket();
    db.collection('products').onSnapshot(function(snapshot) {
      var newProducts = [];
      snapshot.forEach(function(doc) {
        var p = doc.data();
        p.id = p.id || doc.id;
        newProducts.push(p);
      });
      if (newProducts.length > 0) {
        data.products = newProducts;
        try {
          localStorage.setItem("filedilam_cached_products_v5", JSON.stringify(data.products));
        } catch(e) {}
      }
      cleanCart();
      isFirestoreProductsLoaded = true;
      renderProducts();
      renderCart();
    }, function(error) {
      console.error("Error listening to Firestore products:", error);
      isFirestoreProductsLoaded = true;
      renderProducts();
    });
  } else {
    isFirestoreProductsLoaded = true;
  }

  function bindEvents() {
    if (searchInput) {
      searchInput.addEventListener("input", function (event) {
        state.searchTerm = event.target.value.trim().toLowerCase();
        renderProducts();
      });
    }

    if (categorySelect) {
      categorySelect.addEventListener("change", function (event) {
        state.activeCategoryId = event.target.value;
        renderFolders();
        renderProducts();
      });
    }

    if (priceSelect) {
      priceSelect.addEventListener("change", function (event) {
        state.activePriceId = event.target.value;
        renderPriceFilter();
        renderProducts();
      });
    }

    if (openCartButton) openCartButton.addEventListener("click", openCart);
    var elCloseCart = document.getElementById("closeCart");
    if (elCloseCart) elCloseCart.addEventListener("click", closeCart);

    var elCheckoutButton = document.getElementById("checkoutButton");
    if (elCheckoutButton) elCheckoutButton.addEventListener("click", openCheckout);

    if (checkoutBackBtn) {
      checkoutBackBtn.addEventListener("click", function () {
        if (!checkoutModal.classList.contains("has-active-order")) {
          closeCheckout();
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        checkoutModal.classList.remove("has-active-order");
        setCheckoutCustomerConfirmed(false);
        checkoutModal.scrollTop = 0;
      });
    }
    if (btnEditCheckoutCustomer) {
      btnEditCheckoutCustomer.addEventListener("click", function () {
        setCheckoutCustomerConfirmed(false);
        checkoutModal.classList.remove("has-active-order");
        if (quickName) quickName.focus();
      });
    }

    var checkoutNavBrand = document.getElementById("checkoutNavBrand");
    if (checkoutNavBrand) {
      checkoutNavBrand.addEventListener("click", function () {
        closeCheckout();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
    Array.prototype.forEach.call(document.querySelectorAll(".checkout-nav-home-link"), function (link) {
      link.addEventListener("click", function () {
        closeCheckout();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".checkout-nav-catalog-link"), function (link) {
      link.addEventListener("click", function () {
        closeCheckout();
        var cat = document.getElementById("catalog");
        if (cat) cat.scrollIntoView({ behavior: "smooth" });
      });
    });

    var detailNavBrand = document.getElementById("detailNavBrand");
    if (detailNavBrand) {
      detailNavBrand.addEventListener("click", function () {
        closeDetail();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
    Array.prototype.forEach.call(document.querySelectorAll(".detail-nav-home-link"), function (link) {
      link.addEventListener("click", function () {
        closeDetail();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".detail-nav-catalog-link"), function (link) {
      link.addEventListener("click", function () {
        closeDetail();
        var cat = document.getElementById("catalog");
        if (cat) cat.scrollIntoView({ behavior: "smooth" });
      });
    });

    var elBackToCart = document.getElementById("backToCart");
    if (elBackToCart) {
      elBackToCart.addEventListener("click", function () {
        closeCheckout();
        openCart();
      });
    }

    var elCloseDetail = document.getElementById("closeDetail");
    if (elCloseDetail) elCloseDetail.addEventListener("click", closeDetail);
    var elCloseDetailTop = document.getElementById("closeDetailTopBtn");
    if (elCloseDetailTop) elCloseDetailTop.addEventListener("click", closeDetail);

    var elCopyBankInfo = document.getElementById("copyBankInfo");
    if (elCopyBankInfo) elCopyBankInfo.addEventListener("click", copyTransferNote);

    var elConfirmPayment = document.getElementById("confirmPayment");
    if (elConfirmPayment) elConfirmPayment.addEventListener("click", handleConfirmPaymentClicked);

    if (saveQrBtn) saveQrBtn.addEventListener("click", saveQrImage);
    if (openBankBtn) openBankBtn.addEventListener("click", openBankPickerModal);
    if (closeBankPicker) closeBankPicker.addEventListener("click", closeBankPickerModal);
    if (bankGrid) bankGrid.addEventListener("click", handleBankItemClick);
    if (bankSearchInput) {
      bankSearchInput.addEventListener("input", function (e) {
        filterBankItems(e.target.value);
      });
    }
    if (copyBankNumberBtn) {
      copyBankNumberBtn.addEventListener("click", function () {
        var num = (bankNumber && bankNumber.textContent.trim()) || (document.getElementById("qrAccDisplay") ? document.getElementById("qrAccDisplay").textContent.trim() : "59215112002");
        copyTextToClipboard(num, copyBankNumberBtn, "Đã sao chép Số tài khoản");
      });
    }
    var copyBankAmountBtn = document.getElementById("copyBankAmountBtn");
    if (copyBankAmountBtn) {
      copyBankAmountBtn.addEventListener("click", function () {
        var bankAmt = document.getElementById("bankAmount") || document.getElementById("qrAmountDisplay");
        copyTextToClipboard(bankAmt ? bankAmt.textContent.replace(/[^\d]/g, "") : "", copyBankAmountBtn, "Đã sao chép Số tiền");
      });
    }
    if (copyTransferNoteBtn) {
      copyTransferNoteBtn.addEventListener("click", function () {
        var note = (bankTransferNote && bankTransferNote.textContent.trim()) || (document.getElementById("qrTransferNoteDisplay") ? document.getElementById("qrTransferNoteDisplay").textContent.trim() : "");
        copyTextToClipboard(note, copyTransferNoteBtn, "Đã sao chép Nội dung CK");
      });
    }
    if (loginButton) loginButton.addEventListener("click", openAuthModal);
    if (registerButton) registerButton.addEventListener("click", openRegisterModal);
    if (logoutButton) logoutButton.addEventListener("click", function () {
      closeUserMenu();
      signOutUser();
    });
    if (myPurchasesBtn) myPurchasesBtn.addEventListener("click", function () {
      closeUserMenu();
      openPurchases();
    });
    if (userMenuBtn) {
      userMenuBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleUserMenu();
      });
    }
    if (closePurchases) closePurchases.addEventListener("click", closePurchasesDrawer);
    if (closeAuth) closeAuth.addEventListener("click", closeAuthModal);
    if (btnGoogleLogin) btnGoogleLogin.addEventListener("click", signInWithGoogle);
    if (authToggleLink) authToggleLink.addEventListener("click", toggleAuthMode);
    if (authForm) authForm.addEventListener("submit", handleAuthSubmit);

    // Review Modal events
    if (closeReviewModal) closeReviewModal.addEventListener("click", closeReviewModalFn);
    if (cancelReviewBtn) cancelReviewBtn.addEventListener("click", closeReviewModalFn);
    var sheetHandleBar = document.querySelector("#reviewModal .sheet-handle-bar");
    if (sheetHandleBar) sheetHandleBar.addEventListener("click", closeReviewModalFn);
    if (reviewForm) reviewForm.addEventListener("submit", handleReviewSubmit);

    if (starRatingPicker) {
      starRatingPicker.addEventListener("click", function (event) {
        var starEl = event.target.closest(".star-pick");
        if (starEl) {
          var starVal = parseInt(starEl.getAttribute("data-star"), 10);
          setStarRating(starVal);
        }
      });
    }

    var tabAuthLogin = document.getElementById("tabAuthLogin");
    if (tabAuthLogin) {
      tabAuthLogin.addEventListener("click", function () {
        isRegisterMode = false;
        updateAuthUI();
      });
    }

    var tabAuthRegister = document.getElementById("tabAuthRegister");
    if (tabAuthRegister) {
      tabAuthRegister.addEventListener("click", function () {
        isRegisterMode = true;
        updateAuthUI();
      });
    }

    var toggleAuthPassVisibility = document.getElementById("toggleAuthPassVisibility");
    if (toggleAuthPassVisibility) {
      toggleAuthPassVisibility.addEventListener("click", function () {
        var authPass = document.getElementById("authPassword");
        if (!authPass) return;
        var isPass = authPass.type === "password";
        authPass.type = isPass ? "text" : "password";
        var eyeOpen = toggleAuthPassVisibility.querySelector(".eye-open");
        var eyeClosed = toggleAuthPassVisibility.querySelector(".eye-closed");
        if (eyeOpen) eyeOpen.style.display = isPass ? "none" : "block";
        if (eyeClosed) eyeClosed.style.display = isPass ? "block" : "none";
      });
    }

    // Unified Checkout events
    if (btnGoogleCheckout) btnGoogleCheckout.addEventListener("click", signInWithGoogleCheckout);
    if (quickBuyForm) {
      quickBuyForm.addEventListener("submit", handleQuickBuySubmit);
    }
    if (btnQuickSubmit) {
      btnQuickSubmit.addEventListener("click", function (e) {
        // Prevent double trigger if submit fires, but ensure execution if submit is swallowed by Safari
        if (e && e.type === "click") {
          handleQuickBuySubmit(e);
        }
      });
    }
    if (quickToggleLink) quickToggleLink.addEventListener("click", toggleQuickMode);
    if (backToInfoBtn) backToInfoBtn.addEventListener("click", handleBackToInfo);

    var tabNewBuyer = document.getElementById("tabNewBuyer");
    if (tabNewBuyer) {
      tabNewBuyer.addEventListener("click", function () {
        isQuickLoginMode = false;
        updateQuickUI();
      });
    }

    var tabReturningBuyer = document.getElementById("tabReturningBuyer");
    if (tabReturningBuyer) {
      tabReturningBuyer.addEventListener("click", function () {
        isQuickLoginMode = true;
        updateQuickUI();
      });
    }

    var togglePassVisibility = document.getElementById("togglePassVisibility");
    if (togglePassVisibility) {
      togglePassVisibility.addEventListener("click", function () {
        if (!quickPassword) return;
        var isPass = quickPassword.type === "password";
        quickPassword.type = isPass ? "text" : "password";
        var eyeOpen = togglePassVisibility.querySelector(".eye-open");
        var eyeClosed = togglePassVisibility.querySelector(".eye-closed");
        if (eyeOpen) eyeOpen.style.display = isPass ? "none" : "block";
        if (eyeClosed) eyeClosed.style.display = isPass ? "block" : "none";
      });
    }

    // Package Upsell listeners (Step 1 cards & Step 2 pills)
    var elPkgStd = document.getElementById("pkgOptionStandard");
    var elPkgCoach = document.getElementById("pkgOptionCoaching");
    var elRadioStd = document.getElementById("radioPkgStandard");
    var elRadioCoach = document.getElementById("radioPkgCoaching");
    var elBtnSwitchStd = document.getElementById("btnSwitchPkgStandard");
    var elBtnSwitchCoach = document.getElementById("btnSwitchPkgCoaching");

    if (elPkgStd) elPkgStd.addEventListener("click", function() { setCheckoutPackage("standard", false); });
    if (elPkgCoach) elPkgCoach.addEventListener("click", function() { setCheckoutPackage("coaching", false); });
    if (elRadioStd) elRadioStd.addEventListener("change", function() { setCheckoutPackage("standard", false); });
    if (elRadioCoach) elRadioCoach.addEventListener("change", function() { setCheckoutPackage("coaching", false); });
    if (elBtnSwitchStd) elBtnSwitchStd.addEventListener("click", function() { setCheckoutPackage("standard", true); });
    if (elBtnSwitchCoach) elBtnSwitchCoach.addEventListener("click", function() { setCheckoutPackage("coaching", true); });

    if (detailModal) {
      detailModal.addEventListener("click", function (event) {
        if (event.target === detailModal) {
          closeDetail();
        }
      });
    }

        // Fullpage Checkout: Khóa không cho đóng khi bấm vào nền hoặc khoảng trống
    if (checkoutModal) {
      checkoutModal.addEventListener("click", function (event) {
        // Trang thanh toán chỉ đóng qua điều hướng rõ ràng.
      });
    }

    window.addEventListener("popstate", function () {
      if (window.location.hash === "#thanh-toan") {
        openCheckout(true);
      } else if (checkoutModal && checkoutModal.classList.contains("is-open")) {
        closeCheckout(true);
      }
    });
    
    if (authModal) {
      authModal.addEventListener("click", function (event) {
        if (event.target === authModal) {
          closeAuthModal();
        }
      });
    }

    if (bankPickerModal) {
      bankPickerModal.addEventListener("click", function (event) {
        if (event.target === bankPickerModal) {
          closeBankPickerModal();
        }
      });
    }

    if (reviewModal) {
      reviewModal.addEventListener("click", function (event) {
        if (event.target === reviewModal) {
          closeReviewModalFn();
        }
      });
    }

    // Đóng drawer và dropdown khi click ra ngoài
    document.addEventListener("click", function (event) {
      if (userProfile && userProfile.classList.contains("is-open")) {
        if (!userProfile.contains(event.target)) {
          closeUserMenu();
        }
      }
      if (purchasesDrawer && purchasesDrawer.classList.contains("is-open")) {
        if (!purchasesDrawer.contains(event.target) && !event.target.closest("#myPurchasesBtn") && !event.target.closest("#btnSuccessViewPurchases")) {
          closePurchasesDrawer();
        }
      }
      if (mobileNavDrawer && mobileNavDrawer.classList.contains("is-open")) {
        if (!mobileNavDrawer.contains(event.target) && !event.target.closest("#openMobileMenu")) {
          mobileNavDrawer.classList.remove("is-open");
          document.body.classList.remove("drawer-open");
        }
      }
      if (cartDrawer && cartDrawer.classList.contains("is-open")) {
        if (
          !cartDrawer.contains(event.target) &&
          !event.target.closest("#openCartNav") &&
          !event.target.closest("#openCartButton") &&
          !event.target.closest("[data-cart-id]") &&
          !event.target.closest("#detailAddToCart")
        ) {
          closeCart();
        }
      }
    });

    // Tự động kiểm tra đơn hàng và phục hồi màn hình thanh toán khi khách quay lại trình duyệt
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        checkActiveOrderOnResume();
        if (!checkoutModal || !checkoutModal.classList.contains("is-open")) {
          restoreActiveOrderModal();
        }
      }
    });

    window.addEventListener("focus", function () {
      checkActiveOrderOnResume();
      if (!checkoutModal || !checkoutModal.classList.contains("is-open")) {
        restoreActiveOrderModal();
      }
    });

    var btnResumeOrder = document.getElementById("btnResumeOrder");
    if (btnResumeOrder) {
      btnResumeOrder.addEventListener("click", function () {
        restoreActiveOrderModal({ force: true });
      });
    }

    // Treo màn hình thanh toán nếu khách có đơn hàng PENDING còn hiệu lực khi vừa tải trang
    restoreActiveOrderModal();

    // Hỗ trợ tự động đăng nhập 1-chạm bằng Magic Link (?magic=token) và mở File của tôi
    try {
      var urlParams = new URLSearchParams(window.location.search);
      var magicToken = urlParams.get("magic");
      if (magicToken && typeof firebase !== 'undefined' && firebase.auth) {
        showToast("Đang xác thực đăng nhập 1 chạm...");
        firebase.auth().signInWithCustomToken(magicToken)
          .then(function(userCred) {
            showToast("Đăng nhập thành công!");
            // Xóa param ?magic trên URL để bảo mật và sạch URL
            if (window.history && window.history.replaceState) {
              window.history.replaceState({}, document.title, window.location.pathname + "?tab=my-files");
            }
            setTimeout(function() {
              openPurchases();
            }, 600);
          })
          .catch(function(err) {
            console.error("Magic login failed:", err);
            showToast("Link đăng nhập đã hết hạn hoặc không hợp lệ.");
          });
      } else if (urlParams.get("tab") === "my-files" || urlParams.get("view") === "purchases") {
        setTimeout(function() {
          openPurchases();
        }, 600);
      }
    } catch(e) {}
  }

  function toggleUserMenu() {
    if (!userProfile) return;
    var isOpen = userProfile.classList.contains("is-open");
    if (isOpen) {
      closeUserMenu();
    } else {
      userProfile.classList.add("is-open");
      if (userMenuBtn) userMenuBtn.setAttribute("aria-expanded", "true");
    }
  }

  function closeUserMenu() {
    if (!userProfile) return;
    userProfile.classList.remove("is-open");
    if (userMenuBtn) userMenuBtn.setAttribute("aria-expanded", "false");
  }

  function initAuth() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          state.user = user;
          document.body.classList.add("is-logged-in");
          document.body.classList.remove("is-logged-out");
          if (registerButton) registerButton.style.display = "none";
          if (loginButton) loginButton.style.display = "none";
          // Chỉ hiển thị menu tài khoản trên Topbar nếu là tài khoản ADMIN
          var isAdminUser = (user.email === 'huynhkiencam151102@gmail.com');
          if (userProfile) {
            if (userProfile) userProfile.style.display = "none";
          }
          if (purchasesDrawer && purchasesDrawer.classList.contains("is-open")) {
            loadMyPurchases();
          }
          
          var adminBtn = document.getElementById("adminDashboardBtn");
          if (adminBtn) {
            if (user.email === 'huynhkiencam151102@gmail.com') {
              document.body.classList.add("is-admin");
              adminBtn.style.display = "flex";
            } else {
              document.body.classList.remove("is-admin");
              adminBtn.style.display = "none";
            }
          }
          
          loadProfile().then(function (profile) {
            var displayId = (profile && profile.phone) ||
              (user.email && user.email.indexOf("@khachhang.filedilam.vn") !== -1
                ? user.email.replace("@khachhang.filedilam.vn", "")
                : (user.displayName || user.email));
            if (userNameDisplay) userNameDisplay.textContent = displayId;
            if (userDropdownEmail) userDropdownEmail.textContent = user.email || displayId;
            checkActiveOrderOnResume();
            if (!checkoutModal || !checkoutModal.classList.contains("is-open")) {
              restoreActiveOrderModal();
            }
          });
        } else {
          state.user = null;
          state.profile = null;
          document.body.classList.remove("is-logged-in");
          document.body.classList.add("is-logged-out");
          closeUserMenu();
          if (registerButton) registerButton.style.display = "none";
          if (loginButton) loginButton.style.display = "none";
          if (userProfile) if (userProfile) userProfile.style.display = "none";
          closePurchasesDrawer();
        }
      });
    }
  }

  function openAuthModal() {
    isRegisterMode = false;
    updateAuthUI();
    if (authModal) {
      authModal.classList.add("is-open");
      authModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("drawer-open");
    }
  }

  function openRegisterModal() {
    isRegisterMode = true;
    updateAuthUI();
    if (authModal) {
      authModal.classList.add("is-open");
      authModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("drawer-open");
    }
  }

  function closeAuthModal() {
    if (authModal) {
      authModal.classList.remove("is-open");
      authModal.setAttribute("aria-hidden", "true");
    }
    unlockBodyIfNeeded();
  }

  function toggleAuthMode(e) {
    if (e) e.preventDefault();
    isRegisterMode = !isRegisterMode;
    updateAuthUI();
  }

  function updateAuthUI() {
    var title = document.getElementById("authModalTitle");
    var submitBtn = document.getElementById("authSubmitBtn");
    var toggleText = document.getElementById("authToggleText");
    var toggleLink = document.getElementById("authToggleLink");
    var accountLabel = document.getElementById("authAccountLabel");
    var passLabel = document.getElementById("authPasswordLabel");
    var passInput = document.getElementById("authPassword");
    var tabLogin = document.getElementById("tabAuthLogin");
    var tabRegister = document.getElementById("tabAuthRegister");

    if (tabLogin && tabRegister) {
      if (isRegisterMode) {
        tabLogin.classList.remove("active");
        tabRegister.classList.add("active");
      } else {
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
      }
    }

    if (isRegisterMode) {
      if (title) title.textContent = "Đăng ký tài khoản";
      if (submitBtn) submitBtn.textContent = "Đăng ký tài khoản";
      if (toggleText) toggleText.textContent = "Đã có tài khoản?";
      if (toggleLink) toggleLink.textContent = "Đăng nhập ngay";
      if (accountLabel) accountLabel.innerHTML = 'Số điện thoại / Zalo <span class="req">*</span>';
      if (passLabel) passLabel.innerHTML = 'Mật khẩu tự chọn <span class="req">*</span>';
      if (passInput) passInput.placeholder = "Tối thiểu 6 ký tự để tải lại file sau";
      if (authPhoneGroup) authPhoneGroup.style.display = "none";
    } else {
      if (title) title.textContent = "Đăng nhập tài khoản";
      if (submitBtn) submitBtn.textContent = "Đăng nhập";
      if (toggleText) toggleText.textContent = "Chưa có tài khoản?";
      if (toggleLink) toggleLink.textContent = "Đăng ký ngay";
      if (accountLabel) accountLabel.innerHTML = 'Số điện thoại hoặc Email <span class="req">*</span>';
      if (passLabel) passLabel.innerHTML = 'Mật khẩu <span class="req">*</span>';
      if (passInput) passInput.placeholder = "Nhập mật khẩu";
      if (authPhoneGroup) authPhoneGroup.style.display = "none";
    }
  }

  function identifierToAuthEmail(identifier) {
    var val = String(identifier || "").trim();
    if (!val) return "";
    if (val.indexOf("@") !== -1) {
      return val.toLowerCase();
    }
    var phone = normalizePhone(val);
    return phone ? phone + "@khachhang.filedilam.vn" : val;
  }

  function handleAuthSubmit(e) {
    e.preventDefault();
    var identifier = document.getElementById("authEmail").value.trim();
    var password = document.getElementById("authPassword").value;
    var authEmail = identifierToAuthEmail(identifier);
    var phone = isValidPhone(identifier) ? normalizePhone(identifier) : "";
    
    if (typeof firebase === 'undefined' || !firebase.auth) {
      showToast("Đang tải dữ liệu. Vui lòng thử lại sau.");
      return;
    }

    var auth = firebase.auth();
    var submitBtn = document.getElementById("authSubmitBtn");
    submitBtn.disabled = true;

    if (isRegisterMode) {
      if (!isValidPhone(phone) && identifier.indexOf("@") === -1) {
        showToast("Vui lòng nhập đúng số điện thoại (9–11 số) hoặc Email.");
        submitBtn.disabled = false;
        return;
      }
      auth.createUserWithEmailAndPassword(authEmail, password)
        .then(function(result) {
          state.user = result.user;
          closeAuthModal();
          showToast("Đăng ký thành công!");
          saveProfile({ email: authEmail, phone: phone, auth_provider: "password" });
        })
        .catch(function(error) {
          showToast(authErrorMessage(error, "register"));
        })
        .finally(function() {
          submitBtn.disabled = false;
        });
    } else {
      auth.signInWithEmailAndPassword(authEmail, password)
        .then(function(result) {
          showToast("Đăng nhập thành công!");
          closeAuthModal();
          if (result.user.email === 'huynhkiencam151102@gmail.com') {
            window.location.href = './admin.html';
          }
        })
        .catch(function(error) {
          showToast("Sai số điện thoại/email hoặc mật khẩu.");
        })
        .finally(function() {
          submitBtn.disabled = false;
        });
    }
  }

  function authErrorMessage(error, mode) {
    var code = error && error.code ? String(error.code) : "";
    if (code.indexOf("email-already-in-use") !== -1) return "Số điện thoại/Email này đã có tài khoản. Hãy bấm Đăng nhập.";
    if (code.indexOf("invalid-email") !== -1) return "Số điện thoại hoặc Email chưa đúng định dạng.";
    if (code.indexOf("weak-password") !== -1) return "Mật khẩu cần ít nhất 6 ký tự.";
    if (code.indexOf("operation-not-allowed") !== -1) return "Đăng ký đang tạm khóa. Vui lòng dùng Google.";
    if (code.indexOf("network-request-failed") !== -1) return "Mạng đang gián đoạn. Vui lòng thử lại.";
    return mode === "register" ? "Chưa thể đăng ký. Vui lòng thử lại hoặc dùng Google." : "Chưa thể đăng nhập.";
  }

  function signInWithGoogle() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      firebase.auth().signInWithPopup(provider).then(function(result) {
        state.user = result.user;
        closeAuthModal();
        if (result.user.email === 'huynhkiencam151102@gmail.com') {
          window.location.href = './admin.html';
          return;
        }
        return loadProfile();
      }).catch(function(error) {
        console.error("Google signIn error:", error);
        if (error.code === 'auth/popup-blocked') {
          showToast("Trình duyệt đang chặn cửa sổ đăng nhập. Vui lòng cho phép popup.");
        } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
          // Người dùng chủ động đóng popup
        } else if (error.code === 'auth/unauthorized-domain') {
          showToast("Tên miền chưa được cấp phép trong Firebase Auth (Authorized domains).");
        } else {
          showToast("Đăng nhập thất bại: " + (error.message || error.code));
        }
      });
    } else {
      showToast("Đang tải dữ liệu. Vui lòng thử lại sau.");
    }
  }

  function signOutUser() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().signOut();
    }
  }

  function apiUrl(path) {
    return "https://us-central1-filedilam.cloudfunctions.net/api" + path;
  }

  function authFetch(path, options) {
    if (!state.user) return Promise.reject(new Error("AUTH_REQUIRED"));
    return state.user.getIdToken().then(function(token) {
      var request = Object.assign({}, options || {});
      request.headers = Object.assign({}, request.headers || {}, {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      });
      return fetch(apiUrl(path), request);
    }).then(function(response) {
      if (!response.ok) {
        return response.text().then(function(message) {
          throw new Error(message || "REQUEST_FAILED");
        });
      }
      return response.json();
    });
  }

  function normalizePhone(value) {
    return String(value || "").replace(/[^0-9]/g, "");
  }

  function isValidPhone(value) {
    return /^[0-9]{9,11}$/.test(normalizePhone(value));
  }

  function isValidEmail(value) {
    var str = String(value || "").trim().toLowerCase();
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str);
  }

  function getResolvedPhone() {
    if (state.profile && isValidPhone(state.profile.phone)) {
      return normalizePhone(state.profile.phone);
    }
    if (state.user) {
      if (state.user.phoneNumber && isValidPhone(state.user.phoneNumber)) {
        return normalizePhone(state.user.phoneNumber);
      }
      if (state.user.email && state.user.email.indexOf("@khachhang.filedilam.vn") !== -1) {
        var fromEmail = normalizePhone(state.user.email.split("@")[0]);
        if (isValidPhone(fromEmail)) return fromEmail;
      }
    }
    return "";
  }

  function hasCompleteProfile() {
    return !!(state.profile && state.profile.email && isValidPhone(state.profile.phone));
  }

  function loadProfile() {
    if (!state.user) return Promise.resolve(null);
    return authFetch("/profile")
      .then(function(profile) {
        state.profile = profile || null;
        var resolved = getResolvedPhone();
        if (resolved && (!state.profile || !isValidPhone(state.profile.phone))) {
          state.profile = Object.assign({}, state.profile || {}, { phone: resolved, email: state.user.email || "" });
          saveProfile({ phone: resolved, email: state.user.email || "", auth_provider: "auto_detect" });
        }
        return state.profile;
      })
      .catch(function(error) {
        var resolved = getResolvedPhone();
        state.profile = { email: state.user.email || "", phone: resolved };
        if (resolved) {
          saveProfile({ phone: resolved, email: state.user.email || "", auth_provider: "auto_detect" });
        }
        return state.profile;
      });
  }

  function saveProfile(profile) {
    return authFetch("/profile", { method: "PUT", body: JSON.stringify(profile) })
      .then(function(saved) {
        state.profile = saved;
        return saved;
      })
      .catch(function(err) {
        console.warn("Could not save profile in background:", err);
        return null;
      });
  }

  function openPurchases() {
    closeCart();
    closeDetail();
    closeCheckout();

    if (purchasesDrawer) {
      purchasesDrawer.classList.add("is-open");
      purchasesDrawer.setAttribute("aria-hidden", "false");
      document.body.classList.add("drawer-open");
      document.body.classList.add("cart-drawer-open");
    }

    if (!state.user) {
      if (purchasesItems) {
        purchasesItems.innerHTML =
          '<div class="empty-state" style="padding: 40px 16px; text-align: center;">' +
            '<div style="font-size: 40px; margin-bottom: 12px;">📁</div>' +
            '<div style="font-weight: 600; font-size: 1rem; margin-bottom: 8px; color: var(--text);">Tài khoản của bạn</div>' +
            '<p style="color: var(--muted); font-size: 0.88rem; line-height: 1.5; margin-bottom: 20px;">Vui lòng đăng nhập bằng Số điện thoại hoặc Email để xem toàn bộ file đã mua.</p>' +
            '<button type="button" class="button-primary button-full" id="btnPurchasesLogin" style="padding: 10px 0; font-size: 0.95rem;">Đăng nhập ngay</button>' +
          '</div>';
        var btnL = document.getElementById("btnPurchasesLogin");
        if (btnL) {
          btnL.addEventListener("click", function() {
            closePurchasesDrawer();
            openAuthModal();
          });
        }
      }
      return;
    }

    loadMyPurchases();
  }

  function closePurchasesDrawer() {
    if (purchasesDrawer) {
      purchasesDrawer.classList.remove("is-open");
      purchasesDrawer.setAttribute("aria-hidden", "true");
      document.body.classList.remove("cart-drawer-open");
      unlockBodyIfNeeded();
    }
  }

  function getSafeDeliveryUrl(url, productType, productId) {
    var value = String(url || "").trim();
    var isGoogleSheet = productType === "google_sheets" || productId === "quan-ly-kho-mini-google-sheets-smart" || value.indexOf("docs.google.com/spreadsheets") !== -1;
    if (!isGoogleSheet) return value;

    // Luôn lấy ID bảng tính rồi dựng lại đường dẫn /copy. Nhờ vậy đơn hàng
    // cũ có lưu /edit, /htmlview hoặc nhầm link Apps Script cũng không làm
    // khách đi sai trang nhận file.
    var match = value.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    var spreadsheetId = match && match[1];
    if (!spreadsheetId && productId === "quan-ly-kho-mini-google-sheets-smart") {
      spreadsheetId = "1xir1M-ieP0zqmGE5J4m1rGbxuzTIUaDw7aFoM7GEeZo";
    }
    return spreadsheetId
      ? "https://docs.google.com/spreadsheets/d/" + spreadsheetId + "/copy"
      : value;
  }

  function loadMyPurchases() {
    if (!state.user || !purchasesItems) return;
    purchasesItems.innerHTML = '<div class="empty-state">Đang tải dữ liệu...</div>';
    
    authFetch("/my-orders")
      .then(function(rawOrders) {
        var orders = (rawOrders || []).filter(function(o) {
          return o && o.status === "PAID";
        });

        if (!orders.length) {
          purchasesItems.innerHTML = '<div class="empty-state">Bạn chưa có file nào được kích hoạt.</div>';
          return;
        }

        purchasesItems.innerHTML = orders.map(function(order) {
          var items = resolveOrderItems(order);
          var orderId = order.order_id || order.id || "";
          var isCoaching = (order.package_type === "coaching") || (order.amount && order.amount >= 199000);
          var coachingBadge = isCoaching 
            ? '<span style="display: inline-block; background: #fef3c7; color: #b45309; font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 6px; border: 1px solid #fde68a; margin-left: 6px; vertical-align: middle;">🎓 Kèm 1-1</span>' 
            : '';
          var coachingZaloBtn = '';
          if (isCoaching) {
            var supportPhone = (window.StorefrontData && window.StorefrontData.store && window.StorefrontData.store.supportZaloPhone) || "0938134576";
            var cleanPhone = supportPhone.replace(/\s+/g, "");
            coachingZaloBtn = 
              '<a href="https://zalo.me/' + cleanPhone + '" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 6px; height: 38px; background: #fef3c7; border: 1.5px solid #f59e0b; color: #92400e; font-weight: 700; font-size: 0.82rem; border-radius: 8px; text-decoration: none; margin-top: 6px;">' +
                '<span>🎓 Đặt lịch Kèm 1-1 qua Zalo (' + supportPhone + ')</span>' +
              '</a>';
          }

          var reviewHtml = "";
          if (order.has_reviewed) {
            var starsNum = parseInt(order.review_stars || 5, 10);
            var starsStr = "★★★★★".slice(0, starsNum);
            reviewHtml = '<div class="reviewed-badge" style="margin-top: 6px;">' +
                           '<span>' + starsStr + '</span>' +
                           '<span>Đã đánh giá ' + starsNum + '/5 sao</span>' +
                         '</div>' +
                         (order.review_comment ? '<div style="font-size: 0.78rem; color: #4b5563; font-style: italic; margin-top: 4px; padding-left: 6px; border-left: 2px solid #86efac;">“' + escapeHtml(order.review_comment) + '”</div>' : '');
          } else {
            reviewHtml = '<button type="button" class="btn-open-review" style="margin-top: 6px;" ' +
                           'data-order-id="' + escapeHtml(orderId) + '" ' +
                           'data-product-id="' + escapeHtml(order.product_id || (items[0] && items[0].product_id) || "") + '" ' +
                           'data-product-name="' + escapeHtml(order.product_name || "File đã mua") + '">' +
                           '⭐ Đánh giá trải nghiệm đơn này' +
                         '</button>';
          }

          var itemsHtml = items.map(function(item, idx) {
            var isCloud = item.is_cloud;
            var btnText = isCloud ? 'Tạo bản sao Google Sheets' : 'Tải file Excel';
            var isSmartKho = (item.product_id === "quan-ly-kho-mini-google-sheets-smart");
            var itemGuide = '';
            if (isCloud) {
              itemGuide = '<p style="font-size:.78rem;color:var(--muted);margin:0 0 6px 0;line-height:1.4;">Mở link → Đăng nhập Google → Bấm Tạo bản sao. File sẽ lưu vào Google Drive của bạn.</p>';
              if (isSmartKho) {
                itemGuide += '<div style="font-size:.78rem;background:rgba(4,120,87,0.1);padding:8px;border-radius:6px;color:var(--mint-strong); margin-bottom:4px;">' +
                  '<b>🚀 CÀI ĐẶT WEB APP (Chỉ làm 1 lần):</b><br>' +
                  '1. Mở bản sao vừa tạo, bấm menu <b>Kho Mini Smart > Mở ứng dụng quản lý kho</b><br>' +
                  '2. Cấp quyền bảo mật: Bấm <b>Continue > Chọn Email > Allow</b><br>' +
                  '3. Màn hình báo thành công: <b>Đóng tab đó lại</b> và quay về trang tính bấm mở lại ứng dụng lần nữa!' +
                '</div>' +
                '<a href="/huong-dan-kho-smart.mp4" target="_blank" style="font-size:.75rem; color:var(--mint); text-decoration:underline;">▶ Xem video hướng dẫn 15s</a>';
              }
            }

            var itemHeader = items.length > 1 ? '<div style="font-weight: 600; font-size: 0.88rem; color: #1f2937; margin-bottom: 4px; display:flex; align-items:center; gap: 6px;"><span style="color:var(--mint-strong); font-size: 0.95rem;">📄</span> ' + escapeHtml(item.product_name) + '</div>' : '';

            return '<div style="background: ' + (items.length > 1 ? '#f8fafc' : 'transparent') + '; padding: ' + (items.length > 1 ? '10px' : '0') + '; border-radius: 8px; border: ' + (items.length > 1 ? '1px solid #e2e8f0' : 'none') + '; margin-top: 6px;">' +
                     itemHeader +
                     '<a href="' + escapeHtml(item.delivery_url) + '" target="_blank" rel="noopener noreferrer" class="button-primary button-full" style="height: 38px; font-size: 0.88rem; text-decoration: none; display: flex; align-items: center; justify-content: center; border-radius: 8px; margin-bottom: 6px;">' + btnText + (items.length > 1 ? ' (' + escapeHtml(item.product_name) + ')' : '') + '</a>' +
                     itemGuide +
                   '</div>';
          }).join("");

          return '<div class="drawer-item" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 14px; border: 1px solid var(--line); border-radius: 10px; background: #fff; margin-bottom: 12px;">' +
                   '<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">' +
                     '<div>' +
                       '<div style="font-weight: 600; font-size: 0.95rem; color: var(--text); margin-bottom: 4px;">' + escapeHtml(order.product_name) + coachingBadge + '</div>' +
                       '<div style="color: var(--mint-strong); font-size: 0.82rem; font-weight: 500;">Đã thanh toán: ' + formatCurrency(order.amount) + '</div>' +
                     '</div>' +
                     '<span style="background:#ecfdf5; color:#065f46; font-size: 0.72rem; font-weight: 600; padding: 3px 8px; border-radius: 999px; white-space: nowrap;">Đã kích hoạt</span>' +
                   '</div>' +
                   itemsHtml +
                   coachingZaloBtn +
                   reviewHtml +
                 '</div>';
        }).join("");

        // Gắn sự kiện click cho tất cả nút Đánh giá
        var reviewButtons = purchasesItems.querySelectorAll(".btn-open-review");
        Array.prototype.forEach.call(reviewButtons, function (btn) {
          btn.addEventListener("click", function () {
            var oId = btn.getAttribute("data-order-id");
            var pId = btn.getAttribute("data-product-id");
            var pName = btn.getAttribute("data-product-name");
            openReviewModal(oId, pId, pName);
          });
        });
      })
      .catch(function(err) {
        purchasesItems.innerHTML = '<div class="empty-state">Lỗi kết nối. Vui lòng thử lại.</div>';
      });
  }

  // Quản lý Modal Đánh Giá Thật (Real Customer Review)
  var starLabels = {
    1: "Rất không hài lòng (1 sao)",
    2: "Cần cải thiện (2 sao)",
    3: "Bình thường, tạm ổn (3 sao)",
    4: "Tốt & tiện lợi (4 sao)",
    5: "Rất hài lòng & hữu ích! (5 sao)"
  };

  function setStarRating(num) {
    if (!reviewStars) return;
    num = Math.max(1, Math.min(5, parseInt(num, 10) || 5));
    reviewStars.value = num;
    if (starRatingPicker) {
      var starSpans = starRatingPicker.querySelectorAll(".star-pick");
      Array.prototype.forEach.call(starSpans, function (span) {
        var s = parseInt(span.getAttribute("data-star"), 10);
        if (s <= num) {
          span.classList.add("active");
        } else {
          span.classList.remove("active");
        }
      });
    }
    if (starRatingLabel) {
      starRatingLabel.textContent = starLabels[num] || (num + " sao");
    }
  }

  function openReviewModal(orderId, productId, productName) {
    if (!reviewModal) return;
    if (reviewOrderId) reviewOrderId.value = orderId || "";
    if (reviewProductId) reviewProductId.value = productId || "";
    if (reviewProductName) reviewProductName.textContent = productName || "File đã mua";
    if (reviewComment) reviewComment.value = "";
    setStarRating(5);
    reviewModal.classList.add("is-open");
    reviewModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeReviewModalFn() {
    if (!reviewModal) return;
    reviewModal.classList.remove("is-open");
    reviewModal.setAttribute("aria-hidden", "true");
    unlockBodyIfNeeded();
  }

  function handleReviewSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    var orderId = reviewOrderId ? reviewOrderId.value.trim() : "";
    var productId = reviewProductId ? reviewProductId.value.trim() : "";
    var stars = reviewStars ? parseInt(reviewStars.value, 10) : 5;
    var comment = reviewComment ? reviewComment.value.trim() : "";

    if (!orderId) {
      showToast("Không tìm thấy mã đơn hàng để đánh giá.", "error");
      return;
    }

    if (submitReviewBtn) {
      submitReviewBtn.disabled = true;
      submitReviewBtn.textContent = "Đang gửi...";
    }

    authFetch("/reviews", {
      method: "POST",
      body: JSON.stringify({
        order_id: orderId,
        product_id: productId,
        stars: stars,
        comment: comment
      })
    })
    .then(function (res) {
      showToast("Cảm ơn bạn đã gửi đánh giá!", "success");
      closeReviewModalFn();
      loadMyPurchases();
      if (res && res.rating_avg && productId) {
        var p = (data.products || []).find(function (item) { return item.id === productId; });
        if (p) {
          p.rating_avg = res.rating_avg;
          p.rating_count = res.rating_count;
          renderProducts();
        }
      }
    })
    .catch(function (err) {
      console.error("Lỗi gửi đánh giá:", err);
      showToast("Lỗi khi gửi đánh giá: " + (err.message || "Vui lòng thử lại"), "error");
    })
    .finally(function () {
      if (submitReviewBtn) {
        submitReviewBtn.disabled = false;
        submitReviewBtn.textContent = "Gửi đánh giá";
      }
    });
  }

  function renderFolders() {
    var categoryOptions = (data.categories || []).slice();
    if (folderGrid) {
      folderGrid.innerHTML = categoryOptions
        .map(function (category) {
          var activeClass = category.id === state.activeCategoryId ? " active" : "";
          var count = 0;
          if (category.id === "all") {
            count = (data.products || []).length;
          } else {
            count = (data.products || []).filter(function(p) {
              var pCat = p.category || p.categoryId || 'kinh-doanh';
              if (['ban-hang-online', 'quan-ly-kho', 'fnb-cost', 'combo'].indexOf(pCat) !== -1) pCat = 'kinh-doanh';
              if (['cong-no', 'thu-chi-dong-tien'].indexOf(pCat) !== -1) pCat = 'ke-toan';
              return pCat === category.id;
            }).length;
          }
          var countBadge = count > 0 ? ' <span class="cat-count">' + count + '</span>' : '';
          
          var displayName = category.name;

          return (
            '<li class="category-item' + activeClass + '" data-folder-id="' +
            escapeHtml(category.id) + '">' +
            escapeHtml(displayName) + countBadge +
            '</li>'
          );
        })
        .join("");

      Array.prototype.forEach.call(folderGrid.querySelectorAll("[data-folder-id]"), function (li) {
        li.addEventListener("click", function () {
          var targetId = li.getAttribute("data-folder-id");
          if (state.activeCategoryId === targetId) {
            state.activeCategoryId = "all";
          } else {
            state.activeCategoryId = targetId;
          }
          if (categorySelect) categorySelect.value = state.activeCategoryId;
          renderFolders();
          renderProducts();
        });
      });
    }

    if (categorySelect) {
      categorySelect.innerHTML = categoryOptions
        .map(function (c) {
          return '<option value="' + escapeHtml(c.id) + '"' + (c.id === state.activeCategoryId ? ' selected' : '') + '>' + escapeHtml(c.name) + '</option>';
        })
        .join("");
    }
  }

  function renderPriceFilter() {
    if (priceGrid) {
      var priceItems = priceGrid.querySelectorAll(".category-item");
      Array.prototype.forEach.call(priceItems, function (li) {
        if (li.getAttribute("data-price-id") === state.activePriceId) {
          li.classList.add("active");
        } else {
          li.classList.remove("active");
        }
        
        // Remove old listeners to avoid duplicates, by cloning
        var newLi = li.cloneNode(true);
        li.parentNode.replaceChild(newLi, li);
        
        newLi.addEventListener("click", function () {
          state.activePriceId = newLi.getAttribute("data-price-id");
          if (priceSelect) priceSelect.value = state.activePriceId;
          renderPriceFilter();
          renderProducts();
        });
      });
    }

    if (priceSelect) {
      priceSelect.value = state.activePriceId;
    }
  }

  function renderProducts() {
    var category = getActiveCategory();
    var items = getFilteredProducts().filter(matchesSearch);
    if (catalogTitle) catalogTitle.textContent = category ? category.name : "Tất cả sản phẩm";
    if (catalogDescription) catalogDescription.textContent = category ? category.description : "Toàn bộ file Excel và Google Sheets đang có trên cửa hàng.";

    var statTotalFilesEl = document.getElementById("statTotalFiles");
    if (statTotalFilesEl && data.products && data.products.length > 0) {
      statTotalFilesEl.setAttribute("data-target", data.products.length);
      statTotalFilesEl.textContent = data.products.length;
    }

    if (!items.length) {
      if (!isFirestoreProductsLoaded && (!data.products || !data.products.length)) {
        productGrid.innerHTML =
          '<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">' +
            '<div style="display:inline-block; width:28px; height:28px; border:3px solid var(--line); border-top-color:var(--mint-strong); border-radius:50%; animation:spin 0.8s linear infinite;"></div>' +
            '<p style="margin-top:12px; color:var(--muted); font-size:0.9rem;">Đang tải danh sách file...</p>' +
          '</div>';
        return;
      }
      productGrid.innerHTML =
        '<div class="empty-state">Chưa có file khớp với từ khóa bạn vừa nhập.</div>';
      return;
    }

    productGrid.innerHTML = items
      .map(function (product) {
        var originalPrice = product.originalPrice;
        var hasDiscount = originalPrice && originalPrice > product.price;
        var discountPercent = hasDiscount ? Math.round((1 - product.price / originalPrice) * 100) : 0;
        
        var ratingInfo = getProductRatingDisplay(product);
        var socialProofHtml = '<div class="product-social-proof">' +
          '<span class="star-rating">⭐ ' + ratingInfo.score + '</span>' +
          '<span class="download-count">(' + ratingInfo.sales + ')</span>' +
        '</div>';
        
        var isCombo = product.categoryId === "combo" || product.type === "combo";
        var isHot = product.price >= 80000;
        var inlineTag = product.tag || (isCombo ? "Combo" : (isHot ? "Bán chạy" : ""));
        var inlineTagClass = isCombo ? " is-combo" : (inlineTag === "Bán chạy" ? " is-bestseller" : "");
        var inlineTagHtml = inlineTag ? '<span class="product-badge-inline' + inlineTagClass + '">' + escapeHtml(inlineTag) + '</span> ' : '';

        return (
          '<div class="product-card" data-detail-id="' + escapeHtml(product.id) + '">' +
            renderProductThumb(product) +
            '<div class="product-info">' +
              '<div class="product-main">' +
                '<div class="product-name">' + inlineTagHtml + escapeHtml(product.name) + '</div>' +
              '</div>' +
              '<div class="product-price-row">' +
                '<span class="product-current-val">' + formatCurrency(product.price) + '</span>' +
                (hasDiscount ? '<span class="product-original-val">' + formatCurrency(originalPrice) + '</span>' : '') +
                '</div>' +
              '<div class="product-card-footer">' +
                socialProofHtml +
                '<button class="btn-card-cart-pill" type="button" data-cart-id="' + escapeHtml(product.id) + '">' +
                  '<span>Thêm vào giỏ</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      })
      .join("");

    Array.prototype.forEach.call(productGrid.querySelectorAll(".product-card"), function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("[data-cart-id]")) {
          return;
        }
        var prodId = card.getAttribute("data-detail-id");
        if (prodId) openDetail(prodId);
      });
    });

    Array.prototype.forEach.call(productGrid.querySelectorAll("[data-cart-id]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var prodId = btn.getAttribute("data-cart-id");
        addToCart(prodId, { openDrawer: true });
      });
    });
  }

  function renderCart() {
    syncLandingCouponTicket();
    var detailedCart = state.cart
      .map(function (entry) {
        var product = getProductById(entry.productId);
        if (!product) {
          return null;
        }

        return {
          product: product,
          quantity: entry.quantity,
          total: product.price * entry.quantity,
        };
      })
      .filter(Boolean);

    if (cartItems) {
      if (!detailedCart.length) {
        cartItems.innerHTML =
          '<div class="cart-empty-state">' +
            '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="9" cy="21" r="1"></circle>' +
              '<circle cx="20" cy="21" r="1"></circle>' +
              '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>' +
            '</svg>' +
            '<p class="cart-empty-title">Giỏ hàng đang trống</p>' +
            '<p class="cart-empty-desc">Chọn file mẫu phù hợp để thêm vào giỏ nhé.</p>' +
          '</div>';
      } else {
        cartItems.innerHTML = detailedCart
          .map(function (item) {
            var imgUrl = item.product.thumbnailUrl || item.product.previewImageUrl;
            var thumbHtml = imgUrl
              ? '<div class="drawer-item-thumb"><img src="' + escapeHtml(imgUrl) + '" alt="' + escapeHtml(item.product.name) + '" loading="lazy" /></div>'
              : '<div class="drawer-item-thumb drawer-item-thumb-placeholder">' +
                  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>' +
                    '<polyline points="14 2 14 8 20 8"></polyline>' +
                  '</svg>' +
                '</div>';

            var hasOriginal = item.product.originalPrice && item.product.originalPrice > item.product.price;
            var origPriceHtml = hasOriginal
              ? '<span class="drawer-item-original-price">' + formatCurrency(item.product.originalPrice * item.quantity) + '</span>'
              : '';

            return (
              '<div class="drawer-item">' +
                thumbHtml +
                '<div class="drawer-item-info">' +
                  '<span class="drawer-item-title" title="' + escapeHtml(item.product.name) + '">' + escapeHtml(item.product.name) + '</span>' +
                  '<div class="drawer-item-price-row">' +
                    origPriceHtml +
                    '<span class="drawer-item-price">' + formatCurrency(item.total) + '</span>' +
                  '</div>' +
                '</div>' +
                '<button class="drawer-item-remove" type="button" data-remove-id="' + escapeHtml(item.product.id) + '" title="Bỏ khỏi giỏ" aria-label="Bỏ khỏi giỏ">' +
                  '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                    '<polyline points="3 6 5 6 21 6"></polyline>' +
                    '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
                    '<line x1="10" y1="11" x2="10" y2="17"></line>' +
                    '<line x1="14" y1="11" x2="14" y2="17"></line>' +
                  '</svg>' +
                '</button>' +
              '</div>'
            );
          })
          .join("");
      }
    }

    if (cartTotal) cartTotal.textContent = formatCurrency(getCartTotal());
    if (checkoutTotal) checkoutTotal.textContent = formatCurrency(getCartTotal());
    if (cartCount) cartCount.textContent = String(getCartCount());
    var cartCountDetail = document.getElementById("cartCountDetail");
    if (cartCountDetail) cartCountDetail.textContent = String(getCartCount());
    var checkoutSummaryPrice = document.getElementById("checkoutSummaryPrice");
    if (checkoutSummaryPrice) checkoutSummaryPrice.textContent = formatCurrency(getCartTotal());
    renderCheckoutSummary(detailedCart);

    if (cartItems) {
      Array.prototype.forEach.call(cartItems.querySelectorAll("[data-remove-id]"), function (button) {
        button.addEventListener("click", function () {
          removeFromCart(button.getAttribute("data-remove-id"));
        });
      });
    }
  }

  function renderCheckoutSummary(detailedCart) {
    var checkoutHeroTotal = document.getElementById("checkoutHeroTotal");
    var checkoutSubTotal = document.getElementById("checkoutSubTotal");
    var checkoutGrandTotal = document.getElementById("checkoutGrandTotal");
    var total = getCartTotal();

    if (!detailedCart) {
      detailedCart = state.cart.map(function(entry) {
        var p = getProductById(entry.productId);
        return p ? { product: p, quantity: entry.quantity, total: p.price * entry.quantity } : null;
      }).filter(Boolean);
    }

    var grandTotal = getCartTotal(); // Tự động đồng bộ và tính lại discountAmount
    var subtotal = getCartSubtotal();
    var discount = state.discountAmount || 0;

    if (checkoutHeroTotal) checkoutHeroTotal.textContent = formatCurrency(grandTotal);
    if (checkoutSubTotal) checkoutSubTotal.textContent = formatCurrency(subtotal);
    if (checkoutGrandTotal) checkoutGrandTotal.textContent = formatCurrency(grandTotal);

    var discountRow = document.getElementById("checkoutDiscountRow");
    var discountVal = document.getElementById("checkoutDiscountVal");
    var discountLabel = document.getElementById("checkoutDiscountLabel");
    if (discountRow) {
      if (discount > 0 && state.appliedCoupons.length) {
        discountRow.style.display = "flex";
        if (discountVal) discountVal.textContent = "-" + formatCurrency(discount);
        if (discountLabel) discountLabel.textContent = "Giảm giá";
      } else {
        discountRow.style.display = "none";
        if (discountVal) discountVal.textContent = "0 đ";
      }
    }

    if (!checkoutItems) return;
    if (!detailedCart.length) {
      checkoutItems.innerHTML =
        '<div class="empty-state" style="padding: 16px 0; color: #64748b; font-size: 0.9rem;">Chưa có file nào trong đơn hàng.</div>';
      return;
    }

    const giftCoupon = state.appliedCoupons.find(c => c.type === 'gift');
    const gift = giftCoupon && getProductById(giftCoupon.reward_ids[0]);
    if (gift) detailedCart = detailedCart.concat({product:{...gift, name:'Quà tặng · ' + gift.name}, quantity:1, total:0});
    checkoutItems.innerHTML = detailedCart
      .map(function (item) {
        var productImage = item.product.thumbnailUrl || item.product.previewImageUrl || "";
        var productDescription = item.product.subtitle || item.product.shortDescription || item.product.description || "File làm việc sẵn sàng sử dụng";
        return (
          '<div class="checkout-product-row">' +
            '<div class="checkout-product-avatar"' + (productImage ? ' style="background-image:url(&quot;' + escapeHtml(productImage) + '&quot;)"' : '') + '></div>' +
            '<div class="checkout-product-copy">' +
              '<div class="checkout-product-heading-1">' + escapeHtml(item.product.name) + '</div>' +
              '<div class="checkout-product-heading-2">' + escapeHtml(productDescription) + '</div>' +
            '</div>' +
            '<div class="checkout-product-price font-mono">' +
              formatCurrency(item.total) +
            '</div>' +
          '</div>'
        );
      })
      .join("");
  }

  function openDetail(productId) {
    try {
      console.log('Opening detail for product:', productId);
    var product = getProductById(productId);
    if (!product) {
      return;
    }

    state.selectedProductId = productId;
    if (detailTitle) detailTitle.innerHTML = '<h1 class="detail-h1-title">' + escapeHtml(product.name) + '</h1>';

    // Update cart badge in detail topbar if present
    var cartBadgeDetail = document.getElementById("cartCountDetail");
    if (cartBadgeDetail) {
      var totalQty = getCartCount();
      cartBadgeDetail.textContent = totalQty;
    }

    var isAppsScript = product.type === "apps_script" || product.type === "web_app";
    var isGoogleSheet = !isAppsScript && (product.type === "google_sheets" || !!product.sheetUrl);
    var isCombo = product.categoryId === "combo" || product.type === "combo";
    var typeLabel = isAppsScript ? "Web App" : (isCombo ? "Combo" : (isGoogleSheet ? "Google Sheets" : "Excel"));

    var hasDiscount = product.originalPrice && product.originalPrice > product.price;
    var discountPercent = hasDiscount ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

    var ratingInfo = getProductRatingDisplay(product);
    var coverImg = product.previewImageUrl || product.thumbnailUrl || '';

    // BUILD GALLERY IMAGES
    var galleryList = [];
    if (Array.isArray(product.gallery) && product.gallery.length > 0) {
      galleryList = product.gallery.slice();
    } else if (Array.isArray(product.previewImages) && product.previewImages.length > 0) {
      galleryList = product.previewImages.slice();
    } else if (Array.isArray(product.images) && product.images.length > 0) {
      galleryList = product.images.slice();
    } else {
      if (coverImg) galleryList.push(coverImg);
    }
    // Filter out falsy or empty strings
    galleryList = galleryList.filter(function(url) { return typeof url === 'string' && url.trim().length > 0; });
    
    // If product only has 1 image, supply template mock sheets so user can switch between views (Optimate standard)
    if (galleryList.length <= 1) {
      var baseImg = coverImg || galleryList[0];
      var mockScreens = [
        baseImg,
        'https://filedilam.web.app/assets/guide/01_tao_ban_sao.jpg',
        'https://filedilam.web.app/assets/guide/02_menu_mo_ung_dung.jpg',
        'https://filedilam.web.app/assets/guide/06_cho_phep_tiep_tuc.jpg'
      ].filter(Boolean);
      // Remove duplicates if any
      galleryList = mockScreens.filter(function(item, pos) { return mockScreens.indexOf(item) === pos; });
    }

    var hasMultipleImages = galleryList.length > 1;

    // LEFT COLUMN: 1x1 Media & Carousel/Thumbnails
    var initialImage = galleryList[0] || coverImg;
    var thumbsHtml = '';
    if (hasMultipleImages) {
      thumbsHtml = '<div class="detail-thumbnails-row" id="detailThumbnailsRow">' +
        galleryList.map(function(url, idx) {
          return '<button type="button" class="detail-thumb-btn ' + (idx === 0 ? 'active' : '') + '" data-index="' + idx + '" aria-label="Xem ảnh ' + (idx + 1) + '">' +
            '<img src="' + escapeHtml(url) + '" alt="Thumb ' + (idx + 1) + '" loading="lazy" />' +
          '</button>';
        }).join('') +
      '</div>';
    }

    var arrowsHtml = '';
    if (hasMultipleImages) {
      arrowsHtml =
        '<button type="button" class="detail-gallery-nav-btn prev" id="btnGalleryPrev" aria-label="Ảnh trước">' +
          '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>' +
        '</button>' +
        '<button type="button" class="detail-gallery-nav-btn next" id="btnGalleryNext" aria-label="Ảnh kế tiếp">' +
          '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>' +
        '</button>';
    }

    var mediaHtml =
      '<div class="detail-col-media">' +
        '<div class="detail-back-bar-left">          <button type="button" class="btn-detail-back-left" onclick="window.closeDetailModal && window.closeDetailModal();" aria-label="Trở lại">            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">              <line x1="19" y1="12" x2="5" y2="12"></line>              <polyline points="12 19 5 12 12 5"></polyline>            </svg>            <span>Trở lại danh sách file</span>          </button>        </div>' +
        '<div class="detail-media-square">' +
          '<div class="detail-media-badges">' +
            '<span class="detail-media-badge-type">' + typeLabel + '</span>' +
            (hasDiscount ? '<span class="detail-media-badge-discount">-' + discountPercent + '%</span>' : '') +
          '</div>' +
          (initialImage
            ? '<img id="detailMainFeaturedImage" src="' + escapeHtml(initialImage) + '" alt="' + escapeHtml(product.name) + '" />'
            : '<div style="font-size:2.5rem; font-weight:800; color:#059669;">FILE</div>') +
          arrowsHtml +
        '</div>' +
        thumbsHtml +
      '</div>';

    // RIGHT COLUMN: Info, Price, Actions, Full Specs
    var priceFormatted = Number(product.price || 0).toLocaleString('vi-VN') + '<span class="detail-currency">đ</span>';
    var originalPriceHtml = hasDiscount
      ? '<span class="detail-price-original">' + Number(product.originalPrice || 0).toLocaleString('vi-VN') + '<span class="detail-currency-sub">đ</span></span>'
      : '';

    var suitableHtml = (product.suitableFor && String(product.suitableFor).trim() !== '' && product.suitableFor !== 'undefined')
      ? '<div class="detail-spec-card"><div class="detail-spec-title">Phù hợp với</div><div class="detail-spec-val">' + escapeHtml(product.suitableFor) + '</div></div>'
      : '';

    var deliveryHtml = (product.delivery && String(product.delivery).trim() !== '' && product.delivery !== 'undefined')
      ? '<div class="detail-spec-card"><div class="detail-spec-title">Hình thức nhận file</div><div class="detail-spec-val">' + escapeHtml(product.delivery) + '</div></div>'
      : '<div class="detail-spec-card"><div class="detail-spec-title">Hình thức nhận file</div><div class="detail-spec-val">Tự động cấp quyền Drive / Tải file ngay sau khi thanh toán</div></div>';

    var coachingOptionHtml = (product.hasCoaching && product.coachingPrice)
      ? '<div style="display:flex; align-items:center; justify-content:space-between; background:#fffbeb; border:1px solid #fde68a; padding:12px 16px; border-radius:12px;">' +
          '<div style="font-size:0.88rem; color:#92400e; font-weight:600;">' +
            '<span>🎓 ' + escapeHtml(product.coachingTitle || 'Có tùy chọn Kèm 1-1') + '</span>' +
            '<div style="font-size:0.78rem; color:#b45309; font-weight:normal; margin-top:2px;">Kèm riêng 1 buổi ráp số liệu thực tế</div>' +
          '</div>' +
          '<span style="font-weight:700; color:#b45309; font-size:0.95rem; white-space:nowrap;">' + formatCurrency(product.coachingPrice) + '</span>' +
        '</div>'
      : '';

    var highlightsHtml = '';
    if (product.highlights && product.highlights.length) {
      highlightsHtml = '<div style="margin-top: 10px;">' +
        '<div style="font-weight:700; color:#0f172a; margin-bottom:8px; font-size:1rem;">Điểm nổi bật:</div>' +
        '<ul style="margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:8px;">' +
        product.highlights.map(function (item) {
          return '<li style="display:flex; align-items:flex-start; gap:10px; font-size:0.94rem; color:#334155; line-height:1.5;">' +
            '<span style="color:#059669; display:inline-flex; align-items:center; flex-shrink:0; margin-top:2px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>' +
            '<span>' + escapeHtml(item) + '</span>' +
            '</li>';
        }).join('') +
        '</ul></div>';
    }

    var versionsHtml = '';
    if (product.versions && product.versions.length > 0) {
      var vList = product.versions.map(function(v) {
        var dateStr = v.createdAt ? String(v.createdAt).slice(0, 10) : '';
        return '<div style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px dashed #e2e8f0;">' +
                 '<div style="display:flex; justify-content:space-between; margin-bottom:4px;">' +
                   '<strong style="color:var(--mint-strong); font-size:0.9rem;">' + escapeHtml(v.name || 'Phiên bản mới') + '</strong>' +
                   '<span style="color:#64748b; font-size:0.8rem;">' + escapeHtml(dateStr) + '</span>' +
                 '</div>' +
                 '<div style="font-size:0.85rem; color:#475569;">' + escapeHtml(v.description || '') + '</div>' +
               '</div>';
      }).join('');
      versionsHtml = '<div style="background:#f8fafc; padding:14px; border-radius:12px; border:1px solid #e2e8f0; margin-top:10px;">' +
                       '<strong style="display:block; margin-bottom:8px; font-size:0.95rem; color:#0f172a;">Lịch sử cập nhật:</strong>' +
                       vList +
                     '</div>';
    }

    var reviewsHtml = "";

    var formattedDesc = escapeHtml(product.description || '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p style="margin-top:10px;">')
      .replace(/\n/g, '<br/>');

    var infoHtml =
      '<div class="detail-col-info">' +
        '<h1 class="detail-product-title">' + escapeHtml(product.name) + '</h1>' +
        '<div class="detail-rating-row">' +
          '<div class="detail-rating-pill"><span class="star-val">★ ' + ratingInfo.score + '</span><span class="sep">•</span><span class="sales-val">' + ratingInfo.sales + ' lượt mua</span></div>' +
        '</div>' +

        '<div class="detail-price-box">' +
          '<div class="detail-price-numbers">' +
            '<div class="detail-price-row-wrap">' +
              '<span class="detail-price-current">' + priceFormatted + '</span>' +
              originalPriceHtml +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="detail-cta-row">' +
          '<button class="detail-btn-cart" id="detailAddToCart" type="button">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>' +
            '<span>Thêm vào giỏ</span>' +
          '</button>' +
          '<button class="detail-btn-buy" id="detailBuyNow" type="button">Mua ngay</button>' +
        '</div>' +

        '<div class="detail-zalo-hint">' +
          '<span>Cần tư vấn thêm? Nhắn Zalo:</span>' +
          '<a href="https://zalo.me/0938134576" target="_blank" rel="noopener">0938 134 576</a>' +
        '</div>' +

        coachingOptionHtml +

        '<div class="detail-desc-content">' +
          '<p style="margin:0;">' + formattedDesc + '</p>' +
        '</div>' +

        '<div class="detail-spec-grid">' +
          suitableHtml +
          deliveryHtml +
        '</div>' +

        (product.usageGuide ? '<div style="background:#f1f5f9; padding:12px 16px; border-radius:10px; font-size:0.92rem; color:#334155;"><strong>Cách dùng nhanh:</strong> ' + escapeHtml(product.usageGuide) + '</div>' : '') +
        formatProductRichContent(product.featuresDetail, product.highlights) +
        (product.sheets && product.sheets.length ? '<div style="font-size:0.92rem; color:#475569;"><strong>Bao gồm các Sheet:</strong> ' + escapeHtml(product.sheets.join(', ')) + '</div>' : '') +
        versionsHtml +
        reviewsHtml +
      '</div>';

    // RELATED PRODUCTS BUILDER (Optimate style)
    var otherProducts = (data.products || []).filter(function(p) { return p.id !== product.id; });
    var relatedItems = otherProducts.slice(0, 4);
    var relatedHtml = '';
    if (relatedItems.length > 0) {
      relatedHtml =
        '<div class="detail-related-section">' +
          '<h3 class="detail-related-title">Các file template liên quan khác</h3>' +
          '<div class="detail-related-grid">' +
            relatedItems.map(function(item) {
              var itemImg = item.thumbnailUrl || item.previewImageUrl || '';
              var itemRating = getProductRatingDisplay(item);
              return (
                '<div class="product-card" data-product-id="' + escapeHtml(item.id) + '">' +
                  '<div class="product-thumb" style="aspect-ratio:1/1; background-image:url(&quot;' + escapeHtml(itemImg) + '&quot;); background-size:cover; background-position:center; border-radius:12px; border:1px solid #e2e8f0; position:relative;">' +
                    '<span class="product-type-badge">' + (item.type === 'google_sheets' ? 'Sheets' : 'Web App') + '</span>' +
                  '</div>' +
                  '<div class="product-info" style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">' +
                    '<h4 class="product-name" style="font-size:0.95rem; font-weight:600; color:#0f172a; margin:0; line-height:1.3; min-height:2.6em; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">' + escapeHtml(item.name) + '</h4>' +
                    '<div style="display:flex; align-items:baseline; gap:8px;">' +
                      '<span style="font-size:1.05rem; font-weight:700; color:#059669; font-family:var(--font-mono);">' + formatCurrency(item.price) + '</span>' +
                      (item.originalPrice ? '<span style="font-size:0.8rem; color:#94a3b8; text-decoration:line-through;">' + formatCurrency(item.originalPrice) + '</span>' : '') +
                    '</div>' +
                    '<div style="display:flex; align-items:center; justify-content:space-between; margin-top:6px;">' +
                      '<span style="font-size:0.8rem; color:#d97706; font-weight:600;">⭐ ' + itemRating.score + ' (' + itemRating.sales + ')</span>' +
                      '<button type="button" class="btn-item-quick-add" data-id="' + escapeHtml(item.id) + '" style="padding:6px 14px; border-radius:9999px; background:#0f172a; color:#fff; font-size:0.8rem; font-weight:600; border:none; cursor:pointer;">Thêm vào giỏ</button>' +
                    '</div>' +
                  '</div>' +
                '</div>'
              );
            }).join('') +
          '</div>' +
        '</div>';
    }

    // FOOTER INSIDE DETAIL FULLPAGE
    var detailFooterHtml =
      '<footer class="detail-page-footer">' +
        '<div style="max-width:1280px; margin:0 auto; display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:32px;">' +
          '<div>' +
            '<div style="font-size:1.25rem; font-weight:700; color:#0f172a; margin-bottom:12px;">File Đi Làm</div>' +
            '<p style="font-size:0.88rem; color:#64748b; line-height:1.6;">Giải pháp Google Sheets & Web App tự động hoá quy trình làm việc cho cá nhân và doanh nghiệp.</p>' +
          '</div>' +
          '<div>' +
            '<h4 style="font-size:0.95rem; font-weight:700; color:#0f172a; margin-bottom:12px;">Liên hệ hỗ trợ</h4>' +
            '<p style="font-size:0.88rem; color:#64748b; line-height:1.6; margin-bottom:6px;">Hotline/Zalo: <strong style="color:#0f172a;">0938 134 576</strong></p>' +
            '<p style="font-size:0.88rem; color:#64748b; line-height:1.6;">Email: hotro@nourishgroup.vn</p>' +
          '</div>' +
          '<div>' +
            '<h4 style="font-size:0.95rem; font-weight:700; color:#0f172a; margin-bottom:12px;">Chính sách</h4>' +
            '<div style="display:flex; flex-direction:column; gap:8px; font-size:0.88rem; color:#64748b;">' +
              '<a href="/chinh-sach.html#dieu-khoan-su-dung" style="color:#64748b; text-decoration:none;">Điều khoản sử dụng</a>' +
              '<a href="/chinh-sach.html#bao-mat-thong-tin" style="color:#64748b; text-decoration:none;">Bảo mật thông tin</a>' +
              '<a href="/chinh-sach.html#giao-hang" style="color:#64748b; text-decoration:none;">Chính sách giao hàng</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="max-width:1280px; margin:32px auto 0; padding-top:20px; border-top:1px solid #f1f5f9; text-align:center; font-size:0.82rem; color:#94a3b8;">' +
          '© 2026 File Đi Làm. All rights reserved.' +
        '</div>' +
      '</footer>';

    // Mount into detailBody as 2-column layout + Related + Footer
    detailBody.innerHTML =
      '<div class="detail-fullpage-layout">' +
        mediaHtml +
        infoHtml +
      '</div>' +
      relatedHtml +
      detailFooterHtml;

    if (detailFooter) {
      detailFooter.style.display = 'none';
    }

    detailBody.scrollTop = 0;

    // Attach gallery switcher handlers
    if (hasMultipleImages) {
      var currentGalleryIdx = 0;
      var mainImgEl = document.getElementById("detailMainFeaturedImage");
      var thumbBtns = detailBody.querySelectorAll(".detail-thumb-btn");

      var switchGalleryImage = function(index) {
        if (index < 0) index = galleryList.length - 1;
        if (index >= galleryList.length) index = 0;
        currentGalleryIdx = index;
        if (mainImgEl) {
          mainImgEl.style.opacity = '0.3';
          mainImgEl.src = galleryList[index];
          setTimeout(function() {
            mainImgEl.style.opacity = '1';
          }, 60);
        }
        Array.prototype.forEach.call(thumbBtns, function(btn, i) {
          if (i === index) {
            btn.classList.add("active");
            btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          } else {
            btn.classList.remove("active");
          }
        });
      };

      Array.prototype.forEach.call(thumbBtns, function(btn) {
        btn.addEventListener("click", function() {
          var idx = parseInt(btn.getAttribute("data-index"), 10);
          if (!isNaN(idx)) {
            switchGalleryImage(idx);
          }
        });
      });

      var btnPrev = document.getElementById("btnGalleryPrev");
      if (btnPrev) {
        btnPrev.addEventListener("click", function(e) {
          e.stopPropagation();
          switchGalleryImage(currentGalleryIdx - 1);
        });
      }

      var btnNext = document.getElementById("btnGalleryNext");
      if (btnNext) {
        btnNext.addEventListener("click", function(e) {
          e.stopPropagation();
          switchGalleryImage(currentGalleryIdx + 1);
        });
      }
    }

    // Attach button handlers inside detail
    var btnDetailAdd = document.getElementById("detailAddToCart");
    if (btnDetailAdd) {
      btnDetailAdd.addEventListener("click", function () {
        addToCart(product.id, { openDrawer: true });
        // Update detail cart count
        var cB = document.getElementById("cartCountDetail");
        if (cB) cB.textContent = getCartCount();
      });
    }

    var btnDetailBuy = document.getElementById("detailBuyNow");
    if (btnDetailBuy) {
      btnDetailBuy.addEventListener("click", function () {
        closeDetail();
        buyNow(product.id);
      });
    }

    // Attach related product clicks
    Array.prototype.forEach.call(detailBody.querySelectorAll(".btn-item-quick-add"), function(btn) {
      btn.addEventListener("click", function(e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-id");
        if (id) {
          addToCart(id, { openDrawer: true });
          var cB = document.getElementById("cartCountDetail");
          if (cB) cB.textContent = getCartCount();
        }
      });
    });

    Array.prototype.forEach.call(detailBody.querySelectorAll(".detail-related-grid .product-card"), function(card) {
      card.addEventListener("click", function() {
        var id = card.getAttribute("data-product-id");
        if (id) {
          openDetail(id);
        }
      });
    });

    detailModal.style.setProperty("top", "0px", "important");
    detailModal.style.setProperty("z-index", "99999", "important");
    detailModal.classList.add("is-open");
    detailModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
    } catch (err) {
      console.error('Error opening detail modal:', err);
      showToast('Không thể mở chi tiết sản phẩm. Vui lòng thử lại.');
    }
  }

  function renderProductThumb(product) {
    var isAppsScript = product.type === "apps_script" || product.type === "web_app";
    var isGoogleSheet = !isAppsScript && (product.type === "google_sheets" || !!product.sheetUrl);
    var isCombo = product.categoryId === "combo" || product.type === "combo";
    var typeLabel = isAppsScript ? "Web App" : (isCombo ? "Combo" : (isGoogleSheet ? "Google Sheets" : "Excel"));
    var typeClass = isAppsScript ? " is-apps-script" : (isCombo ? " is-combo" : (isGoogleSheet ? " is-google-sheets" : " is-excel"));
    
    var hasDiscount = product.originalPrice && product.originalPrice > product.price;
    var discountPercent = hasDiscount ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
    var discountBadgeHtml = hasDiscount
      ? '<span class="product-thumb-discount-tag">-' + discountPercent + '%</span>'
      : '';

    var cardImg = product.thumbnailUrl || product.previewImageUrl;
    if (cardImg) {
      return (
        '<div class="product-thumb" style="background-image:url(&quot;' + escapeHtml(cardImg) + '&quot;);">' +
          '<span class="product-type-badge' + typeClass + '">' + typeLabel + '</span>' +
          discountBadgeHtml +
        '</div>'
      );
    }
    return (
      '<div class="product-thumb is-placeholder">' +
        '<span class="thumb-placeholder-text">FILE</span>' +
        '<span class="product-type-badge' + typeClass + '">' + typeLabel + '</span>' +
        discountBadgeHtml +
      '</div>'
    );
  }

  function renderDetailThumb(product) {
    var coverImg = product.previewImageUrl || product.thumbnailUrl;
    if (coverImg) {
      return (
        '<div class="detail-thumb-container" style="background:#0f172a; border-radius:12px; overflow:hidden; border:1px solid var(--line); display:flex; align-items:center; justify-content:center; max-height:380px; width:100%; aspect-ratio:16/9;">' +
        '<img src="' + escapeHtml(coverImg) + '" alt="' + escapeHtml(product.name) + '" style="width:100%; height:100%; object-fit:contain; display:block;" />' +
        '</div>'
      );
    }
    return '<div class="detail-thumb" style="background: #f0fdf4; min-height: 200px; border-radius: var(--radius-sm); display:flex; align-items:center; justify-content:center; font-size:2rem; color:var(--mint-strong); font-weight:bold;">FILE</div>';
  }

  window.closeDetailModal = closeDetail;
  function closeDetail() {
    detailModal.classList.remove("is-open");
    detailModal.setAttribute("aria-hidden", "true");
    if (detailFooter) {
      detailFooter.innerHTML = "";
    }
    unlockBodyIfNeeded();
  }

  function openCart() {
    renderCart();
    cartDrawer.classList.add("is-open");
    cartDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
    document.body.classList.add("cart-drawer-open");
  }

  function closeCart() {
    cartDrawer.classList.remove("is-open");
    cartDrawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cart-drawer-open");
    unlockBodyIfNeeded();
  }

  function toggleQuickMode(e) {
    if (e) e.preventDefault();
    isQuickLoginMode = !isQuickLoginMode;
    updateQuickUI();
  }

  function updateQuickUI() {
    if (!quickBuyForm) return;

    if (checkoutModalTitle) checkoutModalTitle.textContent = "Thông tin thanh toán";
    if (quickNameGroup) quickNameGroup.style.display = "block";
    if (quickPhoneLabel) {
      quickPhoneLabel.innerHTML = 'Số điện thoại / Zalo <span class="req">*</span>';
    }
    if (quickPhone) quickPhone.placeholder = "Ví dụ: 0912345678";
    if (quickEmailGroup) quickEmailGroup.style.display = "block";
    if (quickPassGroup) quickPassGroup.style.display = "none";
    if (btnQuickSubmitText) btnQuickSubmitText.textContent = "Xác nhận thông tin & tạo đơn";
  }

  function handleBackToInfo() {
    if (checkoutAuthStep) checkoutAuthStep.style.display = "block";
    if (checkoutPaymentStep) checkoutPaymentStep.style.display = "none";
    if (checkoutModalTitle) checkoutModalTitle.textContent = "Thông tin thanh toán";
    if (checkoutBackBtn) checkoutBackBtn.style.display = "none";
    if (quickNameGroup) quickNameGroup.style.display = "block";
    if (quickEmailGroup) quickEmailGroup.style.display = "block";
    if (quickPassGroup) quickPassGroup.style.display = "none";
  }

  function handleOrderSuccess(data) {
    stopQrCountdown();
    try {
      localStorage.removeItem("filedilam_pending_order_id");
      localStorage.removeItem("filedilam_active_order");
    } catch (e) {}
    currentActiveOrderId = null;
    userClosedCheckout = false;
    updateFloatingOrderBar();
    state.cart = [];
    persistCart();
    renderCart();
    if (window.location.hash === "#thanh-toan") {
      window.history.replaceState({}, "", window.location.pathname + window.location.search);
    }
    closeCheckout();
    if (quickBuyForm) quickBuyForm.reset();
    
    var orderSuccessItems = resolveOrderItems(data);
    var isMultipleFiles = orderSuccessItems.length > 1;

    var actionButtonsHtml = orderSuccessItems.map(function(item) {
      var isCloud = item.is_cloud;
      var btnText = isCloud ? 'Tạo bản sao Google Sheets' : 'Tải file Excel';
      var isSmartKho = (item.product_id === "quan-ly-kho-mini-google-sheets-smart");
      var itemSetup = '';
      if (isCloud && isSmartKho) {
        itemSetup = '<div style="text-align:left;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:12px;margin:10px 0;color:#065f46;font-size:.85rem;line-height:1.5"><b>Mở Web App rất nhanh:</b><br>1. Tạo bản sao và mở file trong Google Drive.<br>2. Tải lại trang một lần để thấy menu <b>📦 Kho Mini Smart</b>.<br>3. Chọn <b>Mở ứng dụng quản lý kho</b> và cấp quyền Google lần đầu.</div>';
      }
      return '<div style="background: ' + (isMultipleFiles ? '#f8fafc' : 'transparent') + '; padding: ' + (isMultipleFiles ? '14px' : '0') + '; border-radius: 12px; border: ' + (isMultipleFiles ? '1px solid #e2e8f0' : 'none') + '; margin-bottom: 12px; text-align: left;">' +
               (isMultipleFiles ? '<div style="font-weight: 700; font-size: 0.95rem; color: #1e293b; margin-bottom: 8px;">' + escapeHtml(item.product_name) + '</div>' : '') +
               '<a href="' + escapeHtml(item.delivery_url) + '" target="_blank" rel="noopener noreferrer" class="button-primary button-full" style="height: 48px; font-size: 1rem; text-decoration: none; display:flex; align-items:center; justify-content:center; border-radius: 8px;">' + btnText + (isMultipleFiles ? ' (' + escapeHtml(item.product_name) + ')' : '') + '</a>' +
               itemSetup +
             '</div>';
    }).join("");

    var descText = isMultipleFiles
      ? "Đơn hàng của bạn gồm " + orderSuccessItems.length + " file đã được kích hoạt. Hãy bấm vào từng nút bên dưới để tạo bản sao vào Google Drive cá nhân của bạn:"
      : (orderSuccessItems[0] && orderSuccessItems[0].is_cloud
          ? "Bấm nút bên dưới, đăng nhập Google rồi chọn Tạo bản sao. File sẽ được lưu trong Drive của bạn."
          : "Đơn hàng đã được xác nhận. Bạn có thể tải file ngay hoặc mở lại trong File của tôi.");

    var isCoaching = (data.package_type === "coaching") || (data.amount && data.amount >= 199000) || (state.selectedPackage === "coaching");
    var coachingCardHtml = "";
    if (isCoaching) {
      var supportPhone = (window.StorefrontData && window.StorefrontData.store && window.StorefrontData.store.supportZaloPhone) || "0938134576";
      var cleanPhone = supportPhone.replace(/\s+/g, "");
      var zaloLink = "https://zalo.me/" + cleanPhone;
      var orderCode = data.order_id || currentActiveOrderId || "";

      coachingCardHtml =
        '<div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #f59e0b; border-radius: 14px; padding: 16px 18px; margin: 18px 0; text-align: left; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.15);">' +
          '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">' +
            '<span style="font-size: 1.35rem;">🎓</span>' +
            '<strong style="color: #92400e; font-size: 1rem;">Gói Kèm 1-1 (1 buổi 1 tiếng)</strong>' +
          '</div>' +
          '<p style="color: #78350f; font-size: 0.84rem; line-height: 1.5; margin: 0 0 12px 0;">' +
            'Chúc mừng bạn đã đăng ký gói kèm thực chiến! Bạn hãy bấm nút bên dưới để nhắn tin Zalo cho Kỹ thuật viên đặt lịch hỗ trợ qua UltraViewer / Meet ngay nhé.' +
          '</p>' +
          '<a href="' + zaloLink + '" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 46px; background: #0068ff; color: #fff; font-weight: 700; font-size: 0.95rem; border-radius: 10px; text-decoration: none; box-shadow: 0 3px 8px rgba(0, 104, 255, 0.25); transition: all 0.2s ease;">' +
            '<svg width="22" height="22" viewBox="0 0 48 48" fill="none"><path d="M24 4C12.95 4 4 12.95 4 24C4 28.34 5.38 32.36 7.74 35.63L5.05 43.14C4.85 43.7 5.3 44.25 5.86 44.05L13.37 41.36C16.64 43.72 20.66 45.1 25 45.1C36.05 45.1 45 36.15 45 25.1C45 14.05 36.05 4 24 4Z" fill="#fff"/></svg>' +
            '<span>Hẹn Lịch Kèm 1-1 Qua Zalo (' + supportPhone + ')</span>' +
          '</a>' +
          (orderCode ? '<div style="text-align: center; margin-top: 8px; font-size: 0.78rem; color: #92400e;">(Mã đơn của bạn: <b>#' + escapeHtml(orderCode) + '</b>)</div>' : '') +
        '</div>';
    }
    
    detailBody.innerHTML =
      '<div class="checkout-delivery">' +
      '<div class="checkout-delivery-progress">Đơn hàng đã hoàn tất <span>1 Đơn hàng · 2 Thanh toán · <strong>3 Nhận file</strong></span></div>' +
      '<p class="checkout-delivery-status">Đã thanh toán' + (data.amount ? ' ' + formatCurrency(data.amount) : '') + '</p>' +
      '<h3>File của bạn đã sẵn sàng</h3>' +
      '<p class="checkout-delivery-description">' + descText + '</p>' +
      coachingCardHtml +
      actionButtonsHtml +
      '<button type="button" class="button-secondary button-full" id="btnSuccessViewPurchases" style="height: 44px; margin-top: 12px; font-size: 0.95rem;">Mở danh sách File của tôi</button>' +
      "</div>";
    
    var btnVP = document.getElementById("btnSuccessViewPurchases");
    if (btnVP) {
      btnVP.addEventListener("click", function() {
        closeDetail();
        openPurchases();
      });
    }

    if (detailTitle) detailTitle.textContent = "Nhận File Của Bạn";
    if (detailFooter) detailFooter.innerHTML = "";
    detailModal.classList.add("is-open");
    detailModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
    showToast("Đã thanh toán thành công!");
    var confirmBtn = document.getElementById("confirmPayment");
    if (confirmBtn) {
      confirmBtn.textContent = "Kiểm tra thanh toán";
      confirmBtn.disabled = false;
    }
  }

  var qrCountdownTimer = null;
  var userClosedCheckout = false;

  function startQrCountdown(startTime) {
    if (qrCountdownTimer) {
      clearInterval(qrCountdownTimer);
      qrCountdownTimer = null;
    }
    var container = document.getElementById("qrCountdownContainer");
    if (container) {
      container.classList.remove("is-expired", "is-ending");
      container.style.background = "#fef2f2";
      container.style.color = "#b91c1c";
      container.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>Mã có hiệu lực trong: <strong id="qrTimerDisplay" style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:0.95rem;color:#dc2626;">10:00</strong></span>';
    }
    var timerDisplay = document.getElementById("qrTimerDisplay");
    var floatingTimer = document.getElementById("floatingOrderTimer");

    var totalDuration = 10 * 60 * 1000; // 10 phút hiệu lực
    var orderStart = startTime || Date.now();

    function tick() {
      var elapsed = Date.now() - orderStart;
      var remainingMs = Math.max(0, totalDuration - elapsed);

      if (remainingMs <= 0) {
        qrRenderToken++;
        if (container) container.classList.add("is-expired");
        currentQrImageUrl = "";
        clearInterval(qrCountdownTimer);
        qrCountdownTimer = null;
        if (timerDisplay) timerDisplay.textContent = "00:00";
        if (floatingTimer) floatingTimer.textContent = "00:00";
        if (container) {
          container.style.background = "#fff1f2";
          container.style.color = "#991b1b";
          container.innerHTML = '<span style="font-size:0.85rem;">Mã thanh toán đã hết hạn 10 phút.</span>';
        }
        if (qrBox) {
          qrBox.innerHTML = 
            '<div class="empty-state" style="padding:28px 16px; background:#f8fafc; border-radius:12px; border:1.5px dashed #cbd5e1;">' +
              '<div style="font-weight:700; color:#991b1b; font-size:0.95rem; margin-bottom:4px;">Mã thanh toán đã hết hạn</div>' +
              '<div style="font-size:0.8rem; color:#64748b; margin-bottom:14px;">Để đảm bảo an toàn giao dịch, vui lòng tạo mã mới.</div>' +
              '<button type="button" class="button-primary" id="btnRefreshExpiredQr" style="padding:8px 20px; font-size:0.88rem; margin:0 auto;">Tạo mã QR mới</button>' +
            '</div>';
          var refBtn = document.getElementById("btnRefreshExpiredQr");
          if (refBtn) {
            refBtn.addEventListener("click", function() {
              try {
                localStorage.removeItem("filedilam_active_order");
                localStorage.removeItem("filedilam_pending_order_id");
              } catch (e) {}
              createOrderAndRenderQr({
                customer_phone: getResolvedPhone(),
                customer_email: state.user ? state.user.email : ""
              });
            });
          }
        }
        try {
          localStorage.removeItem("filedilam_active_order");
          localStorage.removeItem("filedilam_pending_order_id");
        } catch (e) {}
        updateFloatingOrderBar();
        return;
      }

      // Đếm từ 09:59 ngay khi bắt đầu (hoặc số giây thực tế còn lại)
      var remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      if (container) container.classList.toggle("is-ending", remainingSec <= 60);
      var mins = Math.floor(remainingSec / 60);
      var secs = remainingSec % 60;
      var pad = function(n) { return String(n).padStart(2, "0"); };
      var timeStr = pad(mins) + ":" + pad(secs);
      if (timerDisplay) timerDisplay.textContent = timeStr;
      if (floatingTimer) floatingTimer.textContent = timeStr;
    }

    tick();
    qrCountdownTimer = setInterval(tick, 1000);
  }

  function stopQrCountdown() {
    if (qrCountdownTimer) {
      clearInterval(qrCountdownTimer);
      qrCountdownTimer = null;
    }
  }

  function updateFloatingOrderBar() {
    var bar = document.getElementById("floatingOrderBar");
    var floatingOrderId = document.getElementById("floatingOrderId");
    if (!bar) return;

    var raw = null;
    try {
      raw = localStorage.getItem("filedilam_active_order");
    } catch (e) {}

    if (!raw) {
      bar.style.display = "none";
      return;
    }

    var activeOrder = null;
    try {
      activeOrder = JSON.parse(raw);
    } catch (e) {}

    if (!activeOrder || !activeOrder.order_id || (Date.now() - (activeOrder.time || 0) >= 600000)) {
      bar.style.display = "none";
      return;
    }

    if (checkoutModal && checkoutModal.classList.contains("is-open")) {
      bar.style.display = "none";
      return;
    }

    if (detailModal && detailModal.classList.contains("is-open")) {
      bar.style.display = "none";
      return;
    }

    if (floatingOrderId) floatingOrderId.textContent = "#" + activeOrder.order_id;
    bar.style.display = "flex";
  }

  function restoreActiveOrderModal(options) {
    options = options || {};
    var force = options.force === true;

    if (!force && userClosedCheckout) {
      updateFloatingOrderBar();
      return false;
    }

    var raw = null;
    try {
      raw = localStorage.getItem("filedilam_active_order");
    } catch (e) {}
    if (!raw) {
      updateFloatingOrderBar();
      return false;
    }

    var activeOrder = null;
    try {
      activeOrder = JSON.parse(raw);
    } catch (e) {
      return false;
    }

    if (!activeOrder || !activeOrder.order_id) {
      updateFloatingOrderBar();
      return false;
    }

    var orderAge = Date.now() - (activeOrder.time || 0);
    if (orderAge >= 600000) {
      try {
        localStorage.removeItem("filedilam_active_order");
        localStorage.removeItem("filedilam_pending_order_id");
      } catch (e) {}
      updateFloatingOrderBar();
      return false;
    }

    if (detailModal && detailModal.classList.contains("is-open")) return false;

    userClosedCheckout = false;
    currentActiveOrderId = activeOrder.order_id;

    var bankAccount = (window.StorefrontData && window.StorefrontData.store && window.StorefrontData.store.bankAccount) || {};
    var bankShortName = bankAccount.bankShortName || bankAccount.bankName || "TPBank";
    var accNo = bankAccount.number || "59215112002";
    var owner = bankAccount.owner || "HUYNH KIEN CAM";

    if (bankName) bankName.textContent = bankShortName;
    if (bankOwner) bankOwner.textContent = owner;
    if (bankNumber) bankNumber.textContent = accNo;
    var bankAmountEl = document.getElementById("bankAmount");
    if (bankAmountEl) bankAmountEl.textContent = formatCurrency(activeOrder.amount);
    if (bankTransferNote) bankTransferNote.textContent = activeOrder.transfer_note || activeOrder.order_id;

    renderOrderQr(activeOrder, accNo, owner);

    resetQrActions();
    startQrCountdown(activeOrder.time);

    // Mở và treo màn hình thanh toán
    if (checkoutAuthStep) checkoutAuthStep.style.display = "grid";
    if (checkoutModalTitle) checkoutModalTitle.textContent = "Quét mã QR thanh toán";
    if (checkoutBackBtn) checkoutBackBtn.style.display = "inline-flex";

    if (checkoutModal) {
      checkoutModal.classList.add("is-open");
      checkoutModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("drawer-open");
    }

    updateFloatingOrderBar();
    pollOrderStatus(activeOrder.order_id);
    checkActiveOrderOnResume();
    return true;
  }

  function checkActiveOrderOnResume() {
    var pendingOrderId = currentActiveOrderId;
    if (!pendingOrderId) {
      try {
        pendingOrderId = localStorage.getItem("filedilam_pending_order_id");
        if (!pendingOrderId) {
          var raw = localStorage.getItem("filedilam_active_order");
          if (raw) {
            var parsed = JSON.parse(raw);
            if (parsed && parsed.order_id) pendingOrderId = parsed.order_id;
          }
        }
      } catch (e) {}
    }
    if (!pendingOrderId) return;
    if (detailModal && detailModal.classList.contains("is-open")) return;

    authFetch("/orders/" + pendingOrderId)
      .then(function(data) {
        if (data && data.status === "PAID") {
          handleOrderSuccess(data);
        }
      })
      .catch(function() {});
  }

  function handleConfirmPaymentClicked() {
    var btn = document.getElementById("confirmPayment");
    var checkOrderId = currentActiveOrderId;
    if (!checkOrderId) {
      try {
        checkOrderId = localStorage.getItem("filedilam_pending_order_id");
        if (!checkOrderId) {
          var raw = localStorage.getItem("filedilam_active_order");
          if (raw) {
            var parsed = JSON.parse(raw);
            if (parsed && parsed.order_id) checkOrderId = parsed.order_id;
          }
        }
      } catch (e) {}
    }
    if (!checkOrderId) {
      showToast("Chưa có đơn hàng nào đang chờ thanh toán.");
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Đang kiểm tra...";
    }

    authFetch("/orders/" + checkOrderId)
      .then(function(data) {
        if (data && data.status === "PAID") {
          handleOrderSuccess(data);
        } else {
          showToast("Chưa nhận được giao dịch. Hệ thống đang tự động kiểm tra, vui lòng đợi giây lát.");
        }
      })
      .catch(function(err) {
        showToast("Hệ thống đang kiểm tra tự động, vui lòng đợi trong giây lát...");
      })
      .finally(function() {
        if (btn) {
          setTimeout(function() {
            btn.disabled = false;
            btn.textContent = "Kiểm tra thanh toán";
          }, 1200);
        }
      });
  }

  function handleQuickBuySubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    var fullName = quickName ? quickName.value.trim() : "";
    if (!fullName) {
      showToast("Vui lòng nhập họ và tên của bạn.");
      if (quickName) quickName.focus();
      return;
    }

    var phoneInput = quickPhone ? quickPhone.value.trim() : "";
    var phone = normalizePhone(phoneInput);
    if (!isValidPhone(phone)) {
      showToast("Vui lòng nhập đúng số điện thoại/Zalo (9–11 số).");
      if (quickPhone) quickPhone.focus();
      return;
    }

    var emailInput = quickEmail ? quickEmail.value.trim().toLowerCase() : "";
    if (!emailInput || !emailInput.includes("@") || !emailInput.includes(".")) {
      showToast("Vui lòng nhập đúng địa chỉ Gmail (ví dụ: yourname@gmail.com).");
      if (quickEmail) quickEmail.focus();
      return;
    }
    if (!isValidEmail(emailInput)) {
      showToast("Địa chỉ email chưa chính xác. Vui lòng kiểm tra lại phần trước và sau @.");
      if (quickEmail) quickEmail.focus();
      return;
    }

    if (typeof firebase === 'undefined' || !firebase.auth) {
      showToast("Hệ thống đang tải dữ liệu. Vui lòng thử lại sau giây lát.");
      return;
    }

    var auth = firebase.auth();
    if (btnQuickSubmit) {
      btnQuickSubmit.disabled = true;
      if (btnQuickSubmitText) btnQuickSubmitText.textContent = "Đang xử lý...";
    }

    // Safety timeout: Never keep the button stuck disabled on Safari if network/auth hangs
    var submitSafetyTimer = setTimeout(function() {
      if (btnQuickSubmit && btnQuickSubmit.disabled) {
        btnQuickSubmit.disabled = false;
        if (btnQuickSubmitText) btnQuickSubmitText.textContent = "Xác nhận thông tin & tạo đơn";
      }
    }, 8000);

    var customerEmail = emailInput;
    var authEmail = phone + "@khachhang.filedilam.vn";
    var autoPassword = "FDL@" + phone + "#2026";

    showToast("Đang tạo thông tin đơn hàng...");

    var orderFinalized = false;
    function finalizeOrder(user) {
      if (orderFinalized) return;
      orderFinalized = true;
      clearTimeout(submitSafetyTimer);
      state.user = user;
      state.profile = { full_name: fullName, email: customerEmail, phone: phone, user_id: user.uid };
      saveProfile({ full_name: fullName, email: customerEmail, phone: phone, auth_provider: "quick_checkout" });
      createOrderAndRenderQr({
        customer_name: fullName,
        customer_phone: phone,
        customer_email: customerEmail
      });
      if (btnQuickSubmit) {
        btnQuickSubmit.disabled = false;
        if (btnQuickSubmitText) btnQuickSubmitText.textContent = "Xác nhận thông tin & tạo đơn";
      }
    }

    if (state.user) {
      finalizeOrder(state.user);
      return;
    }

    auth.createUserWithEmailAndPassword(authEmail, autoPassword)
      .then(function(result) {
        finalizeOrder(result.user);
      })
      .catch(function(error) {
        var code = error && error.code ? String(error.code) : "";
        if (code.indexOf("email-already-in-use") !== -1) {
          auth.signInWithEmailAndPassword(authEmail, autoPassword)
            .then(function(result) {
              finalizeOrder(result.user);
            })
            .catch(function(signInErr) {
              console.warn("Auto-login failed, falling back to anonymous auth:", signInErr);
              if (auth.signInAnonymously) {
                auth.signInAnonymously().then(function(result) {
                  finalizeOrder(result.user);
                }).catch(function(anonErr) {
                  console.error("Anonymous auth failed:", anonErr);
                  showToast("Vui lòng thử lại sau giây lát: " + (anonErr.message || ""));
                  if (btnQuickSubmit) btnQuickSubmit.disabled = false;
                });
              } else {
                showToast("Vui lòng thử lại sau giây lát.");
                if (btnQuickSubmit) btnQuickSubmit.disabled = false;
              }
            });
        } else {
          console.warn("createUser failed, falling back to anonymous auth:", error);
          if (auth.signInAnonymously) {
            auth.signInAnonymously().then(function(result) {
              finalizeOrder(result.user);
            }).catch(function(anonErr) {
              console.error("Anonymous auth failed:", anonErr);
              showToast(authErrorMessage(error, "register"));
              if (btnQuickSubmit) btnQuickSubmit.disabled = false;
            });
          } else {
            showToast(authErrorMessage(error, "register"));
            clearTimeout(submitSafetyTimer);
            if (btnQuickSubmit) {
              btnQuickSubmit.disabled = false;
              if (btnQuickSubmitText) btnQuickSubmitText.textContent = "Xác nhận thông tin & tạo đơn";
            }
          }
        }
      }).catch(function(unexpectedErr) {
        clearTimeout(submitSafetyTimer);
        if (btnQuickSubmit) {
          btnQuickSubmit.disabled = false;
          if (btnQuickSubmitText) btnQuickSubmitText.textContent = "Xác nhận thông tin & tạo đơn";
        }
      });
  }

  function signInWithGoogleCheckout() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      firebase.auth().signInWithPopup(provider)
        .then(function(result) {
          state.user = result.user;
          return loadProfile();
        })
        .then(function(profile) {
          if (profile && isValidPhone(profile.phone)) {
            createOrderAndRenderQr({ customer_phone: profile.phone, customer_email: state.user.email });
          } else {
            // Điền sẵn email Google, ẩn mật khẩu, yêu cầu điền SĐT
            if (quickEmail) {
              quickEmail.value = state.user.email || "";
              quickEmail.readOnly = true;
            }
            if (quickPassGroup) quickPassGroup.style.display = "none";
            if (quickPhoneLabel) {
              quickPhoneLabel.innerHTML = '<span>Số điện thoại / Zalo nhận file <strong style="color:#ef4444;">*</strong></span>';
            }
            if (btnQuickSubmitText) {
              btnQuickSubmitText.textContent = "Xác nhận SĐT & Nhận mã QR";
            }
            if (quickPhone) quickPhone.focus();
            showToast("Đã liên kết Google. Vui lòng nhập SĐT/Zalo để nhận file.");
          }
        })
        .catch(function(error) {
          console.error("Google Checkout signIn error:", error);
          if (error.code === 'auth/popup-blocked') {
            showToast("Trình duyệt đang chặn cửa sổ đăng nhập. Vui lòng cho phép popup.");
          } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
            // Người dùng chủ động đóng popup
          } else if (error.code === 'auth/unauthorized-domain') {
            showToast("Tên miền chưa được cấp phép trong Firebase Auth (Authorized domains).");
          } else {
            showToast("Đăng nhập Google thất bại: " + (error.message || error.code));
          }
        });
    } else {
      showToast("Đang tải dữ liệu. Vui lòng thử lại sau.");
    }
  }

  function createOrderAndRenderQr(customInfo) {
    cleanCart();
    if (!state.cart.length) {
      showToast("Giỏ hàng đang trống.");
      return;
    }

    var validItem = state.cart.find(function (entry) {
      return !!getProductById(entry.productId);
    }) || state.cart[0];
    var product = getProductById(validItem ? validItem.productId : null);
    if (!product) {
      showToast("Vui lòng chọn lại file cần mua.");
      return;
    }

    if (checkoutModal) checkoutModal.classList.add("has-active-order");

    var phone = (customInfo && customInfo.customer_phone) || getResolvedPhone();
    var email = (customInfo && customInfo.customer_email) || (state.profile && state.profile.email) || (state.user ? state.user.email : "");
    var customerName = (customInfo && customInfo.customer_name) || (quickName ? quickName.value.trim() : "");
    setCheckoutCustomerConfirmed(true, {
      name: customerName,
      phone: phone,
      email: email
    });

    // Tự động lưu profile nếu trên server chưa có số điện thoại
    if (phone && (!state.profile || !state.profile.phone)) {
      state.profile = Object.assign({}, state.profile || {}, { phone: phone, email: email });
      saveProfile({ phone: phone, email: email, auth_provider: "auto_detect" });
    }

    // Hiển thị ngay thông tin ngân hàng để tránh bị trống các trường trong lúc chờ server
    var bankAccount = (window.StorefrontData && window.StorefrontData.store && window.StorefrontData.store.bankAccount) || {};
    var bankShortName = bankAccount.bankShortName || bankAccount.bankName || "TPBank";
    var accNo = bankAccount.number || "59215112002";
    var owner = bankAccount.owner || "HUYNH KIEN CAM";

    if (bankName) bankName.textContent = bankShortName;
    if (bankOwner) bankOwner.textContent = owner;
    if (bankNumber) bankNumber.textContent = accNo;
    var bankAmount = document.getElementById("bankAmount");
    if (bankAmount) bankAmount.textContent = formatCurrency(getCartTotal());
    // Kiểm tra xem đã có đơn hàng PENDING của cùng file và cùng gói này trong vòng 10 phút chưa (tránh tạo mã rác khi chuyển app)
    var cachedOrder = null;
    try {
      var rawActive = localStorage.getItem("filedilam_active_order");
      if (rawActive) {
        var parsedActive = JSON.parse(rawActive);
        if (!state.appliedCoupons.length && parsedActive && !parsedActive.has_coupon && parsedActive.product_id === product.id && parsedActive.amount === getCartTotal() && (parsedActive.package_type || "standard") === (state.selectedPackage || "standard") && (Date.now() - (parsedActive.time || 0) < 600000)) {
          cachedOrder = parsedActive;
        }
      }
    } catch (e) {}

    if (cachedOrder) {
      currentActiveOrderId = cachedOrder.order_id;
      if (bankTransferNote) bankTransferNote.textContent = cachedOrder.transfer_note || cachedOrder.order_id;
      if (bankAmount) bankAmount.textContent = formatCurrency(cachedOrder.amount);
      renderOrderQr(cachedOrder, accNo, owner);
      startQrCountdown(cachedOrder.time);
      pollOrderStatus(cachedOrder.order_id);
    } else {
      if (bankTransferNote) bankTransferNote.textContent = "Đang tạo mã...";
      if (qrBox) qrBox.innerHTML = '<div class="empty-state" style="padding:40px 0;"><div style="font-weight:600; font-size: 0.95rem; color: var(--muted); margin-bottom: 4px;">Đang tạo mã VietQR...</div><div style="font-size: 0.8rem; color: var(--muted);">Vui lòng chờ trong giây lát</div></div>';
    }

    // Chuyển sang Step 2 ngay lập tức
    if (checkoutAuthStep) checkoutAuthStep.style.display = "grid";
    if (checkoutModalTitle) checkoutModalTitle.textContent = "Quét mã QR thanh toán";
    if (checkoutBackBtn) checkoutBackBtn.style.display = "inline-flex";
    if (checkoutModal) checkoutModal.scrollTop = 0;
    resetQrActions();

    var productNames = state.cart.map(function(e) {
      var p = getProductById(e.productId);
      return p ? p.name : '';
    }).filter(Boolean).join(" + ");

    var orderItems = state.cart.map(function(e) {
      var p = getProductById(e.productId);
      if (!p) return null;
      var pRawUrl = p.sheetUrl || p.delivery_link || p.fileUrl || "";
      var pIsCloud = (p.type === "google_sheets" || !!p.sheetUrl || (pRawUrl && pRawUrl.indexOf("docs.google.com/spreadsheets") !== -1));
      return {
        product_id: p.id,
        product_name: p.name,
        product_file_url: getSafeDeliveryUrl(pRawUrl, pIsCloud ? "google_sheets" : "excel", p.id),
        product_type: pIsCloud ? "google_sheets" : (p.type || "excel"),
        quantity: e.quantity,
        price: p.price || 0
      };
    }).filter(Boolean);

    var finalAmount = getCartTotal();
    var orderData = {
      customer_name: customerName,
      customer_email: email,
      customer_phone: phone,
      product_id: product.id,
      product_name: productNames || product.name,
      product_file_url: product.sheetUrl || product.delivery_link || product.fileUrl || "./outputs/1_Quan_Ly_Kho_Sample.xlsx",
      product_type: (product.type === "google_sheets" || !!product.sheetUrl) ? "google_sheets" : "excel",
      items: orderItems,
      amount: finalAmount,
      coupon_code: state.appliedCoupons.length ? state.appliedCoupons[0].code : null,
      coupon_codes: state.appliedCoupons.map(function(coupon) { return coupon.code; }),
      discount_amount: state.discountAmount || 0,
      package_type: state.selectedPackage || "standard",
      package_name: state.selectedPackage === "coaching" ? (product.coachingTitle || "Bản Kèm 1-1 (1 buổi 1 tiếng)") : "Bản Tự Dùng"
    };

    authFetch("/orders", {
      method: "POST",
      body: JSON.stringify(orderData)
    })
    .then(function(resData) {
      var parsedCreatedAt = resData.created_at ? new Date(resData.created_at).getTime() : NaN;
      var orderStartTime = resData.reused && Number.isFinite(parsedCreatedAt) ? parsedCreatedAt : Date.now();
      currentActiveOrderId = resData.order_id;
      try {
        localStorage.setItem("filedilam_pending_order_id", resData.order_id);
        localStorage.setItem("filedilam_active_order", JSON.stringify({
          has_coupon: state.appliedCoupons.length > 0,
          order_id: resData.order_id,
          amount: resData.amount || getCartTotal(),
          transfer_note: resData.transfer_note,
          product_id: product.id,
          product_name: productNames || product.name,
          package_type: state.selectedPackage || "standard",
          package_name: state.selectedPackage === "coaching" ? (product.coachingTitle || "Bản Kèm 1-1 (1 buổi 1 tiếng)") : "Bản Tự Dùng",
          customer_name: customerName,
          customer_phone: phone,
          customer_email: email,
          time: orderStartTime
        }));
      } catch (e) {}
      if (bankTransferNote) bankTransferNote.textContent = resData.transfer_note;
      if (bankAmount) bankAmount.textContent = formatCurrency(resData.amount || getCartTotal());

      renderOrderQr(resData, accNo, owner);

      startQrCountdown(orderStartTime);
      showToast("Vui lòng quét mã QR để thanh toán.");
      pollOrderStatus(resData.order_id);
    })
    .catch(function(err) {
      console.error("Order creation error:", err);
      showToast("Chưa thể tạo đơn hàng. Vui lòng bấm Thử lại.");
      if (qrBox) {
        qrBox.innerHTML = 
          '<div class="empty-state" style="color:#ef4444; padding:24px 16px;">' +
            '<div style="font-weight:600;margin-bottom:6px;">Chưa tạo được đơn hàng</div>' +
            '<div style="font-size:0.85rem;color:var(--muted);margin-bottom:16px;">Vui lòng kiểm tra mạng và thử lại.</div>' +
            '<button type="button" class="button-primary" id="retryOrderBtn" style="padding:8px 24px;font-size:0.95rem;margin:0 auto;">Thử lại ngay</button>' +
          '</div>';
        var retryBtn = document.getElementById("retryOrderBtn");
        if (retryBtn) {
          retryBtn.addEventListener("click", function() {
            createOrderAndRenderQr(customInfo);
          });
        }
      }
    });
  }

  function cleanCart() {
    if (!data.products || !data.products.length) return;
    var valid = state.cart.filter(function (entry) {
      return !!getProductById(entry.productId);
    });
    if (valid.length !== state.cart.length) {
      state.cart = valid;
      persistCart();
      renderCart();
    }
  }

  function openCheckout(skipHistory) {
    cleanCart();
    if (!state.cart.length) {
      showToast("Giỏ hàng đang trống.");
      return;
    }

    closeCart();
    closeDetail();

    // Calculate Package Prices (Standard vs Coaching)
    var baseTotal = getCartBaseTotal();
    var firstItem = state.cart.find(function(entry) {
      return !!getProductById(entry.productId);
    }) || state.cart[0];
    var product = getProductById(firstItem ? firstItem.productId : null);
    var hasCoaching = product && product.hasCoaching && product.coachingPrice && product.coachingPrice > product.price;

    var pkgSectionWrap = document.getElementById("packageSelectionWrap");
    var pkgStep2Pills = document.getElementById("packageStep2Pills");

    if (hasCoaching) {
      var coachingTotal = baseTotal + (product.coachingPrice - product.price);
      var pkgPriceStdEl = document.getElementById("pkgPriceStandard");
      var pkgPriceCoachEl = document.getElementById("pkgPriceCoaching");
      var pillPriceStdEl = document.getElementById("pillPriceStandard");
      var pillPriceCoachEl = document.getElementById("pillPriceCoaching");
      var pkgTitleCoachEl = document.getElementById("pkgTitleCoaching");
      var pillTitleCoachEl = document.getElementById("pillTitleCoaching");

      if (pkgPriceStdEl) pkgPriceStdEl.textContent = formatCurrency(baseTotal);
      if (pkgPriceCoachEl) pkgPriceCoachEl.textContent = formatCurrency(coachingTotal);
      if (pillPriceStdEl) pillPriceStdEl.textContent = Math.round(baseTotal / 1000) + "k";
      if (pillPriceCoachEl) pillPriceCoachEl.textContent = Math.round(coachingTotal / 1000) + "k";

      if (product.coachingTitle) {
        if (pkgTitleCoachEl) pkgTitleCoachEl.textContent = product.coachingTitle;
        if (pillTitleCoachEl) pillTitleCoachEl.textContent = "🎓 " + product.coachingTitle.replace(/\(.*?\)/g, "").trim();
      }

      if (pkgSectionWrap) pkgSectionWrap.style.display = "block";
      if (pkgStep2Pills) pkgStep2Pills.style.display = "flex";
    } else {
      state.selectedPackage = "standard";
      if (pkgSectionWrap) pkgSectionWrap.style.display = "none";
      if (pkgStep2Pills) pkgStep2Pills.style.display = "none";
    }

    try {
      var rawActive = localStorage.getItem("filedilam_active_order");
      if (rawActive) {
        var parsedActive = JSON.parse(rawActive);
        if (parsedActive && parsedActive.package_type && (hasCoaching || parsedActive.package_type === "standard")) {
          state.selectedPackage = parsedActive.package_type;
        }
      }
    } catch (e) {}

    setCheckoutPackage(state.selectedPackage || "standard", false);

    // Render Order Summary Bar
    var total = getCartTotal();
    var detailedCart = state.cart.map(function(entry) {
      var p = getProductById(entry.productId);
      return p ? { product: p, quantity: entry.quantity, total: p.price * entry.quantity } : null;
    }).filter(Boolean);
    renderCheckoutSummary(detailedCart);
    var originalTotal = state.cart.reduce(function(acc, item) {
      var p = getProductById(item.productId);
      return acc + (p && p.originalPrice && p.originalPrice > p.price ? p.originalPrice * item.quantity : (p ? p.price * item.quantity : 0));
    }, 0);

    if (checkoutSummaryName && product) {
      var allNames = state.cart.map(function(e) {
        var p = getProductById(e.productId);
        return p ? p.name : '';
      }).filter(Boolean).join(" + ");
      checkoutSummaryName.textContent = allNames || product.name;
    }
    if (checkoutSummaryPrice) {
      checkoutSummaryPrice.textContent = formatCurrency(total);
    }
    if (checkoutSummaryOriginal) {
      checkoutSummaryOriginal.textContent = originalTotal > total ? formatCurrency(originalTotal) : "";
    }
    // Tự động khởi tạo thông tin ngân hàng và mã QR chuẩn ngay khi mở Checkout
    var bankAccount = (window.StorefrontData && window.StorefrontData.store && window.StorefrontData.store.bankAccount) || {};
    var bankShortName = bankAccount.bankShortName || bankAccount.bankName || "TPBank";
    var accNo = bankAccount.number || "59215112002";
    var owner = bankAccount.owner || "HUYNH KIEN CAM";

    if (bankName) bankName.textContent = bankShortName;
    if (bankOwner) bankOwner.textContent = owner;
    if (bankNumber) bankNumber.textContent = accNo;
    var bankAmountEl = document.getElementById("bankAmount");
    if (bankAmountEl) bankAmountEl.textContent = formatCurrency(total);

    var existingActiveOrder = null;
    try {
      var rawActive = localStorage.getItem("filedilam_active_order");
      if (rawActive) {
        var pActive = JSON.parse(rawActive);
        if (pActive && String(pActive.product_id || "") === String(product.id) && pActive.amount === total && (pActive.package_type || "standard") === (state.selectedPackage || "standard") && (Date.now() - (pActive.time || 0) < 600000)) {
          existingActiveOrder = pActive;
        }
      }
    } catch(e) {}

    if (existingActiveOrder) {
      checkoutModal.classList.add("has-active-order");
      setCheckoutCustomerConfirmed(true, {
        name: (quickName && quickName.value.trim()) || existingActiveOrder.customer_name || "",
        phone: (quickPhone && quickPhone.value.trim()) || existingActiveOrder.customer_phone || "",
        email: (quickEmail && quickEmail.value.trim()) || existingActiveOrder.customer_email || ""
      });
      currentActiveOrderId = existingActiveOrder.order_id;
      if (bankTransferNote) bankTransferNote.textContent = existingActiveOrder.transfer_note || existingActiveOrder.order_id;
      renderOrderQr(existingActiveOrder, accNo, owner);
      startQrCountdown(existingActiveOrder.time);
      pollOrderStatus(existingActiveOrder.order_id);
    } else {
      checkoutModal.classList.remove("has-active-order");
      setCheckoutCustomerConfirmed(false);
      currentActiveOrderId = null;
      currentQrImageUrl = "";
      if (bankTransferNote) bankTransferNote.textContent = "Tạo sau khi đặt hàng";
      if (qrBox) {
        qrBox.innerHTML = '<div class="empty-state" style="padding:40px 16px;"><div style="font-weight:600; font-size:0.95rem; color:#475569; margin-bottom:5px;">Mã thanh toán chưa được tạo</div><div style="font-size:0.8rem; color:#64748b;">Xác nhận thông tin để nhận mã đơn DH và mã QR.</div></div>';
      }
      var timerDisplay = document.getElementById("qrTimerDisplay");
      if (timerDisplay) timerDisplay.textContent = "--:--";
    }

    checkoutModal.classList.add("is-open");
    checkoutModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
    document.body.classList.add("checkout-page-open");
    if (!skipHistory && window.location.hash !== "#thanh-toan") {
      window.history.pushState({ page: "checkout" }, "", "#thanh-toan");
    }
    checkoutModal.scrollTop = 0;
    loadCheckoutCoupons();

    // Luôn hiển thị Form thanh toán 3 trường sạch sẽ, phẳng, chuẩn Fintech
    if (checkoutBackBtn) checkoutBackBtn.style.display = "inline-flex";
    if (checkoutModalTitle) checkoutModalTitle.textContent = "Thông tin thanh toán";

    var tabs = document.querySelector(".checkout-segmented-tabs");
    if (tabs) tabs.style.display = "none";
    var divider = document.querySelector(".checkout-divider");
    if (divider) divider.style.display = "none";
    if (btnGoogleCheckout) btnGoogleCheckout.style.display = "none";
    if (quickPassGroup) quickPassGroup.style.display = "none";

    // Luôn hiển thị cả 3 trường: Họ tên, SĐT, Gmail
    if (quickNameGroup) quickNameGroup.style.display = "block";
    if (quickEmailGroup) quickEmailGroup.style.display = "block";

    // Tự động điền dữ liệu nếu đã có thông tin từ trước
    if (state.profile) {
      if (quickName && state.profile.full_name && !quickName.value) quickName.value = state.profile.full_name;
      if (quickPhone && state.profile.phone && !quickPhone.value) quickPhone.value = state.profile.phone;
      // Chỉ điền email nếu là email thật của khách (không điền email ảo hệ thống @khachhang.filedilam.vn)
      var savedEmail = state.profile.email || "";
      if (quickEmail && savedEmail && savedEmail.indexOf("@khachhang.filedilam.vn") === -1 && !quickEmail.value) {
        quickEmail.value = savedEmail;
      }
    }
    if (state.user && state.user.email && quickEmail && !quickEmail.value) {
      var userMail = state.user.email || "";
      if (userMail.indexOf("@khachhang.filedilam.vn") === -1) {
        quickEmail.value = userMail;
      }
    }
    if (existingActiveOrder) {
      setCheckoutCustomerConfirmed(true, {
        name: quickName ? quickName.value.trim() : "",
        phone: quickPhone ? quickPhone.value.trim() : "",
        email: quickEmail ? quickEmail.value.trim() : ""
      });
    }

    if (btnQuickSubmitText) btnQuickSubmitText.textContent = "Xác nhận thông tin & tạo đơn";
    if (checkoutAuthStep) checkoutAuthStep.style.display = "grid";
    if (checkoutPaymentStep) checkoutPaymentStep.style.display = "none";
    if (quickName && !quickName.value) {
      setTimeout(function() { quickName.focus(); }, 100);
    } else if (quickPhone && !quickPhone.value) {
      setTimeout(function() { quickPhone.focus(); }, 100);
    }
  }

  function closeCheckout(fromHistory) {
    userClosedCheckout = true;
    checkoutModal.classList.remove("is-open");
    checkoutModal.classList.remove("is-customer-confirmed");
    checkoutModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("checkout-page-open");
    if (checkoutBackBtn) checkoutBackBtn.style.display = "none";
    unlockBodyIfNeeded();
    updateFloatingOrderBar();
    if (!fromHistory && window.location.hash === "#thanh-toan") {
      window.history.back();
    }
  }

  function setCheckoutCustomerConfirmed(confirmed, customer) {
    if (!checkoutModal) return;
    checkoutModal.classList.toggle("is-customer-confirmed", !!confirmed);
    if (checkoutBackBtn) {
      checkoutBackBtn.style.display = "inline-flex";
      var backLabel = checkoutBackBtn.querySelector("span");
      var label = confirmed ? "Quay lại đơn hàng" : "Quay lại trang chủ";
      if (backLabel) backLabel.textContent = label;
      checkoutBackBtn.setAttribute("aria-label", label);
    }
    document.querySelectorAll(".checkout-progress-step").forEach(function(step) {
      var number = Number(step.getAttribute("data-checkout-step"));
      step.classList.toggle("is-current", number === (confirmed ? 2 : 1));
      step.classList.toggle("is-complete", confirmed && number === 1);
    });
    if (!confirmed) return;
    customer = customer || {};
    if (checkoutCustomerName) checkoutCustomerName.textContent = customer.name || "Chưa cập nhật";
    if (checkoutCustomerPhone) checkoutCustomerPhone.textContent = customer.phone || "Chưa cập nhật";
    if (checkoutCustomerEmail) checkoutCustomerEmail.textContent = customer.email || "Chưa cập nhật";
    var paymentName = document.getElementById("checkoutPaymentCustomerName");
    var paymentPhone = document.getElementById("checkoutPaymentCustomerPhone");
    var paymentEmail = document.getElementById("checkoutPaymentCustomerEmail");
    if (paymentName) paymentName.textContent = customer.name || "Chưa cập nhật";
    if (paymentPhone) paymentPhone.textContent = customer.phone || "Chưa cập nhật";
    if (paymentEmail) paymentEmail.textContent = customer.email || "Chưa cập nhật";
  }

  function mountCheckoutFooter() {
    if (!checkoutFooterMount || checkoutFooterMount.children.length) return;
    var storefrontFooter = document.querySelector("body > .footer");
    if (!storefrontFooter) return;
    var checkoutFooter = storefrontFooter.cloneNode(true);
    checkoutFooter.classList.add("checkout-page-footer");
    checkoutFooterMount.appendChild(checkoutFooter);
  }

  function addToCart(productId, options) {
    options = options || {};
    var existingIdx = state.cart.findIndex(function (entry) {
      return entry.productId === productId;
    });

    if (existingIdx === -1) {
      state.cart.unshift({ productId: productId, quantity: 1 });
    } else {
      // Prioritize clicked item to the top for direct buy
      var item = state.cart.splice(existingIdx, 1)[0];
      state.cart.unshift(item);
    }

    persistCart();
    renderCart();

    if (options.openDrawer === true) {
      openCart();
    } else if (options.openDrawer !== false) {
      pulseCart();
      showToast(existingIdx !== -1 ? "Sản phẩm đã có trong giỏ hàng." : "Đã thêm vào giỏ hàng.");
    }
  }

  function buyNow(productId) {
    // 1-Click Buy: Focus solely on this selected file
    state.cart = [{ productId: productId, quantity: 1 }];
    persistCart();
    renderCart();
    openCheckout();
  }

  function pulseCart() {
    if (!openCartButton) return;
    openCartButton.classList.remove("cart-pulse");
    void openCartButton.offsetWidth;
    openCartButton.classList.add("cart-pulse");
    window.setTimeout(function () {
      openCartButton.classList.remove("cart-pulse");
    }, 650);
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter(function (entry) {
      return entry.productId !== productId;
    });
    persistCart();
    renderCart();
    showToast("Đã bỏ file khỏi giỏ.");
  }

  function updateCartQuantity(productId, change) {
    var entry = state.cart.find(function (item) {
      return item.productId === productId;
    });
    if (!entry) return;
    entry.quantity = Math.max(0, Math.min(99, Number(entry.quantity || 0) + change));
    if (entry.quantity === 0) {
      state.cart = state.cart.filter(function (item) {
        return item.productId !== productId;
      });
    }
    persistCart();
    renderCart();
  }

  function copyTextToClipboard(text, btnElement, successMsg) {
    if (!text) return;
    function markSuccess() {
      showToast(successMsg || "Đã sao chép: " + text);
      if (btnElement) {
        var originalText = btnElement.textContent;
        btnElement.textContent = "✓ Đã chép";
        btnElement.classList.add("copied");
        setTimeout(function () {
          btnElement.textContent = originalText;
          btnElement.classList.remove("copied");
        }, 1500);
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(markSuccess).catch(function () {
        fallbackCopyText(text, markSuccess);
      });
    } else {
      fallbackCopyText(text, markSuccess);
    }
  }

  function fallbackCopyText(text, callback) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      if (callback) callback();
    } catch (e) {
      showToast("Vui lòng sao chép thủ công.");
    }
    document.body.removeChild(textArea);
  }

  function copyTransferNote() {
    copyTextToClipboard(bankTransferNote.textContent.trim(), copyTransferNoteBtn, "Đã sao chép nội dung chuyển khoản.");
  }


  // --- REAL-TIME LANDING COUPON TICKET SYNC ---
  var currentFeaturedCoupon = null;

  async function syncLandingCouponTicket() {
    var ticketSec = document.getElementById('landingCouponSection');
    if (!ticketSec) return;

    try {
      if (typeof db === 'undefined' || !db.collection) return;

      var snapshot = await db.collection('coupons').get();
      if (snapshot.empty) return;

      var activeCoupons = [];
      var nowYMD = getLocalDateKey();

      snapshot.forEach(function(doc) {
        var c = doc.data();
        c.id = doc.id;
        if (c.is_active !== false && !advancedCoupon(c) && (!c.start_date || nowYMD >= c.start_date)) {
          if (c.end_date && nowYMD > c.end_date) return;
          activeCoupons.push(c);
        }
      });

      if (!activeCoupons.length) {
        currentFeaturedCoupon = null;
        ticketSec.style.display = 'none';
        return;
      }

      var featured = activeCoupons.find(function(c) { return c.code === 'FILEDILAM'; }) || activeCoupons[0];
      currentFeaturedCoupon = featured;
      ticketSec.style.display = 'block';

      // 1. Cập nhật Tiêu đề và Mô tả bên trái
      var titleEl = document.getElementById('landingCouponTitle');
      var dateEl = document.getElementById('landingCouponDate');
      var codeEl = document.getElementById('landingCouponCode');
      var hintEl = document.getElementById('landingCouponHint');

      var isPercent = featured.type === 'percent';
      var valText = isPercent ? (featured.value + '%') : formatCurrency(featured.value);
      var minOrder = Number(featured.min_order || 0);

      if (titleEl) {
        if (minOrder > 0) {
          var kText = minOrder >= 1000 ? (Math.round(minOrder / 1000) + 'k') : formatCurrency(minOrder);
          titleEl.textContent = 'Giảm ' + valText + ' cho đơn từ ' + kText;
        } else {
          titleEl.textContent = 'Giảm ' + valText + ' cho mọi đơn hàng';
        }
      }

      if (dateEl) {
        function fmtDate(d) {
          if (!d) return '';
          var parts = d.split('-');
          return parts.length === 3 ? (parts[2] + '/' + parts[1] + '/' + parts[0]) : d;
        }

        var sDate = featured.start_date ? fmtDate(featured.start_date) : '';
        var eDate = featured.end_date ? fmtDate(featured.end_date) : '';

        if (sDate && eDate) {
          dateEl.textContent = 'Áp dụng từ ' + sDate + ' đến ' + eDate;
        } else if (eDate) {
          dateEl.textContent = 'Hạn dùng đến ' + eDate;
        } else if (sDate) {
          dateEl.textContent = 'Bắt đầu từ ngày ' + sDate;
        } else if (featured.expires_at && featured.expires_at !== 'Vĩnh viễn') {
          dateEl.textContent = 'Thời gian áp dụng: ' + featured.expires_at;
        } else {
          dateEl.textContent = 'Áp dụng: Vĩnh viễn (Chưa có ngày kết thúc)';
        }
      }

      if (codeEl) {
        codeEl.textContent = featured.code;
      }

      if (hintEl) {
        hintEl.textContent = 'Bấm "Sử dụng mã" để tự động áp dụng mã ' + featured.code + ' và mở thanh toán.';
      }

      // 2. Cập nhật Card Thanh toán bên phải (Đơn hàng của bạn)
      var itemsContainer = document.getElementById('ticketItemsContainer');
      var headerBadge = document.getElementById('ticketCardHeaderBadge');
      var demoDiscountLabel = document.getElementById('demoDiscountLabel');
      var demoDiscountVal = document.getElementById('demoDiscountVal');
      var demoSubtotal = document.getElementById('demoSubtotal');
      var demoTotalVal = document.getElementById('demoTotalVal');
      var btnActionText = document.getElementById('btnTicketActionText');

      var itemsToShow = [];
      var isRealCart = (state.cart && state.cart.length > 0);

      if (isRealCart) {
        if (headerBadge) headerBadge.textContent = 'Đơn hàng của bạn (' + state.cart.length + ' file)';
        state.cart.forEach(function(entry) {
          var p = getProductById(entry.productId);
          if (p) {
            itemsToShow.push({ name: p.name, price: p.price || 0 });
          }
        });
      } else {
        if (headerBadge) headerBadge.textContent = 'Đơn hàng mẫu (Khuyên dùng)';
        if (data && data.products && data.products.length >= 2) {
          var sorted = data.products.slice().sort(function(a, b) { return (b.price || 0) - (a.price || 0); });
          itemsToShow.push({ name: sorted[0].name, price: sorted[0].price || 0 });
          itemsToShow.push({ name: sorted[1].name, price: sorted[1].price || 0 });
        } else {
          itemsToShow.push({ name: 'Quản lý bán hàng', price: 599000 });
          itemsToShow.push({ name: 'Quản lý kho', price: 95000 });
        }
      }

      var subtotal = itemsToShow.reduce(function(sum, it) { return sum + it.price; }, 0);
      if (minOrder > 0 && subtotal < minOrder && !isRealCart) {
        itemsToShow[0].price = Math.round(minOrder * 0.65);
        itemsToShow[1].price = Math.round(minOrder * 0.45);
        subtotal = itemsToShow[0].price + itemsToShow[1].price;
      }

      if (itemsContainer) {
        itemsContainer.innerHTML = itemsToShow.map(function(item) {
          return '<div class="summary-row" style="font-size: 0.84rem; margin-bottom: 4px;">' +
                   '<span style="color: #334155; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px;">' + escapeHtml(item.name) + '</span>' +
                   '<span style="font-weight: 600; color: #0f172a;">' + formatCurrency(item.price) + '</span>' +
                 '</div>';
        }).join('');
      }

      // Kiểm tra điều kiện đơn tối thiểu (min_order)
      var isEligible = (minOrder <= 0 || subtotal >= minOrder);
      var isCouponApplied = state.appliedCoupons.some(function(coupon) { return coupon.code === featured.code; }) && isEligible;

      var discountRow = document.getElementById('demoDiscountRow');
      var watermark = document.getElementById('ticketCardWatermark');

      var discount = 0;
      if (isCouponApplied) {
        if (isPercent) {
          discount = Math.round((subtotal * Number(featured.value)) / 100);
        } else {
          discount = Number(featured.value);
        }
        var maxDisc = Number(featured.max_discount || 0);
        if (maxDisc > 0 && discount > maxDisc) discount = maxDisc;
      }

      var finalAmount = Math.max(0, subtotal - discount);

      if (discountRow) {
        discountRow.style.display = (isCouponApplied && discount > 0) ? 'flex' : 'none';
      }
      if (watermark) {
        if (isCouponApplied) {
          watermark.textContent = 'Đã áp mã -' + valText;
          watermark.style.color = 'var(--mint-primary)';
          watermark.style.background = '#ecfdf5';
          watermark.style.display = 'inline-block';
        } else {
          watermark.style.display = 'none';
        }
      }

      var labelText = 'Mã ' + featured.code + (isPercent ? ' (-' + featured.value + '%)' : '');
      if (demoDiscountLabel) demoDiscountLabel.textContent = labelText;
      if (demoDiscountVal) demoDiscountVal.textContent = '-' + formatCurrency(discount);
      if (demoSubtotal) demoSubtotal.textContent = formatCurrency(subtotal);
      if (demoTotalVal) demoTotalVal.textContent = formatCurrency(finalAmount);

      var alertSub = document.getElementById('landingCouponAlertSub');

      if (isRealCart && !isEligible) {
        var thiếuTiền = minOrder - subtotal;
        if (alertSub) {
          alertSub.textContent = 'Đơn của bạn là ' + formatCurrency(subtotal) + ' (cần thêm ' + formatCurrency(thiếuTiền) + ' để áp dụng mã từ ' + formatCurrency(minOrder) + ').';
          alertSub.style.display = 'block';
        }
      } else {
        if (alertSub) alertSub.style.display = 'none';
      }

      if (btnActionText) {
        if (isRealCart && !isEligible) {
          btnActionText.textContent = 'Thanh toán không dùng mã';
        } else if (isCouponApplied) {
          btnActionText.textContent = 'Tiến hành thanh toán ngay';
        } else {
          btnActionText.textContent = isRealCart ? 'Sử dụng mã giảm giá' : 'Chọn combo mẫu & Sử dụng mã';
        }
      }

    } catch (e) {
      console.warn('Lỗi đồng bộ coupon ticket card:', e);
    }
  }

  // Bấm "Sử dụng mã" hoặc "Thanh toán ngay": Tự áp mã và mở ngăn giỏ hàng/thanh toán ngay
  window.handleTicketApplyAndCheckout = function(btnEl) {
    var code = (currentFeaturedCoupon && currentFeaturedCoupon.code) || 'FILEDILAM';

    // 1. Nếu giỏ hàng đang trống, tự động thêm combo mẫu vào giỏ hàng
    if (!state.cart || !state.cart.length) {
      if (data && data.products && data.products.length >= 2) {
        var sorted = data.products.slice().sort(function(a, b) { return (b.price || 0) - (a.price || 0); });
        state.cart = [
          { productId: sorted[0].id, quantity: 1 },
          { productId: sorted[1].id, quantity: 1 }
        ];
      } else if (data && data.products && data.products.length === 1) {
        state.cart = [{ productId: data.products[0].id, quantity: 1 }];
      }
      saveCart();
      renderCart();
    }

    // 2. Kiểm tra điều kiện đơn tối thiểu trước khi áp mã
    var curSubtotal = getCartSubtotal();
    var curMinOrder = Number((currentFeaturedCoupon && currentFeaturedCoupon.min_order) || 0);

    if (curMinOrder > 0 && curSubtotal < curMinOrder) {
      state.appliedCoupon = null;
      state.appliedCoupons = [];
      state.discountAmount = 0;
      var thiếu = curMinOrder - curSubtotal;
      var warnMsg = "Mã " + currentFeaturedCoupon.code + " chỉ áp dụng cho đơn từ " + formatCurrency(curMinOrder) + ". Bạn cần thêm " + formatCurrency(thiếu) + " nữa.";
      
      var alertSub = document.getElementById('landingCouponAlertSub');
      if (alertSub) {
        alertSub.textContent = 'Đơn của bạn là ' + formatCurrency(curSubtotal) + ' (cần thêm ' + formatCurrency(thiếu) + ' để áp dụng mã từ ' + formatCurrency(curMinOrder) + ').';
        alertSub.style.display = 'block';
      }

      showToast(warnMsg);
      syncLandingCouponTicket();
      // Nếu khách bấm từ nút "Thanh toán không dùng mã", vẫn mở thẳng màn thanh toán cho khách!
      openCheckout();
      return;
    }

    if (currentFeaturedCoupon) {
      state.appliedCoupon = currentFeaturedCoupon;
      state.appliedCoupons = [currentFeaturedCoupon];
    }

    // 3. Điền mã vào input
    try {
      sessionStorage.setItem('filedilam_auto_coupon', code);
    } catch(e) {}

    // Cập nhật lại card để hiển thị dòng giảm giá vừa được kích hoạt
    syncLandingCouponTicket();

    // 4. Mở thẳng trang thông tin thanh toán
    openCheckout();

    // 5. Kích hoạt áp mã
    setTimeout(function() {
      applyCheckoutCoupon();
    }, 150);

    showToast('Đã áp dụng mã ' + code + '!');
  };

  window.copyVoucherCode = function(btnEl) {
    handleTicketApplyAndCheckout(btnEl);
  };


  var qrFeedbackTimer = null;

  function onQrDownloaded() {
    if (saveQrBtn) {
      saveQrBtn.disabled = false;
      saveQrBtn.classList.remove("is-downloading");
      saveQrBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Đã tải ảnh</span>';
      saveQrBtn.classList.add("btn-saved-qr");
    }
    if (qrFeedbackTimer) clearTimeout(qrFeedbackTimer);
    qrFeedbackTimer = setTimeout(resetQrActions, 2400);
  }

  function resetQrActions() {
    if (qrFeedbackTimer) clearTimeout(qrFeedbackTimer);
    qrFeedbackTimer = null;
    if (saveQrBtn) {
      saveQrBtn.disabled = false;
      saveQrBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>Tải ảnh QR</span>';
      saveQrBtn.classList.remove("btn-saved-qr", "is-downloading");
    }
  }

  function makeLocalVietQr(order, account, owner) {
    function field(tag, value) {
      value = String(value);
      return tag + String(value.length).padStart(2, "0") + value;
    }
    var recipient = field("00", "970423") + field("01", account);
    var provider = field("00", "A000000727") + field("01", recipient) + field("02", "QRIBFTTA");
    var payload = "000201010212" + field("38", provider) + "5303704" + field("54", order.amount) +
      "5802VN" + field("62", field("08", order.transfer_note || order.order_id)) + "6304";
    var crc = 0xffff;
    for (var i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (var bit = 0; bit < 8; bit++) {
        crc = ((crc << 1) ^ ((crc & 0x8000) ? 0x1021 : 0)) & 0xffff;
      }
    }
    var qr = qrcode(0, "M");
    qr.addData(payload + crc.toString(16).toUpperCase().padStart(4, "0"));
    qr.make();
    var modules = qr.getModuleCount();

    // Canvas 800x800 - Crisp high-res square QR with generous quiet zone
    var canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 800;
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var padding = 40;
    var available = canvas.width - padding * 2;
    var scale = Math.floor(available / modules);
    var offset = Math.round((canvas.width - modules * scale) / 2);

    ctx.fillStyle = "#0f172a";
    for (var row = 0; row < modules; row++) {
      for (var col = 0; col < modules; col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(offset + col * scale, offset + row * scale, scale, scale);
        }
      }
    }
    return canvas;
  }

  var qrRenderToken = 0;

  function renderOrderQr(order, account, owner) {
    currentQrImageUrl = "";
    if (!qrBox) return;
    var renderToken = ++qrRenderToken;

    // Cập nhật thông tin ngân hàng hiển thị bên dưới QR
    var qrOwnerEl = document.getElementById("qrOwnerDisplay");
    var qrAccEl = document.getElementById("qrAccDisplay");
    var qrAmountEl = document.getElementById("qrAmountDisplay");
    var qrNoteEl = document.getElementById("qrTransferNoteDisplay");
    if (qrOwnerEl) qrOwnerEl.textContent = owner || "HUYNH KIEN CAM";
    if (qrAccEl) qrAccEl.textContent = account || "59215112002";
    if (qrAmountEl) qrAmountEl.textContent = formatCurrency(order.amount || 0);
    if (qrNoteEl) qrNoteEl.textContent = order.transfer_note || order.order_id || "";

    var qrCanvas = makeLocalVietQr(order, account, owner);
    var template = new Image();
    template.onload = function () {
      if (renderToken !== qrRenderToken) return;
      var canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1400;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(template, 0, 0, 540, 550, 0, 0, 1080, 1100);
      ctx.drawImage(qrCanvas, 168, 176, 744, 744);

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(540, 548, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#e11d30";
      ctx.lineWidth = 13;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(518, 531);
      ctx.lineTo(540, 565);
      ctx.lineTo(562, 531);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#17447e";
      ctx.font = "29px Arial, sans-serif";
      ctx.fillText("Số tiền: " + Number(order.amount || 0).toLocaleString("vi-VN") + " VND", 540, 1150);
      ctx.fillText("Nội dung CK: " + (order.transfer_note || order.order_id || ""), 540, 1198, 950);
      ctx.fillText("Tên chủ TK: " + (owner || "HUYNH KIEN CAM"), 540, 1246, 950);
      ctx.fillText("Số TK: " + (account || "59215112002"), 540, 1294);
      ctx.fillText("Ngân hàng TMCP Tiên Phong", 540, 1342);
      currentQrImageUrl = canvas.toDataURL("image/png");

      var img = new Image();
      img.className = "checkout-vietqr-image";
      img.alt = "VietQR thanh toán đơn hàng " + order.order_id;
      img.src = currentQrImageUrl;
      qrBox.replaceChildren(img);
    };
    template.onerror = function () {
      if (renderToken !== qrRenderToken) return;
      currentQrImageUrl = qrCanvas.toDataURL("image/png");
      var img = new Image();
      img.className = "checkout-vietqr-image";
      img.alt = "VietQR thanh toán đơn hàng " + order.order_id;
      img.src = currentQrImageUrl;
      qrBox.replaceChildren(img);
    };
    template.src = "./assets/vietqr-tpb-compact2.png";
  }

  function saveQrImage() {
    if (!currentQrImageUrl) {
      showToast("Chưa có mã QR để tải.");
      return;
    }
    if (saveQrBtn) {
      saveQrBtn.disabled = true;
      saveQrBtn.classList.add("is-downloading");
      saveQrBtn.innerHTML = '<span>Đang tải ảnh...</span>';
    }

    var filename = "ma-qr-filedilam.png";

    // Chuyển dataURL sang Blob trực tiếp bằng synchronous Base64 decode (Tức thì 0ms, không fetch mạng)
    function dataUrlToBlob(dataUrl) {
      try {
        var arr = dataUrl.split(',');
        var mime = arr[0].match(/:(.*?);/)[1];
        var bstr = atob(arr[1]);
        var n = bstr.length;
        var u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      } catch (e) {
        return null;
      }
    }

    // 1. Kiểm tra nếu là thiết bị di động hỗ trợ Web Share API với files (Lưu thẳng vào Photo Album)
    var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    var blob = dataUrlToBlob(currentQrImageUrl);

    if (isMobile && blob && navigator.canShare) {
      try {
        var file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: "Mã VietQR thanh toán",
            text: "Lưu ảnh vào máy để quét trên App ngân hàng"
          })
          .then(function() {
            onQrDownloaded();
          })
          .catch(function(err) {
            if (err && err.name === "AbortError") {
              resetQrActions();
            } else {
              directDownload(blob, filename);
            }
          });
          return;
        }
      } catch (e) {
        console.warn("Share API fallback:", e);
      }
    }

    // 2. Tải ngay lập tức (Direct download)
    if (blob) {
      directDownload(blob, filename);
    } else {
      fallbackDownloadUrl(currentQrImageUrl);
    }
  }

  function directDownload(blob, filename) {
    var blobUrl = window.URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = filename || "ma-qr-filedilam.png";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      if (a.parentNode) a.parentNode.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    }, 1500);
    onQrDownloaded();
  }

  function downloadViaImgElement(filename) {
    try {
      var img = qrBox ? qrBox.querySelector("img") : null;
      if (img && img.complete && img.naturalWidth > 0) {
        var canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(function (blob) {
          if (blob) {
            downloadBlobDirectly(blob, filename);
          } else {
            fallbackDownloadUrl(currentQrImageUrl);
          }
        }, "image/png");
        return;
      }
    } catch (e) {}
    fallbackDownloadUrl(currentQrImageUrl);
  }

  function fallbackDownloadUrl(url) {
    var a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "ma-qr-filedilam.png";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 1000);
    onQrDownloaded();
  }

  var BANK_SEARCH_ALIASES = {
    "vcb": "vietcombank vietcom ngoại thương ngoai thuong bftvvnvx",
    "mb": "mbbank mb bank quân đội quan doi mscbvnvx",
    "tcb": "techcombank techcom kỹ thương ky thuong vtcbvnvx",
    "tpb": "tpbank tp tiên phong tien phong tpbvvnvx",
    "vpb": "vpbank vp việt nam thịnh vượng viet nam thinh vuong vpbkvnvx",
    "acb": "acb á châu a chau ascbvnvx",
    "bidv": "bidv đầu tư phát triển dau tu phat trien bidvvnvx",
    "icb": "vietinbank vietin công thương cong thuong icbvvnvx ctg",
    "vba": "agribank agri nông nghiệp nong nghiep vbaavnvx",
    "stb": "sacombank sacom sài gòn thương tín sai gon thuong tin sgttvnvx",
    "vib-2": "vib quốc tế quoc te vnibvnvx myvib",
    "vib": "vib quốc tế quoc te vnibvnvx myvib",
    "momo": "momo ví momo vi momo trực tuyến truc tuyen",
    "zalopay": "zalopay ví zalopay vi zalopay zalo vng",
    "hdb": "hdbank hdb phát triển tphcm phat trien hdbcvnvx",
    "shb": "shb sài gòn hà nội sai gon ha noi shbavnvx",
    "msb": "msb hàng hải hang hai mcobvnvx",
    "ocb": "ocb phương đông phuong dong orcovnvx",
    "seab": "seabank seab đông nam á dong nam a seavvnvx",
    "lpb": "lpbank lpb lộc phát loc phat bưu điện liên việt buu dien lien viet lvbkvnvx",
    "viettelmoney": "viettelmoney viettel money vtpay vtlmoney viettel pay viễn thông quân đội",
    "cake": "cake cake by vpbank ngân hàng số ngan hang so",
    "shbvn": "shinhan shinhanbank shinhan bank shbkvnvx hàn quốc",
    "eib": "eximbank exim xuất nhập khẩu xuat nhap khau ebvivnvx",
    "nab": "nam a namabank nam á namavnvx",
    "abb": "abbank ab an bình an binh abbkvnvx",
    "timo": "timo bvbank bản việt ban viet vietcapitalbank vccb vcbcvnvx",
    "vab": "vietabank việt á viet a vnacvnvx",
    "klb": "kienlongbank kiên long kien long klbkvnvx",
    "bvb": "baoviet baovietbank bảo việt bao viet bvbvvnvx",
    "scb": "scb sài gòn sai gon saclvnvx",
    "ncb": "ncb quốc dân quoc dan nvbavnvx",
    "vietbank": "vietbank thương tín thuong tin vnttvnvx",
    "uob": "uob united overseas unitedoverseas",
    "cimb": "cimb",
    "wvn": "woori wooribank woori bank",
    "pbvn": "public publicbank public bank",
    "coopbank": "coopbank coop hợp tác xã hop tac xa",
    "vrb": "vrb việt nga viet nga",
    "ivb": "indovina indovinabank",
    "hsbc": "hsbc",
    "scvn": "standard chartered standardchartered",
    "citibank": "citibank citi",
    "kbank": "kbank kasikorn kasikornbank",
    "dbs": "dbs dbsbank",
    "hlbvn": "hong leong hongleong",
    "pgb": "pgbank pg thịnh vượng phát triển thinh vuong phat trien",
    "ubank": "ubank ubank by vpbank",
    "ojb": "oceanbank đại dương dai duong",
    "vnptmoney": "vnpt vnptmoney vnpt money",
    "sgicb": "saigonbank sài gòn công thương sai gon cong thuong"
  };

  function removeVietnameseTones(str) {
    if (!str) return "";
    return String(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  }

  function openBankPickerModal() {
    if (!bankPickerModal) return;
    if (bankSearchInput) {
      bankSearchInput.value = "";
      filterBankItems("");
    }
    // Gán title tooltip cho từng card ngân hàng để rê chuột vẫn biết rõ tên
    document.querySelectorAll(".bank-item").forEach(function (el) {
      var name = el.getAttribute("data-name");
      if (name) {
        if (!el.getAttribute("title")) el.setAttribute("title", name);
        if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", name);
      }
    });
    bankPickerModal.classList.add("is-open");
    bankPickerModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
    if (bankSearchInput) {
      setTimeout(function () {
        bankSearchInput.focus();
      }, 100);
    }
  }

  function filterBankItems(query) {
    var rawQ = (query || "").trim().toLowerCase();
    var normQ = removeVietnameseTones(rawQ);
    var items = document.querySelectorAll(".bank-item");
    var visibleCount = 0;

    items.forEach(function (el) {
      var appId = (el.getAttribute("data-app-id") || "").toLowerCase();
      var dataSearch = el.getAttribute("data-search") || "";
      var dataName = el.getAttribute("data-name") || "";
      var labelText = el.textContent || "";
      var aliases = BANK_SEARCH_ALIASES[appId] || "";

      var combined = [dataSearch, dataName, labelText, aliases, appId].join(" ");
      var rawCombined = combined.toLowerCase();
      var normCombined = removeVietnameseTones(combined);

      var isMatch = !normQ || rawCombined.indexOf(rawQ) !== -1 || normCombined.indexOf(normQ) !== -1;
      if (isMatch) {
        el.style.display = "flex";
        visibleCount++;
      } else {
        el.style.display = "none";
      }
    });

    var emptyMsg = document.getElementById("bankGridEmpty");
    if (!emptyMsg && bankGrid) {
      emptyMsg = document.createElement("div");
      emptyMsg.id = "bankGridEmpty";
      emptyMsg.className = "bank-grid-empty";
      emptyMsg.style.gridColumn = "1 / -1";
      emptyMsg.style.textAlign = "center";
      emptyMsg.style.padding = "24px 12px";
      emptyMsg.style.color = "#64748b";
      emptyMsg.style.fontSize = "0.88rem";
      emptyMsg.textContent = "Không tìm thấy ứng dụng ngân hàng phù hợp";
      bankGrid.appendChild(emptyMsg);
    }
    if (emptyMsg) {
      emptyMsg.style.display = (visibleCount === 0) ? "block" : "none";
    }
  }

  function closeBankPickerModal() {
    if (!bankPickerModal) return;
    bankPickerModal.classList.remove("is-open");
    bankPickerModal.setAttribute("aria-hidden", "true");
    if (
      (!checkoutModal || !checkoutModal.classList.contains("is-open")) &&
      (!detailModal || !detailModal.classList.contains("is-open")) &&
      (!cartDrawer || !cartDrawer.classList.contains("is-open"))
    ) {
      document.body.classList.remove("drawer-open");
    }
  }

  function handleBankItemClick(e) {
    var item = e.target.closest(".bank-item");
    if (!item) return;
    var appId = item.getAttribute("data-app-id");
    var scheme = item.getAttribute("data-scheme");
    var bankName = item.getAttribute("data-name") || "ngân hàng";

    // 1. Tự động sao chép Số tài khoản vào bộ nhớ tạm làm lớp bảo hiểm 100%
    var accNum = bankNumber ? bankNumber.textContent.trim() : "59215112002";
    if (accNum && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(accNum).catch(function () {});
    }

    // 2. Lấy thông tin thanh toán đơn hàng (Số tiền, Nội dung, Chủ tài khoản)
    var transferNote = bankTransferNote ? bankTransferNote.textContent.trim() : "";
    var totalVal = 0;
    try {
      var totalText = checkoutTotal ? checkoutTotal.textContent.replace(/[^\d]/g, "") : "";
      totalVal = parseInt(totalText, 10) || 0;
    } catch (err) {}
    if (!totalVal && typeof getCartTotal === "function") {
      totalVal = getCartTotal();
    }

    var owner = "HUYNH KIEN CAM";
    try {
      if (window.StorefrontData && window.StorefrontData.store && window.StorefrontData.store.bankAccount) {
        owner = window.StorefrontData.store.bankAccount.owner || owner;
      }
    } catch (err) {}
    var destBank = "tpb"; // TPBank của shop

    // 3. Xây dựng đường dẫn App-to-App thông minh (Autofill sẵn số tiền + nội dung chuyển khoản)
    var isAndroid = /android/i.test(navigator.userAgent);
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var targetUrl = "";
    var isHttp = false;

    if (appId === "momo") {
      // MoMo: Trên Android dùng Intent chuẩn tới app MoMo, trên iOS dùng momo://
      targetUrl = isAndroid
        ? "intent://#Intent;scheme=momo;package=com.mservice.momotransfer;end"
        : "momo://";
    } else if (appId === "zalopay") {
      // ZaloPay: Trên Android dùng Intent tới app ZaloPay, trên iOS dùng zalopay://
      targetUrl = isAndroid
        ? "intent://#Intent;scheme=zalopay;package=vn.com.vng.zalopay;end"
        : "zalopay://";
    } else if (appId === "viettelmoney" || appId === "vtlmoney") {
      // Viettel Money: Trên Android dùng Intent tới app Viettel Money, trên iOS dùng viettelmoney://
      targetUrl = isAndroid
        ? "intent://#Intent;scheme=viettelmoney;package=com.bplus.vtpay;end"
        : (scheme || "viettelmoney://");
    } else if (appId) {
      targetUrl = "https://dl.vietqr.io/pay?app=" + encodeURIComponent(appId) +
        "&ba=" + encodeURIComponent(accNum + "@" + destBank) +
        (totalVal ? "&am=" + encodeURIComponent(totalVal) : "") +
        (transferNote ? "&tn=" + encodeURIComponent(transferNote) : "") +
        "&bn=" + encodeURIComponent(owner);
      isHttp = true;
    } else if (scheme) {
      targetUrl = scheme;
      isHttp = targetUrl.startsWith("http://") || targetUrl.startsWith("https://");
    }

    if (targetUrl) {
      showToast("Đã chép STK. Đang mở app " + bankName + "...");
      closeBankPickerModal();

      if (isHttp) {
        // Mở qua tab mới để tab chính filedilam.web.app vẫn luôn hiển thị màn hình thanh toán
        var link = document.createElement("a");
        link.href = targetUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        setTimeout(function () {
          if (link.parentNode) link.parentNode.removeChild(link);
        }, 1000);
      } else {
        // Custom URI Scheme (momo://, zalopay://) hoặc Android Intent
        // Bắt buộc gán window.location.href ngay trong luồng click của người dùng
        // để iOS Safari và Android kích hoạt ứng dụng mà không bị sandbox chặn
        window.location.href = targetUrl;
      }
    }
  }

  function pollOrderStatus(orderId) {
    var attempts = 0;
    var maxAttempts = 200; // Polling 10 phút hiệu lực đơn hàng (200 * 3s = 600s)
    if (window._orderPollInterval) clearInterval(window._orderPollInterval);
    window._orderPollInterval = setInterval(function() {
      attempts++;
      if (attempts > maxAttempts || (!currentActiveOrderId && !localStorage.getItem("filedilam_active_order"))) {
        clearInterval(window._orderPollInterval);
        window._orderPollInterval = null;
        return;
      }
      authFetch("/orders/" + orderId)
        .then(function(data) {
          if (data && data.status === "PAID") {
            if (window._orderPollInterval) {
              clearInterval(window._orderPollInterval);
              window._orderPollInterval = null;
            }
            handleOrderSuccess(data);
          }
        })
        .catch(function() {});
    }, 3000);
  }

  function matchesSearch(product) {
    if (!state.searchTerm) {
      return true;
    }

    var haystack = [
      product.name,
      product.description,
      product.suitableFor,
      product.highlights.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.indexOf(state.searchTerm) !== -1;
  }

  function getActiveCategory() {
    return data.categories.find(function (category) {
      return category.id === state.activeCategoryId;
    });
  }

  function getFilteredProducts() {
    return data.products.filter(function (product) {
      // Category filter
      if (state.activeCategoryId !== "all") {
        var pCat = product.category || product.categoryId || 'kinh-doanh';
        if (['ban-hang-online', 'quan-ly-kho', 'fnb-cost', 'combo'].indexOf(pCat) !== -1) pCat = 'kinh-doanh';
        if (['cong-no', 'thu-chi-dong-tien'].indexOf(pCat) !== -1) pCat = 'ke-toan';
        if (pCat !== state.activeCategoryId && product.categoryId !== state.activeCategoryId) {
          return false;
        }
      }
      
      // Price filter
      if (state.activePriceId === "under_50") {
        if (product.price >= 50000) return false;
      } else if (state.activePriceId === "50_150") {
        if (product.price < 50000 || product.price > 150000) return false;
      } else if (state.activePriceId === "over_150") {
        if (product.price <= 150000) return false;
      }
      
      return true;
    });
  }

  function getProductById(productId) {
    return data.products.find(function (product) {
      return product.id === productId;
    });
  }

  function findProductForOrder(order) {
    if (!order) return null;
    if (order.product_id) {
      var byId = getProductById(order.product_id);
      if (byId) return byId;
    }
    if (order.product_name && data.products) {
      var targetName = String(order.product_name).trim().toLowerCase();
      var byName = data.products.find(function(p) {
        return p.name && String(p.name).trim().toLowerCase() === targetName;
      });
      if (byName) return byName;
    }
    return null;
  }

  function resolveOrderItems(order) {
    if (!order) return [];
    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items.map(function(it) {
        var p = getProductById(it.product_id) || findProductForOrder(it);
        var rawUrl = (p && (p.sheetUrl || p.delivery_link || p.fileUrl)) || it.product_file_url || "";
        var isCloud = (p && (p.type === "google_sheets" || !!p.sheetUrl)) ||
                      it.product_type === "google_sheets" ||
                      (rawUrl && rawUrl.indexOf("docs.google.com/spreadsheets") !== -1);
        var deliveryUrl = getSafeDeliveryUrl(rawUrl, isCloud ? "google_sheets" : (it.product_type || "excel"), it.product_id);
        return {
          product_id: it.product_id || (p && p.id) || "",
          product_name: it.product_name || (p && p.name) || "File đã mua",
          product_type: isCloud ? "google_sheets" : (it.product_type || "excel"),
          delivery_url: deliveryUrl,
          is_cloud: isCloud,
          price: it.price ?? (p && p.price) ?? 0
        };
      });
    }

    var rawName = String(order.product_name || "");
    if (rawName.indexOf(" + ") !== -1 && data.products && data.products.length > 0) {
      var parts = rawName.split(" + ").map(function(s) { return s.trim(); }).filter(Boolean);
      var matchedItems = [];
      parts.forEach(function(partName) {
        var lowerPart = partName.toLowerCase();
        var found = data.products.find(function(p) {
          if (!p || !p.name) return false;
          var pName = p.name.trim().toLowerCase();
          return pName === lowerPart || pName.indexOf(lowerPart) !== -1 || lowerPart.indexOf(pName) !== -1;
        });
        if (found) {
          var rawUrl = found.sheetUrl || found.delivery_link || found.fileUrl || "";
          var isCloud = found.type === "google_sheets" || !!found.sheetUrl || (rawUrl && rawUrl.indexOf("docs.google.com/spreadsheets") !== -1);
          matchedItems.push({
            product_id: found.id,
            product_name: found.name,
            product_type: isCloud ? "google_sheets" : (found.type || "excel"),
            delivery_url: getSafeDeliveryUrl(rawUrl, isCloud ? "google_sheets" : "excel", found.id),
            is_cloud: isCloud,
            price: found.price || 0
          });
        }
      });
      if (matchedItems.length > 1) {
        return matchedItems;
      }
    }

    var singleMatched = findProductForOrder(order);
    var singleUrl = (singleMatched && (singleMatched.sheetUrl || singleMatched.delivery_link || singleMatched.fileUrl)) || order.product_file_url || "";
    var singleCloud = (singleMatched && (singleMatched.type === "google_sheets" || !!singleMatched.sheetUrl)) ||
                      order.product_type === "google_sheets" ||
                      (singleUrl && singleUrl.indexOf("docs.google.com/spreadsheets") !== -1);
    var singleDelivery = getSafeDeliveryUrl(singleUrl, singleCloud ? "google_sheets" : order.product_type, order.product_id);
    return [{
      product_id: order.product_id || (singleMatched && singleMatched.id) || "",
      product_name: order.product_name || (singleMatched && singleMatched.name) || "File đã mua",
      product_type: singleCloud ? "google_sheets" : (order.product_type || "excel"),
      delivery_url: singleDelivery,
      is_cloud: singleCloud,
      price: order.amount || 0
    }];
  }

  function getCartSubtotal() {
    if (!state.cart || !state.cart.length) return 0;
    var base = getCartBaseTotal();
    if (state.selectedPackage === "coaching") {
      var firstItem = state.cart.find(function(entry) {
        return !!getProductById(entry.productId);
      }) || state.cart[0];
      var product = getProductById(firstItem ? firstItem.productId : null);
      if (product && product.hasCoaching && product.coachingPrice && product.coachingPrice > product.price) {
        return base + (product.coachingPrice - product.price);
      }
    }
    return base;
  }

  function advancedCoupon(c) {
    return !['percent','fixed'].includes(c.type) || (c.scope && c.scope !== 'all') || Number(c.min_items) > 0;
  }

  function evaluateCoupon(c, subtotal) {
    const scope = c.scope || 'all';
    const rewardIds = c.reward_ids || [];
    const products = state.cart.map(e => getProductById(e.productId)).filter(Boolean);
    const eligible = products.filter(p => p.price > 0 && !rewardIds.includes(p.id) && (
      scope === 'all' || (scope === 'single' && p.type !== 'combo') || (scope === 'combo' && p.type === 'combo') ||
      scope === 'category:' + p.categoryId || scope === 'product:' + p.id));
    const count = new Set(eligible.map(p => p.id)).size;
    const required = Number(c.min_items || 0);
    const base = scope === 'all' && !rewardIds.length ? subtotal : eligible.reduce((sum,p) =>
      sum + p.price * state.cart.find(e => e.productId === p.id).quantity, 0);
    const invalid = error => ({error, amount:0});
    if (!count || count < required) return invalid('Chưa đủ sản phẩm phù hợp. ' + getCouponConditionText(c));
    if (base < Number(c.min_order || 0)) return invalid('Giá trị sản phẩm đủ điều kiện chưa đạt ' + formatCurrency(c.min_order) + '.');
    const value = Number(c.value || 0);
    let amount = 0;
    let gift = null;
    const selected = products.filter(p => rewardIds.includes(p.id));
    switch (c.type) {
      case 'returning':
        if (!state.user || c.verifiedUser !== state.user.uid || Date.now() > c.returnUntil)
          return invalid('Mã dành cho khách có đơn đã thanh toán trong ' + c.return_days + ' ngày gần nhất.');
        amount = value;
        break;
      case 'fixed': amount = value; break;
      case 'percent': amount = Math.round(base * value / 100); break;
      case 'cheapest': amount = Math.round(Math.min(...eligible.map(p => p.price)) * value / 100); break;
      case 'bundle':
        if (count !== required) return invalid('Chọn đúng ' + required + ' sản phẩm phù hợp để hưởng giá nhóm.');
        amount = eligible.reduce((sum,p) => sum + p.price,0) - value;
        break;
      case 'tier':
        amount = Math.max(0,...(c.tiers || []).filter(t => count >= t.count).map(t => t.amount));
        break;
      case 'gift':
        gift = getProductById(rewardIds[0]);
        if (!gift || selected.length) return invalid('File quà cần có trong danh mục và chưa có trong giỏ.');
        break;
      case 'choice':
      case 'addon':
        if (selected.length !== 1) return invalid('Thêm đúng một file quà hoặc mua kèm được nêu trong điều kiện vào giỏ.');
        amount = selected[0].price - (c.type === 'addon' ? value : 0);
        break;
      default: return invalid('Loại chương trình không được hỗ trợ.');
    }
    if (!gift && amount <= 0) return invalid('Giỏ hàng chưa có mức giảm phù hợp với mã này.');
    const cap = Number(c.max_discount || 0);
    if (cap && (['percent','cheapest'].includes(c.type) || !advancedCoupon(c))) amount = Math.min(amount,cap);
    return {amount:Math.min(amount, ['choice','addon'].includes(c.type) ? subtotal : base), gift};
  }

  function getCartTotal() {
    var subtotal = getCartSubtotal();
    var discount = 0;
    state.appliedCoupons = state.appliedCoupons.filter(coupon => {
      const result = evaluateCoupon(coupon, subtotal);
      const today = getLocalDateKey();
      if (result.error || (coupon.start_date && today < coupon.start_date) || (coupon.end_date && today > coupon.end_date)) return false;
      discount += result.amount;
      return true;
    });
    discount = Math.min(subtotal, discount);
    state.appliedCoupon = state.appliedCoupons[0] || null;
    state.discountAmount = discount;
    return Math.max(0, subtotal - discount);
  }

  function getCartCount() {
    return state.cart.reduce(function (sum, entry) {
      return sum + entry.quantity;
    }, 0);
  }

  function buildTransferCode() {
    return data.store.bankAccount.notePrefix + "-" + String(Date.now()).slice(-6);
  }

  function loadCart() {
    try {
      var raw = localStorage.getItem("fileDiLamCart");
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function persistCart() {
    localStorage.setItem("fileDiLamCart", JSON.stringify(state.cart));
  }

  function saveOrder(order) {
    try {
      var raw = localStorage.getItem("fileDiLamOrders");
      var orders = raw ? JSON.parse(raw) : [];
      orders.push(order);
      localStorage.setItem("fileDiLamOrders", JSON.stringify(orders));
    } catch (error) {
      showToast("Đã tạo đơn nhưng chưa lưu lịch sử trên trình duyệt.");
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");

    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  function unlockBodyIfNeeded() {
    var hasOpenLayer =
      (cartDrawer && cartDrawer.classList.contains("is-open")) ||
      (detailModal && detailModal.classList.contains("is-open")) ||
      (checkoutModal && checkoutModal.classList.contains("is-open")) ||
      (purchasesDrawer && purchasesDrawer.classList.contains("is-open")) ||
      (reviewModal && reviewModal.classList.contains("is-open")) ||
      (authModal && authModal.classList.contains("is-open"));

    if (!hasOpenLayer) {
      document.body.classList.remove("drawer-open");
      document.body.classList.remove("modal-open");
    }
  }

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  }

  
  function getProductRatingDisplay(product) {
    var realDownloads = parseInt(product.downloads_count || product.downloadsCount || product.sales_count || product.salesCount || 0, 10);
    var realRatingAvg = parseFloat(product.rating_avg || product.ratingAvg || 0);
    var realRatingCount = parseInt(product.rating_count || product.ratingCount || 0, 10);

    var idStr = String(product.id || product.slug || product.name || "fldl");
    var hash = 0;
    for (var i = 0; i < idStr.length; i++) {
      hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
    }
    hash = Math.abs(hash);

    var ratingPalette = ["4.9", "4.8", "5.0", "4.9", "4.8", "5.0", "4.9"];
    var score = realRatingCount > 0 && realRatingAvg > 0 ? realRatingAvg.toFixed(1) : ratingPalette[hash % ratingPalette.length];
    
    // Lượt mua thực tế hoặc seed tự nhiên theo mã sản phẩm
    var salesCount = realDownloads > 0 ? realDownloads : (24 + (hash % 85));

    return {
      score: score,
      sales: salesCount,
      count: realRatingCount || (16 + (hash % 35)),
      downloads: salesCount,
      isCustom: realRatingCount === 0
    };
  }

  // ==========================================
  // --- STOREFRONT COUPON ENGINE & VALIDATION ---
  // ==========================================
  var checkoutCouponMsg = document.getElementById("checkoutCouponMsg");
  var checkoutCouponList = document.getElementById("checkoutCouponList");
  var checkoutCouponLoadId = 0;

  function getLocalDateKey() {
    return new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  }

  function getCouponConditionText(coupon) {
    if (coupon.description) return coupon.description;
    var discountText = coupon.type === "fixed"
      ? "Giảm " + formatCurrency(Number(coupon.value || 0))
      : "Giảm " + Number(coupon.value || 0) + "%";
    var minOrder = Number(coupon.min_order || 0);
    return discountText + (minOrder > 0 ? " cho đơn từ " + formatCurrency(minOrder) : " cho mọi đơn hàng");
  }

  async function loadCheckoutCoupons() {
    if (!checkoutCouponList) return;
    var requestId = ++checkoutCouponLoadId;
    checkoutCouponList.innerHTML = '<div class="checkout-coupon-empty">Đang tải mã giảm giá...</div>';

    try {
      if (typeof firebase === "undefined" || !firebase.firestore) throw new Error("FIRESTORE_UNAVAILABLE");
      var couponDb = firebase.firestore();
      var snapshot = await Promise.race([
        couponDb.collection("coupons").where("is_active", "==", true).get(),
        new Promise(function (_, reject) {
          window.setTimeout(function () { reject(new Error("COUPON_LOAD_TIMEOUT")); }, 5000);
        })
      ]);
      if (requestId !== checkoutCouponLoadId) return;
      var today = getLocalDateKey();
      var coupons = [];

      snapshot.forEach(function (doc) {
        var coupon = doc.data() || {};
        coupon.id = doc.id;
        coupon.code = String(coupon.code || doc.id).toUpperCase();
        if (coupon.start_date && today < coupon.start_date) return;
        if (coupon.end_date && today > coupon.end_date) return;
        coupons.push(coupon);
      });

      coupons.sort(function (a, b) {
        return String(a.end_date || "9999-12-31").localeCompare(String(b.end_date || "9999-12-31"));
      });

      if (!coupons.length) {
        checkoutCouponList.innerHTML = '<div class="checkout-coupon-empty">Hiện chưa có mã giảm giá đang hiệu lực.</div>';
        return;
      }

      checkoutCouponList.innerHTML = coupons.map(function (coupon) {
        var selected = state.appliedCoupons.some(function(active) { return active.code === coupon.code; });
        return '<button type="button" class="checkout-coupon-option' + (selected ? ' is-selected' : '') + '" aria-pressed="' + selected + '" data-coupon-code="' + escapeHtml(coupon.code) + '">' +
          '<span class="checkout-coupon-option-code">' + escapeHtml(coupon.code) + '</span>' +
          '<span class="checkout-coupon-option-condition">' + escapeHtml(getCouponConditionText(coupon)) + '</span>' +
          '<span class="checkout-coupon-option-selected">' + (selected ? 'Bỏ chọn' : 'Chọn mã') + '</span>' +
        '</button>';
      }).join("");

      Array.prototype.forEach.call(checkoutCouponList.querySelectorAll("[data-coupon-code]"), function (button) {
        button.addEventListener("click", function () {
          applyCheckoutCoupon(button.getAttribute("data-coupon-code") || "");
        });
      });
    } catch (error) {
      if (requestId !== checkoutCouponLoadId) return;
      console.warn("Could not load checkout coupons:", error);
      checkoutCouponList.innerHTML = '<button type="button" class="checkout-coupon-retry" id="checkoutCouponRetry">Chưa tải được mã giảm giá. Thử lại</button>';
      var retryButton = document.getElementById("checkoutCouponRetry");
      if (retryButton) retryButton.addEventListener("click", loadCheckoutCoupons);
    }
  }

  function showCouponMessage(text, isError) {
    if (!checkoutCouponMsg) return;
    checkoutCouponMsg.textContent = text;
    checkoutCouponMsg.style.display = "block";
    if (isError) {
      checkoutCouponMsg.style.background = "#f8fafc";
      checkoutCouponMsg.style.color = "#475569";
      checkoutCouponMsg.style.border = "1px solid #e2e8f0";
      checkoutCouponMsg.style.fontWeight = "500";
    } else {
      checkoutCouponMsg.style.background = "#ecfdf5";
      checkoutCouponMsg.style.color = "#059669";
      checkoutCouponMsg.style.border = "1px solid #a7f3d0";
      checkoutCouponMsg.style.fontWeight = "600";
    }
  }

  function clearCouponMessage() {
    if (!checkoutCouponMsg) return;
    checkoutCouponMsg.textContent = "";
    checkoutCouponMsg.style.display = "none";
  }

  function updateCheckoutCouponSelection() {
    if (!checkoutCouponList) return;
    checkoutCouponList.querySelectorAll("[data-coupon-code]").forEach(function(button) {
      var selected = state.appliedCoupons.some(function(coupon) {
        return coupon.code === button.getAttribute("data-coupon-code");
      });
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      var action = button.querySelector(".checkout-coupon-option-selected");
      if (action) action.textContent = selected ? "Bỏ chọn" : "Chọn mã";
    });
  }

  function invalidateActiveOrderOnCartOrCouponChange(message) {
    if (currentActiveOrderId || localStorage.getItem("filedilam_active_order")) {
      currentActiveOrderId = null;
      try {
        localStorage.removeItem("filedilam_active_order");
        localStorage.removeItem("filedilam_pending_order_id");
      } catch (e) {}
      if (window._orderPollInterval) {
        clearInterval(window._orderPollInterval);
        window._orderPollInterval = null;
      }
      if (checkoutModal) checkoutModal.classList.remove("has-active-order");
      setCheckoutCustomerConfirmed(false);
      currentQrImageUrl = "";
      if (bankTransferNote) bankTransferNote.textContent = "Tạo sau khi đặt hàng";
      if (qrBox) {
        qrBox.innerHTML = '<div class="empty-state" style="padding:40px 16px;"><div style="font-weight:600; font-size:0.95rem; color:#475569; margin-bottom:5px;">Mã thanh toán chưa được tạo</div><div style="font-size:0.8rem; color:#64748b;">' + (message || "Đơn hàng đã thay đổi. Vui lòng bấm Xác nhận thông tin để tạo lại mã QR mới.") + '</div></div>';
      }
      var timerDisplay = document.getElementById("qrTimerDisplay");
      if (timerDisplay) timerDisplay.textContent = "--:--";
      resetQrActions();
    }
  }

  async function applyCheckoutCoupon(code) {
    var rawCode = String(code || "").trim().toUpperCase();
    if (!rawCode) {
      showCouponMessage("Vui lòng chọn mã giảm giá.", true);
      return;
    }

    var subtotal = getCartSubtotal();
    if (subtotal <= 0) {
      showCouponMessage("Giỏ hàng chưa có sản phẩm nào.", true);
      return;
    }

    var alreadySelected = state.appliedCoupons.some(function(coupon) { return coupon.code === rawCode; });
    if (alreadySelected) {
      state.appliedCoupons = state.appliedCoupons.filter(function(coupon) { return coupon.code !== rawCode; });
      clearCouponMessage();
      invalidateActiveOrderOnCartOrCouponChange("Đơn hàng đã thay đổi. Vui lòng xác nhận lại để tạo mã QR mới.");
      renderCart();
      updateCheckoutCouponSelection();
      return;
    }

    try {
      var coupon = null;

      // 1. Fetch from Firestore collection 'coupons'
      if (typeof db !== 'undefined' && db.collection) {
        try {
          var docSnap = await db.collection('coupons').doc(rawCode).get();
          if (docSnap.exists) {
            coupon = docSnap.data();
            coupon.id = docSnap.id;
          } else {
            var querySnap = await db.collection('coupons').where('code', '==', rawCode).limit(1).get();
            if (!querySnap.empty) {
              var fDoc = querySnap.docs[0];
              coupon = fDoc.data();
              coupon.id = fDoc.id;
            }
          }
        } catch (dbErr) {
          console.warn("Firestore coupon fetch warning:", dbErr);
        }
      }

      if (!coupon || coupon.is_active === false) {
        showCouponMessage("Mã giảm giá '" + rawCode + "' không tồn tại hoặc đã hết hạn.", true);
        showToast("Mã '" + rawCode + "' không hợp lệ hoặc đã hết hạn.");
        return;
      }

      // Check date validity
      var nowYMD = getLocalDateKey();
      if (coupon.start_date && nowYMD < coupon.start_date) {
        var msgStart = "Chương trình giảm giá của mã " + coupon.code + " bắt đầu từ ngày " + coupon.start_date.split('-').reverse().join('/') + ".";
        showCouponMessage(msgStart, true);
        showToast(msgStart);
        return;
      }
      if (coupon.end_date && nowYMD > coupon.end_date) {
        var msgEnd = "Mã giảm giá " + coupon.code + " đã hết hạn từ ngày " + coupon.end_date.split('-').reverse().join('/') + ".";
        showCouponMessage(msgEnd, true);
        showToast(msgEnd);
        return;
      }

      if (coupon.type === 'returning') {
        if (!state.user) return showCouponMessage('Vui lòng đăng nhập để kiểm tra ưu đãi lần mua sau.', true);
        const uid = state.user.uid;
        const history = await authFetch('/my-orders');
        const latest = Math.max(0,...history.map(o => Date.parse(o.paid_at || o.created_at)).filter(Number.isFinite));
        coupon.verifiedUser = uid;
        coupon.returnUntil = latest + Number(coupon.return_days) * 86400000;
      }
      const result = evaluateCoupon(coupon, getCartSubtotal());
      if (result.error) return showCouponMessage(result.error, true);
      if (state.appliedCoupons.some(c => c.code === rawCode)) return;
      if (state.appliedCoupons.length && (advancedCoupon(coupon) || state.appliedCoupons.some(advancedCoupon))) {
        return showCouponMessage('Chương trình này áp dụng riêng. Vui lòng bỏ mã đang chọn trước.', true);
      }
      state.appliedCoupons.push(coupon);

      // Hủy mã QR cũ ngay lập tức nếu khách đã tạo đơn trước đó
      invalidateActiveOrderOnCartOrCouponChange("Đã áp dụng mã giảm giá mới! Vui lòng bấm Xác nhận thông tin để tạo lại mã QR.");

      clearCouponMessage();
      renderCart();
      updateCheckoutCouponSelection();
    } catch (err) {
      console.error("Lỗi áp mã:", err);
      showCouponMessage("Có lỗi khi kiểm tra mã. Vui lòng thử lại.", true);
    }
  }

  loadCheckoutCoupons();

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // Khởi động Animation số chạy mượt mà
  // Khởi động Animation số chạy mượt mà
  function initStatsCounters() {
    // Kích hoạt animation nhấp nháy cho 11 thanh tháng ở Card 1
    var pills = document.querySelectorAll(".cost-pills-bar .cost-pill-item:not(.is-paid)");
    if (pills.length) {
      pills.forEach(function(pill, idx) {
        pill.classList.add("pill-glow");
        pill.style.animationDelay = (idx * 0.12) + "s";
      });
    }

    // Tự động tính thời gian hoạt động từ tháng 04/2023
    var startDate = new Date(2023, 3, 1); // 01/04/2023 (tháng 4, index 3)
    var nowDate = new Date();
    var targetYears = nowDate.getFullYear() - startDate.getFullYear();
    var targetMonths = nowDate.getMonth() - startDate.getMonth();
    if (targetMonths < 0) {
      targetYears -= 1;
      targetMonths += 12;
    }

    var statYearsEl = document.getElementById("statYears");
    var statMonthsEl = document.getElementById("statMonths");
    var statTotalFilesEl = document.getElementById("statTotalFiles");
    var statsSectionEl = document.querySelector(".stats-section");

    var hasAnimated = false;
    function runSmoothStatsReveal() {
      if (hasAnimated) return;
      hasAnimated = true;

      function getTargetFiles() {
        if (data.products && data.products.length > 0) return data.products.length;
        if (statTotalFilesEl) {
          var parsed = parseInt(statTotalFilesEl.getAttribute("data-target"), 10);
          if (parsed && !isNaN(parsed)) return parsed;
        }
        return 30;
      }
      var targetFiles = getTargetFiles();

      // Card fade-in nhẹ
      var cards = document.querySelectorAll(".stats-section .stat-card");
      cards.forEach(function(card, idx) {
        card.style.opacity = "0";
        card.style.transform = "translateY(8px)";
        card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        setTimeout(function() {
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
        }, idx * 80);
      });

      // Smooth count-up running on 60fps with ease-out cubic
      var startTime = null;
      var duration = 1400; // 1.4s chạy số mượt mà, lướt êm dần về đích

      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }

      function animateCounters(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = easeOutCubic(progress);

        var currentYears = Math.round(eased * targetYears);
        var currentMonths = Math.round(eased * targetMonths);
        var currentFiles = Math.round(eased * targetFiles);

        if (statYearsEl) statYearsEl.textContent = String(currentYears);
        if (statMonthsEl) statMonthsEl.textContent = String(currentMonths);
        if (statTotalFilesEl) statTotalFilesEl.textContent = String(currentFiles);

        if (progress < 1) {
          requestAnimationFrame(animateCounters);
        } else {
          window.__statsAnimationFinished = true;
          if (statYearsEl) statYearsEl.textContent = String(targetYears);
          if (statMonthsEl) statMonthsEl.textContent = String(targetMonths);
          if (statTotalFilesEl) statTotalFilesEl.textContent = String(targetFiles);
        }
      }

      requestAnimationFrame(animateCounters);
    }

    if (statsSectionEl) {
      if ("IntersectionObserver" in window) {
        var obs = new IntersectionObserver(function(entries, observer) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              runSmoothStatsReveal();
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });
        obs.observe(statsSectionEl);
      } else {
        runSmoothStatsReveal();
      }
    }
  }
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStatsCounters);
  } else {
    setTimeout(initStatsCounters, 200);
  }
})();


  // Load and render all active coupons in Hero Section
  async function loadHeroCoupons() {
    var container = document.getElementById("heroCouponsList");
    if (!container) return;

    var activeCoupons = [
      {
        code: "FILEDILAM",
        description: "Giảm 10% cho đơn từ 160.000 đ",
        min_order: 160000,
        value: 10,
        type: "percent"
      }
    ];

    if (typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        var db = firebase.firestore();
        var snapshot = await db.collection("coupons").where("is_active", "==", true).get();
        if (!snapshot.empty) {
          var fetched = [];
          var nowYMD = getLocalDateKey();
          snapshot.forEach(function(doc) {
            var c = doc.data();
            c.id = doc.id;
            // Check dates
            if (c.start_date && nowYMD < c.start_date) return;
            if (c.end_date && nowYMD > c.end_date) return;
            fetched.push(c);
          });
          if (fetched.length > 0) {
            activeCoupons = fetched;
          }
        }
      } catch (err) {
        console.warn("Could not load coupons from Firestore:", err);
      }
    }

    container.innerHTML = activeCoupons.map(function(c) {
      var desc = c.description || (c.type === 'percent' ? 'Giảm ' + c.value + '%' : 'Giảm ' + formatCurrency(c.value));
      return (
        '<div class="hero-coupon-tag" data-code="' + escapeHtml(c.code) + '" title="Bấm để sao chép mã">' +
          '<span class="hero-coupon-code">' + escapeHtml(c.code) + '</span>' +
          '<span class="hero-coupon-detail">' + escapeHtml(desc) + '</span>' +
          '<span class="hero-coupon-copy-btn">Sao chép</span>' +
        '</div>'
      );
    }).join('');

    // Attach click to copy
    Array.prototype.forEach.call(container.querySelectorAll(".hero-coupon-tag"), function(tag) {
      tag.addEventListener("click", function() {
        var code = tag.getAttribute("data-code");
        if (code) {
          navigator.clipboard.writeText(code).then(function() {
            showToast("Đã sao chép mã: " + code);
          }).catch(function() {
            showToast("Mã: " + code);
          });
        }
      });
    });
  }

