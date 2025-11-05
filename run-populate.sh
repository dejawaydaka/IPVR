#!/bin/bash
# Script to populate database with content
# First login: npx railway login
# Then link: npx railway link
# Then run this script

echo "🚀 Running content population script via Railway..."
npx railway run psql $DATABASE_URL -f populate-content.sql

if [ $? -eq 0 ]; then
  echo "✅ Content population completed successfully!"
else
  echo "❌ Error running script. Make sure you're logged in and linked to your Railway project."
  echo "Run: npx railway login"
  echo "Then: npx railway link"
fi
