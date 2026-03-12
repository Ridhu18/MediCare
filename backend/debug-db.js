require("dotenv").config();
const mongoose = require("mongoose");

console.log("Attempting to connect to:", process.env.DATABASE_URL);

mongoose
    .connect(process.env.DATABASE_URL)
    .then(() => {
        console.log("Connected successfully!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Connection failed!");
        console.error(err);
        process.exit(1);
    });
