const crypto = require('crypto');

/**
 * Generate a readable random password.
 * Format: 3 words + 2 digits (e.g., "sol-luna-42")
 */
function generatePassword(length = 10) {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[crypto.randomInt(chars.length)];
  }
  return password;
}

/**
 * Generate a username from team name.
 * Converts to lowercase, removes special chars, replaces spaces with underscores.
 */
function generateUsername(teamName) {
  return teamName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '')     // Remove special chars
    .replace(/\s+/g, '_')            // Spaces to underscores
    .substring(0, 50);               // Truncate
}

module.exports = { generatePassword, generateUsername };
