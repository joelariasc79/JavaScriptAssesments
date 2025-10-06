import mongoose from 'mongoose';

const SpecialtySchema = new mongoose.Schema({
    // Name of the specialty (e.g., 'Oncologist', 'Pediatrician')
    name: {
        type: String,
        required: [true, 'Specialty name is required'],
        trim: true,
        unique: true
    },

    // Optional: A brief description of the specialty
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Specialty = mongoose.model('Specialty', SpecialtySchema);
export default Specialty;