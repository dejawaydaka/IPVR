const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult, query } = require('express-validator');
const multer = require('multer');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') || process.env.DATABASE_URL?.includes('localhost') === false
    ? { rejectUnauthorized: false }
    : false
});

// Test database connection
pool.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL');
  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Middleware to serve static files
app.use(express.static('public'));

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
