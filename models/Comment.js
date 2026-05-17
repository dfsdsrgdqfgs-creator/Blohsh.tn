const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({

    postId:String,

    author:String,

    content:String

});

module.exports = mongoose.model("Comment", CommentSchema);
