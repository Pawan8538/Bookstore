/**
 * bookRoutes.js
 * -------------
 * Handles all book-related routes:
 * - Viewing, creating, updating, deleting books
 * - Uploading books via form or JSON
 * - Book reviews, cart management
 * - Search functionality
 */

const express = require("express");
const router = express.Router();
exports.router = router;
const {
  createBook, getBooks, userBooks, updateBook,
  deleteBook, addReview, getBookDetails,
  addToCart, viewCart, uploadBooksFromJson,
  buyBook,
  reviewBook
} = require("../controllers/bookController");

const { verifyToken } = require("../middleware/authentication");
const upload = require("../services/imageHandler");
const Book = require("../models/Book");

// =================== Public and Customer Routes ===================

/**
 * GET /api/books
 * Show all books on home page.
 */
router.get("/books", getBooks, (req, res) => {
  const { books, role, searchQuery } = res.locals;
  return res.render("home", { books, role, searchQuery });
});

/**
 * GET /api/about
 * Show about page
 */
router.get("/about", (req, res) => {
  const role = req.user;
  res.render("about", { role });
});

/**
 * GET /api/book/review/:id
 * Show detailed view of a single book and its reviews.
 */
router.get("/book/review/:id", reviewBook, (req, res) => {
  const { book } = res.locals;
  res.render("review", { book, req });
});

/**
 * POST /api/books/review/:id
 * Add a review to the specified book.
 */
router.post("/book/review/:id", addReview, (req, res) => {
  const { bookId } = res.locals;
  res.redirect(`/api/book/review/${bookId}`);
});

/**
 * GET /api/cart
 * View shopping cart items.
 */
router.get("/cart", verifyToken, viewCart, async (req, res) => {
  const cart = res.locals.cart;
  const { role } = req.user;
  res.render("cart", { cart, role });
});

/**
 * POST /api/cart
 * Add an item to the shopping cart.
 */
router.post("/cart", verifyToken, addToCart, async (req, res) => {
  res.redirect('/api/books');
});


// =================== Admin/Author Routes ===================

/**
 * GET /api/dashboard
 * Render dashboard showing author stats (requires login).
 */
router.get("/dashboard", verifyToken, userBooks, (req, res) => {
  const { userId, role, totalBooks, totalStock } = res.locals;
  if (role !== "admin") {
    return res.status(403).render("403");
  }
  return res.render("admin", { role, userId, totalBooks, totalStock });
});

/**
 * GET /api/create
 * Render book creation form.
 */
router.get("/create", (req, res) => {
  const role = req.user?.role;
  if (role !== "admin") {
    return res.status(403).render("403");
  }
  res.render("create");
});

/**
 * POST /api/create
 * Create a new book with image upload (requires login).
 */
router.post("/create", verifyToken, upload.single("coverImageUrl"), createBook, async (req, res) => {
  res.status(201).redirect("/api/admin-collection");
});

/**
 * GET /api/upload-books
 * Render form to upload books via JSON.
 */
router.get("/upload-books", (req, res) => {
  // const { books, role, userId } = res.locals;
  const { role, } = req.user;
  if (role !== "admin") {
    return res.status(403).render("403");
  }
  res.render("upload-books", { role });
});

/**
 * POST /api/upload-json
 * Bulk upload books from a JSON file (requires login).
 */
router.post("/upload-json", verifyToken, upload.single("jsonFile"), uploadBooksFromJson, async (req, res) => {
  const { role } = req.user;
  if (role !== "admin") {
    return res.status(403).render("403");
  }
  res.redirect("/api/admin-collection");
});

/**
 * GET /api/admin-collection
 * Show all books created by the logged-in author.
 */
router.get("/admin-collection", verifyToken, userBooks, (req, res) => {
  const { books, userId, role } = res.locals;
  if (role !== "admin") {
    return res.status(403).render("403");
  }
  return res.render("admin-collection", {
    books,
    userId,
    role,
    excludeSearchForm: true,
    searchQuery: "",
  });
});

/**
 * GET /api/update/:id
 * Render book update form for a specific book.
 */
router.get("/update/:id", async (req, res) => {
  const { role } = req.user;
  if (role !== "admin") {
    return res.status(403).render("403");
  }
  try {
    const bookId = req.params.id;
    const book = await Book.findById(bookId);
    res.render("update", { bookId, book });
  } catch (error) {
    res.status(500).json({ message: "Error fetching the book" });
  }
});

/**
 * PATCH /api/update/:id
 * Update a specific book.
 */
router.patch("/update/:id", updateBook, async (req, res) => {
  const { role } = req.user;
  if (role !== "admin") {
    return res.status(403).render("403");
  }
  res.redirect("/api/admin-collection");
});

/**
 * DELETE /api/delete/:id
 * Delete a specific book.
 */
router.delete("/delete/:id", deleteBook, async (req, res) => {
  const { role } = req.user;
  if (role !== "admin") {
    return res.status(403).render("403");
  }
  res.redirect("/api/admin-collection");
});

// =================== Search Route ===================

/**
 * GET /api/books/:id/search?query=...
 * Search books by title, author, or genre.
 */
router.get('/books/search', getBookDetails, async (req, res) => {
  const { role } = req.user;
  const { books, searchQuery } = res.locals;
  res.render('searchResult', { books, searchQuery, role });
});

// Detail page route
router.get('/book/:id', async (req, res) => {
  const { role } = req.user;
  const { searchQuery } = req.query;
  const book = await Book.findById(req.params.id).populate('reviews.user');
  if (!book) return res.status(404).send("Book not found");
  res.render('bookDetail', { book, role, searchQuery });
});

// =================== Buy Route ===================

/**
 * GET /api/buy/:bookId
 * handel purchase
 */
router.get('/buy/:bookId', buyBook, async (req, res) => {
  const { book } = res.locals;
  const { role } = req.user;
  // Render the payment page with the book details
  res.render('payment', { book, role, });
});

// =================== Payment Route ===================

/**
 * POST /api/payment-confirm
 * confirm payment
 */
router.post('/payment-confirm', async(req, res) => {
  const { role } = req.user;

  res.render('confirmation', { message: 'Payment successful!', role, });
});

module.exports = router;