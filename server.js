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
const Comment = require("./models/Comment");
const Notification = require("./models/Notification");

const app = express();

mongoose.connect("mongodb+srv://dfsdsrgdqfgs_db_user:zivIWTYY7Z4ufVQC@cluster0.knyubbm.mongodb.net/forumdb?retryWrites=true&w=majority")
.then(() => console.log("MongoDB Connected"));

app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({

    destination:(req,file,cb)=>{

        cb(null,"uploads/");

    },

    filename:(req,file,cb)=>{

        cb(null, Date.now() + path.extname(file.originalname));

    }

});

const upload = multer({ storage });

const SECRET = process.env.JWT_SECRET;

function auth(req,res,next){

    const token = req.headers.authorization;

    if(!token){

        return res.status(401).json({
            message:"No token"
        });

    }

    try{

        const decoded = jwt.verify(token, SECRET);

        req.user = decoded;

        next();

    }catch(err){

        res.status(401).json({
            message:"Invalid token"
        });

    }
}

app.post("/api/register", upload.single("avatar"), async(req,res)=>{

    const { username, email, password } = req.body;

    const existing = await User.findOne({ email });

    if(existing){

        return res.json({
            message:"Email already exists"
        });

    }

    const hashed = await bcrypt.hash(password,10);

    const count = await User.countDocuments();

    const user = new User({

        username,

        email,

        password:hashed,

        avatar:req.file ? req.file.filename : "",

        role: count === 0 ? "admin" : "user"

    });

    await user.save();

    res.json({
        message:"Account created"
    });

});

app.post("/api/login", async(req,res)=>{

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if(!user){

        return res.json({
            message:"User not found"
        });

    }

    const valid = await bcrypt.compare(password, user.password);

    if(!valid){

        return res.json({
            message:"Wrong password"
        });

    }

    const token = jwt.sign({

        id:user._id,

        username:user.username,

        avatar:user.avatar,

        role:user.role

    }, SECRET);

    res.json({

        token,
        user

    });

});

app.post("/api/posts", auth, upload.single("image"), async(req,res)=>{

    const post = new Post({

        title:req.body.title,

        content:req.body.content,

        author:req.user.username,

        category:req.body.category,

        image:req.file ? req.file.filename : ""

    });

    await post.save();

    const notification = new Notification({

        username:req.user.username,

        message:"created a new post"

    });

    await notification.save();

    res.json({
        message:"Post created"
    });

});

app.get("/api/posts", async(req,res)=>{

    const posts = await Post.find().sort({
        createdAt:-1
    });

    res.json(posts);

});

app.delete("/api/posts/:id", auth, async(req,res)=>{

    if(req.user.role !== "admin"){

        return res.status(403).json({
            message:"Access denied"
        });

    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
        message:"Post deleted"
    });

});

app.post("/api/comments", async(req,res)=>{

    const comment = new Comment({

        postId:req.body.postId,

        author:req.body.author,

        content:req.body.content

    });

    await comment.save();

    res.json({
        message:"Comment added"
    });

});

app.get("/api/comments/:postId", async(req,res)=>{

    const comments = await Comment.find({

        postId:req.params.postId

    });

    res.json(comments);

});

app.get("/api/users", async(req,res)=>{

    const users = await User.find();

    res.json(users);

});

app.get("/api/notifications", async(req,res)=>{

    const notifications =
    await Notification.find().sort({
        createdAt:-1
    });

    res.json(notifications);

});

app.use((req,res)=>{

    res.status(404).sendFile(
        path.join(__dirname,"public","404.html")
    );

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{

    console.log("Server running on port " + PORT);

});
