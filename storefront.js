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
  };

  var folderGrid = document.getElementById("folderGrid");
  var priceGrid = document.getElementById("priceGrid");
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

  // Cache check for instant product display
  var isFirestoreProductsLoaded = false;
  try {
    // Clear all legacy and temporary cache keys
    localStorage.removeItem("filedilam_cached_products");
    localStorage.removeItem("filedilam_cached_products_v2");
    localStorage.removeItem("filedilam_cached_products_v3");

    var cachedProductsStr = localStorage.getItem("filedilam_cached_products_v4");
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
          localStorage.setItem("filedilam_cached_products_v4", JSON.stringify(data.products));
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

    if (openCartButton) openCartButton.addEventListener("click", openCart);
    var elCloseCart = document.getElementById("closeCart");
    if (elCloseCart) elCloseCart.addEventListener("click", closeCart);

    var elCheckoutButton = document.getElementById("checkoutButton");
    if (elCheckoutButton) elCheckoutButton.addEventListener("click", openCheckout);

    var elCloseCheckout = document.getElementById("closeCheckout");
    if (elCloseCheckout) elCloseCheckout.addEventListener("click", closeCheckout);

    var elBackToCart = document.getElementById("backToCart");
    if (elBackToCart) {
      elBackToCart.addEventListener("click", function () {
        closeCheckout();
        openCart();
      });
    }

    var elCloseDetail = document.getElementById("closeDetail");
    if (elCloseDetail) elCloseDetail.addEventListener("click", closeDetail);

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
    loadMyPurchases();
    if (purchasesDrawer) {
      purchasesDrawer.classList.add("is-open");
      purchasesDrawer.setAttribute("aria-hidden", "false");
      document.body.classList.add("drawer-open");
      document.body.classList.add("cart-drawer-open");
    }
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
    
    Promise.all([
      authFetch("/my-orders"),
      productsLoadedPromise || Promise.resolve()
    ])
      .then(function(results) {
        var orders = results[0];
        if (!orders || !orders.length) {
          purchasesItems.innerHTML = '<div class="empty-state">Bạn chưa có file nào được kích hoạt.</div>';
          return;
        }
        purchasesItems.innerHTML = orders.map(function(order) {
          var matched = findProductForOrder(order);

          var rawUrl = (matched && (matched.sheetUrl || matched.delivery_link || matched.fileUrl)) || order.product_file_url || "";
          var isCloud = (matched && (matched.type === "google_sheets" || !!matched.sheetUrl)) ||
                        order.product_type === "google_sheets" ||
                        (rawUrl && rawUrl.indexOf("docs.google.com/spreadsheets") !== -1);

          var deliveryUrl = getSafeDeliveryUrl(rawUrl, isCloud ? "google_sheets" : order.product_type, order.product_id);
          var btnText = isCloud ? 'Tạo bản sao Google Sheets' : 'Tải file Excel';
          
          var isSmartKho = (order.product_id === "quan-ly-kho-mini-google-sheets-smart") || (matched && matched.id === "quan-ly-kho-mini-google-sheets-smart");
          var guide = '';
          if (isCloud) {
            guide = '<p style="font-size:.78rem;color:var(--muted);margin:0 0 8px 0;">Mở link → Đăng nhập Google → Bấm Tạo bản sao. File sẽ lưu vào Google Drive của bạn.</p>';
            if (isSmartKho) {
              guide += '<div style="font-size:.78rem;background:rgba(4,120,87,0.1);padding:8px;border-radius:6px;color:var(--mint-strong); margin-bottom:4px;">' +
                '<b>🚀 CÀI ĐẶT WEB APP (Chỉ làm 1 lần):</b><br>' +
                '1. Mở bản sao vừa tạo, bấm menu <b>Kho Mini Smart > Mở ứng dụng quản lý kho</b><br>' +
                '2. Cấp quyền bảo mật: Bấm <b>Continue > Chọn Email > Allow</b><br>' +
                '3. Màn hình báo thành công: <b>Đóng tab đó lại</b> và quay về trang tính bấm mở lại ứng dụng lần nữa!' +
              '</div>' +
              '<a href="/huong-dan-kho-smart.mp4" target="_blank" style="font-size:.75rem; color:var(--mint); text-decoration:underline;">▶ Xem video hướng dẫn 15s</a>';
            }
          }

          return '<div class="drawer-item" style="flex-direction: column; align-items: flex-start; gap: 8px;">' +
                   '<div class="drawer-item-info">' +
                     '<span class="drawer-item-title">' + escapeHtml(order.product_name) + '</span>' +
                     '<span class="drawer-item-price" style="color:var(--mint-strong); font-size: 0.8rem;">Đã thanh toán: ' + formatCurrency(order.amount) + '</span>' +
                   '</div>' +
                   '<a href="' + escapeHtml(deliveryUrl) + '" target="_blank" rel="noopener noreferrer" class="button-primary button-full" style="padding: 6px 0; font-size: 0.9rem; text-decoration: none; text-align: center;">' + btnText + '</a>' +
                   guide +
                 '</div>';
        }).join("");
      })
      .catch(function(err) {
        purchasesItems.innerHTML = '<div class="empty-state">Lỗi kết nối. Vui lòng thử lại.</div>';
      });
  }

  function renderFolders() {
    var categoryOptions = [{ id: "all", name: "Tất cả" }].concat(data.categories);
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
        renderFolders();
        renderProducts();
      });
    });
  }

  function renderPriceFilter() {
    if (!priceGrid) return;
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
        renderPriceFilter();
        renderProducts();
      });
    });
  }

  function renderProducts() {
    var category = getActiveCategory();
    var items = getFilteredProducts().filter(matchesSearch);
    if (catalogTitle) catalogTitle.textContent = category ? category.name : "Tất cả sản phẩm";
    if (catalogDescription) catalogDescription.textContent = category ? category.description : "Toàn bộ file Excel và Google Sheets đang có trên cửa hàng.";

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
        return (
          '<div class="product-card" data-detail-id="' + escapeHtml(product.id) + '">' +
            renderProductThumb(product) +
            '<div class="product-info">' +
              '<div class="product-main">' +
                '<div class="product-name">' + escapeHtml(product.name) + '</div>' +
                '<div class="product-summary">' + escapeHtml(product.description || "File quản lý dễ dùng, tự động tổng hợp số liệu.") + '</div>' +
              '</div>' +
              '<div class="product-price">' +
                (product.originalPrice && product.originalPrice > product.price 
                  ? '<div class="product-price-original-row">' +
                      '<span class="product-original-val">' + formatCurrency(product.originalPrice) + '</span>' +
                      '<span class="product-discount-pill">-' + Math.round((1 - product.price / product.originalPrice) * 100) + '%</span>' +
                    '</div>' 
                  : '') +
                '<div class="product-current-val">' + formatCurrency(product.price) + '</div>' +
              '</div>' +
              '<div class="product-card-actions">' +
                '<button class="btn-card-buy" type="button" data-buy-id="' + escapeHtml(product.id) + '">Mua ngay</button>' +
                '<button class="btn-card-cart" type="button" data-cart-id="' + escapeHtml(product.id) + '" title="Thêm vào giỏ hàng">' +
                  '<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      })
      .join("");

    Array.prototype.forEach.call(productGrid.querySelectorAll(".product-card"), function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("[data-buy-id]") || e.target.closest("[data-cart-id]")) {
          return;
        }
        var prodId = card.getAttribute("data-detail-id");
        if (prodId) openDetail(prodId);
      });
    });

    Array.prototype.forEach.call(productGrid.querySelectorAll("[data-buy-id]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var prodId = btn.getAttribute("data-buy-id");
        buyNow(prodId);
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
    if (!checkoutItems) return;
    if (!detailedCart.length) {
      checkoutItems.innerHTML =
        '<div class="empty-state">Chưa có file nào trong giỏ hàng.</div>';
      return;
    }

    checkoutItems.innerHTML = detailedCart
      .map(function (item) {
        return (
          '<div class="summary-line">' +
          "<span>" +
          escapeHtml(item.product.name) +
          "</span>" +
          "<strong>" +
          formatCurrency(item.total) +
          "</strong>" +
          "</div>"
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

    // Content inside scrollable body
    detailBody.innerHTML =
      '<div style="display:flex; flex-direction:column; gap: 16px;">' +
      renderDetailThumb(product) +
      '<p class="detail-desc" style="line-height:1.6; color:#475569; margin:0;">' + escapeHtml(product.description) + '</p>' +
      suitableHtml +
      deliveryHtml +
      (product.usageGuide ? '<div class="detail-section"><strong>Dùng nhanh:</strong> ' + escapeHtml(product.usageGuide) + '</div>' : '') +
      highlightsHtml +
      (product.sheets && product.sheets.length ? '<div class="detail-section"><strong>Gồm:</strong> ' + escapeHtml(product.sheets.join(', ')) + '</div>' : '') +
      '<div style="height: 12px;"></div>' +
      '</div>';

    detailBody.scrollTop = 0;

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
    var typeLabel = isCombo ? "Combo Tiết Kiệm" : (isGoogleSheet ? "Google Sheets · Apps Script" : "Excel");
    var typeClass = isCombo ? " is-combo" : (isGoogleSheet ? " is-google-sheets" : " is-excel");
    
    var autoBadge = (!product.tag && product.originalPrice && product.originalPrice > product.price)
      ? '<span class="product-tag" style="position:absolute; top:8px; right:8px; background:#ef4444; color:white; font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.15); z-index:2;">-' + Math.round((1 - product.price / product.originalPrice) * 100) + '%</span>'
      : '';
    var badgeHtml = product.tag
      ? '<span class="product-tag" style="position:absolute; top:8px; right:8px; background:#ef4444; color:white; font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.15); z-index:2;">' + escapeHtml(product.tag) + '</span>'
      : autoBadge;

    if (product.previewImageUrl) {
      return (
        '<div class="product-thumb" style="position:relative; background-image:url(&quot;' +
        escapeHtml(product.previewImageUrl) +
        '&quot;); background-size: cover; background-position: center; color: transparent;">' +
        '<span class="product-type-badge' + typeClass + '">' + typeLabel + '</span>' +
        badgeHtml +
        '</div>'
      );
    }
    return '<div class="product-thumb" style="position:relative;">FILE<span class="product-type-badge' + typeClass + '">' + typeLabel + '</span>' + badgeHtml + '</div>';
  }

  function renderDetailThumb(product) {
    if (product.previewImageUrl) {
      return (
        '<div class="detail-thumb-container" style="background:#f8fafc; border-radius:12px; overflow:hidden; border:1px solid var(--line); display:flex; align-items:center; justify-content:center; max-height:360px;">' +
        '<img src="' + escapeHtml(product.previewImageUrl) + '" alt="' + escapeHtml(product.name) + '" style="max-width:100%; max-height:360px; width:auto; height:auto; object-fit:contain; display:block;" />' +
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
    if (state.user) {
      if (quickPhone) quickPhone.value = getResolvedPhone();
      if (quickPassGroup) quickPassGroup.style.display = "none";
      if (quickEmailGroup) quickEmailGroup.style.display = "none";
    }
  }

  function handleConfirmPaymentClicked() {
    showToast("Hệ thống đang kiểm tra tự động. Nếu đã chuyển, file sẽ mở sau vài giây!");
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
      var phoneInput = quickPhone.value.trim();
      var phone = normalizePhone(phoneInput);
      if (!isValidPhone(phone)) {
        showToast("Vui lòng nhập đúng số điện thoại/Zalo (9–11 số).");
        if (btnQuickSubmit) btnQuickSubmit.disabled = false;
        return;
      }

      var password = quickPassword.value;
      if (!password || password.length < 6) {
        showToast("Mật khẩu cần ít nhất 6 ký tự để bảo mật.");
        if (btnQuickSubmit) btnQuickSubmit.disabled = false;
        return;
      }

      var emailInput = quickEmail ? quickEmail.value.trim() : "";
      var email = (emailInput && emailInput.indexOf("@") !== -1) ? emailInput.toLowerCase() : "";
      var authEmail = email || (phone + "@khachhang.filedilam.vn");

      showToast("Đang tạo thông tin đơn hàng...");

      auth.createUserWithEmailAndPassword(authEmail, password)
        .then(function(result) {
          state.user = result.user;
          state.profile = { email: email || authEmail, phone: phone, user_id: result.user.uid };
          saveProfile({ email: email || authEmail, phone: phone, auth_provider: "phone_password" });
          createOrderAndRenderQr({ customer_phone: phone, customer_email: email || authEmail });
        })
        .catch(function(error) {
          var code = error && error.code ? String(error.code) : "";
          if (code.indexOf("email-already-in-use") !== -1) {
            // SĐT này đã có tài khoản -> thử đăng nhập bằng mật khẩu vừa nhập
            auth.signInWithEmailAndPassword(authEmail, password)
              .then(function(result) {
                state.user = result.user;
                createOrderAndRenderQr({ customer_phone: phone, customer_email: email || authEmail });
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
    if (bankTransferNote) bankTransferNote.textContent = "Đang tạo mã...";

    // Chuyển sang Step 2 ngay lập tức
    if (checkoutAuthStep) checkoutAuthStep.style.display = "none";
    if (checkoutPaymentStep) checkoutPaymentStep.style.display = "block";
    if (checkoutModalTitle) checkoutModalTitle.textContent = "Quét mã QR thanh toán";
    resetQrActions();
    if (qrBox) qrBox.innerHTML = '<div class="empty-state" style="padding:40px 0;"><div style="font-weight:600; font-size: 0.95rem; color: var(--muted); margin-bottom: 4px;">Đang tạo mã VietQR...</div><div style="font-size: 0.8rem; color: var(--muted);">Vui lòng chờ trong giây lát</div></div>';

    var productNames = state.cart.map(function(e) {
      var p = getProductById(e.productId);
      return p ? p.name : '';
    }).filter(Boolean).join(" + ");

    var orderData = {
      customer_email: email,
      customer_phone: phone,
      product_id: product.id,
      product_name: productNames || product.name,
      product_file_url: product.sheetUrl || product.delivery_link || product.fileUrl || "./outputs/1_Quan_Ly_Kho_Sample.xlsx",
      product_type: (product.type === "google_sheets" || !!product.sheetUrl) ? "google_sheets" : "excel",
      amount: getCartTotal()
    };

    authFetch("/orders", {
      method: "POST",
      body: JSON.stringify(orderData)
    })
    .then(function(resData) {
      if (bankTransferNote) bankTransferNote.textContent = resData.transfer_note;
      if (bankAmount) bankAmount.textContent = formatCurrency(resData.amount || getCartTotal());

      var qrUrl = "https://img.vietqr.io/image/" + vietQrCode + "-" + accNo + "-compact.png?amount=" + resData.amount + "&addInfo=" + encodeURIComponent(resData.transfer_note) + "&accountName=" + encodeURIComponent(owner);
      currentQrImageUrl = qrUrl;

      if (qrBox) {
        qrBox.innerHTML = '<img src="' + qrUrl + '" alt="Mã QR chuyển khoản" style="max-width:220px; width:100%; height:auto; border-radius:8px; display:block; margin:0 auto;" />';
      }

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

    // Render Order Summary Bar
    var firstItem = state.cart.find(function(entry) {
      return !!getProductById(entry.productId);
    }) || state.cart[0];
    var product = getProductById(firstItem ? firstItem.productId : null);
    var total = getCartTotal();
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
        createOrderAndRenderQr({ customer_phone: resolvedPhone, customer_email: state.user.email });
      } else {
        // Đã đăng nhập nhưng chưa có SĐT (ví dụ tài khoản Google lần đầu)
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
    checkoutModal.classList.remove("is-open");
    checkoutModal.setAttribute("aria-hidden", "true");
    unlockBodyIfNeeded();
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
    showToast("Đã lưu ảnh QR. Hãy mở App Bank để quét từ thư viện ảnh!");
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
    showToast("Đang tải ảnh mã QR...");
    fetch(currentQrImageUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("Network error");
        return res.blob();
      })
      .then(function (blob) {
        downloadBlobDirectly(blob, "ma-qr-filedilam.png");
      })
      .catch(function () {
        downloadViaImgElement("ma-qr-filedilam.png");
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
        // Universal Link / Web Link của VietQR (các ngân hàng)
        var link = document.createElement("a");
        link.href = targetUrl;
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
    var interval = setInterval(function() {
      authFetch("/orders/" + orderId)
      .then(data => {
        if (data.status === "PAID") {
          clearInterval(interval);
          state.cart = [];
          persistCart();
          renderCart();
          closeCheckout();
          if (quickBuyForm) quickBuyForm.reset();
          
          var matched = findProductForOrder(data);
          var rawUrl = (matched && (matched.sheetUrl || matched.delivery_link || matched.fileUrl)) || data.product_file_url || "";
          var isCloud = (matched && (matched.type === "google_sheets" || !!matched.sheetUrl)) ||
                        data.product_type === "google_sheets" ||
                        (rawUrl && rawUrl.indexOf("docs.google.com/spreadsheets") !== -1);
          var deliveryUrl = getSafeDeliveryUrl(rawUrl, isCloud ? "google_sheets" : data.product_type, data.product_id);
          var btnText = isCloud ? 'Tạo bản sao Google Sheets' : 'Tải file Excel';
          var descText = isCloud ? "Bấm nút bên dưới, đăng nhập Google rồi chọn Tạo bản sao. File sẽ được lưu trong Drive của bạn." : "Đơn hàng đã được xác nhận. Bạn có thể tải file ngay hoặc mở lại trong File của tôi.";
          
          var isSmartKho = (data.product_id === "quan-ly-kho-mini-google-sheets-smart") || (matched && matched.id === "quan-ly-kho-mini-google-sheets-smart");
          var setupText = '';
          if (isCloud && isSmartKho) {
            setupText = '<div style="text-align:left;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:14px;margin:16px 0;color:#065f46;font-size:.9rem;line-height:1.55"><b>Mở Web App rất nhanh:</b><br>1. Tạo bản sao và mở file trong Google Drive.<br>2. Tải lại trang một lần để thấy menu <b>📦 Kho Mini Smart</b>.<br>3. Chọn <b>Mở ứng dụng quản lý kho</b> và cấp quyền Google lần đầu.<br><br>Không cần vào Extensions, không cần tự triển khai Apps Script và không cần dán link <b>/exec</b>. Sau đó dùng được trên điện thoại, iPad hoặc máy tính.</div>';
          }
          
          detailBody.innerHTML =
            '<div style="text-align:center; padding: 40px 20px;">' +
            '<div style="font-size: 64px; margin-bottom: 16px;">🎉</div>' +
            '<h3 style="color: var(--mint-strong); margin-bottom: 12px; font-size: 1.5rem;">Thanh toán thành công!</h3>' +
            "<p style='color: var(--muted); margin-bottom: 24px;'>" + descText + "</p>" +
            setupText +
            '<a href="' + escapeHtml(deliveryUrl) + '" target="_blank" rel="noopener noreferrer" class="button-primary button-full" style="height: 50px; font-size: 1.1rem; text-decoration: none;">' + btnText + '</a>' +
            "</div>";
          detailTitle.textContent = "Nhận File Của Bạn";
          if (detailFooter) detailFooter.innerHTML = "";
          detailModal.classList.add("is-open");
          detailModal.setAttribute("aria-hidden", "false");
          document.body.classList.add("drawer-open");
          showToast("Đã thanh toán thành công!");
          document.getElementById("confirmPayment").textContent = "Tôi đã chuyển khoản xong";
          document.getElementById("confirmPayment").disabled = false;
        }
      });
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

  function getCartTotal() {
    return state.cart.reduce(function (sum, entry) {
      var product = getProductById(entry.productId);
      return sum + (product ? product.price * entry.quantity : 0);
    }, 0);
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
      (authModal && authModal.classList.contains("is-open"));

    if (!hasOpenLayer) {
      document.body.classList.remove("drawer-open");
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

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();
