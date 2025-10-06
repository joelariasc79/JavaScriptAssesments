import Specialty from '../dataModel/specialtyDataModel.js';
import mongoose from 'mongoose';

// --- C: Create Specialty (Admin Only) ---
export const createSpecialty = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Specialty name is required.' });
        }

        const existingSpecialty = await Specialty.findOne({ name: name.trim() });
        if (existingSpecialty) {
            return res.status(409).json({ message: 'A specialty with this name already exists.' });
        }

        const newSpecialty = new Specialty({
            name: name.trim(),
            description: description || ''
        });

        const savedSpecialty = await newSpecialty.save();

        res.status(201).json(savedSpecialty);

    } catch (error) {
        console.error('Error creating specialty:', error);
        res.status(500).json({ message: 'Internal server error while creating specialty.' });
    }
};

// --- R: Read All Specialties (Authenticated Users) ---
export const getSpecialties = async (req, res) => {
    try {
        const specialties = await Specialty.find().sort({ name: 1 });
        res.status(200).json(specialties);
    } catch (error) {
        console.error('Error fetching specialties:', error);
        res.status(500).json({ message: 'Error fetching specialties.' });
    }
};

// --- R: Read Specialty by ID (Authenticated Users) ---
export const getSpecialtyById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Specialty ID format.' });
        }

        const specialty = await Specialty.findById(id);

        if (!specialty) {
            return res.status(404).json({ message: 'Specialty not found.' });
        }

        res.status(200).json(specialty);

    } catch (error) {
        console.error('Error fetching specialty by ID:', error);
        res.status(500).json({ message: 'Error fetching specialty.' });
    }
};

// --- U: Update Specialty by ID (Admin Only) ---
export const updateSpecialty = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Specialty ID format.' });
        }

        // Ensure name uniqueness is checked on update
        if (updates.name) {
            const existing = await Specialty.findOne({ name: updates.name, _id: { $ne: id } });
            if (existing) {
                return res.status(409).json({ message: 'A specialty with this name already exists.' });
            }
        }

        const updatedSpecialty = await Specialty.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedSpecialty) {
            return res.status(404).json({ message: 'Specialty not found.' });
        }

        res.status(200).json(updatedSpecialty);

    } catch (error) {
        console.error('Error updating specialty:', error);
        res.status(400).json({ message: error.message || 'Error updating specialty or invalid data provided.' });
    }
};

// --- D: Delete Specialty by ID (Admin Only) ---
export const deleteSpecialty = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Specialty ID format.' });
        }

        // NOTE: In a real system, you would check if any Doctors or Diseases
        // reference this specialty before deletion, and block the delete if needed.

        const deletedSpecialty = await Specialty.findByIdAndDelete(id);

        if (!deletedSpecialty) {
            return res.status(404).json({ message: 'Specialty not found.' });
        }

        res.status(204).send();

    } catch (error) {
        console.error('Error deleting specialty:', error);
        res.status(500).json({ message: 'Error deleting specialty.' });
    }
};
