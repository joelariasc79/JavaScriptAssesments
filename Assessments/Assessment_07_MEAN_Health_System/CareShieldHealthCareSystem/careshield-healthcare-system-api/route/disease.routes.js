import express from 'express';
import { createDisease, getDiseases, getDiseaseById, updateDisease, deleteDisease } from '../controllers/disease.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const diseaseRouter = express.Router();

const adminAuth = authorizeRole('admin');


// Another way to do the same
// diseaseRouter.post('/', authenticateToken, adminAuth, createDisease); // Uses the updated controller
// diseaseRouter.get('/', authenticateToken, getDiseases);

//
// Base route: /api/diseases
diseaseRouter.route('/')
    .get(authenticateToken, getDiseases)
    .post(authenticateToken, adminAuth, createDisease);

// ID route: /api/diseases/:id
diseaseRouter.route('/:id')
    .get(authenticateToken, getDiseaseById)
    .put(authenticateToken, adminAuth, updateDisease)
    .delete(authenticateToken, adminAuth, deleteDisease);

export default diseaseRouter;