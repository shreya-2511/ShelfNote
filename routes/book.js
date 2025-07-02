// routes/book.js
import express from "express";
import fetch from "node-fetch";
const router = express.Router();

export default function (db) {

    router.get("/fetch-info", async (req, res) => {
    const { isbn } = req.query;
    if (!isbn) return res.status(400).json({ error: "ISBN is required." });

    try {
      const apiKey = process.env.API_KEY;
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`);
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return res.status(404).json({ error: "Book not found." });
      }

      const info = data.items[0].volumeInfo;

      res.json({
        title: info.title || "",
        author: info.authors?.join(", ") || "",
        image_url: info.imageLinks?.thumbnail || "",
        description: info.description || ""
      });

    } catch (error) {
      console.error("Error fetching from Google Books API:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/:username", async (req, res) => {
    if (req.isAuthenticated()) {
        console.log(req.user);

       if (req.user.username !== req.params.username) {
        return res.status(403).send("Access denied.");
      }
      try {
        const result = await db.query("SELECT * FROM books WHERE user_id = $1 ORDER BY date_read DESC",
             [req.user.id]);
        const bookList = result.rows;
        console.log("Book List:", bookList);
        res.render("books.ejs", {bookList: bookList, user: req.user});
      } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).send("Internal Server Error");
      }
    } else {
        console.log("U r not Registered or logged in");
      res.redirect("/login");
    }
  });

//   ADD BOOK

  router.get("/:username/add", (req, res) => {
    if (!req.isAuthenticated()) {
    return res.redirect("/login");
    }
    if (req.user.username !== req.params.username) {
        return res.status(403).send("Access denied.");
    }
    console.log(req.user);
    res.render("bookedit.ejs", { user: req.user, book:null });
  });

  router.post("/:username/add", async (req, res) => {
    const { title,  author,  image_url,
            date_read,  rating,  isbn,  short_review,
            short_note,description} = req.body;
    if (!req.isAuthenticated()) return res.redirect("/login");
    if (req.user.username !== req.params.username) {
      return res.status(403).send("Access denied.");
    }
    try {
        // console.log(req.user);
      await db.query("INSERT INTO books (title, author, image_url, date_read, rating, isbn, short_review, short_note, description,user_id )  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", 
          [
            title,  author || null,
            image_url || null,  date_read || null,
            rating ? parseInt(rating) : null,
            isbn || null,   short_review || null,
            short_note || null, description || null, req.user.id
          ]);
      res.redirect(`/books/${req.user.username}`);
    } catch (error) {
      console.error("Error adding book:", error);
      res.status(500).send("Internal Server Error");
    }
  });

// EDIT PROFILE

router.post('/:username/update', async (req, res) => {
  const { username, email } = req.body;

  if (!req.isAuthenticated()) return res.redirect("/login");
  if (req.user.username !== req.params.username) {
    return res.status(403).send("Access denied.");
  }
  try {
    await db.query("UPDATE users SET username = $1, email = $2 WHERE id = $3",
      [username, email, req.user.id]);

    req.user.username = username;
    req.user.email = email;

    res.redirect(`/books/${username}`); 
  } catch (err) {
    console.error("Profile update failed:", err);
    res.status(500).send("Internal Server Error");
  }
});

//   EDIT BOOK

  router.get("/:username/:id/edit" , async (req,res)=>{
    const {username,id} = req.params;
    if (!req.isAuthenticated()) return res.redirect("/login");
    if (req.user.username !== username) {
      return res.status(403).send("Access denied.");
    }
    console.log(req.params);
    try{
        const result = await db.query("SELECT * FROM books WHERE id=$1 AND user_id=$2",
            [id, req.user.id]
        );
        const book= result.rows[0];
        if(!book) return res.status(404).send("Book not found");
        res.render("bookedit.ejs", { user: req.user, book });
    } catch(error) {
      console.error("Error finding book:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  router.post("/:username/:id/edit" , async (req,res)=>{
    const {username,id} = req.params;
    const { title, author, image_url, date_read, rating, isbn,  
            short_review, short_note} = req.body;
    if (!req.isAuthenticated()) return res.redirect("/login");
    if (req.user.username !== username) {
      return res.status(403).send("Access denied.");
    }
    try{
        await db.query("UPDATE books SET title=$1, author=$2, image_url=$3, date_read=$4, rating=$5, isbn=$6, short_review=$7, short_note=$8, description=$9 WHERE id=$9 AND user_id=$10",
            [title, author, image_url, date_read ? date_read : null, rating ? parseInt(rating) : null, isbn, short_review, short_note,description, id, req.user.id]
        );
        res.redirect(`/books/${req.user.username}/${id}`);
    } catch(error) {
      console.error("Error finding book:", error);
      res.status(500).send("Update failed");
    }
  });

//   DELETE book

  router.get("/:username/:id/delete", async (req,res)=>{
      const {username, id} = req.params;

      if (!req.isAuthenticated()) return res.redirect("/login");
      if (req.user.username !== username) {
          return res.status(403).send("Access denied.");
      }
      try{
          const result = await db.query("SELECT * FROM books WHERE id=$1 AND user_id=$2",
              [id, req.user.id]
          );
          const book = result.rows[0];
          if(!book) return res.status(404).send("Book not found");

          await db.query("DELETE FROM books WHERE id=$1 AND user_id=$2",
              [id, req.user.id]
          );
          res.redirect(`/books/${req.user.username}`);        
      } catch(error){
          console.error("Error finding book:", error);
          res.status(500).send("Deletion failed");
      }

  });

  //   Open BOOK

  router.get("/:username/:id", async (req, res) => {
    const { username, id } = req.params;
    if (!req.isAuthenticated()) return res.redirect("/login");

    if (req.user.username !== username) {
      return res.status(403).send("Access denied.");
    }
    try {
      const result = await db.query("SELECT * FROM books WHERE id=$1 AND user_id=$2",
        [id, req.user.id]
      );
      const book = result.rows[0];
      if(!book) return res.status(404).send("Book not found");
      res.render("thebook.ejs", { book, user: req.user });
    } catch (error) {
      console.error("Error searching books:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}


