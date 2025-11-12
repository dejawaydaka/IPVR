// RealSphere - Frontend JavaScript
const REFERRAL_STORAGE_KEY = 'rs_referral_code';
const TRANSLATOR_SCRIPT_ID = 'googleTranslateScript';

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function storeReferralFromQuery() {
    const referralParam = getQueryParam('ref');
    if (referralParam) {
        const normalized = referralParam.toUpperCase();
        localStorage.setItem(REFERRAL_STORAGE_KEY, normalized);
        return normalized;
    }
    return null;
}

function setupTranslator() {
    const desktopAnchor = document.getElementById('translatorAnchor');
    const mobileAnchor = document.getElementById('translatorMobileAnchor');
    const footerAnchor = document.getElementById('translatorFooterAnchor');

    if (!desktopAnchor && !mobileAnchor && !footerAnchor) {
        return;
    }

    let translatorWrapper = document.getElementById('google_translate_element');

    if (!translatorWrapper) {
        translatorWrapper = document.createElement('div');
        translatorWrapper.id = 'google_translate_element';
        translatorWrapper.className = 'translate-widget';
    }

    const positionTranslator = () => {
        const prefersMobile = window.matchMedia('(max-width: 992px)').matches;
        let target;

        if (prefersMobile) {
            target = footerAnchor || mobileAnchor || desktopAnchor;
        } else {
            target = desktopAnchor || mobileAnchor || footerAnchor;
        }

        if (target && translatorWrapper.parentElement !== target) {
            target.appendChild(translatorWrapper);
        }
    };

    positionTranslator();

    window.googleTranslateElementInit = function () {
        new google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,es,fr,de,it,pt,zh-CN',
            autoDisplay: false
        }, 'google_translate_element');
        positionTranslator();
    };

    if (!document.getElementById(TRANSLATOR_SCRIPT_ID)) {
        const script = document.createElement('script');
        script.id = TRANSLATOR_SCRIPT_ID;
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.body.appendChild(script);
    } else if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        window.googleTranslateElementInit();
    }

    window.addEventListener('resize', positionTranslator);
}

class RealSphere {
    constructor() {
        this.init();
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
            mobileToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                nav.classList.toggle('open');
                console.log('Menu toggle clicked, nav open:', nav.classList.contains('open'));
            });
            // Close on link click (mobile)
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    nav.classList.remove('open');
                });
            });
            // Close on outside click
            document.addEventListener('click', (e) => {
                if (nav.classList.contains('open') && 
                    !nav.contains(e.target) && 
                    !mobileToggle.contains(e.target)) {
                    nav.classList.remove('open');
                }
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

        // Modal switching - Login to Register
        const showRegisterFromLogin = document.getElementById('showRegisterFromLogin');
        if (showRegisterFromLogin) {
            showRegisterFromLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('loginModal');
                setTimeout(() => this.showModal('registerModal'), 300);
            });
        }

        // Modal switching - Register to Login
        const showLoginFromRegister = document.getElementById('showLoginFromRegister');
        if (showLoginFromRegister) {
            showLoginFromRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('registerModal');
                setTimeout(() => this.showModal('loginModal'), 300);
            });
        }

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
        const viewPricingBtn = document.getElementById('viewPricingBtn');
        const learnMoreBtn = document.getElementById('learnMoreBtn');

        if (viewPricingBtn) {
            viewPricingBtn.addEventListener('click', () => {
                window.location.href = 'pricing.html';
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
            if (modalId === 'registerModal') {
                const referralField = document.getElementById('registerReferralId');
                const storedReferral = localStorage.getItem(REFERRAL_STORAGE_KEY);
                if (referralField && storedReferral && !referralField.value) {
                    referralField.value = storedReferral;
                }
            }
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
                window.location.href = 'dashboard/pricing.html';
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
            password: formData.get('password') || e.target.querySelector('input[type="password"]').value,
            phone: formData.get('phone') || document.getElementById('registerPhone')?.value || '',
            country: formData.get('country') || document.getElementById('registerCountry')?.value || '',
            referralId: (formData.get('referralId') || document.getElementById('registerReferralId')?.value || '').trim()
        };

        if (registerData.referralId) {
            registerData.referralId = registerData.referralId.toUpperCase();
            localStorage.setItem(REFERRAL_STORAGE_KEY, registerData.referralId);
        }

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData)
            });

            if (response.ok) {
                this.showNotification('Registration successful! Please verify your email to activate your account.', 'success');
                this.hideModal('registerModal');
                e.target.reset();
                this.updateAuthUI();
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
        const form = e.target;
        const formData = new FormData(form);
        const nameInput = form.querySelector('input[type="text"]');
        const emailInput = form.querySelector('input[type="email"]');
        const messageInput = form.querySelector('textarea');
        const subjectInput = form.querySelector('input[name="subject"]');
        
        const contactData = {
            name: formData.get('name') || nameInput?.value || '',
            email: formData.get('email') || emailInput?.value || '',
            subject: formData.get('subject') || subjectInput?.value || 'Contact Form Inquiry',
            message: formData.get('message') || messageInput?.value || ''
        };

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactData),
                cache: 'no-store'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showNotification(data.message || 'Thanks — we\'ll get back to you within 24 hours.', 'success');
                form.reset();
            } else {
                const errorMsg = data.message || data.error || 'Failed to send message. Please try again.';
                this.showNotification(errorMsg, 'error');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            this.showNotification('Network error. Please check your connection and try again.', 'error');
        } finally {
            // Restore button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText || 'Send Message';
            }
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

// Service modal data
const serviceData = {
    'property-acquisition': {
        title: 'Property Acquisition',
        icon: 'fas fa-building',
        content: `
            <div style="color: #000000; line-height: 1.8;">
                <h4 style="color: #4ef5a3; margin-bottom: 1rem; font-size: 1.3rem;">Strategic Property Identification & Acquisition</h4>
                <p>Our Property Acquisition service is designed to help investors identify, evaluate, and acquire high-value real estate assets with precision and confidence. We combine market intelligence, financial analysis, and strategic negotiation to secure the best deals.</p>
                
                <h5 style="color: #4ef5a3; margin-top: 2rem; margin-bottom: 1rem;">Key Features:</h5>
                <ul style="list-style: none; padding-left: 0;">
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Market Research & Analysis:</strong> Comprehensive evaluation of local market trends, property values, and growth potential</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Due Diligence:</strong> Thorough property inspections, title verification, zoning compliance, and environmental assessments</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Financial Analysis:</strong> ROI calculations, cash flow projections, and investment feasibility studies</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Negotiation:</strong> Expert negotiation to secure favorable terms and pricing</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Transaction Management:</strong> End-to-end handling of purchase agreements, financing, and closing processes</li>
                </ul>
                
                <h5 style="color: #4ef5a3; margin-top: 2rem; margin-bottom: 1rem;">Why Choose Our Service?</h5>
                <p>With years of experience in the real estate market, our team has successfully acquired over $500M in properties across residential, commercial, and mixed-use developments. We leverage advanced analytics and industry connections to identify off-market opportunities and emerging markets with high growth potential.</p>
            </div>
        `
    },
    'portfolio-management': {
        title: 'Portfolio Management',
        icon: 'fas fa-chart-line',
        content: `
            <div style="color: #000000; line-height: 1.8;">
                <h4 style="color: #4ef5a3; margin-bottom: 1rem; font-size: 1.3rem;">Professional Portfolio Optimization</h4>
                <p>Our Portfolio Management service provides comprehensive oversight and optimization of your real estate investments. We use AI-driven insights and data analytics to maximize returns while minimizing risk across your entire property portfolio.</p>
                
                <h5 style="color: #4ef5a3; margin-top: 2rem; margin-bottom: 1rem;">Key Features:</h5>
                <ul style="list-style: none; padding-left: 0;">
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Performance Monitoring:</strong> Real-time tracking of property values, rental income, and overall portfolio performance</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Automated Rebalancing:</strong> AI-powered recommendations for portfolio diversification and risk management</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Strategic Planning:</strong> Long-term investment strategies aligned with your financial goals</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Market Intelligence:</strong> Continuous monitoring of market trends and opportunities</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Reporting:</strong> Comprehensive monthly and annual reports with detailed analytics</li>
                </ul>
                
                <h5 style="color: #4ef5a3; margin-top: 2rem; margin-bottom: 1rem;">Benefits:</h5>
                <p>Our portfolio management approach has helped clients achieve average returns of 15-25% annually while maintaining balanced risk profiles. We provide transparent reporting and proactive recommendations to ensure your investments continue to grow and perform optimally.</p>
            </div>
        `
    },
    'investment-advisory': {
        title: 'Investment Advisory',
        icon: 'fas fa-handshake',
        content: `
            <div style="color: #000000; line-height: 1.8;">
                <h4 style="color: #4ef5a3; margin-bottom: 1rem; font-size: 1.3rem;">Expert Investment Guidance</h4>
                <p>Our Investment Advisory service offers personalized guidance tailored to your financial goals, risk tolerance, and investment timeline. We provide expert recommendations backed by comprehensive market research and financial analysis.</p>
                
                <h5 style="color: #4ef5a3; margin-top: 2rem; margin-bottom: 1rem;">Services Include:</h5>
                <ul style="list-style: none; padding-left: 0;">
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Investment Strategy Development:</strong> Customized investment plans based on your objectives</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Market Analysis:</strong> In-depth analysis of property markets, trends, and opportunities</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Risk Assessment:</strong> Evaluation of investment risks and mitigation strategies</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Financial Planning:</strong> Integration of real estate investments into your overall financial plan</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Ongoing Consultation:</strong> Regular reviews and strategic adjustments</li>
                </ul>
                
                <h5 style="color: #4ef5a3; margin-top: 2rem; margin-bottom: 1rem;">Why Work With Us?</h5>
                <p>Our advisory team consists of certified financial planners and real estate experts with decades of combined experience. We've guided thousands of investors through successful real estate investments, from first-time buyers to sophisticated portfolio builders.</p>
            </div>
        `
    },
    'risk-management': {
        title: 'Risk Management',
        icon: 'fas fa-shield-alt',
        content: `
            <div style="color: #000000; line-height: 1.8;">
                <h4 style="color: #4ef5a3; margin-bottom: 1rem; font-size: 1.3rem;">Comprehensive Risk Protection</h4>
                <p>Our Risk Management service provides comprehensive assessment and mitigation strategies to protect your real estate investments from various risks including market fluctuations, property damage, legal issues, and economic downturns.</p>
                
                <h5 style="color: #4ef5a3; margin-top: 2rem; margin-bottom: 1rem;">Risk Assessment Areas:</h5>
                <ul style="list-style: none; padding-left: 0;">
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Market Risk:</strong> Analysis of market volatility and property value fluctuations</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Property Risk:</strong> Physical damage, maintenance issues, and property condition assessments</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Legal & Compliance:</strong> Zoning issues, title problems, and regulatory compliance</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Financial Risk:</strong> Cash flow analysis, debt management, and liquidity planning</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Tenant Risk:</strong> Credit checks, lease enforcement, and vacancy management</li>
                </ul>
                
                <h5 style="color: #4ef5a3; margin-top: 2rem; margin-bottom: 1rem;">Mitigation Strategies:</h5>
                <p>We develop comprehensive risk mitigation plans including insurance recommendations, diversification strategies, emergency fund planning, and contingency protocols. Our proactive approach helps minimize potential losses and ensures your investments remain protected.</p>
            </div>
        `
    },
    'property-development': {
        title: 'Property Development',
        icon: 'fas fa-cogs',
        content: `
            <div style="color: #000000; line-height: 1.8;">
                <h4 style="color: #4ef5a3; margin-bottom: 1rem; font-size: 1.3rem;">End-to-End Development Services</h4>
                <p>Our Property Development service manages the complete lifecycle of real estate development projects, from initial planning and design through construction, marketing, and final delivery. We handle every aspect to ensure successful project completion.</p>
                
                <h5 style="color: #4ef5a3; margin-top: 2rem; margin-bottom: 1rem;">Development Phases:</h5>
                <ul style="list-style: none; padding-left: 0;">
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Planning & Design:</strong> Site analysis, feasibility studies, architectural design, and permit acquisition</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Pre-Construction:</strong> Financing, contractor selection, material procurement, and project scheduling</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Construction Management:</strong> On-site supervision, quality control, timeline management, and budget oversight</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Marketing & Sales:</strong> Property marketing, sales strategy, and buyer acquisition</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Project Delivery:</strong> Final inspections, handover, and post-completion support</li>
                </ul>
                
                <h5 style="color: #4ef5a3; margin-top: 2rem; margin-bottom: 1rem;">Our Track Record:</h5>
                <p>We've successfully completed over 50 development projects worth more than $200M, including residential communities, commercial buildings, and mixed-use developments. Our expertise spans various property types and market segments.</p>
            </div>
        `
    },
    'tenant-management': {
        title: 'Tenant Management',
        icon: 'fas fa-users',
        content: `
            <div style="color: #000000; line-height: 1.8;">
                <h4 style="color: #4ef5a3; margin-bottom: 1rem; font-size: 1.3rem;">Professional Tenant Services</h4>
                <p>Our Tenant Management service handles all aspects of tenant relations, from initial screening and lease negotiation to ongoing maintenance and lease renewal. We ensure your properties remain occupied by quality tenants while maintaining positive landlord-tenant relationships.</p>
                
                <h5 style="color: #4ef5a3; margin-top: 2rem; margin-bottom: 1rem;">Key Services:</h5>
                <ul style="list-style: none; padding-left: 0;">
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Tenant Screening:</strong> Comprehensive background checks, credit verification, employment verification, and rental history</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Lease Management:</strong> Lease preparation, negotiation, execution, and renewal processes</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Rent Collection:</strong> Automated rent collection, payment tracking, and late fee management</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Maintenance Coordination:</strong> 24/7 maintenance request handling, vendor management, and property upkeep</li>
                    <li style="margin-bottom: 0.8rem;"><i class="fas fa-check-circle" style="color: #4ef5a3; margin-right: 0.5rem;"></i> <strong>Legal Compliance:</strong> Fair housing compliance, eviction procedures, and legal documentation</li>
                </ul>
                
                <h5 style="color: #4ef5a3; margin-top: 2rem; margin-bottom: 1rem;">Benefits:</h5>
                <p>Our tenant management services have helped property owners maintain 95%+ occupancy rates with average rent collection rates above 98%. We handle all tenant-related issues professionally and efficiently, allowing you to focus on growing your portfolio.</p>
            </div>
        `
    }
};

// Service modal function
function openServiceModal(serviceId) {
    const service = serviceData[serviceId];
    if (!service) return;
    
    const modal = document.getElementById('serviceModal');
    const title = document.getElementById('serviceModalTitle');
    const body = document.getElementById('serviceModalBody');
    
    if (modal && title && body) {
        title.textContent = service.title;
        body.innerHTML = service.content;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close modal on backdrop click
document.addEventListener('DOMContentLoaded', () => {
    const serviceModal = document.getElementById('serviceModal');
    if (serviceModal) {
        serviceModal.addEventListener('click', (e) => {
            if (e.target === serviceModal) {
                serviceModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
        
        const closeBtn = serviceModal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                serviceModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        }
    }
});

// Make function globally available
window.openServiceModal = openServiceModal;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const referralFromUrl = storeReferralFromQuery();
    setupTranslator();
    window.realSphere = new RealSphere();
    // Bind plan buttons after DOM content is ready
    window.realSphere.bindPlanButtons();
    if (referralFromUrl && window.realSphere) {
        setTimeout(() => {
            window.realSphere.showModal('registerModal');
        }, 200);
    }
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
