#!/bin/sh
echo "Waiting for database to be ready..."

# Run the database migration required by Nakama using Railway's default database variable
/nakama/nakama migrate up --database.address "$DATABASE_URL"

echo "Starting Nakama server..."
# Start the Nakama server using the same Railway database connection
/nakama/nakama --config /nakama/data/local.yml --database.address "$DATABASE_URL"
