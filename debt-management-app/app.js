// Global State Management
class AppState {
    constructor() {
        this.partners = JSON.parse(localStorage.getItem('debt_partners')) || [];
        this.transactions = JSON.parse(localStorage.getItem('debt_transactions')) || [];
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener());
    }

    addPartner(partner) {
        this.partners.push({
            ...partner,
            id: 'P' + Date.now(),
            balance: 0 // Dư nợ hiện tại
        });
        this.save();
    }

    addTransaction(transaction) {
        this.transactions.push({
            ...transaction,
            id: 'T' + Date.now(),
            date: new Date().toISOString()
        });

        // Update partner balance
        const partner = this.partners.find(p => p.id === transaction.partnerId);
        if (partner) {
            // Tăng dư nợ nếu bán nợ, giảm dư nợ nếu thu nợ
            const amount = parseFloat(transaction.amount);
            if (transaction.type === 'DEBT_INCREASE') {
                partner.balance += amount;
            } else if (transaction.type === 'DEBT_DECREASE') {
                partner.balance -= amount;
            }
        }
        this.save();
    }

    save() {
        localStorage.setItem('debt_partners', JSON.stringify(this.partners));
        localStorage.setItem('debt_transactions', JSON.stringify(this.transactions));
        this.notify();
    }

    getDashboardStats() {
        let totalReceivables = 0; // Phải thu (Khách hàng nợ mình)
        let totalPayables = 0; // Phải trả (Mình nợ NCC)

        this.partners.forEach(p => {
            if (p.type === 'KH' && p.balance > 0) totalReceivables += p.balance;
            if (p.type === 'NCC' && p.balance > 0) totalPayables += p.balance;
        });

        return {
            totalReceivables,
            totalPayables,
            totalOverdue: 0 // Simplification for MVP
        };
    }
}

const state = new AppState();

// Routing and View Management
const views = {
    dashboard: renderDashboard,
    partners: renderPartners,
    transactions: renderTransactions
};

function switchView(viewName) {
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === viewName) btn.classList.add('active');
    });

    // Render View
    const container = document.getElementById('viewContainer');
    if (views[viewName]) {
        container.innerHTML = views[viewName]();
        
        // Execute scripts after HTML injected
        if (window[`init${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`]) {
            window[`init${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`]();
        }
    }
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Format Date
function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// Modal helper
function showModal(html) {
    const container = document.getElementById('modalContainer');
    container.innerHTML = html;
    const overlay = container.querySelector('.modal-overlay');
    setTimeout(() => overlay.classList.add('active'), 10);
}

function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            document.getElementById('modalContainer').innerHTML = '';
        }, 300);
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Add dummy data if empty for demo purposes
    if (state.partners.length === 0) {
        state.addPartner({ name: 'Cửa hàng VLXD Phát Đạt', type: 'KH', phone: '0901234567', email: 'ketoan@phatdat.vn' });
        state.addPartner({ name: 'Cty TNHH Sản xuất ABC', type: 'NCC', phone: '0909123456', email: 'sale@abc.com' });
    }

    // Set up navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchView(e.currentTarget.dataset.view);
        });
    });

    // Global Re-render on state change
    state.subscribe(() => {
        const activeView = document.querySelector('.nav-btn.active').dataset.view;
        switchView(activeView);
    });

    // Load initial view
    switchView('dashboard');
});
