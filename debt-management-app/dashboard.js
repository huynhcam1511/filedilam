function renderDashboard() {
    const stats = state.getDashboardStats();
    
    // Get recent transactions
    const recentTx = [...state.transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    return `
        <div class="view-section active" id="dashboardView">
            <h1 class="page-title">Tổng Quan Công Nợ</h1>
            
            <div class="dashboard-grid">
                <div class="card stat-card receivable">
                    <div class="stat-icon"><i class="fa-solid fa-arrow-trend-up"></i></div>
                    <div class="stat-title">Tổng Phải Thu (Khách hàng nợ)</div>
                    <div class="stat-value text-success">${formatCurrency(stats.totalReceivables)}</div>
                </div>
                
                <div class="card stat-card payable">
                    <div class="stat-icon"><i class="fa-solid fa-arrow-trend-down"></i></div>
                    <div class="stat-title">Tổng Phải Trả (Nợ NCC)</div>
                    <div class="stat-value text-danger">${formatCurrency(stats.totalPayables)}</div>
                </div>
                
                <div class="card stat-card overdue">
                    <div class="stat-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <div class="stat-title">Nợ Quá Hạn</div>
                    <div class="stat-value">${formatCurrency(stats.totalOverdue)}</div>
                </div>
            </div>

            <div class="card">
                <div class="header-with-action">
                    <h3>Giao Dịch Gần Đây</h3>
                    <button class="btn-secondary" onclick="switchView('transactions')">Xem Tất Cả</button>
                </div>
                
                ${recentTx.length === 0 ? '<p style="color: var(--text-muted); text-align: center; padding: 20px;">Chưa có giao dịch nào.</p>' : `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Thời Gian</th>
                                <th>Đối Tác</th>
                                <th>Loại Giao Dịch</th>
                                <th>Số Tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recentTx.map(tx => {
                                const partner = state.partners.find(p => p.id === tx.partnerId);
                                const isIncrease = tx.type === 'DEBT_INCREASE';
                                return `
                                <tr>
                                    <td>${formatDate(tx.date)}</td>
                                    <td><strong>${partner ? partner.name : 'N/A'}</strong></td>
                                    <td>
                                        <span class="badge ${isIncrease ? 'badge-ncc' : 'badge-kh'}">
                                            ${isIncrease ? 'Ghi nợ' : 'Thanh toán'}
                                        </span>
                                    </td>
                                    <td class="${isIncrease ? 'text-danger' : 'text-success'}">
                                        ${isIncrease ? '+' : '-'}${formatCurrency(tx.amount)}
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                `}
            </div>
        </div>
    `;
}

// initDashboard is called automatically if defined
function initDashboard() {
    // any extra initialization like charts could go here
}
