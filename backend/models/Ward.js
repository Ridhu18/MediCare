const mongoose = require("mongoose");

const WardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["general", "icu", "emergency", "pediatric", "maternity"],
        required: true,
    },
    totalBeds: {
        type: Number,
        required: true,
    },
    occupiedBeds: {
        type: Number,
        default: 0,
    },
    reservedBeds: {
        type: Number,
        default: 0,
    },
    maintenanceBeds: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model("Ward", WardSchema);
