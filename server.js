const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const User = require("./models/User");
const Post = require("./models/Post");

const app = express();

mongoose.connect("mongodb://127.0.0.1:27017/forumdb")
.then(() => console.log("MongoDB Connected"));

app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

const SECRET = "forum_secret_key";

function auth(req, res, next){
    const token = req.headers.authorization;

    if(!token) return res.status(401).json({message:"No token"});

    try{
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    }catch(err){
        res.status(401).json({message:"Invalid token"});
    }
}

app.post("/api/register", upload.single("avatar"), async(req,res)=>{

    const { username, email, password } = req.body;

    const existing = await User.findOne({ email });

    if(existing){
        return res.json({message:"Email already exists"});
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
        username,
        email,
        password: hashed,
        avatar: req.file ? req.file.filename : ""
    });

    await user.save();

    res.json({message:"Account created"});
});

app.post("/api/login", async(req,res)=>{

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if(!user){
        return res.json({message:"User not found"});
    }

    const valid = await bcrypt.compare(password, user.password);

    if(!valid){
        return res.json({message:"Wrong password"});
    }

    const token = jwt.sign({
        id: user._id,
        username: user.username
    }, SECRET);

    res.json({ token, user });
});

app.post("/api/posts", auth, async(req,res)=>{

    const post = new Post({
        title: req.body.title,
        content: req.body.content,
        author: req.user.username
    });

    await post.save();

    res.json({message:"Post created"});
});

app.get("/api/posts", async(req,res)=>{
    const posts = await Post.find().sort({createdAt:-1});
    res.json(posts);
});

app.listen(3000, ()=>{
    console.log("Server running on http://localhost:3000");
});