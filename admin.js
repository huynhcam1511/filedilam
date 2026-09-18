const ADMIN_EMAIL = 'huynhkiencam151102@gmail.com';

document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  const adminSection = document.getElementById('adminSection');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  
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
  auth.onAuthStateChanged(user => {
    if (user) {
      if (user.email === ADMIN_EMAIL) {
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
      productListBody.innerHTML = '';
      currentProducts = [];
      
      if (snapshot.empty) {
        productListBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--muted); padding: 32px;">Chưa có sản phẩm nào.</td></tr>';
        return;
      }

      snapshot.forEach(doc => {
        const p = doc.data();
        currentProducts.push({ ...p, id: doc.id });
        const tr = document.createElement('tr');
        
        const catMap = {
          'ban-hang-online': 'Bán hàng online',
          'cong-no': 'Công nợ',
          'quan-ly-kho': 'Quản lý kho',
          'combo': 'Combo tiết kiệm'
        };
        const catName = catMap[p.categoryId] || p.categoryId;

        tr.innerHTML = `
          <td>
            <div style="width: 50px; height: 50px; border-radius: 6px; background-image: url('${p.previewImageUrl || ''}'); background-size: cover; background-position: center; background-color: #e5e7eb;"></div>
          </td>
          <td style="font-weight: 500;">${p.name}</td>
          <td><span style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${catName}</span></td>
          <td style="font-weight: 600; color: var(--mint-strong);">${formatCurrency(p.price)}</td>
          <td style="text-align: right;">
            <button class="action-btn btn-edit" data-id="${doc.id}" style="margin-right: 8px;">Sửa</button>
            <button class="action-btn danger btn-delete" data-id="${doc.id}">Xóa</button>
          </td>
        `;
        productListBody.appendChild(tr);
      });

      // Bind delete events
      document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này không? Khách hàng sẽ không thấy sản phẩm này trên web nữa.')) {
            try {
              e.target.textContent = 'Đang xóa...';
              e.target.disabled = true;
              await db.collection('products').doc(id).delete();
              showToast('Đã xóa sản phẩm.');
              loadProducts(); // reload list
            } catch (error) {
              showToast('Lỗi khi xóa: ' + error.message, true);
              e.target.textContent = 'Xóa';
              e.target.disabled = false;
            }
          }
        });
      });

      // Bind edit events
      document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.dataset.id;
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
            updateFormatFields();
            
            // Note: Cannot set value of file inputs (security). Make them optional in edit mode.
            document.getElementById('productImage').required = false;

            // Switch to Add Tab
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            document.getElementById('goAddProductBtn').classList.add('active'); // highlight add button if it existed
            document.getElementById('addTab').classList.add('active');
            window.scrollTo(0, 0);
          }
        });
      });

    } catch (error) {
      console.error(error);
      productListBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ef4444;">Lỗi tải dữ liệu: ' + error.message + '</td></tr>';
    }
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
        fileCount: format === 'combo' ? 2 : 1
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

  async function loadAdminStats() {
    const kpiTotalRevenue = document.getElementById('kpiTotalRevenue');
    const kpiMonthRevenue = document.getElementById('kpiMonthRevenue');
    const kpiPaidOrders = document.getElementById('kpiPaidOrders');
    const kpiCustomers = document.getElementById('kpiCustomers');
    const revenueChartContainer = document.getElementById('revenueChartContainer');
    const bestSellersContainer = document.getElementById('bestSellersContainer');

    if (!kpiTotalRevenue) return;

    kpiTotalRevenue.textContent = "Đang tính...";
    kpiMonthRevenue.textContent = "Đang tính...";
    kpiPaidOrders.textContent = "...";
    kpiCustomers.textContent = "...";
    if (revenueChartContainer) revenueChartContainer.innerHTML = '<div style="margin: auto; color: var(--muted); font-size: 0.9rem;">Đang tải biểu đồ...</div>';
    if (bestSellersContainer) bestSellersContainer.innerHTML = '<div style="margin: 20px 0; text-align: center; color: var(--muted); font-size: 0.9rem;">Đang tải xếp hạng...</div>';

    try {
      let stats = null;
      try {
        stats = await adminFetch('/admin/stats');
      } catch (apiErr) {
        console.warn("Backend /admin/stats failed, fallback to client calculation:", apiErr);
        const snap = await db.collection('orders').get();
        let totalRev = 0, monthRev = 0, todayRev = 0, paidCount = 0;
        const customers = new Set();
        const productMap = {};
        const dailyMap = {};
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const monthStr = now.toISOString().slice(0, 7);

        for (let i = 13; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const ds = d.toISOString().slice(0, 10);
          dailyMap[ds] = { date: ds, revenue: 0, count: 0 };
        }

        snap.forEach(doc => {
          const o = doc.data();
          if (o && String(o.status || '').toUpperCase() === 'PAID') {
            const amt = parseInt(o.amount || 0, 10);
            totalRev += amt;
            paidCount += 1;
            const cId = o.customer_phone || o.customer_email || o.user_id;
            if (cId) customers.add(cId);

            const dObj = parseDateObj(o.created_at || o.paid_at);
            const cStr = dObj ? dObj.toISOString().slice(0, 10) : '';
            if (cStr === todayStr) todayRev += amt;
            if (cStr.startsWith(monthStr)) monthRev += amt;
            if (cStr && dailyMap[cStr]) {
              dailyMap[cStr].revenue += amt;
              dailyMap[cStr].count += 1;
            }

            const pid = o.product_id || 'other';
            if (!productMap[pid]) {
              productMap[pid] = { id: pid, name: o.product_name || 'File', count: 0, revenue: 0 };
            }
            productMap[pid].count += 1;
            productMap[pid].revenue += amt;
          }
        });

        stats = {
          total_revenue: totalRev,
          month_revenue: monthRev,
          today_revenue: todayRev,
          paid_orders_count: paidCount,
          customers_count: customers.size,
          daily_revenue: Object.values(dailyMap),
          best_sellers: Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
        };
      }

      // Update KPI Cards
      kpiTotalRevenue.textContent = formatCurrency(stats.total_revenue || 0);
      kpiMonthRevenue.textContent = formatCurrency(stats.month_revenue || 0);
      kpiPaidOrders.textContent = (stats.paid_orders_count || 0) + " đơn";
      kpiCustomers.textContent = (stats.customers_count || 0) + " khách";

      // Render Daily Revenue Chart
      const dailyList = stats.daily_revenue || [];
      const revenues = dailyList.map(d => d.revenue);
      const maxRev = Math.max(...revenues, 100000);

      if (revenueChartContainer) {
        revenueChartContainer.innerHTML = dailyList.map(d => {
          const heightPct = Math.max(Math.round((d.revenue / maxRev) * 150), 6);
          const dayLabel = d.date.slice(8, 10) + '/' + d.date.slice(5, 7);
          const isToday = d.date === new Date().toISOString().slice(0, 10);
          const barBg = d.revenue > 0 ? (isToday ? '#059669' : '#10b981') : '#e2e8f0';

          return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end; position: relative;" title="${d.date}: ${formatCurrency(d.revenue)} (${d.count} đơn)">
              <div style="font-size: 0.7rem; font-weight: 600; color: #10b981; margin-bottom: 2px;">${d.revenue > 0 ? (Math.round(d.revenue / 1000) + 'k') : ''}</div>
              <div style="width: 100%; max-width: 28px; height: ${heightPct}px; background: ${barBg}; border-radius: 6px 6px 0 0; transition: height 0.3s ease;"></div>
              <div style="font-size: 0.72rem; color: #64748b; font-weight: 500; margin-top: 4px;">${dayLabel}</div>
            </div>
          `;
        }).join('');
      }

      // Render Best Sellers
      const bestSellers = stats.best_sellers || [];
      if (bestSellersContainer) {
        if (!bestSellers.length) {
          bestSellersContainer.innerHTML = '<div style="margin: 20px 0; text-align: center; color: var(--muted); font-size: 0.9rem;">Chưa có dữ liệu bán hàng.</div>';
        } else {
          bestSellersContainer.innerHTML = bestSellers.map((item, idx) => {
            const rank = idx + 1;
            const rankClass = rank <= 3 ? `top-${rank}` : '';
            return `
              <div class="best-seller-item">
                <div style="display: flex; align-items: center; min-width: 0; flex: 1; margin-right: 12px;">
                  <div class="rank-badge ${rankClass}">${rank}</div>
                  <div style="min-width: 0;">
                    <div style="font-weight: 600; font-size: 0.92rem; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(item.name)}</div>
                    <div style="font-size: 0.78rem; color: var(--muted);">${item.count} lượt mua thành công</div>
                  </div>
                </div>
                <div style="text-align: right; flex-shrink: 0;">
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--mint-strong);">${formatCurrency(item.revenue)}</div>
                </div>
              </div>
            `;
          }).join('');
        }
      }

    } catch (err) {
      console.error("Lỗi tải thống kê:", err);
      showToast("Lỗi khi tải thống kê: " + err.message, true);
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
        ? '<span class="badge-status badge-status-paid">✓ Đã thanh toán</span>'
        : '<span class="badge-status badge-status-pending">⏳ Chờ thanh toán</span>';

      const timeObj = formatDateTime(order.created_at || order.paid_at);
      const timeHtml = timeObj.date 
        ? `<div style="font-weight: 600; color: #0f172a; font-size: 0.88rem; white-space: nowrap;">${escapeHtml(timeObj.time)}</div>` +
          `<div style="font-size: 0.78rem; color: #64748b; white-space: nowrap; margin-top: 2px;">${escapeHtml(timeObj.date)}</div>`
        : `<span style="font-size: 0.84rem; color: #64748b;">${escapeHtml(timeObj.time)}</span>`;

      const customerInfo = order.customer_phone || order.customer_email || (order.user_id ? order.user_id.slice(0, 8) + '...' : 'Khách vãng lai');

      const reviewHtml = order.has_reviewed
        ? `<span style="color: #f59e0b; font-weight: 600;">⭐ ${order.review_stars}/5</span>`
        : '<span style="color: var(--muted); font-size: 0.8rem;">Chưa</span>';

      const fileUrl = order.product_file_url || '';
      const actionHtml = fileUrl
        ? `<a href="${escapeHtml(fileUrl)}" target="_blank" class="action-btn" style="text-decoration:none; color:var(--mint-strong); font-size:0.85rem;" title="Mở link file">📁 Mở file</a>`
        : '<span style="color: var(--muted); font-size: 0.8rem;">-</span>';

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
          <td><strong style="color: var(--mint-strong);">${formatCurrency(order.amount || 0)}</strong></td>
          <td>${statusBadge}</td>
          <td>${reviewHtml}</td>
          <td>${actionHtml}</td>
        </tr>
      `;
    }).join('');
  }

  // Event Listeners for Orders & Stats
  document.getElementById('refreshStatsBtn')?.addEventListener('click', loadAdminStats);
  document.getElementById('refreshOrdersBtn')?.addEventListener('click', loadAdminOrders);
  document.getElementById('orderSearchInput')?.addEventListener('input', renderFilteredOrders);
  document.getElementById('orderStatusFilter')?.addEventListener('change', renderFilteredOrders);
});
