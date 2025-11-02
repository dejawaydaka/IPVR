// ===== ADMIN PANEL FUNCTIONALITY =====

// Check if user is admin (simple check - in production use proper admin flag)
function checkAdminAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '../index.html';
    return false;
  }
  
  // For now, allow any logged-in user. In production, check admin_approved flag
  // You can enhance this by checking user.admin_approved === true from backend
  return true;
}

// Load admin dashboard data
async function loadAdminData() {
  if (!checkAdminAuth()) return;
  
  try {
    showLoading(true);
    
    // Fetch admin stats
    const statsRes = await fetch('/api/admin/stats');
    if (statsRes.ok) {
      const stats = await statsRes.json();
      updateAdminMetrics(stats);
    }
    
    // Fetch pending deposits
    const depositsRes = await fetch('/api/admin/deposits/pending');
    if (depositsRes.ok) {
      const data = await depositsRes.json();
      renderPendingDeposits(data.deposits || []);
    }
    
    // Fetch pending withdrawals
    const withdrawalsRes = await fetch('/api/admin/withdrawals/pending');
    if (withdrawalsRes.ok) {
      const data = await withdrawalsRes.json();
      renderPendingWithdrawals(data.withdrawals || []);
    }
    
    // Fetch all users
    const usersRes = await fetch('/admin/users');
    if (usersRes.ok) {
      const data = await usersRes.json();
      renderAllUsers(data.users || []);
    }
    
  } catch (error) {
    console.error('Admin data load error:', error);
    showToast('Failed to load admin data', 'error');
  } finally {
    showLoading(false);
  }
}

// Update admin metrics
function updateAdminMetrics(stats) {
  document.getElementById('adminTotalUsers').textContent = stats.totalUsers || 0;
  document.getElementById('adminTotalInvestments').textContent = `$${formatNumber(stats.totalInvestments || 0)}`;
  document.getElementById('adminTotalDeposits').textContent = `$${formatNumber(stats.totalDeposits || 0)}`;
  document.getElementById('adminTotalWithdrawals').textContent = `$${formatNumber(stats.totalWithdrawals || 0)}`;
  document.getElementById('adminPendingDeposits').textContent = stats.pendingDeposits || 0;
  document.getElementById('adminPendingWithdrawals').textContent = stats.pendingWithdrawals || 0;
}

// Render pending deposits
function renderPendingDeposits(deposits) {
  const tbody = document.getElementById('pendingDepositsBody');
  if (!tbody) return;
  
  if (deposits.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No pending deposits</td></tr>';
    return;
  }
  
  tbody.innerHTML = deposits.map(deposit => `
    <tr>
      <td>${deposit.user_email || 'N/A'}</td>
      <td>$${formatNumber(deposit.amount)}</td>
      <td>${deposit.currency || 'USD'}</td>
      <td>${deposit.transaction_hash ? deposit.transaction_hash.substring(0, 20) + '...' : 'N/A'}</td>
      <td>${formatDate(deposit.created_at)}</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="approveDeposit(${deposit.id})">
          <i class="fas fa-check"></i> Approve
        </button>
        <button class="btn btn-outline btn-sm" onclick="rejectDeposit(${deposit.id})" style="margin-left: 0.5rem;">
          <i class="fas fa-times"></i> Reject
        </button>
      </td>
    </tr>
  `).join('');
}

// Render pending withdrawals
function renderPendingWithdrawals(withdrawals) {
  const tbody = document.getElementById('pendingWithdrawalsBody');
  if (!tbody) return;
  
  if (withdrawals.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No pending withdrawals</td></tr>';
    return;
  }
  
  tbody.innerHTML = withdrawals.map(withdrawal => `
    <tr>
      <td>${withdrawal.user_email || 'N/A'}</td>
      <td>$${formatNumber(withdrawal.amount)}</td>
      <td>${withdrawal.crypto_type}</td>
      <td>${withdrawal.wallet_address.substring(0, 20)}...</td>
      <td>${formatDate(withdrawal.created_at)}</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="approveWithdrawal(${withdrawal.id})">
          <i class="fas fa-check"></i> Approve
        </button>
        <button class="btn btn-outline btn-sm" onclick="rejectWithdrawal(${withdrawal.id})" style="margin-left: 0.5rem;">
          <i class="fas fa-times"></i> Reject
        </button>
      </td>
    </tr>
  `).join('');
}

// Render all users
function renderAllUsers(users) {
  const tbody = document.getElementById('allUsersBody');
  if (!tbody) return;
  
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No users found</td></tr>';
    return;
  }
  
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.email}</td>
      <td>${user.name || 'N/A'}</td>
      <td>$${formatNumber(user.balance || 0)}</td>
      <td>$${formatNumber(user.total_investment || 0)}</td>
      <td>$${formatNumber(user.total_profit || 0)}</td>
      <td>
        <span class="badge ${user.admin_approved ? 'badge-success' : 'badge-warning'}">
          ${user.admin_approved ? 'Approved' : 'Pending'}
        </span>
      </td>
      <td>
        ${!user.admin_approved ? `
          <button class="btn btn-primary btn-sm" onclick="approveUser('${user.email}')">
            <i class="fas fa-check"></i> Approve
          </button>
        ` : ''}
      </td>
    </tr>
  `).join('');
}

// Approve deposit
async function approveDeposit(depositId) {
  if (!confirm('Approve this deposit?')) return;
  
  try {
    const res = await fetch(`/api/admin/deposits/${depositId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (res.ok) {
      showToast('Deposit approved successfully', 'success');
      loadAdminData();
    } else {
      const data = await res.json();
      showToast(data.message || 'Failed to approve deposit', 'error');
    }
  } catch (error) {
    console.error('Approve deposit error:', error);
    showToast('Failed to approve deposit', 'error');
  }
}

// Reject deposit
async function rejectDeposit(depositId) {
  if (!confirm('Reject this deposit?')) return;
  
  try {
    const res = await fetch(`/api/admin/deposits/${depositId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (res.ok) {
      showToast('Deposit rejected', 'success');
      loadAdminData();
    } else {
      const data = await res.json();
      showToast(data.message || 'Failed to reject deposit', 'error');
    }
  } catch (error) {
    console.error('Reject deposit error:', error);
    showToast('Failed to reject deposit', 'error');
  }
}

// Approve withdrawal
async function approveWithdrawal(withdrawalId) {
  if (!confirm('Approve this withdrawal?')) return;
  
  try {
    const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (res.ok) {
      showToast('Withdrawal approved successfully', 'success');
      loadAdminData();
    } else {
      const data = await res.json();
      showToast(data.message || 'Failed to approve withdrawal', 'error');
    }
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    showToast('Failed to approve withdrawal', 'error');
  }
}

// Reject withdrawal
async function rejectWithdrawal(withdrawalId) {
  if (!confirm('Reject this withdrawal?')) return;
  
  try {
    const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (res.ok) {
      showToast('Withdrawal rejected', 'success');
      loadAdminData();
    } else {
      const data = await res.json();
      showToast(data.message || 'Failed to reject withdrawal', 'error');
    }
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    showToast('Failed to reject withdrawal', 'error');
  }
}

// Approve user
async function approveUser(email) {
  if (!confirm(`Approve user ${email}?`)) return;
  
  try {
    const res = await fetch('/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (res.ok) {
      showToast('User approved successfully', 'success');
      loadAdminData();
    } else {
      const data = await res.json();
      showToast(data.message || 'Failed to approve user', 'error');
    }
  } catch (error) {
    console.error('Approve user error:', error);
    showToast('Failed to approve user', 'error');
  }
}

// Refresh admin data
function refreshAdminData() {
  loadAdminData();
}

// Helper functions
function formatNumber(num) {
  return Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Make functions global
window.approveDeposit = approveDeposit;
window.rejectDeposit = rejectDeposit;
window.approveWithdrawal = approveWithdrawal;
window.rejectWithdrawal = rejectWithdrawal;
window.approveUser = approveUser;
window.refreshAdminData = refreshAdminData;

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    initDashboard();
    setupMobileMenu();
    loadAdminData();
  });
} else {
  checkAdminAuth();
  initDashboard();
  setupMobileMenu();
  loadAdminData();
}

