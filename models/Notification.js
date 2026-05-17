const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({

    username:String,

    message:String

},{
    timestamps:true
});

module.exports = mongoose.model("Notification", NotificationSchema);
