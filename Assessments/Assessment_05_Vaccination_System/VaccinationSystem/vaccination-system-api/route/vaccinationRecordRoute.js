// route/vaccinationRecordRoute.js
const express = require('express');
const vaccinationRecordRouter = express.Router({ strict: true, caseSensitive: true });
const VaccinationRecordModel = require('../DataModel/vaccinationRecordDataModel'); // Import VaccinationRecord model
const AppointmentModel = require('../DataModel/appointmentDataModel'); // For potentially updating appointment status
const VaccineModel = require('../DataModel/vaccineDataModel'); // For populating vaccine info
const HospitalModel = require('../DataModel/hospitalDataModel'); // For populating hospital info
const UserModel = require('../DataModel/userDataModel'); // For populating user info
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation

// Assuming authenticateToken is exported from userRoute.js
const { authenticateToken } = require('./userRoute'); // Adjust path if needed

/**
 * @route POST /api/vaccination-records
 * @description Record a new vaccination.
 * @body {string} userId, {string} hospitalId, {string} vaccineId, {number} dose_number, {string} vaccination_date (ISO string), {string} [batch_number], {string} [administered_by]
 * @access Protected (Admin or Hospital Staff)
 */
vaccinationRecordRouter.post('/api/vaccination-records', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can record vaccinations.' });
        }

        const { userId, hospitalId, vaccineId, dose_number, vaccination_date, batch_number, administered_by } = req.body;
        const vaccinatorId = administered_by || req.user.userId; // Default to current user if not provided

        // Basic validation
        if (!userId || !hospitalId || !vaccineId || dose_number === undefined || dose_number === null || !vaccination_date) {
            return res.status(400).json({ message: 'Missing required fields: userId, hospitalId, vaccineId, dose_number, vaccination_date.' });
        }
        if (typeof dose_number !== 'number' || dose_number < 1) {
            return res.status(400).json({ message: 'Dose number must be a number greater than or equal to 1.' });
        }

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(vaccineId)) {
            return res.status(400).json({ message: 'Invalid ID format for user, hospital, or vaccine.' });
        }
        if (administered_by && !mongoose.Types.ObjectId.isValid(administered_by)) {
            return res.status(400).json({ message: 'Invalid ID format for administered_by.' });
        }

        // Convert vaccination_date to Date object
        const parsedVaccinationDate = new Date(vaccination_date);
        if (isNaN(parsedVaccinationDate)) {
            return res.status(400).json({ message: 'Invalid vaccination date format.' });
        }

        // Verify if User, Hospital, and Vaccine exist
        const [userExists, hospitalExists, vaccineExists] = await Promise.all([
            UserModel.findById(userId),
            HospitalModel.findById(hospitalId),
            VaccineModel.findById(vaccineId)
        ]);

        if (!userExists) return res.status(404).json({ message: 'User not found.' });
        if (!hospitalExists) return res.status(404).json({ message: 'Hospital not found.' });
        if (!vaccineExists) return res.status(404).json({ message: 'Vaccine not found.' });


        // Check if this specific dose for this vaccine for this user is already recorded
        const existingRecord = await VaccinationRecordModel.findOne({ userId, vaccineId, dose_number });
        if (existingRecord) {
            return res.status(409).json({ message: `Vaccination record for dose ${dose_number} of this vaccine already exists for this user.` });
        }

        const newVaccinationRecord = new VaccinationRecordModel({
            userId,
            hospitalId,
            vaccineId,
            dose_number,
            vaccination_date: parsedVaccinationDate,
            batch_number,
            administered_by: vaccinatorId
        });

        const savedRecord = await newVaccinationRecord.save();

        // Optional: Update corresponding appointment status to 'completed'
        await AppointmentModel.findOneAndUpdate(
            {
                userId,
                hospitalId,
                vaccineId,
                dose_number,
                status: { $in: ['booked', 'confirmed'] },
                appointment_date: { $lte: parsedVaccinationDate } // Ensure appointment date is before or on vaccination date
            },
            { status: 'completed' },
            { new: true }
        );

        res.status(201).json({ message: 'Vaccination record created successfully!', record: savedRecord });

    } catch (error) {
        console.error('Error recording vaccination:', error);
        if (error.code === 11000) { // Duplicate key error from unique index
            return res.status(409).json({ message: 'A vaccination record for this user, vaccine, and dose already exists.' });
        }
        res.status(500).json({ message: 'Internal server error recording vaccination.', error: error.message });
    }
});

/**
 * @route GET /api/vaccination-records/me
 * @description Get vaccination history for the authenticated user (patient).
 * @access Protected (Patient only)
 */
vaccinationRecordRouter.get('/api/vaccination-records/me', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ message: 'Access denied. Only patients can view their own vaccination records this way.' });
        }

        const records = await VaccinationRecordModel.find({ userId: req.user.userId })
            .populate('hospitalId', 'name address.city')
            .populate('vaccineId', 'name type doses_required')
            .sort({ vaccination_date: 1, dose_number: 1 });

        res.status(200).json(records);
    } catch (error) {
        console.error('Error fetching user vaccination records:', error);
        res.status(500).json({ message: 'Internal server error fetching records.', error: error.message });
    }
});

/**
 * @route GET /api/vaccination-records/hospital/:hospitalId
 * @description Get all vaccination records for a specific hospital.
 * @access Protected (Admin or Hospital Staff)
 */
vaccinationRecordRouter.get('/api/vaccination-records/hospital/:hospitalId', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can view hospital vaccination records.' });
        }

        const hospitalId = req.params.hospitalId;
        if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
            return res.status(400).json({ message: 'Invalid hospital ID format.' });
        }

        const records = await VaccinationRecordModel.find({ hospitalId })
            .populate('userId', 'username email name contact_number age gender')
            .populate('vaccineId', 'name type doses_required')
            .populate('administered_by', 'username name') // If administered_by is a User
            .sort({ vaccination_date: -1 });

        res.status(200).json(records);
    } catch (error) {
        console.error('Error fetching hospital vaccination records:', error);
        res.status(500).json({ message: 'Internal server error fetching records.', error: error.message });
    }
});

/**
 * @route GET /api/vaccination-records
 * @description Get all vaccination records in the system.
 * @access Protected (Admin only)
 */
vaccinationRecordRouter.get('/api/vaccination-records', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can view all vaccination records.' });
        }

        const records = await VaccinationRecordModel.find({})
            .populate('userId', 'username email name')
            .populate('hospitalId', 'name address.city')
            .populate('vaccineId', 'name type')
            .populate('administered_by', 'username name')
            .sort({ vaccination_date: -1 });

        res.status(200).json(records);
    } catch (error) {
        console.error('Error fetching all vaccination records:', error);
        res.status(500).json({ message: 'Internal server error fetching records.', error: error.message });
    }
});

/**
 * @route GET /api/reports/vaccinated-persons
 * @description Get a list of all vaccinated persons with the count of doses supplied.
 * @access Protected (Admin or Hospital Staff)
 */
vaccinationRecordRouter.get('/api/reports/vaccinated-persons', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'hospital_staff') {
            return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can view vaccination reports.' });
        }

        const vaccinatedPersons = await VaccinationRecordModel.aggregate([
            {
                $group: {
                    _id: "$userId",
                    totalDoses: { $sum: 1 }, // Count the number of vaccination records for each user
                    lastVaccinationDate: { $max: "$vaccination_date" },
                    vaccinesReceived: { $addToSet: "$vaccineId" } // Collect unique vaccine IDs
                }
            },
            {
                $lookup: {
                    from: 'users', // The collection name for the User model
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails' // Deconstruct the userDetails array
            },
            {
                $lookup: {
                    from: 'vaccines', // The collection name for the Vaccine model
                    localField: 'vaccinesReceived',
                    foreignField: '_id',
                    as: 'vaccineDetails'
                }
            },
            {
                $project: {
                    _id: 0, // Exclude the default _id from the output
                    userId: '$_id',
                    username: '$userDetails.username',
                    name: '$userDetails.name',
                    email: '$userDetails.email',
                    contact_number: '$userDetails.contact_number',
                    totalDoses: '$totalDoses',
                    lastVaccinationDate: '$lastVaccinationDate',
                    vaccines: '$vaccineDetails.name' // Get names of vaccines received
                }
            },
            {
                $sort: { totalDoses: -1, lastVaccinationDate: -1 }
            }
        ]);

        res.status(200).json(vaccinatedPersons);
    } catch (error) {
        console.error('Error fetching vaccinated persons report:', error);
        res.status(500).json({ message: 'Internal server error fetching vaccinated persons report.', error: error.message });
    }
});


/**
 * @route DELETE /api/vaccination-records/:id
 * @description Delete a vaccination record. (Use with caution, typically records are not deleted)
 * @access Protected (Admin only)
 */
vaccinationRecordRouter.delete('/api/vaccination-records/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only administrators can delete vaccination records.' });
        }

        const recordId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(recordId)) {
            return res.status(400).json({ message: 'Invalid record ID format.' });
        }

        const deletedRecord = await VaccinationRecordModel.findByIdAndDelete(recordId);

        if (!deletedRecord) {
            return res.status(404).json({ message: 'Vaccination record not found.' });
        }

        res.status(200).json({ message: 'Vaccination record deleted successfully!', record: { _id: deletedRecord._id } });

    } catch (error) {
        console.error('Error deleting vaccination record:', error);
        res.status(500).json({ message: 'Internal server error deleting vaccination record.', error: error.message });
    }
});


module.exports = vaccinationRecordRouter;