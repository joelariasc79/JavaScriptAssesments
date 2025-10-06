import Disease from '../dataModel/diseaseDataModel.js';
import Specialty from '../dataModel/specialtyDataModel.js';
import mongoose from 'mongoose';

// Utility function to safely parse the treatmentProcedures string
const parseTreatmentProcedures = (treatmentProceduresString) => {
    if (!treatmentProceduresString || typeof treatmentProceduresString !== 'string') {
        return { parsedData: null, error: 'Input is not a string.' };
    }

    // Attempt to parse the JSON string
    try {
        const parsedData = JSON.parse(treatmentProceduresString);

        // Ensure the parsed result is an array
        if (!Array.isArray(parsedData)) {
            return { parsedData: null, error: 'Treatment Procedures must be a valid JSON array of objects.' };
        }

        return { parsedData, error: null };
    } catch (e) {
        // Handle malformed JSON input
        return { parsedData: null, error: 'Invalid JSON format provided for Treatment Procedures.' };
    }
};

// --- C: Create Disease ---

export const createDisease = async (req, res) => {
    try {
        const {
            name,
            specialty,
            treatmentProcedures, // Directly access the array from req.body
            estimatedDuration,
            estimatedCost
        } = req.body;

        // 1. Essential Field Validation
        if (!name || !specialty) {
            return res.status(400).json({ message: 'Name and specialty ID are required fields.' });
        }

        // 2. Data Type Validation (The Fix for the 400 Error)
        // Ensure treatmentProcedures is either absent or a valid array.
        if (treatmentProcedures && !Array.isArray(treatmentProcedures)) {
            return res.status(400).json({ message: 'Treatment procedures must be a valid JSON array.' });
        }

        // 3. Check for existing disease (Conflict)
        const existingDisease = await Disease.findOne({ name: name.trim() });
        if (existingDisease) {
            return res.status(409).json({ message: 'A disease with this name already exists.' });
        }

        // 4. Create new document
        const newDisease = new Disease({
            name: name.trim(),
            specialty,
            treatmentProcedures: treatmentProcedures || [], // Pass the array directly
            estimatedDuration: estimatedDuration || 'Varies',
            // Basic validation for estimatedCost
            estimatedCost: typeof estimatedCost === 'number' && estimatedCost >= 0 ? estimatedCost : 0
        });

        // 5. Save to database
        const savedDisease = await newDisease.save();

        // 6. Success response
        res.status(201).json(savedDisease);

    } catch (error) {
        console.error('Error creating disease:', error);

        // General error handling (e.g., Mongoose validation, invalid ObjectId format for specialty)
        res.status(500).json({ message: 'Internal server error while creating disease or invalid data provided.' });
    }
};


// --- R: Read All Diseases (Your existing code) ---

export const getDiseases = async (req, res) => {
    try {
        const diseases = await Disease.find()
            .populate('specialty', 'name') // Populate specialty and only select the 'name' field
            .sort({ name: 1 });
        res.status(200).json(diseases);
    } catch (error) {
        console.error('Error fetching diseases:', error);
        res.status(500).json({ message: 'Error fetching diseases.' });
    }
};

// --- R: Read Disease by ID (Your existing code) ---

export const getDiseaseById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Disease ID format.' });
        }

        const disease = await Disease.findById(id)
            .populate('specialty', 'name'); // Populate specialty for context

        if (!disease) {
            return res.status(404).json({ message: 'Disease not found.' });
        }

        res.status(200).json(disease);

    } catch (error) {
        console.error('Error fetching disease by ID:', error);
        res.status(500).json({ message: 'Error fetching disease.' });
    }
};

// --- U: Update Disease by ID ---

export const updateDisease = async (req, res) => {
    try {
        const { id } = req.params;
        let updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Disease ID format.' });
        }

        // --- Parse treatmentProcedures if it is present and is a string ---
        if (updates.treatmentProcedures && typeof updates.treatmentProcedures === 'string') {
            const { parsedData: treatmentProcedures, error: parseError } = parseTreatmentProcedures(updates.treatmentProcedures);
            if (parseError) {
                return res.status(400).json({ message: parseError });
            }
            updates.treatmentProcedures = treatmentProcedures; // Replace the string with the parsed array
        }
        // ----------------------------------------------------------------------


        const updatedDisease = await Disease.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true } // { new: true } returns the updated document; { runValidators: true } enforces schema rules on update
        ).populate('specialty', 'name');

        if (!updatedDisease) {
            return res.status(404).json({ message: 'Disease not found.' });
        }

        res.status(200).json(updatedDisease);

    } catch (error) {
        console.error('Error updating disease:', error);
        // Catch Mongoose errors like unique constraint violations or validation failures
        res.status(400).json({ message: error.message || 'Error updating disease or invalid data provided.' });
    }
};

// --- D: Delete Disease by ID (Your existing code) ---

export const deleteDisease = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Disease ID format.' });
        }

        const deletedDisease = await Disease.findByIdAndDelete(id);

        if (!deletedDisease) {
            return res.status(404).json({ message: 'Disease not found.' });
        }

        // Respond with a 204 No Content status for successful deletion
        res.status(204).send();

    } catch (error) {
        console.error('Error deleting disease:', error);
        res.status(500).json({ message: 'Error deleting disease.' });
    }
};
