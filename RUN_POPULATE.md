# How to Run Content Population Script

## Option 1: Run on Railway (Recommended)

1. Go to your Railway dashboard
2. Select your PostgreSQL service
3. Click on the "Query" tab
4. Copy the entire contents of `populate-content.sql`
5. Paste it into the query editor
6. Click "Run" or press Ctrl+Enter
7. You should see success messages for each INSERT

## Option 2: Run via Railway CLI

If you have Railway CLI installed:

```bash
railway run psql -f populate-content.sql
```

## Option 3: Run Locally (if DATABASE_URL is set)

```bash
export DATABASE_URL="your-railway-database-url"
psql $DATABASE_URL -f populate-content.sql
```

## Option 4: Use Node.js Script

```bash
export DATABASE_URL="your-railway-database-url"
node populate-content.js
```

## What Gets Added

- **5 Projects** with images and detailed content
- **5 Testimonials** from satisfied investors
- **5 News Articles** about real estate trends

All content uses `ON CONFLICT` clauses, so it's safe to run multiple times - it will update existing content if slugs match.

## Verify Content

After running, check:
- Homepage: Projects, Testimonials, and News sections should display the new content
- Admin Panel: Projects, Testimonials, and News pages should show the new entries

