require("dotenv").config();

const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;  

/**
 * Verifies a JWT token and returns the decoded payload.
 * @param {string} token - JWT token
 * @returns {Object} Decoded user payload
 * @throws Will throw if the token is invalid
 */
function validateToken(token) {
  return jwt.verify(token, secret);
}

/**
 * Middleware to attach user to `req.user` from a cookie token.
 * Useful for rendering EJS views where login info is optional.
 * 
 * @param {string} cookieName - Name of the cookie containing the token
 * @returns {Function} Express middleware
 */
function checkForAuthenticationCookie(cookieName) {
  return (req, res, next) => {
    const token = req.cookies[cookieName];

    if (!token) return next();

    try {
      const decoded = validateToken(token);
      req.user = decoded;
    } catch (error) {
      // Invalid token, continue without user
    }

    next();
  };
}

/**
 * Middleware to protect API routes.
 * Requires a valid token in the cookie.
 * Attaches user info to `req.user`, `req.userId`, and `req.role`.
 */
function verifyToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(403).render("403").json({ message: "Access denied. No token provided." });
    // return res.status(403).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = validateToken(token);
    req.user = decoded;
    req.userId = decoded._id;
    req.role = decoded.role;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    res.status(400).json({ message: "Invalid token" });
  }
}

module.exports = {
  checkForAuthenticationCookie,
  verifyToken,
};