import mongoose from 'mongoose';

// Sub-Schema for a single treatment procedure (remains the same)
const TreatmentProcedureSchema = new mongoose.Schema({
    name: { type: String, required: true },
    details: { type: String, default: '' }
}, { _id: false });

const DiseaseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Disease name is required'],
        trim: true,
        unique: true
    },
    specialty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialty',
        required: [true, 'Specialty reference is required']
    },

    treatmentProcedures: {
        type: [TreatmentProcedureSchema],
        default: []
    },

    estimatedDuration: {
        type: String,
        required: false,
        default: 'Varies'
    },

    estimatedCost: {
        type: Number,
        required: false,
        default: 0
    }
}, {
    timestamps: true
});

const Disease = mongoose.model('Disease', DiseaseSchema);
export default Disease;