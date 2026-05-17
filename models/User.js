const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

    username:String,

    email:String,

    password:String,

    avatar:String,

    role:{
        type:String,
        default:"user"
    }

});

module.exports = mongoose.model("User", UserSchema);
