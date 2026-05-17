const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({

    postId:String,

    author:String,

    content:String

},{
    timestamps:true
});

module.exports = mongoose.model("Comment", CommentSchema);
