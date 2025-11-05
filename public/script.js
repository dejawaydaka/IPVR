// RealSphere - Frontend JavaScript
class RealSphere {
    constructor() {
        this.init();
        this.loadInvestmentPlans();
        this.setupEventListeners();
        this.setupScrollEffects();
    }

    init() {
        // Initialize the application
        console.log('RealSphere Platform Initialized');
        this.setupSmoothScrolling();
        this.setupNavigation();
        this.updateAuthUI();
    }

    setupEventListeners() {
        // Navigation links (only intercept anchors that start with #)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href') || '';
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    this.scrollToSection(targetId);
                    this.setActiveNavLink(link);
                }
            });
        });

        // Mobile nav toggle
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.nav');
        if (mobileToggle && nav) {
            mobileToggle.addEventListener('click', () => {
                nav.classList.toggle('open');
            });
            // Close on link click (mobile)
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    nav.classList.remove('open');
                });
            });
        }

        // Mobile menu login/register buttons
        const loginBtnMobile = document.getElementById('loginBtnMobile');
        const registerBtnMobile = document.getElementById('registerBtnMobile');
        
        if (loginBtnMobile) {
            loginBtnMobile.addEventListener('click', () => {
                const user = this.getCurrentUser();
                if (user) {
                    window.location.href = 'dashboard/index.html';
                } else {
                    this.showModal('loginModal');
                    nav.classList.remove('open'); // Close mobile menu
                }
            });
        }

        if (registerBtnMobile) {
            registerBtnMobile.addEventListener('click', () => {
                const user = this.getCurrentUser();
                if (user) {
                    this.logout();
                } else {
                    this.showModal('registerModal');
                    nav.classList.remove('open'); // Close mobile menu
                }
            });
        }

        // Modal controls
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                const user = this.getCurrentUser();
                if (user) {
                    window.location.href = 'dashboard/index.html';
                } else {
                    this.showModal('loginModal');
                }
            });
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                const user = this.getCurrentUser();
                if (user) {
                    this.logout();
                } else {
                    this.showModal('registerModal');
                }
            });
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal.id);
            });
        });

        // Close modal on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Form submissions
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const contactForm = document.getElementById('contactForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContact(e));
        }

        // Hero action buttons
        const explorePlansBtn = document.getElementById('explorePlansBtn');
        const learnMoreBtn = document.getElementById('learnMoreBtn');

        if (explorePlansBtn) {
            explorePlansBtn.addEventListener('click', () => {
                window.location.href = 'services.html';
            });
        }

        if (learnMoreBtn) {
            learnMoreBtn.addEventListener('click', () => {
                window.location.href = 'about.html';
            });
        }
    }

    setupSmoothScrolling() {
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href').substring(1);
                this.scrollToSection(targetId);
            });
        });
    }

    setupNavigation() {
        // Update active nav link on scroll
        window.addEventListener('scroll', () => {
            const sections = document.querySelectorAll('section[id]');
            const navLinks = document.querySelectorAll('.nav-link');
            
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                const sectionHeight = section.clientHeight;
                if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }

    setupScrollEffects() {
        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.plan-card, .feature-card, .about-content, .contact-content').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = section.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    setActiveNavLink(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    async loadInvestmentPlans() {
        try {
            const response = await fetch('/plans');
            const data = await response.json();
            this.renderInvestmentPlans(data.plans);
        } catch (error) {
            console.error('Error loading investment plans:', error);
            this.renderInvestmentPlans([
                { id: 1, name: 'Basic Plan', dailyReturn: '2%', minInvestment: '$50' },
                { id: 2, name: 'Premium Plan', dailyReturn: '3%', minInvestment: '$500' }
            ]);
        }
    }

    renderInvestmentPlans(plans) {
        const plansGrid = document.getElementById('plansGrid');
        if (!plansGrid) return;

        plansGrid.innerHTML = plans.map(plan => `
            <div class="plan-card" data-plan-id="${plan.id}">
                <h3>${plan.name}</h3>
                <div class="plan-details">
                    <div class="plan-detail">
                        <span class="plan-detail-label">Daily Return</span>
                        <span class="plan-detail-value">${plan.dailyReturn}</span>
                    </div>
                    <div class="plan-detail">
                        <span class="plan-detail-label">Minimum Investment</span>
                        <span class="plan-detail-value">${plan.minInvestment}</span>
                    </div>
                </div>
                <div class="plan-price">${plan.minInvestment}</div>
                <ul class="plan-features">
                    <li>Guaranteed daily returns</li>
                    <li>24/7 portfolio monitoring</li>
                    <li>Risk management included</li>
                    <li>Mobile app access</li>
                </ul>
                <button class="btn btn-primary" onclick="realSphere.selectPlan(${plan.id})">
                    <i class="fas fa-arrow-right"></i>
                    Choose Plan
                </button>
            </div>
        `).join('');
    }

    selectPlan(planId) {
        // Show registration modal for plan selection
        this.showModal('registerModal');
        console.log(`Selected plan: ${planId}`);
    }

    bindPlanButtons() {
        const buttons = document.querySelectorAll('.plan-invest-btn');
        if (!buttons.length) return;
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const user = this.getCurrentUser();
                if (!user) {
                    this.showNotification('Please login first.', 'error');
                    this.showModal('loginModal');
                    return;
                }
                // Navigate to dashboard investments section
                window.location.href = 'dashboard/investments.html';
            });
        });

        const investForm = document.getElementById('investForm');
        if (investForm) {
            investForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const user = this.getCurrentUser();
                if (!user) {
                    this.showNotification('Please login.', 'error');
                    return;
                }
                const amount = Number(document.getElementById('investAmount').value || '0');
                const plan = investForm.getAttribute('data-plan');
                if (!plan || !amount || amount <= 0) {
                    this.showNotification('Enter a valid amount.', 'error');
                    return;
                }
                try {
                    const resp = await fetch('/invest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user.email, plan, amount })
                    });
                    if (!resp.ok) {
                        let msg = 'Investment failed.';
                        try {
                            const err = await resp.json();
                            msg = err.message || msg;
                        } catch (_) {
                            const text = await resp.text();
                            msg = text || msg;
                        }
                        this.showNotification(msg, 'error');
                        return;
                    }
                    const data = await resp.json();
                    this.showNotification('Investment recorded successfully!', 'success');
                    this.hideModal('investModal');
                    console.log('Investment:', data);
                } catch (err) {
                    console.error(err);
                    this.showNotification('Investment failed.', 'error');
                }
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const loginData = {
            email: formData.get('email') || e.target.querySelector('input[type="email"]').value,
            password: formData.get('password') || e.target.querySelector('input[type="password"]').value
        };

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            if (response.ok) {
                const data = await response.json();
                // Persist user (basic demo; do NOT store raw passwords in prod)
                if (data && data.user) {
                    localStorage.setItem('rs_user', JSON.stringify({ email: data.user.email, name: data.user.name || '' , profileImage: data.user.profileImage || '' }));
                }
                this.showNotification('Login successful!', 'success');
                this.hideModal('loginModal');
                this.updateAuthUI();
                // Redirect to dashboard for seamless UX
                try { window.location.href = 'dashboard/index.html'; } catch(_) {}
            } else {
                let errorMsg = 'Login failed. Please try again.';
                try {
                    const errData = await response.json();
                    if (errData && errData.message) errorMsg = errData.message;
                } catch(_) {}
                this.showNotification(errorMsg, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(`Login error: ${error.message || 'Network error'}`, 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const registerData = {
            name: formData.get('name') || document.getElementById('registerName')?.value || e.target.querySelector('input[type="text"]').value,
            email: formData.get('email') || e.target.querySelector('input[type="email"]').value,
            password: formData.get('password') || e.target.querySelector('input[type="password"]').value
        };

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData)
            });

            if (response.ok) {
                this.showNotification('Registration successful!', 'success');
                this.hideModal('registerModal');
                // Save minimal user info and update UI
                localStorage.setItem('rs_user', JSON.stringify({ email: registerData.email, name: registerData.name || registerData.fullName || '' }));
                // Optional avatar upload if provided
                const fileInput = document.getElementById('registerAvatar');
                const file = fileInput && fileInput.files && fileInput.files[0];
                if (file) {
                    await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = async () => {
                            try {
                                const resp = await fetch('/profile/upload', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ email: registerData.email, image: reader.result })
                                });
                                if (resp.ok) {
                                    const data = await resp.json();
                                    // Update local storage with uploaded path for faster first paint on dashboard
                                    const raw = localStorage.getItem('rs_user');
                                    if (raw) {
                                        const obj = JSON.parse(raw);
                                        obj.profileImage = data.profileImage || obj.profileImage;
                                        localStorage.setItem('rs_user', JSON.stringify(obj));
                                    }
                                }
                            } catch(_) {}
                            resolve();
                        };
                        reader.readAsDataURL(file);
                    });
                }
                this.updateAuthUI();
                // Optional redirect to dashboard after registration
                try { window.location.href = 'dashboard/index.html'; } catch(_) {}
            } else {
                let errorMsg = 'Registration failed. Please try again.';
                try {
                    const errData = await response.json();
                    if (errData && errData.message) errorMsg = errData.message;
                } catch(_) {}
                this.showNotification(errorMsg, 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification(`Registration error: ${error.message || 'Network error'}`, 'error');
        }
    }

    // Auth helpers
    getCurrentUser() {
        try {
            const raw = localStorage.getItem('rs_user');
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    }

    logout() {
        localStorage.removeItem('rs_user');
        this.updateAuthUI();
        this.showNotification('Logged out', 'success');
    }

    updateAuthUI() {
        const user = this.getCurrentUser();
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        if (!loginBtn || !registerBtn) return;

        if (user) {
            // Authenticated: show Dashboard/Logout
            loginBtn.textContent = 'Dashboard';
            registerBtn.textContent = 'Logout';
        } else {
            // Guest: show Login/Get Started
            loginBtn.textContent = 'Login';
            registerBtn.textContent = 'Get Started';
        }
    }

    async handleContact(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const contactData = {
            name: formData.get('name') || e.target.querySelector('input[type="text"]').value,
            email: formData.get('email') || e.target.querySelector('input[type="email"]').value,
            message: formData.get('message') || e.target.querySelector('textarea').value
        };

        try {
            // Simulate contact form submission
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.showNotification('Message sent successfully!', 'success');
            e.target.reset();
        } catch (error) {
            console.error('Contact form error:', error);
            this.showNotification('Failed to send message. Please try again.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#00c851' : type === 'error' ? '#ff4444' : '#0066ff'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 3000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatPercentage(value) {
        return `${value}%`;
    }

    // Animation helpers
    animateCounter(element, start, end, duration) {
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = start + (end - start) * progress;
            element.textContent = this.formatCurrency(Math.floor(current));
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.realSphere = new RealSphere();
    // Bind plan buttons after DOM content is ready
    window.realSphere.bindPlanButtons();
});

// Add some additional utility functions
window.addEventListener('load', () => {
    // Animate hero stats on load
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const text = stat.textContent;
        if (text.includes('$')) {
            const value = parseInt(text.replace(/[$,]/g, ''));
            if (value) {
                stat.textContent = '$0';
                setTimeout(() => {
                    window.realSphere.animateCounter(stat, 0, value, 2000);
                }, 500);
            }
        }
    });
});

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Close any open modals
        document.querySelectorAll('.modal.active').forEach(modal => {
            window.realSphere.hideModal(modal.id);
        });
    }
});

// Loading states removed for non-dashboard pages - only dashboard pages should show loaders
