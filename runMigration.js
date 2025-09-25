require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function runMigration() {
    try {
        const migrationPath = path.join(__dirname, '../db/migrations/018_add_coins_to_users.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('Running migration: 018_add_coins_to_users.sql');
        await pool.query(migrationSQL);
        console.log('Migration completed successfully!');
        
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();