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
  auth.onAuthStateChanged(user => {
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
      }
    } else {
      loginSection.classList.remove('hidden');
      adminSection.classList.add('hidden');
      const adminTopHeader = document.getElementById('adminTopHeader');
      if (adminTopHeader) adminTopHeader.classList.add('hidden');
      logoutBtn.classList.add('hidden');
    }
  });

  loginBtn.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
    } catch (error) {
      showToast('Lỗi đăng nhập: ' + error.message, true);
    }
  });

  logoutBtn.addEventListener('click', () => auth.signOut());

  // --- PRODUCT MANAGEMENT ---
  function formatCurrency(val) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function adminFetch(endpoint, options = {}) {
    const user = auth.currentUser;
    if (!user) throw new Error("Chưa đăng nhập Admin");
    const token = await user.getIdToken();
    const headers = {
      ...(options.headers || {}),
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    };
    const res = await fetch(endpoint, { ...options, headers });
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
      const matchCat = catVal === 'ALL' || p.categoryId === catVal;
      const pFormat = p.type || (p.sheetUrl ? 'google_sheets' : 'excel');
      const matchFormat = formatVal === 'ALL' || pFormat === formatVal;
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
      'ban-hang-online': 'Bán hàng online',
      'cong-no': 'Công nợ',
      'quan-ly-kho': 'Quản lý kho',
      'combo': 'Combo tiết kiệm'
    };

    productListBody.innerHTML = filtered.map(p => {
      const catName = catMap[p.categoryId] || p.categoryId || 'Khác';
      const isSheets = (p.type === 'google_sheets') || !!p.sheetUrl;
      const formatHtml = isSheets
        ? '<span style="font-size:0.84rem; font-weight:500; color:#059669;">Google Sheets</span>'
        : '<span style="font-size:0.84rem; font-weight:500; color:#475569;">Excel (.xlsx)</span>';
      
      const downloads = p.downloads_count || 0;
      const statusHtml = '<span class="status-text-item success">Đang bán</span>';

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
            <div style="display: inline-flex; align-items: center; gap: 4px;">
              <button class="action-icon-btn btn-edit" data-id="${p.id}" title="Chỉnh sửa">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button class="action-icon-btn danger btn-delete" data-id="${p.id}" title="Xóa file">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    bindProductActions();
  }

  function bindProductActions() {
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
          
          document.getElementById('productName').value = product.name || '';
          document.getElementById('productCategory').value = product.categoryId || '';
          document.getElementById('productFormat').value = product.type || (product.sheetUrl ? 'google_sheets' : 'excel');
          document.getElementById('productPrice').value = new Intl.NumberFormat('vi-VN').format(product.price || 0);
          document.getElementById('productOriginalPrice').value = product.originalPrice ? new Intl.NumberFormat('vi-VN').format(product.originalPrice) : '';
          document.getElementById('productTag').value = product.tag || '';
          document.getElementById('productSuitableFor').value = product.suitableFor || '';
          document.getElementById('productDescription').value = product.description || '';
          document.getElementById('productFeatures').value = (product.highlights || []).map(h => '- ' + h).join('\n');
          document.getElementById('productSheetUrl').value = product.sheetUrl || '';

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
    if (val === 'google_sheets') {
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
        highlights,
        sheetUrl,
        type: format,
        delivery_link: sheetUrl || "",
        delivery: format === 'google_sheets' 
          ? "Nhận link tạo bản sao Google Sheets vào Google Drive" 
          : (format === 'combo' ? "Nhận trọn bộ link/file combo sau thanh toán" : "Tải file Excel (.xlsx) trực tiếp"),
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
      if (document.getElementById('productHasCoaching')) document.getElementById('productHasCoaching').checked = false;
      if (document.getElementById('coachingFieldsGroup')) document.getElementById('coachingFieldsGroup').style.display = 'none';
      if (document.getElementById('productCoachingPrice')) document.getElementById('productCoachingPrice').value = '';
      if (document.getElementById('productCoachingTitle')) document.getElementById('productCoachingTitle').value = '';

      document.getElementById('editingProductId').value = '';
      document.getElementById('formTitle').textContent = 'Thêm Sản Phẩm Mới';
      document.getElementById('formDescription').textContent = 'Điền đầy đủ thông tin để đăng bán một file Excel hoặc Google Sheets mới.';
      document.getElementById('submitBtn').textContent = 'Tải lên & Đăng bán';
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

  function renderStatsDashboard() {
    const kpiTotalRevenue = document.getElementById('kpiTotalRevenue');
    const kpiMonthRevenue = document.getElementById('kpiMonthRevenue');
    const kpiPaidOrders = document.getElementById('kpiPaidOrders');
    const kpiCustomers = document.getElementById('kpiCustomers');
    const revenueChartContainer = document.getElementById('revenueChartContainer');
    const bestSellersContainer = document.getElementById('bestSellersContainer');
    const hourlyChartContainer = document.getElementById('hourlyChartContainer');
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
    const hourlyMap = Array(24).fill(0);
    const weekdayMap = [0, 0, 0, 0, 0, 0, 0]; // 0: CN, 1: T2, ..., 6: T7
    const priceRangeMap = {
      'tier1': { label: 'Dưới 10.000 ₫ (File mini)', count: 0, revenue: 0 },
      'tier2': { label: '10.000 ₫ - 50.000 ₫ (Đơn phổ biến)', count: 0, revenue: 0 },
      'tier3': { label: '50.000 ₫ - 150.000 ₫ (Combo/Smart App)', count: 0, revenue: 0 },
      'tier4': { label: 'Trên 150.000 ₫ (Kèm 1-1/Doanh nghiệp)', count: 0, revenue: 0 }
    };
    const chartDataMap = {};
    const isAllTime = statsFilterPeriod === 'all' && statsFilterMonth === 'ALL';

    if (statsFilterMonth !== 'ALL') {
      const parts = statsFilterMonth.split('-').map(Number);
      const y = parts[0];
      const m = parts[1];
      const daysInMonth = new Date(y, m, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const ds = y + '-' + String(m).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        chartDataMap[ds] = { key: ds, label: String(day).padStart(2, '0') + '/' + String(m).padStart(2, '0'), fullDate: ds, revenue: 0, count: 0 };
      }
      if (chartTitle) chartTitle.textContent = 'Biểu đồ Doanh thu (Tháng ' + m + '/' + y + ')';
      if (chartSubTitle) chartSubTitle.textContent = 'Chi tiết từng ngày trong tháng ' + m + '/' + y;
    } else if (periodDays) {
      for (let i = periodDays - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const ds = d.toISOString().slice(0, 10);
        chartDataMap[ds] = { key: ds, label: ds.slice(8, 10) + '/' + ds.slice(5, 7), fullDate: ds, revenue: 0, count: 0 };
      }
      if (chartTitle) chartTitle.textContent = 'Biểu đồ Doanh thu (' + periodDays + ' ngày qua)';
      if (chartSubTitle) chartSubTitle.textContent = 'Doanh số chi tiết theo từng ngày';
    } else {
      // statsFilterPeriod === 'all': Gom theo Tháng (T8/26, T9/26, T10/26, T11/26) để biểu đồ vừa vặn, không bị tràn dài
      if (chartTitle) chartTitle.textContent = 'Biểu đồ Doanh thu (Toàn thời gian theo Tháng)';
      if (chartSubTitle) chartSubTitle.textContent = 'Tổng hợp doanh số và số lượng đơn theo từng tháng';
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
        }

        // Bóc tách Pivot chi tiết từng dòng sản phẩm
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
        });

        totalRevenue += effectiveOrderRev;

        if (dObj) {
          if (isAllTime) {
            // Gom theo tháng: YYYY-MM
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

    const aov = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;
    if (kpiTotalRevenue) kpiTotalRevenue.textContent = formatCurrency(totalRevenue);
    if (kpiMonthRevenue) kpiMonthRevenue.textContent = formatCurrency(aov);
    if (kpiPaidOrders) kpiPaidOrders.textContent = paidCount + ' đơn';
    if (kpiCustomers) kpiCustomers.textContent = customers.size + ' khách';

    const dailyList = Object.values(chartDataMap).sort((a, b) => a.key.localeCompare(b.key));
    const revenues = dailyList.map(d => d.revenue);
    const orderCounts = dailyList.map(d => d.count);
    const maxRev = Math.max(...revenues, 50000);
    const maxCount = Math.max(...orderCounts, 5);

    if (revenueChartContainer) {
      if (!dailyList.length) {
        revenueChartContainer.innerHTML = '<div style="margin: auto; color: var(--muted); font-size: 0.9rem;">Không có dữ liệu trong khoảng thời gian này.</div>';
      } else {
        // Đảm bảo itemMinWidth cân đối, vừa vặn không bị chen chúc
        const itemMinWidth = isAllTime ? 64 : (dailyList.length > 20 ? 32 : (dailyList.length <= 14 ? 54 : 36));
        const chartHeight = 220;

        // Tạo danh sách điểm tọa độ SVG cho đường Line Doanh Thu
        const totalItems = dailyList.length;
        const linePoints = [];

        dailyList.forEach((d, idx) => {
          const y = chartHeight - Math.round((d.revenue / maxRev) * (chartHeight - 45)) - 15;
          linePoints.push({ idx, y, rev: d.revenue, count: d.count, key: d.key });
        });

        // Xây dựng các cột Bar (Số lượng đơn) với label gọn gàng
        const barsHtml = dailyList.map((d, idx) => {
          const barHeightPx = d.count > 0 ? Math.max(Math.round((d.count / maxCount) * (chartHeight - 50)), 22) : 6;
          const displayLabel = d.label || d.key;
          const isToday = d.key === todayStr;
          const barColor = d.count > 0 ? '#bbf7d0' : '#f8fafc';
          const barTextColor = '#065f46';
          const lineY = chartHeight - Math.round((d.revenue / maxRev) * (chartHeight - 45)) - 15;

          return (
            '<div style="flex: ' + (dailyList.length > 14 ? '0 0 ' + itemMinWidth + 'px' : '1') + '; min-width: ' + itemMinWidth + 'px; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative;" title="' + (d.fullDate || d.key) + '&#10;• Số đơn: ' + d.count + ' đơn&#10;• Doanh thu: ' + formatCurrency(d.revenue) + '">' +
              (d.revenue > 0 ? '<div style="position: absolute; top: ' + (lineY - 14) + 'px; z-index: 5; font-size: 0.65rem; font-weight: 700; color: #059669; font-family: monospace; white-space: nowrap; pointer-events: none;">' + (Math.round(d.revenue / 1000) + 'k') + '</div>' : '') +
              '<div style="width: 100%; max-width: 24px; height: ' + barHeightPx + 'px; background: ' + barColor + '; border-radius: 3px 3px 0 0; transition: height 0.3s ease; display: flex; align-items: center; justify-content: center; position: relative;">' +
                (d.count > 0 ? '<span style="font-size: 0.62rem; font-weight: 700; color: ' + barTextColor + '; line-height: 1; user-select: none;">' + d.count + 'đ</span>' : '') +
              '</div>' +
              '<div style="font-size: 0.72rem; color: ' + (isToday ? '#059669' : '#64748b') + '; font-weight: ' + (isToday ? '700' : '500') + '; margin-top: 5px; white-space: nowrap;">' + displayLabel + '</div>' +
            '</div>'
          );
        }).join('');

        // Đường SVG Line nối các điểm
        const svgPathD = linePoints.map((pt, i) => {
          const xPercent = ((i + 0.5) / totalItems) * 100;
          return (i === 0 ? 'M ' : 'L ') + xPercent + ' ' + pt.y;
        }).join(' ');

        revenueChartContainer.innerHTML = (
          '<div style="width: 100%; height: 100%; display: flex; align-items: flex-end; position: relative; min-width: ' + (dailyList.length * itemMinWidth) + 'px;">' +
            '<svg style="position: absolute; top: 0; left: 0; width: 100%; height: ' + chartHeight + 'px; pointer-events: none; z-index: 4;" preserveAspectRatio="none" viewBox="0 0 100 ' + chartHeight + '">' +
              '<path d="' + svgPathD + '" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></path>' +
            '</svg>' +
            barsHtml +
          '</div>'
        );
      }
    }

    const bestSellers = Object.values(productMap).sort((a, b) => {
      // Đưa các file thật lên trên, file gom test/cũ xuống dưới cùng
      if (a.id === '__ARCHIVED_TEST__') return 1;
      if (b.id === '__ARCHIVED_TEST__') return -1;
      return b.revenue - a.revenue;
    }).slice(0, 10);
    if (bestSellersContainer) {
      if (!bestSellers.length) {
        bestSellersContainer.innerHTML = '<div style="margin: 20px 0; text-align: center; color: var(--muted); font-size: 0.9rem;">Chưa có dữ liệu bán hàng.</div>';
      } else {
        bestSellersContainer.innerHTML = bestSellers.map((item, idx) => {
          const rank = idx + 1;
          const rankClass = rank <= 3 ? ('top-' + rank) : '';
          return (
            '<div class="best-seller-item">' +
              '<div style="display: flex; align-items: center; min-width: 0; flex: 1; margin-right: 12px;">' +
                '<div class="rank-badge ' + rankClass + '">' + rank + '</div>' +
                '<div style="min-width: 0;">' +
                  '<div style="font-weight: 600; font-size: 0.92rem; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + escapeHtml(item.name) + '</div>' +
                  '<div style="font-size: 0.78rem; color: var(--muted);">' + item.count + ' lượt mua thành công</div>' +
                '</div>' +
              '</div>' +
              '<div style="text-align: right; flex-shrink: 0;">' +
                '<div style="font-weight: 700; font-size: 0.95rem; color: var(--mint-strong);">' + formatCurrency(item.revenue) + '</div>' +
              '</div>' +
            '</div>'
          );
        }).join('');
      }
    }

    if (hourlyChartContainer) {
      const maxHourly = Math.max(...hourlyMap, 1);
      let peakHourCount = Math.max(...hourlyMap);

      hourlyChartContainer.innerHTML = hourlyMap.map((cnt, hr) => {
        const heightPct = Math.max(Math.round((cnt / maxHourly) * 110), 4);
        const isPeak = cnt === peakHourCount && cnt > 0;
        const barColor = isPeak ? '#059669' : (cnt > 0 ? '#34d399' : '#e2e8f0');
        const showLabel = hr % 3 === 0;

        return (
          '<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end;" title="' + hr + ':00 - ' + hr + ':59: ' + cnt + ' đơn mua">' +
            '<div style="font-size: 0.65rem; font-weight: 600; color: #059669;">' + (cnt > 0 ? cnt : '') + '</div>' +
            '<div style="width: 100%; max-width: 16px; height: ' + heightPct + 'px; background: ' + barColor + '; border-radius: 4px 4px 0 0; transition: height 0.3s ease;"></div>' +
            '<div style="font-size: 0.68rem; color: #64748b; font-weight: ' + (showLabel ? '600' : '400') + '; margin-top: 4px;">' + (showLabel ? (hr + 'h') : '') + '</div>' +
          '</div>'
        );
      }).join('');
    }

    if (conversionContainer) {
      const totalOrdersInFilter = paidCount + pendingCount;
      const payRate = totalOrdersInFilter > 0 ? Math.round((paidCount / totalOrdersInFilter) * 100) : 0;
      const coachingRate = paidCount > 0 ? Math.round((coachingCount / paidCount) * 100) : 0;

      conversionContainer.innerHTML = (
        '<div>' +
          '<div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 6px;">' +
            '<span style="font-weight: 600; color: #1e293b;">Tỉ lệ thanh toán thành công</span>' +
            '<span style="font-weight: 700; color: #059669;">' + payRate + '% (' + paidCount + '/' + totalOrdersInFilter + ' đơn)</span>' +
          '</div>' +
          '<div style="width: 100%; height: 10px; background: #f1f5f9; border-radius: 999px; overflow: hidden; display: flex;">' +
            '<div style="width: ' + payRate + '%; background: #10b981; border-radius: 999px;"></div>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 6px;">' +
            '<span style="font-weight: 600; color: #1e293b;">Đơn kèm Coaching 1-1</span>' +
            '<span style="font-weight: 700; color: #d97706;">' + coachingRate + '% (' + coachingCount + ' đơn Kèm 1-1)</span>' +
          '</div>' +
          '<div style="width: 100%; height: 10px; background: #f1f5f9; border-radius: 999px; overflow: hidden; display: flex;">' +
            '<div style="width: ' + coachingRate + '%; background: #f59e0b; border-radius: 999px;"></div>' +
          '</div>' +
        '</div>' +
        '<div style="display: flex; gap: 12px; margin-top: 6px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.82rem; color: #475569;">' +
          '<div>💡 <b>Gợi ý kinh doanh:</b> Khung giờ khách đặt nhiều nhất là lúc <b>' + calcPeakHour(hourlyMap) + '</b>. Đẩy bài TikTok/Zalo trước khung giờ này 30 phút sẽ tăng lượt chuyển đổi.</div>' +
        '</div>'
      );
    }
  }

  function calcPeakHour(hourlyMap) {
    let max = 0;
    let peak = 14;
    hourlyMap.forEach((v, idx) => {
      if (v > max) {
        max = v;
        peak = idx;
      }
    });
    return peak + 'h - ' + (peak + 1) + 'h';
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

  function renderFilteredOrders() {
    const orderListBody = document.getElementById('orderListBody');
    if (!orderListBody) return;
    const searchVal = (document.getElementById('orderSearchInput')?.value || '').trim().toLowerCase();
    const statusVal = document.getElementById('orderStatusFilter')?.value || 'ALL';

    const filtered = cachedOrders.filter(order => {
      const matchStatus = statusVal === 'ALL' || (order.status || '').toUpperCase() === statusVal;
      if (!matchStatus) return false;

      if (!searchVal) return true;
      const oId = String(order.order_id || '').toLowerCase();
      const phone = String(order.customer_phone || '').toLowerCase();
      const email = String(order.customer_email || '').toLowerCase();
      const pName = String(order.product_name || '').toLowerCase();
      return oId.includes(searchVal) || phone.includes(searchVal) || email.includes(searchVal) || pName.includes(searchVal);
    });

    if (!filtered.length) {
      orderListBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--muted); padding: 32px;">Không tìm thấy đơn hàng nào phù hợp.</td></tr>';
      return;
    }

    orderListBody.innerHTML = filtered.map(order => {
      const isPaid = (order.status || '').toUpperCase() === 'PAID';
      const statusBadge = isPaid
        ? '<span class="badge-status badge-status-paid">✓ ĐÃ THANH TOÁN</span>'
        : '<span class="badge-status badge-status-pending">⏳ CHỜ THANH TOÁN</span>';

      const timeObj = formatDateTime(order.created_at || order.paid_at);
      const timeHtml = timeObj.date 
        ? `<div style="font-weight: 600; color: #0f172a; font-size: 0.88rem; white-space: nowrap;">${escapeHtml(timeObj.time)}</div>` +
          `<div style="font-size: 0.78rem; color: #64748b; white-space: nowrap; margin-top: 2px;">${escapeHtml(timeObj.date)}</div>`
        : `<span style="font-size: 0.84rem; color: #64748b;">${escapeHtml(timeObj.time)}</span>`;

      const rawEmail = order.customer_email || '';
      const isVirtualEmail = rawEmail.endsWith('@khachhang.filedilam.vn');
      const cleanEmail = isVirtualEmail ? '' : rawEmail;
      const customerInfo = order.customer_phone || cleanEmail || (order.user_id ? order.user_id.slice(0, 8) + '...' : 'Khách vãng lai');

      const fileUrl = order.product_file_url || '';
      const orderId = order.order_id || '';
      const amountVal = order.amount || 0;
      const cleanPhone = String(order.customer_phone || '').replace(/\D/g, '');
      const transferNote = orderId;
      const qrImgUrl = `https://img.vietqr.io/image/TPB-59215112002-compact.png?amount=${amountVal}&addInfo=${encodeURIComponent(transferNote)}&accountName=${encodeURIComponent("HUYNH KIEN CAM")}`;

      // Cột Mã QR VietQR thu nhỏ
      const qrThumbHtml = isPaid
        ? '<span style="color: #cbd5e1; font-size: 0.85rem;">-</span>'
        : `<a href="${qrImgUrl}" target="_blank" title="Nhấp để xem to hoặc nhấp chuột phải Sao chép ảnh QR" style="display:inline-block; border-radius:6px; overflow:hidden; border:1px solid #e2e8f0; line-height:0; vertical-align:middle;">
             <img src="${qrImgUrl}" alt="QR #${escapeHtml(orderId)}" style="width:36px; height:36px; object-fit:contain; display:block; cursor:pointer;" />
           </a>`;

      let actionHtml = '';
      if (isPaid) {
        // ĐÃ THANH TOÁN: Mở file ↗, Copy link nhận file, Chat Zalo ↗ (nếu có SĐT)
        actionHtml = `
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            ${fileUrl ? `<a href="${escapeHtml(fileUrl)}" target="_blank" style="text-decoration:none; color:var(--mint-primary); font-size:0.84rem; font-weight:600;" title="Mở link Google Sheets/Drive">Mở file ↗</a>` : ''}
            <button type="button" class="btn-copy-magic-link" data-uid="${escapeHtml(order.user_id || '')}" data-order="${escapeHtml(orderId)}" style="background:none; border:none; padding:0; color:#475569; font-size:0.84rem; text-decoration:underline; cursor:pointer; font-weight:500;" title="Copy link nhận file cho khách">Copy link nhận file</button>
            ${cleanPhone ? `<a href="https://zalo.me/${cleanPhone}" target="_blank" style="text-decoration:none; color:#0284c7; font-size:0.84rem; font-weight:600;">Chat Zalo ↗</a>` : ''}
          </div>
        `;
      } else {
        // CHỜ THANH TOÁN: Copy tin nhắn nhắc nợ, Chat Zalo ↗
        const zaloMsg = `Chào bạn, File Đi Làm gửi bạn thông tin thanh toán đơn hàng #${orderId} (${order.product_name || 'File'}):\n- Số tiền: ${formatCurrency(amountVal)}\n- STK: 59215112002 (TPBank - HUYNH KIEN CAM)\n- Nội dung chuyển khoản: ${orderId}\n\nSau khi chuyển khoản, file sẽ tự động mở ngay tại: https://filedilam.web.app/?tab=my-files nhé!`;
        const zaloChatUrl = cleanPhone ? `https://zalo.me/${cleanPhone}` : '';

        actionHtml = `
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="btn-copy-zalo-msg" data-msg="${escapeHtml(zaloMsg)}" style="background:none; border:none; padding:0; color:var(--mint-primary); font-size:0.84rem; text-decoration:underline; cursor:pointer; font-weight:600;" title="Sao chép lời nhắn kèm số tài khoản và cú pháp">Copy tin nhắn</button>
            ${cleanPhone ? `<a href="${zaloChatUrl}" target="_blank" style="text-decoration:none; color:#0284c7; font-size:0.84rem; font-weight:600;">Chat Zalo ↗</a>` : ''}
          </div>
        `;
      }

      const isCoaching = order.package_type === 'coaching' || parseInt(order.amount || 0, 10) >= 199000;
      const coachingBadge = isCoaching
        ? '<span style="display: inline-block; margin-left: 6px; font-size: 0.72rem; font-weight: 700; background: #fef3c7; color: #b45309; padding: 2px 7px; border-radius: 6px; border: 1px solid #fde68a; vertical-align: middle;">🎓 Kèm 1-1</span>'
        : '';

      return `
        <tr>
          <td><strong style="font-size: 0.9rem; color: #1e293b;">#${escapeHtml(order.order_id || '')}</strong></td>
          <td style="white-space: nowrap;">${timeHtml}</td>
          <td><span style="font-weight: 500; color: #1e293b;">${escapeHtml(customerInfo)}</span></td>
          <td><span style="font-weight: 600; color: #1e293b;">${escapeHtml(order.product_name || 'File')}</span>${coachingBadge}</td>
          <td><strong style="color: var(--mint-primary);">${formatCurrency(order.amount || 0)}</strong></td>
          <td>${statusBadge}</td>
          <td style="text-align: center; vertical-align: middle;">${qrThumbHtml}</td>
          <td>${actionHtml}</td>
        </tr>
      `;
    }).join('');

    // Gắn sự kiện cho các nút Copy trong bảng đơn hàng
    orderListBody.querySelectorAll('.btn-copy-zalo-msg').forEach(btn => {
      btn.addEventListener('click', () => {
        const msg = btn.dataset.msg || '';
        navigator.clipboard.writeText(msg).then(() => {
          showToast("Đã sao chép tin nhắn nhắc thanh toán!");
        });
      });
    });

    orderListBody.querySelectorAll('.btn-copy-magic-link').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.uid || '';
        const orderId = btn.dataset.order || '';
        const originalText = btn.textContent;
        try {
          btn.textContent = 'Đang lấy link...';
          const res = await adminFetch('/admin/generate-magic-link', {
            method: 'POST',
            body: JSON.stringify({ user_id: uid, order_id: orderId })
          });
          if (res && res.magic_url) {
            await navigator.clipboard.writeText(res.magic_url);
            btn.textContent = 'Đã copy link!';
            showToast('Đã copy Magic Link! Gửi link này để khách vào thẳng kho file mà không cần mật khẩu.');
            setTimeout(() => {
              btn.textContent = originalText;
            }, 2500);
          } else {
            throw new Error(res?.error || 'Không tạo được link');
          }
        } catch (err) {
          console.warn("Dùng link thường fallback:", err);
          btn.textContent = originalText;
          const fallbackLink = `https://filedilam.web.app/?tab=my-files`;
          navigator.clipboard.writeText(fallbackLink);
          showToast('Đã copy link nhận file: https://filedilam.web.app/?tab=my-files');
        }
      });
    });
  }

  // Event Listeners for Orders & Stats
  document.getElementById('refreshStatsBtn')?.addEventListener('click', loadAdminStats);
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

  });
