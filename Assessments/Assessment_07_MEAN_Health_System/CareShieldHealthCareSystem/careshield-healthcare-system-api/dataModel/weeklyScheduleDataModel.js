const mongoose = require('mongoose');
const { Schema } = mongoose;

const WeeklyScheduleSchema = new mongoose.Schema({
    doctorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6
    },
    // Start time of the shift (e.g., '09:00')
    startTime: {
        type: String,
        required: true
    },
    // End time of the shift (e.g., '17:00')
    endTime: {
        type: String,
        required: true
    },
    // Duration of standard appointments in minutes (e.g., 30)
    slotDuration: {
        type: Number,
        default: 30,
        required: true
    },
});

WeeklyScheduleSchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });

// Use the robust pattern: check if the models already exists before compiling it.
const WeeklyScheduleModel = mongoose.models.WeeklySchedule || mongoose.model('WeeklySchedule', WeeklyScheduleSchema);
module.exports = WeeklyScheduleModel;