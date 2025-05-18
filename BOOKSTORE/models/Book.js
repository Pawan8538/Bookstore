const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  genre: {
    type: String,
  },
  stock: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  fileHash: {
    type: String,
    required: false, // only used for bulk uploads
  },  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"  // Reference to the User model
  },
  coverImageUrl: {
    type: String,
    required: false,
  },
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
    },
  ],
});

const Book = mongoose.model("book", bookSchema);

module.exports = Book;