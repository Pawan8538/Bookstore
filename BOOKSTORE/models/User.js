const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer",
    },
  });

// Hash password before saving user
userSchema.pre("save", async function (next) {   //before saving
  if (this.isModified("password")) {             // Only hash the password if it's new or modified
    this.password = await bcrypt.hash(this.password, 10);     //hasing and add salt of 10
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {           //matching user password
  return bcrypt.compare(password, this.password);
};


// const plainPassword = "123456";
// const hashedPassword = bcrypt.hashSync(plainPassword, 10); // Hashing the password with 10 salt rounds

// console.log(hashedPassword); 
const User = mongoose.model("user", userSchema);

module.exports = User;