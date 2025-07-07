// DataModel/userDataModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcryptjs for password hashing
const { Schema } = mongoose; // Destructure Schema for clarity

const UserSchema = new mongoose.Schema({
    // MongoDB automatically creates an _id field as the primary identifier.
    // If you need a specific string 'userId' for external use, you can add it here
    // userId: { type: String, required: true, unique: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // This will store the hashed password
    name: { type: String, required: true, trim: true },
    age: { type: Number },
    profession: { type: String, trim: true },
    contact_number: { type: String, required: true, trim: true },
    address: { // Storing address as an embedded document
        // Changed 'required: true' to 'required: false' for all address sub-fields
        street: { type: String, required: false, trim: true },
        city: { type: String, required: false, trim: true },
        state: { type: String, required: false, trim: true },
        zipCode: { type: String, required: false, trim: true },
        country: { type: String, default: 'USA', trim: true }
    },
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    pre_existing_disease: { type: String }, // Can be Text or Array of Strings if structured
    medical_certificate_url: { type: String }, // URL to a stored certificate
    role: { type: String, enum: ['patient', 'admin', 'hospital_staff'], default: 'patient' },
    // --- ADD THIS NEW FIELD TO LINK TO HOSPITAL ---
    hospital: {
        type: Schema.Types.ObjectId, // This specifies it's an ID from another document
        ref: 'Hospital', // This tells Mongoose which model the ID refers to
        required: false // It's optional because not all users (like patients or global admins) need a hospital link
    }
}, { timestamps: true }); // Mongoose automatically adds createdAt and updatedAt fields

// --- Mongoose Pre-Save Hook for Password Hashing ---
UserSchema.pre('save', async function(next) {
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
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;


// // DataModel/userDataModel.js
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs'); // Import bcryptjs for password hashing
// const { Schema } = mongoose; // Destructure Schema for clarity
//
// const UserSchema = new mongoose.Schema({
//     // MongoDB automatically creates an _id field as the primary identifier.
//     // If you need a specific string 'userId' for external use, you can add it here
//     // userId: { type: String, required: true, unique: true, trim: true },
//     username: { type: String, required: true, unique: true, trim: true },
//     email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//     password: { type: String, required: true }, // This will store the hashed password
//     name: { type: String, required: true, trim: true },
//     age: { type: Number },
//     profession: { type: String, trim: true },
//     contact_number: { type: String, required: true, trim: true },
//     address: { // Storing address as an embedded document
//         street: { type: String, required: true, trim: true },
//         city: { type: String, required: true, trim: true },
//         state: { type: String, required: true, trim: true },
//         zipCode: { type: String, required: true, trim: true },
//         country: { type: String, default: 'USA', trim: true }
//     },
//     gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
//     pre_existing_disease: { type: String }, // Can be Text or Array of Strings if structured
//     medical_certificate_url: { type: String }, // URL to a stored certificate
//     role: { type: String, enum: ['patient', 'admin', 'hospital_staff'], default: 'patient' },
//     // --- ADD THIS NEW FIELD TO LINK TO HOSPITAL ---
//     hospital: {
//         type: Schema.Types.ObjectId, // This specifies it's an ID from another document
//         ref: 'Hospital', // This tells Mongoose which model the ID refers to
//         required: false // It's optional because not all users (like patients or global admins) need a hospital link
//     }
// }, { timestamps: true }); // Mongoose automatically adds createdAt and updatedAt fields
//
// // --- Mongoose Pre-Save Hook for Password Hashing ---
// UserSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) {
//         return next();
//     }
//     try {
//         const salt = await bcrypt.genSalt(10);
//         this.password = await bcrypt.hash(this.password, salt);
//         next();
//     } catch (error) {
//         next(error);
//     }
// });
//
// // --- Instance method to compare entered password with hashed password ---
// UserSchema.methods.comparePassword = async function(candidatePassword) {
//     return bcrypt.compare(candidatePassword, this.password);
// };
//
// const UserModel = mongoose.model('User', UserSchema);
//
// module.exports = UserModel;