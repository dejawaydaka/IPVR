# Railway CLI Usage

Railway CLI is now installed locally. Here's how to use it:

## 1. Login to Railway

```bash
npx railway login
```

This will open a browser window for authentication.

## 2. Link to Your Project

```bash
npx railway link
```

Select your project from the list.

## 3. Run the SQL Script

Once linked, you can run:

```bash
npx railway run psql $DATABASE_URL -f populate-content.sql
```

Or connect to the database:

```bash
npx railway connect postgres
```

Then in the psql prompt:
```sql
\i populate-content.sql
```

## Alternative: Use Railway Web Interface

1. Go to Railway dashboard
2. Select PostgreSQL service
3. Click "Query" tab
4. Copy/paste contents of `populate-content.sql`
5. Click "Run"

