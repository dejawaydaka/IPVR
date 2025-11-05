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
  // Check admin session from localStorage (set in admin-login.html)
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  if (!isAdmin) {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/admin/')) {
      window.location.href = '../admin-login.html';
    } else {
      window.location.href = 'admin-login.html';
    }
    return false;
  }
  return true;
}

// Admin-specific sidebar renderer
function renderAdminSidebar(currentPage = '') {
  // Determine current page based on path
  const currentPath = window.location.pathname;
  let currentFile = '';
  
  if (currentPath.includes('/admin/dashboard.html')) currentFile = 'dashboard.html';
  else if (currentPath.includes('/admin/users.html')) currentFile = 'users.html';
  else if (currentPath.includes('/admin/wallets.html')) currentFile = 'wallets.html';
  else if (currentPath.includes('/admin/projects.html')) currentFile = 'projects.html';
  else if (currentPath.includes('/admin/testimonials.html')) currentFile = 'testimonials.html';
  else if (currentPath.includes('/admin/news.html')) currentFile = 'news.html';
  else if (currentPath.includes('/admin/plans.html')) currentFile = 'plans.html';
  else if (currentPath.includes('/admin.html')) currentFile = 'admin.html';
  
  // Determine base path (if in /admin/ folder, use relative paths)
  const isInAdminFolder = currentPath.includes('/admin/');
  const basePath = isInAdminFolder ? '' : 'admin/';
  
  const adminPages = [
    { path: `${basePath}dashboard.html`, name: 'Dashboard Overview', icon: 'fas fa-chart-line', file: 'dashboard.html' },
    { path: `${basePath}users.html`, name: 'User Management', icon: 'fas fa-users', file: 'users.html' },
    { path: `${basePath}wallets.html`, name: 'Wallet Management', icon: 'fas fa-wallet', file: 'wallets.html' },
    { path: `${basePath}projects.html`, name: 'Projects', icon: 'fas fa-building', file: 'projects.html' },
    { path: `${basePath}testimonials.html`, name: 'Testimonials', icon: 'fas fa-comments', file: 'testimonials.html' },
    { path: `${basePath}news.html`, name: 'News & Insights', icon: 'fas fa-newspaper', file: 'news.html' },
    { path: `${basePath}plans.html`, name: 'Investment Plans', icon: 'fas fa-coins', file: 'plans.html' }
  ];
  
  return `
    <aside class="sidebar">
      <div style="text-align: center; margin-bottom: 1rem;">
        <img src="${isInAdminFolder ? '../' : ''}../Rswhite.png" alt="RealSphere" style="height: 50px; width: auto; max-width: 100%;">
      </div>
      <div class="user-display">
        <span style="color: #4ef5a3; font-weight: 600;">Administrator</span>
      </div>
      <ul>
        ${adminPages.map(page => `
          <li>
            <a href="${page.path}" class="${currentFile === page.file ? 'active' : ''}">
              <i class="${page.icon}"></i>
              <span>${page.name}</span>
            </a>
          </li>
        `).join('')}
        <li>
          <a href="#" onclick="logoutAdmin(); return false;">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </a>
        </li>
      </ul>
    </aside>
  `;
}

function logoutAdmin() {
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('admin_username');
  // Determine correct path based on current location
  const currentPath = window.location.pathname;
  if (currentPath.includes('/admin/')) {
    window.location.href = '../admin-login.html';
  } else {
    window.location.href = 'admin-login.html';
  }
}

// Helper function to get admin auth headers
function getAdminHeaders() {
  return {
    'x-admin-username': 'admin',
    'x-admin-password': 'pass2002word',
    'Content-Type': 'application/json'
  };
}

// Helper function for authenticated fetch
async function adminFetch(url, options = {}) {
  const defaultHeaders = getAdminHeaders();
  const headers = { ...defaultHeaders, ...(options.headers || {}) };
  
  // For FormData requests, don't set Content-Type (browser will set it with boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
}

// Load admin dashboard data
async function loadAdminData() {
  if (!checkAdminAuth()) return;
  
  try {
    showLoading(true);
    
    // Fetch admin stats (only update if on dashboard page)
    const statsRes = await adminFetch('/api/admin/stats');
    if (!statsRes.ok) {
      throw new Error(`HTTP ${statsRes.status}: Failed to fetch admin stats`);
    }
    const stats = await statsRes.json();
    updateAdminMetrics(stats); // This function now checks if elements exist
    
    // Fetch pending deposits (only render if element exists)
    const depositsRes = await adminFetch('/api/admin/deposits/pending');
    if (!depositsRes.ok) {
      console.warn('Failed to fetch pending deposits:', depositsRes.status);
    } else {
      const depositsData = await depositsRes.json();
      renderPendingDeposits(depositsData.deposits || []); // This function checks if element exists
    }
    
    // Fetch pending withdrawals (only render if element exists)
    const withdrawalsRes = await adminFetch('/api/admin/withdrawals/pending');
    if (!withdrawalsRes.ok) {
      console.warn('Failed to fetch pending withdrawals:', withdrawalsRes.status);
    } else {
      const withdrawalsData = await withdrawalsRes.json();
      renderPendingWithdrawals(withdrawalsData.withdrawals || []); // This function checks if element exists
    }
    
    // Fetch all users (only render if element exists)
    const usersRes = await adminFetch('/api/admin/users');
    if (!usersRes.ok) {
      console.warn('Failed to fetch users:', usersRes.status);
    } else {
      const usersData = await usersRes.json();
      renderAllUsers(usersData.users || []); // This function checks if element exists
    }
    
    // Fetch wallets (public route, no auth needed - only render if element exists)
    try {
      const walletsRes = await fetch('/api/wallets');
      if (walletsRes.ok) {
        const walletsData = await walletsRes.json();
        renderWallets(walletsData.wallets || []); // This function checks if element exists
      }
    } catch (e) {
      console.warn('Failed to fetch wallets:', e);
    }
    
    // Fetch projects (public route, no auth needed - only render if element exists)
    try {
      const projectsRes = await fetch('/api/projects');
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        renderProjects(projectsData.projects || []); // This function checks if element exists
      }
    } catch (e) {
      console.warn('Failed to fetch projects:', e);
    }
    
    // Fetch testimonials (public route, no auth needed - only render if element exists)
    try {
      const testimonialsRes = await fetch('/api/testimonials');
      if (testimonialsRes.ok) {
        const testimonialsData = await testimonialsRes.json();
        renderTestimonials(testimonialsData.testimonials || []); // This function checks if element exists
      }
    } catch (e) {
      console.warn('Failed to fetch testimonials:', e);
    }
    
    // Fetch news (public route, no auth needed - only render if element exists)
    try {
      const newsRes = await fetch('/api/news?limit=100');
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        renderNews(newsData.news || []); // This function checks if element exists
      }
    } catch (e) {
      console.warn('Failed to fetch news:', e);
    }
    
  } catch (error) {
    console.error('Admin data load error:', error);
    showToast(error.message || 'Failed to load admin data', 'error');
  } finally {
    showLoading(false);
  }
}

// Update admin metrics (only if elements exist - for dashboard page only)
function updateAdminMetrics(stats) {
  const elements = {
    adminTotalUsers: document.getElementById('adminTotalUsers'),
    adminTotalInvestments: document.getElementById('adminTotalInvestments'),
    adminTotalDeposits: document.getElementById('adminTotalDeposits'),
    adminTotalWithdrawals: document.getElementById('adminTotalWithdrawals'),
    adminPendingDeposits: document.getElementById('adminPendingDeposits'),
    adminPendingWithdrawals: document.getElementById('adminPendingWithdrawals')
  };
  
  if (elements.adminTotalUsers) elements.adminTotalUsers.textContent = stats.totalUsers || 0;
  if (elements.adminTotalInvestments) elements.adminTotalInvestments.textContent = `$${formatNumber(stats.totalInvestments || 0)}`;
  if (elements.adminTotalDeposits) elements.adminTotalDeposits.textContent = `$${formatNumber(stats.totalDeposits || 0)}`;
  if (elements.adminTotalWithdrawals) elements.adminTotalWithdrawals.textContent = `$${formatNumber(stats.totalWithdrawals || 0)}`;
  if (elements.adminPendingDeposits) elements.adminPendingDeposits.textContent = stats.pendingDeposits || 0;
  if (elements.adminPendingWithdrawals) elements.adminPendingWithdrawals.textContent = stats.pendingWithdrawals || 0;
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

// Render confirmed deposits
function renderConfirmedDeposits(deposits) {
  const tbody = document.getElementById('confirmedDepositsBody');
  if (!tbody) return;
  
  if (deposits.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No confirmed deposits</td></tr>';
    return;
  }
  
  tbody.innerHTML = deposits.map(deposit => `
    <tr>
      <td>${deposit.user_email || 'N/A'}</td>
      <td>$${formatNumber(deposit.amount)}</td>
      <td>${deposit.currency || 'USD'}</td>
      <td>${deposit.transaction_hash ? deposit.transaction_hash.substring(0, 20) + '...' : 'N/A'}</td>
      <td>${formatDate(deposit.created_at)}</td>
      <td><span style="color: #4ef5a3; font-weight: 500;">Approved</span></td>
    </tr>
  `).join('');
}

// Render confirmed withdrawals
function renderConfirmedWithdrawals(withdrawals) {
  const tbody = document.getElementById('confirmedWithdrawalsBody');
  if (!tbody) return;
  
  if (withdrawals.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No confirmed withdrawals</td></tr>';
    return;
  }
  
  tbody.innerHTML = withdrawals.map(withdrawal => `
    <tr>
      <td>${withdrawal.user_email || 'N/A'}</td>
      <td>$${formatNumber(withdrawal.amount)}</td>
      <td>${withdrawal.crypto_type}</td>
      <td>${withdrawal.wallet_address.substring(0, 20)}...</td>
      <td>${formatDate(withdrawal.created_at)}</td>
      <td><span style="color: #4ef5a3; font-weight: 500;">Approved</span></td>
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
    const res = await adminFetch(`/api/admin/deposits/${depositId}/approve`, {
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
    const res = await adminFetch(`/api/admin/deposits/${depositId}/reject`, {
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
    const res = await adminFetch(`/api/admin/withdrawals/${withdrawalId}/approve`, {
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
    const res = await adminFetch(`/api/admin/withdrawals/${withdrawalId}/reject`, {
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
    const res = await adminFetch('/admin/approve', {
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

// Open homepage in new tab to preview updates
function refreshHomepage() {
  window.open('/', '_blank');
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
      <td><strong>${escape(project.title)}</strong></td>
      <td><code>${escape(project.slug)}</code></td>
      <td>${escape((project.description || '').substring(0, 50))}...</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="editProject(${project.id}, '${escape(project.title)}', '${escape(project.slug)}', '${escape(project.description || '')}', '${escape(project.image_url || '')}', '${escape(project.content_html || '')}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <a href="/projects/${escape(project.slug)}.html" target="_blank" class="btn btn-outline btn-sm" style="margin-left: 0.5rem; text-decoration: none;" title="View project page live">
          <i class="fas fa-external-link-alt"></i> View Live
        </a>
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
    const date = article.date ? new Date(article.date) : (article.created_at ? new Date(article.created_at) : new Date());
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
          <a href="/news/${escape(article.slug)}.html" target="_blank" class="btn btn-outline btn-sm" style="margin-left: 0.5rem; text-decoration: none;" title="View on homepage">
            <i class="fas fa-external-link-alt"></i> View Live
          </a>
          <button class="btn btn-outline btn-sm" onclick="deleteNews(${article.id})" style="margin-left: 0.5rem;">
            <i class="fas fa-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Image upload helper
async function uploadImage(file, type = 'admin') {
  if (!file) return null;
  
  const formData = new FormData();
  formData.append('image', file);
  formData.append('type', type);
  
  try {
    const res = await adminFetch('/api/admin/upload-image', {
      method: 'POST',
      body: formData
    });
    
    if (res.ok) {
      const data = await res.json();
      return data.url;
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    showToast('Failed to upload image', 'error');
    return null;
  }
}

// Setup image preview handlers
function setupImagePreviews() {
  // Wallet QR
  const walletQrFile = document.getElementById('walletQrFile');
  if (walletQrFile) {
    walletQrFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById('walletQrPreviewImg').src = event.target.result;
          document.getElementById('walletQrPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  // Project Image
  const projectImageFile = document.getElementById('projectImageFile');
  if (projectImageFile) {
    projectImageFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById('projectImagePreviewImg').src = event.target.result;
          document.getElementById('projectImagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  // Testimonial Image
  const testimonialImageFile = document.getElementById('testimonialImageFile');
  if (testimonialImageFile) {
    testimonialImageFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById('testimonialImagePreviewImg').src = event.target.result;
          document.getElementById('testimonialImagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  // News Image
  const newsImageFile = document.getElementById('newsImageFile');
  if (newsImageFile) {
    newsImageFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById('newsImagePreviewImg').src = event.target.result;
          document.getElementById('newsImagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// Wallet management
function openWalletModal(id = null, coinName = '', address = '', qrUrl = '') {
  document.getElementById('walletId').value = id || '';
  document.getElementById('walletCoinName').value = coinName;
  document.getElementById('walletAddress').value = address;
  document.getElementById('walletQrUrl').value = qrUrl || '';
  document.getElementById('walletQrFile').value = '';
  document.getElementById('walletModalTitle').textContent = id ? 'Edit Wallet' : 'Add Wallet';
  
  // Show preview if URL exists
  if (qrUrl) {
    document.getElementById('walletQrPreviewImg').src = qrUrl;
    document.getElementById('walletQrPreview').style.display = 'block';
  } else {
    document.getElementById('walletQrPreview').style.display = 'none';
  }
  
  openModal('walletModal');
}

function editWallet(id, coinName, address, qrUrl) {
  openWalletModal(id, coinName, address, qrUrl);
}

async function saveWallet(e) {
  e.preventDefault();
  showLoading(true);
  
  const id = document.getElementById('walletId').value;
  const coinName = document.getElementById('walletCoinName').value;
  const address = document.getElementById('walletAddress').value;
  const qrFile = document.getElementById('walletQrFile').files[0];
  let qrUrl = document.getElementById('walletQrUrl').value;
  
  try {
    // Upload image if new file selected
    if (qrFile) {
      const uploadedUrl = await uploadImage(qrFile, 'wallet-qr');
      if (uploadedUrl) {
        qrUrl = uploadedUrl;
      }
    }
    
    const res = await adminFetch('/api/admin/wallets', {
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
  } finally {
    showLoading(false);
  }
}

// Project management
function openProjectModal(id = null, title = '', slug = '', description = '', imageUrl = '', content = '') {
  document.getElementById('projectId').value = id || '';
  document.getElementById('projectTitle').value = title;
  document.getElementById('projectSlug').value = slug;
  document.getElementById('projectDescription').value = description;
  document.getElementById('projectImageUrl').value = imageUrl || '';
  document.getElementById('projectImageFile').value = '';
  document.getElementById('projectContent').value = content;
  document.getElementById('projectModalTitle').textContent = id ? 'Edit Project' : 'Add Project';
  
  // Show preview if URL exists
  if (imageUrl) {
    document.getElementById('projectImagePreviewImg').src = imageUrl;
    document.getElementById('projectImagePreview').style.display = 'block';
  } else {
    document.getElementById('projectImagePreview').style.display = 'none';
  }
  
  openModal('projectModal');
}

function editProject(id, title, slug, description, imageUrl, content) {
  openProjectModal(id, unescape(title), unescape(slug), unescape(description), unescape(imageUrl), unescape(content));
}

async function saveProject(e) {
  e.preventDefault();
  showLoading(true);
  
  const id = document.getElementById('projectId').value;
  const title = document.getElementById('projectTitle').value;
  const slug = document.getElementById('projectSlug').value;
  const description = document.getElementById('projectDescription').value;
  const imageFile = document.getElementById('projectImageFile').files[0];
  let imageUrl = document.getElementById('projectImageUrl').value;
  const content = document.getElementById('projectContent').value;
  
  try {
    // Upload image if new file selected
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile, 'project');
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }
    
    // Use FormData for file upload, otherwise JSON
    let res;
    if (imageFile) {
      const formData = new FormData();
      formData.append('id', id || '');
      formData.append('title', title);
      formData.append('slug', slug);
      formData.append('description', description);
      formData.append('content_html', content);
      if (imageFile) formData.append('image', imageFile);
      else if (imageUrl) formData.append('image_url', imageUrl);
      
      res = await adminFetch('/api/admin/projects', {
        method: 'POST',
        body: formData
      });
    } else {
      res = await adminFetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id || null, title, slug, description, image_url: imageUrl, content_html: content })
      });
    }
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Failed to save project' }));
      throw new Error(errorData.message || `HTTP ${res.status}`);
    }
    
    showToast('Project saved successfully! Homepage will update automatically.', 'success');
    closeModal('projectModal');
    loadAdminData();
    // Homepage will automatically show new project on next visit/refresh
  } catch (error) {
    console.error('Save project error:', error);
    showToast('Failed to save project', 'error');
  } finally {
    showLoading(false);
  }
}

async function deleteProject(id) {
  if (!confirm('Delete this project? It will be removed from the homepage.')) return;
  try {
    const res = await adminFetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Project deleted successfully! Homepage will update automatically.', 'success');
      loadAdminData();
      // Homepage will automatically show updated content on next visit/refresh
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
  document.getElementById('testimonialImageUrl').value = imageUrl || '';
  document.getElementById('testimonialImageFile').value = '';
  document.getElementById('testimonialContent').value = content;
  document.getElementById('testimonialModalTitle').textContent = id ? 'Edit Testimonial' : 'Add Testimonial';
  
  // Show preview if URL exists
  if (imageUrl) {
    document.getElementById('testimonialImagePreviewImg').src = imageUrl;
    document.getElementById('testimonialImagePreview').style.display = 'block';
  } else {
    document.getElementById('testimonialImagePreview').style.display = 'none';
  }
  
  openModal('testimonialModal');
}

function editTestimonial(id, name, imageUrl, content) {
  openTestimonialModal(id, unescape(name), unescape(imageUrl), unescape(content));
}

async function saveTestimonial(e) {
  e.preventDefault();
  showLoading(true);
  
  const id = document.getElementById('testimonialId').value;
  const name = document.getElementById('testimonialName').value;
  const imageFile = document.getElementById('testimonialImageFile').files[0];
  let imageUrl = document.getElementById('testimonialImageUrl').value;
  const content = document.getElementById('testimonialContent').value;
  
  try {
    // Upload image if new file selected
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile, 'testimonial');
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }
    
    const res = await adminFetch('/api/admin/testimonials', {
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
  } finally {
    showLoading(false);
  }
}

async function deleteTestimonial(id) {
  if (!confirm('Delete this testimonial?')) return;
  try {
    const res = await adminFetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
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
  document.getElementById('newsImageUrl').value = imageUrl || '';
  document.getElementById('newsImageFile').value = '';
  document.getElementById('newsContent').value = content;
  document.getElementById('newsModalTitle').textContent = id ? 'Edit Article' : 'Add Article';
  
  // Show preview if URL exists
  if (imageUrl) {
    document.getElementById('newsImagePreviewImg').src = imageUrl;
    document.getElementById('newsImagePreview').style.display = 'block';
  } else {
    document.getElementById('newsImagePreview').style.display = 'none';
  }
  
  openModal('newsModal');
}

function editNews(id, title, slug, summary, imageUrl, content) {
  openNewsModal(id, unescape(title), unescape(slug), unescape(summary), unescape(imageUrl), unescape(content));
}

async function saveNews(e) {
  e.preventDefault();
  showLoading(true);
  
  const id = document.getElementById('newsId').value;
  const title = document.getElementById('newsTitle').value;
  const slug = document.getElementById('newsSlug').value;
  const summary = document.getElementById('newsSummary').value;
  const imageFile = document.getElementById('newsImageFile').files[0];
  let imageUrl = document.getElementById('newsImageUrl').value;
  const content = document.getElementById('newsContent').value;
  
  try {
    // Upload image if new file selected
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile, 'news');
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }
    
    // Use FormData for file upload, otherwise JSON
    let res;
    if (imageFile) {
      const formData = new FormData();
      formData.append('id', id || '');
      formData.append('title', title);
      formData.append('slug', slug);
      formData.append('summary', summary);
      formData.append('content_html', content);
      if (imageFile) formData.append('image', imageFile);
      else if (imageUrl) formData.append('image_url', imageUrl);
      
      res = await adminFetch('/api/admin/news', {
        method: 'POST',
        body: formData
      });
    } else {
      res = await adminFetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id || null, title, slug, summary, image_url: imageUrl, content_html: content })
      });
    }
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Failed to save article' }));
      throw new Error(errorData.message || `HTTP ${res.status}`);
    }
    
    showToast('Article saved successfully! Homepage will update automatically.', 'success');
    closeModal('newsModal');
    loadAdminData();
    // Homepage will automatically show new article on next visit/refresh
  } catch (error) {
    console.error('Save article error:', error);
    showToast('Failed to save article', 'error');
  } finally {
    showLoading(false);
  }
}

async function deleteNews(id) {
  if (!confirm('Delete this article? It will be removed from the homepage.')) return;
  try {
    const res = await adminFetch(`/api/admin/news/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Article deleted successfully! Homepage will update automatically.', 'success');
      loadAdminData();
      // Homepage will automatically show updated content on next visit/refresh
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

// Initialize admin sidebar
function initAdminDashboard() {
  if (!checkAdminAuth()) return;
  
  // Render admin-specific sidebar
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = renderAdminSidebar();
  }
  
  // Setup modals
  setupModalClose();
  
  // Setup image previews
  setupImagePreviews();
  
  // Setup mobile menu
  setupMobileMenu();
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initAdminDashboard();
    loadAdminData();
  });
} else {
  initAdminDashboard();
  loadAdminData();
}

window.logoutAdmin = logoutAdmin;

