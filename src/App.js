import React, { useState, useEffect } from "react";
import axios from "axios";
import Login from "./Login";
import "./App.css";

const API = "http://localhost:5000";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [newBook, setNewBook] = useState({ title: "", author: "", category: "" });
  const [selectedCategory, setSelectedCategory] = useState("All");

  const token = localStorage.getItem("token");
  const headers = { Authorization: token };

  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/books`, { headers }).then((res) => setBooks(res.data));
  }, [isLoggedIn]);

  // Add book
  const handleAddBook = async () => {
    const { title, author, category } = newBook;
    if (!title || !author) return alert("Provide title & author");
    const res = await axios.post(`${API}/books`, { title, author, category }, { headers });
    setBooks((prev) => [...prev, res.data]);
    setNewBook({ title: "", author: "", category: "" });
  };

  // Issue/Return
  const handleToggle = async (book) => {
    const issuedTo = book.available ? prompt("Enter student name") : "";
    const updated = { available: !book.available, issuedTo };
    await axios.put(`${API}/books/${book.id}`, updated, { headers });
    setBooks((prev) => prev.map((b) => (b.id === book.id ? { ...b, ...updated } : b)));
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this book?")) return;
    await axios.delete(`${API}/books/${id}`, { headers });
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const categoryCounts = books.reduce((acc, b) => {
    const c = b.category || "Uncategorized";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const categories = ["All", ...Object.keys(categoryCounts)];

  const filteredBooks = books.filter((b) => {
    const inCategory = selectedCategory === "All" || b.category === selectedCategory;
    const q = search.trim().toLowerCase();
    return inCategory && (q === "" || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.category.toLowerCase().includes(q));
  });

  if (!isLoggedIn) return <Login onLogin={setIsLoggedIn} />;

  return (
    <div className="App">
      <h1 style={{ textAlign: "center" }}>📚 Library Management System</h1>

      <div className="controls">
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="category-bar">
          <strong>Categories:</strong>
          {categories.map((cat) => (
            <button key={cat} className={selectedCategory === cat ? "cat-btn active" : "cat-btn"} onClick={() => setSelectedCategory(cat)}>
              {cat} {cat !== "All" ? `(${categoryCounts[cat]})` : `(${books.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="add-book">
        <input value={newBook.title} onChange={(e) => setNewBook((s) => ({ ...s, title: e.target.value }))} placeholder="Title" />
        <input value={newBook.author} onChange={(e) => setNewBook((s) => ({ ...s, author: e.target.value }))} placeholder="Author" />
        <input value={newBook.category} onChange={(e) => setNewBook((s) => ({ ...s, category: e.target.value }))} placeholder="Category" />
        <button onClick={handleAddBook}>Add</button>
      </div>

      <table className="book-table">
        <thead>
          <tr>
            <th>ID</th><th>Title</th><th>Author</th><th>Category</th><th>Status</th><th>Issued To</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredBooks.length === 0 ? <tr><td colSpan="7">No books found</td></tr> :
            filteredBooks.map((book) => (
              <tr key={book.id}>
                <td>{book.id}</td><td>{book.title}</td><td>{book.author}</td><td>{book.category}</td>
                <td>{book.available ? "✅ Available" : "❌ Issued"}</td>
                <td>{book.issuedTo || "-"}</td>
                <td>
                  <button onClick={() => handleToggle(book)}>{book.available ? "Issue" : "Return"}</button>
                  <button className="delete" onClick={() => handleDelete(book.id)}>Delete</button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

export default App;
