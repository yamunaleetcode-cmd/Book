const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = "library_secret_key"; // for JWT

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Yamuna@42",
  database: "library_db",
  port:8502
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL");
});

// ---------------- Authentication ----------------

// Register (optional)
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "User registered" });
  });
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.query("SELECT * FROM users WHERE username=?", [username], async (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(401).json({ message: "User not found" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
  });
});

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "No token" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
};

// ---------------- Books ----------------

// Get all books
app.get("/books", authenticate, (req, res) => {
  db.query("SELECT * FROM books", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Add book
app.post("/books", authenticate, (req, res) => {
  const { title, author, category } = req.body;
  const sql = "INSERT INTO books (title, author, category, available, issuedTo) VALUES (?, ?, ?, true, '')";
  db.query(sql, [title, author, category], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: result.insertId, title, author, category, available: true, issuedTo: "" });
  });
});

// Update book (issue/return)
app.put("/books/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { available, issuedTo } = req.body;
  db.query("UPDATE books SET available=?, issuedTo=? WHERE id=?", [available, issuedTo, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ id, available, issuedTo });
  });
});

// Delete book
app.delete("/books/:id", authenticate, (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM books WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Deleted" });
  });
});

app.listen(5000, () => console.log("Server running on port 5000"));
