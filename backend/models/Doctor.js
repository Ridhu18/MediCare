const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hospitals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital'
    }],
    specialization: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    availability: {
        type: [String], // e.g., ["Mon", "Tue"]
        default: []
    },
    consultationFee: Number,
    rating: {
        type: Number,
        default: 0
    },
    patientsServed: {
        type: Number,
        default: 0
    },
    bio: String,
    address: String,
    qualification: String,
    licenseNumber: String,
    department: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Doctor", doctorSchema);
