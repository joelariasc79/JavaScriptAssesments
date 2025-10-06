import express from 'express';
import { createSpecialty, getSpecialties, getSpecialtyById, updateSpecialty, deleteSpecialty } from '../controllers/specialty.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js'; // Using ES import to match environment

const specialtyRouter = express.Router();

const adminAuth = authorizeRole('admin');

const authorizeAdminOrHospitalAdmin = (req, res, next) => {
    const role = req.user?.role;
    if (!role || (role !== 'admin' && role !== 'hospital_admin' && role !== 'doctor')) {
        return res.status(403).json({
            message: 'Forbidden: Access restricted to Admin Hospital Admin or Doctor users.'
        });
    }
    next();
};

const privilegedAuth = authorizeAdminOrHospitalAdmin;

// Base route: /api/specialties
specialtyRouter.route('/')
    .get(authenticateToken, privilegedAuth, getSpecialties)
    .post(authenticateToken, adminAuth, createSpecialty);

// ID route: /api/specialties/:id
specialtyRouter.route('/:id')
    .get(authenticateToken, privilegedAuth, getSpecialtyById)
    .put(authenticateToken, adminAuth, updateSpecialty)
    .delete(authenticateToken, adminAuth, deleteSpecialty);

export default specialtyRouter;
