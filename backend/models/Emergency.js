const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema({
    patientName: {
        type: String,
        required: false,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    phone: {
        type: String,
        required: true,
    },
    emergencyType: {
        type: String,
        enum: ["cardiac", "accident", "stroke", "burn", "other"],
        required: true,
    },
    priority: {
        type: String,
        enum: ["critical", "high", "medium"],
        required: true,
    },
    location: {
        name: String,
        coordinates: {
            type: [Number], // [lng, lat]
            required: true,
        },
    },
    status: {
        type: String,
        enum: ["incoming", "assigned", "en-route", "arrived", "completed"],
        default: "incoming",
    },
    ambulanceId: {
        type: String,
        required: false,
    },
    eta: {
        type: String,
        required: false,
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

emergencySchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model("Emergency", emergencySchema);
