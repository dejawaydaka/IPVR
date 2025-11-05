# Quick Start: Populate Database Content

## Step 1: Login to Railway
```bash
npx railway login
```
(This will open a browser window - complete the authentication)

## Step 2: Link Your Project
```bash
npx railway link
```
(Select your project from the list)

## Step 3: Run the Population Script
```bash
npx railway run psql $DATABASE_URL -f populate-content.sql
```

Or use the helper script:
```bash
./run-populate.sh
```

## What This Adds

✅ **5 Projects** with images:
- Luxury Residential Complex - Sunset Hills
- Commercial Office Tower - Tech Hub Plaza
- Mixed-Use Development - Riverside Quarter
- Smart Home Community - Green Valley Estates
- Luxury Hotel & Residences - Grand Plaza

✅ **5 Testimonials** with images:
- Sarah Johnson
- Michael Chen
- Emily Rodriguez
- David Thompson
- Jennifer Martinez

✅ **5 News Articles** with images:
- Real Estate Market Shows Strong Growth in Q1 2025
- Sustainable Building Practices Transform Real Estate Investment
- Technology Integration Reshapes Commercial Real Estate
- Urban Redevelopment Projects Drive Economic Growth
- Rental Market Stability Signals Strong Investment Climate

## Verify

After running, check your homepage - the Projects, Testimonials, and News sections should display the new content!

