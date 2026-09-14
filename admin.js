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
});
