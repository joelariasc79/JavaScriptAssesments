const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // In a real app, this would likely be an auto-generated ObjectId
    // or tied to an authentication system's user ID.
    // For simplicity, matching the string userId from CartSchema.
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true, default: 'USA' }
    },
    // Add other user-related fields as needed
}, { timestamps: true });

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;