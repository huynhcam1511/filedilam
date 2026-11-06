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
        loadAdminStats(); // Load Dashboard first by default
        loadProducts(); // Preload products
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
      const sName = String(p.name || '').toLowerCase();
      let pEffectiveCat = p.categoryId || 'kinh-doanh';
      if (['ban-hang-online', 'quan-ly-kho', 'fnb-cost', 'combo'].indexOf(pEffectiveCat) !== -1) pEffectiveCat = 'kinh-doanh';
      if (['cong-no', 'thu-chi-dong-tien'].indexOf(pEffectiveCat) !== -1) pEffectiveCat = 'ke-toan';

      if (sName.includes('kho') || sName.includes('tồn kho') || sName.includes('bán hàng') || sName.includes('shop') || sName.includes('cost') || sName.includes('giá vốn')) {
        pEffectiveCat = 'kinh-doanh';
      } else if (sName.includes('công nợ') || sName.includes('thu chi') || sName.includes('kế toán') || sName.includes('dòng tiền')) {
        pEffectiveCat = 'ke-toan';
      } else if (sName.includes('nhân sự') || sName.includes('tiền lương') || sName.includes('chấm công')) {
        pEffectiveCat = 'nhan-su';
      } else if (sName.includes('marketing') || sName.includes('quảng cáo')) {
        pEffectiveCat = 'marketing';
      }

      const matchCat = catVal === 'ALL' || p.categoryId === catVal || pEffectiveCat === catVal;
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
      'quan-ly-kho': 'Kinh doanh',
      'ban-hang-online': 'Kinh doanh',
      'fnb-cost': 'Kinh doanh',
      'combo': 'Kinh doanh'
    };

    productListBody.innerHTML = filtered.map(p => {
      // Tự động nhận diện danh mục chính xác từ tên sản phẩm hoặc categoryId
      const s = String(p.name || '').toLowerCase();
      let effectiveCatKey = p.categoryId || 'kinh-doanh';
      if (['ban-hang-online', 'quan-ly-kho', 'fnb-cost', 'combo'].indexOf(effectiveCatKey) !== -1) effectiveCatKey = 'kinh-doanh';
      if (['cong-no', 'thu-chi-dong-tien'].indexOf(effectiveCatKey) !== -1) effectiveCatKey = 'ke-toan';

      if (s.includes('kho') || s.includes('tồn kho') || s.includes('bán hàng') || s.includes('shop') || s.includes('cost') || s.includes('giá vốn')) effectiveCatKey = 'kinh-doanh';
      else if (s.includes('công nợ') || s.includes('thu chi') || s.includes('dòng tiền') || s.includes('kế toán')) effectiveCatKey = 'ke-toan';
      else if (s.includes('nhân sự') || s.includes('tiền lương') || s.includes('chấm công')) effectiveCatKey = 'nhan-su';
      else if (s.includes('marketing') || s.includes('kế hoạch') || s.includes('content')) effectiveCatKey = 'marketing';
      
      const catName = catMap[effectiveCatKey] || catMap[p.categoryId] || 'Kinh doanh';
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

          // Load social posts
          productSocialPosts = Array.isArray(product.social_posts) ? JSON.parse(JSON.stringify(product.social_posts)) : [];
          renderProductSocialPosts();

          updateFormatFields();
          document.getElementById('productImage').required = false;
          const coverWrap = document.getElementById('coverPreviewWrap');
          const coverImg = document.getElementById('coverPreviewImg');
          const coverName = document.getElementById('coverPreviewName');
          if (product.previewImageUrl && coverWrap && coverImg) {
            coverImg.src = product.previewImageUrl;
            if (coverName) coverName.textContent = product.name || 'Ảnh bìa hiện tại';
            coverWrap.style.display = 'flex';
          } else if (coverWrap) {
            coverWrap.style.display = 'none';
          }
          switchTab('addTab');
          window.scrollTo(0, 0);
        }
      });
    });
  }

  // Format price inputs dynamically
  
  // --- SOCIAL POSTS / MEDIA LINKS MANAGEMENT (MASTER TABLE FLAT SAAS) ---
  let productSocialPosts = [];
  const productSocialPostsTableBody = document.getElementById('productSocialPostsTableBody');
  const btnAddSocialPost = document.getElementById('btnAddSocialPost');

  function renderProductSocialPosts() {
    if (!productSocialPostsTableBody) return;
    if (productSocialPosts.length === 0) {
      productSocialPostsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 24px; color: #94a3b8; font-size: 0.82rem;">Chưa có bài viết nào. Bấm "+ Thêm dòng" để khai báo video đã đăng.</td></tr>';
      return;
    }

    productSocialPostsTableBody.innerHTML = productSocialPosts.map((post, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 6px 10px;">
          <select class="social-post-platform" data-idx="${idx}" style="width: 100%; height: 34px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 0 8px; font-size: 0.82rem; background: #ffffff; color: #0f172a;">
            <option value="tiktok" ${post.platform === 'tiktok' ? 'selected' : ''}>TikTok</option>
            <option value="facebook" ${post.platform === 'facebook' ? 'selected' : ''}>Facebook / Reels</option>
            <option value="youtube" ${post.platform === 'youtube' ? 'selected' : ''}>YouTube Shorts</option>
            <option value="threads" ${post.platform === 'threads' ? 'selected' : ''}>Threads</option>
            <option value="other" ${post.platform === 'other' ? 'selected' : ''}>Khác</option>
          </select>
        </td>
        <td style="padding: 6px 10px;">
          <input type="text" class="social-post-title" data-idx="${idx}" placeholder="VD: Trend tính cost F&B" value="${escapeHtml(post.title || '')}" style="width: 100%; height: 34px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 0 10px; font-size: 0.85rem; color: #0f172a; box-sizing: border-box;" />
        </td>
        <td style="padding: 6px 10px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <input type="url" class="social-post-url" data-idx="${idx}" placeholder="https://vt.tiktok.com/..." value="${escapeHtml(post.url || '')}" style="width: 100%; height: 34px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 0 10px; font-size: 0.82rem; font-family: monospace; color: #0f172a; box-sizing: border-box;" />
            ${post.url ? `<a href="${escapeHtml(post.url)}" target="_blank" rel="noopener" style="color: #059669; padding: 4px; display: inline-flex; align-items: center;" title="Mở link"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>` : ''}
          </div>
        </td>
        <td style="padding: 6px 6px; text-align: center;">
          <button type="button" class="btn-remove-social-post" data-idx="${idx}" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px 6px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center;" title="Xóa dòng" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </td>
      </tr>
    `).join('');

    // Bind change listeners
    productSocialPostsTableBody.querySelectorAll('.social-post-platform').forEach(el => {
      el.addEventListener('change', (e) => {
        productSocialPosts[parseInt(e.target.dataset.idx, 10)].platform = e.target.value;
      });
    });
    productSocialPostsTableBody.querySelectorAll('.social-post-title').forEach(el => {
      el.addEventListener('input', (e) => {
        productSocialPosts[parseInt(e.target.dataset.idx, 10)].title = e.target.value;
      });
    });
    productSocialPostsTableBody.querySelectorAll('.social-post-url').forEach(el => {
      el.addEventListener('input', (e) => {
        productSocialPosts[parseInt(e.target.dataset.idx, 10)].url = e.target.value.trim();
      });
    });
    productSocialPostsTableBody.querySelectorAll('.btn-remove-social-post').forEach(el => {
      el.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        productSocialPosts.splice(idx, 1);
        renderProductSocialPosts();
      });
    });
  }

  btnAddSocialPost?.addEventListener('click', () => {
    productSocialPosts.push({ platform: 'tiktok', title: '', url: '' });
    renderProductSocialPosts();
  });

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

  // Instant cover image local preview
  const productImgInput = document.getElementById('productImage');
  if (productImgInput) {
    productImgInput.addEventListener('change', function(e) {
      const file = this.files && this.files[0];
      const btnText = document.getElementById('imageBtnText');
      const coverWrap = document.getElementById('coverPreviewWrap');
      const coverImg = document.getElementById('coverPreviewImg');
      const coverName = document.getElementById('coverPreviewName');

      if (file) {
        if (btnText) {
          btnText.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg> Đã chọn: ' + escapeHtml(file.name);
        }
        if (coverWrap && coverImg) {
          coverImg.src = URL.createObjectURL(file);
          if (coverName) coverName.textContent = file.name;
          coverWrap.style.display = 'flex';
        }
      }
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
        social_posts: productSocialPosts.filter(p => p.url && p.url.trim() !== ''),
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
        const coverDownloadUrl = await imageRef.getDownloadURL();
        updateData.previewImageUrl = coverDownloadUrl;
        updateData.thumbnailUrl = coverDownloadUrl;
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
      productSocialPosts = [];
      renderGalleryPreviews();
      renderProductSocialPosts();
      if (document.getElementById('productHasCoaching')) document.getElementById('productHasCoaching').checked = false;
      if (document.getElementById('coachingFieldsGroup')) document.getElementById('coachingFieldsGroup').style.display = 'none';
      if (document.getElementById('productCoachingPrice')) document.getElementById('productCoachingPrice').value = '';
      if (document.getElementById('productCoachingTitle')) document.getElementById('productCoachingTitle').value = '';

      document.getElementById('editingProductId').value = '';
      const resetCoverWrap = document.getElementById('coverPreviewWrap');
      if (resetCoverWrap) resetCoverWrap.style.display = 'none';
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
  let currentAds = [];
  let statsActiveChartView = 'combo'; // 'combo', 'waterfall', 'scatter', 'pareto'
  let statsCategoryView = 'donut'; // 'donut', 'treemap'

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

    // Nạp song song dữ liệu quảng cáo (currentAds) nếu chưa có để đối soát tài chính
    if (!currentAds || currentAds.length === 0) {
      try {
        const snapAds = await db.collection('ads_campaigns').get();
        currentAds = [];
        snapAds.forEach(doc => {
          currentAds.push({ ...doc.data(), id: doc.id });
        });
      } catch (eAds) {
        console.warn('Không tải được ads_campaigns cho stats:', eAds);
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

    // Bổ sung các tháng có chiến dịch quảng cáo
    (currentAds || []).forEach(a => {
      const dStr = a.start_date || a.created_at;
      if (dStr) {
        const dObj = parseDateObj(dStr);
        if (dObj) {
          monthsSet.add(dObj.toISOString().slice(0, 7));
        }
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
    if (s.includes('kho') || s.includes('tồn kho') || s.includes('bán hàng') || s.includes('shop') || s.includes('cost') || s.includes('giá vốn')) return 'kinh-doanh';
    if (s.includes('công nợ') || s.includes('thu chi') || s.includes('dòng tiền') || s.includes('kế toán')) return 'ke-toan';
    if (s.includes('nhân sự') || s.includes('tiền lương') || s.includes('chấm công')) return 'nhan-su';
    if (s.includes('marketing') || s.includes('kế hoạch') || s.includes('content') || s.includes('quảng cáo')) return 'marketing';
    if (s.includes('công việc') || s.includes('dự án') || s.includes('tiến độ')) return 'cong-viec';
    if (s.includes('bản thân') || s.includes('thói quen') || s.includes('tài chính cá nhân')) return 'phat-trien-ban-than';

    const prod = knownProductsMap[item.productId];
    if (prod && prod.categoryId) {
      let pCat = prod.categoryId;
      if (['ban-hang-online', 'quan-ly-kho', 'fnb-cost', 'combo'].indexOf(pCat) !== -1) pCat = 'kinh-doanh';
      if (['cong-no', 'thu-chi-dong-tien'].indexOf(pCat) !== -1) pCat = 'ke-toan';
      return pCat;
    }
    return 'kinh-doanh';
  }

  function getCategoryLabel(catKey) {
    const labels = {
      'kinh-doanh': 'Kinh doanh',
      'nhan-su': 'Nhân sự',
      'cong-viec': 'Công việc',
      'marketing': 'Marketing',
      'ke-toan': 'Kế toán',
      'phat-trien-ban-than': 'Phát triển bản thân',
      'quan-ly-kho': 'Kinh doanh',
      'ban-hang-online': 'Kinh doanh',
      'fnb-cost': 'Kinh doanh',
      'combo': 'Kinh doanh'
    };
    return labels[catKey] || 'Kinh doanh';
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
    const kpiTotalRevenueSub = document.getElementById('kpiTotalRevenueSub');
    const kpiAdsSpent = document.getElementById('kpiAdsSpent');
    const kpiAdsSpentSub = document.getElementById('kpiAdsSpentSub');
    const kpiNetProfit = document.getElementById('kpiNetProfit');
    const kpiNetProfitSub = document.getElementById('kpiNetProfitSub');
    const kpiPaidOrders = document.getElementById('kpiPaidOrders');
    const kpiPaidOrdersSub = document.getElementById('kpiPaidOrdersSub');
    const kpiCustomers = document.getElementById('kpiCustomers');
    const kpiCustomersSub = document.getElementById('kpiCustomersSub');
    const kpiConversionRate = document.getElementById('kpiConversionRate');
    const kpiConversionRateSub = document.getElementById('kpiConversionRateSub');

    // Backward compatibility hooks
    const kpiMonthRevenue = document.getElementById('kpiMonthRevenue');
    const kpiMonthRevenueSub = document.getElementById('kpiMonthRevenueSub');
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
    const bestSellersTitle = document.getElementById('bestSellersTitle');
    const bestSellersSubTitle = document.getElementById('bestSellersSubTitle');
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

    // Helper: chuẩn hóa ngày của chiến dịch Ads
    function getAdDate(a) {
      if (!a) return null;
      if (a.start_date) {
        const str = String(a.start_date).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
        const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);
        if (parts) return parts[3] + '-' + parts[2] + '-' + parts[1];
        const d = parseDateObj(str);
        if (d) return d.toISOString().slice(0, 10);
      }
      if (a.created_at) {
        const d = parseDateObj(a.created_at);
        if (d) return d.toISOString().slice(0, 10);
      }
      return null;
    }

    // 1. Lọc đơn hàng
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

    // 2. Lọc chiến dịch Ads đồng bộ thời gian & sản phẩm
    const filteredAds = (currentAds || []).filter(a => {
      const adDateStr = getAdDate(a);
      if (!adDateStr) return false;
      const adDateObj = new Date(adDateStr + 'T00:00:00Z');

      if (statsFilterMonth === 'ALL' && cutoffTime && adDateObj.getTime() < cutoffTime) {
        return false;
      }

      if (statsFilterMonth !== 'ALL') {
        const yyyymm = adDateStr.slice(0, 7);
        if (yyyymm !== statsFilterMonth) return false;
      }

      if (statsFilterProduct && statsFilterProduct !== 'ALL') {
        const matchId = a.product_id === statsFilterProduct;
        const targetProdName = (knownProductsMap[statsFilterProduct]?.name || '').toLowerCase();
        const aName = (a.product_name || a.title || '').toLowerCase();
        const matchName = targetProdName && (aName.includes(targetProdName) || targetProdName.includes(aName));
        if (!matchId && !matchName) return false;
      }

      return true;
    });

    if (slicerNotice) {
      slicerNotice.textContent = 'Lọc: ' + filteredOrders.length + ' đơn • ' + filteredAds.length + ' chiến dịch Ads';
    }

    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let coachingCount = 0;
    const customers = new Set();
    const productMap = {};
    const categoryMap = {};
    const hourlyMap = Array(24).fill(0);
    const weekdayMap = Array(7).fill(0);
    const weekdayRevMap = Array(7).fill(0);
    const chartDataMap = {};
    const isAllTime = statsFilterPeriod === 'all' && statsFilterMonth === 'ALL';

    // Khởi tạo trục thời gian cho biểu đồ
    if (statsFilterMonth !== 'ALL') {
      const parts = statsFilterMonth.split('-').map(Number);
      const y = parts[0];
      const m = parts[1];
      const daysInMonth = new Date(y, m, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const ds = y + '-' + String(m).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        chartDataMap[ds] = { key: ds, label: String(day), dayNum: day, fullDate: ds, revenue: 0, adsSpent: 0, count: 0 };
      }
      if (chartTitle) chartTitle.textContent = 'Biểu đồ Doanh thu & Chi phí Marketing (Tháng ' + m + '/' + y + ')';
      if (chartSubTitle) chartSubTitle.textContent = 'Thời gian: Tháng ' + m + '/' + y + ' • So sánh Doanh thu (Cột Mint), Ads (Cột Slate) & Số đơn (Line)';
    } else if (periodDays) {
      for (let i = periodDays - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const ds = d.toISOString().slice(0, 10);
        chartDataMap[ds] = { key: ds, label: String(parseInt(ds.slice(8, 10), 10)), monthStr: ds.slice(5, 7), fullDate: ds, revenue: 0, adsSpent: 0, count: 0 };
      }
      const startDateObj = new Date(now.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000);
      const startStr = String(startDateObj.getDate()).padStart(2, '0') + '/' + String(startDateObj.getMonth() + 1).padStart(2, '0') + '/' + startDateObj.getFullYear();
      const endStr = String(now.getDate()).padStart(2, '0') + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
      if (chartTitle) chartTitle.textContent = 'Biểu đồ Doanh thu & Chi phí Marketing (' + periodDays + ' ngày qua)';
      if (chartSubTitle) chartSubTitle.textContent = 'Thời gian: ' + startStr + ' - ' + endStr + ' • So sánh Doanh thu vs Ads';
    } else {
      if (chartTitle) chartTitle.textContent = 'Biểu đồ Doanh thu & Chi phí Marketing (Toàn thời gian theo Tháng)';
      if (chartSubTitle) chartSubTitle.textContent = 'Doanh số (Cột Mint), Chi phí Ads (Cột Slate) & Số lượng đơn hàng (Đường trend)';
    }

    // 3. Xử lý số liệu Đơn hàng
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
              revenue: 0,
              adsSpent: 0
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
              chartDataMap[monthKey] = { key: monthKey, label: monthLabel, fullDate: 'Tháng ' + mParts[1] + '/' + mParts[0], revenue: 0, adsSpent: 0, count: 0 };
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

    // 4. Xử lý số liệu Quảng cáo (Ads Spent & Marketing Funnel)
    let totalAdsSpent = 0;
    let totalAdsViews = 0;
    let totalAdsClicks = 0;
    let totalAdsBio = 0;
    const productAdsMap = {};

    filteredAds.forEach(a => {
      const spent = Number(a.spent) || 0;
      totalAdsSpent += spent;
      totalAdsViews += Number(a.views) || 0;
      totalAdsClicks += Number(a.button_clicks || a.clicks || 0);
      totalAdsBio += Number(a.profile_visits || 0);

      // Map vào product_id chuẩn
      let pid = a.product_id;
      if (!knownProductsMap[pid]) {
        for (const k of Object.keys(knownProductsMap)) {
          const pName = (knownProductsMap[k].name || '').toLowerCase();
          const aName = (a.product_name || a.title || '').toLowerCase();
          if (pName && aName && (pName.includes(aName) || aName.includes(pName))) {
            pid = k;
            break;
          }
        }
      }

      if (!productAdsMap[pid]) {
        productAdsMap[pid] = {
          id: pid,
          spent: 0,
          views: 0,
          clicks: 0,
          bio: 0,
          count: 0,
          name: a.product_name || a.title || (knownProductsMap[pid]?.name || pid)
        };
      }
      productAdsMap[pid].spent += spent;
      productAdsMap[pid].views += Number(a.views) || 0;
      productAdsMap[pid].clicks += Number(a.button_clicks || a.clicks || 0);
      productAdsMap[pid].bio += Number(a.profile_visits || 0);
      productAdsMap[pid].count += 1;

      // Map vào danh mục
      if (knownProductsMap[pid]) {
        const catKey = knownProductsMap[pid].category || 'OTHER';
        if (!categoryMap[catKey]) {
          categoryMap[catKey] = {
            key: catKey,
            label: getCategoryLabel(catKey),
            count: 0,
            revenue: 0,
            adsSpent: 0
          };
        }
        categoryMap[catKey].adsSpent = (categoryMap[catKey].adsSpent || 0) + spent;
      }

      // Map vào biểu đồ thời gian
      const adDateStr = getAdDate(a);
      if (adDateStr) {
        if (isAllTime) {
          const monthKey = adDateStr.slice(0, 7);
          const mParts = monthKey.split('-');
          const monthLabel = 'T' + parseInt(mParts[1], 10) + '/' + mParts[0].slice(2);
          if (!chartDataMap[monthKey]) {
            chartDataMap[monthKey] = { key: monthKey, label: monthLabel, fullDate: 'Tháng ' + mParts[1] + '/' + mParts[0], revenue: 0, adsSpent: 0, count: 0 };
          }
          chartDataMap[monthKey].adsSpent = (chartDataMap[monthKey].adsSpent || 0) + spent;
        } else {
          if (chartDataMap[adDateStr]) {
            chartDataMap[adDateStr].adsSpent = (chartDataMap[adDateStr].adsSpent || 0) + spent;
          }
        }
      }
    });

    // Tính tổng chi phí giảm giá (Coupons / Discounts)
    let totalDiscount = 0;
    filteredOrders.forEach(o => {
      if (String(o.status || '').toUpperCase() === 'PAID') {
        totalDiscount += Number(o.discount_amount || 0);
      }
    });
    const grossRevenue = totalRevenue + totalDiscount;

    // 5. Tính toán các chỉ số tài chính P&L & LTV
    const netProfit = totalRevenue - totalAdsSpent;
    const overallRoasVal = totalAdsSpent > 0 ? (totalRevenue / totalAdsSpent) : 0;
    const overallRoasStr = totalAdsSpent > 0 ? (overallRoasVal.toFixed(2) + 'x') : 'Organic (100%)';
    const merRatio = totalRevenue > 0 ? Math.round((totalAdsSpent / totalRevenue) * 100) : (totalAdsSpent > 0 ? 100 : 0);
    const cpaVal = paidCount > 0 && totalAdsSpent > 0 ? Math.round(totalAdsSpent / paidCount) : 0;

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

    // 6. Cập nhật 6 KPI CELLS
    const aov = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;
    if (kpiTotalRevenue) kpiTotalRevenue.textContent = formatCurrency(totalRevenue);
    if (kpiTotalRevenueSub) kpiTotalRevenueSub.textContent = 'AOV: ' + formatCurrency(aov) + '/đơn';

    if (kpiAdsSpent) kpiAdsSpent.textContent = formatCurrency(totalAdsSpent);
    if (kpiAdsSpentSub) {
      kpiAdsSpentSub.textContent = filteredAds.length + ' chiến dịch • ' + (totalAdsViews > 0 ? (Math.round(totalAdsViews / 1000) + 'k views') : '0 views');
    }

    if (kpiNetProfit) {
      kpiNetProfit.textContent = (netProfit < 0 ? '-' : '') + formatCurrency(Math.abs(netProfit));
      kpiNetProfit.style.color = netProfit >= 0 ? '#059669' : '#ef4444';
    }
    if (kpiNetProfitSub) {
      kpiNetProfitSub.textContent = 'ROAS: ' + overallRoasStr + ' • Ads/DT: ' + merRatio + '%';
      kpiNetProfitSub.style.color = netProfit >= 0 ? '#059669' : '#ef4444';
    }

    if (kpiPaidOrders) kpiPaidOrders.textContent = paidCount + ' đơn';
    if (kpiPaidOrdersSub) {
      kpiPaidOrdersSub.textContent = cpaVal > 0 ? ('CPA: ' + formatCurrency(cpaVal) + '/đơn') : 'CPA: 0 đ (Organic)';
      kpiPaidOrdersSub.style.color = '#2563eb';
    }

    if (kpiConversionRate) kpiConversionRate.textContent = payRate + '%';
    if (kpiConversionRateSub) kpiConversionRateSub.textContent = paidCount + '/' + totalOrdersInFilter + ' đơn tạo';

    if (kpiCustomers) kpiCustomers.textContent = totalUniqueCust + ' khách';
    if (kpiCustomersSub) kpiCustomersSub.textContent = repeatRate + '% khách mua lần 2+';

    // 7. RENDER BIỂU ĐỒ CHÍNH THEO GÓC NHÌN (statsActiveChartView)
    const dailyList = Object.values(chartDataMap).sort((a, b) => a.key.localeCompare(b.key));
    const revenues = dailyList.map(d => d.revenue);
    const adsSpents = dailyList.map(d => d.adsSpent || 0);
    const orderCounts = dailyList.map(d => d.count);
    const maxVal = Math.max(...revenues, ...adsSpents, 50000);
    const maxCount = Math.max(...orderCounts, 5);

    if (revenueChartContainer) {
            if (statsActiveChartView === 'lag72h') {
        // VIEW: HIỆU ỨNG TRỄ 72H (TIMELINE ATTRIBUTION & 72-HOUR REVENUE IMPACT)
        // Đo lường đợt nổ đơn trong vòng 72h kể từ ngày chạy Ads (Ngày X -> X+3)
        const lagHeight = 185;
        const timelineList = Object.values(chartDataMap).sort((a, b) => a.key.localeCompare(b.key));
        
        // Phân tích từng chiến dịch trong kỳ lọc
        const campaignAttribution = filteredAds.map(a => {
          const adDateStr = getAdDate(a);
          if (!adDateStr) return null;
          const adDateObj = new Date(adDateStr + 'T00:00:00Z');
          const windowStart = adDateObj.getTime();
          const windowEnd = windowStart + (3 * 24 * 60 * 60 * 1000) + (23 * 3600 * 1000); // 72h window
          
          let windowRev = 0;
          let windowOrdersCount = 0;
          const matchedOrdersList = [];

          (cachedOrders || []).forEach(o => {
            if (String(o.status || '').toUpperCase() !== 'PAID') return;
            const od = parseDateObj(o.created_at || o.paid_at);
            if (!od) return;
            const ot = od.getTime();
            if (ot >= windowStart && ot <= windowEnd) {
              const lineItems = resolveOrderLineItems(o, knownProductsMap);
              lineItems.forEach(it => {
                const matchId = it.productId === a.product_id;
                const matchName = (it.name || '').toLowerCase().includes((a.product_name || a.title || '').toLowerCase()) ||
                                  (a.product_name || a.title || '').toLowerCase().includes((it.name || '').toLowerCase());
                if (matchId || matchName) {
                  windowRev += it.revenue;
                  windowOrdersCount++;
                  matchedOrdersList.push({ date: od.toISOString().slice(0, 10), rev: it.revenue, name: it.name });
                }
              });
            }
          });

          const spent = Number(a.spent) || 0;
          const roas72 = spent > 0 ? (windowRev / spent) : 0;
          let verdict = 'DỪNG / ĐỔI VIDEO';
          let verdictColor = '#ef4444';
          let verdictBadge = '🛑 Hiệu quả thấp';

          if (roas72 >= 3.0) {
            verdict = 'VÍT TIẾP & TĂNG 30% NGÂN SÁCH';
            verdictColor = '#059669';
            verdictBadge = '🚀 ĐỢT CHẠY WIN (NÊN CHẠY TIẾP)';
          } else if (roas72 >= 1.5 || windowOrdersCount >= 2) {
            verdict = 'DUY TRÌ CHẠY TIẾP';
            verdictColor = '#2563eb';
            verdictBadge = '⚡ Ổn định (Có lời)';
          } else if (a.button_clicks >= 20 || a.profile_visits >= 10) {
            verdict = 'SỬA GIỎ HÀNG / WEB RỒI CHẠY TIẾP';
            verdictColor = '#d97706';
            verdictBadge = '🛠️ Tắc nghẽn Web (Click nhiều)';
          }

          return {
            id: a.id,
            title: a.title || a.product_name,
            product_name: a.product_name || a.title,
            adDateStr,
            spent,
            windowRev,
            windowOrdersCount,
            roas72,
            verdict,
            verdictColor,
            verdictBadge,
            clicks: Number(a.button_clicks || a.clicks || 0),
            bio: Number(a.profile_visits || 0),
            views: Number(a.views || 0)
          };
        }).filter(Boolean);

        // Biểu đồ Timeline kết hợp thanh thẻ kết luận 72h
        const cardsHtml = campaignAttribution.map(c => {
          return (
            '<div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">' +
              '<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">' +
                '<div>' +
                  '<span style="font-size: 0.72rem; color: #64748b; font-family: monospace; margin-right: 6px;">[' + c.adDateStr + ']</span>' +
                  '<strong style="font-size: 0.82rem; color: #0f172a;">' + escapeHtml(c.product_name) + '</strong>' +
                '</div>' +
                '<span style="font-size: 0.74rem; font-weight: 700; color: ' + c.verdictColor + '; background: #f8fafc; padding: 2px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">' + c.verdictBadge + '</span>' +
              '</div>' +
              '<div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.72rem; color: #475569; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #f1f5f9; font-family: monospace;">' +
                '<span>Chi Ads: <b style="color: #0f172a;">' + formatCurrency(c.spent) + '</b></span>' +
                '<span>Doanh thu nổ sau 72h: <b style="color: #059669;">' + formatCurrency(c.windowRev) + '</b> (' + c.windowOrdersCount + ' đơn)</span>' +
                '<span>ROAS 72h: <b style="color: ' + c.verdictColor + ';">' + (c.spent > 0 ? c.roas72.toFixed(2) + 'x' : 'Organic') + '</b></span>' +
                '<span>Click CTA/Bio: <b>' + (c.clicks + c.bio) + ' lượt</b></span>' +
                '<span style="margin-left: auto; font-weight: 700; color: ' + c.verdictColor + ';">Khuyến nghị: ' + c.verdict + '</span>' +
              '</div>' +
            '</div>'
          );
        }).join('');

        revenueChartContainer.innerHTML = (
          '<div style="width: 100%; display: flex; flex-direction: column; gap: 8px;">' +
            '<div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: #64748b; padding: 2px 4px;">' +
              '<span>Cửa sổ ghi nhận công 72h: Đo lường doanh thu phát sinh trong 3 ngày kế tiếp sau khi bật Ads.</span>' +
              '<span style="color: #059669; font-weight: 600;">Tự động phát hiện đợt nổ đơn do Ads</span>' +
            '</div>' +
            (!campaignAttribution.length 
              ? '<div style="text-align: center; color: var(--slate-muted); padding: 30px; font-size: 0.85rem;">Không có chiến dịch ads nào trong khoảng thời gian đã chọn.</div>'
              : '<div style="max-height: 220px; overflow-y: auto;">' + cardsHtml + '</div>') +
          '</div>'
        );
      } else if (statsActiveChartView === 'funnel') {
        // VIEW: MARKETING FUNNEL 4 TẦNG & CHUẨN ĐOÁN ĐIỂM NGHẼN
        const avgCPM = totalAdsViews > 0 ? Math.round((totalAdsSpent / totalAdsViews) * 1000) : 0;
        const totalEngagedViews = filteredAds.reduce((sum, a) => sum + (Number(a.focused_views || a.view_2s || 0) || Math.round((Number(a.views) || 0) * 0.2)), 0);
        const totalIntentClicks = totalAdsClicks + totalAdsBio;
        const avgCPC = totalIntentClicks > 0 ? Math.round(totalAdsSpent / totalIntentClicks) : 0;

        const stage1 = totalAdsViews > 0 ? totalAdsViews : 100;
        const stage2 = totalEngagedViews > 0 ? totalEngagedViews : Math.round(stage1 * 0.22);
        const stage3 = totalIntentClicks > 0 ? totalIntentClicks : Math.round(stage2 * 0.05);
        const stage4 = paidCount > 0 ? paidCount : 0;

        const rate1to2 = Math.round((stage2 / stage1) * 100);
        const rate2to3 = Math.round((stage3 / stage2) * 100);
        const rate3to4 = stage3 > 0 ? Math.round((stage4 / stage3) * 100) : 0;

        // Chuẩn đoán điểm nghẽn
        let diagnosis = 'Tỷ lệ nhấp CTA/Bio rất khả quan (CPC ' + formatCurrency(avgCPC) + '). Khách quan tâm cao nhưng tỷ lệ chốt đơn còn thấp -> Điểm nghẽn ở Giỏ hàng hoặc Trang thanh toán web!';
        if (rate1to2 < 15) {
          diagnosis = 'Tỷ lệ xem sâu dưới 15% -> Điểm nghẽn ở 3 giây đầu video. Cần thay đổi đoạn mở đầu (Hook) để giữ chân khách!';
        } else if (rate3to4 >= 20) {
          diagnosis = 'Phễu chuyển đổi cực tốt (Trên 20% người vào bio đã mua file). Đề xuất vít tăng ngân sách quảng cáo ngay!';
        }

        revenueChartContainer.innerHTML = (
          '<div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 4px 6px;">' +
            '<div style="display: flex; flex-direction: column; gap: 6px;">' +
              // Tầng 1: Views
              '<div style="display: flex; align-items: center; gap: 8px;">' +
                '<div style="width: 110px; font-size: 0.73rem; font-weight: 600; color: #475569; flex-shrink: 0;">1. Tiếp cận (Views)</div>' +
                '<div style="flex: 1; height: 24px; background: #f1f5f9; border-radius: 4px; overflow: hidden; position: relative;">' +
                  '<div style="width: 100%; height: 100%; background: #6ee7b7; border-radius: 4px; display: flex; align-items: center; padding: 0 10px; justify-content: space-between;">' +
                    '<span style="font-size: 0.72rem; font-weight: 700; color: #047857; font-family: monospace;">' + stage1.toLocaleString('vi-VN') + ' views</span>' +
                    '<span style="font-size: 0.68rem; color: #065f46;">CPM: ' + formatCurrency(avgCPM) + '</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              // Tầng 2: Xem sâu
              '<div style="display: flex; align-items: center; gap: 8px;">' +
                '<div style="width: 110px; font-size: 0.73rem; font-weight: 600; color: #475569; flex-shrink: 0;">2. Xem sâu (>2s)</div>' +
                '<div style="flex: 1; height: 24px; background: #f1f5f9; border-radius: 4px; overflow: hidden; position: relative;">' +
                  '<div style="width: ' + Math.max(rate1to2, 10) + '%; height: 100%; background: #7dd3fc; border-radius: 4px; display: flex; align-items: center; padding: 0 10px; justify-content: space-between;">' +
                    '<span style="font-size: 0.72rem; font-weight: 700; color: #0369a1; font-family: monospace;">' + stage2.toLocaleString('vi-VN') + ' lượt</span>' +
                    '<span style="font-size: 0.68rem; color: #075985;">' + rate1to2 + '% giữ chân</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              // Tầng 3: Click CTA / Bio
              '<div style="display: flex; align-items: center; gap: 8px;">' +
                '<div style="width: 110px; font-size: 0.73rem; font-weight: 600; color: #475569; flex-shrink: 0;">3. Ý định mua (Clicks)</div>' +
                '<div style="flex: 1; height: 24px; background: #f1f5f9; border-radius: 4px; overflow: hidden; position: relative;">' +
                  '<div style="width: ' + Math.max(Math.round((stage3 / stage1) * 100 * 6), 18) + '%; height: 100%; background: #fde047; border-radius: 4px; display: flex; align-items: center; padding: 0 10px; justify-content: space-between;">' +
                    '<span style="font-size: 0.72rem; font-weight: 700; color: #854d0e; font-family: monospace;">' + stage3 + ' click</span>' +
                    '<span style="font-size: 0.68rem; color: #713f12;">CPC: ' + formatCurrency(avgCPC) + '</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              // Tầng 4: Đơn chốt
              '<div style="display: flex; align-items: center; gap: 8px;">' +
                '<div style="width: 110px; font-size: 0.73rem; font-weight: 700; color: #0f172a; flex-shrink: 0;">4. Đơn hàng thực tế</div>' +
                '<div style="flex: 1; height: 24px; background: #f1f5f9; border-radius: 4px; overflow: hidden; position: relative;">' +
                  '<div style="width: ' + Math.max(Math.round((stage4 / Math.max(stage3, 1)) * 100), 12) + '%; height: 100%; background: #10b981; border-radius: 4px; display: flex; align-items: center; padding: 0 10px; justify-content: space-between;">' +
                    '<span style="font-size: 0.72rem; font-weight: 700; color: #ffffff; font-family: monospace;">' + stage4 + ' đơn thành công</span>' +
                    '<span style="font-size: 0.68rem; color: #ecfdf5; font-weight: 600;">' + formatCurrency(totalRevenue) + '</span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            // Chẩn đoán điểm nghẽn
            '<div style="display: flex; align-items: center; gap: 8px; margin-top: 6px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.73rem; color: #334155;">' +
              '<span style="font-weight: 700; color: #059669; flex-shrink: 0;">💡 Chuẩn đoán điểm nghẽn:</span>' +
              '<span>' + diagnosis + '</span>' +
            '</div>' +
          '</div>'
        );
      } else if (statsActiveChartView === 'decision') {
        // VIEW: 2X2 DECISION MATRIX (MA TRẬN QUYẾT ĐỊNH 4 Ô)
        revenueChartContainer.innerHTML = (
          '<div style="width: 100%; height: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 2px;">' +
            // Ô 1: VÍT TIẾP (Scale Winner)
            '<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; justify-content: space-between;">' +
              '<div>' +
                '<div style="font-weight: 700; font-size: 0.8rem; color: #166534; display: flex; align-items: center; gap: 5px;">🚀 1. VÍT NGÂN SÁCH (SCALE WINNER)</div>' +
                '<p style="margin: 4px 0 0; font-size: 0.72rem; color: #15803d; line-height: 1.35;">CPC rẻ (< 1.5k) & Doanh thu 72h vượt trội (ROAS >= 3.0x). Tệp khách chuẩn, tăng 30-50% ngân sách để gặt đơn.</p>' +
              '</div>' +
              '<div style="font-size: 0.7rem; font-weight: 600; color: #14532d; font-family: monospace; margin-top: 6px; border-top: 1px dashed #86efac; padding-top: 4px;">' +
                'Áp dụng: Các đợt có ROAS >= 3.0x' +
              '</div>' +
            '</div>' +
            // Ô 2: SỬA WEB / GIỎ HÀNG (Fix Landing)
            '<div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; justify-content: space-between;">' +
              '<div>' +
                '<div style="font-weight: 700; font-size: 0.8rem; color: #854d0e; display: flex; align-items: center; gap: 5px;">🛠️ 2. SỬA GIỎ HÀNG / WEB (BOTTLE-NECK)</div>' +
                '<p style="margin: 4px 0 0; font-size: 0.72rem; color: #a16207; line-height: 1.35;">Click CTA/Bio cực nhiều (như đợt 19/08 có 47 clicks, CPC 979đ) nhưng chưa ra đơn -> Giữ video ads, sửa web & giỏ hàng.</p>' +
              '</div>' +
              '<div style="font-size: 0.7rem; font-weight: 600; color: #713f12; font-family: monospace; margin-top: 6px; border-top: 1px dashed #fde047; padding-top: 4px;">' +
                'Áp dụng: Đợt 19/08 (Kho Tự Động)' +
              '</div>' +
            '</div>' +
            // Ô 3: NUÔI TỆP (Nurture - Video Part 2)
            '<div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; justify-content: space-between;">' +
              '<div>' +
                '<div style="font-weight: 700; font-size: 0.8rem; color: #6b21a8; display: flex; align-items: center; gap: 5px;">🌱 3. NUÔI TỆP (LÀM CLIP PART 2)</div>' +
                '<p style="margin: 4px 0 0; font-size: 0.72rem; color: #7e22ce; line-height: 1.35;">CPM rẻ, trên 1.000 người xem sâu (như đợt 18/09 có 1.217 xem tập trung) -> Khách thích nội dung, làm thêm clip nối tiếp.</p>' +
              '</div>' +
              '<div style="font-size: 0.7rem; font-weight: 600; color: #581c87; font-family: monospace; margin-top: 6px; border-top: 1px dashed #d8b4fe; padding-top: 4px;">' +
                'Áp dụng: Đợt 18/09 (Bán Hàng Online)' +
              '</div>' +
            '</div>' +
            // Ô 4: CẮT BỎ (Kill / Stop)
            '<div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; justify-content: space-between;">' +
              '<div>' +
                '<div style="font-weight: 700; font-size: 0.8rem; color: #9f1239; display: flex; align-items: center; gap: 5px;">🛑 4. CẮT BỎ / THAY ĐỔI HOOK</div>' +
                '<p style="margin: 4px 0 0; font-size: 0.72rem; color: #be123c; line-height: 1.35;">Chi phí Ads cao nhưng không có click và không nổ đơn sau 72h -> Tắt chiến dịch ngay lập tức, đổi góc quay mới.</p>' +
              '</div>' +
              '<div style="font-size: 0.7rem; font-weight: 600; color: #881337; font-family: monospace; margin-top: 6px; border-top: 1px dashed #fda4af; padding-top: 4px;">' +
                'Áp dụng: Các đợt ROAS < 1.0x không ra đơn' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      } else if (statsActiveChartView === 'waterfall') {
        // VIEW: WATERFALL P&L (THÁC NƯỚC DÒNG TIỀN ĐẦY ĐỦ: DOANH THU NIÊM YẾT -> GIẢM GIÁ COUPON -> ADS -> LỢI NHUẬN)
        const wfHeight = 180;
        const wfMax = Math.max(grossRevenue, totalRevenue, totalAdsSpent, 100000);
        const colWidth = 64;
        
        const grossH = grossRevenue > 0 ? Math.max(Math.round((grossRevenue / wfMax) * 115), 10) : 4;
        const discH = totalDiscount > 0 ? Math.max(Math.round((totalDiscount / wfMax) * 115), 6) : 4;
        const netRevH = totalRevenue > 0 ? Math.max(Math.round((totalRevenue / wfMax) * 115), 10) : 4;
        const adsH = totalAdsSpent > 0 ? Math.max(Math.round((totalAdsSpent / wfMax) * 115), 10) : 4;
        const profitH = Math.max(Math.round((Math.abs(netProfit) / wfMax) * 115), 8);

        const grossY = wfHeight - grossH - 24;
        const discTop = grossY;
        const adsTop = wfHeight - netRevH - 24;
        const profitY = wfHeight - profitH - 24;
        const netColor = netProfit >= 0 ? '#059669' : '#ef4444';

        revenueChartContainer.innerHTML = (
          '<div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 4px 10px;">' +
            '<div style="display: flex; justify-content: flex-end; gap: 12px; font-size: 0.7rem; color: #64748b; margin-bottom: 4px; flex-wrap: wrap;">' +
              '<span style="display: flex; align-items: center; gap: 4px;"><span style="display:inline-block; width:9px; height:8px; background:#6ee7b7; border-radius:2px;"></span>1. Doanh thu niêm yết</span>' +
              '<span style="display: flex; align-items: center; gap: 4px;"><span style="display:inline-block; width:9px; height:8px; background:#fbbf24; border-radius:2px;"></span>2. Giảm giá Coupon</span>' +
              '<span style="display: flex; align-items: center; gap: 4px;"><span style="display:inline-block; width:9px; height:8px; background:#10b981; border-radius:2px;"></span>3. Doanh thu thực nhận</span>' +
              '<span style="display: flex; align-items: center; gap: 4px;"><span style="display:inline-block; width:9px; height:8px; background:#f43f5e; border-radius:2px;"></span>4. Chi phí Ads</span>' +
              '<span style="display: flex; align-items: center; gap: 4px;"><span style="display:inline-block; width:9px; height:8px; background:' + netColor + '; border-radius:2px;"></span>5. Lợi nhuận sau Ads</span>' +
            '</div>' +
            '<div style="width: 100%; height: ' + wfHeight + 'px; position: relative; display: flex; align-items: flex-end; justify-content: space-around; padding: 0 10px;">' +
              // Cột 1: Doanh thu niêm yết (Gross)
              '<div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; width: ' + colWidth + 'px;" title="Doanh thu niêm yết: ' + formatCurrency(grossRevenue) + '">' +
                '<div style="font-size: 0.7rem; font-weight: 700; color: #047857; font-family: monospace; margin-bottom: 4px;">+' + formatCurrency(grossRevenue) + '</div>' +
                '<div style="width: 100%; height: ' + grossH + 'px; background: #6ee7b7; border: 1px solid #34d399; border-radius: 3px 3px 0 0;"></div>' +
                '<div style="font-size: 0.68rem; color: #1e293b; font-weight: 600; margin-top: 5px; white-space: nowrap;">1. Niêm yết</div>' +
              '</div>' +
              // Cột 2: Giảm giá Coupon (Discount)
              '<div style="display: flex; flex-direction: column; align-items: center; height: 100%; width: ' + colWidth + 'px; position: relative;" title="Giảm giá Coupon: -' + formatCurrency(totalDiscount) + '">' +
                '<div style="position: absolute; top: ' + (discTop - 18) + 'px; font-size: 0.7rem; font-weight: 700; color: #d97706; font-family: monospace;">-' + formatCurrency(totalDiscount) + '</div>' +
                '<div style="position: absolute; top: ' + discTop + 'px; width: 100%; height: ' + discH + 'px; background: #fde68a; border: 1px solid #fbbf24; border-radius: 3px;"></div>' +
                '<div style="position: absolute; bottom: 0; font-size: 0.68rem; color: #64748b; font-weight: 600; white-space: nowrap;">2. Giảm giá</div>' +
              '</div>' +
              // Cột 3: Doanh thu thực nhận (Net Revenue)
              '<div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; width: ' + colWidth + 'px;" title="Doanh thu thực nhận: ' + formatCurrency(totalRevenue) + '">' +
                '<div style="font-size: 0.7rem; font-weight: 700; color: #059669; font-family: monospace; margin-bottom: 4px;">+' + formatCurrency(totalRevenue) + '</div>' +
                '<div style="width: 100%; height: ' + netRevH + 'px; background: #34d399; border: 1px solid #10b981; border-radius: 3px 3px 0 0;"></div>' +
                '<div style="font-size: 0.68rem; color: #1e293b; font-weight: 600; margin-top: 5px; white-space: nowrap;">3. Thực nhận</div>' +
              '</div>' +
              // Cột 4: Chi phí Ads Marketing
              '<div style="display: flex; flex-direction: column; align-items: center; height: 100%; width: ' + colWidth + 'px; position: relative;" title="Chi phí Ads: -' + formatCurrency(totalAdsSpent) + '">' +
                '<div style="position: absolute; top: ' + (adsTop - 18) + 'px; font-size: 0.7rem; font-weight: 700; color: #e11d48; font-family: monospace;">-' + formatCurrency(totalAdsSpent) + '</div>' +
                '<div style="position: absolute; top: ' + adsTop + 'px; width: 100%; height: ' + adsH + 'px; background: #fda4af; border: 1px solid #f43f5e; border-radius: 3px;"></div>' +
                '<div style="position: absolute; bottom: 0; font-size: 0.68rem; color: #64748b; font-weight: 600; white-space: nowrap;">4. Chi phí Ads</div>' +
              '</div>' +
              // Cột 5: Lợi nhuận sau Ads (Net Contribution)
              '<div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; width: ' + colWidth + 'px;" title="Lợi nhuận ròng: ' + formatCurrency(netProfit) + '">' +
                '<div style="font-size: 0.7rem; font-weight: 700; color: ' + netColor + '; font-family: monospace; margin-bottom: 4px;">' + (netProfit >= 0 ? '+' : '-') + formatCurrency(Math.abs(netProfit)) + '</div>' +
                '<div style="width: 100%; height: ' + profitH + 'px; background: ' + (netProfit >= 0 ? '#10b981' : '#f87171') + '; border-radius: 3px 3px 0 0;"></div>' +
                '<div style="font-size: 0.68rem; color: #1e293b; font-weight: 700; margin-top: 5px; white-space: nowrap;">5. Lãi sau Ads</div>' +
              '</div>' +
            '</div>' +
            // Bảng tóm tắt P&L dòng tiền
            '<div style="display: flex; justify-content: space-around; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 12px; margin-top: 8px; font-size: 0.72rem; flex-wrap: wrap; gap: 6px;">' +
              '<span>Niêm yết: <b style="font-family: monospace;">' + formatCurrency(grossRevenue) + '</b></span>' +
              '<span>Giảm giá Coupon: <b style="color: #d97706; font-family: monospace;">-' + formatCurrency(totalDiscount) + '</b></span>' +
              '<span>Thực nhận: <b style="color: #059669; font-family: monospace;">' + formatCurrency(totalRevenue) + '</b></span>' +
              '<span>Tiền Ads: <b style="color: #e11d48; font-family: monospace;">-' + formatCurrency(totalAdsSpent) + '</b></span>' +
              '<span>Lãi sau Ads: <b style="color: ' + netColor + '; font-family: monospace;">' + formatCurrency(netProfit) + '</b> (' + (grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0) + '%)</span>' +
              '<span>ROAS: <b style="color: #059669; font-family: monospace;">' + overallRoasStr + '</b></span>' +
            '</div>' +
          '</div>'
        );
      } else if (statsActiveChartView === 'scatter') {
        // VIEW: SCATTER PLOT MATRIX (MA TRẬN 4 GÓC - SỬA LỖI MÉO BẦU DỤC VÀ ĐÈ CHỮ)
        const allItems = Object.keys({ ...productMap, ...productAdsMap }).map(pid => {
          const pOrder = productMap[pid] || { revenue: 0, count: 0, name: knownProductsMap[pid]?.name || pid };
          const pAd = productAdsMap[pid] || { spent: 0, views: 0 };
          return {
            id: pid,
            name: pOrder.name || pAd.name || knownProductsMap[pid]?.name || pid,
            revenue: pOrder.revenue,
            spent: pAd.spent,
            count: pOrder.count,
            net: pOrder.revenue - pAd.spent,
            roas: pAd.spent > 0 ? (pOrder.revenue / pAd.spent).toFixed(1) + 'x' : 'Organic'
          };
        }).sort((a, b) => b.revenue - a.revenue);

        const maxAdSpent = Math.max(...allItems.map(i => i.spent), 100000);
        const maxProductRev = Math.max(...allItems.map(i => i.revenue), 100000);
        
        // Cố định kích thước SVG chuẩn tỷ lệ, không dùng preserveAspectRatio=none để tránh méo bầu dục
        const svgW = 600;
        const svgH = 200;
        const paddingLeft = 50;
        const paddingRight = 40;
        const paddingTop = 25;
        const paddingBottom = 30;
        const plotW = svgW - paddingLeft - paddingRight;
        const plotH = svgH - paddingTop - paddingBottom;

        // Smart stagger labels để chống va chạm chữ
        const bubblesSvg = allItems.map((item, idx) => {
          const cx = Math.round(paddingLeft + (item.spent / maxAdSpent) * plotW);
          const cy = Math.round(paddingTop + plotH - (item.revenue / maxProductRev) * plotH);
          const r = Math.min(Math.max(item.count * 1.5 + 8, 8), 18);
          const color = item.net >= 0 ? '#10b981' : '#f43f5e';
          
          // Tạo tên ngắn gọn dễ đọc
          let shortName = item.name;
          if (shortName.includes('Nhập Xuất Tồn')) shortName = 'Kho & Nhập Xuất Tồn';
          else if (shortName.includes('bán hàng online')) shortName = 'Bán Hàng Online';
          else if (shortName.includes('F&B') || shortName.includes('Giá Vốn')) shortName = 'Giá Vốn F&B';
          else if (shortName.length > 18) shortName = shortName.slice(0, 16) + '...';

          // Stagger vị trí nhãn: chẵn ở trên, lẻ ở dưới / bên cạnh để không đè nhau
          const isTop = idx % 2 === 0;
          const labelY = isTop ? (cy - r - 6) : (cy + r + 13);
          const badgeY = isTop ? (labelY - 10) : (labelY + 10);

          return (
            '<g style="cursor: pointer;" title="' + escapeHtml(item.name) + '&#10;  Doanh thu: ' + formatCurrency(item.revenue) + '&#10;  Chi phí Ads: ' + formatCurrency(item.spent) + '&#10;  Lợi nhuận: ' + formatCurrency(item.net) + '&#10;  ROAS: ' + item.roas + '&#10;  Số đơn: ' + item.count + '">' +
              '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + color + '" fill-opacity="0.25" stroke="' + color + '" stroke-width="2"></circle>' +
              '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="' + color + '"></circle>' +
              '<text x="' + cx + '" y="' + labelY + '" text-anchor="middle" font-size="9" font-weight="700" fill="#0f172a">' + escapeHtml(shortName) + '</text>' +
              '<text x="' + cx + '" y="' + badgeY + '" text-anchor="middle" font-size="8" font-family="monospace" font-weight="600" fill="' + color + '">' + item.count + ' đơn • ' + (item.spent > 0 ? item.roas : 'Organic') + '</text>' +
            '</g>'
          );
        }).join('');

        revenueChartContainer.innerHTML = (
          '<div style="width: 100%; height: 100%; display: flex; flex-direction: column;">' +
            '<div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #64748b; margin-bottom: 2px;">' +
              '<span>Trục đứng (Y): Doanh thu thuần (VND)</span>' +
              '<span>Trục ngang (X): Chi phí Ads đã tiêu (VND) • Hình tròn hoàn hảo tỷ lệ số đơn</span>' +
            '</div>' +
            '<div style="width: 100%; overflow-x: auto;">' +
              '<svg viewBox="0 0 ' + svgW + ' ' + svgH + '" style="width: 100%; min-width: 520px; height: ' + svgH + 'px; display: block;">' +
                // 4 phân khu mờ pastel
                '<rect x="' + paddingLeft + '" y="' + paddingTop + '" width="' + (plotW / 2) + '" height="' + (plotH / 2) + '" fill="#f0fdf4" fill-opacity="0.7"></rect>' +
                '<rect x="' + (paddingLeft + plotW / 2) + '" y="' + paddingTop + '" width="' + (plotW / 2) + '" height="' + (plotH / 2) + '" fill="#ecfdf5" fill-opacity="0.85"></rect>' +
                '<rect x="' + (paddingLeft + plotW / 2) + '" y="' + (paddingTop + plotH / 2) + '" width="' + (plotW / 2) + '" height="' + (plotH / 2) + '" fill="#fff1f2" fill-opacity="0.7"></rect>' +
                '<rect x="' + paddingLeft + '" y="' + (paddingTop + plotH / 2) + '" width="' + (plotW / 2) + '" height="' + (plotH / 2) + '" fill="#f8fafc" fill-opacity="0.7"></rect>' +
                // Nhãn 4 phân khu
                '<text x="' + (paddingLeft + 10) + '" y="' + (paddingTop + 16) + '" font-size="8.5" font-weight="700" fill="#047857">⭐ ORGANIC STARS (Ads thấp - DT cao)</text>' +
                '<text x="' + (svgW - paddingRight - 10) + '" y="' + (paddingTop + 16) + '" text-anchor="end" font-size="8.5" font-weight="700" fill="#059669">🚀 SCALE WINNERS (Máy in tiền)</text>' +
                '<text x="' + (svgW - paddingRight - 10) + '" y="' + (svgH - paddingBottom - 10) + '" text-anchor="end" font-size="8.5" font-weight="700" fill="#e11d48">⚠️ CẦN TỐI ƯU ADS (Đốt tiền)</text>' +
                '<text x="' + (paddingLeft + 10) + '" y="' + (svgH - paddingBottom - 10) + '" font-size="8.5" font-weight="600" fill="#94a3b8">📦 TESTING / NICHE</text>' +
                // Trục X & Y
                '<line x1="' + paddingLeft + '" y1="' + (svgH - paddingBottom) + '" x2="' + (svgW - paddingRight) + '" y2="' + (svgH - paddingBottom) + '" stroke="#cbd5e1" stroke-width="1.5"></line>' +
                '<line x1="' + paddingLeft + '" y1="' + paddingTop + '" x2="' + paddingLeft + '" y2="' + (svgH - paddingBottom) + '" stroke="#cbd5e1" stroke-width="1.5"></line>' +
                bubblesSvg +
              '</svg>' +
            '</div>' +
          '</div>'
        );
      } else if (statsActiveChartView === 'pareto') {
        // VIEW: PARETO CHART 80/20 (SỬA LỖI ĐÈ NHÃN VÀ CẮT VỤN TÊN FILE)
        const paretoItems = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
        let cumSum = 0;
        const cumData = paretoItems.map(p => {
          cumSum += p.revenue;
          const cumPct = totalRevenue > 0 ? Math.round((cumSum / totalRevenue) * 100) : 0;
          return { ...p, cumPct };
        });

        const paretoH = 185;
        const maxRevVal = Math.max(...paretoItems.map(i => i.revenue), 100000);
        const maxBarH = 80; // Giới hạn chiều cao cột tối đa 80px để không chạm vào đường Pareto phía trên!

        // Tách bạch 2 trục: Cột Doanh thu ở dưới, Đường Pareto ở trên
        const barsHtml = cumData.map((item, idx) => {
          const barH = totalRevenue > 0 ? Math.max(Math.round((item.revenue / maxRevVal) * maxBarH), 8) : 4;
          
          let displayTitle = item.name;
          if (displayTitle.includes('Nhập Xuất Tồn')) displayTitle = 'Kho & Tồn Kho';
          else if (displayTitle.includes('bán hàng online')) displayTitle = 'Bán Hàng Online';
          else if (displayTitle.includes('F&B') || displayTitle.includes('Giá Vốn')) displayTitle = 'Giá Vốn F&B';
          else if (displayTitle.length > 18) displayTitle = displayTitle.slice(0, 16) + '...';

          return (
            '<div style="flex: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative;" title="' + escapeHtml(item.name) + '&#10;  Doanh thu: ' + formatCurrency(item.revenue) + '&#10;  Đóng góp tích lũy: ' + item.cumPct + '%">' +
              // Nhãn tiền trên đỉnh cột (ở độ cao an toàn, không đè lên đường Pareto)
              '<div style="font-size: 0.67rem; font-weight: 700; color: #059669; font-family: monospace; margin-bottom: 2px;">' + (Math.round(item.revenue / 1000) + 'k') + '</div>' +
              '<div style="width: 28px; height: ' + barH + 'px; background: #6ee7b7; border: 1px solid #34d399; border-radius: 2px 2px 0 0;"></div>' +
              '<div style="font-size: 0.7rem; color: #1e293b; font-weight: 600; margin-top: 6px; text-align: center; line-height: 1.25; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + escapeHtml(displayTitle) + '</div>' +
            '</div>'
          );
        }).join('');

        // Đường Pareto chạy ở vùng trên (từ y=15 đến y=75)
        const linePts = cumData.map((d, i) => {
          const xPct = ((i + 0.5) / Math.max(cumData.length, 1)) * 100;
          // yPx chạy từ 20px (100%) đến 75px (0%)
          const yPx = Math.round(75 - (d.cumPct / 100) * 55);
          return { xPct, yPx, cumPct: d.cumPct };
        });

        const svgD = linePts.map((pt, i) => (i === 0 ? 'M ' : 'L ') + pt.xPct + ' ' + pt.yPx).join(' ');
        const dotsSvg = linePts.map(pt => (
          '<circle cx="' + pt.xPct + '%" cy="' + pt.yPx + '" r="3.5" fill="#0284c7" stroke="#ffffff" stroke-width="1.5"></circle>' +
          '<text x="' + pt.xPct + '%" y="' + (pt.yPx - 7) + '" text-anchor="middle" font-size="8.5" font-family="monospace" font-weight="700" fill="#0284c7">' + pt.cumPct + '%</text>'
        )).join('');

        // Ngưỡng 80%
        const y80 = Math.round(75 - 0.8 * 55);

        revenueChartContainer.innerHTML = (
          '<div style="width: 100%; height: 100%; display: flex; flex-direction: column;">' +
            '<div style="display: flex; justify-content: flex-end; gap: 14px; font-size: 0.72rem; color: #64748b; margin-bottom: 4px;">' +
              '<span style="display: flex; align-items: center; gap: 5px;"><span style="display:inline-block; width:10px; height:7px; background:#6ee7b7; border-radius:1px;"></span>Cột: Doanh thu</span>' +
              '<span style="display: flex; align-items: center; gap: 5px;"><span style="display:inline-block; width:12px; height:2px; background:#0284c7;"></span>Đường: % Tích lũy (Pareto)</span>' +
              '<span style="display: flex; align-items: center; gap: 5px;"><span style="display:inline-block; width:12px; height:1px; border-top: 1px dashed #ef4444;"></span>Ngưỡng 80%</span>' +
            '</div>' +
            '<div style="width: 100%; height: ' + paretoH + 'px; position: relative; display: flex; align-items: flex-end; padding-bottom: 4px;">' +
              // Đường tham chiếu 80%
              '<div style="position: absolute; top: ' + y80 + 'px; left: 0; width: 100%; border-top: 1px dashed #ef4444; z-index: 2; pointer-events: none;">' +
                '<span style="position: absolute; right: 4px; top: -14px; font-size: 0.65rem; color: #ef4444; font-weight: 700; font-family: monospace;">Ngưỡng 80% cốt lõi</span>' +
              '</div>' +
              '<svg style="position: absolute; top: 0; left: 0; width: 100%; height: ' + paretoH + 'px; pointer-events: none; z-index: 4;" preserveAspectRatio="none" viewBox="0 0 100 ' + paretoH + '">' +
                '<path d="' + svgD + '" fill="none" stroke="#0284c7" stroke-width="2" vector-effect="non-scaling-stroke"></path>' +
              '</svg>' +
              '<svg style="position: absolute; top: 0; left: 0; width: 100%; height: ' + paretoH + 'px; pointer-events: none; z-index: 5;">' +
                dotsSvg +
              '</svg>' +
              barsHtml +
            '</div>' +
          '</div>'
        );
      } else {
        // DEFAULT VIEW: COMBO LINE + DUAL-BAR (DOANH THU CỘT MINT + CHI PHÍ ADS CỘT SLATE + LINE SỐ ĐƠN)
        if (!dailyList.length) {
          revenueChartContainer.innerHTML = '<div style="margin: auto; color: var(--muted); font-size: 0.85rem;">Không có dữ liệu trong khoảng thời gian này.</div>';
        } else {
          const itemMinWidth = isAllTime ? 60 : (dailyList.length > 20 ? 34 : (dailyList.length <= 14 ? 52 : 38));
          const chartHeight = 165;
          const totalItems = dailyList.length;
          const linePoints = [];

          dailyList.forEach((d, idx) => {
            const y = chartHeight - Math.round((d.count / maxCount) * (chartHeight - 45)) - 14;
            linePoints.push({ idx, y, rev: d.revenue, adsSpent: d.adsSpent || 0, count: d.count, key: d.key });
          });

          const barsHtml = dailyList.map((d, idx) => {
            const revHeightPx = d.revenue > 0 ? Math.max(Math.round((d.revenue / maxVal) * (chartHeight - 45)), 8) : 2;
            const adsHeightPx = (d.adsSpent || 0) > 0 ? Math.max(Math.round((d.adsSpent / maxVal) * (chartHeight - 45)), 8) : 2;
            const displayLabel = d.label || d.key;
            const isToday = d.key === todayStr;

            return (
              '<div style="flex: ' + (dailyList.length > 14 ? '0 0 ' + itemMinWidth + 'px' : '1') + '; min-width: ' + itemMinWidth + 'px; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative;" title="' + (d.fullDate || d.key) + '&#10;  Doanh thu: ' + formatCurrency(d.revenue) + '&#10;  Chi phí Ads: ' + formatCurrency(d.adsSpent || 0) + '&#10;  Lợi nhuận: ' + formatCurrency(d.revenue - (d.adsSpent || 0)) + '&#10;  Số đơn: ' + d.count + ' đơn">' +
                // Label tiền trên đỉnh
                (d.revenue > 0 ? '<div style="position: absolute; bottom: ' + (Math.max(revHeightPx, adsHeightPx) + 16) + 'px; z-index: 5; font-size: 0.62rem; font-weight: 700; color: #059669; font-family: monospace; white-space: nowrap; pointer-events: none;">' + (Math.round(d.revenue / 1000) + 'k') + '</div>' : '') +
                // Cặp cột kép Side-by-side
                '<div style="display: flex; align-items: flex-end; gap: 2px;">' +
                  '<div style="width: 8px; height: ' + revHeightPx + 'px; background: ' + (d.revenue > 0 ? '#6ee7b7' : '#f1f5f9') + '; border-radius: 2px 2px 0 0;" title="Doanh thu: ' + formatCurrency(d.revenue) + '"></div>' +
                  '<div style="width: 8px; height: ' + adsHeightPx + 'px; background: ' + ((d.adsSpent || 0) > 0 ? '#cbd5e1' : '#f8fafc') + '; border-radius: 2px 2px 0 0;" title="Ads: ' + formatCurrency(d.adsSpent || 0) + '"></div>' +
                '</div>' +
                '<div style="font-size: 0.67rem; color: ' + (isToday ? '#059669' : '#64748b') + '; font-weight: ' + (isToday ? '700' : '400') + '; margin-top: 5px; white-space: nowrap;">' + displayLabel + '</div>' +
              '</div>'
            );
          }).join('');

          const svgPathD = linePoints.map((pt, i) => {
            const xPercent = ((i + 0.5) / totalItems) * 100;
            return (i === 0 ? 'M ' : 'L ') + xPercent + ' ' + pt.y;
          }).join(' ');

          const dotsSvg = linePoints.filter(pt => pt.count > 0).map(pt => {
            const xPercent = ((pt.idx + 0.5) / totalItems) * 100;
            return '<text x="' + xPercent + '%" y="' + (pt.y - 5) + '" text-anchor="middle" font-size="8.5" font-weight="700" fill="#047857" font-family="monospace">' + pt.count + '</text>';
          }).join('');

          revenueChartContainer.innerHTML = (
            '<div style="width: 100%; height: 100%; display: flex; flex-direction: column;">' +
              '<div style="display: flex; justify-content: flex-end; gap: 14px; font-size: 0.7rem; color: #64748b; margin-bottom: 6px;">' +
                '<span style="display: flex; align-items: center; gap: 5px;"><span style="display:inline-block; width:8px; height:8px; background:#6ee7b7; border-radius:1px;"></span>Cột xanh: Doanh thu</span>' +
                '<span style="display: flex; align-items: center; gap: 5px;"><span style="display:inline-block; width:8px; height:8px; background:#cbd5e1; border-radius:1px;"></span>Cột xám: Chi phí Ads</span>' +
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
    }

    // 8. KHỐI HIỆU QUẢ & P&L TỪNG FILE (BEST SELLERS & MARKETING P&L)
    if (bestSellersContainer) {
      const allFileIds = new Set([...Object.keys(productMap), ...Object.keys(productAdsMap)]);
      const filePnlList = Array.from(allFileIds).map(pid => {
        const pOrder = productMap[pid] || { count: 0, revenue: 0, name: knownProductsMap[pid]?.name || pid };
        const pAd = productAdsMap[pid] || { spent: 0, views: 0, clicks: 0, bio: 0 };
        const rev = pOrder.revenue;
        const spent = pAd.spent;
        const net = rev - spent;
        const roas = spent > 0 ? (rev / spent).toFixed(2) + 'x' : 'Organic';
        const cpa = pOrder.count > 0 && spent > 0 ? formatCurrency(Math.round(spent / pOrder.count)) : (spent > 0 ? 'Chưa ra đơn' : '0 đ');

        return {
          id: pid,
          name: pOrder.name || pAd.name || knownProductsMap[pid]?.name || pid,
          revenue: rev,
          spent: spent,
          net: net,
          count: pOrder.count,
          roas: roas,
          cpa: cpa
        };
      }).filter(item => item.id !== '__ARCHIVED_TEST__')
        .sort((a, b) => (b.revenue + b.spent) - (a.revenue + a.spent))
        .slice(0, 6);

      if (!filePnlList.length) {
        bestSellersContainer.innerHTML = '<div style="margin: 20px 0; text-align: center; color: var(--muted); font-size: 0.85rem;">Chưa có dữ liệu bán hàng hoặc chạy ads.</div>';
      } else {
        const maxFileMetric = Math.max(...filePnlList.map(f => Math.max(f.revenue, f.spent)), 1);

        bestSellersContainer.innerHTML = filePnlList.map((item, idx) => {
          const rank = idx + 1;
          const revPct = Math.max(Math.round((item.revenue / maxFileMetric) * 100), 2);
          const spentPct = item.spent > 0 ? Math.max(Math.round((item.spent / maxFileMetric) * 100), 2) : 0;
          const netColor = item.net >= 0 ? '#059669' : '#ef4444';
          const netLabel = (item.net >= 0 ? '+' : '-') + formatCurrency(Math.abs(item.net));

          return (
            '<div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">' +
              '<div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 0.77rem; margin-bottom: 4px;">' +
                '<div style="min-width: 0; flex: 1; margin-right: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' +
                  '<span style="font-weight: 700; color: #475569; font-family: monospace; margin-right: 6px;">0' + rank + '</span>' +
                  '<span style="font-weight: 600; color: #1e293b;" title="' + escapeHtml(item.name) + '">' + escapeHtml(item.name) + '</span>' +
                '</div>' +
                '<div style="font-weight: 700; color: ' + netColor + '; font-family: monospace; font-size: 0.82rem; flex-shrink: 0;" title="Lợi nhuận sau Ads">' +
                  netLabel +
                '</div>' +
              '</div>' +
              // Dual Progress bar: Doanh thu (Mint) vs Ads (Slate)
              '<div style="display: flex; flex-direction: column; gap: 2px;">' +
                '<div style="width: 100%; height: 5px; background: #f8fafc; border-radius: 2px; overflow: hidden;">' +
                  '<div style="width: ' + revPct + '%; height: 100%; background: #10b981; border-radius: 2px;" title="Doanh thu: ' + formatCurrency(item.revenue) + '"></div>' +
                '</div>' +
                (item.spent > 0 ? (
                  '<div style="width: 100%; height: 4px; background: #f8fafc; border-radius: 2px; overflow: hidden;">' +
                    '<div style="width: ' + spentPct + '%; height: 100%; background: #94a3b8; border-radius: 2px;" title="Chi phí Ads: ' + formatCurrency(item.spent) + '"></div>' +
                  '</div>'
                ) : '') +
              '</div>' +
              // Micro stats line
              '<div style="display: flex; justify-content: space-between; font-size: 0.69rem; color: #64748b; margin-top: 4px; font-family: monospace;">' +
                '<span>DT: <b>' + formatCurrency(item.revenue) + '</b> (' + item.count + ' đơn)</span>' +
                '<span>Ads: <b>' + (item.spent > 0 ? formatCurrency(item.spent) : '0 đ') + '</b> • ROAS: <b style="color:' + (item.spent > 0 && item.net >= 0 ? '#059669' : '#475569') + '">' + item.roas + '</b></span>' +
              '</div>' +
            '</div>'
          );
        }).join('');
      }
    }

    // 9. KHUNG GIỜ MUA HÀNG SÔI ĐỘNG NHẤT
    if (hourlyChartContainer) {
      const maxHourly = Math.max(...hourlyMap, 1);
      const peakHourCount = Math.max(...hourlyMap);

      hourlyChartContainer.innerHTML = hourlyMap.map((cnt, hr) => {
        const heightPct = Math.max(Math.round((cnt / maxHourly) * 100), 4);
        const isPeak = cnt === peakHourCount && cnt > 0;
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

    // 10. CƠ CẤU DANH MỤC & NGÂN SÁCH (DONUT VS TREEMAP)
    if (categoryChartContainer) {
      const catList = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);
      const pastelDonutPalette = ['#6ee7b7', '#7dd3fc', '#fde047', '#c4b5fd', '#f9a8d4', '#cbd5e1'];

      if (!catList.length || (totalRevenue <= 0 && totalAdsSpent <= 0)) {
        categoryChartContainer.innerHTML = '<div style="margin: auto; color: var(--slate-muted); font-size: 0.85rem; text-align: center; padding: 20px 0;">Chưa có dữ liệu danh mục trong kỳ.</div>';
      } else if (statsCategoryView === 'treemap') {
        // VIEW: TREEMAP BẢN ĐỒ NHIỆT PHÂN VÙNG
        const maxCatTotal = Math.max(...catList.map(c => c.revenue + (c.adsSpent || 0)), 1);

        categoryChartContainer.innerHTML = (
          '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; padding: 4px 0; width: 100%;">' +
            catList.map((c, i) => {
              const bg = pastelDonutPalette[i % pastelDonutPalette.length];
              const pct = totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : 0;
              return (
                '<div style="background: ' + bg + '; padding: 8px 10px; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; min-height: 58px;" title="' + escapeHtml(c.label) + '&#10;  Doanh thu: ' + formatCurrency(c.revenue) + '&#10;  Chi phí Ads: ' + formatCurrency(c.adsSpent || 0) + '">' +
                  '<div style="font-weight: 700; font-size: 0.74rem; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + escapeHtml(c.label) + '</div>' +
                  '<div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 0.7rem; font-family: monospace; color: #1e293b; margin-top: 4px;">' +
                    '<span>' + formatCurrency(c.revenue) + ' (' + pct + '%)</span>' +
                    '<span style="font-size: 0.65rem; color: #475569;">Ads: ' + formatCurrency(c.adsSpent || 0) + '</span>' +
                  '</div>' +
                '</div>'
              );
            }).join('') +
          '</div>'
        );
      } else {
        // DEFAULT: DONUT CHART
        const radius = 38;
        const circumference = 2 * Math.PI * radius;
        let strokeOffset = 0;

        const donutSlicesSvg = catList.map((c, i) => {
          const ratio = totalRevenue > 0 ? (c.revenue / totalRevenue) : (1 / catList.length);
          const sliceLen = ratio * circumference;
          const color = pastelDonutPalette[i % pastelDonutPalette.length];
          const sliceSvg = '<circle cx="55" cy="55" r="' + radius + '" fill="transparent" stroke="' + color + '" stroke-width="14" stroke-dasharray="' + sliceLen.toFixed(1) + ' ' + (circumference - sliceLen).toFixed(1) + '" stroke-dashoffset="' + (-strokeOffset).toFixed(1) + '" transform="rotate(-90 55 55)"></circle>';
          strokeOffset += sliceLen;
          return sliceSvg;
        }).join('');

        const donutSvg = (
          '<svg width="110" height="110" viewBox="0 0 110 110" style="flex-shrink: 0;">' +
            '<circle cx="55" cy="55" r="' + radius + '" fill="transparent" stroke="#f1f5f9" stroke-width="14"></circle>' +
            donutSlicesSvg +
            '<text x="55" y="52" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a" font-family="monospace">' + catList.length + '</text>' +
            '<text x="55" y="65" text-anchor="middle" font-size="8" fill="#64748b">nhóm</text>' +
          '</svg>'
        );

        const legendListHtml = catList.map((c, i) => {
          const color = pastelDonutPalette[i % pastelDonutPalette.length];
          const pct = totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : 0;
          return (
            '<div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.74rem; margin-bottom: 5px;" title="Doanh thu: ' + formatCurrency(c.revenue) + ' • Chi phí Ads: ' + formatCurrency(c.adsSpent || 0) + '">' +
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

    // 11. CHU KỲ MUA HÀNG THEO THỨ TRONG TUẦN
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
          '<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; height: 100%; justify-content: flex-end;" title="' + dayFullNames[idx] + ': ' + cnt + ' đơn&#10;  Doanh thu: ' + formatCurrency(rev) + '">' +
            '<div style="font-size: 0.66rem; font-weight: 700; color: ' + (isPeak ? '#047857' : '#059669') + '; font-family: monospace;">' + (cnt > 0 ? (cnt + ' đơn') : '') + '</div>' +
            '<div style="width: 100%; max-width: 18px; height: ' + heightPct + 'px; background: ' + barColor + '; border-radius: 2px 2px 0 0; transition: height 0.3s ease;"></div>' +
            '<div style="font-size: 0.7rem; color: ' + (isToday ? '#059669' : '#64748b') + '; font-weight: ' + (isToday ? '700' : '400') + '; margin-top: 4px;">' + dayLabels[idx] + '</div>' +
          '</div>'
        );
      }).join('');
    }

    // 12. CHUYỂN ĐỔI & GIỮ CHÂN KHÁCH HÀNG
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
            '<div>Khung giờ vàng chốt đơn: <b>' + peakHr + '</b> và <b>' + peakWd + '</b>. Đặt ngân sách ads hoặc đăng clip TikTok trước khung giờ này 30 phút để tối ưu CPA.</div>' +
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
        customerHtml += `<div style="font-size: 0.70rem; color: #94a3b8; margin-top: 1px; max-width: 195px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(cleanEmail)}">${escapeHtml(cleanEmail)}</div>`;
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
    // Bộ chọn góc nhìn biểu đồ chính (Combo, Waterfall, Scatter, Pareto)
  const statsChartViewSelector = document.getElementById('statsChartViewSelector');
  if (statsChartViewSelector) {
    statsChartViewSelector.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-view]');
      if (!btn) return;
      statsChartViewSelector.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      statsActiveChartView = btn.dataset.view;
      renderStatsDashboard();
    });
  }

  // Bộ chọn chế độ xem danh mục (Donut vs Treemap)
  const statsCategoryViewSelector = document.getElementById('statsCategoryViewSelector');
  if (statsCategoryViewSelector) {
    statsCategoryViewSelector.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-catview]');
      if (!btn) return;
      statsCategoryViewSelector.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      statsCategoryView = btn.dataset.catview;
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
          <td style="min-width: 260px; max-width: 340px;">
            <div style="font-family: monospace; font-size: 0.92rem; font-weight: 700; color: #0f172a; letter-spacing: 0.05em;">${escapeHtml(c.code)}</div>
            ${c.description ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 3px; line-height: 1.45;">${escapeHtml(c.description)}</div>` : ''}
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
  currentAds = currentAds || [];
  const adsListBody = document.getElementById('adsListBody');
  const adsDrawerBackdrop = document.getElementById('adsDrawerBackdrop');
  const adsDrawer = document.getElementById('adsDrawer');
  const adsForm = document.getElementById('adsForm');
  const btnOpenAddAds = document.getElementById('btnOpenAddAds');
  const btnCloseAdsModal = document.getElementById('btnCloseAdsModal');
  const btnCancelAds = document.getElementById('btnCancelAds');
  const adsProductFilter = document.getElementById('adsProductFilter');
  const adsProductSelect = document.getElementById('adsProductSelect');
  const adsSpentInput = document.getElementById('adsSpentInput');
  const adsDateInput = document.getElementById('adsDateInput');
  const adsDateInputText = document.getElementById('adsDateInputText');

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

  // Bind dd/mm/yyyy input and date picker for Ads (Start Date & End Date)
  function setupDatePickerPair(textId, dateId, isStartDate) {
    const textEl = document.getElementById(textId);
    const dateEl = document.getElementById(dateId);
    if (!textEl || !dateEl) return;

    textEl.addEventListener('input', () => {
      const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(textEl.value.trim());
      dateEl.value = parts ? `${parts[3]}-${parts[2]}-${parts[1]}` : '';
      textEl.setCustomValidity(textEl.value && !dateEl.value ? 'Vui lòng nhập ngày theo định dạng dd/mm/yyyy.' : '');
      if (isStartDate && dateEl.value) {
        const endText = document.getElementById('adsEndDateInputText');
        const endDate = document.getElementById('adsEndDateInput');
        if (endDate && (!endDate.value || endDate.value < dateEl.value)) {
          endDate.value = dateEl.value;
          if (endText) endText.value = textEl.value;
        }
      }
    });

    dateEl.addEventListener('click', () => dateEl.showPicker?.());
    dateEl.addEventListener('change', () => {
      textEl.value = dateEl.value ? formatDateVN(dateEl.value) : '';
      textEl.setCustomValidity('');
      if (isStartDate && dateEl.value) {
        const endText = document.getElementById('adsEndDateInputText');
        const endDate = document.getElementById('adsEndDateInput');
        if (endDate && (!endDate.value || endDate.value < dateEl.value)) {
          endDate.value = dateEl.value;
          if (endText) endText.value = textEl.value;
        }
      }
    });
  }

  setupDatePickerPair('adsStartDateInputText', 'adsStartDateInput', true);

  function getDurationLabel(hours) {
    if (hours === 12) return '12 giờ';
    if (hours === 24) return '1 ngày (24h)';
    const days = Math.round(hours / 24);
    return `${days} ngày`;
  }

  function updateCalculatedEndTime() {
    let startDate = document.getElementById('adsStartDateInput')?.value || '';
    const startDateText = document.getElementById('adsStartDateInputText')?.value.trim() || '';
    if (!startDate && startDateText) {
      const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(startDateText);
      if (parts) startDate = `${parts[3]}-${parts[2]}-${parts[1]}`;
    }
    if (!startDate) {
      startDate = new Date().toISOString().split('T')[0];
    }
    const startTime = document.getElementById('adsStartTimeInput')?.value || '00:00';
    const durationHours = parseInt(document.getElementById('adsDurationHoursInput')?.value, 10) || 24;

    const [h, m] = startTime.split(':').map(Number);
    const [year, month, day] = startDate.split('-').map(Number);
    const startDt = new Date(year, month - 1, day, h, m || 0, 0);

    const endDt = new Date(startDt.getTime() + durationHours * 3600 * 1000);

    const endY = endDt.getFullYear();
    const endM = String(endDt.getMonth() + 1).padStart(2, '0');
    const endD = String(endDt.getDate()).padStart(2, '0');
    const endH = String(endDt.getHours()).padStart(2, '0');
    const endMin = String(endDt.getMinutes()).padStart(2, '0');

    const previewEl = document.getElementById('adsCalculatedEndText');
    if (previewEl) {
      previewEl.textContent = `Dự kiến kết thúc: ${endD}/${endM}/${endY} lúc ${endH}:${endMin}`;
    }

    return {
      endDate: `${endY}-${endM}-${endD}`,
      endTime: `${endH}:${endMin}`,
      durationLabel: getDurationLabel(durationHours),
      durationHours
    };
  }

  function setAdsDuration(hours) {
    const hiddenInp = document.getElementById('adsDurationHoursInput');
    if (hiddenInp) hiddenInp.value = hours;

    document.querySelectorAll('#adsDurationOptions .btn-duration-tag').forEach(btn => {
      const bHours = parseInt(btn.dataset.hours, 10);
      if (bHours === hours) {
        btn.classList.add('active');
        btn.style.borderColor = '#059669';
        btn.style.background = '#ecfdf5';
        btn.style.color = '#047857';
        btn.style.fontWeight = '700';
      } else {
        btn.classList.remove('active');
        btn.style.borderColor = '#cbd5e1';
        btn.style.background = '#ffffff';
        btn.style.color = '#334155';
        btn.style.fontWeight = '500';
      }
    });

    updateCalculatedEndTime();
  }

  // Bind duration tag clicks
  document.querySelectorAll('#adsDurationOptions .btn-duration-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const h = parseInt(btn.dataset.hours, 10);
      if (h) setAdsDuration(h);
    });
  });

  document.getElementById('adsStartDateInputText')?.addEventListener('input', updateCalculatedEndTime);
  document.getElementById('adsStartDateInput')?.addEventListener('change', updateCalculatedEndTime);
  document.getElementById('adsStartTimeInput')?.addEventListener('change', updateCalculatedEndTime);

  function calculateCPMAndCPC() {
    const spentVal = document.getElementById('adsSpentInput')?.value.replace(/\D/g, '') || '';
    const spent = parseInt(spentVal, 10) || 0;
    const views = parseInt(document.getElementById('adsViewsInput')?.value, 10) || 0;
    const clicks = parseInt(document.getElementById('adsButtonClicksInput')?.value, 10) || 0;

    const cpmInput = document.getElementById('adsCpmInput');
    let cpm = 0;
    if (cpmInput) {
      if (spent > 0 && views > 0) {
        cpm = Math.round((spent / views) * 1000);
        cpmInput.value = new Intl.NumberFormat('vi-VN').format(cpm) + ' đ';
      } else {
        cpmInput.value = '';
      }
    }

    const cpcInput = document.getElementById('adsCpcInput');
    let cpc = 0;
    if (cpcInput) {
      if (spent > 0 && clicks > 0) {
        cpc = Math.round(spent / clicks);
        cpcInput.value = new Intl.NumberFormat('vi-VN').format(cpc) + ' đ';
      } else {
        cpcInput.value = '';
      }
    }

    return { cpm, cpc };
  }
  const calculateCPM = () => calculateCPMAndCPC().cpm;

  document.getElementById('adsSpentInput')?.addEventListener('input', calculateCPMAndCPC);
  document.getElementById('adsViewsInput')?.addEventListener('input', calculateCPMAndCPC);
  document.getElementById('adsButtonClicksInput')?.addEventListener('input', calculateCPMAndCPC);


  // adsEndDateInput replaced by duration selector

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

      // Format date range
      const fmtD = (d) => {
        if (!d) return '';
        const parts = d.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
      };

      const sDate = a.start_date || a.date || '';
      const eDate = a.end_date || a.start_date || a.date || '';
      const sTime = a.start_time || (a.time_frame && a.time_frame.includes('-') ? a.time_frame.split('-')[0].trim() : '');
      const eTime = a.end_time || (a.time_frame && a.time_frame.includes('-') ? a.time_frame.split('-')[1].trim() : '');

      let dateDisplay = 'Chưa đặt';
      let timeDisplay = a.duration_label || a.time_frame || '24h';

      if (sDate) {
        if (sDate === eDate) {
          dateDisplay = fmtD(sDate);
        } else {
          dateDisplay = `${fmtD(sDate)} → ${fmtD(eDate)}`;
        }
        if (a.duration_label) {
          timeDisplay = a.duration_label;
        } else if (sTime && eTime) {
          timeDisplay = `${sTime} - ${eTime}`;
        }
      }

      return `
        <tr>
          <td>
            <div style="font-weight: 600; color: #0f172a; font-size: 0.88rem;">${escapeHtml(dateDisplay)}</div>
            <div style="font-size: 0.74rem; color: #64748b; margin-top: 2px;">${escapeHtml(timeDisplay)}</div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;" title="${escapeHtml(a.title || '')}">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 4px; background: #f8fafc; border: 1px solid #e2e8f0; flex-shrink: 0;" title="${escapeHtml(channelLabel)}">
                ${channelIcon}
              </span>
              ${(a.url && a.ad_url && a.url !== a.ad_url) ? `
                <a href="${escapeHtml(a.url)}" target="_blank" rel="noopener" style="font-size: 0.76rem; font-weight: 600; color: #059669; text-decoration: none; display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px;" title="Xem video / bài viết">
                  <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  <span>Link bài</span>
                </a>` : ''}
              ${(a.ad_url || a.manager_url || a.url) ? `
                <a href="${escapeHtml(a.ad_url || a.manager_url || a.url)}" target="_blank" rel="noopener" style="font-size: 0.76rem; font-weight: 600; color: #2563eb; text-decoration: none; display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px;" title="Xem báo cáo / chi tiết Ads">
                  <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  <span>Link Ads</span>
                </a>` : `
                <span style="font-size: 0.76rem; color: #94a3b8;">Chưa gắn link</span>`}
            </div>
            ${(a.title && !a.title.startsWith('Ads: ') && a.title !== prodName) ? `
              <div style="font-size: 0.72rem; color: #64748b; margin-top: 3px;" title="${escapeHtml(a.title)}">${escapeHtml(a.title)}</div>` : ''}
          </td>
          <td>
            <span style="font-size: 0.86rem; color: #334155; font-weight: 500;">${escapeHtml(prodName)}</span>
          </td>
          <td>
            <strong style="color: #0f172a; font-family: monospace; font-size: 0.95rem;">${formatCurrency(a.spent || 0)}</strong>
          </td>
          <td>
            ${(() => {
              const spent = Number(a.spent) || 0;
              const views = Number(a.views) || 0;
              const clicks = Number(a.button_clicks) || 0;
              const cpm = a.cpm || (spent > 0 && views > 0 ? Math.round((spent / views) * 1000) : 0);
              const cpc = a.cpc || (spent > 0 && clicks > 0 ? Math.round(spent / clicks) : 0);

              // Dòng 1: Views • Nhấp nút • CPM • CPC
              const p1 = [];
              if (views) p1.push(`${new Intl.NumberFormat('vi-VN').format(views)} views`);
              if (clicks) p1.push(`${new Intl.NumberFormat('vi-VN').format(clicks)} nhấp nút`);
              if (cpm) p1.push(`CPM ${new Intl.NumberFormat('vi-VN').format(cpm)}đ`);
              if (cpc) p1.push(`CPC ${new Intl.NumberFormat('vi-VN').format(cpc)}đ`);

              // Dòng 2: Tỷ lệ giữ chân video (Xem 2s: 40.4% • 6s: 10.0% • Hết video: 1.3%)
              const fmtPct = (val) => {
                if (!val && val !== 0) return '';
                const s = String(val).trim();
                return s.endsWith('%') ? s : `${s}%`;
              };
              const v2s = fmtPct(a.view_2s || a.view_2s_rate);
              const v6s = fmtPct(a.view_6s || a.view_6s_rate);
              const vFull = fmtPct(a.watch_full || a.view_full || a.view_full_rate);

              const pRetention = [];
              if (v2s) pRetention.push(`Xem 2s: ${v2s}`);
              if (v6s) pRetention.push(`6s: ${v6s}`);
              if (vFull) pRetention.push(`Hết video: ${vFull}`);

              // Dòng 3: Tương tác cộng đồng
              const pEngagement = [];
              if (a.likes) pEngagement.push(`${a.likes} like`);
              if (a.followers) pEngagement.push(`+${a.followers} follow`);
              if (a.comments) pEngagement.push(`${a.comments} cmt`);
              if (a.shares) pEngagement.push(`${a.shares} share`);
              if (a.focused_views) pEngagement.push(`${new Intl.NumberFormat('vi-VN').format(a.focused_views)} tập trung`);
              if (a.profile_visits) pEngagement.push(`${a.profile_visits} bio`);

              if (!p1.length && !pRetention.length && !pEngagement.length) {
                return `<span style="font-size: 0.82rem; color: #94a3b8;">${escapeHtml(a.time_frame || 'Chưa nhập số liệu')}</span>`;
              }

              return `
                ${p1.length ? `<div style="font-size: 0.82rem; font-weight: 600; color: #0f172a; font-family: monospace;">${escapeHtml(p1.join(' • '))}</div>` : ''}
                ${pRetention.length ? `<div style="font-size: 0.74rem; font-weight: 600; color: #047857; margin-top: 2px; font-family: monospace;">${escapeHtml(pRetention.join(' • '))}</div>` : ''}
                ${pEngagement.length ? `<div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">${escapeHtml(pEngagement.join(' • '))}</div>` : ''}
              `;
            })()}
            ${a.notes ? `<div style="font-size: 0.72rem; color: #94a3b8; margin-top: 3px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(a.notes)}">${escapeHtml(a.notes)}</div>` : ''}
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

    function setTimeSelectVal(selectId, val) {
    const el = document.getElementById(selectId);
    if (!el) return;
    if (!val) val = selectId.includes('End') ? '23:59' : '00:00';
    let exists = Array.from(el.options).some(o => o.value === val);
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      el.appendChild(opt);
    }
    el.value = val;
  }

  function openAddAdsModal() {
    const backdrop = document.getElementById('adsDrawerBackdrop');
    const form = document.getElementById('adsForm');
    if (!backdrop || !form) {
      console.error('Không tìm thấy adsDrawerBackdrop hoặc adsForm');
      return;
    }
    form.reset();
    document.getElementById('adsDocId').value = '';
    const titleModal = document.getElementById('adsModalTitle');
    if (titleModal) titleModal.textContent = 'Thêm chiến dịch quảng cáo';
    
    try { populateAdsProductDropdowns(); } catch (e) {}

    // Default start and end datetime
    const today = new Date().toISOString().split('T')[0];
    const startInput = document.getElementById('adsStartDateInput');
    const startText = document.getElementById('adsStartDateInputText');
    const endInput = document.getElementById('adsEndDateInput');
    const endText = document.getElementById('adsEndDateInputText');

    if (startInput) startInput.value = today;
    if (startText) startText.value = formatDateVN(today);
    if (endInput) endInput.value = today;
    if (endText) endText.value = formatDateVN(today);
    
    const statusSel = document.getElementById('adsStatusSelect');
    if (statusSel) statusSel.value = 'ACTIVE';
    setTimeSelectVal('adsStartTimeInput', '00:00');
    setAdsDuration(24);
    updateCalculatedEndTime();
    calculateCPMAndCPC();
    
    

    backdrop.style.display = 'flex';
  }

  function openEditAdsModal(id) {
    const backdrop = document.getElementById('adsDrawerBackdrop');
    const form = document.getElementById('adsForm');
    const item = (currentAds || []).find(a => String(a.id) === String(id));
    if (!backdrop || !form || !item) {
      console.error('Không tìm thấy item hoặc modal ads:', id);
      return;
    }

    try { populateAdsProductDropdowns(); } catch (e) {}

    document.getElementById('adsDocId').value = item.id;
    const titleModal = document.getElementById('adsModalTitle');
    if (titleModal) titleModal.textContent = 'Chỉnh sửa chiến dịch quảng cáo';

    const setField = (idEl, val) => {
      const el = document.getElementById(idEl);
      if (el) el.value = (val !== undefined && val !== null) ? val : '';
    };

    setField('adsTitleInput', item.title);
    setField('adsChannelSelect', item.channel || 'tiktok');
    setField('adsProductSelect', item.product_id);
    
    setField('adsManagerUrlInput', item.ad_url || item.manager_url || item.url);
    setField('adsSpentInput', item.spent ? new Intl.NumberFormat('vi-VN').format(item.spent) : '');
    setField('adsStatusSelect', item.status || 'ACTIVE');

    const startDate = item.start_date || item.date || '';
    const startInput = document.getElementById('adsStartDateInput');
    const startText = document.getElementById('adsStartDateInputText');

    if (startInput) startInput.value = startDate;
    if (startText) startText.value = startDate ? formatDateVN(startDate) : '';

    let startTime = item.start_time || '';
    if (!startTime && item.time_frame && item.time_frame.includes('-')) {
      startTime = item.time_frame.split('-')[0].trim();
    }
    setTimeSelectVal('adsStartTimeInput', startTime || '00:00');

    let durationHours = item.duration_hours || 24;
    if (!item.duration_hours && item.end_date && item.start_date && item.end_date !== item.start_date) {
      const s = new Date(item.start_date).getTime();
      const e = new Date(item.end_date).getTime();
      const diffHours = Math.round((e - s) / (3600 * 1000));
      if (diffHours >= 12) durationHours = diffHours;
    }
    setAdsDuration(durationHours);
    updateCalculatedEndTime();
    setField('adsFocusedViewsInput', item.focused_views);
    setField('adsButtonClicksInput', item.button_clicks);
    setField('adsCommentsInput', item.comments);
    setField('adsSharesInput', item.shares);
    calculateCPMAndCPC();

    setField('adsViewsInput', item.views);
    setField('adsLikesInput', item.likes);
    setField('adsFollowersInput', item.followers);
    setField('adsProfileVisitsInput', item.profile_visits);
    setField('adsView2sInput', item.view_2s);
    setField('adsView6sInput', item.view_6s);
    setField('adsWatchFullInput', item.watch_full);
    setField('adsLikeRateInput', item.like_rate);
    setField('adsNotesInput', item.notes);

    

    backdrop.style.display = 'flex';
  }

  function closeAdsModal() {
    const backdrop = document.getElementById('adsDrawerBackdrop');
    if (backdrop) backdrop.style.display = 'none';
  }

  // Gán trực tiếp ra Window toàn cục
  window.openAddAdsModal = openAddAdsModal;
  window.openEditAdsModal = openEditAdsModal;
  window.closeAdsModal = closeAdsModal;

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
        
        const ad_url = document.getElementById('adsManagerUrlInput')?.value.trim() || '';
        const url = ad_url;
        const spentVal = document.getElementById('adsSpentInput').value.replace(/\D/g, '');
        const spent = parseInt(spentVal, 10) || 0;
        const status = document.getElementById('adsStatusSelect').value;
        
        let startDate = document.getElementById('adsStartDateInput')?.value || '';
        const startDateText = document.getElementById('adsStartDateInputText')?.value.trim() || '';
        if (!startDate && startDateText) {
          const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(startDateText);
          if (parts) startDate = `${parts[3]}-${parts[2]}-${parts[1]}`;
        }
        if (!startDate) startDate = new Date().toISOString().split('T')[0];

        const { endDate, endTime, durationLabel, durationHours } = updateCalculatedEndTime();
        const startTime = document.getElementById('adsStartTimeInput')?.value || '00:00';
        const time_frame = `${durationLabel} (${startTime} - ${endTime})`;
        
        const views = parseInt(document.getElementById('adsViewsInput')?.value, 10) || 0;
        const focused_views = parseInt(document.getElementById('adsFocusedViewsInput')?.value, 10) || 0;
        const button_clicks = parseInt(document.getElementById('adsButtonClicksInput')?.value, 10) || 0;
        const { cpm, cpc } = calculateCPMAndCPC();
        const likes = parseInt(document.getElementById('adsLikesInput')?.value, 10) || 0;
        const followers = parseInt(document.getElementById('adsFollowersInput')?.value, 10) || 0;
        const comments = parseInt(document.getElementById('adsCommentsInput')?.value, 10) || 0;
        const shares = parseInt(document.getElementById('adsSharesInput')?.value, 10) || 0;
        const profile_visits = parseInt(document.getElementById('adsProfileVisitsInput')?.value, 10) || 0;
        const view_2s = document.getElementById('adsView2sInput')?.value.trim() || '';
        const view_6s = document.getElementById('adsView6sInput')?.value.trim() || '';
        const watch_full = document.getElementById('adsWatchFullInput')?.value.trim() || '';
        const like_rate = document.getElementById('adsLikeRateInput')?.value.trim() || '';
        
        
        
        const notes = document.getElementById('adsNotesInput').value.trim();

        const prod = currentProducts.find(p => p.id === product_id);
        const product_name = prod ? prod.name : '';

        const finalTitle = title || (product_name ? `Ads: ${product_name}` : 'Chiến dịch');
        const data = {
          title: finalTitle,
          channel,
          product_id,
          product_name,
          url,
          ad_url,
          manager_url: ad_url,
          views,
          focused_views,
          button_clicks,
          cpm,
          cpc,
          likes,
          followers,
          comments,
          shares,
          profile_visits,
          view_2s,
          view_6s,
          watch_full,
          like_rate,
          spent,
          status,
          date: startDate,
          start_date: startDate,
          start_time: startTime,
          duration_hours: durationHours,
          duration_label: durationLabel,
          end_date: endDate,
          end_time: endTime,
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

// Ads schedule simplified to clean start and end datetime range

  btnOpenAddAds?.addEventListener('click', openAddAdsModal);
  btnCloseAdsModal?.addEventListener('click', closeAdsModal);
  btnCancelAds?.addEventListener('click', closeAdsModal);
  adsDrawerBackdrop?.addEventListener('click', (e) => {
    if (e.target === adsDrawerBackdrop) closeAdsModal();
  });
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


  

  // Event khi đổi Sản phẩm trong Drawer Ads -> Gợi ý tên chiến dịch nếu chưa nhập
  document.getElementById('adsProductSelect')?.addEventListener('change', (e) => {
    const prodId = e.target.value;
    const titleInp = document.getElementById('adsTitleInput');
    const prod = (currentProducts || []).find(p => p.id === prodId);
    if (prod && titleInp && (!titleInp.value.trim() || titleInp.value.startsWith('Ads:'))) {
      titleInp.value = 'Ads: ' + prod.name;
    }
  });
