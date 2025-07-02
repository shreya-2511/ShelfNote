# 📚 ShelfNote

A full-stack web application that allows users to manage their personal library of books. Users can register and log in using either traditional email-password authentication or Google OAuth via Passport.js. After logging in, users can add, edit, view, and delete book entries. They can also fetch book details using an ISBN number via the Google Books API.

---

## 🔐 Authentication

- **Local Strategy (Email & Password)** — implemented using Passport.js and bcrypt for hashing.
- **Google OAuth 2.0** — allows users to log in via their Google account.

---

## ✍️ Features

✅ **User Authentication**  
✅ **Google OAuth2 Login**  
✅ **Secure Password Hashing with bcrypt**  
✅ **Session Management with express-session**  
✅ **CRUD operations for managing books**  
✅ **Fetch book details (title, author, image, description) using ISBN via Google Books API**  
✅ **Responsive UI with EJS and Bootstrap**  

---

## 📚 Book Functionality

After login, users can:
- 📝 Add a new book manually or auto-fill details using ISBN
- 🧾 View their book list
- ✏️ Edit any book entry
- ❌ Delete a book
- 🔍 View detailed information of a single book

---

## 🌐 Tech Stack

- **Backend:** Node.js, Express.js
- **Authentication:** Passport.js, Google OAuth2, bcrypt
- **Database:** PostgreSQL (pg library)
- **Templating:** EJS
- **Frontend:** Bootstrap, Custom CSS
- **API Integration:** Google Books API

---

## Preview
![Screenshot 2025-07-02 060343](https://github.com/user-attachments/assets/e194dafb-3de6-4a0b-a17a-cb9407a78a1c)



## 🛠️ Setup Instructions

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/book-notes-app.git
cd book-notes-app

```terminal
npm install express pg ejs bcrypt passport passport-local passport-google-oauth20 express-session dotenv

