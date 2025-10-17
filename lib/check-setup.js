#!/usr/bin/env node

/**
 * Quick setup verification script
 * Run with: node lib/check-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🌟 Slime-chan Setup Checker\n');

let allGood = true;

// Check for .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file exists');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check for required Postgres variables
  const requiredPostgres = ['POSTGRES_URL', 'POSTGRES_HOST', 'POSTGRES_DATABASE'];
  const missingPostgres = requiredPostgres.filter(key => !envContent.includes(key + '='));
  
  if (missingPostgres.length === 0) {
    console.log('✅ Postgres environment variables found');
  } else {
    console.log('❌ Missing Postgres variables:', missingPostgres.join(', '));
    allGood = false;
  }
  
  // Check for required KV variables
  const requiredKV = ['KV_REST_API_URL', 'KV_REST_API_TOKEN'];
  const missingKV = requiredKV.filter(key => !envContent.includes(key + '='));
  
  if (missingKV.length === 0) {
    console.log('✅ KV (Redis) environment variables found');
  } else {
    console.log('❌ Missing KV variables:', missingKV.join(', '));
    allGood = false;
  }
} else {
  console.log('❌ .env.local file not found');
  console.log('   Run: vercel env pull .env.local');
  allGood = false;
}

// Check for node_modules
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ node_modules installed');
  
  // Check for specific packages
  const requiredPackages = ['@vercel/postgres', '@vercel/kv', 'bcrypt'];
  const missingPackages = requiredPackages.filter(pkg => 
    !fs.existsSync(path.join(nodeModulesPath, pkg))
  );
  
  if (missingPackages.length === 0) {
    console.log('✅ All required packages installed');
  } else {
    console.log('❌ Missing packages:', missingPackages.join(', '));
    console.log('   Run: yarn add @vercel/postgres @vercel/kv bcrypt');
    allGood = false;
  }
} else {
  console.log('❌ node_modules not found');
  console.log('   Run: yarn install');
  allGood = false;
}

// Check for schema file
const schemaPath = path.join(__dirname, 'db-schema.sql');
if (fs.existsSync(schemaPath)) {
  console.log('✅ Database schema file exists');
} else {
  console.log('⚠️  Database schema file not found (this is unusual)');
}

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('🎉 Setup looks good!');
  console.log('\nNext steps:');
  console.log('1. Make sure you ran the database schema (see SETUP_AUTH.md)');
  console.log('2. Run: yarn dev');
  console.log('3. Visit http://localhost:3000');
} else {
  console.log('⚠️  Some issues found. Please fix them and try again.');
  console.log('\nSee SETUP_AUTH.md for detailed setup instructions.');
}

console.log('='.repeat(50) + '\n');
