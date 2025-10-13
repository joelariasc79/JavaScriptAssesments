// // route/reportRoute.js
// const express = require('express');
// const reportRouter = express.Router({ strict: true, caseSensitive: true });
// const VaccinationRecordModel = require('../dataModel/vaccinationRecordDataModel');
// const UserModel = require('../dataModel/userDataModel');
// const VaccineModel = require('../dataModel/vaccineDataModel');
// const HospitalModel = require('../dataModel/hospitalDataModel');
// const mongoose = require('mongoose');
// // Assuming authenticateToken is exported from userRoute.js
// const { authenticateToken } = require('../middleware/authMiddleware');
// // const { authenticateToken } = require('./userRoute'); // Adjust path if needed
//
//
// // Helper function to determine age group (already present, keeping for context)
// const getAgeGroup = (age) => {
//     if (age === null || age === undefined) return 'Unknown';
//     if (age <= 12) return '0-12 (Child)';
//     if (age <= 18) return '13-18 (Teen)';
//     if (age <= 35) return '19-35 (Young Adult)';
//     if (age <= 55) return '36-55 (Adult)';
//     if (age > 55) return '56+ (Senior)';
//     return 'Other';
// };
// //
// // /**
// //  * @route GET /api/reports/demographics
// //  * @description Generates vaccination reports aggregated by Age Group, Gender, Pre-Existing Disease, or Medical Practitioner.
// //  * @queryparam {string} groupBy - Required. 'age_group', 'gender', 'pre_existing_disease', or 'medical_practitioner'.
// //  * @queryparam {string} [hospitalId] - Optional. Filter reports for a specific hospital.
// //  * @access Protected (Admin or Hospital Staff)
// //  */
// // reportRouter.get('/api/reports/demographics', authenticateToken, async (req, res) => {
// //     try {
// //         if (req.patient.role !== 'admin' && req.patient.role !== 'hospital_staff') {
// //             return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can view demographic reports.' });
// //         }
// //
// //         const { groupBy, hospitalId } = req.query;
// //
// //         if (!groupBy || !['age_group', 'gender', 'pre_existing_disease', 'medical_practitioner'].includes(groupBy)) {
// //             return res.status(400).json({ message: 'Invalid or missing "groupBy" parameter. Must be one of: age_group, gender, pre_existing_disease, medical_practitioner.' });
// //         }
// //
// //         const matchStage = {};
// //         if (hospitalId) {
// //             if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
// //                 return res.status(400).json({ message: 'Invalid hospital ID format.' });
// //             }
// //             matchStage.hospitalId = new mongoose.Types.ObjectId(hospitalId);
// //         }
// //
// //         let aggregationPipeline = [];
// //
// //         if (Object.keys(matchStage).length > 0) {
// //             aggregationPipeline.push({ $match: matchStage });
// //         }
// //
// //         // Add lookups for patient and vaccine data
// //         aggregationPipeline.push(
// //             {
// //                 $lookup: {
// //                     from: 'users', // The name of the users collection
// //                     localField: 'userId',
// //                     foreignField: '_id',
// //                     as: 'userDetails'
// //                 }
// //             },
// //             {
// //                 $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } // Handle cases where patient might be deleted
// //             },
// //             {
// //                 $lookup: {
// //                     from: 'users', // Lookup again for administered_by if it references User
// //                     localField: 'administered_by',
// //                     foreignField: '_id',
// //                     as: 'administeredByDetails'
// //                 }
// //             },
// //             {
// //                 $unwind: { path: '$administeredByDetails', preserveNullAndEmptyArrays: true }
// //             }
// //         );
// //
// //         let groupById;
// //         let projectFields = {
// //             count: 1,
// //             label: 1,
// //             _id: 0
// //         };
// //
// //         switch (groupBy) {
// //             case 'age_group':
// //                 aggregationPipeline.push({
// //                     $addFields: {
// //                         ageGroup: {
// //                             $switch: {
// //                                 branches: [
// //                                     { case: { $lte: ['$userDetails.age', 12] }, then: '0-12 (Child)' },
// //                                     { case: { $and: [{ $gt: ['$userDetails.age', 12] }, { $lte: ['$userDetails.age', 18] }] }, then: '13-18 (Teen)' },
// //                                     { case: { $and: [{ $gt: ['$userDetails.age', 18] }, { $lte: ['$userDetails.age', 35] }] }, then: '19-35 (Young Adult)' },
// //                                     { case: { $and: [{ $gt: ['$userDetails.age', 35] }, { $lte: ['$userDetails.age', 55] }] }, then: '36-55 (Adult)' },
// //                                     { case: { $gt: ['$userDetails.age', 55] }, then: '56+ (Senior)' }
// //                                 ],
// //                                 default: 'Unknown'
// //                             }
// //                         }
// //                     }
// //                 });
// //                 groupById = '$ageGroup';
// //                 projectFields.label = '$_id'; // Use _id (which is ageGroup) as label
// //                 break;
// //             case 'gender':
// //                 groupById = '$userDetails.gender';
// //                 projectFields.label = '$_id';
// //                 break;
// //             case 'pre_existing_disease':
// //                 // Unwind the array of pre_existing_diseases for individual counting
// //                 aggregationPipeline.push({ $unwind: '$userDetails.pre_existing_diseases' });
// //                 groupById = '$userDetails.pre_existing_diseases';
// //                 projectFields.label = '$_id';
// //                 break;
// //             case 'medical_practitioner':
// //                 groupById = '$administered_by'; // Group by ID first
// //                 projectFields.label = '$practitionerName'; // Will be set after lookup
// //                 break;
// //         }
// //
// //         aggregationPipeline.push(
// //             {
// //                 $group: {
// //                     _id: groupById,
// //                     count: { $sum: 1 }
// //                 }
// //             },
// //             { $sort: { count: -1 } }
// //         );
// //
// //         // If grouping by medical_practitioner, need to lookup practitioner names
// //         if (groupBy === 'medical_practitioner') {
// //             aggregationPipeline.push(
// //                 {
// //                     $lookup: {
// //                         from: 'users', // Assuming medical practitioners are also in the 'users' collection
// //                         localField: '_id',
// //                         foreignField: '_id',
// //                         as: 'practitionerInfo'
// //                     }
// //                 },
// //                 {
// //                     $unwind: { path: '$practitionerInfo', preserveNullAndEmptyArrays: true }
// //                 },
// //                 {
// //                     $project: {
// //                         _id: 0,
// //                         label: { $ifNull: ['$practitionerInfo.name', 'Unknown Practitioner'] }, // Use name or default
// //                         count: '$count'
// //                     }
// //                 }
// //             );
// //         } else {
// //             aggregationPipeline.push({
// //                 $project: projectFields // Apply project fields determined earlier
// //             });
// //         }
// //
// //
// //         const reportData = await VaccinationRecordModel.aggregate(aggregationPipeline);
// //         res.status(200).json(reportData);
// //
// //     } catch (error) {
// //         console.error('Error fetching demographic report:', error);
// //         res.status(500).json({ message: 'Internal server error fetching demographic report.', error: error.message });
// //     }
// // });
// //
// // /**
// //  * @route GET /api/reports/daily-doses
// //  * @description Reports the number of doses administered each day within a date range.
// //  * @queryparam {string} [startDate] - Optional. Start date (YYYY-MM-DD).
// //  * @queryparam {string} [endDate] - Optional. End date (YYYY-MM-DD).
// //  * @queryparam {string} [hospitalId] - Optional. Filter by hospital.
// //  * @access Protected (Admin or Hospital Staff)
// //  */
// // reportRouter.get('/api/reports/daily-doses', authenticateToken, async (req, res) => {
// //     try {
// //         if (req.patient.role !== 'admin' && req.patient.role !== 'hospital_staff') {
// //             return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can view daily doses report.' });
// //         }
// //
// //         const { startDate, endDate, hospitalId } = req.query;
// //
// //         const matchStage = {};
// //
// //         if (startDate) {
// //             const start = new Date(startDate);
// //             if (isNaN(start)) return res.status(400).json({ message: 'Invalid start date format.' });
// //             matchStage.vaccination_date = { ...matchStage.vaccination_date, $gte: start };
// //         }
// //         if (endDate) {
// //             const end = new Date(endDate);
// //             if (isNaN(end)) return res.status(400).json({ message: 'Invalid end date format.' });
// //             // Set end date to end of day
// //             end.setHours(23, 59, 59, 999);
// //             matchStage.vaccination_date = { ...matchStage.vaccination_date, $lte: end };
// //         }
// //         if (hospitalId) {
// //             if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
// //                 return res.status(400).json({ message: 'Invalid hospital ID format.' });
// //             }
// //             matchStage.hospitalId = new mongoose.Types.ObjectId(hospitalId);
// //         }
// //
// //         const dailyDoses = await VaccinationRecordModel.aggregate([
// //             { $match: matchStage },
// //             {
// //                 $group: {
// //                     _id: { $dateToString: { format: "%Y-%m-%d", date: "$vaccination_date" } },
// //                     totalDoses: { $sum: 1 }
// //                 }
// //             },
// //             { $sort: { _id: 1 } }, // Sort by date ascending
// //             {
// //                 $project: {
// //                     _id: 0,
// //                     date: '$_id',
// //                     dosesAdministered: '$totalDoses'
// //                 }
// //             }
// //         ]);
// //
// //         res.status(200).json(dailyDoses);
// //     } catch (error) {
// //         console.error('Error fetching daily doses report:', error);
// //         res.status(500).json({ message: 'Internal server error fetching daily doses report.', error: error.message });
// //     }
// // });
// //
// // /**
// //  * @route GET /api/reports/population-coverage
// //  * @description Reports the percentage of population covered (at least one dose / fully vaccinated).
// //  * @queryparam {string} [type] - Optional. 'at_least_one_dose' (default) or 'fully_vaccinated'.
// //  * @queryparam {string} [hospitalId] - Optional. Filter for population covered through a specific hospital.
// //  * @access Protected (Admin or Hospital Staff)
// //  */
// // reportRouter.get('/api/reports/population-coverage', authenticateToken, async (req, res) => {
// //     try {
// //         if (req.patient.role !== 'admin' && req.patient.role !== 'hospital_staff') {
// //             return res.status(403).json({ message: 'Access denied. Only administrators and hospital staff can view population coverage reports.' });
// //         }
// //
// //         const { type = 'at_least_one_dose', hospitalId } = req.query;
// //
// //         if (!['at_least_one_dose', 'fully_vaccinated'].includes(type)) {
// //             return res.status(400).json({ message: 'Invalid "type" parameter. Must be "at_least_one_dose" or "fully_vaccinated".' });
// //         }
// //
// //         const matchStage = {};
// //         if (hospitalId) {
// //             if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
// //                 return res.status(400).json({ message: 'Invalid hospital ID format.' });
// //             }
// //             matchStage.hospitalId = new mongoose.Types.ObjectId(hospitalId);
// //         }
// //
// //         // --- Calculate Total Registered Users (as proxy for population) ---
// //         // For a more accurate "population" coverage, you'd need a separate population data source
// //         // or a way to define the target population for your system.
// //         const totalRegisteredUsers = await UserModel.countDocuments({});
// //         if (totalRegisteredUsers === 0) {
// //             return res.status(200).json({
// //                 message: 'No registered users in the system to calculate population coverage.',
// //                 reportType: type,
// //                 totalRegisteredUsers: 0,
// //                 coveredUsers: 0,
// //                 percentageCovered: 0
// //             });
// //         }
// //
// //         let coveredUsersCount = 0;
// //
// //         if (type === 'at_least_one_dose') {
// //             // Count unique users who have at least one vaccination record
// //             const distinctUsers = await VaccinationRecordModel.aggregate([
// //                 { $match: matchStage },
// //                 {
// //                     $group: {
// //                         _id: "$userId" // Group by userId to get distinct vaccinated users
// //                     }
// //                 },
// //                 {
// //                     $count: "coveredUsers"
// //                 }
// //             ]);
// //             coveredUsersCount = distinctUsers.length > 0 ? distinctUsers[0].coveredUsers : 0;
// //
// //         } else if (type === 'fully_vaccinated') {
// //             // Find users who have completed all required doses for a vaccine
// //             // This is complex as different vaccines have different doses_required.
// //             // This aggregation assumes a patient is fully vaccinated if they have completed
// //             // the maximum doses required for *any* vaccine they received.
// //             // A more precise definition would link to a specific vaccine or a 'primary series' completion.
// //             const fullyVaccinatedUsers = await VaccinationRecordModel.aggregate([
// //                 { $match: matchStage },
// //                 {
// //                     $lookup: {
// //                         from: 'vaccines', // The vaccines collection
// //                         localField: 'vaccineId',
// //                         foreignField: '_id',
// //                         as: 'vaccineDetails'
// //                     }
// //                 },
// //                 {
// //                     $unwind: '$vaccineDetails'
// //                 },
// //                 {
// //                     $group: {
// //                         _id: "$userId",
// //                         maxDoseReceived: { $max: "$dose_number" },
// //                         requiredDosesForMaxVaccine: { $max: "$vaccineDetails.doses_required" }
// //                     }
// //                 },
// //                 {
// //                     $match: {
// //                         $expr: { $eq: ["$maxDoseReceived", "$requiredDosesForMaxVaccine"] }
// //                     }
// //                 },
// //                 {
// //                     $count: "coveredUsers"
// //                 }
// //             ]);
// //             coveredUsersCount = fullyVaccinatedUsers.length > 0 ? fullyVaccinatedUsers[0].coveredUsers : 0;
// //         }
// //
// //         const percentageCovered = (coveredUsersCount / totalRegisteredUsers) * 100;
// //
// //         res.status(200).json({
// //             reportType: type,
// //             totalRegisteredUsers: totalRegisteredUsers,
// //             coveredUsers: coveredUsersCount,
// //             percentageCovered: parseFloat(percentageCovered.toFixed(2)) // Format to 2 decimal places
// //         });
// //
// //     } catch (error) {
// //         console.error('Error fetching population coverage report:', error);
// //         res.status(500).json({ message: 'Internal server error fetching population coverage report.', error: error.message });
// //     }
// // });
// //
// //
// // /**
// //  * @route GET /api/reports/watchlist-stats
// //  * @description Provides consolidated vaccination statistics for a watchlist/PatientDashboard.
// //  * @access Protected (Admin, Hospital Staff, or even Patient for general overview)
// //  */
// // reportRouter.get('/api/reports/watchlist-stats', authenticateToken, async (req, res) => {
// //     try {
// //         // Access can be more lenient for general overview stats, or restricted based on your needs
// //         if (!['admin', 'hospital_staff', 'patient'].includes(req.patient.role)) {
// //             return res.status(403).json({ message: 'Access denied. You do not have permission to view watchlist statistics.' });
// //         }
// //
// //         const stats = {};
// //
// //         // 1. Total Registered Users (as proxy for population)
// //         const totalRegisteredUsers = await UserModel.countDocuments({});
// //         stats.totalPopulation = totalRegisteredUsers;
// //
// //         // If no users, return early
// //         if (totalRegisteredUsers === 0) {
// //             return res.status(200).json({
// //                 message: 'No data available to generate watchlist statistics.',
// //                 totalPopulation: 0,
// //                 ageDistribution: [],
// //                 genderDistribution: [],
// //                 coverage: { atLeastOneDose: 0, fullyVaccinated: 0 }
// //             });
// //         }
// //
// //         // 2. Age Distribution (Percentage)
// //         const ageDistributionRaw = await VaccinationRecordModel.aggregate([
// //             {
// //                 $lookup: {
// //                     from: 'users',
// //                     localField: 'userId',
// //                     foreignField: '_id',
// //                     as: 'userDetails'
// //                 }
// //             },
// //             { $unwind: '$userDetails' },
// //             {
// //                 $group: {
// //                     _id: {
// //                         $switch: {
// //                             branches: [
// //                                 { case: { $lte: ['$userDetails.age', 12] }, then: '0-12' },
// //                                 { case: { $and: [{ $gt: ['$userDetails.age', 12] }, { $lte: ['$userDetails.age', 18] }] }, then: '13-18' },
// //                                 { case: { $and: [{ $gt: ['$userDetails.age', 18] }, { $lte: ['$userDetails.age', 35] }] }, then: '19-35' },
// //                                 { case: { $and: [{ $gt: ['$userDetails.age', 35] }, { $lte: ['$userDetails.age', 55] }] }, then: '36-55' },
// //                                 { case: { $gt: ['$userDetails.age', 55] }, then: '56+' }
// //                             ],
// //                             default: 'Unknown'
// //                         }
// //                     },
// //                     count: { $addToSet: '$userId' } // Count unique vaccinated users per age group
// //                 }
// //             },
// //             {
// //                 $project: {
// //                     _id: 0,
// //                     ageGroup: '$_id',
// //                     count: { $size: '$count' }
// //                 }
// //             },
// //             { $sort: { ageGroup: 1 } }
// //         ]);
// //
// //         const totalVaccinatedUsersForAge = ageDistributionRaw.reduce((sum, item) => sum + item.count, 0);
// //         stats.ageDistribution = ageDistributionRaw.map(item => ({
// //             ageGroup: item.ageGroup,
// //             percentage: totalVaccinatedUsersForAge > 0 ? parseFloat(((item.count / totalVaccinatedUsersForAge) * 100).toFixed(2)) : 0
// //         }));
// //
// //
// //         // 3. Gender Distribution (Percentage)
// //         const genderDistributionRaw = await VaccinationRecordModel.aggregate([
// //             {
// //                 $lookup: {
// //                     from: 'users',
// //                     localField: 'userId',
// //                     foreignField: '_id',
// //                     as: 'userDetails'
// //                 }
// //             },
// //             { $unwind: '$userDetails' },
// //             {
// //                 $group: {
// //                     _id: '$userDetails.gender',
// //                     count: { $addToSet: '$userId' } // Count unique vaccinated users per gender
// //                 }
// //             },
// //             {
// //                 $project: {
// //                     _id: 0,
// //                     gender: '$_id',
// //                     count: { $size: '$count' }
// //                 }
// //             },
// //             { $sort: { gender: 1 } }
// //         ]);
// //
// //         const totalVaccinatedUsersForGender = genderDistributionRaw.reduce((sum, item) => sum + item.count, 0);
// //         stats.genderDistribution = genderDistributionRaw.map(item => ({
// //             gender: item.gender,
// //             percentage: totalVaccinatedUsersForGender > 0 ? parseFloat(((item.count / totalVaccinatedUsersForGender) * 100).toFixed(2)) : 0
// //         }));
// //
// //
// //         // 4. Population Coverage (At Least One Dose)
// //         const distinctUsersOneDose = await VaccinationRecordModel.aggregate([
// //             { $group: { _id: "$userId" } },
// //             { $count: "coveredUsers" }
// //         ]);
// //         const coveredUsersOneDose = distinctUsersOneDose.length > 0 ? distinctUsersOneDose[0].coveredUsers : 0;
// //         stats.coverage = {
// //             atLeastOneDose: parseFloat(((coveredUsersOneDose / totalRegisteredUsers) * 100).toFixed(2))
// //         };
// //
// //         // 5. Population Coverage (Fully Vaccinated) - reuse logic from population-coverage endpoint
// //         const fullyVaccinatedUsersRaw = await VaccinationRecordModel.aggregate([
// //             {
// //                 $lookup: {
// //                     from: 'vaccines',
// //                     localField: 'vaccineId',
// //                     foreignField: '_id',
// //                     as: 'vaccineDetails'
// //                 }
// //             },
// //             { $unwind: '$vaccineDetails' },
// //             {
// //                 $group: {
// //                     _id: "$userId",
// //                     maxDoseReceived: { $max: "$dose_number" },
// //                     requiredDosesForMaxVaccine: { $max: "$vaccineDetails.doses_required" }
// //                 }
// //             },
// //             {
// //                 $match: {
// //                     $expr: { $eq: ["$maxDoseReceived", "$requiredDosesForMaxVaccine"] }
// //                 }
// //             },
// //             {
// //                 $count: "coveredUsers"
// //             }
// //         ]);
// //         const fullyCoveredUsers = fullyVaccinatedUsersRaw.length > 0 ? fullyVaccinatedUsersRaw[0].coveredUsers : 0;
// //         stats.coverage.fullyVaccinated = parseFloat(((fullyCoveredUsers / totalRegisteredUsers) * 100).toFixed(2));
// //
// //
// //         res.status(200).json(stats);
// //
// //     } catch (error) {
// //         console.error('Error fetching watchlist statistics:', error);
// //         res.status(500).json({ message: 'Internal server error fetching watchlist statistics.', error: error.message });
// //     }
// // });
//
//
// module.exports = reportRouter;