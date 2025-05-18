const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  bookId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    unique: true
  },
  items: [cartItemSchema]
});

// Create a compound index so each user can only have one of each book
cartSchema.index({ userId: 1, "items.bookId": 1 }, { unique: true });

const Cart = mongoose.model("cart", cartSchema);
module.exports = Cart;
