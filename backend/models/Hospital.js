const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    phone: String,
    type: {
        type: String,
        enum: ['Government', 'Private'],
        default: 'Private'
    },
    departments: [String],
    rating: {
        type: Number,
        default: 0
    },
    totalBeds: {
        type: Number,
        default: 0
    },
    availableBeds: {
        type: Number,
        default: 0
    },
    emergencyOpen: {
        type: Boolean,
        default: true
    },
    waitTime: String,
    image: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create a geospatial index
hospitalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model("Hospital", hospitalSchema);
