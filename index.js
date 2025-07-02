import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import {Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import booksRouter from "./routes/book.js";


const app = express();
const port = 3000;

app.set("view engine", "ejs");
env.config();

                            // <!--  AUTHENTICATION  -->//

const saltRounds = 10;

const db = new pg.Client({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
});
db.connect();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized:false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use("/books", booksRouter(db));

app.get("/", (req, res) => {
  res.render("home.ejs");
});
app.get("/register", (req, res) => {
  res.render("register.ejs");
});
app.get("/login", (req, res) => {
  res.render("login.ejs");  
});

app.get("/logout", (req, res)=> {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


                // < Register User > //

                
app.post("/register", async (req, res) => {
    const {email, password, username} = req.body;
    try{
        const checkEmail = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        const checkUsername = await db.query("SELECT * FROM users WHERE username = $1", [username]);

        if (checkEmail.rows.length > 0) {
        return res.render("register.ejs", { error: "Email already registered." });
        }
        if (checkUsername.rows.length > 0) {
        return res.render("register.ejs", { error: "Username already taken." });
        } else {
            bcrypt.hash(password, saltRounds, async (err,hash)=>{
                if(err){
                    console.error("Error hashing password:", err);
                } else {
                    const result = await db.query("INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING *", 
                        [email, hash, username]);
                    const user = result.rows[0];
                    req.logIn(user, (err) =>{
                        if (err) return console.log(err);
                        console.log("User entered its treasure");
                        res.redirect(`/books/${user.username}`);
                    });
                }
            });
        }
    } catch (err){
        console.log(err);
    }
});

                // < Login User > //


app.get("/auth/google", passport.authenticate("google",{
    scope: ["profile", "email"],
}));

app.get("/auth/google/books", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect(`/books/${req.user.username}`);
  }
);


// app.post("/login",  passport.authenticate("local", {
//   successRedirect: "/books",
//   failureRedirect: "/login",
// }));

app.post("/login", (req, res, next) => {
    // console.log(user);
  passport.authenticate("local", (err, user) => {
    if (err)  return next(err) ;
    if (!user)  return res.render("login.ejs", { error: "Invalid credentials" }); ;

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect(`/books/${user.username}`);
    });
  })(req, res, next);
});

passport.use("local" ,new Strategy({ usernameField: "email" },
    async function verify(email, password, cb) {
    try{
        const result = await db.query("SELECT * FROM users WHERE email = $1",
             [email]);
        if(result.rows.length > 0) {
            const user = result.rows[0];
            console.log(user);
            const storeHash = user.password;

            bcrypt.compare(password, storeHash, (err, isMatch) => {                
                if (err) {
                    return cb(err);
                } else {
                    if(isMatch) {
                        console.log("success");
                        return cb(null,user);
                    }
                    else{
                        console.log("Incorrect Pwd");
                        return cb(null,false);
                    }
                }
            });            
        } else {
            console.log("user not found");
            return cb("User not found");
        }
    } catch(err){
        console.log(err);
    }
 
}));

passport.use("google", new GoogleStrategy(
        {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/books",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      console.log("Google profile:", profile);
        try{
            const existingUser = await db.query(
                "SELECT * FROM users WHERE email = $1",
                [profile.emails[0].value]);
            if(existingUser.rows.length > 0) {
                return cb(null, existingUser.rows[0]);
            } else {
                    const checkUsername = await db.query("SELECT * FROM users WHERE username = $1", [profile.displayName]);
                    let finalUsername;
                    if (checkUsername.rows.length > 0) {
                      finalUsername = (profile.displayName + profile.email.split("@")[0]).replace(/\s+/g, "").toLowerCase();
                    } else {
                      finalUsername = profile.displayName;
                    }
                const newUser = await db.query(
                    "INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING *",
                    [profile.email, null , finalUsername]);
                return cb(null, newUser.rows[0]);
            }
        } catch(err){
            console.log(err);
        }
 
}));

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});






