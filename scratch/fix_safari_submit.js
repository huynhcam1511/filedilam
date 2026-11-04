const fs = require('fs');

// 1. Update storefront.js
let sf = fs.readFileSync('storefront.js', 'utf8');

// A. Make sure event listener handles BOTH form submit and button click/touchend
const oldListeners = 'if (quickBuyForm) quickBuyForm.addEventListener("submit", handleQuickBuySubmit);';
const newListeners = `if (quickBuyForm) {
      quickBuyForm.addEventListener("submit", handleQuickBuySubmit);
    }
    if (btnQuickSubmit) {
      btnQuickSubmit.addEventListener("click", function (e) {
        // Prevent double trigger if submit fires, but ensure execution if submit is swallowed by Safari
        if (e && e.type === "click") {
          handleQuickBuySubmit(e);
        }
      });
    }`;

if (!sf.includes(oldListeners)) {
  console.error("Could not find oldListeners in storefront.js");
  process.exit(1);
}
sf = sf.replace(oldListeners, newListeners);

// B. Improve handleQuickBuySubmit with safety unlock, auth timeout, and touch support
const oldAuthSection = `    var auth = firebase.auth();
    if (btnQuickSubmit) btnQuickSubmit.disabled = true;

    var customerEmail = emailInput;
    var authEmail = phone + "@khachhang.filedilam.vn";
    var autoPassword = "FDL@" + phone + "#2026";

    showToast("Đang tạo thông tin đơn hàng...");

    function finalizeOrder(user) {
      state.user = user;
      state.profile = { full_name: fullName, email: customerEmail, phone: phone, user_id: user.uid };
      saveProfile({ full_name: fullName, email: customerEmail, phone: phone, auth_provider: "quick_checkout" });
      createOrderAndRenderQr({
        customer_name: fullName,
        customer_phone: phone,
        customer_email: customerEmail
      });
      if (btnQuickSubmit) btnQuickSubmit.disabled = false;
    }`;

const newAuthSection = `    var auth = firebase.auth();
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
    }`;

if (!sf.includes(oldAuthSection)) {
  console.error("Could not find oldAuthSection in storefront.js");
  process.exit(1);
}
sf = sf.replace(oldAuthSection, newAuthSection);

// C. In the catch blocks of createUserWithEmailAndPassword, ensure safety timer cleared & button restored
const oldCatchBottom = `            showToast(authErrorMessage(error, "register"));
            if (btnQuickSubmit) btnQuickSubmit.disabled = false;
          }
        }
      });`;

const newCatchBottom = `            showToast(authErrorMessage(error, "register"));
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
      });`;

if (!sf.includes(oldCatchBottom)) {
  console.error("Could not find oldCatchBottom in storefront.js");
  process.exit(1);
}
sf = sf.replace(oldCatchBottom, newCatchBottom);

fs.writeFileSync('storefront.js', sf, 'utf8');
console.log('Successfully updated storefront.js');

// 2. Update storefront.css to ensure touch-action and clickability on mobile Safari
let css = fs.readFileSync('storefront.css', 'utf8');
const oldBtnPlaceOrder = `.btn-place-order {
  height: 46px !important;
  font-size: 0.98rem !important;
  font-weight: 600 !important;
  border-radius: 10px !important;
  background: #059669 !important;
  color: #ffffff !important;
  margin-top: 10px !important;
  box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25) !important;
  transition: all 0.2s ease !important;
}`;

const newBtnPlaceOrder = `.btn-place-order {
  height: 46px !important;
  font-size: 0.98rem !important;
  font-weight: 600 !important;
  border-radius: 10px !important;
  background: #059669 !important;
  color: #ffffff !important;
  margin-top: 10px !important;
  box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25) !important;
  transition: all 0.2s ease !important;
  cursor: pointer !important;
  -webkit-tap-highlight-color: transparent !important;
  touch-action: manipulation !important;
  user-select: none !important;
  -webkit-user-select: none !important;
}`;

if (css.includes(oldBtnPlaceOrder)) {
  css = css.replace(oldBtnPlaceOrder, newBtnPlaceOrder);
  fs.writeFileSync('storefront.css', css, 'utf8');
  console.log('Successfully updated storefront.css');
} else {
  console.log('oldBtnPlaceOrder not matched, skipping css or already updated');
}

// 3. Update index.html cache buster
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/storefront\.js\?v=\d+/, 'storefront.js?v=196');
html = html.replace(/storefront\.css\?v=\d+/, 'storefront.css?v=324');
fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully bumped cache busters in index.html to js?v=196 and css?v=324');
