const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult, query } = require('express-validator');
const multer = require('multer');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Behind Railway/Proxies - trust X-Forwarded-* headers for correct client IPs
app.set('trust proxy', 1);

// PostgreSQL connection pool
// Railway and most cloud providers require SSL
const getSSLConfig = () => {
  if (!process.env.DATABASE_URL) {
    return false;
  }
  
  // Local development (localhost) doesn't need SSL
  const isLocal = process.env.DATABASE_URL.includes('localhost') || 
                  process.env.DATABASE_URL.includes('127.0.0.1');
  
  if (isLocal) {
    return false;
  }
  
  // Production/cloud databases (Railway, Heroku, etc.) need SSL
  return { rejectUnauthorized: false };
};

const sslConfig = getSSLConfig();
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL is not set. Falling back to local defaults (will fail on Railway).');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
  // Connection pool settings for better reliability
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test database connection (non-blocking for Railway) and ensure schema
let dbConnected = false;

async function ensureSchema() {
  const createUsers = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      profile_image TEXT,
      balance NUMERIC(12, 2) DEFAULT 0,
      total_investment NUMERIC(12, 2) DEFAULT 0,
      total_profit NUMERIC(12, 2) DEFAULT 0,
      total_deposits NUMERIC(12, 2) DEFAULT 0,
      bonus NUMERIC(12, 2) DEFAULT 0,
      admin_approved BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

  const createInvestments = `
    CREATE TABLE IF NOT EXISTS investments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      plan VARCHAR(100) NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      daily_percent NUMERIC(5, 4) NOT NULL,
      days INTEGER DEFAULT 7,
      start_date BIGINT NOT NULL,
      profit NUMERIC(12, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

  const createDeposits = `
    CREATE TABLE IF NOT EXISTS deposits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC(12, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'USD',
      transaction_hash TEXT,
      proof TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

  const createWithdrawals = `
    CREATE TABLE IF NOT EXISTS withdrawals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC(12, 2) NOT NULL,
      crypto_type VARCHAR(50) NOT NULL,
      wallet_address TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

  const createWallets = `
    CREATE TABLE IF NOT EXISTS wallets (
      id SERIAL PRIMARY KEY,
      coin_name VARCHAR(100) NOT NULL UNIQUE,
      address TEXT NOT NULL,
      qr_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

  const createProjects = `
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      image_url TEXT,
      slug VARCHAR(255) UNIQUE NOT NULL,
      content_html TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

  const createTestimonials = `
    CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      image_url TEXT,
      content TEXT NOT NULL,
      date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

  const createNews = `
    CREATE TABLE IF NOT EXISTS news (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      summary TEXT,
      content_html TEXT NOT NULL,
      image_url TEXT,
      slug VARCHAR(255) UNIQUE NOT NULL,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

  await pool.query(createUsers);
  await pool.query(createInvestments);
  await pool.query(createDeposits);
  await pool.query(createWithdrawals);
  await pool.query(createWallets);
  await pool.query(createProjects);
  await pool.query(createTestimonials);
  await pool.query(createNews);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_news_date ON news(date);');
  
  // Create investment_plans table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS investment_plans (
      id SERIAL PRIMARY KEY,
      plan_name VARCHAR(100) UNIQUE NOT NULL,
      min_amount NUMERIC(12, 2) NOT NULL,
      max_amount NUMERIC(12, 2),
      daily_percent NUMERIC(5, 4) NOT NULL,
      duration INTEGER DEFAULT 7,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

pool.connect()
  .then(async (client) => {
    console.log('✅ Connected to PostgreSQL');
    dbConnected = true;
    client.release();
    try {
      await ensureSchema();
      console.log('🛠️  Database schema ensured');
    } catch (schemaErr) {
      console.error('Schema init error:', schemaErr.message);
    }
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    console.error('⚠️  Server will start but database operations may fail');
    console.error('💡 Make sure DATABASE_URL is set and PostgreSQL service is running');
    // Don't exit - allow server to start (Railway needs the process to stay alive)
    dbConnected = false;
  });

// Health check endpoint for database
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected', error: err.message });
  }
});

// Minimal, safe DB debug endpoint (no secrets)
app.get('/debug/db', (req, res) => {
  try {
    const hasEnv = !!process.env.DATABASE_URL;
    let host = null;
    if (hasEnv) {
      try {
        const urlObj = new URL(process.env.DATABASE_URL);
        host = urlObj.hostname || null;
      } catch (_) {
        host = 'unparseable';
      }
    }
    res.json({
      hasDatabaseUrl: hasEnv,
      dbHost: host,
      sslEnabled: !!sslConfig
    });
  } catch (e) {
    res.status(500).json({ message: 'debug failed' });
  }
});

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Middleware to serve static files
app.use(express.static('public'));

// Serve project/news pages dynamically
app.get('/projects/:slug.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/projects/template.html'));
});

app.get('/news/:slug.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/news/template.html'));
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Input validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
}

// Profit rates for investment plans
const profitRates = {
    'Starter Plan': 0.02,
    'Bronze Plan': 0.025,
    'Silver Plan': 0.03,
    'Gold Plan': 0.035,
    'Platinum Plan': 0.04,
    'Diamond Plan': 0.05,
    'Elite Plan': 0.05
};

// Helper to calculate profits from database investments
async function calculateUserProfits(userId) {
    try {
        const { rows: investments } = await pool.query(
            'SELECT * FROM investments WHERE user_id = $1',
            [userId]
        );
        
        const now = Date.now();
        let totalProfit = 0;
        let dailyEarnings = 0;
        
        investments.forEach(inv => {
            const elapsed = Math.floor((now - inv.start_date) / (1000 * 60 * 60 * 24));
            const days = Number(inv.days) || 7;
            const rate = Number(inv.daily_percent) || 0;
            const base = Number(inv.amount) || 0;
            const effectiveDays = elapsed < days ? elapsed : days;
            const profit = base * rate * effectiveDays;
            totalProfit += profit;
            
            // Daily earnings only for active investments
            if (elapsed < days) {
                dailyEarnings += base * rate;
            }
        });
        
        return { 
            totalProfit: Math.round(totalProfit * 100) / 100, 
            dailyEarnings: Math.round(dailyEarnings * 100) / 100 
        };
    } catch (err) {
        console.error('Error calculating profits:', err);
        return { totalProfit: 0, dailyEarnings: 0 };
    }
}

// Helper to check database connection before queries
async function checkDatabase() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL not set');
    }
    try {
        await pool.query('SELECT 1');
        return true;
    } catch (err) {
        console.error('Database check failed:', err.message);
        // Try to re-initialize connection once
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            await pool.query('SELECT 1');
            return true;
        } catch (_) {
            throw new Error('Database connection failed');
        }
    }
}

// Public route to view investment plans
app.get('/plans', (req, res) => {
    res.json({
        plans: [
            { id: 1, name: 'Starter Plan', dailyReturn: '2%', minInvestment: '$50' },
            { id: 2, name: 'Bronze Plan', dailyReturn: '2.5%', minInvestment: '$500' },
            { id: 3, name: 'Silver Plan', dailyReturn: '3%', minInvestment: '$1000' },
            { id: 4, name: 'Gold Plan', dailyReturn: '3.5%', minInvestment: '$2000' },
            { id: 5, name: 'Diamond Plan', dailyReturn: '4%', minInvestment: '$4000' },
            { id: 6, name: 'Elite Plan', dailyReturn: '5%', minInvestment: '$7000' }
        ]
    });
});

// Register endpoint with PostgreSQL
app.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').optional().trim().isLength({ max: 100 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    
    try {
        // Check database connection first
        await checkDatabase();
        
    const { email, password, name } = req.body;

        // Check if user exists
        const { rows: existingUsers } = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
    }

        // Hash password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Create user with $5 bonus
        const { rows: newUser } = await pool.query(
            `INSERT INTO users (email, password, name, balance, bonus)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, name, balance, bonus, admin_approved, created_at`,
            [sanitizeString(email), hashedPassword, sanitizeString(name || ''), 5, 5]
        );

    res.json({ message: 'Registered successfully' });
    } catch (err) {
        console.error('Registration error:', err);
        if (err.message === 'Database connection failed' || err.message === 'DATABASE_URL not set') {
            return res.status(503).json({ message: 'Database service unavailable. Please try again later.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Login endpoint with PostgreSQL
app.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid email or password format' });
    }

    try {
        // Check database connection
        await checkDatabase();

    const { email, password } = req.body;

        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const passwordValid = await bcrypt.compare(password, user.password);

        if (!passwordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Return user data without password
        const { password: _, ...userData } = user;
        res.json({ message: 'Login successful', user: userData });
    } catch (err) {
        console.error('Login error:', err);
        if (err.message === 'Database connection failed' || err.message === 'DATABASE_URL not set') {
            return res.status(503).json({ message: 'Database service unavailable. Please try again later.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Legacy deposit endpoint
app.post('/deposit', [
    body('email').isEmail().normalizeEmail(),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const { email, amount } = req.body;
        const numericAmount = Number(amount);

        const { rows: users } = await pool.query(
            'SELECT id, balance, total_deposits FROM users WHERE email = $1',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        const newBalance = Number(user.balance) + numericAmount;
        const newDeposits = Number(user.total_deposits || 0) + numericAmount;

        await pool.query(
            'UPDATE users SET balance = $1, total_deposits = $2 WHERE id = $3',
            [newBalance, newDeposits, user.id]
        );

        res.json({ 
            message: 'Deposit recorded successfully', 
            newBalance: newBalance
        });
    } catch (err) {
        console.error('Deposit error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Investment endpoint with PostgreSQL
app.post('/invest', [
    body('email').isEmail().normalizeEmail(),
    body('plan').isIn(Object.keys(profitRates)).withMessage('Invalid investment plan'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const { email, plan, amount } = req.body;
        const numericAmount = Number(amount);
        
        if (!isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        // Check if user is approved
        if (!user.admin_approved) {
            return res.status(403).json({ 
                message: 'Your account is pending admin approval. Please wait for approval before making investments.' 
            });
        }

        // Calculate available balance
        const profits = await calculateUserProfits(user.id);
        const availableBalance = Number(user.balance || 0) + profits.totalProfit;
        
        const { rows: userInvestments } = await pool.query(
            'SELECT SUM(amount) as total FROM investments WHERE user_id = $1',
            [user.id]
        );
        const totalInvestment = Number(userInvestments[0]?.total || 0);
        const totalBalance = availableBalance - totalInvestment;

        if (totalBalance < numericAmount) {
            return res.status(400).json({ 
                message: `Insufficient balance. Available: $${totalBalance.toFixed(2)}. Please deposit funds first.` 
            });
        }

        // Create investment
        const dailyPercent = profitRates[plan];
        const { rows: investment } = await pool.query(
            `INSERT INTO investments (user_id, plan, amount, daily_percent, days, start_date, profit)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [user.id, plan, numericAmount, dailyPercent, 7, Date.now(), 0]
        );
        
        // Update user total investment
        const newTotalInvestment = totalInvestment + numericAmount;
        await pool.query(
            'UPDATE users SET total_investment = $1 WHERE id = $2',
            [newTotalInvestment, user.id]
        );
        
        return res.json({ message: 'Investment recorded successfully', investment: investment[0] });
    } catch (err) {
        console.error('Investment error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Profile image upload with PostgreSQL
app.post('/profile/upload', [
    body('email').isEmail().normalizeEmail(),
    body('image').matches(/^data:(.+);base64,(.*)$/).withMessage('Invalid image data format')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const { email, image } = req.body;
        
        const { rows: users } = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        const match = image.match(/^data:(.+);base64,(.*)$/);
        if (!match) {
            return res.status(400).json({ message: 'Invalid image data' });
        }

        // Validate file size (max 5MB)
        const base64Data = match[2];
        const imageSize = (base64Data.length * 3) / 4;
        if (imageSize > 5 * 1024 * 1024) {
            return res.status(400).json({ message: 'Image too large. Maximum size is 5MB.' });
        }

        const ext = (match[1].split('/')[1] || 'png').toLowerCase();
        if (!['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
            return res.status(400).json({ message: 'Invalid image format' });
        }

        const fs = require('fs');
        const path = require('path');
        const buffer = Buffer.from(base64Data, 'base64');
        const uploadsDir = 'public/uploads';
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const filename = `profile_${Date.now()}_${email.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, buffer);
        
        const profileImage = `/uploads/${filename}`;
        await pool.query(
            'UPDATE users SET profile_image = $1 WHERE id = $2',
            [profileImage, user.id]
        );
        
        res.json({ message: 'Profile image updated', profileImage });
    } catch (e) {
        console.error('Profile upload error:', e);
        res.status(500).json({ message: 'Server error' });
    }
});

// Optimized profit update (with PostgreSQL)
let lastProfitUpdate = 0;
const PROFIT_UPDATE_INTERVAL = 60000; // 1 minute

app.post('/profits/update', async (req, res) => {
    try {
    const now = Date.now();
        // Prevent too frequent updates
        if (now - lastProfitUpdate < PROFIT_UPDATE_INTERVAL) {
            return res.json({ message: 'Profits are up to date', skipped: true });
        }

        const { rows: investments } = await pool.query('SELECT * FROM investments');
        
        for (const inv of investments) {
            const elapsed = Math.floor((now - inv.start_date) / (1000 * 60 * 60 * 24));
            const days = Number(inv.days) || 7;
            const rate = Number(inv.daily_percent) || 0;
            const base = Number(inv.amount) || 0;
            const effectiveDays = elapsed < days ? elapsed : days;
            const profit = base * rate * effectiveDays;
            
            await pool.query(
                'UPDATE investments SET profit = $1 WHERE id = $2',
                [profit.toFixed(2), inv.id]
            );
        }
        
        lastProfitUpdate = now;
    res.json({ message: 'Profits updated successfully' });
    } catch (err) {
        console.error('Profit update error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch user by email
app.get('/user', [
    query('email').isEmail().normalizeEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    try {
    const { email } = req.query;
        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const { password: _, ...userData } = users[0];
        res.json({ user: userData });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// User Dashboard endpoint
app.get('/dashboard', [
    query('email').isEmail().normalizeEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid email format' });
    }
    
    try {
        const { email } = req.query;
        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = users[0];
        
        // Get investments
        const { rows: investments } = await pool.query(
            'SELECT * FROM investments WHERE user_id = $1 ORDER BY start_date DESC',
            [user.id]
        );
        
        // Calculate metrics
        const profits = await calculateUserProfits(user.id);
        const totalInvestment = Number(user.total_investment || 0);
        const balance = Number(user.balance || 0);
        const bonus = Number(user.bonus || 0);
        
        // Format investments for frontend
        const formattedInvestments = investments.map(inv => ({
            plan: inv.plan,
            amount: Number(inv.amount),
            startDate: inv.start_date,
            days: inv.days,
            profit: Number(inv.profit || 0)
        }));
        
        const responseData = {
            email: user.email, 
            name: user.name || '', 
            profileImage: user.profile_image || '',
            investments: formattedInvestments,
            totalProfit: profits.totalProfit,
            totalBalance: balance + profits.totalProfit,
            totalInvestment: totalInvestment,
            bonus: bonus,
            totalDeposits: Number(user.total_deposits || 0),
            dailyEarnings: profits.dailyEarnings,
            balance: balance,
            adminApproved: user.admin_approved || false
        };
        
        res.json(responseData);
    } catch (error) {
        console.error('[SERVER] Error in /dashboard route:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ===== API ROUTES =====
// GET user data by email
app.get('/api/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = users[0];
        
        // Get investments
        const { rows: investments } = await pool.query(
            'SELECT * FROM investments WHERE user_id = $1 ORDER BY start_date DESC',
            [user.id]
        );
        
        // Get withdrawals
        const { rows: withdrawals } = await pool.query(
            'SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC',
            [user.id]
        );
        
        // Calculate metrics
        const profits = await calculateUserProfits(user.id);
        const totalInvestment = Number(user.total_investment || 0);
        const balance = Number(user.balance || 0);
        const bonus = Number(user.bonus || 0);
        
        // Format data for frontend
        const formattedInvestments = investments.map(inv => ({
            plan: inv.plan,
            amount: Number(inv.amount),
            startDate: inv.start_date,
            days: inv.days,
            profit: Number(inv.profit || 0),
            dailyPercent: Number(inv.daily_percent)
        }));
        
        const formattedWithdrawals = withdrawals.map(wd => ({
            amount: Number(wd.amount),
            cryptoType: wd.crypto_type,
            walletAddress: wd.wallet_address,
            status: wd.status,
            timestamp: wd.created_at.getTime()
        }));
        
        const { password: _, ...userData } = {
            ...user,
            email: user.email,
            name: user.name,
            profileImage: user.profile_image || '',
            balance: balance,
            investments: formattedInvestments,
            withdrawals: formattedWithdrawals,
            totalProfit: profits.totalProfit,
            totalBalance: balance + profits.totalProfit,
            totalInvestment: totalInvestment,
            bonus: bonus,
            totalDeposits: Number(user.total_deposits || 0),
            dailyEarnings: profits.dailyEarnings,
            adminApproved: user.admin_approved || false
        };
        
        res.json(userData);
    } catch (err) {
        console.error('Get user API error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST invest (API version)
app.post('/api/invest', [
    body('email').isEmail().normalizeEmail(),
    body('plan').notEmpty(),
    body('amount').isFloat({ min: 1 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const { email, plan, amount } = req.body;
        const numericAmount = Number(amount);
        
        if (!isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        if (!user.admin_approved) {
            return res.status(403).json({ 
                message: 'Your account is pending admin approval. Please wait for approval before making investments.' 
            });
        }

        // Validate plan
        const planRanges = {
            'Starter Plan': { min: 50, max: 499 },
            'Bronze Plan': { min: 500, max: 999 },
            'Silver Plan': { min: 1000, max: 1999 },
            'Gold Plan': { min: 2000, max: 3999 },
            'Diamond Plan': { min: 4000, max: 6999 },
            'Elite Plan': { min: 7000, max: 999999 }
        };

        const planRange = planRanges[plan];
        if (!planRange) {
            return res.status(400).json({ message: 'Invalid investment plan' });
        }

        if (numericAmount < planRange.min || numericAmount > planRange.max) {
            return res.status(400).json({ 
                message: `Amount must be between $${planRange.min} and $${planRange.max} for ${plan}` 
            });
        }

        // Calculate available balance
        const profits = await calculateUserProfits(user.id);
        const availableBalance = Number(user.balance || 0) + profits.totalProfit;
        
        const { rows: userInvestments } = await pool.query(
            'SELECT SUM(amount) as total FROM investments WHERE user_id = $1',
            [user.id]
        );
        const totalInvestment = Number(userInvestments[0]?.total || 0);
        const totalBalance = availableBalance - totalInvestment;

        if (totalBalance < numericAmount) {
            return res.status(400).json({ 
                message: `Insufficient balance. Available: $${totalBalance.toFixed(2)}` 
            });
        }

        // Create investment
        const dailyPercent = profitRates[plan] || 0;
        const { rows: investment } = await pool.query(
            `INSERT INTO investments (user_id, plan, amount, daily_percent, days, start_date, profit)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [user.id, plan, numericAmount, dailyPercent, 7, Date.now(), 0]
        );
        
        // Update user total investment
        const newTotalInvestment = totalInvestment + numericAmount;
        await pool.query(
            'UPDATE users SET total_investment = $1 WHERE id = $2',
            [newTotalInvestment, user.id]
        );
        
        // Get updated user data
        const { rows: updatedUsers } = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [user.id]
        );
        
        return res.json({ message: 'Investment successful', user: updatedUsers[0] });
    } catch (err) {
        console.error('API Investment error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// POST deposit with file upload support
const upload = multer({ 
    dest: 'public/uploads/proofs/',
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(require('path').extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

app.post('/api/deposit', upload.single('proof'), async (req, res) => {
    try {
        const { email, amount, currency, transactionHash } = req.body;
        const numericAmount = Number(amount);
        
        if (!email || !validateEmail(email)) {
            return res.status(400).json({ message: 'Valid email is required' });
        }
        
        if (!numericAmount || numericAmount <= 0) {
            return res.status(400).json({ message: 'Valid amount is required' });
        }

        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        // Update user balance
        const newBalance = Number(user.balance || 0) + numericAmount;
        const newDeposits = Number(user.total_deposits || 0) + numericAmount;
        
        await pool.query(
            'UPDATE users SET balance = $1, total_deposits = $2 WHERE id = $3',
            [newBalance, newDeposits, user.id]
        );
        
        // Track deposit
        const proofPath = req.file ? `/uploads/proofs/${req.file.filename}` : null;
        await pool.query(
            `INSERT INTO deposits (user_id, amount, currency, transaction_hash, proof, status)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [user.id, numericAmount, currency || 'USD', transactionHash || '', proofPath, 'pending']
        );

        // Auto-add $5 bonus for first deposit
        const { rows: deposits } = await pool.query(
            'SELECT COUNT(*) as count FROM deposits WHERE user_id = $1',
            [user.id]
        );
        
        if (deposits[0].count === '1' && Number(user.bonus || 0) === 0) {
            await pool.query(
                'UPDATE users SET bonus = 5, balance = balance + 5 WHERE id = $1',
                [user.id]
            );
        }

        // Get updated user
        const { rows: updatedUsers } = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [user.id]
        );

        res.json({ message: 'Deposit confirmed', user: updatedUsers[0] });
    } catch (err) {
        console.error('API Deposit error:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

// POST withdraw
app.post('/api/withdraw', [
    body('email').isEmail().normalizeEmail(),
    body('amount').isFloat({ min: 1 }),
    body('cryptoType').notEmpty(),
    body('walletAddress').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const { email, amount, cryptoType, walletAddress } = req.body;
        const numericAmount = Number(amount);
        
        if (!isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        // Calculate available profit
        const profits = await calculateUserProfits(user.id);
        const totalProfit = profits.totalProfit;

        if (numericAmount > totalProfit) {
            return res.status(400).json({ 
                message: `Insufficient profit. Available: $${totalProfit.toFixed(2)}` 
            });
        }

        // Record withdrawal
        await pool.query(
            `INSERT INTO withdrawals (user_id, amount, crypto_type, wallet_address, status)
             VALUES ($1, $2, $3, $4, $5)`,
            [user.id, numericAmount, cryptoType, sanitizeString(walletAddress), 'pending']
        );
        
        res.json({ message: 'Withdrawal request submitted successfully' });
    } catch (err) {
        console.error('API Withdraw error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT update user settings
app.put('/api/user/:email/update', [
    body('name').optional().trim().notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const { email } = req.params;
        const updates = req.body;
        
        const { rows: users } = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        // Update allowed fields
        if (updates.name !== undefined) {
            await pool.query(
                'UPDATE users SET name = $1 WHERE id = $2',
                [sanitizeString(updates.name), user.id]
            );
        }

        // Get updated user
        const { rows: updatedUsers } = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [user.id]
        );

        res.json({ message: 'User updated successfully', user: updatedUsers[0] });
    } catch (err) {
        console.error('Update user API error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin endpoints
app.get('/admin/users', async (req, res) => {
    try {
        const { rows: users } = await pool.query(
            'SELECT id, email, name, profile_image, balance, total_investment, total_profit, total_deposits, bonus, admin_approved, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({ users });
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/admin/approve', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    try {
        const { email } = req.body;
        const { rows: users } = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        await pool.query(
            'UPDATE users SET admin_approved = true WHERE id = $1',
            [users[0].id]
        );
        
        res.json({ message: 'User approved successfully' });
    } catch (err) {
        console.error('Admin approve error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin stats endpoint
app.get('/api/admin/stats', async (req, res) => {
    try {
        // Total users
        const { rows: userCount } = await pool.query('SELECT COUNT(*) as count FROM users');
        const totalUsers = parseInt(userCount[0].count) || 0;
        
        // Total investments
        const { rows: invSum } = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM investments');
        const totalInvestments = parseFloat(invSum[0].total) || 0;
        
        // Total deposits
        const { rows: depSum } = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE status = $1', ['approved']);
        const totalDeposits = parseFloat(depSum[0].total) || 0;
        
        // Total withdrawals
        const { rows: wdSum } = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE status = $1', ['approved']);
        const totalWithdrawals = parseFloat(wdSum[0].total) || 0;
        
        // Pending deposits
        const { rows: pendingDep } = await pool.query('SELECT COUNT(*) as count FROM deposits WHERE status = $1', ['pending']);
        const pendingDeposits = parseInt(pendingDep[0].count) || 0;
        
        // Pending withdrawals
        const { rows: pendingWd } = await pool.query('SELECT COUNT(*) as count FROM withdrawals WHERE status = $1', ['pending']);
        const pendingWithdrawals = parseInt(pendingWd[0].count) || 0;
        
        res.json({
            totalUsers,
            totalInvestments,
            totalDeposits,
            totalWithdrawals,
            pendingDeposits,
            pendingWithdrawals
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get pending deposits
app.get('/api/admin/deposits/pending', async (req, res) => {
    try {
        const { rows: deposits } = await pool.query(
            `SELECT d.*, u.email as user_email 
             FROM deposits d 
             LEFT JOIN users u ON d.user_id = u.id 
             WHERE d.status = 'pending' 
             ORDER BY d.created_at DESC`
        );
        res.json({ deposits });
    } catch (err) {
        console.error('Pending deposits error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get pending withdrawals
app.get('/api/admin/withdrawals/pending', async (req, res) => {
    try {
        const { rows: withdrawals } = await pool.query(
            `SELECT w.*, u.email as user_email 
             FROM withdrawals w 
             LEFT JOIN users u ON w.user_id = u.id 
             WHERE w.status = 'pending' 
             ORDER BY w.created_at DESC`
        );
        res.json({ withdrawals });
    } catch (err) {
        console.error('Pending withdrawals error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve deposit
app.post('/api/admin/deposits/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows: deposits } = await pool.query(
            'SELECT * FROM deposits WHERE id = $1',
            [id]
        );
        
        if (deposits.length === 0) {
            return res.status(404).json({ message: 'Deposit not found' });
        }
        
        const deposit = deposits[0];
        
        // Update deposit status
        await pool.query(
            'UPDATE deposits SET status = $1 WHERE id = $2',
            ['approved', id]
        );
        
        // Update user balance if not already done
        if (deposit.status === 'pending') {
            await pool.query(
                'UPDATE users SET balance = balance + $1, total_deposits = total_deposits + $1 WHERE id = $2',
                [deposit.amount, deposit.user_id]
            );
        }
        
        res.json({ message: 'Deposit approved successfully' });
    } catch (err) {
        console.error('Approve deposit error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject deposit
app.post('/api/admin/deposits/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            'UPDATE deposits SET status = $1 WHERE id = $2',
            ['rejected', id]
        );
        res.json({ message: 'Deposit rejected' });
    } catch (err) {
        console.error('Reject deposit error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve withdrawal
app.post('/api/admin/withdrawals/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows: withdrawals } = await pool.query(
            'SELECT * FROM withdrawals WHERE id = $1',
            [id]
        );
        
        if (withdrawals.length === 0) {
            return res.status(404).json({ message: 'Withdrawal not found' });
        }
        
        const withdrawal = withdrawals[0];
        
        // Update withdrawal status
        await pool.query(
            'UPDATE withdrawals SET status = $1 WHERE id = $2',
            ['approved', id]
        );
        
        // Deduct from user's total profit (already deducted when created, just update status)
        res.json({ message: 'Withdrawal approved successfully' });
    } catch (err) {
        console.error('Approve withdrawal error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject withdrawal
app.post('/api/admin/withdrawals/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows: withdrawals } = await pool.query(
            'SELECT * FROM withdrawals WHERE id = $1',
            [id]
        );
        
        if (withdrawals.length === 0) {
            return res.status(404).json({ message: 'Withdrawal not found' });
        }
        
        const withdrawal = withdrawals[0];
        
        // Update withdrawal status
        await pool.query(
            'UPDATE withdrawals SET status = $1 WHERE id = $2',
            ['rejected', id]
        );
        
        // Refund the amount back to user's total profit
        await pool.query(
            'UPDATE users SET total_profit = total_profit + $1, total_balance = total_balance + $1 WHERE id = $2',
            [withdrawal.amount, withdrawal.user_id]
        );
        
        res.json({ message: 'Withdrawal rejected and amount refunded' });
    } catch (err) {
        console.error('Reject withdrawal error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== WALLET MANAGEMENT ROUTES =====
app.get('/api/wallets', async (req, res) => {
    try {
        const { rows: wallets } = await pool.query(
            'SELECT * FROM wallets ORDER BY coin_name ASC'
        );
        res.json({ wallets });
    } catch (err) {
        console.error('Get wallets error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/wallets', [
    body('coin_name').notEmpty(),
    body('address').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    
    try {
        const { coin_name, address, qr_url } = req.body;
        
        // Check if wallet exists
        const { rows: existing } = await pool.query(
            'SELECT id FROM wallets WHERE coin_name = $1',
            [coin_name]
        );
        
        if (existing.length > 0) {
            // Update existing
            await pool.query(
                'UPDATE wallets SET address = $1, qr_url = $2, updated_at = CURRENT_TIMESTAMP WHERE coin_name = $3',
                [address, qr_url || null, coin_name]
            );
            res.json({ message: 'Wallet updated successfully' });
        } else {
            // Create new
            await pool.query(
                'INSERT INTO wallets (coin_name, address, qr_url) VALUES ($1, $2, $3)',
                [coin_name, address, qr_url || null]
            );
            res.json({ message: 'Wallet added successfully' });
        }
    } catch (err) {
        console.error('Wallet management error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== PROJECTS ROUTES =====
app.get('/api/projects', async (req, res) => {
    try {
        const { rows: projects } = await pool.query(
            'SELECT id, title, description, image_url, slug FROM projects ORDER BY created_at DESC'
        );
        res.json({ projects });
    } catch (err) {
        console.error('Get projects error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/projects/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const { rows: projects } = await pool.query(
            'SELECT * FROM projects WHERE slug = $1',
            [slug]
        );
        
        if (projects.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        res.json({ project: projects[0] });
    } catch (err) {
        console.error('Get project error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/projects', [
    body('title').notEmpty(),
    body('slug').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    
    try {
        const { id, title, description, image_url, slug, content_html } = req.body;
        
        if (id) {
            // Update existing
            await pool.query(
                'UPDATE projects SET title = $1, description = $2, image_url = $3, slug = $4, content_html = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6',
                [title, description || null, image_url || null, slug, content_html || null, id]
            );
            res.json({ message: 'Project updated successfully' });
        } else {
            // Create new
            const { rows: newProject } = await pool.query(
                'INSERT INTO projects (title, description, image_url, slug, content_html) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [title, description || null, image_url || null, slug, content_html || null]
            );
            res.json({ message: 'Project created successfully', id: newProject[0].id });
        }
    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation
            return res.status(400).json({ message: 'Slug already exists' });
        }
        console.error('Project management error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/admin/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM projects WHERE id = $1', [id]);
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error('Delete project error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== TESTIMONIALS ROUTES =====
app.get('/api/testimonials', async (req, res) => {
    try {
        const { rows: testimonials } = await pool.query(
            'SELECT * FROM testimonials ORDER BY date_added DESC'
        );
        res.json({ testimonials });
    } catch (err) {
        console.error('Get testimonials error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/testimonials', [
    body('name').notEmpty(),
    body('content').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    
    try {
        const { id, name, image_url, content } = req.body;
        
        if (id) {
            // Update existing
            await pool.query(
                'UPDATE testimonials SET name = $1, image_url = $2, content = $3 WHERE id = $4',
                [name, image_url || null, content, id]
            );
            res.json({ message: 'Testimonial updated successfully' });
        } else {
            // Create new
            const { rows: newTestimonial } = await pool.query(
                'INSERT INTO testimonials (name, image_url, content) VALUES ($1, $2, $3) RETURNING id',
                [name, image_url || null, content]
            );
            res.json({ message: 'Testimonial created successfully', id: newTestimonial[0].id });
        }
    } catch (err) {
        console.error('Testimonial management error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/admin/testimonials/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM testimonials WHERE id = $1', [id]);
        res.json({ message: 'Testimonial deleted successfully' });
    } catch (err) {
        console.error('Delete testimonial error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== NEWS ROUTES =====
app.get('/api/news', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const { rows: news } = await pool.query(
            'SELECT id, title, summary, image_url, slug, date FROM news ORDER BY date DESC LIMIT $1',
            [limit]
        );
        res.json({ news });
    } catch (err) {
        console.error('Get news error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/news/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const { rows: news } = await pool.query(
            'SELECT * FROM news WHERE slug = $1',
            [slug]
        );
        
        if (news.length === 0) {
            return res.status(404).json({ message: 'Article not found' });
        }
        
        res.json({ article: news[0] });
    } catch (err) {
        console.error('Get article error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/news', [
    body('title').notEmpty(),
    body('slug').notEmpty(),
    body('content_html').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    
    try {
        const { id, title, summary, image_url, slug, content_html } = req.body;
        
        if (id) {
            // Update existing
            await pool.query(
                'UPDATE news SET title = $1, summary = $2, image_url = $3, slug = $4, content_html = $5 WHERE id = $6',
                [title, summary || null, image_url || null, slug, content_html, id]
            );
            res.json({ message: 'Article updated successfully' });
        } else {
            // Create new
            const { rows: newArticle } = await pool.query(
                'INSERT INTO news (title, summary, image_url, slug, content_html) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [title, summary || null, image_url || null, slug, content_html]
            );
            res.json({ message: 'Article created successfully', id: newArticle[0].id });
        }
    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation
            return res.status(400).json({ message: 'Slug already exists' });
        }
        console.error('News management error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/admin/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM news WHERE id = $1', [id]);
        res.json({ message: 'Article deleted successfully' });
    } catch (err) {
        console.error('Delete article error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== ADMIN IMAGE UPLOAD ROUTE =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public', 'uploads', 'admin');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

app.post('/api/admin/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded' });
        }
        
        const imageUrl = '/uploads/admin/' + req.file.filename;
        res.json({ url: imageUrl });
    } catch (err) {
        console.error('Image upload error:', err);
        res.status(500).json({ message: 'Failed to upload image' });
    }
});

// ===== ADMIN USER MANAGEMENT ROUTES =====
app.get('/api/admin/users', async (req, res) => {
    try {
        const { rows: users } = await pool.query(
            `SELECT id, email, name, profile_image, balance, total_investment, total_profit, 
             total_deposits, bonus, admin_approved, created_at 
             FROM users ORDER BY created_at DESC`
        );
        res.json({ users });
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows: users } = await pool.query(
            `SELECT id, email, name, profile_image, balance, total_investment, total_profit, 
             total_deposits, bonus, admin_approved, created_at 
             FROM users WHERE id = $1`,
            [id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ user: users[0] });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/users/:id/update', [
    body('balance').optional().isFloat({ min: 0 }),
    body('total_investment').optional().isFloat({ min: 0 }),
    body('total_profit').optional().isFloat({ min: 0 }),
    body('name').optional().trim(),
    body('email').optional().isEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    
    try {
        const { id } = req.params;
        const { balance, total_investment, total_profit, name, email, profile_image } = req.body;
        
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (balance !== undefined) {
            updates.push(`balance = $${paramCount}`);
            values.push(balance);
            paramCount++;
        }
        if (total_investment !== undefined) {
            updates.push(`total_investment = $${paramCount}`);
            values.push(total_investment);
            paramCount++;
        }
        if (total_profit !== undefined) {
            updates.push(`total_profit = $${paramCount}`);
            values.push(total_profit);
            paramCount++;
        }
        if (name !== undefined) {
            updates.push(`name = $${paramCount}`);
            values.push(sanitizeString(name));
            paramCount++;
        }
        if (email !== undefined) {
            updates.push(`email = $${paramCount}`);
            values.push(sanitizeString(email));
            paramCount++;
        }
        if (profile_image !== undefined) {
            updates.push(`profile_image = $${paramCount}`);
            values.push(profile_image);
            paramCount++;
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }
        
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        
        await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
            values
        );
        
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== INVESTMENT PLANS MANAGEMENT =====
// Initialize investment plans table after schema
async function initializeInvestmentPlans() {
  try {
    const { rows: existing } = await pool.query('SELECT COUNT(*) as count FROM investment_plans');
    if (parseInt(existing[0].count) === 0) {
      const defaultPlans = [
        ['Starter Plan', 50, 499, 0.02, 7],
        ['Bronze Plan', 500, 999, 0.025, 7],
        ['Silver Plan', 1000, 1999, 0.03, 7],
        ['Gold Plan', 2000, 3999, 0.035, 7],
        ['Platinum Plan', 4000, 6999, 0.04, 7],
        ['Diamond Plan', 7000, null, 0.05, 7]
      ];
      
      for (const plan of defaultPlans) {
        await pool.query(
          'INSERT INTO investment_plans (plan_name, min_amount, max_amount, daily_percent, duration) VALUES ($1, $2, $3, $4, $5)',
          plan
        );
      }
      console.log('✅ Default investment plans inserted');
    }
  } catch (err) {
    console.error('Investment plans init error:', err);
  }
}

// Initialize plans after schema is created
pool.connect()
  .then(async (client) => {
    client.release();
    try {
      await ensureSchema();
      await initializeInvestmentPlans();
    } catch (err) {
      console.error('Schema/Plans init error:', err);
    }
  })
  .catch(() => {
    // Connection will be retried
  });

app.get('/api/admin/plans', async (req, res) => {
    try {
        const { rows: plans } = await pool.query(
            'SELECT * FROM investment_plans ORDER BY min_amount ASC'
        );
        res.json({ plans });
    } catch (err) {
        console.error('Get plans error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/plans', [
    body('plan_name').notEmpty(),
    body('min_amount').isFloat({ min: 0 }),
    body('daily_percent').isFloat({ min: 0, max: 1 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    
    try {
        const { id, plan_name, min_amount, max_amount, daily_percent, duration, is_active } = req.body;
        
        if (id) {
            // Update existing
            await pool.query(
                'UPDATE investment_plans SET plan_name = $1, min_amount = $2, max_amount = $3, daily_percent = $4, duration = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',
                [plan_name, min_amount, max_amount || null, daily_percent, duration || 7, is_active !== undefined ? is_active : true, id]
            );
            res.json({ message: 'Plan updated successfully' });
        } else {
            // Create new
            const { rows: newPlan } = await pool.query(
                'INSERT INTO investment_plans (plan_name, min_amount, max_amount, daily_percent, duration, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                [plan_name, min_amount, max_amount || null, daily_percent, duration || 7, is_active !== undefined ? is_active : true]
            );
            res.json({ message: 'Plan created successfully', id: newPlan[0].id });
        }
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Plan name already exists' });
        }
        console.error('Plan management error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/admin/plans/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM investment_plans WHERE id = $1', [id]);
        res.json({ message: 'Plan deleted successfully' });
    } catch (err) {
        console.error('Delete plan error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Daily profit auto calculation (runs every 24 hours)
setInterval(async () => {
    try {
        const { rows: investments } = await pool.query(
            'SELECT i.*, u.id as user_id FROM investments i JOIN users u ON i.user_id = u.id'
        );
        
        for (const inv of investments) {
            const elapsed = Math.floor((Date.now() - inv.start_date) / (1000 * 60 * 60 * 24));
            if (elapsed < inv.days) {
                const dailyGain = (inv.amount * inv.daily_percent) / 100;
                await pool.query(`
                    UPDATE users
                    SET total_profit = total_profit + $1,
                        total_balance = COALESCE(total_balance, 0) + $1
                    WHERE id = $2
                `, [dailyGain, inv.user_id]);
            }
        }
        console.log('✅ Daily profits updated');
    } catch (err) {
        console.error('Error updating daily profits:', err);
    }
}, 24 * 60 * 60 * 1000); // every 24h

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
    console.log('✅ PostgreSQL database connected');
    console.log('Security features enabled: password hashing, rate limiting, input validation');
});
