require('dotenv').config();
const { generateAccessToken, generateRefreshToken, hashRefreshToken, verifyToken } = require('./src/utils/tokenUtils');
const crypto = require('crypto');

console.log('Testing token generation and hashing...');

const userId = 1;

// 1. Login generates token and hash
const token = generateRefreshToken(userId);
const hash = hashRefreshToken(token);

console.log('Token generated:', token);
console.log('Hash generated (to DB):', hash);

// 2. Cookie sends token back
const decoded = verifyToken(token, process.env.REFRESH_SECRET);
console.log('Decoded token:', decoded);

// 3. Verify hash matches
const hashFromCookie = hashRefreshToken(token);
console.log('Hash from cookie:', hashFromCookie);
console.log('Matches DB hash?', hash === hashFromCookie);
