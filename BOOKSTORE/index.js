const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const bookRoutes = require("./routes/bookRoutes");
const { checkForAuthenticationCookie } = require("./middleware/authentication");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(checkForAuthenticationCookie("token"));

app.use(express.static(path.resolve("./public")));

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// Allows support for PUT and DELETE via forms (since HTML forms only support GET/POST).
app.use(methodOverride("_method"));

app.use("/api", bookRoutes);
app.use("/user", userRoutes);

// 404 handler (keep this at the very bottom)
app.use((req, res) => {
  res.status(404).render("404");
});

// 500 - Internal Server Error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("500");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});