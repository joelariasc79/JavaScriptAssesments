const mongoose = require('mongoose');
const { Schema } = mongoose;

const DoctorBlockoutSchema = new mongoose.Schema({
    doctorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    reason: {
        type: String
        , required: true
    },
    // When the blockout period starts
    startDate: {
        type: Date,
        required: true
    },
    // When the blockout period ends
    endDate: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['vacation', 'conference', 'daily_break', 'sick_leave'],
        default: 'vacation'
    }
});

// Use the robust pattern: check if the models already exists before compiling it.
const DoctorBlockoutModel = mongoose.models.DoctorBlockout || mongoose.model('DoctorBlockout', DoctorBlockoutSchema);
module.exports = DoctorBlockoutModel;
