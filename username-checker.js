#!/usr/bin/env node

/**
 * Username Generator & Checker
 * Generates all possible 1-4 character usernames and checks availability on GitHub
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const VALID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const MAX_LENGTH = 4;
const OUTPUT_FILE = 'available-usernames.json';
const LOG_FILE = 'checker-progress.log';

let checkedCount = 0;
let availableCount = 0;
const availableUsernames = [];

/**
 * Generate all possible usernames from 1 to MAX_LENGTH characters
 */
function* generateUsernames() {
  for (let length = 1; length <= MAX_LENGTH; length++) {
    yield* generateOfLength(length);
  }
}

/**
 * Generate all combinations of a specific length
 */
function* generateOfLength(length) {
  const indices = new Array(length).fill(0);
  
  while (true) {
    yield indices.map(i => VALID_CHARS[i]).join('');
    
    // Increment indices
    let pos = length - 1;
    while (pos >= 0) {
      indices[pos]++;
      if (indices[pos] < VALID_CHARS.length) {
        break;
      }
      indices[pos] = 0;
      pos--;
    }
    
    // If we've cycled through all, we're done
    if (pos < 0) break;
  }
}

/**
 * Check if username is available on GitHub
 */
async function isAvailable(username) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    return response.status === 404;
  } catch (error) {
    console.error(`Error checking ${username}:`, error.message);
    return null;
  }
}

/**
 * Log progress to file
 */
function logProgress(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

/**
 * Save results to file
 */
function saveResults() {
  const data = {
    timestamp: new Date().toISOString(),
    totalChecked: checkedCount,
    availableCount: availableCount,
    availableUsernames: availableUsernames.sort(),
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  logProgress(`Results saved to ${OUTPUT_FILE}`);
}

/**
 * Main checker function
 */
async function main() {
  logProgress('='.repeat(60));
  logProgress('Starting username auto-checker...');
  logProgress(`Will check all 1-${MAX_LENGTH} character combinations`);
  logProgress('This may take a while due to GitHub API rate limiting...');
  logProgress('='.repeat(60));
  
  const generator = generateUsernames();
  const DELAY_MS = 100; // Delay between requests to avoid rate limiting
  const CHECK_INTERVAL = 100; // Save progress every N checks
  
  for (const username of generator) {
    try {
      const available = await isAvailable(username);
      checkedCount++;
      
      if (available) {
        availableUsernames.push(username);
        availableCount++;
        logProgress(`✓ AVAILABLE: ${username}`);
      }
      
      // Show progress every CHECK_INTERVAL checks
      if (checkedCount % CHECK_INTERVAL === 0) {
        logProgress(`Progress: ${checkedCount} checked, ${availableCount} available`);
      }
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      
    } catch (error) {
      logProgress(`Error processing ${username}: ${error.message}`);
    }
  }
  
  logProgress('='.repeat(60));
  logProgress('Checking complete!');
  logProgress(`Total checked: ${checkedCount}`);
  logProgress(`Available usernames found: ${availableCount}`);
  logProgress('='.repeat(60));
  
  saveResults();
  
  if (availableUsernames.length > 0) {
    console.log('\n📋 Available Usernames:');
    availableUsernames.sort().forEach(u => console.log(`  - ${u}`));
  }
}

/**
 * CLI Handler
 */
async function handleCLI() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'start') {
    await main();
  } else if (args[0] === 'help') {
    console.log('Usage: node username-checker.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  start              Start auto-checking all usernames (default)');
    console.log('  help               Show this help message');
    console.log('');
    console.log('Output files:');
    console.log(`  ${OUTPUT_FILE}        Available usernames (JSON format)`);
    console.log(`  ${LOG_FILE}           Detailed progress log`);
  } else {
    console.error(`Unknown command: ${args[0]}`);
    console.error('Use "help" for available commands');
  }
}

if (require.main === module) {
  handleCLI();
}

module.exports = {
  generateUsernames,
  isAvailable,
};
