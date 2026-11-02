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
  var checkoutModal = document.getElementById("checkoutModal");
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

  // Unified Checkout Modal elements
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
  var quickPhone = document.getElementById("quickPhone");
  var quickPassGroup = document.getElementById("quickPassGroup");
  var quickPassword = document.getElementById("quickPassword");
  var quickEmailGroup = document.getElementById("quickEmailGroup");
  var quickEmail = document.getElementById("quickEmail");
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
  bindEvents();
  initAuth();

  // Load dynamic products from Firestore (Single Source of Truth)
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    var db = firebase.firestore();
    // Real-time synchronization: Any change in Admin Dashboard reflects immediately on Storefront!
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

    var elCloseCheckout = document.getElementById("closeCheckout");
    if (elCloseCheckout) elCloseCheckout.addEventListener("click", closeCheckout);
    if (checkoutBackBtn) checkoutBackBtn.addEventListener("click", handleBackToInfo);

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
        copyTextToClipboard(bankNumber ? bankNumber.textContent.trim() : "", copyBankNumberBtn, "Đã sao chép Số tài khoản");
      });
    }
    var copyBankAmountBtn = document.getElementById("copyBankAmountBtn");
    if (copyBankAmountBtn) {
      copyBankAmountBtn.addEventListener("click", function () {
        var bankAmt = document.getElementById("bankAmount");
        copyTextToClipboard(bankAmt ? bankAmt.textContent.replace(/[^\d]/g, "") : "", copyBankAmountBtn, "Đã sao chép Số tiền");
      });
    }
    if (copyTransferNoteBtn) {
      copyTransferNoteBtn.addEventListener("click", function () {
        copyTextToClipboard(bankTransferNote ? bankTransferNote.textContent.trim() : "", copyTransferNoteBtn, "Đã sao chép Nội dung CK");
      });
    }
    if (loginButton) loginButton.addEventListener("click", openAuthModal);
    if (registerButton) registerButton.addEventListener("click", openRegisterModal);
    if (logoutButton) logoutButton.addEventListener("click", signOutUser);
    if (myPurchasesBtn) myPurchasesBtn.addEventListener("click", openPurchases);
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
    if (quickBuyForm) quickBuyForm.addEventListener("submit", handleQuickBuySubmit);
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

    if (checkoutModal) {
      checkoutModal.addEventListener("click", function (event) {
        if (event.target === checkoutModal) {
          closeCheckout();
        }
      });
    }
    
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

    // Đóng drawer khi click ra ngoài
    document.addEventListener("click", function (event) {
      if (purchasesDrawer && purchasesDrawer.classList.contains("is-open")) {
        if (!purchasesDrawer.contains(event.target) && !event.target.closest("#myPurchasesBtn") && !event.target.closest("#btnSuccessViewPurchases")) {
          closePurchasesDrawer();
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

  function initAuth() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          state.user = user;
          document.body.classList.add("is-logged-in");
          document.body.classList.remove("is-logged-out");
          if (registerButton) registerButton.style.display = "none";
          if (loginButton) loginButton.style.display = "none";
          if (userProfile) userProfile.style.display = "flex";
          if (purchasesDrawer && purchasesDrawer.classList.contains("is-open")) {
            loadMyPurchases();
          }
          
          var adminBtn = document.getElementById("adminDashboardBtn");
          if (adminBtn) {
            if (user.email === 'huynhkiencam151102@gmail.com') {
              adminBtn.style.display = "inline-block";
            } else {
              adminBtn.style.display = "none";
            }
          }
          
          loadProfile().then(function (profile) {
            var displayId = (profile && profile.phone) ||
              (user.email && user.email.indexOf("@khachhang.filedilam.vn") !== -1
                ? user.email.replace("@khachhang.filedilam.vn", "")
                : (user.displayName || user.email));
            if (userNameDisplay) userNameDisplay.textContent = displayId;
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
          if (registerButton) registerButton.style.display = "inline-block";
          if (loginButton) loginButton.style.display = "inline-block";
          if (userProfile) userProfile.style.display = "none";
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
      firebase.auth().signInWithPopup(provider).then(function(result) {
        state.user = result.user;
        closeAuthModal();
        if (result.user.email === 'huynhkiencam151102@gmail.com') {
          window.location.href = './admin.html';
          return;
        }
        return loadProfile();
      }).catch(function(error) {
        showToast("Đăng nhập thất bại: " + error.message);
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
            var supportPhone = (window.StorefrontData && window.StorefrontData.store && window.StorefrontData.store.supportZaloPhone) || "0921511202";
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
    var categoryOptions = [{ id: "all", name: "Tất cả danh mục" }].concat(data.categories || []);
    if (folderGrid) {
      folderGrid.innerHTML = categoryOptions
        .map(function (category) {
          var activeClass = category.id === state.activeCategoryId ? " active" : "";
          return (
            '<li class="category-item' + activeClass + '" data-folder-id="' +
            escapeHtml(category.id) + '">' +
            escapeHtml(category.name) +
            "</li>"
          );
        })
        .join("");

      Array.prototype.forEach.call(folderGrid.querySelectorAll("[data-folder-id]"), function (li) {
        li.addEventListener("click", function () {
          state.activeCategoryId = li.getAttribute("data-folder-id");
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
      statTotalFilesEl.textContent = data.products.length + "+";
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
          '<span class="download-count">(' + (ratingInfo.downloads > 0 ? ratingInfo.downloads + ' đã tải' : ratingInfo.count + ' đánh giá') + ')</span>' +
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
                (hasDiscount ? '<span class="product-discount-pill">-' + discountPercent + '%</span>' : '') +
              '</div>' +
              '<div class="product-digital-perks">' +
                '<span class="digital-perk">⚡ Nhận file ngay</span>' +
                '<span class="digital-perk">Trọn đời</span>' +
              '</div>' +
              '<div class="product-card-footer">' +
                socialProofHtml +
                '<button class="btn-card-cart-pill" type="button" data-cart-id="' + escapeHtml(product.id) + '">' +
                  '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>' +
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
          '<div class="empty-state">Giỏ hàng đang trống. Bấm vào file rồi thêm vào giỏ nhé.</div>';
      } else {
        cartItems.innerHTML = detailedCart
          .map(function (item) {
            return (
              '<div class="drawer-item">' +
                '<div class="drawer-item-info">' +
                  '<span class="drawer-item-title">' + escapeHtml(item.product.name) + '</span>' +
                  '<span class="drawer-item-price">' + formatCurrency(item.total) + '</span>' +
                '</div>' +
                '<button class="icon-button" type="button" data-remove-id="' + escapeHtml(item.product.id) + '" title="Bỏ khỏi giỏ">🗑️</button>' +
              '</div>'
            );
          })
          .join("");
      }
    }

    if (cartTotal) cartTotal.textContent = formatCurrency(getCartTotal());
    if (checkoutTotal) checkoutTotal.textContent = formatCurrency(getCartTotal());
    if (cartCount) cartCount.textContent = String(getCartCount());
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

    if (checkoutHeroTotal) checkoutHeroTotal.textContent = formatCurrency(total);
    if (checkoutSubTotal) checkoutSubTotal.textContent = formatCurrency(total);
    if (checkoutGrandTotal) checkoutGrandTotal.textContent = formatCurrency(total);

    if (!checkoutItems) return;
    if (!detailedCart.length) {
      checkoutItems.innerHTML =
        '<div class="empty-state" style="padding: 16px 0; color: #64748b; font-size: 0.9rem;">Chưa có file nào trong đơn hàng.</div>';
      return;
    }

    checkoutItems.innerHTML = detailedCart
      .map(function (item) {
        return (
          '<div class="checkout-product-row" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 12px; font-size: 0.92rem;">' +
            '<div style="color: #1e293b; font-weight: 500; line-height: 1.4; flex: 1;">' +
              escapeHtml(item.product.name) +
            '</div>' +
            '<div class="font-mono" style="color: #0f172a; font-weight: 600; white-space: nowrap;">' +
              formatCurrency(item.total) +
            '</div>' +
          '</div>'
        );
      })
      .join("");
  }

  function openDetail(productId) {
    var product = getProductById(productId);
    if (!product) {
      return;
    }

    state.selectedProductId = productId;
    detailTitle.textContent = product.name;

    var suitableHtml = (product.suitableFor && String(product.suitableFor).trim() !== '' && product.suitableFor !== 'undefined') 
      ? '<div><strong>Phù hợp với:</strong> ' + escapeHtml(product.suitableFor) + '</div>' 
      : '';
    var deliveryHtml = (product.delivery && String(product.delivery).trim() !== '' && product.delivery !== 'undefined')
      ? '<div><strong>Nhận file:</strong> ' + escapeHtml(product.delivery) + '</div>'
      : '';
    
    var highlightsHtml = '';
    if (product.highlights && product.highlights.length) {
      highlightsHtml = '<div><strong>Điểm nổi bật:</strong>' +
        '<ul style="margin:8px 0 0; padding:0; list-style:none; display:flex; flex-direction:column; gap:6px;">' +
        product.highlights.map(function (item) {
          return '<li style="display:flex; align-items:flex-start; gap:8px; font-size:0.92rem; color:#334155;">' +
            '<span style="color:var(--mint-strong); font-weight:bold; line-height:1.4;">✓</span>' +
            '<span>' + escapeHtml(item) + '</span>' +
            '</li>';
        }).join('') +
        '</ul></div>';
    }

    var priceHtml = '<div><strong>Giá:</strong> <span style="color:var(--mint-strong); font-weight:bold; font-size:1.3rem;">' + formatCurrency(product.price) + '</span>';
    if (product.originalPrice && product.originalPrice > product.price) {
      priceHtml += ' <span style="color:var(--muted); text-decoration:line-through; font-size:0.95rem; margin-left:8px;">' + formatCurrency(product.originalPrice) + '</span>';
    }
    priceHtml += '</div>';

    var ratingInfo = getProductRatingDisplay(product);
    var socialProofDetailHtml = '<div style="display:flex; align-items:center; gap:8px; font-size:0.85rem; color:#d97706; font-weight:600; background:#fef3c7; padding:6px 12px; border-radius:8px; width:fit-content;">' +
      '<span>⭐ ' + ratingInfo.score + ' (' + ratingInfo.count + ' đánh giá)</span>' +
      (ratingInfo.downloads > 0 ? '<span style="color:#6b7280; font-weight:normal;">• ' + ratingInfo.downloads + ' lượt tải</span>' : '') +
    '</div>';

    var coachingOptionHtml = (product.hasCoaching && product.coachingPrice)
      ? '<div style="display:flex; align-items:center; justify-content:space-between; background:#fffbeb; border:1px solid #fde68a; padding:10px 14px; border-radius:10px;">' +
          '<div style="font-size:0.85rem; color:#92400e; font-weight:600;">' +
            '<span>🎓 ' + escapeHtml(product.coachingTitle || 'Có tùy chọn Kèm 1-1') + '</span>' +
            '<div style="font-size:0.75rem; color:#b45309; font-weight:normal; margin-top:2px;">Kèm riêng 1 buổi ráp số liệu thực tế</div>' +
          '</div>' +
          '<span style="font-weight:700; color:#b45309; font-size:0.92rem; white-space:nowrap;">' + formatCurrency(product.coachingPrice) + '</span>' +
        '</div>'
      : '';

    var versionsHtml = '';
    if (product.versions && product.versions.length > 0) {
      // Sort versions by date descending
      var sortedV = [...product.versions].sort(function(a, b) {
        var da = parseDateObj(a.createdAt) || new Date(0);
        var db = parseDateObj(b.createdAt) || new Date(0);
        return db - da;
      });
      
      var vList = sortedV.map(function(v) {
        var tObj = formatDateTime(v.createdAt);
        return '<div style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px dashed #e2e8f0;">' +
                 '<div style="display:flex; justify-content:space-between; margin-bottom:4px;">' +
                   '<strong style="color:var(--mint-strong); font-size:0.9rem;">' + escapeHtml(v.name) + '</strong>' +
                   '<span style="color:#64748b; font-size:0.8rem;">' + escapeHtml(tObj.date) + '</span>' +
                 '</div>' +
                 '<div style="font-size:0.85rem; color:#475569;">' + escapeHtml(v.description) + '</div>' +
               '</div>';
      }).join('');
      
      versionsHtml = '<div class="detail-section" style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid #e2e8f0;">' +
                       '<strong style="display:block; margin-bottom:8px; font-size:0.95rem; color:#0f172a;">Lịch sử cập nhật:</strong>' +
                       vList +
                     '</div>';
    }

    var reviewsList = product.reviews;
    if (!reviewsList || !Array.isArray(reviewsList) || reviewsList.length === 0) {
      if (product.categoryId === 'quan-ly-kho' || (product.name && product.name.toLowerCase().indexOf('kho') !== -1)) {
        reviewsList = [
          { author: "Lê Anh Tuấn", role: "Chủ kho hàng gia dụng", stars: 5, comment: "File quản lý xuất nhập tồn rất nhẹ và chính xác. Tính năng cảnh báo hàng sắp hết giúp shop mình luôn nhập hàng kịp thời.", date: "3 ngày trước" },
          { author: "Vũ Thị Thanh", role: "Shop Giày dép Online", stars: 5, comment: "Theo dõi tồn kho theo thời gian thực rất mượt. Tư vấn khách xem tồn kho trực tiếp trên điện thoại siêu tiện luôn.", date: "1 tuần trước" },
          { author: "Đặng Hoàng Nam", role: "Shop Phụ kiện", stars: 5, comment: "Giao diện chuẩn chỉ, hướng dẫn sử dụng rõ ràng. Mua gói kèm 1-1 được hỗ trợ ráp số thực tế rất tận tình.", date: "2 tuần trước" }
        ];
      } else {
        reviewsList = [
          { author: "Nguyễn Thị Mai", role: "Chủ shop Thời trang", stars: 5, comment: "File dùng cực kỳ tiện lợi, giao diện gọn gàng trực quan. Dễ dàng theo dõi đơn COD và biết được lợi nhuận chuẩn xác hàng tháng mà không bị thất thoát.", date: "2 ngày trước" },
          { author: "Trần Quốc Tuấn", role: "Shop Đồ gia dụng TP.HCM", stars: 5, comment: "Dashboard tự động vẽ biểu đồ chi tiết rất thích. Nhập đơn trên điện thoại mượt mà, anh chủ shop hỗ trợ nhiệt tình 100%!", date: "1 tuần trước" },
          { author: "Phạm Lê Phương", role: "Kinh doanh Online", stars: 5, comment: "Tự động tạo bản sao vào Google Drive cá nhân nên rất bảo mật. Rất đáng đồng tiền, tiết kiệm bao nhiêu thời gian làm file thủ công.", date: "2 tuần trước" }
        ];
      }
    }

    var reviewsHtml = '';
    if (reviewsList && reviewsList.length > 0) {
      var reviewCards = reviewsList.map(function(r) {
        var firstChar = escapeHtml((r.author || 'K').charAt(0).toUpperCase());
        var starsStr = '';
        var starCount = parseInt(r.stars || 5, 10);
        for (var s = 0; s < starCount; s++) { starsStr += '⭐'; }

        return '<div style="background:#ffffff; padding:10px 12px; border-radius:8px; border:1px solid #f1f5f9; box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
                 '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">' +
                   '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">' +
                     '<span style="width:24px; height:24px; border-radius:50%; background:#dcfce7; color:#15803d; font-weight:bold; font-size:0.75rem; display:flex; align-items:center; justify-content:center; flex-shrink:0;">' + firstChar + '</span>' +
                     '<strong style="font-size:0.85rem; color:#1e293b;">' + escapeHtml(r.author || 'Khách hàng') + '</strong>' +
                     (r.role ? '<span style="font-size:0.75rem; color:#64748b;">(' + escapeHtml(r.role) + ')</span>' : '') +
                     '<span style="font-size:0.72rem; color:#166534; background:#dcfce7; padding:1px 6px; border-radius:4px; font-weight:500;">✓ Đã mua hàng</span>' +
                   '</div>' +
                   '<span style="font-size:0.75rem; color:#f59e0b; font-weight:600; white-space:nowrap;">' + starsStr + '</span>' +
                 '</div>' +
                 '<div style="font-size:0.84rem; color:#334155; line-height:1.45; margin-top:4px;">"' + escapeHtml(r.comment || '') + '"</div>' +
                 (r.date ? '<div style="font-size:0.72rem; color:#94a3b8; margin-top:4px; text-align:right;">' + escapeHtml(r.date) + '</div>' : '') +
               '</div>';
      }).join('');

      reviewsHtml = '<div class="detail-section" id="detailReviewsContainer" style="background:#f8fafc; padding:12px 14px; border-radius:10px; border:1px solid #e2e8f0;">' +
                      '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid #e2e8f0;">' +
                        '<strong style="font-size:0.92rem; color:#0f172a; display:flex; align-items:center; gap:6px;">' +
                          '<span>💬 Nhận xét & đánh giá từ khách hàng:</span>' +
                        '</strong>' +
                        '<span style="font-size:0.78rem; color:#d97706; font-weight:600; background:#fef3c7; padding:2px 8px; border-radius:6px;">' +
                          '⭐ 5.0 (' + reviewsList.length + ' đánh giá)' +
                        '</span>' +
                      '</div>' +
                      '<div style="display:flex; flex-direction:column; gap:8px;">' +
                        reviewCards +
                      '</div>' +
                    '</div>';
    }

    // Content inside scrollable body
    detailBody.innerHTML =
      '<div style="display:flex; flex-direction:column; gap: 16px;">' +
      renderDetailThumb(product) +
      socialProofDetailHtml +
      coachingOptionHtml +
      '<p class="detail-desc" style="line-height:1.6; color:#475569; margin:0;">' + escapeHtml(product.description) + '</p>' +
      suitableHtml +
      deliveryHtml +
      (product.usageGuide ? '<div class="detail-section"><strong>Dùng nhanh:</strong> ' + escapeHtml(product.usageGuide) + '</div>' : '') +
      highlightsHtml +
      reviewsHtml +
      (product.sheets && product.sheets.length ? '<div class="detail-section"><strong>Gồm:</strong> ' + escapeHtml(product.sheets.join(', ')) + '</div>' : '') +
      versionsHtml +
      '<div style="height: 12px;"></div>' +
      '</div>';

    detailBody.scrollTop = 0;

    // Async check: Replace with real Firestore reviews if buyers submitted any for this product
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        var db = firebase.firestore();
        db.collection('reviews').where('product_id', '==', productId).limit(10).get().then(function(snapshot) {
          if (snapshot && !snapshot.empty) {
            var realRevArr = [];
            snapshot.forEach(function(doc) {
              var d = doc.data();
              if (d && d.comment) {
                var tObj = d.created_at ? formatDateTime(d.created_at) : null;
                realRevArr.push({
                  author: d.customer_name || d.author || (d.customer_phone ? 'Khách hàng ' + d.customer_phone.slice(-4) : 'Khách hàng'),
                  role: d.product_name || 'Khách đã mua file',
                  stars: d.stars || 5,
                  comment: d.comment,
                  date: tObj ? tObj.date : 'Đánh giá thực tế'
                });
              }
            });
            if (realRevArr.length > 0) {
              product.reviews = realRevArr;
              var revContainer = document.getElementById("detailReviewsContainer");
              if (revContainer) {
                var newCards = realRevArr.map(function(r) {
                  var firstChar = escapeHtml((r.author || 'K').charAt(0).toUpperCase());
                  var starsStr = '';
                  var starCount = parseInt(r.stars || 5, 10);
                  for (var s = 0; s < starCount; s++) { starsStr += '⭐'; }
                  return '<div style="background:#ffffff; padding:10px 12px; border-radius:8px; border:1px solid #f1f5f9; box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
                           '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">' +
                             '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">' +
                               '<span style="width:24px; height:24px; border-radius:50%; background:#dcfce7; color:#15803d; font-weight:bold; font-size:0.75rem; display:flex; align-items:center; justify-content:center; flex-shrink:0;">' + firstChar + '</span>' +
                               '<strong style="font-size:0.85rem; color:#1e293b;">' + escapeHtml(r.author || 'Khách hàng') + '</strong>' +
                               '<span style="font-size:0.72rem; color:#166534; background:#dcfce7; padding:1px 6px; border-radius:4px; font-weight:500;">✓ Đã mua hàng</span>' +
                             '</div>' +
                             '<span style="font-size:0.75rem; color:#f59e0b; font-weight:600; white-space:nowrap;">' + starsStr + '</span>' +
                           '</div>' +
                           '<div style="font-size:0.84rem; color:#334155; line-height:1.45; margin-top:4px;">"' + escapeHtml(r.comment || '') + '"</div>' +
                           (r.date ? '<div style="font-size:0.72rem; color:#94a3b8; margin-top:4px; text-align:right;">' + escapeHtml(r.date) + '</div>' : '') +
                         '</div>';
                }).join('');
                revContainer.innerHTML =
                  '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid #e2e8f0;">' +
                    '<strong style="font-size:0.92rem; color:#0f172a; display:flex; align-items:center; gap:6px;">' +
                      '<span>💬 Nhận xét & đánh giá từ khách hàng:</span>' +
                    '</strong>' +
                    '<span style="font-size:0.78rem; color:#d97706; font-weight:600; background:#fef3c7; padding:2px 8px; border-radius:6px;">' +
                      '⭐ 5.0 (' + realRevArr.length + ' đánh giá thật từ Firestore)' +
                    '</span>' +
                  '</div>' +
                  '<div style="display:flex; flex-direction:column; gap:8px;">' +
                    newCards +
                  '</div>';
              }
            }
          }
        }).catch(function(err) {});
      } catch(e) {}
    }

    // Sticky Bottom Footer: Price + Action Buttons
    if (detailFooter) {
      var priceFormatted = formatCurrency(product.price);
      var priceLabel = (product.originalPrice && product.originalPrice > product.price) ? 'Giá ưu đãi' : 'Giá bán';
      var originalPriceHtml = '';
      if (product.originalPrice && product.originalPrice > product.price) {
        var discountPercent = Math.round((1 - product.price / product.originalPrice) * 100);
        originalPriceHtml = '<div style="display:flex; align-items:center; gap:6px; line-height:1; margin-bottom:3px;">' +
          '<span class="detail-original-price" style="color:var(--muted); text-decoration:line-through; font-size:0.85rem;">' + formatCurrency(product.originalPrice) + '</span>' +
          '<span class="product-discount-pill">-' + discountPercent + '%</span>' +
          '</div>';
      }

      detailFooter.innerHTML =
        '<div class="detail-footer-inner">' +
          '<div class="detail-price-col">' +
            '<span class="detail-price-label">' + priceLabel + '</span>' +
            '<div class="detail-price-val" style="display:flex; flex-direction:column; align-items:flex-start;">' +
              originalPriceHtml +
              '<strong class="detail-current-price">' + priceFormatted + '</strong>' +
            '</div>' +
          '</div>' +
          '<div class="detail-actions-row">' +
            '<button class="button-secondary" id="detailAddToCart" type="button">Thêm vào giỏ</button>' +
            '<button class="button-primary" id="detailBuyNow" type="button">Mua ngay</button>' +
          '</div>' +
        '</div>';

      var btnDetailAdd = document.getElementById("detailAddToCart");
      if (btnDetailAdd) {
        btnDetailAdd.addEventListener("click", function () {
          closeDetail();
          addToCart(product.id, { openDrawer: true });
        });
      }

      var btnDetailBuy = document.getElementById("detailBuyNow");
      if (btnDetailBuy) {
        btnDetailBuy.addEventListener("click", function () {
          closeDetail();
          buyNow(product.id);
        });
      }
    }

    detailModal.style.setProperty("top", "0px", "important");
    detailModal.style.setProperty("z-index", "99999", "important");
    detailModal.classList.add("is-open");
    detailModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
  }

  function renderProductThumb(product) {
    var isGoogleSheet = product.type === "google_sheets" || !!product.sheetUrl;
    var isCombo = product.categoryId === "combo" || product.type === "combo";
    var typeLabel = isCombo ? "Combo" : (isGoogleSheet ? "Google Sheets" : "Excel");
    var typeClass = isCombo ? " is-combo" : (isGoogleSheet ? " is-google-sheets" : " is-excel");
    
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

    var tabNew = document.getElementById("tabNewBuyer");
    var tabRet = document.getElementById("tabReturningBuyer");
    if (tabNew && tabRet) {
      if (isQuickLoginMode) {
        tabNew.classList.remove("active");
        tabRet.classList.add("active");
      } else {
        tabNew.classList.add("active");
        tabRet.classList.remove("active");
      }
    }

    if (isQuickLoginMode) {
      if (checkoutModalTitle) checkoutModalTitle.textContent = "Đăng nhập tài khoản";
      if (quickPhoneLabel) {
        quickPhoneLabel.innerHTML = 'Số điện thoại hoặc Email <span class="req">*</span>';
      }
      if (quickPhone) quickPhone.placeholder = "SĐT hoặc Email bạn đã mua file";
      if (quickPassGroup) quickPassGroup.style.display = "block";
      if (quickPassword) quickPassword.placeholder = "Nhập mật khẩu";
      if (quickEmailGroup) quickEmailGroup.style.display = "none";
      if (btnQuickSubmitText) btnQuickSubmitText.textContent = "Đăng nhập & Nhận mã QR";
    } else {
      if (checkoutModalTitle) checkoutModalTitle.textContent = "Thông tin thanh toán";
      if (quickPhoneLabel) {
        quickPhoneLabel.innerHTML = 'Số điện thoại / Zalo <span class="req">*</span>';
      }
      if (quickPhone) quickPhone.placeholder = "Ví dụ: 0912345678";
      if (quickPassGroup) quickPassGroup.style.display = "block";
      if (quickPassword) quickPassword.placeholder = "Tối thiểu 6 ký tự để tải lại file sau";
      if (quickEmailGroup) quickEmailGroup.style.display = "block";
      if (btnQuickSubmitText) btnQuickSubmitText.textContent = "Tiếp tục nhận mã QR";
    }
  }

  function handleBackToInfo() {
    if (checkoutAuthStep) checkoutAuthStep.style.display = "block";
    if (checkoutPaymentStep) checkoutPaymentStep.style.display = "none";
    if (checkoutModalTitle) checkoutModalTitle.textContent = "Thông tin nhận file & Thanh toán";
    if (checkoutBackBtn) checkoutBackBtn.style.display = "none";
    if (state.user) {
      if (quickPhone) quickPhone.value = getResolvedPhone();
      if (quickPassGroup) quickPassGroup.style.display = "none";
      if (quickEmailGroup) quickEmailGroup.style.display = "none";
    }
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
               (isMultipleFiles ? '<div style="font-weight: 700; font-size: 0.95rem; color: #1e293b; margin-bottom: 8px; display:flex; align-items:center; gap:6px;"><span style="color:var(--mint-strong); font-size: 1.1rem;">📄</span> ' + escapeHtml(item.product_name) + '</div>' : '') +
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
      var supportPhone = (window.StorefrontData && window.StorefrontData.store && window.StorefrontData.store.supportZaloPhone) || "0921511202";
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
      '<div style="text-align:center; padding: 40px 20px;">' +
      '<div style="font-size: 64px; margin-bottom: 16px;">🎉</div>' +
      '<h3 style="color: var(--mint-strong); margin-bottom: 12px; font-size: 1.5rem;">Thanh toán thành công!</h3>' +
      "<p style='color: var(--muted); margin-bottom: 24px;'>" + descText + "</p>" +
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

    detailTitle.textContent = "Nhận File Của Bạn";
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
    var timerDisplay = document.getElementById("qrTimerDisplay");
    var container = document.getElementById("qrCountdownContainer");
    var floatingTimer = document.getElementById("floatingOrderTimer");

    var totalDuration = 10 * 60 * 1000; // 10 phút hiệu lực
    var orderStart = startTime || Date.now();

    function tick() {
      var elapsed = Date.now() - orderStart;
      var remainingMs = Math.max(0, totalDuration - elapsed);

      if (remainingMs <= 0) {
        clearInterval(qrCountdownTimer);
        qrCountdownTimer = null;
        if (timerDisplay) timerDisplay.textContent = "00:00";
        if (floatingTimer) floatingTimer.textContent = "00:00";
        if (container) {
          container.style.background = "#fff1f2";
          container.style.color = "#991b1b";
          container.innerHTML = '<span style="font-size: 0.85rem;">⚠️ Mã thanh toán đã hết hạn 10 phút.</span>';
        }
        if (qrBox) {
          qrBox.innerHTML = 
            '<div class="empty-state" style="padding:28px 16px; background:#f8fafc; border-radius:12px; border:1.5px dashed #cbd5e1;">' +
              '<div style="font-size:32px; margin-bottom:6px;">⌛</div>' +
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
      var remainingSec = Math.max(0, Math.floor((remainingMs - 1) / 1000));
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
    var vietQrCode = "TPB";
    var accNo = bankAccount.number || "59215112002";
    var owner = bankAccount.owner || "HUYNH KIEN CAM";

    if (bankName) bankName.textContent = bankShortName;
    if (bankOwner) bankOwner.textContent = owner;
    if (bankNumber) bankNumber.textContent = accNo;
    var bankAmountEl = document.getElementById("bankAmount");
    if (bankAmountEl) bankAmountEl.textContent = formatCurrency(activeOrder.amount);
    if (bankTransferNote) bankTransferNote.textContent = activeOrder.transfer_note || activeOrder.order_id;

    var qrUrl = "https://img.vietqr.io/image/" + vietQrCode + "-" + accNo + "-compact.png?amount=" + activeOrder.amount + "&addInfo=" + encodeURIComponent(activeOrder.transfer_note || activeOrder.order_id) + "&accountName=" + encodeURIComponent(owner);
    currentQrImageUrl = qrUrl;

    if (qrBox) {
      qrBox.innerHTML = '<img src="' + qrUrl + '" alt="Mã QR chuyển khoản" style="max-width:175px; width:100%; height:auto; border-radius:8px; display:block; margin:0 auto;" />';
    }

    resetQrActions();
    startQrCountdown(activeOrder.time);

    // Mở và treo màn hình thanh toán ở Step 2
    if (checkoutAuthStep) checkoutAuthStep.style.display = "none";
    if (checkoutPaymentStep) checkoutPaymentStep.style.display = "block";
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
    e.preventDefault();
    if (typeof firebase === 'undefined' || !firebase.auth) {
      showToast("Hệ thống đang tải dữ liệu. Vui lòng thử lại sau giây lát.");
      return;
    }

    var auth = firebase.auth();
    if (btnQuickSubmit) btnQuickSubmit.disabled = true;

    // Nếu người dùng đã đăng nhập (ví dụ qua Google) nhưng chưa có SĐT
    if (state.user) {
      var loggedInPhoneInput = quickPhone.value.trim();
      var loggedInPhone = normalizePhone(loggedInPhoneInput);
      if (!isValidPhone(loggedInPhone)) {
        showToast("Vui lòng nhập đúng số điện thoại/Zalo (9–11 số).");
        if (btnQuickSubmit) btnQuickSubmit.disabled = false;
        return;
      }
      state.profile = Object.assign({}, state.profile || {}, { phone: loggedInPhone, email: state.user.email || "" });
      saveProfile({ phone: loggedInPhone, email: state.user.email || "", auth_provider: "quick_phone" });
      createOrderAndRenderQr({ customer_phone: loggedInPhone, customer_email: state.user.email || "" });
      if (btnQuickSubmit) btnQuickSubmit.disabled = false;
      return;
    }

    if (!isQuickLoginMode) {
      // --- CHẾ ĐỘ: KHÁCH MUA LẦN ĐẦU ---
      // 1. Gmail bắt buộc
      var emailInput = quickEmail ? quickEmail.value.trim().toLowerCase() : "";
      if (!isValidEmail(emailInput)) {
        showToast("Vui lòng nhập đúng địa chỉ Gmail để nhận link bản sao Google Sheets.");
        if (quickEmail) quickEmail.focus();
        if (btnQuickSubmit) btnQuickSubmit.disabled = false;
        return;
      }

      // 2. Số điện thoại bắt buộc
      var phoneInput = quickPhone.value.trim();
      var phone = normalizePhone(phoneInput);
      if (!isValidPhone(phone)) {
        showToast("Vui lòng nhập đúng số điện thoại/Zalo (9–11 số).");
        if (quickPhone) quickPhone.focus();
        if (btnQuickSubmit) btnQuickSubmit.disabled = false;
        return;
      }

      // 3. Mật khẩu
      var password = quickPassword.value;
      if (!password || password.length < 6) {
        showToast("Mật khẩu cần ít nhất 6 ký tự để bảo mật đơn hàng.");
        if (quickPassword) quickPassword.focus();
        if (btnQuickSubmit) btnQuickSubmit.disabled = false;
        return;
      }

      var customerEmail = emailInput;
      var authEmail = phone + "@khachhang.filedilam.vn";

      showToast("Đang tạo thông tin đơn hàng...");

      auth.createUserWithEmailAndPassword(authEmail, password)
        .then(function(result) {
          state.user = result.user;
          state.profile = { email: customerEmail, phone: phone, user_id: result.user.uid };
          saveProfile({ email: customerEmail, phone: phone, auth_provider: "phone_password" });
          createOrderAndRenderQr({ customer_phone: phone, customer_email: customerEmail });
        })
        .catch(function(error) {
          var code = error && error.code ? String(error.code) : "";
          if (code.indexOf("email-already-in-use") !== -1) {
            // SĐT này đã có tài khoản -> thử đăng nhập bằng mật khẩu vừa nhập
            auth.signInWithEmailAndPassword(authEmail, password)
              .then(function(result) {
                state.user = result.user;
                createOrderAndRenderQr({ customer_phone: phone, customer_email: customerEmail });
              })
              .catch(function() {
                showToast("Số điện thoại này đã có tài khoản. Vui lòng bấm 'Đăng nhập ngay' bên dưới.");
                isQuickLoginMode = true;
                updateQuickUI();
              });
          } else {
            showToast(authErrorMessage(error, "register"));
          }
        })
        .finally(function() {
          if (btnQuickSubmit) btnQuickSubmit.disabled = false;
        });

    } else {
      // --- CHẾ ĐỘ: ĐĂNG NHẬP KHÁCH CŨ ---
      var identifier = quickPhone.value.trim();
      var authEmail = identifierToAuthEmail(identifier);
      var password = quickPassword.value;
      if (!password) {
        showToast("Vui lòng nhập mật khẩu tài khoản.");
        if (btnQuickSubmit) btnQuickSubmit.disabled = false;
        return;
      }

      auth.signInWithEmailAndPassword(authEmail, password)
        .then(function(result) {
          state.user = result.user;
          showToast("Đăng nhập thành công!");
          loadProfile().then(function() {
            createOrderAndRenderQr();
          });
        })
        .catch(function(error) {
          showToast("Sai số điện thoại/email hoặc mật khẩu.");
        })
        .finally(function() {
          if (btnQuickSubmit) btnQuickSubmit.disabled = false;
        });
    }
  }

  function signInWithGoogleCheckout() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      var provider = new firebase.auth.GoogleAuthProvider();
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
          showToast("Đăng nhập Google thất bại: " + error.message);
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

    var phone = (customInfo && customInfo.customer_phone) || getResolvedPhone();
    var email = (customInfo && customInfo.customer_email) || (state.profile && state.profile.email) || (state.user ? state.user.email : "");

    // Tự động lưu profile nếu trên server chưa có số điện thoại
    if (phone && (!state.profile || !state.profile.phone)) {
      state.profile = Object.assign({}, state.profile || {}, { phone: phone, email: email });
      saveProfile({ phone: phone, email: email, auth_provider: "auto_detect" });
    }

    // Hiển thị ngay thông tin ngân hàng để tránh bị trống các trường trong lúc chờ server
    var bankAccount = (window.StorefrontData && window.StorefrontData.store && window.StorefrontData.store.bankAccount) || {};
    var bankShortName = bankAccount.bankShortName || bankAccount.bankName || "TPBank";
    var vietQrCode = "TPB";
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
        if (parsedActive && parsedActive.product_id === product.id && parsedActive.amount === getCartTotal() && (parsedActive.package_type || "standard") === (state.selectedPackage || "standard") && (Date.now() - (parsedActive.time || 0) < 600000)) {
          cachedOrder = parsedActive;
        }
      }
    } catch (e) {}

    if (cachedOrder) {
      currentActiveOrderId = cachedOrder.order_id;
      if (bankTransferNote) bankTransferNote.textContent = cachedOrder.transfer_note || cachedOrder.order_id;
      if (bankAmount) bankAmount.textContent = formatCurrency(cachedOrder.amount);
      var preQr = "https://img.vietqr.io/image/" + vietQrCode + "-" + accNo + "-compact.png?amount=" + cachedOrder.amount + "&addInfo=" + encodeURIComponent(cachedOrder.transfer_note || cachedOrder.order_id) + "&accountName=" + encodeURIComponent(owner);
      currentQrImageUrl = preQr;
      if (qrBox) {
        qrBox.innerHTML = '<img src="' + preQr + '" alt="Mã QR chuyển khoản" style="max-width:175px; width:100%; height:auto; border-radius:8px; display:block; margin:0 auto;" />';
      }
      startQrCountdown(cachedOrder.time);
      pollOrderStatus(cachedOrder.order_id);
    } else {
      if (bankTransferNote) bankTransferNote.textContent = "Đang tạo mã...";
      if (qrBox) qrBox.innerHTML = '<div class="empty-state" style="padding:40px 0;"><div style="font-weight:600; font-size: 0.95rem; color: var(--muted); margin-bottom: 4px;">Đang tạo mã VietQR...</div><div style="font-size: 0.8rem; color: var(--muted);">Vui lòng chờ trong giây lát</div></div>';
    }

    // Chuyển sang Step 2 ngay lập tức
    if (checkoutAuthStep) checkoutAuthStep.style.display = "none";
    if (checkoutPaymentStep) checkoutPaymentStep.style.display = "block";
    if (checkoutModalTitle) checkoutModalTitle.textContent = "Quét mã QR thanh toán";
    if (checkoutBackBtn) checkoutBackBtn.style.display = "inline-flex";
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
        price: p.price || 0
      };
    }).filter(Boolean);

    var orderData = {
      customer_email: email,
      customer_phone: phone,
      product_id: product.id,
      product_name: productNames || product.name,
      product_file_url: product.sheetUrl || product.delivery_link || product.fileUrl || "./outputs/1_Quan_Ly_Kho_Sample.xlsx",
      product_type: (product.type === "google_sheets" || !!product.sheetUrl) ? "google_sheets" : "excel",
      items: orderItems,
      amount: getCartTotal(),
      package_type: state.selectedPackage || "standard",
      package_name: state.selectedPackage === "coaching" ? (product.coachingTitle || "Bản Kèm 1-1 (1 buổi 1 tiếng)") : "Bản Tự Dùng"
    };

    authFetch("/orders", {
      method: "POST",
      body: JSON.stringify(orderData)
    })
    .then(function(resData) {
      var orderStartTime = (resData.created_at ? new Date(resData.created_at).getTime() : Date.now());
      currentActiveOrderId = resData.order_id;
      try {
        localStorage.setItem("filedilam_pending_order_id", resData.order_id);
        localStorage.setItem("filedilam_active_order", JSON.stringify({
          order_id: resData.order_id,
          amount: resData.amount || getCartTotal(),
          transfer_note: resData.transfer_note,
          product_id: product.id,
          product_name: productNames || product.name,
          package_type: state.selectedPackage || "standard",
          package_name: state.selectedPackage === "coaching" ? (product.coachingTitle || "Bản Kèm 1-1 (1 buổi 1 tiếng)") : "Bản Tự Dùng",
          customer_phone: phone,
          time: orderStartTime
        }));
      } catch (e) {}
      if (bankTransferNote) bankTransferNote.textContent = resData.transfer_note;
      if (bankAmount) bankAmount.textContent = formatCurrency(resData.amount || getCartTotal());

      var qrUrl = "https://img.vietqr.io/image/" + vietQrCode + "-" + accNo + "-compact.png?amount=" + resData.amount + "&addInfo=" + encodeURIComponent(resData.transfer_note) + "&accountName=" + encodeURIComponent(owner);
      currentQrImageUrl = qrUrl;

      if (qrBox) {
        qrBox.innerHTML = '<img src="' + qrUrl + '" alt="Mã QR chuyển khoản" style="max-width:175px; width:100%; height:auto; border-radius:8px; display:block; margin:0 auto;" />';
      }

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

  function openCheckout() {
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
    var bankAmountEl = document.getElementById("bankAmount");
    if (bankAmountEl) {
      bankAmountEl.textContent = formatCurrency(total);
    }

    checkoutModal.classList.add("is-open");
    checkoutModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");

    // Nếu đã đăng nhập
    if (state.user) {
      var resolvedPhone = getResolvedPhone();
      if (resolvedPhone) {
        if (checkoutAuthStep) checkoutAuthStep.style.display = "none";
        if (checkoutPaymentStep) checkoutPaymentStep.style.display = "block";
        if (checkoutModalTitle) checkoutModalTitle.textContent = "Quét mã QR thanh toán";
        if (checkoutBackBtn) checkoutBackBtn.style.display = "inline-flex";
        createOrderAndRenderQr({ customer_phone: resolvedPhone, customer_email: state.user.email });
      } else {
        // Đã đăng nhập nhưng chưa có SĐT (ví dụ tài khoản Google lần đầu)
        if (checkoutBackBtn) checkoutBackBtn.style.display = "none";
        if (checkoutModalTitle) checkoutModalTitle.textContent = "Thông tin nhận file";
        if (quickPhoneLabel) {
          quickPhoneLabel.innerHTML = 'Số điện thoại / Zalo <span class="req">*</span>';
        }
        if (quickPhone) {
          quickPhone.placeholder = "Ví dụ: 0912345678";
          quickPhone.value = "";
        }
        var tabs = document.querySelector(".checkout-segmented-tabs");
        if (tabs) tabs.style.display = "none";
        var divider = document.querySelector(".checkout-divider");
        if (divider) divider.style.display = "none";
        if (btnGoogleCheckout) btnGoogleCheckout.style.display = "none";
        if (quickPassGroup) quickPassGroup.style.display = "none";
        if (quickEmailGroup) quickEmailGroup.style.display = "none";
        if (btnQuickSubmitText) btnQuickSubmitText.textContent = "Tiếp tục nhận mã QR";
        if (checkoutAuthStep) checkoutAuthStep.style.display = "block";
        if (checkoutPaymentStep) checkoutPaymentStep.style.display = "none";
        if (quickPhone) setTimeout(function() { quickPhone.focus(); }, 100);
      }
    } else {
      // Khách chưa đăng nhập -> Hiển thị Step 1 (Mặc định form mua lần đầu)
      if (checkoutBackBtn) checkoutBackBtn.style.display = "none";
      isQuickLoginMode = false;
      var tabs = document.querySelector(".checkout-segmented-tabs");
      if (tabs) tabs.style.display = "flex";
      var divider = document.querySelector(".checkout-divider");
      if (divider) divider.style.display = "flex";
      if (btnGoogleCheckout) btnGoogleCheckout.style.display = "flex";
      updateQuickUI();
      if (checkoutAuthStep) checkoutAuthStep.style.display = "block";
      if (checkoutPaymentStep) checkoutPaymentStep.style.display = "none";
      if (quickPhone) setTimeout(function() { quickPhone.focus(); }, 100);
    }
  }

  function closeCheckout() {
    userClosedCheckout = true;
    checkoutModal.classList.remove("is-open");
    checkoutModal.setAttribute("aria-hidden", "true");
    if (checkoutBackBtn) checkoutBackBtn.style.display = "none";
    unlockBodyIfNeeded();
    updateFloatingOrderBar();
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

  // Global helper for voucher coupon ticket copy button
  window.copyVoucherCode = function (btnEl, code) {
    if (!code) code = "FILEDILAM";
    copyTextToClipboard(code, btnEl, "Đã sao chép mã " + code);
  };

  function onQrDownloaded() {
    if (saveQrBtn) {
      saveQrBtn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Đã lưu (Tải lại)</span>';
      saveQrBtn.classList.add("btn-saved-qr");
    }
    if (openBankBtn) {
      openBankBtn.style.display = "inline-flex";
    }
    var hint = document.getElementById("qrDownloadedHint");
    if (hint) {
      hint.style.display = "block";
    }
    showToast("Đã chuẩn bị ảnh QR. Hãy chọn 'Lưu hình ảnh' để lưu vào Album ảnh!");
  }

  function resetQrActions() {
    if (openBankBtn) {
      openBankBtn.style.display = "none";
    }
    if (saveQrBtn) {
      saveQrBtn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>Tải ảnh QR</span>';
      saveQrBtn.classList.remove("btn-saved-qr");
    }
    var hint = document.getElementById("qrDownloadedHint");
    if (hint) {
      hint.style.display = "none";
    }
  }

  function saveQrImage() {
    if (!currentQrImageUrl) {
      showToast("Chưa có mã QR để tải.");
      return;
    }
    showToast("Đang chuẩn bị ảnh mã QR...");

    function handleQrBlob(blob) {
      var filename = "ma-qr-filedilam.png";
      // 1. Ưu tiên Web Share API trên iOS/Android để người dùng chọn 'Lưu hình ảnh' thẳng vào Album ảnh
      try {
        var file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: "Mã VietQR thanh toán",
            text: "Lưu hình ảnh để quét trên ứng dụng ngân hàng"
          })
          .then(function() {
            onQrDownloaded();
            showToast("Đã mở bảng chia sẻ. Bấm 'Lưu hình ảnh' để lưu vào Album ảnh.");
          })
          .catch(function(err) {
            if (err && err.name === "AbortError") {
              onQrDownloaded();
            } else {
              downloadBlobDirectly(blob, filename);
            }
          });
          return;
        }
      } catch (e) {
        console.warn("Web Share API fallback:", e);
      }

      // 2. Fallback trên Desktop hoặc trình duyệt không hỗ trợ Web Share API
      downloadBlobDirectly(blob, filename);
    }

    fetch(currentQrImageUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("Network error");
        return res.blob();
      })
      .then(function (blob) {
        handleQrBlob(blob);
      })
      .catch(function () {
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
                handleQrBlob(blob);
              } else {
                fallbackDownloadUrl(currentQrImageUrl);
              }
            }, "image/png");
            return;
          }
        } catch (e) {}
        fallbackDownloadUrl(currentQrImageUrl);
      });
  }

  function downloadBlobDirectly(blob, filename) {
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
    }, 2000);
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
      if (state.activeCategoryId !== "all" && product.categoryId !== state.activeCategoryId) {
        return false;
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
          price: it.price || (p && p.price) || 0
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

  function getCartTotal() {
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
    var realDownloads = parseInt(product.downloads_count || product.downloadsCount || 0, 10);
    var realRatingAvg = parseFloat(product.rating_avg || product.ratingAvg || 0);
    var realRatingCount = parseInt(product.rating_count || product.ratingCount || 0, 10);

    if (realRatingCount > 0 && realRatingAvg > 0) {
      return {
        score: realRatingAvg.toFixed(1),
        count: realRatingCount,
        downloads: realDownloads,
        isCustom: false
      };
    }

    // Dải rating tự nhiên 4.8 - 5.0 (ưu tiên 4.9 và 5.0) cho từng sản phẩm
    var idStr = String(product.id || product.slug || product.name || "fldl");
    var hash = 0;
    for (var i = 0; i < idStr.length; i++) {
      hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
    }
    hash = Math.abs(hash);
    var ratingPalette = ["4.9", "4.8", "5.0", "4.9", "4.8", "5.0", "4.9"];
    var score = ratingPalette[hash % ratingPalette.length];
    var count = 16 + (hash % 35); // 16 - 50 đánh giá

    return {
      score: score,
      count: count,
      downloads: realDownloads,
      isCustom: true
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();
