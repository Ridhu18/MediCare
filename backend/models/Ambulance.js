const mongoose = require("mongoose");

const ambulanceSchema = new mongoose.Schema({
    ambulanceId: {
        type: String,
        required: true,
        unique: true,
    },
    vehicleNumber: {
        type: String,
        required: true,
    },
    driver: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["available", "dispatched", "returning"],
        default: "available",
    },
    currentLocation: {
        type: String,
        required: false,
    },
}, { timestamps: true });

module.exports = mongoose.model("Ambulance", ambulanceSchema);
