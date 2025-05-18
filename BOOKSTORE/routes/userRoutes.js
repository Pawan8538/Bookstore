/**
 * userRoutes.js
 * -------------
 * Routes for user registration, login, logout, and role selection.
 * Supports both customers and authors.
 */

const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/userController");

/**
 * GET /user/role
 * Render a role selection page (customer or author).
 */
router.get("/role", (req, res) => {
  return res.render("role");
});

/**
 * GET /user/signup?role=customer|author
 * Render the signup form based on selected role.
 * Redirects to /user/role if no role is provided.
 */
router.get("/signup", (req, res) => {
  const { role } = req.query;
   // If no role in query, try to get it from cookie
   if (!role) {
    role = req.cookies.role;
  }
  if (!role) return res.redirect("/user/role"); // Ensure role is selected
  
  // Save role in cookie (for consistency)
  res.cookie("role", role, { httpOnly: true });

  res.render("signup", { role }); // Pass role to the signup view
});

/**
 * POST /user/signup
 * Handle user registration.
 * Redirects to login page after successful registration.
 */
router.post("/signup", registerUser, (req, res) => {
  return res.redirect("login");
});

/**
 * GET /user/login
 * Render the login form.
 */
router.get("/login", (req, res) => {
  return res.render("login");
});

/**
 * POST /user/login
 * Handle user login.
 * Redirects to customer home page after successful login.
 */
router.post("/login", loginUser, async (req, res) => {
  res.redirect("/api/books");
});

/**
 * POST /user/logout
 * Clear the JWT token cookie
 * Redirect to login page after logout.
 */
router.post("/logout", (req, res) => {
  res.clearCookie('token'); // Remove auth token

  res.redirect('/user/login'); // Redirect to login 
});

module.exports = router;