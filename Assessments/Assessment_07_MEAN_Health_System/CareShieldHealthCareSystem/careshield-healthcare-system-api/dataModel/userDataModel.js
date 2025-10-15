const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcryptjs for password hashing
const { Schema } = mongoose; // Destructure Schema for clarity

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // This will store the hashed password
    name: { type: String, required: true, trim: true },
    age: { type: Number },
    // profession: { type: String, trim: true },
    // change profession to occupation later
    profession: {
        type: String,
        trim: true,
        // Make profession required ONLY when the role is 'patient'.
        optional: function() {
            return this.role === 'patient';
        }
    },
    contact_number: { type: String, required: true, trim: true },
    address: { // Storing address as an embedded document
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        country: { type: String, default: 'USA', trim: true }
    },
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },

    // --- FIELDS MADE OPTIONAL ---
    pre_existing_disease: { type: Array },
    medical_certificate_url: { type: String },

    // --- ROLE & HOSPITAL ---
    role: { type: String, enum: ['patient', 'admin', 'hospital_admin', 'doctor'], default: 'patient' },
    // VERIFIED FIX: Change to an array of ObjectIds to allow multiple hospital associations
    hospital: [{
        type: Schema.Types.ObjectId,
        ref: 'Hospital'
    }],

    // --- DOCTOR-SPECIFIC FIELDS ---
    specialty: {
        type: String,
        enum: ['Emergency Room', 'Oncologist', 'Pediatrician', 'Cardiologist', 'Gastroenterologist'],
        required: function() { return this.role === 'doctor'; }
    },
    experience: {
        type: Number,
        required: function() { return this.role === 'doctor'; }
    },
    fees: {
        type: Number,
        required: function() { return this.role === 'doctor'; }
    }
}, { timestamps: true });

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