const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "patient",
        enum: ["patient", "admin", "doctor"],
    },
    address: {
        type: String,
        default: "",
    },
    dateOfBirth: {
        type: String,
        default: "1990-01-01",
    },
    bloodGroup: {
        type: String,
        default: "N/A",
    },
    weight: {
        type: String,
        default: "N/A",
    },
    height: {
        type: String,
        default: "N/A",
    },
    allergies: {
        type: [String],
        default: [],
    },
    medications: {
        type: [String],
        default: [],
    },
    conditions: {
        type: [String],
        default: [],
    },
    emergencyContacts: [{
        name: { type: String, required: true },
        phone: { type: String, required: true },
        relation: { type: String }
    }],
    healthId: {
        type: String,
        default: "Not Linked",
    },
    hospitalIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital'
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    profileImage: {
        type: String,
        default: "",
    },
});

module.exports = mongoose.model("User", userSchema);
