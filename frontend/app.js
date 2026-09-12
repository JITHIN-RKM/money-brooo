// State Management & LocalStorage Persistence
const STORAGE_KEY_TX = 'ledger_app_transactions';
const STORAGE_KEY_LEDGER = 'ledger_app_contacts';

const loadState = () => {
    try {
        const savedTx = localStorage.getItem(STORAGE_KEY_TX);
        const savedLedger = localStorage.getItem(STORAGE_KEY_LEDGER);
        return {
            transactions: savedTx ? JSON.parse(savedTx) : [],
            ledger: savedLedger ? JSON.parse(savedLedger) : []
        };
    } catch (e) {
        console.error('Failed to load data from localStorage', e);
        return { transactions: [], ledger: [] };
    }
};

const saveState = () => {
    try {
        localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(transactions));
        localStorage.setItem(STORAGE_KEY_LEDGER, JSON.stringify(ledger));
    } catch (e) {
        console.error('Failed to save data to localStorage', e);
    }
};

const initialState = loadState();
let transactions = initialState.transactions;
let ledger = initialState.ledger;

// DOM Elements
const navLinks = document.querySelectorAll('.nav-links li');
const views = document.querySelectorAll('.view');

const totalBalanceEl = document.getElementById('total-balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');

const spendLimitEl = document.getElementById('spend-limit');
const savingsGoalEl = document.getElementById('savings-goal');
const spendProgressEl = document.getElementById('spend-progress');
const spendPercentageEl = document.getElementById('spend-percentage');
const alertContainer = document.getElementById('alert-container');

// Dedicated Income Form
const incomeForm = document.getElementById('income-form');
const incomeAmountInput = document.getElementById('income-amount');
const incomeSourceInput = document.getElementById('income-source');
const incomeDateInput = document.getElementById('income-date');

// Transaction Form & List
const transactionForm = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const txCountEl = document.getElementById('tx-count');
const txDateInput = document.getElementById('tx-date');

// Ledger Form & List
const ledgerForm = document.getElementById('ledger-form');
const contactList = document.getElementById('contact-list');
const contactCountEl = document.getElementById('contact-count');

// Transaction Modal Elements
const editTxModal = document.getElementById('edit-tx-modal');
const editTxForm = document.getElementById('edit-tx-form');
const editTxIdInput = document.getElementById('edit-tx-id');
const editTxTypeInput = document.getElementById('edit-tx-type');
const editTxAmountInput = document.getElementById('edit-tx-amount');
const editTxCategoryInput = document.getElementById('edit-tx-category');
const editTxDateInput = document.getElementById('edit-tx-date');
const closeTxModalBtn = document.getElementById('close-tx-modal');
const cancelEditTxBtn = document.getElementById('cancel-edit-tx');

// Contact Modal Elements
const editContactModal = document.getElementById('edit-contact-modal');
const editContactForm = document.getElementById('edit-contact-form');
const editOriginalContactNameInput = document.getElementById('edit-original-contact-name');
const editContactNameInput = document.getElementById('edit-contact-name');
const editContactEntriesList = document.getElementById('edit-contact-entries-list');
const settleAllContactBtn = document.getElementById('settle-all-contact-btn');
const closeContactModalBtn = document.getElementById('close-contact-modal');
const cancelEditContactBtn = document.getElementById('cancel-edit-contact');

// Helper: Get Today's Date String (YYYY-MM-DD)
const getTodayString = () => new Date().toISOString().split('T')[0];

if (incomeDateInput) incomeDateInput.value = getTodayString();
if (txDateInput) txDateInput.value = getTodayString();

// Navigation Logic
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const targetId = link.getAttribute('data-target');
        views.forEach(view => {
            view.classList.remove('active-view');
            view.classList.add('hidden-view');
        });
        const targetView = document.getElementById(targetId);
        if (targetView) {
            targetView.classList.remove('hidden-view');
            targetView.classList.add('active-view');
        }
    });
});

// Format Currency
const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
};

// Update Dashboard UI
const updateDashboard = () => {
    const income = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;

    totalBalanceEl.innerText = formatMoney(balance);
    totalIncomeEl.innerText = formatMoney(income);
    totalExpenseEl.innerText = formatMoney(expense);

    // 60/40 Rule Calculations
    const spendLimit = income * 0.6;
    const savingsGoal = income * 0.4;
    
    spendLimitEl.innerText = formatMoney(spendLimit);
    savingsGoalEl.innerText = formatMoney(savingsGoal);

    let spendPercentage = 0;
    if (income > 0) {
        spendPercentage = (expense / income) * 100;
    }

    spendProgressEl.style.width = `${Math.min(spendPercentage, 100)}%`;
    spendPercentageEl.innerText = `${spendPercentage.toFixed(1)}% of total income spent`;

    // Alert Logic based on 60/40 Rule
    alertContainer.className = 'alert hidden';
    alertContainer.innerHTML = '';
    spendProgressEl.style.background = 'linear-gradient(90deg, var(--success), var(--warning))';

    if (income > 0) {
        if (spendPercentage >= 60) {
            alertContainer.className = 'alert danger';
            alertContainer.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Warning: You have exceeded your 60% spend limit. You are cutting into your savings allocation!
            `;
            spendProgressEl.style.background = 'var(--danger)';
        } else if (spendPercentage >= 50) {
            alertContainer.className = 'alert warning';
            alertContainer.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                Caution: You are approaching your spend limit (${spendPercentage.toFixed(1)}% / 60%).
            `;
        }
    }

    renderTransactions();
};

// Render Transaction List with Edit & Delete Actions
const renderTransactions = () => {
    transactionList.innerHTML = '';
    if (txCountEl) txCountEl.innerText = `${transactions.length} item${transactions.length === 1 ? '' : 's'}`;

    if (transactions.length === 0) {
        transactionList.innerHTML = '<div class="empty-state">No transactions yet</div>';
        return;
    }

    // Sort by newest first
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(t => {
        const item = document.createElement('div');
        item.className = 'list-item';
        
        const isExpense = t.type === 'EXPENSE';
        const sign = isExpense ? '-' : '+';
        const colorClass = isExpense ? 'text-red' : 'text-green';
        const badgeClass = isExpense ? 'badge-expense' : 'badge-income';
        const badgeText = isExpense ? 'Expense' : 'Income';

        item.innerHTML = `
            <div class="item-info">
                <h4>
                    ${escapeHtml(t.category)}
                    <span class="badge-tag ${badgeClass}">${badgeText}</span>
                </h4>
                <p>${new Date(t.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
            </div>
            <div class="list-item-right">
                <div class="item-amount ${colorClass}">
                    ${sign}${formatMoney(t.amount)}
                </div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" title="Edit Transaction" data-id="${t.id}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        Edit
                    </button>
                    <button class="action-btn delete-btn" title="Delete Transaction" data-id="${t.id}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
        `;
        transactionList.appendChild(item);
    });

    // Attach listeners for Edit & Delete buttons
    transactionList.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditTxModal(btn.dataset.id));
    });

    transactionList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteTransaction(btn.dataset.id));
    });
};

// Handle Dedicated Income Submit
if (incomeForm) {
    incomeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(incomeAmountInput.value);
        const category = incomeSourceInput.value.trim() || 'Income';
        const dateVal = incomeDateInput.value ? new Date(incomeDateInput.value) : new Date();

        transactions.push({
            id: Date.now().toString(),
            type: 'INCOME',
            amount,
            category,
            date: dateVal
        });

        incomeForm.reset();
        if (incomeDateInput) incomeDateInput.value = getTodayString();
        saveState();
        updateDashboard();
    });
}

// Handle Transaction Form Submit
if (transactionForm) {
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const type = document.getElementById('tx-type').value;
        const amount = parseFloat(document.getElementById('tx-amount').value);
        const category = document.getElementById('tx-category').value.trim();
        const dateField = document.getElementById('tx-date');
        const dateVal = (dateField && dateField.value) ? new Date(dateField.value) : new Date();

        transactions.push({
            id: Date.now().toString(),
            type,
            amount,
            category,
            date: dateVal
        });

        transactionForm.reset();
        if (dateField) dateField.value = getTodayString();
        saveState();
        updateDashboard();
    });
}

// Edit Transaction Functions
const openEditTxModal = (id) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    editTxIdInput.value = tx.id;
    editTxTypeInput.value = tx.type;
    editTxAmountInput.value = tx.amount;
    editTxCategoryInput.value = tx.category;
    
    const txDate = new Date(tx.date);
    editTxDateInput.value = !isNaN(txDate.getTime()) ? txDate.toISOString().split('T')[0] : getTodayString();

    editTxModal.classList.remove('hidden');
};

const closeEditTxModal = () => {
    editTxModal.classList.add('hidden');
    editTxForm.reset();
};

if (closeTxModalBtn) closeTxModalBtn.addEventListener('click', closeEditTxModal);
if (cancelEditTxBtn) cancelEditTxBtn.addEventListener('click', closeEditTxModal);

editTxForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editTxIdInput.value;
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    tx.type = editTxTypeInput.value;
    tx.amount = parseFloat(editTxAmountInput.value);
    tx.category = editTxCategoryInput.value.trim();
    tx.date = new Date(editTxDateInput.value);

    saveState();
    closeEditTxModal();
    updateDashboard();
});

const deleteTransaction = (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveState();
        updateDashboard();
    }
};

// Update Ledger UI with Edit Contact and Settle Actions
const updateLedger = () => {
    contactList.innerHTML = '';
    
    // Group active ledger entries by contact
    const contactMap = {};
    ledger.forEach(entry => {
        if (!entry.status || entry.status === 'PENDING') {
            if (!contactMap[entry.contact]) {
                contactMap[entry.contact] = {
                    balance: 0,
                    entries: []
                };
            }
            contactMap[entry.contact].entries.push(entry);
            if (entry.type === 'GAVE') {
                contactMap[entry.contact].balance += entry.amount;
            } else {
                contactMap[entry.contact].balance -= entry.amount;
            }
        }
    });

    const activeContacts = Object.entries(contactMap).filter(([_, data]) => data.balance !== 0);

    if (contactCountEl) {
        contactCountEl.innerText = `${activeContacts.length} active`;
    }

    if (activeContacts.length === 0) {
        contactList.innerHTML = '<div class="empty-state">No active debts</div>';
        return;
    }

    activeContacts.forEach(([contactName, data]) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        
        let statusHtml = '';
        let amountClass = '';
        let amountText = '';

        if (data.balance > 0) {
            statusHtml = '<span class="status-badge status-owe-me">They owe you</span>';
            amountClass = 'text-green';
            amountText = formatMoney(data.balance);
        } else {
            statusHtml = '<span class="status-badge status-i-owe">You owe them</span>';
            amountClass = 'text-red';
            amountText = formatMoney(Math.abs(data.balance));
        }

        item.innerHTML = `
            <div class="item-info">
                <h4>${escapeHtml(contactName)}</h4>
                ${statusHtml}
            </div>
            <div class="list-item-right">
                <div class="item-amount ${amountClass}">
                    ${amountText}
                </div>
                <div class="item-actions">
                    <button class="action-btn edit-btn edit-contact-btn" title="Edit Contact" data-contact="${escapeHtml(contactName)}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        Edit
                    </button>
                    <button class="action-btn settle-btn settle-contact-quick" title="Settle All Balance" data-contact="${escapeHtml(contactName)}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Settle
                    </button>
                </div>
            </div>
        `;
        contactList.appendChild(item);
    });

    // Attach listener for contact edit buttons
    contactList.querySelectorAll('.edit-contact-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditContactModal(btn.dataset.contact));
    });

    // Attach listener for quick settle buttons
    contactList.querySelectorAll('.settle-contact-quick').forEach(btn => {
        btn.addEventListener('click', () => settleContactDebts(btn.dataset.contact));
    });
};

// Handle Ledger Submit
if (ledgerForm) {
    ledgerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const type = document.getElementById('ledger-type').value;
        const contact = document.getElementById('ledger-contact').value.trim();
        const amount = parseFloat(document.getElementById('ledger-amount').value);

        ledger.push({
            id: Date.now().toString(),
            type,
            contact,
            amount,
            status: 'PENDING',
            date: new Date()
        });

        ledgerForm.reset();
        saveState();
        updateLedger();
    });
}

// Edit Contact Modal Functions
const openEditContactModal = (contactName) => {
    editOriginalContactNameInput.value = contactName;
    editContactNameInput.value = contactName;

    // Render associated entries preview
    const entries = ledger.filter(e => e.contact === contactName && (!e.status || e.status === 'PENDING'));
    editContactEntriesList.innerHTML = '';

    if (entries.length === 0) {
        editContactEntriesList.innerHTML = '<div style="font-size:0.8rem; color:var(--text-muted);">No pending entries</div>';
    } else {
        entries.forEach(entry => {
            const row = document.createElement('div');
            row.className = 'mini-entry-item';
            const isGave = entry.type === 'GAVE';
            row.innerHTML = `
                <span>${isGave ? 'You gave' : 'You got'}: <strong>${formatMoney(entry.amount)}</strong></span>
                <button type="button" class="action-btn delete-btn remove-mini-entry" data-entry-id="${entry.id}" style="padding:2px 4px;" title="Remove Entry">&times;</button>
            `;
            editContactEntriesList.appendChild(row);
        });

        editContactEntriesList.querySelectorAll('.remove-mini-entry').forEach(btn => {
            btn.addEventListener('click', () => {
                const entryId = btn.dataset.entryId;
                ledger = ledger.filter(e => e.id !== entryId);
                saveState();
                openEditContactModal(contactName); // refresh modal list
                updateLedger();
            });
        });
    }

    editContactModal.classList.remove('hidden');
};

const closeEditContactModal = () => {
    editContactModal.classList.add('hidden');
    editContactForm.reset();
};

if (closeContactModalBtn) closeContactModalBtn.addEventListener('click', closeEditContactModal);
if (cancelEditContactBtn) cancelEditContactBtn.addEventListener('click', closeEditContactModal);

// Save Contact Name Edits (propagates across all associated ledger entries)
editContactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const originalName = editOriginalContactNameInput.value;
    const newName = editContactNameInput.value.trim();

    if (newName && newName !== originalName) {
        ledger.forEach(entry => {
            if (entry.contact === originalName) {
                entry.contact = newName;
            }
        });
        saveState();
    }

    closeEditContactModal();
    updateLedger();
});

// Settle All Debts for Contact
const settleContactDebts = (contactName) => {
    if (confirm(`Mark all active debts for "${contactName}" as settled?`)) {
        ledger.forEach(entry => {
            if (entry.contact === contactName) {
                entry.status = 'SETTLED';
            }
        });
        saveState();
        updateLedger();
    }
};

if (settleAllContactBtn) {
    settleAllContactBtn.addEventListener('click', () => {
        const originalName = editOriginalContactNameInput.value;
        if (originalName) {
            settleContactDebts(originalName);
            closeEditContactModal();
        }
    });
}

// Modal Backdrop Click & Escape Key Handlers
[editTxModal, editContactModal].forEach(modal => {
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (editTxModal && !editTxModal.classList.contains('hidden')) closeEditTxModal();
        if (editContactModal && !editContactModal.classList.contains('hidden')) closeEditContactModal();
    }
});

// Helper: Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Initial Render
updateDashboard();
updateLedger();
