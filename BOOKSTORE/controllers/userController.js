const User = require("../models/User");
const { createTokenForUser } = require("../services/authentication");

// ======================= Register User =======================

/**
 * Registers a new user.
 * - Validates required fields
 * - Creates user in database
 */
const registerUser = async (req, res, next) => {
  const { username, email, password, confirmPassword, role } = req.body;

  // Ensure all required fields are provided
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({
      message: "All fields (username, email, password) are required",
    });
  }

  // Create and save user (validation handled in schema)
  const newUser = await User.create({
    username,
    email,
    password,
    confirmPassword,
    role: role || "customer",
  });

  // console.log(newUser);
  next(); // Proceed to the next middleware (e.g. redirect, login, etc.)
};

// ======================= Login User =======================

/**
 * Logs in a user.
 * - Checks email and password
 * - Compares hashed password
 * - Sets JWT token in cookies
 */
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  // console.log(email);

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userName = user.username;
    const userId = user._id;

    // console.log(user);
    // console.log(userName);
    // console.log(userId);

    // Compare hashed password
    const isMatch = await user.comparePassword(password);

    // console.log(isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create and send token via cookie
    const token = createTokenForUser(user);
    res.cookie("token", token);
    // console.log(token);

    // Store user details in request for further use
    req.userName = userName;
    req.userId = userId;

    next(); // Proceed to next handler or redirect
  } catch (error) {
    return res.render("login", {
      error: "Incorrect Email or Password",
    });
  }
};

module.exports = { registerUser, loginUser };