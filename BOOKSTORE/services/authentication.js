/**
 * authentication.js
 * -----------------
 * Service module to handle JWT token creation and validation for user authentication.
 * 
 * Exports:
 * - createTokenForUser(user): Generates a signed JWT token with user info.
 * - validateToken(token): Verifies the token and returns the payload.
*/
require("dotenv").config();

const JWT = require("jsonwebtoken");

// Secret key used for signing and verifying JWTs
const secret = process.env.JWT_SECRET;

/**
 * Generates a JWT token for a given user.
 * @param {Object} user - The user object.
 * @returns {string} JWT token
 */
function createTokenForUser(user) {
  const payload = {
    _id: user._id,
    email: user.email,
    role: user.role,
  };

  try {
    const token = JWT.sign(payload, secret); // Sign payload using secret
    return token;
  } catch (error) {
    console.error("Token generation failed:", error);
  }
}

/**
 * Verifies a JWT token.
 * @param {string} token - The JWT token.
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid
 */
function validateToken(token) {
  const payload = JWT.verify(token, secret); // Verify token using secret
  return payload;
}

module.exports = {
  createTokenForUser,
  validateToken,
};