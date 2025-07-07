const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcryptjs

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true, default: 'USA' }
    },
    // Add other user-related fields like roles, departments, projects, manager_id here if needed
    // based on your other services and models.
}, { timestamps: true });

// --- Mongoose Pre-Save Hook for Password Hashing ---
// IMPORTANT: Attach the pre-save hook to 'UserSchema', not 'userSchema' (lowercase typo from original)
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// --- Instance method to compare entered password with hashed password ---
// IMPORTANT: Attach the method to 'UserSchema', not 'userSchema' (lowercase typo from original)
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;