const ADMIN_EMAIL = 'huynhkiencam151102@gmail.com';

document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  const adminSection = document.getElementById('adminSection');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');

  // Khôi phục trạng thái sidebar từ localStorage
  const isSidebarCollapsed = localStorage.getItem('admin_sidebar_collapsed') === 'true';
  if (isSidebarCollapsed && adminSection) {
    adminSection.classList.add('sidebar-collapsed');
    document.body.classList.add('is-sidebar-collapsed');
  }

  const floatingBurgerBtn = document.getElementById('floatingBurgerBtn');

  function updateBurgerVisibility(collapsed) {
    if (floatingBurgerBtn) {
      floatingBurgerBtn.style.display = collapsed ? 'inline-flex' : 'none';
    }
  }

  updateBurgerVisibility(isSidebarCollapsed);

  if (floatingBurgerBtn) {
    floatingBurgerBtn.addEventListener('click', () => {
      if (!adminSection) return;
      adminSection.classList.remove('sidebar-collapsed');
      document.body.classList.remove('is-sidebar-collapsed');
      updateBurgerVisibility(false);
      try {
        localStorage.setItem('admin_sidebar_collapsed', 'false');
      } catch (e) {}
    });
  }

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
      if (!adminSection) return;
      const collapsed = adminSection.classList.toggle('sidebar-collapsed');
      document.body.classList.toggle('is-sidebar-collapsed', collapsed);
      updateBurgerVisibility(collapsed);
      try {
        localStorage.setItem('admin_sidebar_collapsed', collapsed ? 'true' : 'false');
      } catch (e) {}
    });
  }
  
  const productForm = document.getElementById('productForm');
  const submitBtn = document.getElementById('submitBtn');
  const toast = document.getElementById('toast');
  const productListBody = document.getElementById('productListBody');

  // Firebase services
  if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore || !firebase.storage || !firebase.apps.length) {
    document.getElementById('authStatusTitle').textContent = 'Không tải được kết nối Admin';
    document.getElementById('authStatusDesc').textContent = 'Vui lòng tải lại trang để thử kết nối Google.';
    document.getElementById('authSpinner').classList.add('hidden');
    loginBtn.classList.remove('hidden');
    loginBtn.querySelector('span').textContent = 'Tải lại trang';
    loginBtn.addEventListener('click', () => window.location.reload());
    return;
  }
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();

  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.background = isError ? '#ef4444' : '#10b981';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // --- TAB LOGIC ---
  const tabItems = document.querySelectorAll('.sidebar-menu li');
  const tabPanes = document.querySelectorAll('.tab-pane');

  function switchTab(tabId) {
    tabItems.forEach(item => {
      if (item.dataset.tab === tabId) item.classList.add('active');
      else item.classList.remove('active');
    });
    tabPanes.forEach(pane => {
      if (pane.id === tabId) pane.classList.add('active');
      else pane.classList.remove('active');
    });
    if (tabId === 'productsTab') {
      loadProducts();
    } else if (tabId === 'ordersTab') {
      loadAdminOrders();
    } else if (tabId === 'statsTab') {
      loadAdminStats();
    } else if (tabId === 'couponsTab') {
      loadCoupons();
    } else if (tabId === 'adsTab') {
      loadAdsCampaigns();
    }
  }

  tabItems.forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  document.getElementById('goAddProductBtn').addEventListener('click', () => {
    switchTab('addTab');
  });

  // --- AUTH LOGIC ---
  // Profile chip dropdown toggle
  const profileChip = document.getElementById('profileChip');
  const profileDropdown = document.getElementById('profileDropdown');
  if (profileChip && profileDropdown) {
    profileChip.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => {
      profileDropdown.classList.remove('show');
    });
  }

  // --- AUTH LOGIC ---
  let isAutoLoggingIn = false;
  let hasAttemptedAutoLogin = false;

  async function triggerGoogleLogin(isManual = false) {
    const authStatusTitle = document.getElementById('authStatusTitle');
    const authStatusDesc = document.getElementById('authStatusDesc');
    const authSpinner = document.getElementById('authSpinner');
    
    if (authStatusTitle) authStatusTitle.textContent = 'Đang kết nối Google';
    if (authStatusDesc) authStatusDesc.textContent = 'Vui lòng chọn tài khoản Admin trong cửa sổ đăng nhập...';
    if (authSpinner) authSpinner.classList.remove('hidden');
    if (loginBtn) loginBtn.classList.add('hidden');

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      isAutoLoggingIn = true;
      hasAttemptedAutoLogin = true;
      await auth.signInWithPopup(provider);
    } catch (error) {
      console.warn('Google sign-in exception:', error);
      if (authSpinner) authSpinner.classList.add('hidden');
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (authStatusTitle) authStatusTitle.textContent = 'Yêu cầu đăng nhập Admin';
      
      if (error.code === 'auth/popup-blocked') {
        if (authStatusDesc) authStatusDesc.textContent = 'Trình duyệt đã chặn popup tự động. Vui lòng bấm nút bên dưới để mở cửa sổ Google:';
      } else if (error.code === 'auth/popup-closed-by-user') {
        if (authStatusDesc) authStatusDesc.textContent = 'Cửa sổ đăng nhập đã đóng. Bấm nút bên dưới để thử lại:';
      } else {
        if (authStatusDesc) authStatusDesc.textContent = error.message || 'Không thể xác thực tự động. Vui lòng bấm nút để thử lại:';
      }
    } finally {
      isAutoLoggingIn = false;
    }
  }

  auth.onAuthStateChanged(user => {
    const authStatusTitle = document.getElementById('authStatusTitle');
    const authStatusDesc = document.getElementById('authStatusDesc');
    const authSpinner = document.getElementById('authSpinner');

    if (user && user.email === ADMIN_EMAIL) {
      const adminDisplayName = document.getElementById('adminDisplayName');
      const adminDisplayEmail = document.getElementById('adminDisplayEmail');
      const adminAvatarImg = document.getElementById('adminAvatarImg');
      const name = user.displayName || 'Kien Cam Huynh';
      if (adminDisplayName) adminDisplayName.textContent = name;
      if (adminDisplayEmail) adminDisplayEmail.textContent = user.email || ADMIN_EMAIL;
      
      const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=059669&color=fff&size=64&bold=true`;
      if (adminAvatarImg) {
        adminAvatarImg.onerror = () => {
          adminAvatarImg.onerror = null;
          adminAvatarImg.src = fallbackAvatar;
        };
        if (user.photoURL) {
          adminAvatarImg.src = user.photoURL;
        } else {
          adminAvatarImg.src = fallbackAvatar;
        }
      }
    }

    if (user) {
      const adminTopHeader = document.getElementById('adminTopHeader');
      if (user.email === ADMIN_EMAIL) {
        if (adminTopHeader) adminTopHeader.classList.remove('hidden');
        loginSection.classList.add('hidden');
        adminSection.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        loadProducts(); // Load table
      } else {
        auth.signOut();
        showToast('Tài khoản không có quyền truy cập Admin', true);
        if (authSpinner) authSpinner.classList.add('hidden');
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (authStatusTitle) authStatusTitle.textContent = 'Truy cập bị từ chối';
        if (authStatusDesc) authStatusDesc.textContent = `Tài khoản ${user.email} không phải Admin. Vui lòng đăng nhập đúng tài khoản.`;
      }
    } else {
      loginSection.classList.remove('hidden');
      adminSection.classList.add('hidden');
      const adminTopHeader = document.getElementById('adminTopHeader');
      if (adminTopHeader) adminTopHeader.classList.add('hidden');
      logoutBtn.classList.add('hidden');

      // Tự động kích hoạt Google popup nếu chưa thử
      if (!isAutoLoggingIn && !hasAttemptedAutoLogin) {
        triggerGoogleLogin(false);
      } else if (!isAutoLoggingIn) {
        if (authSpinner) authSpinner.classList.add('hidden');
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (authStatusTitle && authStatusTitle.textContent === 'Đang kết nối Google') authStatusTitle.textContent = 'Đăng nhập Admin';
      }
    }
  });

  if (loginBtn) {
    loginBtn.addEventListener('click', () => triggerGoogleLogin(true));
  }

  logoutBtn.addEventListener('click', () => auth.signOut());

  // --- PRODUCT MANAGEMENT ---
  function formatCurrency(val) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  const API_BASE = "https://us-central1-filedilam.cloudfunctions.net/api";

  async function adminFetch(endpoint, options = {}) {
    const user = auth.currentUser;
    if (!user) throw new Error("Chưa đăng nhập Admin");
    const token = await user.getIdToken();
    const headers = {
      ...(options.headers || {}),
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    };
    const targetUrl = endpoint.startsWith('http') ? endpoint : (API_BASE + endpoint);
    const res = await fetch(targetUrl, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || ("Lỗi server " + res.status));
    }
    return res.json();
  }

  let currentProducts = [];

  async function loadProducts() {
    try {
      const snapshot = await db.collection('products').get();
      currentProducts = [];
      
      snapshot.forEach(doc => {
        currentProducts.push({ ...doc.data(), id: doc.id });
      });

      // Update counters in Toolbar & Sidebar
      const totalNum = currentProducts.length;
      const countEl = document.getElementById('productTotalNum');
      const sidebarBadge = document.getElementById('sidebarProductCount');
      if (countEl) countEl.textContent = totalNum;
      if (sidebarBadge) sidebarBadge.textContent = totalNum;

      renderFilteredProducts();
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
      if (productListBody) {
        productListBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #ef4444; padding: 32px;">Lỗi tải dữ liệu: ' + escapeHtml(error.message) + '</td></tr>';
      }
    }
  }

  function renderFilteredProducts() {
    if (!productListBody) return;
    const searchVal = (document.getElementById('productSearchInput')?.value || document.getElementById('topGlobalSearch')?.value || '').trim().toLowerCase();
    const catVal = document.getElementById('productCategoryFilter')?.value || 'ALL';
    const formatVal = document.getElementById('productFormatFilter')?.value || 'ALL';

    const filtered = currentProducts.filter(p => {
      let pNormCat = p.categoryId || 'kinh-doanh';
      if (['ban-hang-online', 'quan-ly-kho', 'fnb-cost', 'combo'].includes(pNormCat)) pNormCat = 'kinh-doanh';
      if (['cong-no', 'thu-chi-dong-tien'].includes(pNormCat)) pNormCat = 'ke-toan';
      const matchCat = catVal === 'ALL' || p.categoryId === catVal || pNormCat === catVal;
      const pFormat = p.type || (p.sheetUrl ? 'google_sheets' : 'excel');
      const matchFormat = formatVal === 'ALL' || pFormat === formatVal || (formatVal === 'google_sheets' && (pFormat === 'google_sheets' || p.sheetUrl));
      if (!matchCat || !matchFormat) return false;

      if (!searchVal) return true;
      const name = String(p.name || '').toLowerCase();
      const id = String(p.id || '').toLowerCase();
      return name.includes(searchVal) || id.includes(searchVal);
    });

    if (!filtered.length) {
      productListBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--slate-muted); padding: 40px;">Không tìm thấy sản phẩm nào phù hợp.</td></tr>';
      return;
    }

    const catMap = {
      'kinh-doanh': 'Kinh doanh',
      'nhan-su': 'Nhân sự',
      'cong-viec': 'Công việc',
      'marketing': 'Marketing',
      'ke-toan': 'Kế toán',
      'phat-trien-ban-than': 'Phát triển bản thân',
      // Tương thích ngược với các file cũ trên Firestore
      'ban-hang-online': 'Kinh doanh',
      'fnb-cost': 'Kinh doanh',
      'quan-ly-kho': 'Kinh doanh',
      'cong-no': 'Kế toán',
      'thu-chi-dong-tien': 'Kế toán',
      'combo': 'Kinh doanh'
    };

    productListBody.innerHTML = filtered.map(p => {
      const catName = catMap[p.categoryId] || p.categoryId || 'Khác';
      let formatHtml = '<span style="font-size:0.85rem; font-weight:500; color:#475569;">Excel (.xlsx)</span>';
      if (p.type === 'apps_script' || p.type === 'web_app') {
        formatHtml = '<span style="font-size:0.85rem; font-weight:500; color:#7c3aed;">Web App (Apps Script)</span>';
      } else if (p.type === 'combo') {
        formatHtml = '<span style="font-size:0.85rem; font-weight:500; color:#b45309;">Combo File</span>';
      } else if (p.type === 'google_sheets' || p.sheetUrl) {
        formatHtml = '<span style="font-size:0.85rem; font-weight:500; color:#059669;">Google Sheets</span>';
      }
      
      const downloads = p.downloads_count || 0;
      const statusHtml = '<span class="badge-status badge-status-paid"><span class="status-dot"></span>Đang bán</span>';

      return `
        <tr>
          <td>
            <div style="width: 44px; height: 44px; border-radius: 6px; background-image: url('${escapeHtml(p.previewImageUrl || '')}'); background-size: cover; background-position: center; background-color: #f8fafc; border: 1px solid #e2e8f0;"></div>
          </td>
          <td>
            <div style="font-weight: 600; color: #0f172a; font-size: 0.9rem;">${escapeHtml(p.name)}</div>
            <div style="font-size: 0.75rem; color: #64748b; font-family: monospace; margin-top: 2px;">${escapeHtml(p.id)}</div>
          </td>
          <td>
            <span style="font-size: 0.85rem; color: #334155; font-weight: 500;">${escapeHtml(catName)}</span>
          </td>
          <td>${formatHtml}</td>
          <td>
            <strong style="color: var(--mint-primary); font-size: 0.92rem;">${formatCurrency(p.price)}</strong>
            ${p.originalPrice ? `<div style="font-size:0.75rem; color:#94a3b8; text-decoration:line-through;">${formatCurrency(p.originalPrice)}</div>` : ''}
            ${p.hasCoaching && p.coachingPrice ? `<div style="font-size:0.74rem; color:#b45309; font-weight:600; margin-top:2px;">+ Kèm: ${formatCurrency(p.coachingPrice)}</div>` : ''}
          </td>
          <td>
            <span style="font-weight: 600; color: #334155; font-size: 0.88rem;">${downloads}</span>
            <span style="font-size: 0.76rem; color: #64748b;"> lượt</span>
          </td>
          <td>${statusHtml}</td>
          <td style="text-align: right;">
            <div class="action-menu-wrap">
              <button type="button" class="action-dots-btn btn-product-dots" data-id="${p.id}" title="Thao tác">
                <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
              </button>
              <div class="action-dropdown-popover" id="popover-product-${p.id}">
                <button type="button" class="action-dropdown-item btn-edit" data-id="${p.id}">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  <span>Chỉnh sửa</span>
                </button>
                <button type="button" class="action-dropdown-item danger btn-delete" data-id="${p.id}">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  <span>Xóa file</span>
                </button>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    bindProductActions();
  }

  function bindProductActions() {
    // 3-dots popover dropdown listeners
    document.querySelectorAll('.btn-product-dots').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wrap = btn.closest('.action-menu-wrap');
        const popover = wrap?.querySelector('.action-dropdown-popover');
        const isShown = popover?.classList.contains('show');
        document.querySelectorAll('.action-dropdown-popover.show').forEach(p => p.classList.remove('show'));
        document.querySelectorAll('.action-dots-btn.active').forEach(b => b.classList.remove('active'));
        if (!isShown && popover) {
          popover.classList.add('show');
          btn.classList.add('active');
        }
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const targetBtn = e.currentTarget;
        const id = targetBtn.dataset.id;
        if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này không? Khách hàng sẽ không thấy sản phẩm này trên web nữa.')) {
          try {
            targetBtn.disabled = true;
            await db.collection('products').doc(id).delete();
            showToast('Đã xóa sản phẩm.');
            loadProducts();
          } catch (error) {
            showToast('Lỗi khi xóa: ' + error.message, true);
            targetBtn.disabled = false;
          }
        }
      });
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget;
        const id = targetBtn.dataset.id;
        const product = currentProducts.find(p => p.id === id);
        if (product) {
          document.getElementById('editingProductId').value = id;
          document.getElementById('formTitle').textContent = 'Sửa Sản Phẩm';
          document.getElementById('formDescription').textContent = 'Cập nhật thông tin cho sản phẩm đang chọn.';
          document.getElementById('submitBtn').textContent = 'Cập nhật sản phẩm';
          const topSubmitText = document.getElementById('topSubmitText');
          if (topSubmitText) topSubmitText.textContent = 'Cập nhật sản phẩm';
          
          document.getElementById('productName').value = product.name || '';
          document.getElementById('productCategory').value = product.categoryId || '';
          document.getElementById('productFormat').value = product.type || (product.sheetUrl ? 'google_sheets' : 'excel');
          document.getElementById('productPrice').value = new Intl.NumberFormat('vi-VN').format(product.price || 0);
          document.getElementById('productOriginalPrice').value = product.originalPrice ? new Intl.NumberFormat('vi-VN').format(product.originalPrice) : '';
          document.getElementById('productTag').value = product.tag || '';
          document.getElementById('productSuitableFor').value = product.suitableFor || '';
          document.getElementById('productDescription').value = product.description || '';
          const rawContent = product.featuresDetail || (product.highlights || []).map(h => '- ' + h).join('\n');
          document.getElementById('productFeatures').value = rawContent;
          if (typeof visualEditor !== 'undefined' && visualEditor) {
            visualEditor.innerHTML = convertRawToVisualHtml(rawContent);
          }
          document.getElementById('productSheetUrl').value = product.sheetUrl || '';

          // Load gallery
          selectedGalleryFiles = [];
          if (Array.isArray(product.gallery) && product.gallery.length > 0) {
            existingGalleryUrls = product.gallery.slice();
          } else if (Array.isArray(product.images) && product.images.length > 0) {
            existingGalleryUrls = product.images.slice();
          } else {
            existingGalleryUrls = [];
          }
          renderGalleryPreviews();

          var chkCoaching = document.getElementById('productHasCoaching');
          var grpCoaching = document.getElementById('coachingFieldsGroup');
          var inpCoachingPrice = document.getElementById('productCoachingPrice');
          var inpCoachingTitle = document.getElementById('productCoachingTitle');
          if (chkCoaching) chkCoaching.checked = !!product.hasCoaching;
          if (grpCoaching) grpCoaching.style.display = product.hasCoaching ? 'block' : 'none';
          if (inpCoachingPrice) inpCoachingPrice.value = product.coachingPrice ? new Intl.NumberFormat('vi-VN').format(product.coachingPrice) : '';
          if (inpCoachingTitle) inpCoachingTitle.value = product.coachingTitle || '';

          updateFormatFields();
          document.getElementById('productImage').required = false;
          switchTab('addTab');
          window.scrollTo(0, 0);
        }
      });
    });
  }

  // Format price inputs dynamically
  const priceInput = document.getElementById('productPrice');
  if (priceInput) {
    priceInput.addEventListener('input', function(e) {
      let val = e.target.value.replace(/\D/g, '');
      if (val) {
        e.target.value = new Intl.NumberFormat('vi-VN').format(parseInt(val, 10));
      } else {
        e.target.value = '';
      }
    });
  }

  const originalPriceInput = document.getElementById('productOriginalPrice');
  if (originalPriceInput) {
    originalPriceInput.addEventListener('input', function(e) {
      let val = e.target.value.replace(/\D/g, '');
      if (val) {
        e.target.value = new Intl.NumberFormat('vi-VN').format(parseInt(val, 10));
      } else {
        e.target.value = '';
      }
    });
  }

  const coachingPriceInput = document.getElementById('productCoachingPrice');
  if (coachingPriceInput) {
    coachingPriceInput.addEventListener('input', function(e) {
      let val = e.target.value.replace(/\D/g, '');
      if (val) {
        e.target.value = new Intl.NumberFormat('vi-VN').format(parseInt(val, 10));
      } else {
        e.target.value = '';
      }
    });
  }

  const coachingCheckbox = document.getElementById('productHasCoaching');
  const coachingGroup = document.getElementById('coachingFieldsGroup');
  if (coachingCheckbox && coachingGroup) {
    coachingCheckbox.addEventListener('change', function() {
      coachingGroup.style.display = coachingCheckbox.checked ? 'block' : 'none';
    });
  }

  const formatSelect = document.getElementById('productFormat');
  const sheetGroup = document.getElementById('sheetUrlGroup');
  const fileGroup = document.getElementById('fileUploadGroup');

  function updateFormatFields() {
    const val = formatSelect ? formatSelect.value : 'google_sheets';
    if (val === 'google_sheets' || val === 'apps_script') {
      if (sheetGroup) sheetGroup.style.display = 'block';
      if (fileGroup) fileGroup.style.display = 'none';
    } else if (val === 'excel') {
      if (sheetGroup) sheetGroup.style.display = 'none';
      if (fileGroup) fileGroup.style.display = 'block';
    } else { // combo
      if (sheetGroup) sheetGroup.style.display = 'block';
      if (fileGroup) fileGroup.style.display = 'block';
    }
  }
  if (formatSelect) {
    formatSelect.addEventListener('change', updateFormatFields);
    updateFormatFields();
  }

  
  
  // Helper to convert legacy markdown/text into visual HTML for the editor
  function convertRawToVisualHtml(raw) {
    if (!raw) return '';
    if (/<[a-z][\s\S]*>/i.test(raw)) {
      return raw; // Already HTML
    }
    const lines = raw.split('\n');
    let out = '';
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) {
        if (inList) { out += '</ul>'; inList = false; }
        continue;
      }
      if (line.startsWith('###')) {
        if (inList) { out += '</ul>'; inList = false; }
        out += '<h3>' + line.replace(/^###\s*/, '') + '</h3>';
      } else if (line.startsWith('####')) {
        if (inList) { out += '</ul>'; inList = false; }
        out += '<h4>' + line.replace(/^####\s*/, '') + '</h4>';
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList) { out += '<ul>'; inList = true; }
        let txt = line.replace(/^[-*]\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        out += '<li>' + txt + '</li>';
      } else {
        if (inList) { out += '</ul>'; inList = false; }
        let txt = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        out += '<p>' + txt + '</p>';
      }
    }
    if (inList) out += '</ul>';
    return out;
  }

  // --- MULTI-IMAGE GALLERY STATE ---
  let selectedGalleryFiles = []; // Array of { file: File, previewUrl: string }
  let existingGalleryUrls = [];  // Array of string URLs from edited product

  function renderGalleryPreviews() {
    const container = document.getElementById('galleryPreviewGrid');
    if (!container) return;
    container.innerHTML = '';

    // Render existing URLs
    existingGalleryUrls.forEach((url, idx) => {
      const item = document.createElement('div');
      item.className = 'gallery-thumb-item';
      item.innerHTML = '<img src="' + url + '" alt="Gallery ' + (idx + 1) + '">' +
        '<button type="button" class="gallery-thumb-remove" title="Xóa ảnh này" data-type="existing" data-index="' + idx + '">&times;</button>';
      container.appendChild(item);
    });

    // Render newly selected files
    selectedGalleryFiles.forEach((itemObj, idx) => {
      const item = document.createElement('div');
      item.className = 'gallery-thumb-item';
      item.innerHTML = '<img src="' + itemObj.previewUrl + '" alt="Mới ' + (idx + 1) + '">' +
        '<button type="button" class="gallery-thumb-remove" title="Bỏ chọn" data-type="new" data-index="' + idx + '">&times;</button>';
      container.appendChild(item);
    });

    // Update label text
    const totalCount = existingGalleryUrls.length + selectedGalleryFiles.length;
    const btnText = document.getElementById('galleryBtnText');
    if (btnText) {
      if (totalCount > 0) {
        btnText.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg> Đã chọn ' + totalCount + ' ảnh con';
      } else {
        btnText.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Chọn nhiều ảnh con (Screenshots)';
      }
    }

    // Attach remove handlers
    container.querySelectorAll('.gallery-thumb-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const type = btn.dataset.type;
        const index = parseInt(btn.dataset.index, 10);
        if (type === 'existing') {
          existingGalleryUrls.splice(index, 1);
        } else if (type === 'new') {
          if (selectedGalleryFiles[index] && selectedGalleryFiles[index].previewUrl) {
            URL.revokeObjectURL(selectedGalleryFiles[index].previewUrl);
          }
          selectedGalleryFiles.splice(index, 1);
        }
        renderGalleryPreviews();
      });
    });
  }

  const galleryInput = document.getElementById('productGallery');
  if (galleryInput) {
    galleryInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      files.forEach(f => {
        selectedGalleryFiles.push({
          file: f,
          previewUrl: URL.createObjectURL(f)
        });
      });
      galleryInput.value = ''; // Reset input so same file can be picked again
      renderGalleryPreviews();
    });
  }

  
  // --- WYSIWYG VISUAL EDITOR CONTROLS ---
  const visualEditor = document.getElementById('productFeaturesEditor');
  const featuresHiddenInput = document.getElementById('productFeatures');
  const headingSelect = document.getElementById('saasHeadingSelect');
  const btnTemplate = document.getElementById('btnSaasInsertTemplate');

  if (visualEditor) {
    visualEditor.addEventListener('input', () => {
      if (featuresHiddenInput) {
        featuresHiddenInput.value = visualEditor.innerHTML.trim();
      }
    });

    document.querySelectorAll('.saas-btn[data-cmd]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        document.execCommand(cmd, false, null);
        visualEditor.focus();
        if (featuresHiddenInput) featuresHiddenInput.value = visualEditor.innerHTML.trim();
      });
    });

    if (headingSelect) {
      headingSelect.addEventListener('change', () => {
        const tag = headingSelect.value;
        if (tag === 'p') {
          document.execCommand('formatBlock', false, '<p>');
        } else if (tag === 'h3') {
          document.execCommand('formatBlock', false, '<h3>');
        } else if (tag === 'h4') {
          document.execCommand('formatBlock', false, '<h4>');
        }
        visualEditor.focus();
        if (featuresHiddenInput) featuresHiddenInput.value = visualEditor.innerHTML.trim();
      });
    }

    if (btnTemplate) {
      btnTemplate.addEventListener('click', (e) => {
        e.preventDefault();
        const templateHtml = `
          <h3>1. KHỞI TẠO & PHÂN QUYỀN</h3>
          <ul>
            <li><strong>Thiết lập danh mục:</strong> Cài đặt bảng thông số hệ thống tự động</li>
            <li><strong>Phân quyền Google Drive:</strong> Bảo mật dữ liệu riêng tư từng nhân viên</li>
          </ul>
          <h3>2. QUẢN LÝ DỮ LIỆU & NGHIỆP VỤ</h3>
          <ul>
            <li><strong>Thao tác thuận tiện:</strong> Nhập liệu trực tiếp, chống trùng sót đơn hàng</li>
            <li><strong>Theo dõi tiến độ:</strong> Tự động tính toán công nợ và trạng thái</li>
          </ul>
          <h3>3. BÁO CÁO & DASHBOARD TỰ ĐỘNG</h3>
          <ul>
            <li><strong>Biểu đồ trực quan:</strong> Cập nhật số liệu kinh doanh theo thời gian thực</li>
            <li><strong>Đo lường hiệu suất:</strong> Hỗ trợ ra quyết định nhanh chóng</li>
          </ul>
          <p></p>
        `;
        visualEditor.focus();
        document.execCommand('insertHTML', false, templateHtml);
        if (featuresHiddenInput) featuresHiddenInput.value = visualEditor.innerHTML.trim();
      });
    }
  }

  // --- UPLOAD LOGIC ---
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const editingId = document.getElementById('editingProductId').value;
    const name = document.getElementById('productName').value;
    const categoryId = document.getElementById('productCategory').value;
    const format = document.getElementById('productFormat').value;
    const priceRaw = document.getElementById('productPrice').value.replace(/\D/g, '');
    const price = parseInt(priceRaw, 10) || 0;
    const originalPriceRaw = (document.getElementById('productOriginalPrice').value || '').replace(/\D/g, '');
    const originalPrice = parseInt(originalPriceRaw, 10) || 0;
    const tag = (document.getElementById('productTag').value || '').trim();
    const suitableFor = (document.getElementById('productSuitableFor').value || '').trim();
    const description = document.getElementById('productDescription').value;
    const featuresRaw = document.getElementById('productFeatures').value;
    const highlights = featuresRaw.split('\n').map(l => l.replace(/^- /, '').trim()).filter(l => l);
    
    const imageFile = document.getElementById('productImage').files[0];
    const excelFile = document.getElementById('productFile').files[0];
    const sheetUrl = document.getElementById('productSheetUrl').value.trim();

    const hasCoaching = document.getElementById('productHasCoaching')?.checked || false;
    const coachingPriceRaw = (document.getElementById('productCoachingPrice')?.value || '').replace(/\D/g, '');
    const coachingPrice = parseInt(coachingPriceRaw, 10) || 0;
    const coachingTitle = (document.getElementById('productCoachingTitle')?.value || '').trim();

    // If adding a new product, image is required
    if (!editingId && !imageFile) {
      showToast('Vui lòng chọn ảnh sản phẩm', true);
      return;
    }

    if (!editingId && !excelFile && !sheetUrl) {
      showToast('Vui lòng chọn file sản phẩm hoặc nhập link Google Sheets', true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang xử lý (Xin vui lòng chờ)...';
    const topSubmitText = document.getElementById('topSubmitText');
    if (topSubmitText) topSubmitText.textContent = 'Đang lưu...';

    try {
      const id = editingId || (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now());
      let updateData = {
        name,
        categoryId,
        price,
        originalPrice: originalPrice > 0 ? originalPrice : null,
        tag: tag || null,
        suitableFor: suitableFor || null,
        description,
        featuresDetail: featuresRaw,
        highlights,
        sheetUrl,
        type: format,
        delivery_link: sheetUrl || "",
        delivery: format === 'apps_script'
          ? "Nhận link tạo bản sao Google Sheets tích hợp Web App tự động vào Drive"
          : (format === 'google_sheets' 
            ? "Nhận link tạo bản sao Google Sheets vào Google Drive" 
            : (format === 'combo' ? "Nhận trọn bộ link/file combo sau thanh toán" : "Tải file Excel (.xlsx) trực tiếp")),
        fileCount: format === 'combo' ? 2 : 1,
        hasCoaching: hasCoaching,
        coachingPrice: hasCoaching && coachingPrice > 0 ? coachingPrice : null,
        coachingTitle: hasCoaching ? (coachingTitle || 'Bản Kèm 1-1 (1 buổi 1 tiếng)') : null
      };

      if (!editingId) {
        updateData.id = id;
        updateData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      }

      // Upload image if a new one is selected
      if (imageFile) {
        const imageRef = storage.ref(`products/${id}/cover_${imageFile.name}`);
        await imageRef.put(imageFile);
        updateData.previewImageUrl = await imageRef.getDownloadURL();
      }

      // Upload gallery images if any
      let finalGallery = existingGalleryUrls.slice();
      if (selectedGalleryFiles.length > 0) {
        for (let i = 0; i < selectedGalleryFiles.length; i++) {
          const item = selectedGalleryFiles[i];
          const gRef = storage.ref(`products/${id}/gallery_${Date.now()}_${i}_${item.file.name}`);
          await gRef.put(item.file);
          const gUrl = await gRef.getDownloadURL();
          finalGallery.push(gUrl);
        }
      }
      // If we have gallery items, save to both 'gallery' and 'images' for full compatibility
      updateData.gallery = finalGallery;
      updateData.images = finalGallery;

      // Upload file if a new one is selected
      if (excelFile) {
        const fileRef = storage.ref(`products/${id}/file_${excelFile.name}`);
        await fileRef.put(excelFile);
        updateData.fileUrl = await fileRef.getDownloadURL();
      }

      // Save to Firestore
      if (editingId) {
        await db.collection('products').doc(id).update(updateData);
        showToast('Cập nhật sản phẩm thành công!');
      } else {
        await db.collection('products').doc(id).set(updateData);
        showToast('Thêm sản phẩm thành công!');
      }
      
      productForm.reset();
      if (typeof visualEditor !== 'undefined' && visualEditor) visualEditor.innerHTML = '';
      selectedGalleryFiles = [];
      existingGalleryUrls = [];
      renderGalleryPreviews();
      if (document.getElementById('productHasCoaching')) document.getElementById('productHasCoaching').checked = false;
      if (document.getElementById('coachingFieldsGroup')) document.getElementById('coachingFieldsGroup').style.display = 'none';
      if (document.getElementById('productCoachingPrice')) document.getElementById('productCoachingPrice').value = '';
      if (document.getElementById('productCoachingTitle')) document.getElementById('productCoachingTitle').value = '';

      document.getElementById('editingProductId').value = '';
      document.getElementById('formTitle').textContent = 'Thêm Sản Phẩm Mới';
      document.getElementById('formDescription').textContent = 'Điền đầy đủ thông tin để đăng bán một file Excel hoặc Google Sheets mới.';
      document.getElementById('submitBtn').textContent = 'Tải lên & Đăng bán';
      const topSubmitText = document.getElementById('topSubmitText');
      if (topSubmitText) topSubmitText.textContent = 'Lưu & Đăng bán';
      document.getElementById('productImage').required = true;
      document.getElementById('imageBtnText').innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Chọn file ảnh';
      document.getElementById('fileBtnText').innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg> Chọn file đính kèm';
      updateFormatFields();
      loadProducts(); // reload list
      switchTab('productsTab'); // Go back to list
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi xử lý: ' + error.message, true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = editingId ? 'Cập nhật sản phẩm' : 'Tải lên & Đăng bán';
      const topSubmitText = document.getElementById('topSubmitText');
      if (topSubmitText) topSubmitText.textContent = editingId ? 'Cập nhật sản phẩm' : 'Lưu & Đăng bán';
    }
  });

  // --- REVENUE STATISTICS & ORDER MANAGEMENT ---
  let cachedOrders = [];
  let statsFilterPeriod = '14'; // '7', '14', '30', 'all'
  let statsFilterMonth = 'ALL';  // 'ALL' hoặc '2026-11', '2026-10',...
  let statsFilterType = 'ALL';   // 'ALL', 'STANDARD', 'COACHING'
  let statsFilterProduct = 'ALL'; // 'ALL' hoặc product_id
  let statsFilterActiveOnly = true; // Mặc định chỉ hiển thị sản phẩm đang kinh doanh trong danh mục

  function parseDateObj(val) {
    if (!val) return null;
    if (val && typeof val.toDate === 'function') return val.toDate();
    if (val && typeof val.seconds === 'number') return new Date(val.seconds * 1000);
    if (typeof val === 'number') return new Date(val > 1e11 ? val : val * 1000);
    if (typeof val === 'string') {
      const match = val.match(/seconds=(\d+)/);
      if (match) return new Date(parseInt(match[1], 10) * 1000);
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    }
    if (val instanceof Date) return val;
    return null;
  }

  function formatDateTime(val) {
    const d = parseDateObj(val);
    if (!d || isNaN(d.getTime())) {
      return { time: String(val || 'Mới'), date: '', full: String(val || 'Mới') };
    }
    const pad = n => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());

    return {
      time: `${hours}:${minutes}:${seconds}`,
      date: `${day}/${month}/${year}`,
      full: `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
    };
  }

  function parseDateObj(val) {
    if (!val) return null;
    if (val && typeof val.toDate === 'function') return val.toDate();
    if (val && typeof val.seconds === 'number') return new Date(val.seconds * 1000);
    if (typeof val === 'number') return new Date(val > 1e11 ? val : val * 1000);
    if (typeof val === 'string') {
      const match = val.match(/seconds=(\d+)/);
      if (match) return new Date(parseInt(match[1], 10) * 1000);
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    }
    if (val instanceof Date) return val;
    return null;
  }

  function formatDateTime(val) {
    const d = parseDateObj(val);
    if (!d || isNaN(d.getTime())) {
      return { time: String(val || 'Mới'), date: '', full: String(val || 'Mới') };
    }
    const pad = n => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());

    return {
      time: `${hours}:${minutes}:${seconds}`,
      date: `${day}/${month}/${year}`,
      full: `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
    };
  }

  
  // Helper: Bóc tách đơn hàng thành các sản phẩm con độc lập (hỗ trợ cả đơn lẻ, đơn combo mảng items, và đơn combo cũ dạng "A + B")
  function resolveOrderLineItems(order, knownProductsMap) {
    if (!order) return [];
    const amt = parseInt(order.amount || 0, 10);
    const productKeys = Object.keys(knownProductsMap);

    function matchCurrentProduct(str) {
      if (!str) return null;
      const s = String(str).trim().toLowerCase();
      // Nhận diện theo từ khóa đặc trưng của các sản phẩm hiện hành
      if (s.includes('bán hàng online') || s.includes('shop online')) {
        const found = productKeys.find(k => (knownProductsMap[k].name || '').toLowerCase().includes('bán hàng online') || k.includes('ban-hang-online'));
        if (found) return found;
      }
      if (s.includes('quản lý kho') || s.includes('kho mini')) {
        const found = productKeys.find(k => (knownProductsMap[k].name || '').toLowerCase().includes('kho') || k.includes('kho-mini'));
        if (found) return found;
      }
      if (s.includes('cost') || s.includes('giá vốn') || s.includes('f&b')) {
        const found = productKeys.find(k => (knownProductsMap[k].name || '').toLowerCase().includes('cost') || k.includes('cost'));
        if (found) return found;
      }
      for (const pid of productKeys) {
        const pName = (knownProductsMap[pid].name || '').trim().toLowerCase();
        if (pName && (pName === s || pName.includes(s) || s.includes(pName))) {
          return pid;
        }
      }
      return null;
    }

    // Trường hợp 1: Đơn hàng mới có mảng items[] rõ ràng
    if (Array.isArray(order.items) && order.items.length > 0) {
      const count = order.items.length;
      return order.items.map(it => {
        let pid = it.product_id || 'other';
        if (!knownProductsMap[pid]) {
          const matched = matchCurrentProduct(it.product_name || pid);
          if (matched) pid = matched;
        }
        const isCurrent = !!knownProductsMap[pid];
        const isTest = (it.product_name || '').toLowerCase().includes('[test]') || (order.product_name || '').toLowerCase().includes('[test]');
        const pName = (knownProductsMap[pid] && knownProductsMap[pid].name) || it.product_name || 'Sản phẩm';
        const pPrice = parseInt(it.price || (knownProductsMap[pid] && knownProductsMap[pid].price) || 0, 10);
        const allocatedRev = pPrice > 0 ? pPrice : Math.round(amt / count);

        return {
          productId: (isCurrent && !isTest) ? pid : '__ARCHIVED_TEST__',
          name: (isCurrent && !isTest) ? pName : '[Test / File cũ đã xóa]',
          revenue: allocatedRev,
          isCurrent: isCurrent && !isTest,
          originalName: it.product_name || pName
        };
      });
    }

    // Trường hợp 2: Đơn hàng cũ lưu tên dạng Combo "A + B"
    const rawName = String(order.product_name || '').trim();
    if (rawName.includes(' + ')) {
      const parts = rawName.split(' + ').map(s => s.trim().toLowerCase());
      const matchedList = [];

      parts.forEach(partName => {
        const foundPid = matchCurrentProduct(partName);
        if (foundPid) {
          matchedList.push({
            productId: foundPid,
            name: knownProductsMap[foundPid].name,
            revenue: 0,
            isCurrent: true,
            originalName: partName
          });
        } else {
          matchedList.push({
            productId: '__ARCHIVED_TEST__',
            name: '[Test / File cũ đã xóa]',
            revenue: 0,
            isCurrent: false,
            originalName: partName
          });
        }
      });

      if (matchedList.length > 0) {
        const splitRev = Math.round(amt / matchedList.length);
        matchedList.forEach(m => m.revenue = splitRev);
        return matchedList;
      }
    }

    // Trường hợp 3: Đơn hàng đơn lẻ
    let singlePid = order.product_id || 'other';
    let matchedPid = matchCurrentProduct(order.product_name || singlePid);
    const isTest = rawName.toLowerCase().includes('[test]') || rawName.toLowerCase().includes('thanh toán 2k');

    if (matchedPid && !isTest) {
      return [{
        productId: matchedPid,
        name: knownProductsMap[matchedPid].name,
        revenue: amt,
        isCurrent: true,
        originalName: rawName
      }];
    }

    // Không thuộc sản phẩm đang bán hoặc là đơn test -> gom gọn
    return [{
      productId: '__ARCHIVED_TEST__',
      name: '[Test / File cũ đã xóa]',
      revenue: amt,
      isCurrent: false,
      originalName: rawName
    }];
  }

  async function loadAdminStats() {
    const kpiTotalRevenue = document.getElementById('kpiTotalRevenue');
    const kpiMonthRevenue = document.getElementById('kpiMonthRevenue');
    const kpiPaidOrders = document.getElementById('kpiPaidOrders');
    const kpiCustomers = document.getElementById('kpiCustomers');
    const revenueChartContainer = document.getElementById('revenueChartContainer');
    const bestSellersContainer = document.getElementById('bestSellersContainer');

    if (!kpiTotalRevenue) return;

    if (!cachedOrders || cachedOrders.length === 0) {
      try {
        try {
          cachedOrders = await adminFetch('/admin/orders');
        } catch (apiErr) {
          const snap = await db.collection('orders').get();
          cachedOrders = [];
          snap.forEach(doc => {
            cachedOrders.push({ order_id: doc.id, ...doc.data() });
          });
        }
      } catch (e) {
        console.warn('Không tải được cachedOrders cho stats:', e);
      }
    }

    populateMonthSlicer();
    populateProductSlicer();
    renderStatsDashboard();
  }

  function populateMonthSlicer() {
    const monthSelect = document.getElementById('statsMonthSlicer');
    if (!monthSelect) return;
    
    const monthsSet = new Set();
    (cachedOrders || []).forEach(o => {
      const dObj = parseDateObj(o.created_at || o.paid_at);
      if (dObj) {
        const yyyymm = dObj.toISOString().slice(0, 7);
        monthsSet.add(yyyymm);
      }
    });

    const sortedMonths = Array.from(monthsSet).sort().reverse();
    const currentVal = monthSelect.value || 'ALL';
    
    let html = '<option value="ALL">Tất cả các tháng</option>';
    sortedMonths.forEach(m => {
      const parts = m.split('-');
      html += '<option value="' + m + '">Tháng ' + parts[1] + '/' + parts[0] + '</option>';
    });
    monthSelect.innerHTML = html;
    if (monthsSet.has(currentVal)) {
      monthSelect.value = currentVal;
    }
  }

  
  function populateProductSlicer() {
    const menu = document.getElementById('statsProductMenu');
    const input = document.getElementById('statsProductSlicer');
    const btn = document.getElementById('statsProductFilterBtn');
    if (!menu || !input) return;

    let itemsHtml = '<div class="filter-popover-item selected" data-value="ALL">Tất cả sản phẩm (' + currentProducts.length + ')</div>';
    currentProducts.forEach(p => {
      itemsHtml += '<div class="filter-popover-item" data-value="' + escapeHtml(p.id) + '">' + escapeHtml(p.name) + '</div>';
    });
    menu.innerHTML = itemsHtml;

    // Gắn sự kiện click cho các item vừa tạo
    menu.querySelectorAll('.filter-popover-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = item.dataset.value;
        input.value = val;
        statsFilterProduct = val;
        menu.querySelectorAll('.filter-popover-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        
        const isAll = val === 'ALL';
        if (btn) {
          btn.classList.toggle('active', !isAll);
          const span = btn.querySelector('span');
          if (span) {
            span.textContent = isAll ? 'Sản phẩm: Tất cả' : 'SP: ' + item.textContent.trim();
          }
        }
        menu.classList.remove('show');
        renderStatsDashboard();
      });
    });
  }

  
  function resolveProductCategory(item, knownProductsMap) {
    const s = String(item.name || item.originalName || '').toLowerCase();
    if (s.includes('kho') || s.includes('tồn kho')) return 'quan-ly-kho';
    if (s.includes('bán hàng') || s.includes('shop') || s.includes('bán lẻ')) return 'ban-hang-online';
    if (s.includes('cost') || s.includes('giá vốn') || s.includes('f&b') || s.includes('định lượng')) return 'fnb-cost';
    if (s.includes('công nợ') || s.includes('thu chi') || s.includes('dòng tiền') || s.includes('kế toán')) return 'ke-toan';
    if (s.includes('nhân sự') || s.includes('tiền lương') || s.includes('chấm công')) return 'nhan-su';
    if (s.includes('marketing') || s.includes('kế hoạch') || s.includes('content')) return 'marketing';

    const prod = knownProductsMap[item.productId];
    if (prod && prod.categoryId && prod.categoryId !== 'kinh-doanh') {
      return prod.categoryId;
    }
    return 'kinh-doanh';
  }

  function getCategoryLabel(catKey) {
    const labels = {
      'quan-ly-kho': 'Quản lý kho vận',
      'ban-hang-online': 'Bán hàng online & Shop',
      'fnb-cost': 'F&B & Tính giá vốn',
      'ke-toan': 'Kế toán & Dòng tiền',
      'kinh-doanh': 'Kinh doanh & Quản trị',
      'nhan-su': 'Nhân sự & Chấm công',
      'marketing': 'Marketing & Truyền thông',
      'cong-viec': 'Hiệu suất công việc',
      'phat-trien-ban-than': 'Phát triển bản thân',
      'combo': 'Gói Combo đa năng'
    };
    return labels[catKey] || 'Sản phẩm khác';
  }

  

  
  function calcPeakHour(hourlyMap) {
    if (!hourlyMap || !hourlyMap.length) return '20h - 21h';
    let max = 0;
    let peak = 20;
    hourlyMap.forEach((v, idx) => {
      if (v > max) {
        max = v;
        peak = idx;
      }
    });
    return peak + 'h - ' + (peak + 1) + 'h';
  }

  function calcPeakWeekday(weekdayMap) {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    if (!weekdayMap || !weekdayMap.length) return 'Thứ Sáu';
    let max = 0;
    let peak = 5;
    weekdayMap.forEach((v, idx) => {
      if (v > max) {
        max = v;
        peak = idx;
      }
    });
    return days[peak];
  }


  function renderStatsDashboard() {
    const kpiTotalRevenue = document.getElementById('kpiTotalRevenue');
    const kpiMonthRevenue = document.getElementById('kpiMonthRevenue');
    const kpiPaidOrders = document.getElementById('kpiPaidOrders');
    const kpiCustomers = document.getElementById('kpiCustomers');
    const kpiConversionRate = document.getElementById('kpiConversionRate');
    const kpiConversionRateSub = document.getElementById('kpiConversionRateSub');
    const kpiRetentionRate = document.getElementById('kpiRetentionRate');
    const kpiRetentionRateSub = document.getElementById('kpiRetentionRateSub');

    const revenueChartContainer = document.getElementById('revenueChartContainer');
    const bestSellersContainer = document.getElementById('bestSellersContainer');
    const hourlyChartContainer = document.getElementById('hourlyChartContainer');
    const categoryChartContainer = document.getElementById('categoryChartContainer');
    const weekdayChartContainer = document.getElementById('weekdayChartContainer');
    const conversionContainer = document.getElementById('conversionContainer');
    const chartTitle = document.getElementById('chartTitle');
    const chartSubTitle = document.getElementById('chartSubTitle');
    const slicerNotice = document.getElementById('slicerSummaryNotice');

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    let periodDays = statsFilterPeriod === '7' ? 7 : (statsFilterPeriod === '14' ? 14 : (statsFilterPeriod === '30' ? 30 : null));
    let cutoffTime = periodDays ? now.getTime() - periodDays * 24 * 60 * 60 * 1000 : null;

    // Map nhanh danh mục sản phẩm hiện có
    const knownProductsMap = {};
    (currentProducts || []).forEach(p => {
      knownProductsMap[p.id] = p;
    });

    const filteredOrders = (cachedOrders || []).filter(o => {
      const dObj = parseDateObj(o.created_at || o.paid_at);
      if (!dObj) return false;

      if (statsFilterMonth === 'ALL' && cutoffTime && dObj.getTime() < cutoffTime) {
        return false;
      }

      if (statsFilterMonth !== 'ALL') {
        const yyyymm = dObj.toISOString().slice(0, 7);
        if (yyyymm !== statsFilterMonth) return false;
      }

      const isCoaching = o.package_type === 'coaching' || parseInt(o.amount || 0, 10) >= 199000;
      if (statsFilterType === 'STANDARD' && isCoaching) return false;
      if (statsFilterType === 'COACHING' && !isCoaching) return false;

      // Lọc theo sản phẩm đã chọn
      if (statsFilterProduct && statsFilterProduct !== 'ALL') {
        const lineItems = resolveOrderLineItems(o, knownProductsMap);
        const hasMatchingProduct = lineItems.some(it => it.productId === statsFilterProduct);
        if (!hasMatchingProduct) return false;
      }

      return true;
    });

    if (slicerNotice) {
      slicerNotice.textContent = 'Lọc: ' + filteredOrders.length + ' đơn được chọn';
    }

    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let coachingCount = 0;
    const customers = new Set();
    const productMap = {};
    const categoryMap = {};
    const hourlyMap = Array(24).fill(0);
    const weekdayMap = Array(7).fill(0); // 0: CN, 1: T2, ..., 6: T7
    const weekdayRevMap = Array(7).fill(0);
    const chartDataMap = {};
    const isAllTime = statsFilterPeriod === 'all' && statsFilterMonth === 'ALL';

    if (statsFilterMonth !== 'ALL') {
      const parts = statsFilterMonth.split('-').map(Number);
      const y = parts[0];
      const m = parts[1];
      const daysInMonth = new Date(y, m, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const ds = y + '-' + String(m).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        chartDataMap[ds] = { key: ds, label: String(day), dayNum: day, fullDate: ds, revenue: 0, count: 0 };
      }
      if (chartTitle) chartTitle.textContent = 'Biểu đồ Doanh thu (Tháng ' + m + '/' + y + ')';
      if (chartSubTitle) chartSubTitle.textContent = 'Thời gian: Tháng ' + m + '/' + y + ' (Trục hoành: Ngày trong tháng)';
    } else if (periodDays) {
      for (let i = periodDays - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const ds = d.toISOString().slice(0, 10);
        chartDataMap[ds] = { key: ds, label: String(parseInt(ds.slice(8, 10), 10)), monthStr: ds.slice(5, 7), fullDate: ds, revenue: 0, count: 0 };
      }
      const startDateObj = new Date(now.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000);
      const startStr = String(startDateObj.getDate()).padStart(2, '0') + '/' + String(startDateObj.getMonth() + 1).padStart(2, '0') + '/' + startDateObj.getFullYear();
      const endStr = String(now.getDate()).padStart(2, '0') + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
      if (chartTitle) chartTitle.textContent = 'Biểu đồ Doanh thu (' + periodDays + ' ngày qua)';
      if (chartSubTitle) chartSubTitle.textContent = 'Thời gian: ' + startStr + ' - ' + endStr + ' (Trục hoành: Ngày trong tháng)';
    } else {
      if (chartTitle) chartTitle.textContent = 'Biểu đồ Doanh thu (Toàn thời gian theo Tháng)';
      if (chartSubTitle) chartSubTitle.textContent = 'Doanh số (Cột Pastel) & Số lượng đơn hàng (Đường xu hướng)';
    }

    filteredOrders.forEach(o => {
      const status = String(o.status || '').toUpperCase();
      const isPaid = status === 'PAID';
      const amt = parseInt(o.amount || 0, 10);
      const isCoaching = o.package_type === 'coaching' || amt >= 199000;

      if (isPaid) {
        paidCount++;
        const cId = o.customer_phone || o.customer_email || o.user_id;
        if (cId) customers.add(cId);
        if (isCoaching) coachingCount++;

        const dObj = parseDateObj(o.created_at || o.paid_at);
        if (dObj) {
          const hour = dObj.getHours();
          hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;

          const dow = dObj.getDay();
          weekdayMap[dow] = (weekdayMap[dow] || 0) + 1;
        }

        const lineItems = resolveOrderLineItems(o, knownProductsMap);
        let effectiveOrderRev = 0;
        lineItems.forEach(it => {
          if (statsFilterProduct !== 'ALL' && it.productId !== statsFilterProduct) {
            return;
          }
          effectiveOrderRev += it.revenue;

          const key = it.productId;
          const displayName = it.name;
          if (!productMap[key]) {
            productMap[key] = {
              id: key,
              name: displayName,
              count: 0,
              revenue: 0,
              isCurrent: it.isCurrent
            };
          }
          productMap[key].count += 1;
          productMap[key].revenue += it.revenue;

          const catKey = resolveProductCategory(it, knownProductsMap);
          if (!categoryMap[catKey]) {
            categoryMap[catKey] = {
              key: catKey,
              label: getCategoryLabel(catKey),
              count: 0,
              revenue: 0
            };
          }
          categoryMap[catKey].count += 1;
          categoryMap[catKey].revenue += it.revenue;
        });

        totalRevenue += effectiveOrderRev;

        if (dObj) {
          const dow = dObj.getDay();
          weekdayRevMap[dow] = (weekdayRevMap[dow] || 0) + effectiveOrderRev;

          if (isAllTime) {
            const monthKey = dObj.toISOString().slice(0, 7);
            const mParts = monthKey.split('-');
            const monthLabel = 'T' + parseInt(mParts[1], 10) + '/' + mParts[0].slice(2);
            if (!chartDataMap[monthKey]) {
              chartDataMap[monthKey] = { key: monthKey, label: monthLabel, fullDate: 'Tháng ' + mParts[1] + '/' + mParts[0], revenue: 0, count: 0 };
            }
            chartDataMap[monthKey].revenue += effectiveOrderRev;
            chartDataMap[monthKey].count += 1;
          } else {
            const ds = dObj.toISOString().slice(0, 10);
            if (chartDataMap[ds]) {
              chartDataMap[ds].revenue += effectiveOrderRev;
              chartDataMap[ds].count += 1;
            }
          }
        }
      } else {
        pendingCount++;
      }
    });

    // Tính toán tỷ lệ chuyển đổi & Khách hàng lặp lại (Retention)
    const totalOrdersInFilter = paidCount + pendingCount;
    const payRate = totalOrdersInFilter > 0 ? Math.round((paidCount / totalOrdersInFilter) * 100) : 0;
    const coachingRate = paidCount > 0 ? Math.round((coachingCount / paidCount) * 100) : 0;

    const customerPaidCounts = {};
    (cachedOrders || []).forEach(o => {
      if (String(o.status || '').toUpperCase() === 'PAID') {
        const id = o.customer_phone || o.customer_email || o.user_id;
        if (id) customerPaidCounts[id] = (customerPaidCounts[id] || 0) + 1;
      }
    });
    let returningCount = 0;
    customers.forEach(id => {
      if ((customerPaidCounts[id] || 0) >= 2) returningCount++;
    });
    const totalUniqueCust = customers.size;
    const repeatRate = totalUniqueCust > 0 ? Math.round((returningCount / totalUniqueCust) * 100) : 0;

    // Cập nhật 6 KPI CELLS
    const aov = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;
    if (kpiTotalRevenue) kpiTotalRevenue.textContent = formatCurrency(totalRevenue);
    if (kpiMonthRevenue) kpiMonthRevenue.textContent = formatCurrency(aov);
    if (kpiPaidOrders) kpiPaidOrders.textContent = paidCount + ' đơn';
    if (kpiCustomers) kpiCustomers.textContent = totalUniqueCust + ' khách';
    if (kpiConversionRate) kpiConversionRate.textContent = payRate + '%';
    if (kpiConversionRateSub) kpiConversionRateSub.textContent = paidCount + '/' + totalOrdersInFilter + ' đơn tạo';
    if (kpiRetentionRate) kpiRetentionRate.textContent = repeatRate + '%';
    if (kpiRetentionRateSub) kpiRetentionRateSub.textContent = returningCount + '/' + totalUniqueCust + ' khách lặp';

    // 1. Biểu đồ Doanh thu (COMBO CHART: Cột Pastel Doanh thu + Line Số đơn, KHÔNG đè chữ, NO '6đ')
    const dailyList = Object.values(chartDataMap).sort((a, b) => a.key.localeCompare(b.key));
    const revenues = dailyList.map(d => d.revenue);
    const orderCounts = dailyList.map(d => d.count);
    const maxRev = Math.max(...revenues, 50000);
    const maxCount = Math.max(...orderCounts, 5);

    if (revenueChartContainer) {
      if (!dailyList.length) {
        revenueChartContainer.innerHTML = '<div style="margin: auto; color: var(--muted); font-size: 0.85rem;">Không có dữ liệu trong khoảng thời gian này.</div>';
      } else {
        const itemMinWidth = isAllTime ? 60 : (dailyList.length > 20 ? 30 : (dailyList.length <= 14 ? 48 : 34));
        const chartHeight = 160;
        const totalItems = dailyList.length;
        const linePoints = [];

        dailyList.forEach((d, idx) => {
          const y = chartHeight - Math.round((d.count / maxCount) * (chartHeight - 40)) - 14;
          linePoints.push({ idx, y, rev: d.revenue, count: d.count, key: d.key });
        });

        // Pastel Palette: Cột Mint Pastel mềm mại (#bbf7d0), viền nhạt
        const barsHtml = dailyList.map((d, idx) => {
          const barHeightPx = d.revenue > 0 ? Math.max(Math.round((d.revenue / maxRev) * (chartHeight - 45)), 8) : 2;
          const displayLabel = d.label || d.key;
          const isToday = d.key === todayStr;
          const barColor = d.revenue > 0 ? '#bbf7d0' : '#f8fafc';

          return (
            '<div style="flex: ' + (dailyList.length > 14 ? '0 0 ' + itemMinWidth + 'px' : '1') + '; min-width: ' + itemMinWidth + 'px; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative;" title="' + (d.fullDate || d.key) + '&#10;• Doanh thu: ' + formatCurrency(d.revenue) + '&#10;• Số đơn: ' + d.count + ' đơn">' +
              (d.revenue > 0 ? '<div style="position: absolute; bottom: ' + (barHeightPx + 16) + 'px; z-index: 5; font-size: 0.62rem; font-weight: 700; color: #059669; font-family: monospace; white-space: nowrap; pointer-events: none;">' + (Math.round(d.revenue / 1000) + 'k') + '</div>' : '') +
              '<div style="width: 100%; max-width: 16px; height: ' + barHeightPx + 'px; background: ' + barColor + '; border-radius: 2px 2px 0 0; transition: height 0.3s ease; position: relative;"></div>' +
              '<div style="font-size: 0.67rem; color: ' + (isToday ? '#059669' : '#64748b') + '; font-weight: ' + (isToday ? '700' : '400') + '; margin-top: 5px; white-space: nowrap;">' + displayLabel + '</div>' +
            '</div>'
          );
        }).join('');

        const svgPathD = linePoints.map((pt, i) => {
          const xPercent = ((i + 0.5) / totalItems) * 100;
          return (i === 0 ? 'M ' : 'L ') + xPercent + ' ' + pt.y;
        }).join(' ');

        // Bỏ hoàn toàn marker chấm tròn (<circle>), chỉ giữ text số đơn hàng thanh lịch phía trên đỉnh đường line khi có đơn
        const dotsSvg = linePoints.filter(pt => pt.count > 0).map(pt => {
          const xPercent = ((pt.idx + 0.5) / totalItems) * 100;
          return '<text x="' + xPercent + '%" y="' + (pt.y - 5) + '" text-anchor="middle" font-size="8.5" font-weight="700" fill="#047857" font-family="monospace">' + pt.count + '</text>';
        }).join('');

        revenueChartContainer.innerHTML = (
          '<div style="width: 100%; height: 100%; display: flex; flex-direction: column;">' +
            '<div style="display: flex; justify-content: flex-end; gap: 14px; font-size: 0.7rem; color: #64748b; margin-bottom: 6px;">' +
              '<span style="display: flex; align-items: center; gap: 5px;"><span style="display:inline-block; width:10px; height:7px; background:#bbf7d0; border-radius:1px;"></span>Cột: Doanh thu</span>' +
              '<span style="display: flex; align-items: center; gap: 5px;"><span style="display:inline-block; width:12px; height:2px; background:#10b981;"></span>Đường: Số đơn</span>' +
            '</div>' +
            '<div style="width: 100%; height: ' + chartHeight + 'px; display: flex; align-items: flex-end; position: relative; min-width: ' + (dailyList.length * itemMinWidth) + 'px;">' +
              '<svg style="position: absolute; top: 0; left: 0; width: 100%; height: ' + chartHeight + 'px; pointer-events: none; z-index: 4;" preserveAspectRatio="none" viewBox="0 0 100 ' + chartHeight + '">' +
                '<path d="' + svgPathD + '" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></path>' +
              '</svg>' +
              '<svg style="position: absolute; top: 0; left: 0; width: 100%; height: ' + chartHeight + 'px; pointer-events: none; z-index: 5;">' +
                dotsSvg +
              '</svg>' +
              barsHtml +
            '</div>' +
          '</div>'
        );
      }
    }

    // 2. Top File Bán Chạy Nhất (PASTEL HORIZONTAL BAR CHART)
    const bestSellers = Object.values(productMap).sort((a, b) => {
      if (a.id === '__ARCHIVED_TEST__') return 1;
      if (b.id === '__ARCHIVED_TEST__') return -1;
      return b.revenue - a.revenue;
    }).slice(0, 5);

    if (bestSellersContainer) {
      if (!bestSellers.length) {
        bestSellersContainer.innerHTML = '<div style="margin: 20px 0; text-align: center; color: var(--muted); font-size: 0.85rem;">Chưa có dữ liệu bán hàng.</div>';
      } else {
        const maxItemRev = Math.max(...bestSellers.map(b => b.revenue), 1);
        // Palette pastel dịu
        const barPastelColors = ['#6ee7b7', '#7dd3fc', '#fde047', '#c4b5fd', '#cbd5e1'];

        bestSellersContainer.innerHTML = bestSellers.map((item, idx) => {
          const rank = idx + 1;
          const pct = Math.max(Math.round((item.revenue / maxItemRev) * 100), 4);
          const color = barPastelColors[idx % barPastelColors.length];

          return (
            '<div style="margin-bottom: 10px;">' +
              '<div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 0.77rem; margin-bottom: 3px;">' +
                '<div style="min-width: 0; flex: 1; margin-right: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' +
                  '<span style="font-weight: 700; color: #475569; font-family: monospace; margin-right: 6px;">0' + rank + '</span>' +
                  '<span style="font-weight: 600; color: #1e293b;">' + escapeHtml(item.name) + '</span>' +
                '</div>' +
                '<div style="font-weight: 700; color: #0f172a; font-family: monospace; flex-shrink: 0;">' + formatCurrency(item.revenue) + '</div>' +
              '</div>' +
              '<div style="width: 100%; height: 6px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 2px; overflow: hidden;">' +
                '<div style="width: ' + pct + '%; height: 100%; background: ' + color + '; border-radius: 2px; transition: width 0.4s ease;"></div>' +
              '</div>' +
              '<div style="display: flex; justify-content: space-between; font-size: 0.69rem; color: #64748b; margin-top: 2px;">' +
                '<span>' + item.count + ' lượt mua thành công</span>' +
                '<span>' + (totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0) + '% doanh số</span>' +
              '</div>' +
            '</div>'
          );
        }).join('');
      }
    }

    // 3. Khung Giờ Mua Hàng Sôi Động Nhất (PASTEL COLUMN BAR CHART)
    if (hourlyChartContainer) {
      const maxHourly = Math.max(...hourlyMap, 1);
      const peakHourCount = Math.max(...hourlyMap);

      hourlyChartContainer.innerHTML = hourlyMap.map((cnt, hr) => {
        const heightPct = Math.max(Math.round((cnt / maxHourly) * 100), 4);
        const isPeak = cnt === peakHourCount && cnt > 0;
        // Pastel: Peak là Mint #10b981, thường là #a7f3d0, rỗng là #f8fafc
        const barColor = isPeak ? '#10b981' : (cnt > 0 ? '#a7f3d0' : '#f8fafc');
        const showLabel = hr % 3 === 0;

        return (
          '<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; height: 100%; justify-content: flex-end;" title="' + hr + ':00 - ' + hr + ':59: ' + cnt + ' đơn mua">' +
            '<div style="font-size: 0.64rem; font-weight: 700; color: ' + (isPeak ? '#047857' : '#059669') + '; font-family: monospace;">' + (cnt > 0 ? cnt : '') + '</div>' +
            '<div style="width: 100%; max-width: 13px; height: ' + heightPct + 'px; background: ' + barColor + '; border-radius: 2px 2px 0 0; transition: height 0.3s ease;"></div>' +
            '<div style="font-size: 0.66rem; color: #64748b; font-weight: ' + (showLabel ? '600' : '400') + '; margin-top: 4px;">' + (showLabel ? (hr + 'h') : '') + '</div>' +
          '</div>'
        );
      }).join('');
    }

    // 4. Cơ Cấu Doanh Thu Theo Danh Mục (PASTEL SVG DONUT / PIE CHART)
    if (categoryChartContainer) {
      const catList = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);
      // Pastel Palette: Mint dịu, Sky pastel, Lavender pastel, Amber pastel, Rose pastel
      const pastelDonutPalette = ['#6ee7b7', '#7dd3fc', '#fde047', '#c4b5fd', '#f9a8d4', '#cbd5e1'];

      if (!catList.length || totalRevenue <= 0) {
        categoryChartContainer.innerHTML = '<div style="margin: auto; color: var(--slate-muted); font-size: 0.85rem; text-align: center; padding: 20px 0;">Chưa có dữ liệu danh mục trong kỳ.</div>';
      } else {
        const radius = 38;
        const circumference = 2 * Math.PI * radius; // ~238.76
        let strokeOffset = 0;

        const donutSlicesSvg = catList.map((c, i) => {
          const ratio = c.revenue / totalRevenue;
          const sliceLen = ratio * circumference;
          const color = pastelDonutPalette[i % pastelDonutPalette.length];
          const sliceSvg = '<circle cx="55" cy="55" r="' + radius + '" fill="transparent" stroke="' + color + '" stroke-width="14" stroke-dasharray="' + sliceLen.toFixed(1) + ' ' + (circumference - sliceLen).toFixed(1) + '" stroke-dashoffset="' + (-strokeOffset).toFixed(1) + '" transform="rotate(-90 55 55)"></circle>';
          strokeOffset += sliceLen;
          return sliceSvg;
        }).join('');

        const donutSvg = (
          '<div style="display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 105px; height: 105px;">' +
            '<svg viewBox="0 0 110 110" style="width: 100%; height: 100%;">' +
              '<circle cx="55" cy="55" r="' + radius + '" fill="transparent" stroke="#f8fafc" stroke-width="14"></circle>' +
              donutSlicesSvg +
              '<text x="55" y="52" text-anchor="middle" font-size="9.5" font-weight="700" fill="#0f172a" font-family="monospace">' + (Math.round(totalRevenue / 1000) + 'k ₫') + '</text>' +
              '<text x="55" y="63" text-anchor="middle" font-size="7" font-weight="500" fill="#64748b">TỔNG</text>' +
            '</svg>' +
          '</div>'
        );

        const legendListHtml = catList.map((c, i) => {
          const pct = Math.round((c.revenue / totalRevenue) * 100);
          const color = pastelDonutPalette[i % pastelDonutPalette.length];
          return (
            '<div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.74rem; padding: 2px 0;">' +
              '<div style="display: flex; align-items: center; gap: 6px; min-width: 0;">' +
                '<span style="width: 7px; height: 7px; border-radius: 50%; background: ' + color + '; flex-shrink: 0;"></span>' +
                '<span style="font-weight: 500; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + escapeHtml(c.label) + '</span>' +
              '</div>' +
              '<div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: 8px;">' +
                '<span style="font-weight: 700; color: #0f172a; font-family: monospace;">' + pct + '%</span>' +
                '<span style="font-size: 0.7rem; color: #64748b; font-family: monospace;">' + formatCurrency(c.revenue) + '</span>' +
              '</div>' +
            '</div>'
          );
        }).join('');

        categoryChartContainer.innerHTML = (
          '<div style="display: flex; align-items: center; gap: 12px; min-height: 110px;">' +
            donutSvg +
            '<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">' +
              legendListHtml +
            '</div>' +
          '</div>'
        );
      }
    }

    // 5. Chu Kỳ Mua Hàng Theo Thứ Trong Tuần (PASTEL COLUMN BAR CHART)
    if (weekdayChartContainer) {
      const daySeq = [1, 2, 3, 4, 5, 6, 0];
      const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      const dayFullNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
      const maxWeekdayCount = Math.max(...weekdayMap, 1);
      const peakDayCount = Math.max(...weekdayMap);
      const currentDow = now.getDay();

      weekdayChartContainer.innerHTML = daySeq.map((dow, idx) => {
        const cnt = weekdayMap[dow];
        const rev = weekdayRevMap[dow];
        const heightPct = Math.max(Math.round((cnt / maxWeekdayCount) * 100), 4);
        const isPeak = cnt === peakDayCount && cnt > 0;
        const isToday = dow === currentDow;
        const barColor = isPeak ? '#10b981' : (cnt > 0 ? '#a7f3d0' : '#f8fafc');

        return (
          '<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; height: 100%; justify-content: flex-end;" title="' + dayFullNames[idx] + ': ' + cnt + ' đơn&#10;• Doanh thu: ' + formatCurrency(rev) + '">' +
            '<div style="font-size: 0.66rem; font-weight: 700; color: ' + (isPeak ? '#047857' : '#059669') + '; font-family: monospace;">' + (cnt > 0 ? (cnt + ' đơn') : '') + '</div>' +
            '<div style="width: 100%; max-width: 18px; height: ' + heightPct + 'px; background: ' + barColor + '; border-radius: 2px 2px 0 0; transition: height 0.3s ease;"></div>' +
            '<div style="font-size: 0.7rem; color: ' + (isToday ? '#059669' : '#64748b') + '; font-weight: ' + (isToday ? '700' : '400') + '; margin-top: 4px;">' + dayLabels[idx] + '</div>' +
          '</div>'
        );
      }).join('');
    }

    // 6. Chuyển Đổi & Giữ Chân Khách Hàng (TÍNH TOÁN CHUẨN XÁC, AN TOÀN TUYỆT ĐỐI)
    if (conversionContainer) {
      try {
        const peakHr = calcPeakHour(hourlyMap);
        const peakWd = calcPeakWeekday(weekdayMap);

        conversionContainer.innerHTML = (
          '<div>' +
            '<div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 3px;">' +
              '<span style="font-weight: 500; color: #1e293b;">Tỉ lệ thanh toán thành công</span>' +
              '<span style="font-weight: 700; color: #059669; font-family: monospace;">' + payRate + '% (' + paidCount + '/' + totalOrdersInFilter + ' đơn)</span>' +
            '</div>' +
            '<div style="width: 100%; height: 6px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 999px; overflow: hidden; display: flex;">' +
              '<div style="width: ' + payRate + '%; background: #6ee7b7; border-radius: 999px;"></div>' +
            '</div>' +
          '</div>' +

          '<div>' +
            '<div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 3px;">' +
              '<span style="font-weight: 500; color: #1e293b;">Khách quay lại mua lặp lại (Retention)</span>' +
              '<span style="font-weight: 700; color: #0284c7; font-family: monospace;">' + repeatRate + '% (' + returningCount + '/' + totalUniqueCust + ' khách)</span>' +
            '</div>' +
            '<div style="width: 100%; height: 6px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 999px; overflow: hidden; display: flex;">' +
              '<div style="width: ' + repeatRate + '%; background: #7dd3fc; border-radius: 999px;"></div>' +
            '</div>' +
          '</div>' +

          '<div>' +
            '<div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 3px;">' +
              '<span style="font-weight: 500; color: #1e293b;">Tỷ lệ chọn gói Kèm Coaching 1-1</span>' +
              '<span style="font-weight: 700; color: #d97706; font-family: monospace;">' + coachingRate + '% (' + coachingCount + ' đơn Kèm 1-1)</span>' +
            '</div>' +
            '<div style="width: 100%; height: 6px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 999px; overflow: hidden; display: flex;">' +
              '<div style="width: ' + coachingRate + '%; background: #fde047; border-radius: 999px;"></div>' +
            '</div>' +
          '</div>' +

          '<div style="display: flex; align-items: flex-start; gap: 8px; margin-top: 4px; padding: 8px 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.74rem; color: #475569;">' +
            '<svg width="14" height="14" fill="none" stroke="#059669" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink: 0; margin-top: 1px;"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' +
            '<div>Giờ chốt đơn nhiều nhất là <b>' + peakHr + '</b> và <b>' + peakWd + '</b>. Đăng clip hoặc chạy tin trước khung giờ này 30 phút để tối ưu tỷ lệ mua hàng.</div>' +
          '</div>'
        );
      } catch (convErr) {
        console.error("Lỗi render conversionContainer:", convErr);
        conversionContainer.innerHTML = '<div style="color: #64748b; font-size: 0.8rem; padding: 10px;">Tỉ lệ thanh toán: <b>' + payRate + '%</b> • Tỉ lệ khách lặp: <b>' + repeatRate + '%</b></div>';
      }
    }
  }

  async function loadAdminOrders() {
    const orderListBody = document.getElementById('orderListBody');
    if (!orderListBody) return;
    orderListBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--muted); padding: 32px;">Đang tải danh sách đơn hàng...</td></tr>';

    try {
      try {
        cachedOrders = await adminFetch('/admin/orders');
      } catch (apiErr) {
        console.warn("Backend /admin/orders failed, fallback to Firestore:", apiErr);
        const snap = await db.collection('orders').get();
        cachedOrders = [];
        snap.forEach(doc => {
          const d = doc.data();
          cachedOrders.push({
            order_id: doc.id,
            ...d
          });
        });
        cachedOrders.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
      }

      renderFilteredOrders();

      // Cập nhật badge số đơn PENDING trong Sidebar
      const pendingCount = cachedOrders.filter(o => (o.status || '').toUpperCase() === 'PENDING').length;
      const pendingBadge = document.getElementById('sidebarPendingOrderCount');
      if (pendingBadge) {
        if (pendingCount > 0) {
          pendingBadge.textContent = pendingCount;
          pendingBadge.style.display = 'inline-flex';
        } else {
          pendingBadge.style.display = 'none';
        }
      }

    } catch (err) {
      console.error("Lỗi tải đơn hàng:", err);
      orderListBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ef4444; padding: 32px;">Lỗi kết nối: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  let selectedOrderId = null;

  function selectOrder(orderId) {
    selectedOrderId = orderId;
    const order = (cachedOrders || []).find(o => String(o.order_id) === String(orderId));
    
    // Highlight active row in table
    document.querySelectorAll('.orders-table-canvas tbody tr').forEach(tr => {
      tr.classList.toggle('selected-row', tr.dataset.orderId === String(orderId));
    });

    renderOrderDetailInspector(order);
  }

  function renderOrderDetailInspector(order) {
    const emptyBox = document.getElementById('orderInspectorEmpty');
    const contentBox = document.getElementById('orderInspectorContent');
    if (!emptyBox || !contentBox) return;

    if (!order) {
      emptyBox.style.display = 'flex';
      contentBox.style.display = 'none';
      contentBox.innerHTML = '';
      return;
    }

    emptyBox.style.display = 'none';
    contentBox.style.display = 'block';

    const isPaid = (order.status || '').toUpperCase() === 'PAID';
    const amountVal = order.amount || 0;
    const orderId = order.order_id || '';
    const cleanPhone = String(order.customer_phone || '').replace(/\D/g, '');
    const transferNote = orderId;
    const qrImgUrl = `https://img.vietqr.io/image/TPB-59215112002-compact.png?amount=${amountVal}&addInfo=${encodeURIComponent(transferNote)}&accountName=${encodeURIComponent("HUYNH KIEN CAM")}`;
    const timeObj = formatDateTime(order.created_at || order.paid_at);
    const fileUrl = order.product_file_url || '';
    const isCoaching = order.package_type === 'coaching' || parseInt(order.amount || 0, 10) >= 199000;
    const rawEmail = order.customer_email || '';
    const isVirtualEmail = rawEmail.endsWith('@khachhang.filedilam.vn');
    const cleanEmail = isVirtualEmail ? '' : rawEmail;
    const customerName = order.customer_name || '';
    const phoneDisplay = order.customer_phone || cleanPhone || '';

    let customerInfoLines = '';
    if (customerName) customerInfoLines += `\n- Khách hàng: ${customerName}`;
    if (phoneDisplay) customerInfoLines += `\n- Số điện thoại: ${phoneDisplay}`;
    if (cleanEmail) customerInfoLines += `\n- Email nhận file: ${cleanEmail}`;

    const zaloMsg = `Chào bạn, File Đi Làm gửi bạn thông tin thanh toán đơn hàng #${orderId} (${order.product_name || 'File'}):${customerInfoLines}\n- Số tiền: ${formatCurrency(amountVal)}\n- STK: 59215112002 (TPBank - HUYNH KIEN CAM)\n- Nội dung chuyển khoản: ${orderId}\n\nSau khi chuyển khoản thành công, hệ thống sẽ tự động kích hoạt và gửi file về email của quý khách nhé!`;
    const zaloChatUrl = cleanPhone ? `https://zalo.me/${cleanPhone}` : '';
    const hasValidEmail = Boolean(cleanEmail && cleanEmail.includes('@'));

    // Chuẩn Typography Fintech tinh tế, font phẳng, không lạm dụng in đậm to sừng sững
    contentBox.innerHTML = `
      <!-- Header Flat Inspector -->
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--slate-border);">
        <div>
          <div style="font-size: 0.72rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Đơn hàng</div>
          <div style="font-size: 1.05rem; font-weight: 700; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: -0.01em; margin-top: 2px;">#${escapeHtml(orderId)}</div>
        </div>
        <div>
          ${isPaid 
            ? '<span class="badge-status badge-status-paid"><span class="status-dot"></span>Đã thanh toán</span>'
            : '<span class="badge-status badge-status-pending"><span class="status-dot"></span>Chờ thanh toán</span>'}
        </div>
      </div>

      <!-- Section 1: Thông tin giao dịch -->
      <div class="inspector-flat-section">
        <div class="inspector-flat-title">
          <span>Thông tin giao dịch</span>
          <span style="font-size: 0.72rem; font-weight: 400; text-transform: none; color: #94a3b8;">${escapeHtml(timeObj.full)}</span>
        </div>
        ${order.customer_name ? `
        <div class="inspector-row">
          <span class="inspector-label">Họ tên</span>
          <span class="inspector-val" style="font-weight: 600; color: #0f172a; font-size: 0.82rem;">${escapeHtml(order.customer_name)}</span>
        </div>` : ''}
        <div class="inspector-row">
          <span class="inspector-label">Số điện thoại</span>
          <span class="inspector-val" style="font-weight: 600; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${escapeHtml(order.customer_phone || 'Khách vãng lai')}</span>
        </div>
        ${order.customer_email ? `
        <div class="inspector-row">
          <span class="inspector-label">Email</span>
          <span class="inspector-val" style="font-size: 0.8rem; color: #64748b; font-weight: 400;">${escapeHtml(order.customer_email)}</span>
        </div>` : ''}
        <div class="inspector-row">
          <span class="inspector-label">Sản phẩm</span>
          <span class="inspector-val" style="font-weight: 500; color: #1e293b;">${escapeHtml(order.product_name || 'File')}</span>
        </div>
        ${isCoaching ? `
        <div class="inspector-row">
          <span class="inspector-label">Phân loại</span>
          <span class="inspector-val" style="color: #b45309; font-weight: 600; font-size: 0.8rem;">Gói Kèm 1-1 Chuyên sâu</span>
        </div>` : ''}
        ${order.coupon_code ? `
        <div class="inspector-row">
          <span class="inspector-label">Mã giảm giá</span>
          <span class="inspector-val" style="font-family: monospace; font-size: 0.82rem; font-weight: 700; color: #059669;">${escapeHtml(order.coupon_code)}</span>
        </div>` : ''}
        ${Number(order.discount_amount || 0) > 0 ? `
        <div class="inspector-row">
          <span class="inspector-label">Số tiền giảm</span>
          <span class="inspector-val" style="font-size: 0.86rem; color: #ef4444; font-weight: 600;">-${formatCurrency(order.discount_amount)}</span>
        </div>` : ''}
        <div class="inspector-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e2e8f0; align-items: baseline;">
          <span class="inspector-label" style="font-size: 0.84rem; font-weight: 500; color: #334155;">Thành tiền</span>
          <span class="inspector-val" style="font-size: 0.98rem; color: var(--mint-primary); font-weight: 700; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${formatCurrency(amountVal)}</span>
        </div>
      </div>

      <!-- Section 2: Mã QR Chuyển khoản VietQR -->
      <div class="inspector-flat-section" style="text-align: center;">
        <div class="inspector-flat-title" style="text-align: left;">
          <span>Mã QR Chuyển khoản</span>
          <span style="font-size: 0.72rem; font-weight: 600; color: #059669; font-family: ui-monospace, monospace;">TPBank 59215112002</span>
        </div>
        <div style="background: #ffffff; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; display: inline-block; margin: 4px auto 8px;">
          <a href="${qrImgUrl}" target="_blank" title="Nhấp xem ảnh lớn">
            <img src="${qrImgUrl}" alt="QR #${escapeHtml(orderId)}" style="width: 96px; height: 96px; object-fit: contain; display: block;" />
          </a>
        </div>
        <div style="font-size: 0.78rem; color: #64748b;">
          Nội dung CK: <span style="color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.86rem; font-weight: 700; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${escapeHtml(orderId)}</span>
        </div>
      </div>

      <!-- Section 3: Thao tác nhanh -->
      <div class="inspector-flat-section">
        <div class="inspector-flat-title">
          <span>Thao tác nhanh</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${isPaid ? `
            ${fileUrl ? `<a href="${escapeHtml(fileUrl)}" target="_blank" class="btn-inspector-action btn-inspector-primary">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              <span>Mở file Google Sheets / Drive</span>
            </a>` : ''}
            <button type="button" class="btn-inspector-action btn-inspector-secondary btn-copy-magic-link" data-uid="${escapeHtml(order.user_id || '')}" data-order="${escapeHtml(orderId)}">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              <span>Copy link nhận file cho khách</span>
            </button>
            ${cleanPhone ? `<a href="https://zalo.me/${cleanPhone}" target="_blank" class="btn-inspector-action btn-inspector-zalo">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              <span>Chat Zalo với khách (${escapeHtml(cleanPhone)})</span>
            </a>` : ''}
          ` : `
            ${hasValidEmail ? `
              <button type="button" class="btn-inspector-action btn-inspector-primary btn-send-reminder-email" data-order="${escapeHtml(orderId)}" data-email="${escapeHtml(cleanEmail)}">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <span>Gửi Email nhắc thanh toán kèm QR</span>
              </button>
            ` : ''}
            <button type="button" class="btn-inspector-action btn-inspector-secondary btn-copy-zalo-msg" data-msg="${escapeHtml(zaloMsg)}">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
              <span>Copy tin nhắn nhắc thanh toán</span>
            </button>
            ${cleanPhone ? `<a href="${zaloChatUrl}" target="_blank" class="btn-inspector-action btn-inspector-zalo">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              <span>Chat Zalo gửi QR (${escapeHtml(cleanPhone)})</span>
            </a>` : ''}
            <button type="button" class="btn-inspector-action btn-inspector-secondary btn-manual-confirm-paid" data-order="${escapeHtml(orderId)}">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
              <span>Xác nhận đã thanh toán thủ công</span>
            </button>
          `}
        </div>
      </div>
    `;

    contentBox.querySelectorAll('.btn-send-reminder-email').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const oId = btn.dataset.order || '';
        const email = btn.dataset.email || '';
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span>Đang gửi email...</span>';
        try {
          const res = await adminFetch('/admin/send-payment-reminder', {
            method: 'POST',
            body: JSON.stringify({ order_id: oId })
          });
          if (res && res.success) {
            btn.innerHTML = '<span>Đã gửi email nhắc!</span>';
            showToast(`Đã gửi email nhắc thanh toán kèm mã QR tới ${email}!`);
            setTimeout(() => {
              btn.disabled = false;
              btn.innerHTML = originalHtml;
            }, 3000);
          } else {
            throw new Error(res?.error || 'Gửi email không thành công');
          }
        } catch (err) {
          console.error("Lỗi gửi email nhắc:", err);
          btn.disabled = false;
          btn.innerHTML = originalHtml;
          showToast(`Lỗi khi gửi email: ${err.message || 'Không thể gửi email'}`, true);
        }
      });
    });

    contentBox.querySelectorAll('.btn-manual-confirm-paid').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const oId = btn.dataset.order || '';
        if (!confirm(`Xác nhận khách đã thanh toán cho đơn hàng #${oId}?\n\nHệ thống sẽ chuyển trạng thái sang PAID và tự động gửi email bàn giao link file cho khách.`)) {
          return;
        }
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span>Đang duyệt đơn...</span>';
        try {
          const res = await adminFetch('/admin/confirm-payment', {
            method: 'POST',
            body: JSON.stringify({ order_id: oId })
          });
          if (res && res.success) {
            showToast(`Đơn hàng #${oId} đã được duyệt thanh toán thành công!`);
            await loadAdminOrders();
            selectOrder(oId);
          } else {
            throw new Error(res?.error || 'Không thể duyệt đơn');
          }
        } catch (err) {
          console.error("Lỗi duyệt thanh toán:", err);
          btn.disabled = false;
          btn.innerHTML = originalHtml;
          showToast(`Lỗi duyệt đơn: ${err.message || 'Thao tác thất bại'}`, true);
        }
      });
    });

    contentBox.querySelectorAll('.btn-copy-zalo-msg').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const msg = btn.dataset.msg || '';
        navigator.clipboard.writeText(msg).then(() => {
          showToast("Đã sao chép tin nhắn nhắc thanh toán!");
        });
      });
    });

    contentBox.querySelectorAll('.btn-copy-magic-link').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const uid = btn.dataset.uid || '';
        const oId = btn.dataset.order || '';
        const originalText = btn.innerHTML;
        try {
          btn.textContent = 'Đang lấy link...';
          const res = await adminFetch('/admin/generate-magic-link', {
            method: 'POST',
            body: JSON.stringify({ user_id: uid, order_id: oId })
          });
          if (res && res.magic_url) {
            await navigator.clipboard.writeText(res.magic_url);
            btn.innerHTML = '<span>Đã copy link!</span>';
            showToast('Đã copy Magic Link! Gửi link này để khách vào thẳng kho file mà không cần mật khẩu.');
            setTimeout(() => {
              btn.innerHTML = originalText;
            }, 2500);
          } else {
            throw new Error(res?.error || 'Không tạo được link');
          }
        } catch (err) {
          console.warn("Dùng link thường fallback:", err);
          btn.innerHTML = originalText;
          const fallbackLink = `https://filedilam.web.app/?tab=my-files`;
          navigator.clipboard.writeText(fallbackLink);
          showToast('Đã copy link nhận file: https://filedilam.web.app/?tab=my-files');
        }
      });
    });
  }

    function renderFilteredOrders() {
    const orderListBody = document.getElementById('orderListBody');
    if (!orderListBody) return;
    const searchVal = (document.getElementById('orderSearchInput')?.value || '').trim().toLowerCase();
    const statusVal = document.getElementById('orderStatusFilter')?.value || 'ALL';

    const filtered = (cachedOrders || []).filter(order => {
      const matchStatus = statusVal === 'ALL' || (order.status || '').toUpperCase() === statusVal;
      if (!matchStatus) return false;

      if (!searchVal) return true;
      const oId = String(order.order_id || '').toLowerCase();
      const phone = String(order.customer_phone || '').toLowerCase();
      const name = String(order.customer_name || '').toLowerCase();
      const email = String(order.customer_email || '').toLowerCase();
      const pName = String(order.product_name || '').toLowerCase();
      return oId.includes(searchVal) || name.includes(searchVal) || phone.includes(searchVal) || email.includes(searchVal) || pName.includes(searchVal);
    });

    if (!filtered.length) {
      orderListBody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--slate-muted); padding: 32px;">Không tìm thấy đơn hàng nào phù hợp.</td></tr>';
      renderOrderDetailInspector(null);
      return;
    }

    orderListBody.innerHTML = filtered.map(order => {
      const isPaid = (order.status || '').toUpperCase() === 'PAID';
      const statusBadge = isPaid
        ? '<span class="badge-status badge-status-paid"><span class="status-dot"></span>Đã thanh toán</span>'
        : '<span class="badge-status badge-status-pending"><span class="status-dot"></span>Chờ thanh toán</span>';

      const timeObj = formatDateTime(order.created_at || order.paid_at);
      const timeHtml = timeObj.date 
        ? `<div style="font-weight: 600; color: #0f172a; font-size: 0.78rem; white-space: nowrap;">${escapeHtml(timeObj.time)}</div>` +
          `<div style="font-size: 0.70rem; color: #94a3b8; white-space: nowrap; margin-top: 1px;">${escapeHtml(timeObj.date)}</div>`
        : `<span style="font-size: 0.82rem; color: #64748b;">${escapeHtml(timeObj.time)}</span>`;

            const rawEmail = order.customer_email || '';
      const isVirtualEmail = rawEmail.endsWith('@khachhang.filedilam.vn');
      const cleanEmail = isVirtualEmail ? '' : rawEmail;
      const customerName = order.customer_name || '';
      const phoneDisplay = order.customer_phone || (order.user_id ? order.user_id.slice(0, 8) + '...' : 'Khách vãng lai');
      
      let customerHtml = '';
      if (customerName) {
        customerHtml += `<div style="font-weight: 600; color: #0f172a; font-size: 0.79rem; line-height: 1.3;">${escapeHtml(customerName)}</div>`;
        customerHtml += `<div style="font-weight: 500; color: #64748b; font-size: 0.74rem; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin-top: 1px;">${escapeHtml(phoneDisplay)}</div>`;
      } else {
        customerHtml += `<div style="font-weight: 600; color: #0f172a; font-size: 0.79rem; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${escapeHtml(phoneDisplay)}</div>`;
      }
      if (cleanEmail) {
        customerHtml += `<div style="font-size: 0.70rem; color: #94a3b8; margin-top: 1px; max-width: 145px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(cleanEmail)}">${escapeHtml(cleanEmail)}</div>`;
      }

      const orderId = order.order_id || '';
      const amountVal = order.amount || 0;
      const transferNote = orderId;
      const qrImgUrl = `https://img.vietqr.io/image/TPB-59215112002-compact.png?amount=${amountVal}&addInfo=${encodeURIComponent(transferNote)}&accountName=${encodeURIComponent("HUYNH KIEN CAM")}`;

      // Cột Mã QR VietQR thu nhỏ
      const qrThumbHtml = isPaid
        ? '<span style="color: #cbd5e1; font-size: 0.85rem;">-</span>'
        : `<a href="${qrImgUrl}" target="_blank" onclick="event.stopPropagation();" title="Nhấp để xem to hoặc nhấp chuột phải Sao chép ảnh QR" style="display:inline-block; border-radius:6px; overflow:hidden; border:1px solid #e2e8f0; line-height:0; vertical-align:middle;">
             <img src="${qrImgUrl}" alt="QR #${escapeHtml(orderId)}" style="width:32px; height:32px; object-fit:contain; display:block; cursor:pointer;" />
           </a>`;

      const isCoaching = order.package_type === 'coaching' || parseInt(order.amount || 0, 10) >= 199000;
      const coachingBadge = isCoaching
        ? '<span style="display: inline-block; margin-left: 4px; font-size: 0.68rem; font-weight: 700; background: #fef3c7; color: #b45309; padding: 1px 6px; border-radius: 4px; border: 1px solid #fde68a; vertical-align: middle;">🎓 Kèm 1-1</span>'
        : '';

      const isSelected = String(orderId) === String(selectedOrderId);
      const couponCode = order.coupon_code || '';
      const discountVal = Number(order.discount_amount || 0);

      const couponHtml = couponCode 
        ? `<span style="font-family: monospace; font-size: 0.8rem; font-weight: 700; color: #059669; background: #ecfdf5; padding: 2px 6px; border-radius: 4px; border: 1px solid #a7f3d0;">${escapeHtml(couponCode)}</span>`
        : `<span style="color: #cbd5e1; font-size: 0.85rem;">-</span>`;

      const discountHtml = discountVal > 0
        ? `<span style="color: #ef4444; font-weight: 600; font-size: 0.84rem;">-${formatCurrency(discountVal)}</span>`
        : `<span style="color: #cbd5e1; font-size: 0.85rem;">-</span>`;

      return `
        <tr data-order-id="${escapeHtml(orderId)}" class="${isSelected ? 'selected-row' : ''}">
          <td><strong style="font-size: 0.80rem; color: #1e293b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">#${escapeHtml(orderId)}</strong></td>
          <td style="white-space: nowrap;">${timeHtml}</td>
          <td>${customerHtml}</td>
          <td><div style="font-weight: 600; color: #1e293b; font-size: 0.79rem; line-height: 1.35; max-height: 2.7em; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;" title="${escapeHtml(order.product_name || 'File')}">${escapeHtml(order.product_name || 'File')}</div>${coachingBadge}</td>
          <td style="text-align: center;">${couponHtml}</td>
          <td style="text-align: right;">${discountHtml}</td>
          <td style="text-align: right;"><strong style="color: var(--mint-primary); font-size: 0.82rem; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${formatCurrency(order.amount || 0)}</strong></td>
          <td style="text-align: center;">${statusBadge}</td>
          <td style="text-align: center; vertical-align: middle;">${qrThumbHtml}</td>
        </tr>
      `;
    }).join('');

    // Attach row click listeners for selection
    orderListBody.querySelectorAll('tr[data-order-id]').forEach(tr => {
      tr.addEventListener('click', () => {
        const oId = tr.dataset.orderId;
        selectOrder(oId);
      });
    });

    // Auto-select first order if none selected or selected order not in filter
    const activeOrderExists = filtered.some(o => String(o.order_id) === String(selectedOrderId));
    if (!activeOrderExists && filtered.length > 0) {
      selectOrder(filtered[0].order_id);
    } else if (activeOrderExists) {
      selectOrder(selectedOrderId);
    }
  }
  // Event Listeners for Orders & Stats
  document.getElementById('refreshStatsBtn')?.addEventListener('click', loadAdminStats);

  // Bộ lọc khoảng thời gian doanh thu (7, 14, 30, Tất cả)
  const statsPeriodGroup = document.getElementById('statsPeriodSlicer');
  if (statsPeriodGroup) {
    statsPeriodGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-period]');
      if (!btn) return;
      statsPeriodGroup.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      statsFilterPeriod = btn.dataset.period;
      // Khi chọn số ngày, đồng bộ lại dropdown tháng về ALL
      const monthSel = document.getElementById('statsMonthSlicer');
      if (monthSel) monthSel.value = 'ALL';
      statsFilterMonth = 'ALL';
      renderStatsDashboard();
    });
  }

  // Bộ lọc doanh thu theo tháng
  const statsMonthSel = document.getElementById('statsMonthSlicer');
  if (statsMonthSel) {
    statsMonthSel.addEventListener('change', (e) => {
      statsFilterMonth = e.target.value;
      if (statsFilterMonth !== 'ALL') {
        if (statsPeriodGroup) {
          statsPeriodGroup.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        }
      } else {
        if (statsPeriodGroup) {
          const defaultBtn = statsPeriodGroup.querySelector('button[data-period="14"]') || statsPeriodGroup.querySelector('button[data-period="all"]');
          if (defaultBtn) {
            statsPeriodGroup.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            defaultBtn.classList.add('active');
            statsFilterPeriod = defaultBtn.dataset.period;
          }
        }
      }
      renderStatsDashboard();
    });
  }

  // Bộ lọc loại gói bán (Tất cả / File tự dùng / Gói Kèm 1-1)
  const statsTypeSel = document.getElementById('statsTypeSlicer');
  if (statsTypeSel) {
    statsTypeSel.addEventListener('change', (e) => {
      statsFilterType = e.target.value;
      renderStatsDashboard();
    });
  }
  document.getElementById('refreshOrdersBtn')?.addEventListener('click', loadAdminOrders);
  document.getElementById('orderSearchInput')?.addEventListener('input', renderFilteredOrders);
  document.getElementById('productSearchInput')?.addEventListener('input', renderFilteredProducts);
  document.getElementById('productCategoryFilter')?.addEventListener('change', renderFilteredProducts);
  document.getElementById('productFormatFilter')?.addEventListener('change', renderFilteredProducts);
  document.getElementById('topGlobalSearch')?.addEventListener('input', (e) => {
    const val = e.target.value;
    const activeTab = document.querySelector('.tab-pane.active')?.id;
    if (activeTab === 'productsTab') {
      const pInput = document.getElementById('productSearchInput');
      if (pInput) pInput.value = val;
      renderFilteredProducts();
    } else if (activeTab === 'ordersTab') {
      const oInput = document.getElementById('orderSearchInput');
      if (oInput) oInput.value = val;
      renderFilteredOrders();
    }
  });
  document.getElementById('orderStatusFilter')?.addEventListener('change', renderFilteredOrders);

  
  // ==========================================
  // --- MODULE QUẢN LÝ MÃ GIẢM GIÁ (COUPONS) ---
  // ==========================================
  let currentCoupons = [];
  const couponsListBody = document.getElementById('couponsListBody');
  const couponModal = document.getElementById('couponModal');
  const couponForm = document.getElementById('couponForm');
  const couponCodeInput = document.getElementById('couponCodeInput');
  const couponTypeSelect = document.getElementById('couponTypeSelect');
  const couponValueInput = document.getElementById('couponValueInput');
  const couponMinOrderInput = document.getElementById('couponMinOrderInput');
  const couponMaxDiscountInput = document.getElementById('couponMaxDiscountInput');
  const couponDescInput = document.getElementById('couponDescInput');
  const couponStartDateInput = document.getElementById('couponStartDateInput');
  const couponEndDateInput = document.getElementById('couponEndDateInput');
  const couponIsActive = document.getElementById('couponIsActive');
  const couponDocId = document.getElementById('couponDocId');
  const couponModalTitle = document.getElementById('couponModalTitle');
  const couponSearchInput = document.getElementById('couponSearchInput');
  const couponStatusFilter = document.getElementById('couponStatusFilter');
  const sidebarCouponCount = document.getElementById('sidebarCouponCount');
  const couponTotalNum = document.getElementById('couponTotalNum');

  async function loadCoupons() {
    try {
      if (couponsListBody) {
        couponsListBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 32px; color: var(--slate-muted);">Đang tải dữ liệu từ Firestore...</td></tr>';
      }
      const snapshot = await db.collection('coupons').get();
      currentCoupons = [];

      // If empty, auto-seed default FILEDILAM coupon
      if (snapshot.empty) {
        const defaultCoupon = {
          code: "FILEDILAM",
          type: "percent",
          value: 10,
          min_order: 160000,
          max_discount: 0,
          description: "Giảm 10% cho đơn từ 160.000 đ",
          is_active: true,
          created_at: new Date().toISOString()
        };
        await db.collection('coupons').doc('FILEDILAM').set(defaultCoupon);
        currentCoupons.push({ ...defaultCoupon, id: 'FILEDILAM' });
      } else {
        snapshot.forEach(doc => {
          currentCoupons.push({ ...doc.data(), id: doc.id });
        });
      }

      // Sort: active first, then newest
      currentCoupons.sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0));

      const activeCount = currentCoupons.filter(c => c.is_active).length;
      if (sidebarCouponCount) sidebarCouponCount.textContent = activeCount;
      if (couponTotalNum) couponTotalNum.textContent = currentCoupons.length;

      renderFilteredCoupons();
    } catch (err) {
      console.error("Lỗi tải mã giảm giá:", err);
      if (couponsListBody) {
        couponsListBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ef4444; padding: 24px;">Lỗi tải mã giảm giá: ' + escapeHtml(err.message) + '</td></tr>';
      }
    }
  }

  function renderFilteredCoupons() {
    if (!couponsListBody) return;
    const searchVal = (couponSearchInput?.value || '').trim().toUpperCase();
    const statusVal = couponStatusFilter?.value || 'ALL';

    const filtered = currentCoupons.filter(c => {
      const matchSearch = !searchVal || (c.code && c.code.toUpperCase().includes(searchVal)) || (c.description && c.description.toLowerCase().includes(searchVal.toLowerCase()));
      const matchStatus = statusVal === 'ALL' || (statusVal === 'ACTIVE' && c.is_active) || (statusVal === 'INACTIVE' && !c.is_active);
      return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
      couponsListBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 32px; color: var(--slate-muted);">Không tìm thấy mã giảm giá phù hợp.</td></tr>';
      return;
    }

    couponsListBody.innerHTML = filtered.map(c => {
      const discountText = ['percent','cheapest'].includes(c.type) ? c.value + '%' : ['gift','choice','tier'].includes(c.type) ? 'Theo chương trình' : formatCurrency(c.value);
      const minOrderText = (c.min_order && c.min_order > 0) ? formatCurrency(c.min_order) : 'Không yêu cầu';
      const statusHtml = c.is_active
        ? '<span style="display: inline-flex; align-items: center; gap: 6px; color: #059669; font-weight: 600; font-size: 0.82rem;"><span style="width: 7px; height: 7px; border-radius: 50%; background: #059669;"></span>Đang hoạt động</span>'
        : '<span style="display: inline-flex; align-items: center; gap: 6px; color: #94a3b8; font-weight: 500; font-size: 0.82rem;"><span style="width: 7px; height: 7px; border-radius: 50%; background: #cbd5e1;"></span>Tạm dừng</span>';

      return `
        <tr>
          <td>
            <div style="font-family: monospace; font-size: 0.92rem; font-weight: 700; color: #0f172a; letter-spacing: 0.05em;">${escapeHtml(c.code)}</div>
            ${c.description ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">${escapeHtml(c.description)}</div>` : ''}
          </td>
          <td><span style="color: #475569; font-size: 0.86rem;">${escapeHtml([...couponTypeSelect.options].find(o => o.value === c.type)?.text || c.type)}</span></td>
          <td><strong style="color: #059669; font-size: 0.92rem;">${discountText}</strong></td>
          <td><span style="color: #334155; font-size: 0.86rem;">${minOrderText}</span></td>
          <td><span style="color: #64748b; font-size: 0.84rem;">${c.expires_at ? escapeHtml(c.expires_at) : 'Vĩnh viễn'}</span></td>
          <td>${statusHtml}</td>
          <td style="text-align: center;">
            <div class="action-menu-wrap">
              <button type="button" class="action-dots-btn btn-coupon-dots" data-id="${escapeHtml(c.id)}" title="Thao tác">
                <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
              </button>
              <div class="action-dropdown-popover" id="popover-coupon-${escapeHtml(c.id)}">
                <button type="button" class="action-dropdown-item btn-edit-coupon" data-id="${escapeHtml(c.id)}">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  Chỉnh sửa
                </button>
                <button type="button" class="action-dropdown-item btn-toggle-coupon" data-id="${escapeHtml(c.id)}">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="${c.is_active ? 'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z' : 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}"></path></svg>
                  ${c.is_active ? 'Tạm dừng' : 'Kích hoạt'}
                </button>
                <button type="button" class="action-dropdown-item danger btn-delete-coupon" data-id="${escapeHtml(c.id)}">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Xóa mã
                </button>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach 3-dots toggles and action listeners
    couponsListBody.querySelectorAll('.btn-coupon-dots').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wrap = btn.closest('.action-menu-wrap');
        const popover = wrap?.querySelector('.action-dropdown-popover');
        const isShown = popover?.classList.contains('show');
        document.querySelectorAll('.action-dropdown-popover.show').forEach(p => p.classList.remove('show'));
        document.querySelectorAll('.action-dots-btn.active').forEach(b => b.classList.remove('active'));
        if (!isShown && popover) {
          popover.classList.add('show');
          btn.classList.add('active');
        }
      });
    });

    couponsListBody.querySelectorAll('.btn-toggle-coupon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.action-dropdown-popover.show').forEach(p => p.classList.remove('show'));
        toggleCouponStatus(btn.dataset.id);
      });
    });
    couponsListBody.querySelectorAll('.btn-edit-coupon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.action-dropdown-popover.show').forEach(p => p.classList.remove('show'));
        openEditCouponModal(btn.dataset.id);
      });
    });
    couponsListBody.querySelectorAll('.btn-delete-coupon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.action-dropdown-popover.show').forEach(p => p.classList.remove('show'));
        deleteCoupon(btn.dataset.id);
      });
    });
  }

  
  
  function formatNumberInputValue(input) {
    if (!input) return;
    input.addEventListener('input', function(e) {
      let val = e.target.value.replace(/\D/g, '');
      if (val) {
        e.target.value = new Intl.NumberFormat('vi-VN').format(parseInt(val, 10));
      } else {
        e.target.value = '';
      }
      updateCouponDescPreview();
    });
  }

  function parseVND(val) {
    if (!val) return 0;
    const num = Number(String(val).replace(/\D/g, ''));
    return isNaN(num) ? 0 : num;
  }

  function formatDateVN(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  }

  function bindCouponDate(picker) {
    if (!picker) return;
    const field = document.getElementById(picker.id + 'Text');
    field.addEventListener('input', () => {
      const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(field.value);
      picker.value = parts ? parts[3] + '-' + parts[2] + '-' + parts[1] : '';
      field.setCustomValidity(field.value && !picker.value ? 'Vui lòng nhập ngày hợp lệ theo dạng dd/mm/yyyy.' : '');
      updateCouponDescPreview();
    });
    picker.addEventListener('click', () => picker.showPicker?.());
    picker.addEventListener('change', () => {
      field.value = picker.value ? formatDateVN(picker.value) : '';
      field.setCustomValidity('');
      updateCouponDescPreview();
    });
  }

  const promoScope = document.getElementById('promoScope');
  const promoCount = document.getElementById('promoCount');
  const promoRewards = document.getElementById('promoRewards');
  const promoTiers = document.getElementById('promoTiers');
  const templates = [
    ['Giảm 20.000đ cho lần mua sau trong 30 ngày', 'returning', 20000, 0, 99000],
    ['Giảm 15% cho đơn từ 199.000đ', 'percent', 15, 0, 199000],
    ['Chọn 3 file lẻ giảm 30.000đ', 'fixed', 30000, 3],
    ['Chọn 2, 3 hoặc 5 file lẻ, giảm theo bậc', 'tier', 0, 2],
    ['Chọn 3 file lẻ, giảm 50% cho file rẻ nhất', 'cheapest', 50, 3],
    ['Đồng giá 99.000đ cho nhóm 3 file lẻ', 'bundle', 99000, 3],
    ['Mua sản phẩm đủ điều kiện, tặng một file', 'gift', 0, 1],
    ['Đơn từ 199.000đ, chọn một file quà', 'choice', 0, 1, 199000],
    ['Mua sản phẩm chính, mua kèm file với giá 19.000đ', 'addon', 19000, 1]
  ];
  const promoLibrary = document.getElementById('promoLibrary');
  templates.forEach(([title], i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.template = i;
    button.textContent = title;
    button.onclick = () => {
      promoLibrary.close();
      openAddCouponModal();
      const [, type, value, count, minimum] = templates[i];
      couponTypeSelect.value = type;
      couponValueInput.value = value || '';
      couponMinOrderInput.value = minimum || 0;
      promoScope.value = ['tier', 'cheapest', 'bundle', 'fixed'].includes(type) ? 'single' : 'all';
      promoCount.value = count;
      if (type === 'tier') promoTiers.value = '2 = 10000\n3 = 30000\n5 = 60000';
      refreshProgram();
    };
    document.getElementById('promoTemplates').append(button);
  });
  document.getElementById('btnPromoLibrary').onclick = () => promoLibrary.showModal();

  function loadProgram(coupon = {}) {
    promoScope.replaceChildren(new Option('Tất cả sản phẩm','all'), new Option('File lẻ','single'), new Option('Combo','combo'));
    promoRewards.replaceChildren();
    for (const category of document.getElementById('productCategory').options) {
      if (category.value) promoScope.add(new Option(category.text, 'category:' + category.value));
    }
    for (const product of currentProducts) {
      promoScope.add(new Option(product.name, 'product:' + product.id));
      promoRewards.add(new Option(product.name, product.id));
    }
    const scope = coupon.scope || 'all';
    if (![...promoScope.options].some(o => o.value === scope)) promoScope.add(new Option(scope, scope));
    promoScope.value = scope;
    promoCount.value = coupon.min_items || 0;
    document.getElementById('promoDays').value = coupon.return_days || 30;
    promoRewards.multiple = coupon.type === 'choice';
    const ids = coupon.reward_ids || [];
    for (const id of ids) if (![...promoRewards.options].some(o => o.value === id)) promoRewards.add(new Option(id, id));
    for (const o of promoRewards.options) o.selected = ids.includes(o.value);
    if (!ids.length) promoRewards.selectedIndex = -1;
    promoTiers.value = (coupon.tiers || []).map(t => t.count + ' = ' + t.amount).join('\n');
    refreshProgram();
  }

  function refreshProgram() {
    const type = couponTypeSelect.value;
    document.getElementById('promoDaysWrap').hidden = type !== 'returning';
    document.getElementById('promoDays').disabled = type !== 'returning';
    const reward = ['gift','choice','addon'].includes(type);
    document.getElementById('promoRewardWrap').hidden = !reward;
    promoRewards.multiple = type === 'choice';
    promoRewards.size = type === 'choice' ? 4 : 1;
    promoRewards.required = reward;
    promoRewards.disabled = !reward;
    document.getElementById('promoRewardHint').textContent = type === 'choice' ? 'Chọn các file được tặng. Khách thêm đúng một file quà vào giỏ.' : type === 'addon' ? 'Khách thêm cả file chính và file mua kèm vào giỏ.' : 'File này được thêm vào đơn sau khi khách áp mã.';
    document.getElementById('promoTierWrap').hidden = type !== 'tier';
    couponValueInput.disabled = ['gift','choice','tier'].includes(type);
    couponValueInput.parentElement.hidden = couponValueInput.disabled;
    couponValueInput.previousElementSibling.textContent = ({bundle:'Giá cả nhóm (đ)',addon:'Giá mua kèm (đ)',cheapest:'Phần trăm giảm (%)'})[type] || 'Giá trị giảm';
    couponMaxDiscountInput.parentElement.hidden = !['percent','cheapest'].includes(type);
    updateCouponDescPreview();
  }

  function readTiers() {
    return promoTiers.value.trim().split(/\n/).map(line => {
      const match = /^\s*([1-9]\d*)\s*=\s*([1-9]\d*)\s*$/.exec(line);
      return match ? {count:Number(match[1]), amount:Number(match[2])} : null;
    });
  }

  function generateCouponDescription() {
    const type = couponTypeSelect ? couponTypeSelect.value : 'percent';
    const rawVal = couponValueInput ? couponValueInput.value : '0';
    const val = type === 'percent' ? Number(rawVal) : parseVND(rawVal);
    const minOrder = parseVND(couponMinOrderInput?.value);
    const maxDiscount = parseVND(couponMaxDiscountInput?.value);
    const startDate = couponStartDateInput?.value;
    const endDate = couponEndDateInput?.value;

    if (!val && !couponValueInput.disabled) return '';

    let text = type === 'percent' ? ('Giảm ' + val + '%') : ('Giảm ' + formatCurrency(val));
    const names = [...promoRewards.selectedOptions].map(o => o.text).join(', ');
    if (type === 'returning') text += ' trong ' + document.getElementById('promoDays').value + ' ngày sau lần thanh toán gần nhất';
    if (type === 'gift') text = 'Tặng ' + (names || 'file quà');
    if (type === 'choice') text = 'Thêm một file quà vào giỏ để nhận miễn phí (' + names + ')';
    if (type === 'addon') text = 'Mua kèm ' + names + ' với giá ' + formatCurrency(val);
    if (type === 'bundle') text = 'Đồng giá ' + formatCurrency(val) + ' cho nhóm đủ đúng ' + promoCount.value + ' sản phẩm';
    if (type === 'cheapest') text = 'Giảm ' + val + '% cho file rẻ nhất';
    if (type === 'tier') text = readTiers().filter(Boolean).map(t => t.count + ' file giảm ' + formatCurrency(t.amount)).join(', ');
    if (Number(promoCount.value) && type !== 'bundle') text += ' khi mua từ ' + promoCount.value + ' sản phẩm khác nhau';
    if (promoScope.value !== 'all') text += ' thuộc phạm vi ' + (promoScope.selectedOptions[0]?.text || '');
    if (['percent','cheapest'].includes(type) && maxDiscount > 0) {
      text += ' (tối đa ' + formatCurrency(maxDiscount) + ')';
    }
    if (minOrder > 0) {
      text += ' cho đơn từ ' + formatCurrency(minOrder);
    } else {
      if (!Number(promoCount.value) && promoScope.value === 'all' && ['fixed','percent'].includes(type)) text += ' cho mọi đơn hàng';
    }

    if (startDate && endDate) {
      text += ` (từ ${formatDateVN(startDate)} đến ${formatDateVN(endDate)})`;
    } else if (endDate) {
      text += ` (hạn chót ${formatDateVN(endDate)})`;
    } else if (startDate) {
      text += ` (áp dụng từ ${formatDateVN(startDate)})`;
    }

    return text;
  }

  function updateCouponDescPreview() {
    if (couponDescInput) {
      couponDescInput.value = generateCouponDescription();
    }
  }

  function openAddCouponModal() {
    if (!couponModal) return;
    if (couponModalTitle) couponModalTitle.textContent = "Thêm mã giảm giá mới";
    if (couponDocId) couponDocId.value = "";
    if (couponForm) couponForm.reset();
    loadProgram();
    if (couponMinOrderInput) couponMinOrderInput.value = '0';
    if (couponMaxDiscountInput) couponMaxDiscountInput.value = '';
    if (couponStartDateInput) couponStartDateInput.value = '';
    if (couponEndDateInput) couponEndDateInput.value = '';
    couponStartDateInput?.dispatchEvent(new Event('change'));
    couponEndDateInput?.dispatchEvent(new Event('change'));
    if (couponCodeInput) {
      couponCodeInput.readOnly = false;
    }
    if (couponIsActive) couponIsActive.checked = true;
    couponModal.style.display = 'flex';
    couponCodeInput?.focus();
  }

  function openEditCouponModal(id) {
    const coupon = currentCoupons.find(c => c.id === id);
    if (!coupon || !couponModal) return;

    if (couponModalTitle) couponModalTitle.textContent = "Chỉnh sửa mã " + coupon.code;
    if (couponDocId) couponDocId.value = coupon.id;
    if (couponCodeInput) {
      couponCodeInput.value = coupon.code;
      couponCodeInput.readOnly = true; // Prevent changing code key
    }
    if (couponTypeSelect) couponTypeSelect.value = coupon.type || 'percent';
    loadProgram(coupon);
    if (couponValueInput) couponValueInput.value = coupon.value || 0;
    if (couponMinOrderInput) couponMinOrderInput.value = coupon.min_order ? new Intl.NumberFormat('vi-VN').format(coupon.min_order) : '0';
    if (couponMaxDiscountInput) couponMaxDiscountInput.value = coupon.max_discount ? new Intl.NumberFormat('vi-VN').format(coupon.max_discount) : '';
    if (couponStartDateInput) couponStartDateInput.value = coupon.start_date || '';
    if (couponEndDateInput) couponEndDateInput.value = coupon.end_date || '';
    couponStartDateInput?.dispatchEvent(new Event('change'));
    couponEndDateInput?.dispatchEvent(new Event('change'));
    updateCouponDescPreview();
    if (couponIsActive) couponIsActive.checked = coupon.is_active !== false;

    couponModal.style.display = 'flex';
  }

  function closeCouponModal() {
    if (couponModal) couponModal.style.display = 'none';
  }

  async function handleSaveCoupon(e) {
    e.preventDefault();
    const id = couponDocId ? couponDocId.value.trim() : "";
    const rawCode = couponCodeInput ? couponCodeInput.value.trim().toUpperCase() : "";
    if (!rawCode) {
      showToast("Vui lòng nhập mã giảm giá.");
      return;
    }

    const type = couponTypeSelect ? couponTypeSelect.value : 'percent';
    const rawVal = couponValueInput ? couponValueInput.value : '0';
    const value = type === 'percent' ? Number(rawVal) : parseVND(rawVal);
    const minOrder = parseVND(couponMinOrderInput?.value);
    const maxDiscount = parseVND(couponMaxDiscountInput?.value);
    const startDate = couponStartDateInput ? couponStartDateInput.value : "";
    const endDate = couponEndDateInput ? couponEndDateInput.value : "";
    const description = couponDescInput ? couponDescInput.value.trim() : "";
    const isActive = couponIsActive ? couponIsActive.checked : true;

    let expiresAtText = 'Vĩnh viễn';
    if (startDate && endDate) {
      expiresAtText = `${formatDateVN(startDate)} - ${formatDateVN(endDate)}`;
    } else if (endDate) {
      expiresAtText = `Đến ${formatDateVN(endDate)}`;
    } else if (startDate) {
      expiresAtText = `Từ ${formatDateVN(startDate)}`;
    }

    if (!couponValueInput.disabled && value <= 0) {
      showToast("Giá trị giảm phải lớn hơn 0.");
      return;
    }
    if (['percent','cheapest'].includes(type) && value > 100) {
      showToast("Giảm theo % không được vượt quá 100%.");
      return;
    }

    const tiers = type === 'tier' ? readTiers() : [];
    if (tiers.some((t,i) => !t || (i && (t.count <= tiers[i-1].count || t.amount <= tiers[i-1].amount)))) return showToast('Nhập các bậc với số lượng và mức giảm tăng dần.');
    if (type === 'bundle' && !Number(promoCount.value)) return showToast('Nhập số sản phẩm trong nhóm đồng giá.');
    if (endDate && startDate && endDate < startDate) return showToast('Ngày hết hạn phải từ ngày hiệu lực trở đi.');
    const rewardIds = promoRewards.disabled ? [] : [...promoRewards.selectedOptions].map(o => o.value);
    if (rewardIds.some(id => promoScope.value === 'product:' + id)) return showToast('File quà hoặc mua kèm phải khác sản phẩm chính.');
    if (rawCode.includes('/')) return showToast('Mã giảm giá không được chứa dấu /.');
    const docKey = id || rawCode;
    const payload = {
      code: rawCode,
      type: type,
      value: couponValueInput.disabled ? 0 : value,
      scope: promoScope.value,
      min_items: Number(promoCount.value || 0),
      return_days: type === 'returning' ? Number(document.getElementById('promoDays').value) : 0,
      reward_ids: rewardIds,
      tiers,
      min_order: minOrder,
      max_discount: maxDiscount,
      start_date: startDate,
      end_date: endDate,
      expires_at: expiresAtText,
      description: description,
      is_active: isActive,
      updated_at: new Date().toISOString()
    };
    if (!id) {
      payload.created_at = new Date().toISOString();
    }

    try {
      showToast("Đang lưu mã giảm giá...");
      const ref = db.collection('coupons').doc(docKey);
      await db.runTransaction(async transaction => {
        const existing = await transaction.get(ref);
        if (!id && existing.exists) throw new Error('Mã này đã tồn tại.');
        transaction.set(ref, payload, { merge: true });
      });
      showToast("Đã lưu mã giảm giá " + rawCode);
      closeCouponModal();
      await loadCoupons();
    } catch (err) {
      console.error("Lỗi lưu coupon:", err);
      showToast("Không thể lưu: " + err.message);
    }
  }

  async function toggleCouponStatus(id) {
    const coupon = currentCoupons.find(c => c.id === id);
    if (!coupon) return;
    const nextStatus = !coupon.is_active;
    try {
      await db.collection('coupons').doc(id).update({
        is_active: nextStatus,
        updated_at: new Date().toISOString()
      });
      showToast((nextStatus ? "Đã kích hoạt mã " : "Đã tạm dừng mã ") + coupon.code);
      await loadCoupons();
    } catch (err) {
      console.error("Lỗi đổi trạng thái coupon:", err);
      showToast("Lỗi: " + err.message);
    }
  }

  async function deleteCoupon(id) {
    const coupon = currentCoupons.find(c => c.id === id);
    if (!coupon) return;
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn mã giảm giá " + coupon.code + " không?")) {
      return;
    }
    try {
      await db.collection('coupons').doc(id).delete();
      showToast("Đã xóa mã " + coupon.code);
      await loadCoupons();
    } catch (err) {
      console.error("Lỗi xóa coupon:", err);
      showToast("Lỗi xóa mã: " + err.message);
    }
  }

  document.getElementById('btnOpenAddCoupon')?.addEventListener('click', openAddCouponModal);
  document.getElementById('btnCloseCouponModal')?.addEventListener('click', closeCouponModal);
  document.getElementById('btnCancelCoupon')?.addEventListener('click', closeCouponModal);
  couponForm?.addEventListener('submit', handleSaveCoupon);
  couponSearchInput?.addEventListener('input', renderFilteredCoupons);
  couponStatusFilter?.addEventListener('change', renderFilteredCoupons);
  formatNumberInputValue(couponMinOrderInput);
  formatNumberInputValue(couponMaxDiscountInput);
  couponTypeSelect?.addEventListener('change', refreshProgram);
  [promoCount,promoScope,promoRewards,promoTiers,document.getElementById('promoDays')].forEach(el => el.addEventListener('input', updateCouponDescPreview));
  couponValueInput?.addEventListener('input', updateCouponDescPreview);
  bindCouponDate(couponStartDateInput);
  bindCouponDate(couponEndDateInput);
// couponDescInput is readonly & auto-generated




// ==========================================================================
  // ADS CAMPAIGN MANAGEMENT (QUẢN LÝ QUẢNG CÁO TIKTOK / META ADS)
  // ==========================================================================
  let currentAds = [];
  const adsListBody = document.getElementById('adsListBody');
  const adsModal = document.getElementById('adsModal');
  const adsForm = document.getElementById('adsForm');
  const btnOpenAddAds = document.getElementById('btnOpenAddAds');
  const btnCloseAdsModal = document.getElementById('btnCloseAdsModal');
  const btnCancelAds = document.getElementById('btnCancelAds');
  const adsProductFilter = document.getElementById('adsProductFilter');
  const adsProductSelect = document.getElementById('adsProductSelect');
  const adsSpentInput = document.getElementById('adsSpentInput');

  // Format currency for adsSpentInput
  if (adsSpentInput) {
    adsSpentInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val) {
        e.target.value = new Intl.NumberFormat('vi-VN').format(parseInt(val, 10));
      } else {
        e.target.value = '';
      }
    });
  }

  function populateAdsProductDropdowns() {
    if (!adsProductFilter || !adsProductSelect) return;
    const currentValFilter = adsProductFilter.value;
    const currentValSelect = adsProductSelect.value;

    let filterOptions = '<option value="ALL">Tất cả sản phẩm</option>';
    let selectOptions = '<option value="">Chọn sản phẩm</option>';

    currentProducts.forEach(p => {
      filterOptions += `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`;
      selectOptions += `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(p.id)})</option>`;
    });

    adsProductFilter.innerHTML = filterOptions;
    adsProductSelect.innerHTML = selectOptions;

    if (currentValFilter) adsProductFilter.value = currentValFilter;
    if (currentValSelect) adsProductSelect.value = currentValSelect;
  }

  async function loadAdsCampaigns() {
    try {
      if (adsListBody) {
        adsListBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 36px; color: var(--slate-muted);">Đang tải dữ liệu từ Firestore...</td></tr>';
      }
      populateAdsProductDropdowns();

      const snapshot = await db.collection('ads_campaigns').orderBy('created_at', 'desc').get();
      currentAds = [];
      snapshot.forEach(doc => {
        currentAds.push({ ...doc.data(), id: doc.id });
      });

      renderFilteredAds();
      updateAdsSidebarBadge();
    } catch (err) {
      console.warn('Lỗi loadAdsCampaigns hoặc chưa tạo index:', err);
      // Fallback load without orderBy if index not yet generated
      try {
        const snapshot = await db.collection('ads_campaigns').get();
        currentAds = [];
        snapshot.forEach(doc => {
          currentAds.push({ ...doc.data(), id: doc.id });
        });
        currentAds.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        renderFilteredAds();
        updateAdsSidebarBadge();
      } catch (e2) {
        console.error('Lỗi fallback loadAdsCampaigns:', e2);
        if (adsListBody) {
          adsListBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ef4444; padding: 30px;">Không thể tải dữ liệu chiến dịch quảng cáo.</td></tr>';
        }
      }
    }
  }

  function updateAdsSidebarBadge() {
    const badge = document.getElementById('sidebarAdsCount');
    if (!badge) return;
    const activeAds = currentAds.filter(a => a.status === 'ACTIVE').length;
    if (activeAds > 0) {
      badge.textContent = activeAds;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  function renderFilteredAds() {
    if (!adsListBody) return;

    const searchVal = (document.getElementById('adsSearchInput')?.value || '').trim().toLowerCase();
    const channelVal = document.getElementById('adsChannelFilter')?.value || 'ALL';
    const productVal = document.getElementById('adsProductFilter')?.value || 'ALL';
    const statusVal = document.getElementById('adsStatusFilter')?.value || 'ALL';

    const filtered = currentAds.filter(a => {
      const matchSearch = !searchVal || 
        String(a.title || '').toLowerCase().includes(searchVal) || 
        String(a.url || '').toLowerCase().includes(searchVal) ||
        String(a.notes || '').toLowerCase().includes(searchVal);
      const matchChannel = channelVal === 'ALL' || a.channel === channelVal;
      const matchProduct = productVal === 'ALL' || a.product_id === productVal;
      const matchStatus = statusVal === 'ALL' || a.status === statusVal;

      return matchSearch && matchChannel && matchProduct && matchStatus;
    });

    // Update total spent
    const totalSpent = filtered.reduce((sum, a) => sum + (Number(a.spent) || 0), 0);
    const totalSpentEl = document.getElementById('adsTotalSpent');
    if (totalSpentEl) totalSpentEl.textContent = formatCurrency(totalSpent);

    if (!filtered.length) {
      adsListBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--slate-muted); padding: 48px 20px;">Chưa có chiến dịch quảng cáo nào. Bấm <b>Thêm chiến dịch</b> để ghi nhận đợt chạy ads đầu tiên!</td></tr>';
      return;
    }

    adsListBody.innerHTML = filtered.map(a => {
      const prod = currentProducts.find(p => p.id === a.product_id);
      const prodName = prod ? prod.name : (a.product_name || a.product_id || 'Chưa gắn file');
      
      let channelIcon = '';
      let channelLabel = 'Kênh khác';
      if (a.channel === 'tiktok') {
        channelLabel = 'TikTok';
        channelIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color: #000;"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg>';
      } else if (a.channel === 'facebook') {
        channelLabel = 'Facebook';
        channelIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="color: #1877f2;"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';
      }

      let statusHtml = '';
      if (a.status === 'ACTIVE') {
        statusHtml = '<span class="badge-status badge-status-paid"><span class="status-dot"></span>Đang chạy</span>';
      } else if (a.status === 'COMPLETED') {
        statusHtml = '<span style="color: #64748b; font-size: 0.82rem; font-weight: 500;">Đã hoàn tất</span>';
      } else {
        statusHtml = '<span class="badge-status badge-status-pending"><span class="status-dot"></span>Tạm dừng</span>';
      }

      // Format date
      let dateDisplay = a.date || 'Chưa đặt';
      if (a.date && a.date.includes('-')) {
        const parts = a.date.split('-');
        if (parts.length === 3) dateDisplay = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      return `
        <tr>
          <td>
            <div style="font-weight: 600; color: #0f172a; font-size: 0.88rem;">${escapeHtml(dateDisplay)}</div>
            <div style="font-size: 0.74rem; color: #64748b; margin-top: 2px;">${escapeHtml(a.time_frame || 'Cả ngày')}</div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: #0f172a; font-size: 0.88rem;">
              ${channelIcon}
              <span>${escapeHtml(a.title)}</span>
            </div>
            ${a.url ? `
              <div style="margin-top: 3px;">
                <a href="${escapeHtml(a.url)}" target="_blank" rel="noopener" style="font-size: 0.76rem; color: #059669; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="Mở link video">
                  <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  <span style="max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(a.url)}</span>
                </a>
              </div>` : ''}
          </td>
          <td>
            <span style="font-size: 0.86rem; color: #334155; font-weight: 500;">${escapeHtml(prodName)}</span>
          </td>
          <td>
            <strong style="color: #0f172a; font-family: monospace; font-size: 0.95rem;">${formatCurrency(a.spent || 0)}</strong>
          </td>
          <td>
            <span style="font-size: 0.82rem; color: #475569;">${escapeHtml(a.time_frame || 'Không ghi')}</span>
            ${a.notes ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 2px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(a.notes)}">${escapeHtml(a.notes)}</div>` : ''}
          </td>
          <td>${statusHtml}</td>
          <td style="text-align: center;">
            <div class="action-menu-wrap">
              <button type="button" class="action-dots-btn btn-ads-dots" data-id="${escapeHtml(a.id)}" title="Thao tác">
                <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
              </button>
              <div class="action-dropdown-popover" id="popover-ads-${escapeHtml(a.id)}">
                <button type="button" class="action-dropdown-item btn-edit-ads" data-id="${escapeHtml(a.id)}">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  <span>Chỉnh sửa</span>
                </button>
                <button type="button" class="action-dropdown-item danger btn-delete-ads" data-id="${escapeHtml(a.id)}">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  <span>Xóa chiến dịch</span>
                </button>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    bindAdsTableEvents();
  }

  function bindAdsTableEvents() {
    if (!adsListBody) return;

    adsListBody.querySelectorAll('.btn-ads-dots').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wrap = btn.closest('.action-menu-wrap');
        const popover = wrap?.querySelector('.action-dropdown-popover');
        const isShown = popover?.classList.contains('show');
        document.querySelectorAll('.action-dropdown-popover.show').forEach(p => p.classList.remove('show'));
        document.querySelectorAll('.action-dots-btn.active').forEach(b => b.classList.remove('active'));
        if (!isShown && popover) {
          popover.classList.add('show');
          btn.classList.add('active');
        }
      });
    });

    adsListBody.querySelectorAll('.btn-edit-ads').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.action-dropdown-popover.show').forEach(p => p.classList.remove('show'));
        openEditAdsModal(btn.dataset.id);
      });
    });

    adsListBody.querySelectorAll('.btn-delete-ads').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.action-dropdown-popover.show').forEach(p => p.classList.remove('show'));
        deleteAds(btn.dataset.id);
      });
    });
  }

  function openAddAdsModal() {
    if (!adsForm || !adsModal) return;
    adsForm.reset();
    document.getElementById('adsDocId').value = '';
    document.getElementById('adsModalTitle').textContent = 'Thêm chiến dịch quảng cáo';
    populateAdsProductDropdowns();

    // Default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('adsDateInput').value = today;
    document.getElementById('adsStatusSelect').value = 'ACTIVE';

    adsModal.style.display = 'flex';
  }

  function openEditAdsModal(id) {
    const item = currentAds.find(a => a.id === id);
    if (!item || !adsForm || !adsModal) return;

    populateAdsProductDropdowns();
    document.getElementById('adsDocId').value = item.id;
    document.getElementById('adsModalTitle').textContent = 'Chỉnh sửa chiến dịch quảng cáo';

    document.getElementById('adsTitleInput').value = item.title || '';
    document.getElementById('adsChannelSelect').value = item.channel || 'tiktok';
    document.getElementById('adsProductSelect').value = item.product_id || '';
    document.getElementById('adsUrlInput').value = item.url || '';
    document.getElementById('adsSpentInput').value = item.spent ? new Intl.NumberFormat('vi-VN').format(item.spent) : '';
    document.getElementById('adsStatusSelect').value = item.status || 'ACTIVE';
    document.getElementById('adsDateInput').value = item.date || '';
    document.getElementById('adsTimeFrameInput').value = item.time_frame || '';
    document.getElementById('adsNotesInput').value = item.notes || '';

    adsModal.style.display = 'flex';
  }

  function closeAdsModal() {
    if (adsModal) adsModal.style.display = 'none';
  }

  async function deleteAds(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa chiến dịch quảng cáo này không?')) return;
    try {
      showToast('Đang xóa...');
      await db.collection('ads_campaigns').doc(id).delete();
      showToast('Đã xóa chiến dịch.');
      loadAdsCampaigns();
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi xóa: ' + err.message, true);
    }
  }

  if (adsForm) {
    adsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = adsForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const docId = document.getElementById('adsDocId').value.trim();
        const title = document.getElementById('adsTitleInput').value.trim();
        const channel = document.getElementById('adsChannelSelect').value;
        const product_id = document.getElementById('adsProductSelect').value;
        const url = document.getElementById('adsUrlInput').value.trim();
        const spentVal = document.getElementById('adsSpentInput').value.replace(/\D/g, '');
        const spent = parseInt(spentVal, 10) || 0;
        const status = document.getElementById('adsStatusSelect').value;
        const date = document.getElementById('adsDateInput').value;
        const time_frame = document.getElementById('adsTimeFrameInput').value.trim();
        const notes = document.getElementById('adsNotesInput').value.trim();

        const prod = currentProducts.find(p => p.id === product_id);
        const product_name = prod ? prod.name : '';

        const data = {
          title,
          channel,
          product_id,
          product_name,
          url,
          spent,
          status,
          date,
          time_frame,
          notes,
          updated_at: new Date().toISOString()
        };

        if (docId) {
          await db.collection('ads_campaigns').doc(docId).update(data);
          showToast('Đã cập nhật chiến dịch quảng cáo thành công.');
        } else {
          data.created_at = new Date().toISOString();
          await db.collection('ads_campaigns').add(data);
          showToast('Đã thêm chiến dịch quảng cáo thành công.');
        }

        closeAdsModal();
        loadAdsCampaigns();
      } catch (err) {
        console.error('Lỗi lưu ads campaign:', err);
        showToast('Lỗi: ' + err.message, true);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  btnOpenAddAds?.addEventListener('click', openAddAdsModal);
  btnCloseAdsModal?.addEventListener('click', closeAdsModal);
  btnCancelAds?.addEventListener('click', closeAdsModal);
  document.getElementById('adsSearchInput')?.addEventListener('input', renderFilteredAds);
  document.getElementById('adsChannelFilter')?.addEventListener('change', renderFilteredAds);
  document.getElementById('adsProductFilter')?.addEventListener('change', renderFilteredAds);
  document.getElementById('adsStatusFilter')?.addEventListener('change', renderFilteredAds);

});

// Global listener to close popovers when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.action-dropdown-popover.show').forEach(p => p.classList.remove('show'));
  document.querySelectorAll('.action-dots-btn.active').forEach(b => b.classList.remove('active'));
}); // closeAllPopoversListener


  