const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult, query } = require('express-validator');
const multer = require('multer');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { Resend } = require('resend');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.set('trust proxy', 1);

// ===== EMAIL CONFIGURATION (Resend) =====
const resend = new Resend(process.env.RESEND_API_KEY);
let emailServiceReady = !!process.env.RESEND_API_KEY;

if (!emailServiceReady) {
  console.warn('⚠️ Resend API key missing. Set RESEND_API_KEY in your .env file');
}

// ===== EMAIL TEMPLATES =====
const emailTemplates = {
  verifyEmail: require('./emails/verifyEmail.js'),
  passwordReset: require('./emails/passwordReset.js'),
  depositNotification: require('./emails/depositNotification.js'),
  withdrawalNotification: require('./emails/withdrawalNotification.js'),
  investmentCreated: require('./emails/investmentCreated.js'),
  investmentMatured: require('./emails/investmentMatured.js'),
  adminAlert: require('./emails/adminAlert.js'),
};

// ===== EMAIL UTILITY FUNCTIONS (Resend API) =====
const sendEmail = async (to, subject, html, retries = 2) => {
  if (!emailServiceReady) {
    console.warn(`⚠️ Email not sent to ${to}: Resend not configured`);
    return { success: false, error: 'Email service not configured' };
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'RealSphere Support <support@realsphereltd.com>',
        to,
        subject,
        html,
      });

      if (error) throw new Error(error.message || 'Resend API error');

      console.log(`✅ Email sent to ${to} (attempt ${attempt})`, data?.id || '');
      return { success: true };
    } catch (error) {
      console.error(`❌ Email send failed to ${to} (attempt ${attempt}/${retries}):`, error.message);

      if (attempt < retries) {
        console.log(`🔁 Retrying in ${1000 * attempt}ms...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      } else {
        return { success: false, error: error.message };
      }
    }
  }
};

// ===== ADMIN ALERT EMAIL =====
const sendAdminEmail = async (subject, message, type = 'info', details = {}) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'support@realsphereltd.com';
  const html = emailTemplates.adminAlert.adminAlert(subject, message, type, details);
  return await sendEmail(adminEmail, `[RealSphere Admin] ${subject}`, html);
};

// ===== TEST EMAIL ROUTE =====
app.get('/test-email', async (req, res) => {
  const testResult = await sendEmail(
    'support@realsphereltd.com',
    'Resend API Test',
    '<p>This is a test email sent using <strong>Resend API</strong> 🚀</p>'
  );
  res.json(testResult);
});

// ===== START SERVER =====
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});


// ===== TEST EMAIL ROUTE =====
app.get('/test-email', async (req, res) => {
  const testResult = await sendEmail(
    'support@realsphereltd.com',
    'Resend API Test',
    '<p>This is a test email sent using <strong>Resend API</strong> 🚀</p>'
  );
  res.json(testResult);
});

// ===== START SERVER =====
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});











// const express = require('express');
// const cors = require('cors');
// const bcrypt = require('bcryptjs');
// const rateLimit = require('express-rate-limit');
// const { body, validationResult, query } = require('express-validator');
// const multer = require('multer');
// const { Pool } = require('pg');
// const path = require('path');
// const fs = require('fs');
// const nodemailer = require('nodemailer');
// const crypto = require('crypto');
// require('dotenv').config();

// const app = express();
// const port = process.env.PORT || 3000;

// // Behind Railway/Proxies - trust X-Forwarded-* headers for correct client IPs
// app.set('trust proxy', 1);

// // ===== EMAIL CONFIGURATION =====
// // Create transporter with connection timeout and retry settings
// const transporter = nodemailer.createTransport({
//   host: 'smtp.zoho.com',
//   port: 465,
//   secure: true, // true for 465, false for other ports
//   auth: {
//     user: 'support@realsphereltd.com',
//     pass: process.env.ZOHO_APP_PASSWORD || ''
//   },
//   connectionTimeout: 20000, // 20 seconds
//   greetingTimeout: 20000, // 20 seconds
//   socketTimeout: 20000, // 20 seconds
//   pool: true, // Use connection pooling
//   maxConnections: 1,
//   maxMessages: 3,
//   rateDelta: 1000, // Time window for rate limiting
//   rateLimit: 5 // Max messages per rateDelta
// });

// // Alternative transporter for TLS (port 587) - fallback option
// const transporterTLS = nodemailer.createTransport({
//   host: 'smtp.zoho.com',
//   port: 587,
//   secure: false, // false for TLS
//   auth: {
//     user: 'support@realsphereltd.com',
//     pass: process.env.ZOHO_APP_PASSWORD || ''
//   },
//   connectionTimeout: 20000,
//   greetingTimeout: 20000,
//   socketTimeout: 20000,
//   requireTLS: true
// });

// // Test email connection with retry logic
// let emailServiceReady = false;
// let emailServiceMethod = 'ssl'; // 'ssl' or 'tls'

// async function verifyEmailConnection() {
//   if (!process.env.ZOHO_APP_PASSWORD) {
//     console.warn('⚠️  Email service not configured. Set ZOHO_APP_PASSWORD in environment variables.');
//     console.warn('   Email notifications will be disabled until configured.');
//     return false;
//   }

//   // Try SSL first (port 465)
//   try {
//     await new Promise((resolve, reject) => {
//       transporter.verify((error, success) => {
//         if (error) reject(error);
//         else resolve(success);
//       });
//     });
//     emailServiceReady = true;
//     emailServiceMethod = 'ssl';
//     console.log('✅ Email service ready (Zoho SMTP - SSL on port 465)');
//     return true;
//   } catch (sslError) {
//     console.warn('⚠️  SSL connection failed, trying TLS (port 587)...');
    
//     // Fallback to TLS (port 587)
//     try {
//       await new Promise((resolve, reject) => {
//         transporterTLS.verify((error, success) => {
//           if (error) reject(error);
//           else resolve(success);
//         });
//       });
//       emailServiceReady = true;
//       emailServiceMethod = 'tls';
//       console.log('✅ Email service ready (Zoho SMTP - TLS on port 587)');
//       return true;
//     } catch (tlsError) {
//       console.error('❌ Email connection failed:', {
//         ssl: sslError.message,
//         tls: tlsError.message
//       });
//       console.warn('⚠️  Email notifications will be disabled.');
//       console.warn('   This may be due to Railway network restrictions or SMTP configuration.');
//       console.warn('   Consider upgrading to Railway Pro plan or using a different email service.');
//       emailServiceReady = false;
//       return false;
//     }
//   }
// }

// // Verify connection on startup (non-blocking)
// setTimeout(() => {
//   verifyEmailConnection().catch(err => {
//     console.error('Email verification error:', err.message);
//   });
// }, 2000); // Wait 2 seconds for server to fully start

// // ===== EMAIL TEMPLATES =====
// const emailTemplates = {
//   verifyEmail: require('./emails/verifyEmail.js'),
//   passwordReset: require('./emails/passwordReset.js'),
//   depositNotification: require('./emails/depositNotification.js'),
//   withdrawalNotification: require('./emails/withdrawalNotification.js'),
//   investmentCreated: require('./emails/investmentCreated.js'),
//   investmentMatured: require('./emails/investmentMatured.js'),
//   adminAlert: require('./emails/adminAlert.js')
// };

// // ===== EMAIL UTILITY FUNCTIONS =====
// const sendEmail = async (to, subject, html, retries = 2) => {
//   if (!process.env.ZOHO_APP_PASSWORD) {
//     console.warn(`⚠️  Email not sent to ${to}: ZOHO_APP_PASSWORD not configured`);
//     return { success: false, error: 'Email service not configured' };
//   }

//   if (!emailServiceReady) {
//     // Try to verify connection again if not ready
//     const verified = await verifyEmailConnection();
//     if (!verified) {
//       console.warn(`⚠️  Email not sent to ${to}: Email service not ready`);
//       return { success: false, error: 'Email service not ready' };
//     }
//   }

//   // Select transporter based on working method
//   const activeTransporter = emailServiceMethod === 'tls' ? transporterTLS : transporter;

//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       await activeTransporter.sendMail({
//         from: '"RealSphere Support" <support@realsphereltd.com>',
//         to,
//         subject,
//         html,
//         connectionTimeout: 20000,
//         socketTimeout: 20000
//       });
//       console.log(`✅ Email sent to ${to} (attempt ${attempt})`);
//       return { success: true };
//     } catch (error) {
//       const errorMsg = error.message || 'Unknown error';
//       console.error(`❌ Email send error to ${to} (attempt ${attempt}/${retries}):`, errorMsg);
      
//       // If SSL fails and we haven't tried TLS yet, switch to TLS
//       if (attempt === 1 && emailServiceMethod === 'ssl' && 
//           (errorMsg.includes('timeout') || errorMsg.includes('ECONNREFUSED'))) {
//         console.log('⚠️  Retrying with TLS (port 587)...');
//         emailServiceMethod = 'tls';
//         emailServiceReady = false;
//         const verified = await verifyEmailConnection();
//         if (verified) {
//           continue; // Retry with TLS
//         }
//       }
      
//       // Last attempt failed
//       if (attempt === retries) {
//         return { success: false, error: errorMsg };
//       }
      
//       // Wait before retry (exponential backoff)
//       await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
//     }
//   }
  
//   return { success: false, error: 'All retry attempts failed' };
// };

// const sendAdminEmail = async (subject, message, type = 'info', details = {}) => {
//   const adminEmail = process.env.ADMIN_EMAIL || 'support@realsphereltd.com';
//   const html = emailTemplates.adminAlert.adminAlert(subject, message, type, details);
//   return await sendEmail(adminEmail, `[RealSphere Admin] ${subject}`, html);
// };

// ===== ADMIN AUTHENTICATION MIDDLEWARE =====
function adminAuth(req, res, next) {
    const username = req.headers['x-admin-username'] || req.headers['username'];
    const password = req.headers['x-admin-password'] || req.headers['password'];
    
    if (username === 'admin' && password === 'pass2002word') {
        return next();
    }
    
    // If no credentials provided, return 403
    res.status(403).json({ error: 'Unauthorized access', message: 'Admin authentication required' });
}

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

function createRandomReferralCode(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function generateReferralCode() {
    while (true) {
        const code = createRandomReferralCode();
        const { rows } = await pool.query('SELECT 1 FROM users WHERE referral_code = $1', [code]);
        if (rows.length === 0) {
            return code;
        }
    }
}

async function ensureReferralCodes() {
    const { rows } = await pool.query('SELECT id FROM users WHERE referral_code IS NULL OR referral_code = \'\'');
    for (const row of rows) {
        const code = await generateReferralCode();
        await pool.query('UPDATE users SET referral_code = $1 WHERE id = $2', [code, row.id]);
    }
}

async function awardReferralBonus(referrerId, referredEmail = '', dbClient = pool) {
    const bonusAmount = 5;
    const executor = dbClient && typeof dbClient.query === 'function' ? dbClient : pool;

    await executor.query(
        'UPDATE users SET balance = balance + $1, bonus = bonus + $1 WHERE id = $2',
        [bonusAmount, referrerId]
    );
    await executor.query(
        `INSERT INTO transactions (user_id, type, amount, currency, status, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
            referrerId,
            'referral_bonus',
            bonusAmount,
            'USD',
            'completed',
            referredEmail
                ? `Referral Bonus - ${referredEmail} verified`
                : 'Referral Bonus'
        ]
    );
}

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
      logo_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Add logo_url column if it doesn't exist (for existing databases)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'wallets' AND column_name = 'logo_url') THEN
        ALTER TABLE wallets ADD COLUMN logo_url TEXT;
      END IF;
    END $$;`;

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

  const createContacts = `
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      subject VARCHAR(255),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

  const createTransactions = `
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'USD',
      status VARCHAR(20) DEFAULT 'completed',
      description TEXT,
      reference_id INTEGER,
      reference_type VARCHAR(50),
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
  await pool.query(createContacts);
  await pool.query(createTransactions);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_news_date ON news(date);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);');
  
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

  // Add email verification and reset token columns to users table if they don't exist
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100);');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_bonus_awarded BOOLEAN DEFAULT FALSE;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT \'pending\';');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_full_name VARCHAR(255);');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_front_url TEXT;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_back_url TEXT;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMP;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMP;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_reviewer_email VARCHAR(255);');
    await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_idx ON users(referral_code) WHERE referral_code IS NOT NULL;');
    await pool.query('CREATE INDEX IF NOT EXISTS users_referred_by_idx ON users(referred_by);');
    console.log('✅ Email verification columns added to users table');
  } catch (err) {
    // Columns might already exist, ignore error
    if (!err.message.includes('already exists')) {
      console.error('Error adding email columns:', err.message);
    }
  }
  try {
    await pool.query(`
      ALTER TABLE users
      ADD CONSTRAINT fk_users_referred_by
      FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL
    ;`);
  } catch (err) {
    if (!err.message.includes('already exists')) {
      console.error('Error adding referred_by foreign key:', err.message);
    }
  }
}

// Initialize database connection (non-blocking)
pool.connect()
  .then(async (client) => {
    console.log('✅ Connected to PostgreSQL');
    dbConnected = true;
    client.release();
    
    // Initialize schema and plans asynchronously
    (async () => {
      try {
        await ensureSchema();
        console.log('🛠️  Database schema ensured');
        
        // Small delay to ensure table is fully created
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          await ensureReferralCodes();
          console.log('🔁 Referral codes ensured for all users');
        } catch (referralErr) {
          console.error('Error ensuring referral codes:', referralErr.message);
        }
        
        // Initialize investment plans after schema is ready
        await initializeInvestmentPlans();
      } catch (schemaErr) {
        console.error('Schema/Plans init error:', schemaErr.message);
        // Don't crash - server can still start
      }
    })();
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

// ===== ADMIN IMAGE UPLOAD CONFIGURATION =====
// Setup multer for admin file uploads (defined early so routes can use it)
const adminStorage = multer.diskStorage({
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

const adminUpload = multer({
    storage: adminStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Setup multer specifically for wallet assets (logos and QR codes) - stored in tracked directory
const walletStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const walletPath = path.join(__dirname, 'public', 'wallet-assets');
        if (!fs.existsSync(walletPath)) {
            fs.mkdirSync(walletPath, { recursive: true });
        }
        cb(null, walletPath);
    },
    filename: (req, file, cb) => {
        // Use coin name in filename for better organization and persistence
        // Handle both JSON and FormData (FormData sends as string)
        let coinName = 'wallet';
        if (req.body && req.body.coin_name) {
            coinName = typeof req.body.coin_name === 'string' 
                ? req.body.coin_name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
                : String(req.body.coin_name).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        }
        const fieldType = file.fieldname === 'logo' ? 'logo' : 'qr';
        const ext = path.extname(file.originalname);
        const filename = `${coinName}_${fieldType}${ext}`;
        cb(null, filename);
    }
});

const walletUpload = multer({
    storage: walletStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

const kycStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const kycPath = path.join(__dirname, 'public', 'uploads', 'kyc');
        if (!fs.existsSync(kycPath)) {
            fs.mkdirSync(kycPath, { recursive: true });
        }
        cb(null, kycPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const kycUpload = multer({
    storage: kycStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for KYC uploads'));
        }
    }
}).fields([
    { name: 'kycFront', maxCount: 1 },
    { name: 'kycBack', maxCount: 1 }
]);

// Middleware to serve static files
app.use(express.static('public'));

// Serve project/news pages dynamically
app.get('/projects/:slug.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/projects/template.html'));
});

app.get('/news/:slug.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/news/template.html'));
});

// Rate limiting (skip admin routes as they have their own auth)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    skip: (req) => {
        // Skip rate limiting for admin routes
        return req.path.startsWith('/admin') || req.originalUrl.startsWith('/api/admin');
    }
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

function sanitizeOptionalString(str) {
    if (!str || typeof str !== 'string') return '';
    return str.trim();
}

function normalizeReferralCode(code) {
    if (!code || typeof code !== 'string') return '';
    return code.trim().toUpperCase();
}

const PRICING_PLANS = [
    {
        name: 'Real Estate',
        slug: 'real-estate',
        category: 'Property portfolios',
        minAmount: 50,
        maxAmount: 499,
        dailyPercent: 0.02,
        duration: 7,
        description: `Real estate pricing involves valuing properties based on various factors such as location, size, condition, amenities, and market demand. Common pricing strategies include comparative market analysis (comparing the property to similar ones in the area), income approach (evaluating the property's income potential), and cost approach (estimating the cost to replace the property).`,
        highlights: [
            'Benchmark assets against comparable properties in prime locations.',
            'Balance income, cost, and market approaches for valuation discipline.',
            'Monitor demand signals to time acquisitions and exits effectively.'
        ]
    },
    {
        name: 'Equities/Stocks',
        slug: 'equities-stocks',
        category: 'Market instruments',
        minAmount: 500,
        maxAmount: 999,
        dailyPercent: 0.025,
        duration: 7,
        description: `Pricing of equities or stocks is primarily determined by supply and demand in the stock market. Factors influencing stock prices include company performance, economic indicators, industry trends, and investor sentiment. Stock prices are often determined by the market through a continuous auction process on stock exchanges.`,
        highlights: [
            'React to market supply-and-demand shifts in real time.',
            'Track company fundamentals alongside macroeconomic indicators.',
            'Use exchange-driven price discovery to capture momentum opportunities.'
        ]
    },
    {
        name: 'Agriculture',
        slug: 'agriculture',
        category: 'Agro investments',
        minAmount: 1000,
        maxAmount: 1999,
        dailyPercent: 0.03,
        duration: 7,
        description: `Agriculture pricing involves determining the value of agricultural products such as crops and livestock. Pricing can be influenced by factors such as crop yield, weather conditions, market demand, government policies, and international trade. Farmers often use a combination of cost-based pricing, market-based pricing, and negotiation with buyers to set prices for their products.`,
        highlights: [
            'Balance yield forecasts with weather and seasonal demand patterns.',
            'Blend cost-based and market-based pricing for resilient margins.',
            'Stay responsive to policy changes and cross-border trade flows.'
        ]
    },
    {
        name: 'Air BNB',
        slug: 'air-bnb',
        category: 'Short-term rentals',
        minAmount: 2000,
        maxAmount: 3999,
        dailyPercent: 0.035,
        duration: 7,
        description: `Airbnb pricing refers to setting rental prices for properties listed on the Airbnb platform. Hosts typically consider factors such as location, property type, amenities, seasonality, local events, and competition when determining their pricing strategy. Dynamic pricing algorithms may also be used to adjust prices based on demand and supply fluctuations.`,
        highlights: [
            'Adjust nightly rates around events, seasonality, and demand spikes.',
            'Differentiate offerings with amenities and localized guest experiences.',
            'Adopt dynamic pricing tools to stay competitive in active markets.'
        ]
    },
    {
        name: 'Commodities',
        slug: 'commodities',
        category: 'Exchange-traded assets',
        minAmount: 4000,
        maxAmount: 6999,
        dailyPercent: 0.04,
        duration: 7,
        description: `Commodities pricing involves determining the value of raw materials or primary agricultural products that are traded in bulk on commodity exchanges. Prices for commodities such as oil, gold, wheat, and coffee are influenced by factors such as supply and demand dynamics, geopolitical events, weather conditions, currency fluctuations, and global economic trends.`,
        highlights: [
            'Manage exposure to global supply-and-demand shocks.',
            'Track geopolitical catalysts and currency movements closely.',
            'Leverage exchange benchmarks for transparent, real-time pricing.'
        ]
    },
    {
        name: 'Cannabis',
        slug: 'cannabis',
        category: 'Emerging markets',
        minAmount: 7000,
        maxAmount: null,
        dailyPercent: 0.05,
        duration: 7,
        description: `Cannabis pricing refers to the pricing of cannabis products, including marijuana and hemp-derived products. Pricing strategies can vary depending on factors such as product type (e.g., flower, edibles, extracts), potency, quality, brand reputation, regulatory environment, and market demand. Pricing in the cannabis industry is still evolving due to ongoing legalization and regulation changes in various jurisdictions.`,
        highlights: [
            'Align price models with evolving regulatory requirements.',
            'Segment offerings by potency, quality, and brand positioning.',
            'Respond quickly to demand shifts in fast-moving regional markets.'
        ]
    },
    {
        name: 'Retirement Plan',
        slug: 'retirement-plan',
        category: 'Long-horizon income',
        minAmount: 7000,
        maxAmount: null,
        dailyPercent: 0.05,
        duration: 7,
        description: `Retirement planning is the process of determining your retirement income goals and the actions and decisions necessary to achieve those goals. It involves analyzing your current financial status, estimating your financial needs during retirement, and creating a strategy to reach your desired retirement lifestyle.`,
        highlights: [
            'Define retirement income targets based on lifestyle aspirations.',
            'Model savings, investments, and expected cash-flow requirements.',
            'Rebalance regularly to keep long-term goals on track.'
        ]
    }
];

const pricingPlanNames = PRICING_PLANS.map(plan => plan.name);

const profitRates = PRICING_PLANS.reduce((map, plan) => {
    map[plan.name] = plan.dailyPercent;
    return map;
}, {});

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
            // Handle start_date - can be Date object, timestamp (number), or string
            let startDate;
            if (inv.start_date instanceof Date) {
                startDate = inv.start_date.getTime();
            } else if (typeof inv.start_date === 'number') {
                startDate = inv.start_date;
            } else if (typeof inv.start_date === 'string') {
                startDate = new Date(inv.start_date).getTime();
            } else {
                console.warn('[calculateUserProfits] Invalid start_date format:', inv.start_date);
                startDate = now; // Default to now to avoid errors
            }
            
            // Ensure startDate is valid
            if (isNaN(startDate) || startDate <= 0) {
                console.warn('[calculateUserProfits] Invalid start_date value:', inv.start_date);
                startDate = now;
            }
            
            const elapsed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
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
        console.error('[calculateUserProfits] Error calculating profits:', err);
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

async function getPricingData() {
    try {
        await checkDatabase();

        const { rows } = await pool.query(
            'SELECT * FROM investment_plans ORDER BY min_amount ASC'
        );

        const dbPlansByName = rows.reduce((acc, row) => {
            acc[row.plan_name] = row;
            return acc;
        }, {});

        const formatCurrency = (value) => {
            const number = Number(value || 0);
            return `$${number.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
        };

        const formatPercent = (value) => {
            const percent = (Number(value || 0) * 100);
            const decimals = Number.isInteger(percent) ? 0 : 1;
            return `${percent.toFixed(decimals)}%`;
        };

        const formatRange = (min, max) => {
            if (max === null || max === undefined) {
                return `${formatCurrency(min)}+`;
            }
            return `${formatCurrency(min)} – ${formatCurrency(max)}`;
        };

        return PRICING_PLANS.map((plan, index) => {
            const dbPlan = dbPlansByName[plan.name];
            const minAmount = dbPlan ? Number(dbPlan.min_amount) : plan.minAmount;
            const maxAmount = dbPlan && dbPlan.max_amount !== null
                ? Number(dbPlan.max_amount)
                : plan.maxAmount;
            const dailyPercent = dbPlan ? Number(dbPlan.daily_percent) : plan.dailyPercent;
            const duration = dbPlan ? Number(dbPlan.duration) : plan.duration;
            const totalPercent = dailyPercent * duration;
            const isActive = dbPlan ? dbPlan.is_active !== false : true;
            const id = dbPlan ? dbPlan.id : index + 1;

            return {
                id,
                name: plan.name,
                slug: plan.slug,
                category: plan.category,
                description: plan.description,
                highlights: plan.highlights,
                minAmount,
                maxAmount,
                dailyPercent,
                duration,
                totalPercent,
                isActive,
                rangeLabel: formatRange(minAmount, maxAmount),
                dailyReturnLabel: formatPercent(dailyPercent),
                totalReturnLabel: formatPercent(totalPercent),
                durationLabel: `${duration} days`
            };
        });
    } catch (err) {
        console.error('Pricing data load error:', err.message);
        // Fallback to static defaults if database lookup fails
        return PRICING_PLANS.map((plan, index) => {
            const totalPercent = plan.dailyPercent * plan.duration;
            return {
                id: index + 1,
                name: plan.name,
                slug: plan.slug,
                category: plan.category,
                description: plan.description,
                highlights: plan.highlights,
                minAmount: plan.minAmount,
                maxAmount: plan.maxAmount,
                dailyPercent: plan.dailyPercent,
                duration: plan.duration,
                totalPercent,
                isActive: true,
                rangeLabel: plan.maxAmount === null
                    ? `$${plan.minAmount.toLocaleString()}+`
                    : `$${plan.minAmount.toLocaleString()} – $${plan.maxAmount.toLocaleString()}`,
                dailyReturnLabel: `${(plan.dailyPercent * 100).toFixed(1)}%`,
                totalReturnLabel: `${(totalPercent * 100).toFixed(1)}%`,
                durationLabel: `${plan.duration} days`
            };
        });
    }
}

app.get('/api/pricing', async (req, res) => {
    try {
        const pricing = await getPricingData();
        res.json({ pricing });
    } catch (err) {
        console.error('API pricing error:', err.message);
        res.status(500).json({ message: 'Failed to load pricing data' });
    }
});

// Legacy endpoint retained for backward compatibility
app.get('/pricing', async (req, res) => {
    try {
        const pricing = await getPricingData();
        res.json({ pricing });
    } catch (err) {
        console.error('Legacy pricing endpoint error:', err.message);
        res.status(500).json({ message: 'Failed to load pricing data' });
    }
});

// Register endpoint with PostgreSQL
app.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').optional().trim().isLength({ max: 100 }),
    body('phone').trim().notEmpty().withMessage('Phone is required').isLength({ max: 30 }),
    body('country').trim().notEmpty().withMessage('Country is required').isLength({ max: 100 }),
    body('referralId').optional().trim().isLength({ max: 20 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    
    try {
        // Check database connection first
        await checkDatabase();
        const { email, password, referralId } = req.body;
        const name = sanitizeString(req.body.name || '');
        const phone = sanitizeOptionalString(req.body.phone);
        const country = sanitizeOptionalString(req.body.country);
        const referralIdRaw = normalizeReferralCode(referralId);

        // Check if user exists
        const { rows: existingUsers } = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const verificationLink = `${baseUrl}/verify?token=${verificationToken}`;

        const client = await pool.connect();
        let referralCode = '';

        try {
            await client.query('BEGIN');

            let referredByUserId = null;
            if (referralIdRaw) {
                const refLookup = await client.query(
                    'SELECT id FROM users WHERE referral_code = $1',
                    [referralIdRaw]
                );
                if (refLookup.rows.length > 0) {
                    referredByUserId = refLookup.rows[0].id;
                }
            }

            const insertResult = await client.query(
                `INSERT INTO users (email, password, name, phone, country, balance, bonus, verification_token, referred_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id, email, name, created_at`,
                [
                    sanitizeString(email),
                    hashedPassword,
                    name || null,
                    phone || null,
                    country || null,
                    5,
                    5,
                    verificationToken,
                    referredByUserId
                ]
            );

            const createdUser = insertResult.rows[0];
            referralCode = await generateReferralCode();
            await client.query(
                'UPDATE users SET referral_code = $1 WHERE id = $2',
                [referralCode, createdUser.id]
            );

            await client.query('COMMIT');
        } catch (txErr) {
            await client.query('ROLLBACK');
            throw txErr;
        } finally {
            client.release();
        }

        // Send verification email
        const verifyHtml = emailTemplates.verifyEmail.verifyEmail(email, verificationLink);
        await sendEmail(email, 'Verify Your RealSphere Account', verifyHtml);

        // Send admin alert
        await sendAdminEmail('New User Registration', `New user registered: ${email}`, 'info', { email, name: name || email.split('@')[0] });

        res.json({ message: 'Registered successfully. Please check your email to verify your account.' });
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

        // Check if email is verified
        if (!user.verified) {
            return res.status(403).json({ 
                message: 'Email not verified', 
                error: 'Please check your email and click the verification link to activate your account.' 
            });
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

// Email verification endpoint
app.get('/verify', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).send('<html><body><h1>Invalid Verification Link</h1><p>No token provided.</p></body></html>');
        }

        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE verification_token = $1',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).send('<html><body><h1>Invalid Verification Link</h1><p>The verification token is invalid or has expired.</p></body></html>');
        }

        const user = users[0];

        if (user.verified) {
            return res.status(200).send('<html><body><h1>Account Already Verified</h1><p>Your account is already verified. You can <a href="/dashboard/index.html">log in</a> now.</p></body></html>');
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                'UPDATE users SET verified = TRUE, verification_token = NULL WHERE id = $1',
                [user.id]
            );

            if (user.referred_by && !user.referral_bonus_awarded) {
                try {
                    await awardReferralBonus(user.referred_by, user.email, client);
                    await client.query(
                        'UPDATE users SET referral_bonus_awarded = TRUE WHERE id = $1',
                        [user.id]
                    );
                } catch (bonusErr) {
                    console.error('Referral bonus error:', bonusErr.message);
                }
            }

            await client.query('COMMIT');
        } catch (txErr) {
            await client.query('ROLLBACK');
            throw txErr;
        } finally {
            client.release();
        }

        res.status(200).send('<html><body><h1>Email Verified Successfully!</h1><p>Your account has been verified. You can now <a href="/dashboard/index.html">log in</a> to your account.</p></body></html>');
    } catch (err) {
        console.error('Verification error:', err);
        res.status(500).send('<html><body><h1>Verification Error</h1><p>An error occurred during verification. Please try again later.</p></body></html>');
    }
});

// Forgot password endpoint
app.post('/forgot-password', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    try {
        const { email } = req.body;

        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (users.length === 0) {
            // Don't reveal if email exists for security
            return res.json({ message: 'If that email exists, a password reset link has been sent.' });
        }

        const user = users[0];

        // Generate reset token (expires in 1 hour)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
            [resetToken, expiresAt, user.id]
        );

        // Send reset email
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const resetLink = `${baseUrl}/reset.html?token=${resetToken}`;
        const resetHtml = emailTemplates.passwordReset.passwordReset(email, resetLink);
        await sendEmail(email, 'Reset Your RealSphere Password', resetHtml);

        res.json({ message: 'If that email exists, a password reset link has been sent.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// API Auth routes for password reset
app.post('/api/auth/forgot-password', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid email format', message: 'Invalid email format' });
    }

    try {
        const { email } = req.body;

        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (users.length === 0) {
            // Don't reveal if email exists for security
            return res.json({ message: 'If that email exists, a password reset link has been sent. Check your inbox.' });
        }

        const user = users[0];

        // Generate reset token (expires in 1 hour)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
            [resetToken, expiresAt, email]
        );

        // Send reset email
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const resetLink = `${baseUrl}/reset.html?token=${resetToken}`;
        const resetHtml = emailTemplates.passwordReset.passwordReset(email, resetLink);
        await sendEmail(email, 'Reset Your RealSphere Password', resetHtml);

        res.json({ message: 'Password reset link sent successfully. Check your inbox.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Internal server error', message: 'Internal server error' });
    }
});

app.post('/api/auth/reset-password', [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg, message: errors.array()[0].msg });
    }

    try {
        const { token, newPassword } = req.body;

        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE reset_token = $1',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token', message: 'Invalid or expired token' });
        }

        const user = users[0];

        // Check if token is expired
        const now = new Date();
        if (user.reset_token_expires && now > new Date(user.reset_token_expires)) {
            return res.status(400).json({ error: 'Token expired', message: 'Token expired' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token
        await pool.query(
            'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = $2',
            [hashedPassword, token]
        );

        // Send confirmation email
        const confirmHtml = `
            <div style="font-family: Inter, sans-serif; color:#222;">
                <h2>Password Reset Successful</h2>
                <p>Hi ${user.email},</p>
                <p>Your RealSphere password has been updated successfully.</p>
                <p>If this wasn't you, please contact support immediately.</p>
            </div>
        `;
        await sendEmail(user.email, 'Password Reset Successful', confirmHtml);

        res.json({ message: 'Password reset successful.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Internal server error', message: 'Internal server error' });
    }
});

// Reset password endpoint
app.post('/reset-password', [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const { token, password } = req.body;

        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const user = users[0];

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password and clear reset token
        await pool.query(
            'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
            [hashedPassword, user.id]
        );

        // Send confirmation email
        const confirmHtml = emailTemplates.passwordReset.passwordReset(user.email, '#');
        await sendEmail(user.email, 'Password Changed Successfully', `
            <html><body>
                <h2>Password Changed Successfully</h2>
                <p>Your RealSphere password has been changed successfully.</p>
                <p>If you didn't make this change, please contact support immediately.</p>
            </body></html>
        `);

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error('Reset password error:', err);
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
        
        // Create pending deposit (DO NOT update balance immediately)
        await pool.query(
            `INSERT INTO deposits (user_id, amount, currency, status)
             VALUES ($1, $2, $3, $4)`,
            [user.id, numericAmount, 'USD', 'pending']
        );

        res.json({ 
            message: 'Deposit request submitted. Your balance will be updated after admin approval.', 
            balance: Number(user.balance || 0),
            status: 'pending'
        });
    } catch (err) {
        console.error('Deposit error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Investment endpoint with PostgreSQL
app.post('/invest', [
    body('email').isEmail().normalizeEmail(),
    body('plan').isIn(pricingPlanNames).withMessage('Invalid pricing option'),
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

        const pricingOptions = await getPricingData();
        const selectedPlan = pricingOptions.find(option => option.name === plan);

        if (!selectedPlan) {
            return res.status(400).json({ message: 'Invalid pricing option' });
        }

        const minAmount = Number(selectedPlan.minAmount || 0);
        const hasUpperBound = selectedPlan.maxAmount !== null && selectedPlan.maxAmount !== undefined;
        const maxAmount = hasUpperBound ? Number(selectedPlan.maxAmount) : Number.MAX_SAFE_INTEGER;

        if (numericAmount < minAmount || numericAmount > maxAmount) {
            const minLabel = `$${minAmount.toLocaleString()}`;
            if (hasUpperBound) {
                const maxLabel = `$${Number(selectedPlan.maxAmount).toLocaleString()}`;
                return res.status(400).json({
                    message: `Amount must be between ${minLabel} and ${maxLabel} for ${plan}`
                });
            }
            return res.status(400).json({
                message: `Amount must be at least ${minLabel} for ${plan}`
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
        const dailyPercent = Number(selectedPlan.dailyPercent || 0);
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
        let maturedInvestments = 0;
        let transactionsCreated = 0;
        
        for (const inv of investments) {
            const elapsed = Math.floor((now - inv.start_date) / (1000 * 60 * 60 * 24));
            const days = Number(inv.days) || 7;
            const rate = Number(inv.daily_percent) || 0;
            const base = Number(inv.amount) || 0;
            const effectiveDays = elapsed < days ? elapsed : days;
            const profit = base * rate * effectiveDays;
            const previousProfit = Number(inv.profit || 0);
            const profitDifference = profit - previousProfit;
            
            // Check if investment just matured (completed all days)
            const wasMature = previousProfit >= (base * rate * days);
            const isNowMature = elapsed >= days;
            
            // Update investment profit
            await pool.query(
                'UPDATE investments SET profit = $1 WHERE id = $2',
                [profit.toFixed(2), inv.id]
            );
            
            // If investment just matured, create a transaction entry for the final profit
            if (!wasMature && isNowMature && profit > 0) {
                maturedInvestments++;
                
                // Check if matured profit transaction already exists for this investment
                const { rows: existingTransactions } = await pool.query(
                    `SELECT id FROM transactions 
                     WHERE user_id = $1 AND type = $2 AND reference_id = $3 
                     AND description LIKE $4`,
                    [inv.user_id, 'profit', inv.id, `Investment Profit - ${inv.plan}%`]
                );
                
                if (existingTransactions.length === 0) {
                    // Check if daily profit transactions exist for this investment
                    const { rows: dailyProfitTransactions } = await pool.query(
                        `SELECT SUM(amount::numeric) as total FROM transactions 
                         WHERE user_id = $1 AND type = $2 AND reference_id = $3 
                         AND description LIKE $4`,
                        [inv.user_id, 'profit', inv.id, `Daily Profit - ${inv.plan}%`]
                    );
                    
                    const dailyProfitTotal = Number(dailyProfitTransactions[0]?.total || 0);
                    const remainingProfit = profit - dailyProfitTotal;
                    
                    // Create transaction entry for matured investment profit
                    await pool.query(
                        `INSERT INTO transactions (user_id, type, amount, currency, status, description, reference_id, reference_type, created_at)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                        [
                            inv.user_id,
                            'profit',
                            profit.toFixed(2),
                            'USD',
                            'completed',
                            `Investment Profit - ${inv.plan} (${days} days)`,
                            inv.id,
                            'investment'
                        ]
                    );
                    
                    // Only add remaining profit to balance if daily profits were less than total profit
                    // This handles cases where daily profits weren't fully tracked
                    if (remainingProfit > 0.01) {
                        await pool.query(
                            'UPDATE users SET balance = balance + $1 WHERE id = $2',
                            [remainingProfit.toFixed(2), inv.user_id]
                        );
                        console.log(`[Profits] Added remaining profit ${remainingProfit.toFixed(2)} to balance for investment ${inv.id}`);
                    }
                    
                    transactionsCreated++;
                    console.log(`[Profits] Created matured profit transaction for investment ${inv.id}: $${profit.toFixed(2)}`);
                }
            } else if (profitDifference > 0.01 && !isNowMature && elapsed > 0) {
                // For ongoing investments, create daily profit transactions
                // Only create if profit increased and investment is still active
                const dailyProfit = base * rate;
                
                // Check if we already created a transaction for today for this investment
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStart = today.getTime() / 1000; // Convert to seconds for PostgreSQL
                
                const { rows: todayTransactions } = await pool.query(
                    `SELECT id FROM transactions 
                     WHERE user_id = $1 AND type = $2 AND reference_id = $3 
                     AND description LIKE $4
                     AND created_at >= to_timestamp($5)`,
                    [inv.user_id, 'profit', inv.id, `Daily Profit - ${inv.plan}%`, todayStart]
                );
                
                if (todayTransactions.length === 0 && dailyProfit > 0.01) {
                    // Create daily profit transaction
                    await pool.query(
                        `INSERT INTO transactions (user_id, type, amount, currency, status, description, reference_id, reference_type, created_at)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                        [
                            inv.user_id,
                            'profit',
                            dailyProfit.toFixed(2),
                            'USD',
                            'completed',
                            `Daily Profit - ${inv.plan}`,
                            inv.id,
                            'investment'
                        ]
                    );
                    
                    // Update user balance with daily profit
                    await pool.query(
                        'UPDATE users SET balance = balance + $1 WHERE id = $2',
                        [dailyProfit.toFixed(2), inv.user_id]
                    );
                    
                    transactionsCreated++;
                    console.log(`[Profits] Created daily profit transaction for investment ${inv.id}: $${dailyProfit.toFixed(2)}`);
                }
            }
        }
        
        lastProfitUpdate = now;
        console.log(`[Profits] Updated ${investments.length} investments. ${maturedInvestments} matured, ${transactionsCreated} transactions created.`);
        res.json({ 
            message: 'Profits updated successfully', 
            matured: maturedInvestments,
            transactionsCreated: transactionsCreated 
        });
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
        
        // Get deposits (all statuses for transaction history)
        const { rows: deposits } = await pool.query(
            'SELECT * FROM deposits WHERE user_id = $1 ORDER BY created_at DESC',
            [user.id]
        );
        
        // Get transactions (bonuses, etc.)
        const { rows: transactions } = await pool.query(
            'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
            [user.id]
        );
        
        // Calculate total_deposits from approved deposits only
        const { rows: approvedDeposits } = await pool.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE user_id = $1 AND status = $2',
            [user.id, 'approved']
        );
        const calculatedTotalDeposits = Number(approvedDeposits[0]?.total || 0);
        
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
        
        // Format deposits for frontend
        const formattedDeposits = deposits.map(dep => ({
            id: dep.id,
            amount: Number(dep.amount),
            currency: dep.currency || 'USD',
            transactionHash: dep.transaction_hash || '',
            proof: dep.proof || '',
            status: dep.status || 'pending',
            createdAt: dep.created_at.getTime(),
            timestamp: dep.created_at.getTime()
        }));
        
        // Format transactions for frontend
        const formattedTransactions = transactions.map(txn => ({
            id: txn.id,
            type: txn.type,
            amount: Number(txn.amount),
            currency: txn.currency || 'USD',
            status: txn.status || 'completed',
            description: txn.description || '',
            createdAt: txn.created_at.getTime(),
            timestamp: txn.created_at.getTime()
        }));
        
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const referralLink = user.referral_code ? `${baseUrl}/register.html?ref=${user.referral_code}` : '';

        const responseData = {
            email: user.email, 
            name: user.name || '', 
            profileImage: user.profile_image || '',
            investments: formattedInvestments,
            deposits: formattedDeposits,
            transactions: formattedTransactions,
            totalProfit: profits.totalProfit,
            totalBalance: balance + profits.totalProfit,
            totalInvestment: totalInvestment,
            bonus: bonus,
            totalDeposits: calculatedTotalDeposits,
            dailyEarnings: profits.dailyEarnings,
            balance: balance,
            adminApproved: user.admin_approved || false,
            phone: user.phone || '',
            country: user.country || '',
            referralCode: user.referral_code || '',
            referralLink,
            kycStatus: user.kyc_status || 'pending',
            kycFullName: user.kyc_full_name || '',
            kycFrontUrl: user.kyc_front_url || '',
            kycBackUrl: user.kyc_back_url || '',
            verified: !!user.verified
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
        
        // Get deposits (all statuses for transaction history)
        const { rows: deposits } = await pool.query(
            'SELECT * FROM deposits WHERE user_id = $1 ORDER BY created_at DESC',
            [user.id]
        );
        
        // Get transactions (bonuses, etc.)
        const { rows: transactions } = await pool.query(
            'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
            [user.id]
        );
        
        console.log(`[API] User ${user.id} (${user.email}) - Found ${transactions.length} transactions`);
        if (transactions.length > 0) {
            console.log('[API] Sample transaction:', transactions[0]);
            // Log registration bonuses specifically
            const regBonuses = transactions.filter(t => t.type === 'registration_bonus');
            if (regBonuses.length > 0) {
                console.log(`[API] Found ${regBonuses.length} registration bonus(es):`, regBonuses);
            } else {
                console.log(`[API] No registration bonus found for user ${user.id}`);
            }
        }
        
        // Calculate total_deposits from approved deposits only
        const { rows: approvedDeposits } = await pool.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE user_id = $1 AND status = $2',
            [user.id, 'approved']
        );
        const calculatedTotalDeposits = Number(approvedDeposits[0]?.total || 0);
        
        // Calculate metrics
        const profits = await calculateUserProfits(user.id);
        const totalInvestment = Number(user.total_investment || 0);
        const balance = Number(user.balance || 0);
        const bonus = Number(user.bonus || 0);
        
        // Format data for frontend
        const formattedInvestments = investments.map(inv => {
            // Handle start_date - convert to timestamp if it's a Date object
            let startDate;
            if (inv.start_date instanceof Date) {
                startDate = inv.start_date.getTime();
            } else if (typeof inv.start_date === 'number') {
                startDate = inv.start_date;
            } else if (typeof inv.start_date === 'string') {
                startDate = new Date(inv.start_date).getTime();
            } else {
                startDate = Date.now();
            }
            
            return {
                plan: inv.plan,
                amount: Number(inv.amount),
                startDate: startDate,
                days: inv.days,
                profit: Number(inv.profit || 0),
                dailyPercent: Number(inv.daily_percent)
            };
        });
        
        const formattedWithdrawals = withdrawals.map(wd => {
            let timestamp;
            try {
                timestamp = wd.created_at instanceof Date ? wd.created_at.getTime() : new Date(wd.created_at).getTime();
            } catch (e) {
                timestamp = Date.now();
            }
            return {
                amount: Number(wd.amount),
                cryptoType: wd.crypto_type,
                walletAddress: wd.wallet_address,
                status: wd.status,
                timestamp: timestamp
            };
        });
        
        const formattedDeposits = deposits.map(dep => {
            let timestamp;
            try {
                timestamp = dep.created_at instanceof Date ? dep.created_at.getTime() : new Date(dep.created_at).getTime();
            } catch (e) {
                timestamp = Date.now();
            }
            return {
                id: dep.id,
                amount: Number(dep.amount),
                currency: dep.currency || 'USD',
                transactionHash: dep.transaction_hash || '',
                proof: dep.proof || '',
                status: dep.status || 'pending',
                createdAt: timestamp,
                timestamp: timestamp
            };
        });
        
        // Format transactions for frontend with better error handling
        const formattedTransactions = transactions.map(txn => {
            let timestamp;
            try {
                if (txn.created_at instanceof Date) {
                    timestamp = txn.created_at.getTime();
                } else if (typeof txn.created_at === 'string') {
                    timestamp = new Date(txn.created_at).getTime();
                } else if (typeof txn.created_at === 'number') {
                    timestamp = txn.created_at;
                } else {
                    timestamp = Date.now();
                }
                if (isNaN(timestamp)) {
                    timestamp = Date.now();
                }
            } catch (e) {
                console.error('[API] Error parsing transaction date:', e, txn);
                timestamp = Date.now();
            }
            
            return {
                id: txn.id,
                type: txn.type,
                amount: Number(txn.amount),
                currency: txn.currency || 'USD',
                status: txn.status || 'completed',
                description: txn.description || '',
                createdAt: timestamp,
                timestamp: timestamp
            };
        });
        
        console.log(`[API] Formatted ${formattedTransactions.length} transactions for user ${user.id}`);
        
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const referralLink = user.referral_code ? `${baseUrl}/register.html?ref=${user.referral_code}` : '';

        const { password: _, verification_token: __, reset_token: ___, ...userData } = {
            id: user.id,
            email: user.email,
            name: user.name,
            profileImage: user.profile_image || '',
            balance: balance,
            investments: formattedInvestments,
            withdrawals: formattedWithdrawals,
            deposits: formattedDeposits,
            transactions: formattedTransactions,
            totalProfit: profits.totalProfit,
            totalBalance: balance + profits.totalProfit,
            totalInvestment: totalInvestment,
            bonus: bonus,
            totalDeposits: calculatedTotalDeposits,
            dailyEarnings: profits.dailyEarnings,
            adminApproved: user.admin_approved || false,
            phone: user.phone || '',
            country: user.country || '',
            referralCode: user.referral_code || '',
            referralLink,
            referredBy: user.referred_by || null,
            kycStatus: user.kyc_status || 'pending',
            kycFullName: user.kyc_full_name || '',
            kycFrontUrl: user.kyc_front_url || '',
            kycBackUrl: user.kyc_back_url || '',
            verified: !!user.verified
        };
        
        res.json(userData);
    } catch (err) {
        console.error('[API] Get user API error:', err);
        console.error('[API] Error stack:', err.stack);
        res.status(500).json({ 
            message: 'Server error while fetching user data',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// POST invest (API version)
app.post('/api/invest', [
    body('email').isEmail().normalizeEmail(),
    body('plan').isIn(pricingPlanNames).withMessage('Invalid pricing option'),
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

        // Validate pricing selection
        const pricingOptions = await getPricingData();
        const selectedPlan = pricingOptions.find(option => option.name === plan);

        if (!selectedPlan) {
            return res.status(400).json({ message: 'Invalid pricing option' });
        }

        const minAmount = Number(selectedPlan.minAmount || 0);
        const hasUpperBound = selectedPlan.maxAmount !== null && selectedPlan.maxAmount !== undefined;
        const maxAmount = hasUpperBound ? Number(selectedPlan.maxAmount) : Number.MAX_SAFE_INTEGER;

        if (numericAmount < minAmount || numericAmount > maxAmount) {
            const minLabel = `$${minAmount.toLocaleString()}`;
            if (hasUpperBound) {
                const maxLabel = `$${Number(selectedPlan.maxAmount).toLocaleString()}`;
                return res.status(400).json({
                    message: `Amount must be between ${minLabel} and ${maxLabel} for ${plan}`
                });
            }
            return res.status(400).json({
                message: `Amount must be at least ${minLabel} for ${plan}`
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
        const dailyPercent = Number(selectedPlan.dailyPercent || 0);
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
        
        // Send investment creation email
        const investmentHtml = emailTemplates.investmentCreated.investmentCreated(
            user.email,
            numericAmount,
            plan,
            dailyPercent
        );
        await sendEmail(user.email, 'Investment Created Successfully', investmentHtml);
        
        console.log(`[API] Investment created successfully for user ${user.id}: $${numericAmount} in ${plan}`);
        
        // Get updated user data
        const { rows: updatedUsers } = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [user.id]
        );
        
        if (updatedUsers.length === 0) {
            console.error(`[API] User ${user.id} not found after investment creation`);
            return res.status(500).json({ message: 'Error retrieving updated user data' });
        }
        
        return res.json({ message: 'Investment successful', user: updatedUsers[0] });
    } catch (err) {
        console.error('[API] Investment error:', err);
        console.error('[API] Investment error stack:', err.stack);
        return res.status(500).json({ message: 'Server error: ' + (err.message || 'Unknown error') });
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

        // Track deposit as pending (DO NOT update balance yet)
        const proofPath = req.file ? `/uploads/proofs/${req.file.filename}` : null;
        const { rows: depositRows } = await pool.query(
            `INSERT INTO deposits (user_id, amount, currency, transaction_hash, proof, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [user.id, numericAmount, currency || 'USD', transactionHash || '', proofPath, 'pending']
        );

        // Send deposit notification email to user
        const depositHtml = emailTemplates.depositNotification.depositNotification(
            user.email, 
            numericAmount, 
            currency || 'USD', 
            'pending'
        );
        await sendEmail(user.email, 'Deposit Received - Under Review', depositHtml);

        // Send admin alert
        await sendAdminEmail(
            'New Deposit Pending Approval',
            `New deposit pending approval from ${user.email}`,
            'info',
            { email: user.email, amount: `$${numericAmount}`, currency: currency || 'USD', depositId: depositRows[0].id }
        );

        // Return success message indicating deposit is pending approval
        res.json({ 
            message: 'Deposit request submitted successfully. Your balance will be updated after admin approval.', 
            deposit: depositRows[0],
            status: 'pending'
        });
    } catch (err) {
        console.error('API Deposit error:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

// POST withdraw
// Contact form endpoint
app.post('/api/contact', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      message: errors.array()[0].msg,
      code: 'INVALID_INPUT'
    });
  }

  try {
    const { name, email, subject, message } = req.body;

    // Save to database
    await pool.query(
      'INSERT INTO contacts(name, email, subject, message, created_at) VALUES($1, $2, $3, $4, NOW())',
      [name, email, subject, message]
    );

    // Send notification email to support
    const emailHtml = `
      <div style="font-family: Inter, sans-serif; color: #222; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #008f3d; border-bottom: 2px solid #008f3d; padding-bottom: 10px;">New Contact Form Submission</h2>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p style="background: #fff; padding: 15px; border-radius: 4px; border-left: 4px solid #008f3d; margin-top: 10px;">
            ${message.replace(/\n/g, '<br>')}
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          This message was submitted through the RealSphere contact form.
        </p>
      </div>
    `;

    await sendEmail(
      'support@realsphereltd.com',
      `New Contact: ${subject}`,
      emailHtml
    );

    res.json({ 
      success: true, 
      message: 'Contact message received. We\'ll get back to you within 24 hours.'
    });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to process contact form. Please try again later.',
      code: 'SERVER_ERROR'
    });
  }
});

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

        // Calculate total available balance (balance + profit)
        const profits = await calculateUserProfits(user.id);
        const balance = Number(user.balance || 0);
        const totalAvailableBalance = balance + profits.totalProfit;

        if (numericAmount > totalAvailableBalance) {
            return res.status(400).json({ 
                message: `Insufficient balance. Available: $${totalAvailableBalance.toFixed(2)}` 
            });
        }

        // Record withdrawal
        const { rows: withdrawalRows } = await pool.query(
            `INSERT INTO withdrawals (user_id, amount, crypto_type, wallet_address, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [user.id, numericAmount, cryptoType, sanitizeString(walletAddress), 'pending']
        );

        // Send withdrawal notification email to user
        const withdrawalHtml = emailTemplates.withdrawalNotification.withdrawalNotification(
            user.email,
            numericAmount,
            cryptoType,
            'pending'
        );
        await sendEmail(user.email, 'Withdrawal Request Submitted', withdrawalHtml);

        // Send admin alert
        await sendAdminEmail(
            'New Withdrawal Request',
            `Withdrawal request from ${user.email}`,
            'info',
            { email: user.email, amount: `$${numericAmount}`, cryptoType, withdrawalId: withdrawalRows[0].id }
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

app.post('/api/user/:email/kyc', kycUpload, async (req, res) => {
    try {
        const { email } = req.params;
        const fullName = sanitizeString(req.body.fullName || '');

        if (!fullName) {
            return res.status(400).json({ message: 'Full name is required for KYC submission' });
        }

        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        const frontFile = req.files && req.files.kycFront ? req.files.kycFront[0] : null;
        const backFile = req.files && req.files.kycBack ? req.files.kycBack[0] : null;

        if (!frontFile || !backFile) {
            return res.status(400).json({ message: 'Front and back ID images are required' });
        }

        const frontPath = `/uploads/kyc/${frontFile.filename}`;
        const backPath = `/uploads/kyc/${backFile.filename}`;

        // Clean up previously uploaded files if they exist
        const previousFiles = [user.kyc_front_url, user.kyc_back_url]
            .filter(Boolean)
            .map(filePath => path.join(__dirname, 'public', filePath));

        for (const filePath of previousFiles) {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fsErr) {
                console.error('Failed to remove old KYC file:', fsErr.message);
            }
        }

        await pool.query(
            `UPDATE users
             SET kyc_full_name = $1,
                 kyc_front_url = $2,
                 kyc_back_url = $3,
                 kyc_status = $4,
                 kyc_submitted_at = NOW(),
                 kyc_reviewed_at = NULL,
                 kyc_reviewer_email = NULL
             WHERE id = $5`,
            [fullName, frontPath, backPath, 'submitted', user.id]
        );

        res.json({
            message: 'KYC documents submitted successfully. We will review them shortly.',
            kycStatus: 'submitted',
            kycFullName: fullName,
            kycFrontUrl: frontPath,
            kycBackUrl: backPath
        });
    } catch (err) {
        console.error('KYC submission error:', err);
        res.status(500).json({ message: 'Failed to submit KYC documents' });
    }
});

// Get pending KYC requests
app.get('/api/admin/kyc/pending', adminAuth, async (req, res) => {
    try {
        const { rows: kycRequests } = await pool.query(
            `SELECT id, email, name, kyc_full_name, kyc_front_url, kyc_back_url, 
                    kyc_status, kyc_submitted_at, kyc_reviewed_at, kyc_reviewer_email
             FROM users 
             WHERE kyc_status = 'submitted' 
             ORDER BY kyc_submitted_at DESC`
        );

        res.json({ kycRequests });
    } catch (err) {
        console.error('Admin KYC fetch error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/users/:id/kyc-status', adminAuth, [
    body('status').isIn(['approved', 'rejected']).withMessage('Invalid KYC status')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const { id } = req.params;
        const status = req.body.status;
        const reviewer = req.headers['x-admin-username'] || req.headers['username'] || 'admin';

        const { rows: users } = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await pool.query(
            `UPDATE users
             SET kyc_status = $1,
                 kyc_reviewed_at = NOW(),
                 kyc_reviewer_email = $2
             WHERE id = $3`,
            [status, reviewer, id]
        );

        res.json({ message: `KYC ${status} successfully`, kycStatus: status });
    } catch (err) {
        console.error('Admin KYC status update error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Legacy admin route (redirect to /api/admin/users for consistency)
app.get('/admin/users', adminAuth, async (req, res) => {
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
            'SELECT id, balance, bonus, admin_approved FROM users WHERE email = $1',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = users[0];
        
        // If already approved, just return success
        if (user.admin_approved) {
            return res.json({ message: 'User is already approved' });
        }
        
        // Update user to approved
        await pool.query(
            'UPDATE users SET admin_approved = true WHERE id = $1',
            [user.id]
        );
        
        // Give registration bonus if not already given
        const currentBonus = Number(user.bonus || 0);
        const registrationBonus = 5;
        
        if (currentBonus === 0) {
            console.log(`[Admin] Giving registration bonus of $${registrationBonus} to user ${user.id} (${email})`);
            
            // Add bonus to balance and record it
            await pool.query(
                'UPDATE users SET balance = balance + $1, bonus = $1 WHERE id = $2',
                [registrationBonus, user.id]
            );
            
            // Record registration bonus transaction
            const insertResult = await pool.query(
                `INSERT INTO transactions (user_id, type, amount, currency, status, description, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 RETURNING id, type, amount, currency, status, description, created_at`,
                [user.id, 'registration_bonus', registrationBonus, 'USD', 'completed', 'Registration Bonus - Welcome to RealSphere']
            );
            
            const createdTransaction = insertResult.rows[0];
            console.log(`[Admin] Registration bonus transaction created:`, createdTransaction);
            
            // Verify transaction was created by querying it back
            const { rows: verifyTransaction } = await pool.query(
                'SELECT * FROM transactions WHERE id = $1',
                [createdTransaction.id]
            );
            if (verifyTransaction.length > 0) {
                console.log(`[Admin] Verified transaction exists in database:`, verifyTransaction[0]);
            } else {
                console.error(`[Admin] ERROR: Transaction ${createdTransaction.id} not found after creation!`);
            }
        } else {
            console.log(`[Admin] User ${user.id} already has bonus of $${currentBonus}, skipping registration bonus`);
        }
        
        res.json({ message: 'User approved successfully. Registration bonus credited.' });
    } catch (err) {
        console.error('Admin approve error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// New API endpoint for approving users by ID
app.post('/api/admin/users/:id/approve', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);
        
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        const { rows: users } = await pool.query(
            'SELECT id, email, balance, bonus, admin_approved FROM users WHERE id = $1',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = users[0];
        
        // If already approved, just return success
        if (user.admin_approved) {
            return res.json({ message: 'User is already approved', alreadyApproved: true });
        }
        
        // Update user to approved
        await pool.query(
            'UPDATE users SET admin_approved = true WHERE id = $1',
            [user.id]
        );
        
        // Give registration bonus if not already given
        const currentBonus = Number(user.bonus || 0);
        const registrationBonus = 5;
        
        if (currentBonus === 0) {
            console.log(`[Admin] Giving registration bonus of $${registrationBonus} to user ${user.id} (${user.email})`);
            
            // Add bonus to balance and record it
            await pool.query(
                'UPDATE users SET balance = balance + $1, bonus = $1 WHERE id = $2',
                [registrationBonus, user.id]
            );
            
            // Record registration bonus transaction
            const insertResult = await pool.query(
                `INSERT INTO transactions (user_id, type, amount, currency, status, description, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 RETURNING id, type, amount, currency, status, description, created_at`,
                [user.id, 'registration_bonus', registrationBonus, 'USD', 'completed', 'Registration Bonus - Welcome to RealSphere']
            );
            
            const createdTransaction = insertResult.rows[0];
            console.log(`[Admin] Registration bonus transaction created:`, createdTransaction);
            
            // Verify transaction was created by querying it back
            const { rows: verifyTransaction } = await pool.query(
                'SELECT * FROM transactions WHERE id = $1',
                [createdTransaction.id]
            );
            if (verifyTransaction.length > 0) {
                console.log(`[Admin] Verified transaction exists in database:`, verifyTransaction[0]);
            } else {
                console.error(`[Admin] ERROR: Transaction ${createdTransaction.id} not found after creation!`);
            }
        } else {
            console.log(`[Admin] User ${user.id} already has bonus of $${currentBonus}, skipping registration bonus`);
        }
        
        res.json({ 
            message: 'User approved successfully. Registration bonus credited.',
            bonusCredited: currentBonus === 0
        });
    } catch (err) {
        console.error('Admin approve user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Backfill registration bonuses for already approved users
app.post('/api/admin/backfill-bonuses', adminAuth, async (req, res) => {
    try {
        // Get all approved users who don't have a registration bonus transaction
        const { rows: approvedUsers } = await pool.query(
            `SELECT u.id, u.email, u.bonus, u.admin_approved
             FROM users u
             WHERE u.admin_approved = true
             AND NOT EXISTS (
                 SELECT 1 FROM transactions t 
                 WHERE t.user_id = u.id 
                 AND t.type = 'registration_bonus'
             )
             ORDER BY u.id`
        );
        
        let bonusesCreated = 0;
        const registrationBonus = 5;
        
        for (const user of approvedUsers) {
            const currentBonus = Number(user.bonus || 0);
            
            // Only create bonus if user doesn't have it yet
            if (currentBonus === 0) {
                // Add bonus to balance and record it
                await pool.query(
                    'UPDATE users SET balance = balance + $1, bonus = $1 WHERE id = $2',
                    [registrationBonus, user.id]
                );
                
                // Record registration bonus transaction
                await pool.query(
                    `INSERT INTO transactions (user_id, type, amount, currency, status, description, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                    [user.id, 'registration_bonus', registrationBonus, 'USD', 'completed', 'Registration Bonus - Welcome to RealSphere']
                );
                
                bonusesCreated++;
                console.log(`[Backfill] Created registration bonus for user ${user.id} (${user.email})`);
            }
        }
        
        res.json({ 
            message: `Backfill completed. ${bonusesCreated} bonuses created for ${approvedUsers.length} approved users.`,
            bonusesCreated: bonusesCreated,
            usersProcessed: approvedUsers.length
        });
    } catch (err) {
        console.error('Backfill bonuses error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin stats endpoint
app.get('/api/admin/stats', adminAuth, async (req, res) => {
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
app.get('/api/admin/deposits/pending', adminAuth, async (req, res) => {
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
app.get('/api/admin/withdrawals/pending', adminAuth, async (req, res) => {
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

// Get confirmed deposits (approved)
app.get('/api/admin/deposits/confirmed', adminAuth, async (req, res) => {
    try {
        const { rows: deposits } = await pool.query(
            `SELECT d.*, u.email as user_email, u.name as user_name
             FROM deposits d 
             LEFT JOIN users u ON d.user_id = u.id 
             WHERE d.status = 'approved' 
             ORDER BY d.created_at DESC 
             LIMIT 100`
        );
        res.json({ deposits });
    } catch (err) {
        console.error('Confirmed deposits error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get confirmed withdrawals (approved)
app.get('/api/admin/withdrawals/confirmed', adminAuth, async (req, res) => {
    try {
        const { rows: withdrawals } = await pool.query(
            `SELECT w.*, u.email as user_email, u.name as user_name
             FROM withdrawals w 
             LEFT JOIN users u ON w.user_id = u.id 
             WHERE w.status = 'approved' 
             ORDER BY w.created_at DESC 
             LIMIT 100`
        );
        res.json({ withdrawals });
    } catch (err) {
        console.error('Confirmed withdrawals error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve deposit
app.post('/api/admin/deposits/:id/approve', adminAuth, async (req, res) => {
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
        
        // Check if deposit is already approved
        if (deposit.status === 'approved') {
            return res.status(400).json({ message: 'Deposit is already approved' });
        }
        
        // Only process if deposit was pending
        if (deposit.status === 'pending') {
            // Update deposit status to approved
            await pool.query(
                'UPDATE deposits SET status = $1 WHERE id = $2',
                ['approved', id]
            );
            
            // Update user balance and total_deposits
            await pool.query(
                'UPDATE users SET balance = balance + $1, total_deposits = total_deposits + $1 WHERE id = $2',
                [deposit.amount, deposit.user_id]
            );
            
            // Auto-add $5 bonus for first approved deposit
            const { rows: userData } = await pool.query(
                'SELECT bonus FROM users WHERE id = $1',
                [deposit.user_id]
            );
            
            if (userData.length > 0 && Number(userData[0].bonus || 0) === 0) {
                // Check if this is the first approved deposit
                const { rows: approvedCount } = await pool.query(
                    'SELECT COUNT(*) as count FROM deposits WHERE user_id = $1 AND status = $2',
                    [deposit.user_id, 'approved']
                );
                
                if (approvedCount[0].count === '1') {
                    await pool.query(
                        'UPDATE users SET bonus = 5, balance = balance + 5 WHERE id = $1',
                        [deposit.user_id]
                    );
                }
            }
        } else {
            // If deposit was rejected, just update status
            await pool.query(
                'UPDATE deposits SET status = $1 WHERE id = $2',
                ['approved', id]
            );
        }

        // Get user email for notification
        const { rows: users } = await pool.query(
            'SELECT email FROM users WHERE id = $1',
            [deposit.user_id]
        );

        if (users.length > 0) {
            // Send approval email to user
            const depositHtml = emailTemplates.depositNotification.depositNotification(
                users[0].email,
                Number(deposit.amount),
                deposit.currency || 'USD',
                'approved'
            );
            await sendEmail(users[0].email, 'Deposit Approved', depositHtml);
        }
        
        res.json({ message: 'Deposit approved successfully' });
    } catch (err) {
        console.error('Approve deposit error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject deposit
app.post('/api/admin/deposits/:id/reject', adminAuth, async (req, res) => {
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
        
        await pool.query(
            'UPDATE deposits SET status = $1 WHERE id = $2',
            ['rejected', id]
        );

        // Get user email for notification
        const { rows: users } = await pool.query(
            'SELECT email FROM users WHERE id = $1',
            [deposit.user_id]
        );

        if (users.length > 0) {
            // Send rejection email to user
            const depositHtml = emailTemplates.depositNotification.depositNotification(
                users[0].email,
                Number(deposit.amount),
                deposit.currency || 'USD',
                'rejected'
            );
            await sendEmail(users[0].email, 'Deposit Rejected', depositHtml);
        }

        res.json({ message: 'Deposit rejected' });
    } catch (err) {
        console.error('Reject deposit error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve withdrawal
app.post('/api/admin/withdrawals/:id/approve', adminAuth, async (req, res) => {
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
        
        // Check if withdrawal is already approved
        if (withdrawal.status === 'approved') {
            return res.status(400).json({ message: 'Withdrawal is already approved' });
        }
        
        // Only process if withdrawal was pending
        if (withdrawal.status === 'pending') {
            // Update withdrawal status
            await pool.query(
                'UPDATE withdrawals SET status = $1 WHERE id = $2',
                ['approved', id]
            );

            // Deduct withdrawal amount from user's balance
            await pool.query(
                'UPDATE users SET balance = balance - $1 WHERE id = $2',
                [withdrawal.amount, withdrawal.user_id]
            );

            // Create transaction record for the withdrawal
            await pool.query(
                `INSERT INTO transactions (user_id, type, amount, currency, status, description, reference_id, reference_type, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                [
                    withdrawal.user_id,
                    'withdrawal',
                    withdrawal.amount,
                    'USD',
                    'completed',
                    `Withdrawal - ${withdrawal.crypto_type} to ${withdrawal.wallet_address.substring(0, 10)}...`,
                    withdrawal.id,
                    'withdrawal'
                ]
            );
        }

        // Get user email for notification
        const { rows: users } = await pool.query(
            'SELECT email FROM users WHERE id = $1',
            [withdrawal.user_id]
        );

        if (users.length > 0) {
            // Send approval email to user
            const withdrawalHtml = emailTemplates.withdrawalNotification.withdrawalNotification(
                users[0].email,
                Number(withdrawal.amount),
                withdrawal.crypto_type,
                'approved'
            );
            await sendEmail(users[0].email, 'Withdrawal Approved', withdrawalHtml);
        }
        
        res.json({ message: 'Withdrawal approved successfully' });
    } catch (err) {
        console.error('Approve withdrawal error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject withdrawal
app.post('/api/admin/withdrawals/:id/reject', adminAuth, async (req, res) => {
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

        // Get user email for notification
        const { rows: users } = await pool.query(
            'SELECT email FROM users WHERE id = $1',
            [withdrawal.user_id]
        );

        if (users.length > 0) {
            // Send rejection email to user
            const withdrawalHtml = emailTemplates.withdrawalNotification.withdrawalNotification(
                users[0].email,
                Number(withdrawal.amount),
                withdrawal.crypto_type,
                'rejected'
            );
            await sendEmail(users[0].email, 'Withdrawal Rejected', withdrawalHtml);
        }
        
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

app.post('/api/admin/wallets', adminAuth, walletUpload.fields([
    { name: 'qr_code', maxCount: 1 },
    { name: 'logo', maxCount: 1 }
]), [
    body('coin_name').notEmpty(),
    body('address').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    
    try {
        // Ensure logo_url column exists
        try {
            await pool.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name = 'wallets' AND column_name = 'logo_url') THEN
                        ALTER TABLE wallets ADD COLUMN logo_url TEXT;
                    END IF;
                END $$;
            `);
        } catch (migrationErr) {
            console.warn('Logo URL column migration check:', migrationErr.message);
        }
        
        const { coin_name, address, qr_url, logo_url, id } = req.body;
        
        // Handle QR code file upload - use wallet-assets directory (tracked in git)
        let qrCodeUrl = qr_url || null;
        if (req.files && req.files['qr_code'] && req.files['qr_code'][0]) {
            qrCodeUrl = `/wallet-assets/${req.files['qr_code'][0].filename}`;
        }
        
        // Handle logo file upload - use wallet-assets directory (tracked in git)
        let logoUrl = logo_url || null;
        if (req.files && req.files['logo'] && req.files['logo'][0]) {
            logoUrl = `/wallet-assets/${req.files['logo'][0].filename}`;
        }
        
        // Check if wallet exists (by ID if provided, or by coin_name)
        let existing = [];
        if (id) {
            const { rows } = await pool.query('SELECT id FROM wallets WHERE id = $1', [id]);
            existing = rows;
        } else if (coin_name) {
            const { rows } = await pool.query('SELECT id FROM wallets WHERE coin_name = $1', [coin_name]);
            existing = rows;
        }
        
        if (existing.length > 0) {
            // Update existing - check if logo_url column exists before using it
            const { rows: columnCheck } = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'wallets' AND column_name = 'logo_url'
            `);
            
            if (columnCheck.length > 0) {
                // Column exists, use it - preserve existing URLs if new ones not provided
                // Use COALESCE to keep existing value if new value is null
                await pool.query(
                    'UPDATE wallets SET coin_name = $1, address = $2, qr_url = COALESCE(NULLIF($3, \'\'), qr_url), logo_url = COALESCE(NULLIF($4, \'\'), logo_url), updated_at = CURRENT_TIMESTAMP WHERE id = $5',
                    [coin_name, address, qrCodeUrl || null, logoUrl || null, existing[0].id]
                );
            } else {
                // Column doesn't exist, add it first
                await pool.query('ALTER TABLE wallets ADD COLUMN IF NOT EXISTS logo_url TEXT');
                await pool.query(
                    'UPDATE wallets SET coin_name = $1, address = $2, qr_url = COALESCE(NULLIF($3, \'\'), qr_url), logo_url = COALESCE(NULLIF($4, \'\'), logo_url), updated_at = CURRENT_TIMESTAMP WHERE id = $5',
                    [coin_name, address, qrCodeUrl || null, logoUrl || null, existing[0].id]
                );
            }
            res.json({ message: 'Wallet updated successfully' });
        } else {
            // Create new - check if logo_url column exists
            const { rows: columnCheck } = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'wallets' AND column_name = 'logo_url'
            `);
            
            if (columnCheck.length > 0) {
                // Column exists, use it
                await pool.query(
                    'INSERT INTO wallets (coin_name, address, qr_url, logo_url) VALUES ($1, $2, $3, $4)',
                    [coin_name, address, qrCodeUrl, logoUrl]
                );
            } else {
                // Column doesn't exist, add it first
                await pool.query('ALTER TABLE wallets ADD COLUMN IF NOT EXISTS logo_url TEXT');
                await pool.query(
                    'INSERT INTO wallets (coin_name, address, qr_url, logo_url) VALUES ($1, $2, $3, $4)',
                    [coin_name, address, qrCodeUrl, logoUrl]
                );
            }
            res.json({ message: 'Wallet added successfully' });
        }
    } catch (err) {
        console.error('Wallet management error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// ===== PROJECTS ROUTES =====
app.get('/api/projects', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const { rows: projects } = await pool.query(
            'SELECT id, title, description, image_url, slug, created_at FROM projects ORDER BY created_at DESC LIMIT $1',
            [limit]
        );
        res.json({ projects: projects || [] });
    } catch (err) {
        console.error('Get projects error:', err);
        res.status(500).json({ message: 'Server error', projects: [] });
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

app.post('/api/admin/projects', adminAuth, adminUpload.single('image'), [
    body('title').notEmpty(),
    body('slug').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    
    try {
        const { id, title, description, image_url, slug, content_html } = req.body;
        
        // Handle image file upload
        let imageUrl = image_url || null;
        if (req.file) {
            imageUrl = `/uploads/admin/${req.file.filename}`;
        }
        
        if (id) {
            // Update existing
            await pool.query(
                'UPDATE projects SET title = $1, description = $2, image_url = $3, slug = $4, content_html = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6',
                [title, description || null, imageUrl, slug, content_html || null, id]
            );
            res.json({ message: 'Project updated successfully' });
        } else {
            // Create new
            const { rows: newProject } = await pool.query(
                'INSERT INTO projects (title, description, image_url, slug, content_html) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [title, description || null, imageUrl, slug, content_html || null]
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

app.delete('/api/admin/projects/:id', adminAuth, async (req, res) => {
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

app.post('/api/admin/testimonials', adminAuth, adminUpload.single('image'), [
    body('name').notEmpty(),
    body('content').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    
    try {
        const { id, name, image_url, content } = req.body;
        
        // Handle image file upload
        let imageUrl = image_url || null;
        if (req.file) {
            imageUrl = `/uploads/admin/${req.file.filename}`;
        }
        
        if (id) {
            // Update existing
            await pool.query(
                'UPDATE testimonials SET name = $1, image_url = $2, content = $3 WHERE id = $4',
                [name, imageUrl, content, id]
            );
            res.json({ message: 'Testimonial updated successfully' });
        } else {
            // Create new
            const { rows: newTestimonial } = await pool.query(
                'INSERT INTO testimonials (name, image_url, content) VALUES ($1, $2, $3) RETURNING id',
                [name, imageUrl, content]
            );
            res.json({ message: 'Testimonial created successfully', id: newTestimonial[0].id });
        }
    } catch (err) {
        console.error('Testimonial management error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/admin/testimonials/:id', adminAuth, async (req, res) => {
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
        const limit = parseInt(req.query.limit) || 6;
        const { rows: news } = await pool.query(
            'SELECT id, title, summary, image_url, slug, date, created_at FROM news ORDER BY COALESCE(date, created_at) DESC LIMIT $1',
            [limit]
        );
        res.json({ news: news || [] });
    } catch (err) {
        console.error('Get news error:', err);
        res.status(500).json({ message: 'Server error', news: [] });
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

app.post('/api/admin/news', adminAuth, adminUpload.single('image'), [
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
        
        // Handle image file upload
        let imageUrl = image_url || null;
        if (req.file) {
            imageUrl = `/uploads/admin/${req.file.filename}`;
        }
        
        if (id) {
            // Update existing
            await pool.query(
                'UPDATE news SET title = $1, summary = $2, image_url = $3, slug = $4, content_html = $5 WHERE id = $6',
                [title, summary || null, imageUrl, slug, content_html, id]
            );
            res.json({ message: 'Article updated successfully' });
        } else {
            // Create new
            const { rows: newArticle } = await pool.query(
                'INSERT INTO news (title, summary, image_url, slug, content_html) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [title, summary || null, imageUrl, slug, content_html]
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

app.delete('/api/admin/news/:id', adminAuth, async (req, res) => {
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
app.post('/api/admin/upload-image', adminAuth, adminUpload.single('image'), (req, res) => {
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
app.get('/api/admin/users', adminAuth, async (req, res) => {
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

app.get('/api/admin/users/:id', adminAuth, async (req, res) => {
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

// Delete user endpoint
app.delete('/api/admin/users/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user exists
        const { rows: users } = await pool.query(
            'SELECT id, email FROM users WHERE id = $1',
            [id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = users[0];
        
        // Delete user (cascade will delete related investments, deposits, withdrawals)
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        
        // Send admin alert about user deletion
        await sendAdminEmail(
            'User Deleted',
            `User ${user.email} has been deleted from the system`,
            'warning',
            { userId: id, email: user.email }
        );
        
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/users/:id/update', adminAuth, [
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
    // First check if table exists, if not, wait a moment for schema to finish
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'investment_plans'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  investment_plans table not found, skipping plan initialization');
      return;
    }
    
    const upsertQuery = `
      INSERT INTO investment_plans (plan_name, min_amount, max_amount, daily_percent, duration, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (plan_name)
      DO UPDATE SET 
        min_amount = EXCLUDED.min_amount,
        max_amount = EXCLUDED.max_amount,
        daily_percent = EXCLUDED.daily_percent,
        duration = EXCLUDED.duration,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP;
    `;

    for (const plan of PRICING_PLANS) {
      try {
        await pool.query(upsertQuery, [
          plan.name,
          plan.minAmount,
          plan.maxAmount,
          plan.dailyPercent,
          plan.duration,
          true
        ]);
      } catch (err) {
        console.error('Error syncing pricing plan:', plan.name, err.message);
      }
    }

    try {
      const placeholders = PRICING_PLANS.map((_, idx) => `$${idx + 1}`).join(', ');
      await pool.query(
        `UPDATE investment_plans 
         SET is_active = FALSE 
         WHERE plan_name NOT IN (${placeholders})`,
        PRICING_PLANS.map(plan => plan.name)
      );
    } catch (err) {
      console.warn('Unable to deactivate legacy pricing plans:', err.message);
    }

    console.log('✅ Pricing catalog synchronized');
  } catch (err) {
    console.error('Investment plans init error:', err.message);
    // Don't crash - plans can be added manually later
  }
}

// Investment plans initialization is now handled in the main pool.connect() above

app.get('/api/admin/plans', adminAuth, async (req, res) => {
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

app.post('/api/admin/plans', adminAuth, [
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

app.delete('/api/admin/plans/:id', adminAuth, async (req, res) => {
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

// Global error handler (must be last middleware)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: 'Internal Server Error', message: err.message || 'An unexpected error occurred' });
});

// Broadcast email to all users (Admin only)
app.post('/api/admin/broadcast-email', adminAuth, [
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const { subject, message } = req.body;

        // Get all verified users
        const { rows: users } = await pool.query('SELECT email FROM users WHERE verified = TRUE');

        if (users.length === 0) {
            return res.json({ message: 'No verified users found', sent: 0 });
        }

        // Create HTML email
        const html = `
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', sans-serif; color: #222; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
                    .header { background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
                    .header h1 { color: #fff; margin: 0; font-size: 28px; }
                    .content { background: #fff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>RealSphere Announcement</h1>
                    </div>
                    <div class="content">
                        <p>${message.replace(/\n/g, '<br>')}</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} RealSphere. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send to all users (in production, consider rate limiting)
        let sent = 0;
        let failed = 0;

        for (const user of users) {
            const result = await sendEmail(user.email, subject, html);
            if (result.success) {
                sent++;
            } else {
                failed++;
            }
        }

        res.json({ 
            message: `Broadcast sent to ${sent} users${failed > 0 ? `, ${failed} failed` : ''}`, 
            sent, 
            failed,
            total: users.length
        });
    } catch (err) {
        console.error('Broadcast email error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 404 handler - must be after all routes (catch-all for unmatched routes)
app.use((req, res, next) => {
  // Skip if this is a static file request (handled by express.static)
  // Only handle routes that don't match any defined endpoints
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found', message: 'API endpoint not found', code: 'NOT_FOUND' });
  }
  
  // For non-API routes, serve 404.html
  const filePath = path.join(__dirname, 'public', '404.html');
  if (fs.existsSync(filePath)) {
    res.status(404).sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending 404 page:', err);
        res.status(404).send('404 - Page Not Found');
      }
    });
  } else {
    res.status(404).send('404 - Page Not Found');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
    console.log('✅ PostgreSQL database connected');
    console.log('Security features enabled: password hashing, rate limiting, input validation');
});
