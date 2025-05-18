const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const Book = require("../models/Book");
const Cart = require("../models/Cart");

//Create a new book
const createBook = async (req, res, next) => {
  // console.log("Uploaded File:", req.file); // Log to see the file data
  const role = req.user?.role;
  if (role !== "admin") {
    return res.status(403).render("403");
  }
  const { title, author, price, genre, stock, description } = req.body;
  const userId = req.userId; // Getting userId from the token (set in the `verifyToken` middleware)
  if (!title || !author || !price || !genre || !stock || !description) {
    return res.status(400).json({ message: "All fields are required." });
  }
  const coverImageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Store the image URL (relative path)

  try {
    const book = new Book({
      title,
      author,
      price,
      genre,
      stock,
      userId,
      coverImageUrl,
      description,
    }); // Save the image URL along with other book details
    //userid need
    await book.save();

    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// upload file/collection of books

const uploadBooksFromJson = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    // Generate file hash to track uploads
    const filePath = path.join( __dirname, "..", "public", "uploads", req.file.filename );
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Create a hash of the file's content
    const hash = crypto.createHash("sha256").update(fileContent).digest("hex");

    const userId = req.user?._id;// Get user ID from token
    
    // Check if the user has already uploaded a file with the same content
    const existingUpload = await Book.findOne({ userId, fileHash: hash });
    if (existingUpload) {
      return res.status(409).send("You have already uploaded this file.");
    }

    const booksFromFile = JSON.parse(fileContent);

    if (!Array.isArray(booksFromFile)) {
      return res.status(400).send("JSON file must contain an array of books.");
    }

    const booksToInsert = booksFromFile.map((book) => {
      const { title, author, price, genre, stock, description, coverImageUrl } = book;

      if (!title || !author || !price || !genre || !stock || !description) {
        throw new Error("Missing required fields in one or more books.");
      }

      return { title, author, price, genre, stock, description, coverImageUrl, userId, fileHash: hash, // Store the hash to track the file
      };
    });

    await Book.insertMany(booksToInsert, { ordered: false });
    // console.log("Books inserted into DB:", booksToInsert.length);
    
    return next(); 
  } catch (err) {
    res.status(500).send("Upload error: " + err.message);
  }
};

// get all books home page
const getBooks = async (req, res, next) => {
  // const userId = req.params.userId;
  const role = req.user.role;
  try {
    const books = await Book.find();
    // res.status(200).json(books);
    res.locals.books = books;
    res.locals.role = role;
    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//userbooks books of one seller
const userBooks = async (req, res, next) => {
  // const id = req.user._id;
  const { userId, role } = req;
  const matchingBooks = [];
  let totalStock = 0;
  if (!userId) {
    return res.status(400).json({ message: "User information not found" });
  }

  try {
    // console.log("User ID:", userId);
    // console.log("Role:", role);

    const books = await Book.find();
    // const books = await Book.find().populate("userId");       //userId full info

    books.forEach((book) => {
      if (book.userId == userId) {
        matchingBooks.push(book); // Add the matching book to the array
      }
      if (book.userId == userId && book.stock) {
        totalStock += book.stock;
      }
    });
    // console.log(totalStock);
    const totalBooks = matchingBooks.length;
    // Store the books, userId, and role in res.locals
    res.locals.books = matchingBooks; //res.locals special obj to send variable to next/final middleware
    res.locals.userId = userId;
    res.locals.role = role;
    res.locals.totalBooks = totalBooks; // passing to dashboard
    res.locals.totalStock = totalStock;

    if (matchingBooks.length === 0) {
      return res.status(404).json({ message: "No books found for this user" });
    }

    next();
    // return res.status(200).json({ books, role });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};

// Update a book
const updateBook = async (req, res, next) => {
  const bookId = req.params.id;
  const { title, author, price, genre, stock, description } = req.body;
  // console.log("Book Id:", bookId);
  try {
    // Update the book by ID and return the updated book
    const book = await Book.findByIdAndUpdate(
      bookId,
      { title, author, price, genre, stock, description },
      { new: true }
    );

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a book
const deleteBook = async (req, res, next) => {
  const bookId = req.params.id;
  // console.log(bookId);

  try {
    const book = await Book.findByIdAndDelete(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    next();
    // res.status(200).json({ message: "Book deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Book route to display details and reviews of search
const getBookDetails = async (req, res, next) => {
   const searchQuery = req.query.query || '';
  
  try {
    const books = await Book.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { author: { $regex: searchQuery, $options: 'i' } },
        { genre: { $regex: searchQuery, $options: 'i' } }
      ]
    }).populate("reviews.user", "username");

    if (books.length === 0) {
      return res.status(200).render("no-result", { searchQuery });
    }

    res.locals.books = books;
    res.locals.searchQuery = searchQuery;
    next();
  } catch (error) {
    console.error(error);
    next(error);
    // res.status(500).send('Server error');
  }
};

// review book
const reviewBook = async (req, res, next) => {
  const bookId = req.params.id;
  try {
    const book = await Book.findById(bookId)
      .populate("reviews.user", "username")
      .lean();
    if (!book) {
      return res.status(404).send("Book not found");
    }
    res.locals.book = book;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

// Add review route
const addReview = async (req, res, next) => {
  const bookId = req.params.id;
  // console.log(bookId);
  const { rating, comment } = req.body;
  try {
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    book.reviews.push({ user: req.user._id, rating, comment });
    await book.save();
    res.locals.bookId = bookId;

    next();
    // res.redirect(`/api/books/review/${bookId}`); // Redirect back to the book details page
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// cart add/remove/clear
const addToCart = async (req, res, next) => {
  const userId = req.userId;
  const { bookId, title, price, stock, removeBookId, clearCart } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: No user ID found" });
  }

  try {
    // Find or create cart for this user
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    if (clearCart === "true") {
      // Clear the cart
      cart.items = [];
      await cart.save();
      return res.redirect("/api/books");
    }

    if (bookId) {
      // Add item only if it doesn't already exist in cart
      const exists = cart.items.some(item => item.bookId === bookId);
      if (!exists) {
        cart.items.push({ bookId, title, price, stock });
        await cart.save();
      }
      return res.redirect("/api/cart");
    }

    if (removeBookId) {
      // Remove item by bookId
      cart.items = cart.items.filter(item => item.bookId !== removeBookId);
      await cart.save();
      return res.redirect("/api/cart");
    }

    next();
    // If no valid action, send error
    return res.status(400).json({ message: "No valid cart operation specified" });
  } catch (err) {
    console.error("Error updating cart:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// to view added books in cart
const viewCart = async (req, res, next) => {
  try {
    const userId = req.userId;
    let cart = await Cart.findOne({ userId });

    // If no cart, send empty array
    const items = cart ? cart.items : [];
    res.locals.cart = items;
    next();
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).send("Server error");
  }
}

const buyBook = async (req, res, next) => {
  const bookId = req.params.bookId;
  try {
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).send('Book not found');
    }
    res.locals.book = book;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
}

module.exports = {
  createBook,
  uploadBooksFromJson,
  getBooks,
  userBooks,
  updateBook,
  deleteBook,
  getBookDetails,
  reviewBook,
  addReview,
  addToCart,
  viewCart,
  buyBook,
};