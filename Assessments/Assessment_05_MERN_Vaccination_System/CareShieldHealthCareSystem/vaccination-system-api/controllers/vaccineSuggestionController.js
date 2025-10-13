// controllers/vaccineSuggestionController.js

const VaccineModel = require('../dataModel/vaccineDataModel');
const UserModel = require('../dataModel/userDataModel');
const VaccinationRecordModel = require('../dataModel/vaccinationRecordDataModel');

// @desc    Suggest vaccines to a patient
// @route   GET /api/patients/:userId/vaccine-suggestions
// @access  Private (Patient, Hospital Staff, Admin)
exports.getVaccineSuggestions = async (req, res) => {
    try {
        const { userId } = req.params;

        // --- 1. Authorization Check ---
        // Ensure the logged-in patient is the patient, an admin, or hospital_staff
        // The token payload is typically attached to req.patient by a middleware
        if (req.user.id !== userId && req.user.role !== 'patient') {
            return res.status(403).json({ success: false, message: 'Not authorized to view these suggestions.' });
        }

        // --- 2. Retrieve Patient's Details ---
        const patient = await UserModel.findById(userId);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found.' });
        }
        if (!patient.age) {
            return res.status(400).json({ success: false, message: 'Patient age is required for vaccine suggestions.' });
        }

        // --- 3. Retrieve Patient's Existing Vaccination Records ---
        const patientRecords = await VaccinationRecordModel.find({ userId });

        // Count doses received for each vaccine
        const receivedDoses = patientRecords.reduce((acc, record) => {
            const vaccineId = record.vaccineId.toString();
            acc[vaccineId] = (acc[vaccineId] || 0) + 1;
            return acc;
        }, {});

        // --- 4. Retrieve All Available Vaccines ---
        const allVaccines = await VaccineModel.find({});

        // --- 5. Core Logic: Filter and Suggest Vaccines ---
        const suggestedVaccines = allVaccines.filter(vaccine => {
            // Check if patient's age is within the vaccine's age range
            const patientAgeInMonths = patient.age * 12;

            const minAgeValid = vaccine.min_age_months === null || patientAgeInMonths >= vaccine.min_age_months;
            const maxAgeValid = vaccine.max_age_years === null || patient.age <= vaccine.max_age_years;

            if (!minAgeValid || !maxAgeValid) {
                return false; // Patient is not in the valid age range
            }

            // Check if the patient has completed the required doses
            const dosesTaken = receivedDoses[vaccine._id.toString()] || 0;
            const dosesRequired = vaccine.doses_required;

            // Suggest the vaccine only if doses taken are less than required
            return dosesTaken < dosesRequired;
        });

        // --- 6. Prepare the Response ---
        const suggestionsWithStatus = suggestedVaccines.map(vaccine => {
            const dosesTaken = receivedDoses[vaccine._id.toString()] || 0;
            const dosesRequired = vaccine.doses_required;

            return {
                vaccineDetails: vaccine,
                dosesStatus: {
                    taken: dosesTaken,
                    required: dosesRequired,
                    isFullyVaccinated: dosesTaken === dosesRequired
                }
            };
        });

        res.status(200).json({
            success: true,
            data: suggestionsWithStatus,
            message: `Found ${suggestionsWithStatus.length} vaccine suggestions for patient ${patient.name}.`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
};