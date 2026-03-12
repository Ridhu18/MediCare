const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require("dotenv").config();
const mongoose = require("mongoose");
const Message = require("./models/Message");

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected to MongoDB");
        const messages = await Message.find({});
        console.log("Messages in DB:", messages);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
