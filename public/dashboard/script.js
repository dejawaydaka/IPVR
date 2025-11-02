// ===== GLOBAL CONFIG =====
const API_BASE = '';
const profitRates = {
  "Starter Plan": 0.02,
  "Bronze Plan": 0.025,
  "Silver Plan": 0.03,
  "Gold Plan": 0.035,
  "Platinum Plan": 0.04,
  "Diamond Plan": 0.05,
  "Elite Plan": 0.05
};

let loadingTimeout = null;

// ===== AUTHENTICATION =====
function checkAuth() {
  const userRaw = localStorage.getItem('rs_user');
  if (!userRaw) {
    window.location.href = '../index.html';
    return null;
  }
  
  try {
    const user = JSON.parse(userRaw);
    // Check for both email and userEmail (for compatibility)
    if (!user || (!user.email && !user.userEmail)) {
      localStorage.removeItem('rs_user');
      window.location.href = '../index.html';
      return null;
    }
    // Ensure email property exists
    if (!user.email && user.userEmail) {
      user.email = user.userEmail;
    }
    return user;
  } catch (e) {
    localStorage.removeItem('rs_user');
    window.location.href = '../index.html';
    return null;
  }
}

function getCurrentUser() {
  return checkAuth();
}

function logout() {
  localStorage.removeItem('rs_user');
  window.location.href = '../index.html';
}

// ===== LOADING & UI HELPERS =====
function showLoading(show = true) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      loadingTimeout = null;
    }
    
    if (show) {
      overlay.classList.remove('hidden');
      // Safety timeout: hide loader after 3 seconds maximum
      loadingTimeout = setTimeout(() => {
        overlay.classList.add('hidden');
        loadingTimeout = null;
      }, 3000);
    } else {
      overlay.classList.add('hidden');
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
    }
  }
}

// Auto-hide loading overlay on page load (for pages that don't fetch data)
function autoHideLoading() {
  // Hide after page is fully loaded, max 2 seconds
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => showLoading(false), 2000);
    });
  } else {
    setTimeout(() => showLoading(false), 2000);
  }
  
  window.addEventListener('load', () => {
    showLoading(false);
  });
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showError(message) {
  const errorEl = document.getElementById('errorMessage');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
    setTimeout(() => {
      errorEl.classList.remove('show');
    }, 5000);
  }
  showToast(message, 'error');
}

function showSuccess(message) {
  const successEl = document.getElementById('successMessage');
  if (successEl) {
    successEl.textContent = message;
    successEl.classList.add('show');
    setTimeout(() => {
      successEl.classList.remove('show');
    }, 5000);
  }
  showToast(message, 'success');
}

function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function animateCounter(element, start, end, duration) {
  if (!element) return;
  
  const prefix = '$';
  element.textContent = prefix + end.toLocaleString(undefined, {
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2
  });
  
  if (duration <= 0) return;
  
  const startTime = performance.now();
  const actualStart = start || 0;
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = actualStart + (end - actualStart) * progress;
    
    element.textContent = prefix + current.toLocaleString(undefined, {
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2
    });
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      element.textContent = prefix + end.toLocaleString(undefined, {
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2
      });
    }
  };
  requestAnimationFrame(animate);
}

// ===== API CALLS =====
async function fetchUserData(email) {
  try {
    showLoading(true);
    console.log('[API] Fetching user data for:', email);
    const response = await fetch(`${API_BASE}/api/user/${encodeURIComponent(email)}`, {
      cache: 'no-store'
    });
    
    console.log('[API] Response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('User not found');
      }
      const errorText = await response.text();
      console.error('[API] Error response:', errorText);
      throw new Error('Failed to fetch user data');
    }
    
    const data = await response.json();
    console.log('[API] User data received:', data);
    showLoading(false);
    return data;
  } catch (error) {
    showLoading(false);
    console.error('[API] Error fetching user data:', error);
    throw error;
  }
}

async function makeInvestment(email, amount, plan) {
  try {
    showLoading(true);
    const response = await fetch(`${API_BASE}/api/invest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, amount: Number(amount), plan })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Investment failed');
    }
    
    const data = await response.json();
    showLoading(false);
    return data;
  } catch (error) {
    showLoading(false);
    console.error('Error making investment:', error);
    throw error;
  }
}

async function makeDeposit(email, amount, currency, transactionHash, proofImage) {
  try {
    showLoading(true);
    const formData = new FormData();
    formData.append('email', email);
    formData.append('amount', Number(amount));
    if (currency) formData.append('currency', currency);
    if (transactionHash) formData.append('transactionHash', transactionHash);
    if (proofImage) {
      formData.append('proof', proofImage);
    }
    
    const response = await fetch(`${API_BASE}/api/deposit`, {
      method: 'POST',
      body: formData
      // Don't set Content-Type header - browser sets it automatically for FormData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Deposit failed');
    }
    
    const data = await response.json();
    showLoading(false);
    return data;
  } catch (error) {
    showLoading(false);
    console.error('Error making deposit:', error);
    throw error;
  }
}

async function makeWithdrawal(email, amount, cryptoType, walletAddress) {
  try {
    showLoading(true);
    const response = await fetch(`${API_BASE}/api/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        amount: Number(amount),
        cryptoType,
        walletAddress
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Withdrawal failed');
    }
    
    const data = await response.json();
    showLoading(false);
    return data;
  } catch (error) {
    showLoading(false);
    console.error('Error making withdrawal:', error);
    throw error;
  }
}

async function updateUserSettings(email, updates) {
  try {
    showLoading(true);
    const response = await fetch(`${API_BASE}/api/user/${encodeURIComponent(email)}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Update failed');
    }
    
    const data = await response.json();
    showLoading(false);
    return data;
  } catch (error) {
    showLoading(false);
    console.error('Error updating user:', error);
    throw error;
  }
}

// ===== MODAL HELPERS =====
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

function setupModalClose() {
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) {
        closeModal(modal.id);
      }
    });
  });
  
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });
}

// ===== SIDEBAR HELPERS =====
function renderSidebar(currentPage = '') {
  const user = getCurrentUser();
  if (!user) return '';
  
  // Get current page name from URL
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  
  const pages = [
    { path: 'index.html', name: 'Dashboard', icon: 'fas fa-chart-line' },
    { path: 'investments.html', name: 'Investments', icon: 'fas fa-coins' },
    { path: 'deposit.html', name: 'Deposit', icon: 'fas fa-plus-circle' },
    { path: 'withdraw.html', name: 'Withdraw', icon: 'fas fa-money-bill-wave' },
    { path: 'settings.html', name: 'Settings', icon: 'fas fa-cog' }
  ];
  
  currentPage = currentPath;
  
  const displayName = user.name || user.email?.split('@')[0] || 'User';
  
  return `
    <aside class="sidebar">
      <h2>RealSphere</h2>
      <div class="user-display">
        <img src="${user.profileImage || 'https://i.pravatar.cc/50'}" alt="User" />
        <span>${sanitizeHTML(displayName)}</span>
      </div>
      <ul>
        ${pages.map(page => `
          <li>
            <a href="${page.path}" class="${currentPage === page.path ? 'active' : ''}">
              <i class="${page.icon}"></i>
              <span>${page.name}</span>
            </a>
          </li>
        `).join('')}
        <li>
          <a href="#" onclick="logout(); return false;">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </a>
        </li>
      </ul>
    </aside>
  `;
}

// ===== INITIALIZATION =====
function initDashboard() {
  const user = checkAuth();
  if (!user) return;
  
  // Update sidebar
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = renderSidebar();
  }
  
  // Setup modals
  setupModalClose();
  
  // Apply theme
  const theme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', theme);
}

// Mobile menu toggle
function setupMobileMenu() {
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (mobileToggle && sidebar) {
    const toggleMenu = () => {
      const isOpen = sidebar.classList.contains('open');
      sidebar.classList.toggle('open');
      mobileToggle.classList.toggle('active');
      document.body.classList.toggle('sidebar-open');
      
      const icon = mobileToggle.querySelector('i');
      if (!isOpen) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
      } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    };
    
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });
    
    // Close menu when clicking on a link
    document.querySelectorAll('.sidebar a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
          mobileToggle.classList.remove('active');
          document.body.classList.remove('sidebar-open');
          const icon = mobileToggle.querySelector('i');
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      });
    });
    
    // Close menu when clicking on overlay
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
          toggleMenu();
        }
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        toggleMenu();
      }
    });
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupMobileMenu();
  });
} else {
  initDashboard();
  setupMobileMenu();
}

