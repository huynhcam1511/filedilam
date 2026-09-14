function renderPartners() {
    return `
        <div class="view-section active" id="partnersView">
            <div class="header-with-action">
                <h1 class="page-title">Danh Mục Đối Tác</h1>
                <button class="btn-primary" onclick="openAddPartnerModal()">
                    <i class="fa-solid fa-plus"></i> Thêm Đối Tác
                </button>
            </div>
            
            <div class="card">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Mã ĐT</th>
                                <th>Tên Khách Hàng / NCC</th>
                                <th>Phân Loại</th>
                                <th>Điện Thoại</th>
                                <th>Email</th>
                                <th>Dư Nợ Hiện Tại</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.partners.map(p => `
                                <tr>
                                    <td><strong>${p.id}</strong></td>
                                    <td>${p.name}</td>
                                    <td>
                                        <span class="badge ${p.type === 'KH' ? 'badge-kh' : 'badge-ncc'}">
                                            ${p.type === 'KH' ? 'Khách hàng' : 'Nhà cung cấp'}
                                        </span>
                                    </td>
                                    <td>${p.phone || '-'}</td>
                                    <td>${p.email || '-'}</td>
                                    <td><strong class="${p.balance > 0 ? (p.type === 'KH' ? 'text-success' : 'text-danger') : ''}">${formatCurrency(p.balance)}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function openAddPartnerModal() {
    const html = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Thêm Đối Tác Mới</h3>
                    <button class="close-modal" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form id="addPartnerForm" onsubmit="handleAddPartner(event)">
                    <div class="form-group">
                        <label>Tên Khách Hàng / NCC *</label>
                        <input type="text" id="pName" class="form-control" required placeholder="Nhập tên đối tác...">
                    </div>
                    <div class="form-group">
                        <label>Phân Loại *</label>
                        <select id="pType" class="form-control" required>
                            <option value="KH">Khách hàng (Người mua)</option>
                            <option value="NCC">Nhà cung cấp (Người bán)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Số Điện Thoại</label>
                        <input type="tel" id="pPhone" class="form-control" placeholder="09xxxxxxx">
                    </div>
                    <div class="form-group">
                        <label>Email Kế Toán</label>
                        <input type="email" id="pEmail" class="form-control" placeholder="ketoan@doitac.com">
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal()">Hủy</button>
                        <button type="submit" class="btn-primary">Lưu Đối Tác</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    showModal(html);
}

function handleAddPartner(e) {
    e.preventDefault();
    const partner = {
        name: document.getElementById('pName').value,
        type: document.getElementById('pType').value,
        phone: document.getElementById('pPhone').value,
        email: document.getElementById('pEmail').value
    };
    
    state.addPartner(partner);
    closeModal();
}
