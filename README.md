# RealSphere Investment Platform

A modern investment platform built with Express.js, PostgreSQL, and a beautiful glassmorphism UI.

## 🚀 Features

- **Multi-page Dashboard** - Dashboard, Investments, Deposit, Withdraw, Settings
- **PostgreSQL Database** - Scalable database on Railway
- **Real-time Metrics** - Live investment tracking and profit calculations
- **File Upload** - Deposit proof upload support
- **Security** - Password hashing, rate limiting, input validation
- **Beautiful UI** - Green futuristic theme with liquid glass effects

## 📋 Prerequisites

- Node.js 14+ 
- PostgreSQL database (Railway recommended)
- npm or yarn

## 🛠️ Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/dejawaydaka/IPVR.git
   cd IPVR
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your PostgreSQL connection string:
   ```
   DATABASE_URL=postgresql://user:password@hostname:port/database
   PORT=3000
   ```

4. **Create database tables**
   Run the SQL schema file on your PostgreSQL database:
   ```bash
   psql $DATABASE_URL -f database/schema.sql
   ```
   Or connect to your Railway database and execute `database/schema.sql`.

5. **Start the server**
   ```bash
   npm start
   ```

   You should see:
   ```
   ✅ Connected to PostgreSQL
   Server running at http://localhost:3000
   ```

## 📁 Project Structure

```
IPVR/
├── server.js              # Express server with PostgreSQL
├── database/
│   └── schema.sql         # Database schema
├── public/
│   ├── dashboard/         # Multi-page dashboard
│   │   ├── index.html     # Main dashboard
│   │   ├── pricing.html
│   │   ├── deposit.html
│   │   ├── withdraw.html
│   │   ├── settings.html
│   │   ├── style.css      # Shared styles
│   │   └── script.js      # Shared scripts
│   └── ...                # Other static files
├── .env                   # Environment variables (not in git)
└── package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - User login

### User Data
- `GET /api/user/:email` - Get user data with metrics
- `GET /dashboard?email=...` - Get dashboard data
- `PUT /api/user/:email/update` - Update user settings

### Investments
- `POST /api/invest` - Create investment
- `POST /invest` - Legacy investment endpoint

### Deposits & Withdrawals
- `POST /api/deposit` - Process deposit (with file upload)
- `POST /api/withdraw` - Submit withdrawal

### Admin
- `GET /admin/users` - Get all users
- `POST /admin/approve` - Approve user account

## 🗄️ Database Schema

The platform uses 4 main tables:
- `users` - User accounts and balances
- `investments` - Investment records
- `deposits` - Deposit history
- `withdrawals` - Withdrawal requests

See `database/schema.sql` for complete schema.

## 🚢 Deployment on Railway

1. **Connect GitHub repository** to Railway
2. **Create PostgreSQL database** on Railway
3. **Set environment variables**:
   - `DATABASE_URL` (auto-set by Railway)
   - `PORT` (auto-set by Railway)
4. **Deploy** - Railway will auto-deploy on push

The database schema will be created automatically on first connection, or you can run `database/schema.sql` manually.

## 🔒 Security Features

- Password hashing with bcrypt
- Rate limiting (100 req/15min)
- Input validation with express-validator
- SQL injection prevention (parameterized queries)
- File upload validation

## 📝 License

ISC License

## 👥 Contributing

Contributions welcome! Please open an issue or pull request.

---

**Built with ❤️ using Express.js, PostgreSQL, and modern web technologies**

