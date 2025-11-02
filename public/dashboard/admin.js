// ===== ADMIN PANEL FUNCTIONALITY =====

// Modal helpers (if not already in script.js)
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

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
    
    // Fetch wallets
    const walletsRes = await fetch('/api/wallets');
    if (walletsRes.ok) {
      const data = await walletsRes.json();
      renderWallets(data.wallets || []);
    }
    
    // Fetch projects
    const projectsRes = await fetch('/api/projects');
    if (projectsRes.ok) {
      const data = await projectsRes.json();
      renderProjects(data.projects || []);
    }
    
    // Fetch testimonials
    const testimonialsRes = await fetch('/api/testimonials');
    if (testimonialsRes.ok) {
      const data = await testimonialsRes.json();
      renderTestimonials(data.testimonials || []);
    }
    
    // Fetch news
    const newsRes = await fetch('/api/news?limit=100');
    if (newsRes.ok) {
      const data = await newsRes.json();
      renderNews(data.news || []);
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

// Render wallets
function renderWallets(wallets) {
  const tbody = document.getElementById('walletsBody');
  if (!tbody) return;
  
  if (wallets.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">No wallets configured</td></tr>';
    return;
  }
  
  tbody.innerHTML = wallets.map(wallet => `
    <tr>
      <td>${wallet.coin_name}</td>
      <td style="font-family: monospace; font-size: 0.85rem;">${wallet.address.substring(0, 30)}...</td>
      <td>${wallet.qr_url ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times"></i>'}</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="editWallet(${wallet.id}, '${wallet.coin_name}', '${wallet.address}', '${wallet.qr_url || ''}')">
          <i class="fas fa-edit"></i> Edit
        </button>
      </td>
    </tr>
  `).join('');
}

// Render projects
function renderProjects(projects) {
  const tbody = document.getElementById('projectsBody');
  if (!tbody) return;
  
  if (projects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">No projects yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = projects.map(project => `
    <tr>
      <td>${project.title}</td>
      <td><code>${project.slug}</code></td>
      <td>${(project.description || '').substring(0, 50)}...</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="editProject(${project.id}, '${escape(project.title)}', '${escape(project.slug)}', '${escape(project.description || '')}', '${escape(project.image_url || '')}', '${escape(project.content_html || '')}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-outline btn-sm" onclick="deleteProject(${project.id})" style="margin-left: 0.5rem;">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    </tr>
  `).join('');
}

// Render testimonials
function renderTestimonials(testimonials) {
  const tbody = document.getElementById('testimonialsBody');
  if (!tbody) return;
  
  if (testimonials.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">No testimonials yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = testimonials.map(test => `
    <tr>
      <td>${test.name}</td>
      <td>${(test.content || '').substring(0, 60)}...</td>
      <td>${formatDate(test.date_added)}</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="editTestimonial(${test.id}, '${escape(test.name)}', '${escape(test.image_url || '')}', '${escape(test.content)}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-outline btn-sm" onclick="deleteTestimonial(${test.id})" style="margin-left: 0.5rem;">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    </tr>
  `).join('');
}

// Render news
function renderNews(news) {
  const tbody = document.getElementById('newsBody');
  if (!tbody) return;
  
  if (news.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No articles yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = news.map(article => {
    const date = new Date(article.date);
    return `
      <tr>
        <td>${article.title}</td>
        <td><code>${article.slug}</code></td>
        <td>${(article.summary || '').substring(0, 40)}...</td>
        <td>${date.toLocaleDateString()}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="editNews(${article.id}, '${escape(article.title)}', '${escape(article.slug)}', '${escape(article.summary || '')}', '${escape(article.image_url || '')}', '${escape(article.content_html)}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-outline btn-sm" onclick="deleteNews(${article.id})" style="margin-left: 0.5rem;">
            <i class="fas fa-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Wallet management
function openWalletModal(id = null, coinName = '', address = '', qrUrl = '') {
  document.getElementById('walletId').value = id || '';
  document.getElementById('walletCoinName').value = coinName;
  document.getElementById('walletAddress').value = address;
  document.getElementById('walletQrUrl').value = qrUrl;
  document.getElementById('walletModalTitle').textContent = id ? 'Edit Wallet' : 'Add Wallet';
  openModal('walletModal');
}

function editWallet(id, coinName, address, qrUrl) {
  openWalletModal(id, coinName, address, qrUrl);
}

async function saveWallet(e) {
  e.preventDefault();
  const id = document.getElementById('walletId').value;
  const coinName = document.getElementById('walletCoinName').value;
  const address = document.getElementById('walletAddress').value;
  const qrUrl = document.getElementById('walletQrUrl').value;
  
  try {
    const res = await fetch('/api/admin/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id || null, coin_name: coinName, address, qr_url: qrUrl })
    });
    
    if (res.ok) {
      showToast('Wallet saved successfully', 'success');
      closeModal('walletModal');
      loadAdminData();
    } else {
      const data = await res.json();
      showToast(data.message || 'Failed to save wallet', 'error');
    }
  } catch (error) {
    console.error('Save wallet error:', error);
    showToast('Failed to save wallet', 'error');
  }
}

// Project management
function openProjectModal(id = null, title = '', slug = '', description = '', imageUrl = '', content = '') {
  document.getElementById('projectId').value = id || '';
  document.getElementById('projectTitle').value = title;
  document.getElementById('projectSlug').value = slug;
  document.getElementById('projectDescription').value = description;
  document.getElementById('projectImageUrl').value = imageUrl;
  document.getElementById('projectContent').value = content;
  document.getElementById('projectModalTitle').textContent = id ? 'Edit Project' : 'Add Project';
  openModal('projectModal');
}

function editProject(id, title, slug, description, imageUrl, content) {
  openProjectModal(id, unescape(title), unescape(slug), unescape(description), unescape(imageUrl), unescape(content));
}

async function saveProject(e) {
  e.preventDefault();
  const id = document.getElementById('projectId').value;
  const title = document.getElementById('projectTitle').value;
  const slug = document.getElementById('projectSlug').value;
  const description = document.getElementById('projectDescription').value;
  const imageUrl = document.getElementById('projectImageUrl').value;
  const content = document.getElementById('projectContent').value;
  
  try {
    const res = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id || null, title, slug, description, image_url: imageUrl, content_html: content })
    });
    
    if (res.ok) {
      showToast('Project saved successfully', 'success');
      closeModal('projectModal');
      loadAdminData();
    } else {
      const data = await res.json();
      showToast(data.message || 'Failed to save project', 'error');
    }
  } catch (error) {
    console.error('Save project error:', error);
    showToast('Failed to save project', 'error');
  }
}

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  try {
    const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Project deleted', 'success');
      loadAdminData();
    } else {
      showToast('Failed to delete project', 'error');
    }
  } catch (error) {
    showToast('Failed to delete project', 'error');
  }
}

// Testimonial management
function openTestimonialModal(id = null, name = '', imageUrl = '', content = '') {
  document.getElementById('testimonialId').value = id || '';
  document.getElementById('testimonialName').value = name;
  document.getElementById('testimonialImageUrl').value = imageUrl;
  document.getElementById('testimonialContent').value = content;
  document.getElementById('testimonialModalTitle').textContent = id ? 'Edit Testimonial' : 'Add Testimonial';
  openModal('testimonialModal');
}

function editTestimonial(id, name, imageUrl, content) {
  openTestimonialModal(id, unescape(name), unescape(imageUrl), unescape(content));
}

async function saveTestimonial(e) {
  e.preventDefault();
  const id = document.getElementById('testimonialId').value;
  const name = document.getElementById('testimonialName').value;
  const imageUrl = document.getElementById('testimonialImageUrl').value;
  const content = document.getElementById('testimonialContent').value;
  
  try {
    const res = await fetch('/api/admin/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id || null, name, image_url: imageUrl, content })
    });
    
    if (res.ok) {
      showToast('Testimonial saved successfully', 'success');
      closeModal('testimonialModal');
      loadAdminData();
    } else {
      const data = await res.json();
      showToast(data.message || 'Failed to save testimonial', 'error');
    }
  } catch (error) {
    console.error('Save testimonial error:', error);
    showToast('Failed to save testimonial', 'error');
  }
}

async function deleteTestimonial(id) {
  if (!confirm('Delete this testimonial?')) return;
  try {
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Testimonial deleted', 'success');
      loadAdminData();
    } else {
      showToast('Failed to delete testimonial', 'error');
    }
  } catch (error) {
    showToast('Failed to delete testimonial', 'error');
  }
}

// News management
function openNewsModal(id = null, title = '', slug = '', summary = '', imageUrl = '', content = '') {
  document.getElementById('newsId').value = id || '';
  document.getElementById('newsTitle').value = title;
  document.getElementById('newsSlug').value = slug;
  document.getElementById('newsSummary').value = summary;
  document.getElementById('newsImageUrl').value = imageUrl;
  document.getElementById('newsContent').value = content;
  document.getElementById('newsModalTitle').textContent = id ? 'Edit Article' : 'Add Article';
  openModal('newsModal');
}

function editNews(id, title, slug, summary, imageUrl, content) {
  openNewsModal(id, unescape(title), unescape(slug), unescape(summary), unescape(imageUrl), unescape(content));
}

async function saveNews(e) {
  e.preventDefault();
  const id = document.getElementById('newsId').value;
  const title = document.getElementById('newsTitle').value;
  const slug = document.getElementById('newsSlug').value;
  const summary = document.getElementById('newsSummary').value;
  const imageUrl = document.getElementById('newsImageUrl').value;
  const content = document.getElementById('newsContent').value;
  
  try {
    const res = await fetch('/api/admin/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id || null, title, slug, summary, image_url: imageUrl, content_html: content })
    });
    
    if (res.ok) {
      showToast('Article saved successfully', 'success');
      closeModal('newsModal');
      loadAdminData();
    } else {
      const data = await res.json();
      showToast(data.message || 'Failed to save article', 'error');
    }
  } catch (error) {
    console.error('Save article error:', error);
    showToast('Failed to save article', 'error');
  }
}

async function deleteNews(id) {
  if (!confirm('Delete this article?')) return;
  try {
    const res = await fetch(`/api/admin/news/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Article deleted', 'success');
      loadAdminData();
    } else {
      showToast('Failed to delete article', 'error');
    }
  } catch (error) {
    showToast('Failed to delete article', 'error');
  }
}

function escape(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n');
}

function unescape(str) {
  return str.replace(/\\'/g, "'").replace(/&quot;/g, '"').replace(/\\n/g, '\n');
}

// Make functions global
window.approveDeposit = approveDeposit;
window.rejectDeposit = rejectDeposit;
window.approveWithdrawal = approveWithdrawal;
window.rejectWithdrawal = rejectWithdrawal;
window.approveUser = approveUser;
window.refreshAdminData = refreshAdminData;
window.openWalletModal = openWalletModal;
window.saveWallet = saveWallet;
window.editWallet = editWallet;
window.openProjectModal = openProjectModal;
window.saveProject = saveProject;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.openTestimonialModal = openTestimonialModal;
window.saveTestimonial = saveTestimonial;
window.editTestimonial = editTestimonial;
window.deleteTestimonial = deleteTestimonial;
window.openNewsModal = openNewsModal;
window.saveNews = saveNews;
window.editNews = editNews;
window.deleteNews = deleteNews;

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

