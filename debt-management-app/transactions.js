function renderTransactions() {
    return `
        <div class="view-section active" id="transactionsView">
            <div class="header-with-action">
                <h1 class="page-title">Phát Sinh Công Nợ</h1>
                <button class="btn-primary" onclick="openAddTransactionModal()">
                    <i class="fa-solid fa-plus"></i> Ghi Nhận Giao Dịch
                </button>
            </div>
            
            <div class="card">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Mã GD</th>
                                <th>Thời Gian</th>
                                <th>Đối Tác</th>
                                <th>Loại Giao Dịch</th>
                                <th>Số Tiền</th>
                                <th>Ghi Chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.transactions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(tx => {
                                const p = state.partners.find(x => x.id === tx.partnerId);
                                const isInc = tx.type === 'DEBT_INCREASE';
                                return `
                                <tr>
                                    <td><small class="text-muted">${tx.id}</small></td>
                                    <td>${formatDate(tx.date)}</td>
                                    <td><strong>${p ? p.name : 'N/A'}</strong></td>
                                    <td>
                                        <span class="badge ${isInc ? 'badge-ncc' : 'badge-kh'}">
                                            ${isInc ? 'Ghi nợ (+)' : 'Thanh toán (-)'}
                                        </span>
                                    </td>
                                    <td><strong class="${isInc ? 'text-danger' : 'text-success'}">${formatCurrency(tx.amount)}</strong></td>
                                    <td>${tx.note || '-'}</td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function openAddTransactionModal() {
    if(state.partners.length === 0) {
        alert("Vui lòng thêm đối tác trước khi ghi nhận giao dịch!");
        return;
    }

    const html = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Ghi Nhận Giao Dịch</h3>
                    <button class="close-modal" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form id="addTxForm" onsubmit="handleAddTransaction(event)">
                    <div class="form-group">
                        <label>Chọn Đối Tác *</label>
                        <select id="txPartner" class="form-control" required>
                            <option value="">-- Chọn đối tác --</option>
                            ${state.partners.map(p => `<option value="${p.id}">${p.name} (${p.type})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Loại Giao Dịch *</label>
                        <select id="txType" class="form-control" required>
                            <option value="DEBT_INCREASE">Ghi nợ (Tăng dư nợ)</option>
                            <option value="DEBT_DECREASE">Thanh toán (Giảm dư nợ)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Số Tiền (VNĐ) *</label>
                        <input type="number" id="txAmount" class="form-control" required min="1000" step="1000" placeholder="1000000">
                    </div>
                    <div class="form-group">
                        <label>Ghi Chú</label>
                        <input type="text" id="txNote" class="form-control" placeholder="Xuất hóa đơn tháng 8...">
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal()">Hủy</button>
                        <button type="submit" class="btn-primary">Lưu Giao Dịch</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    showModal(html);
}

function handleAddTransaction(e) {
    e.preventDefault();
    const tx = {
        partnerId: document.getElementById('txPartner').value,
        type: document.getElementById('txType').value,
        amount: parseFloat(document.getElementById('txAmount').value),
        note: document.getElementById('txNote').value
    };
    
    state.addTransaction(tx);
    closeModal();
}
