// src/routes/AppRoutes.js
import React, { Suspense, lazy } from 'react'; // Correctly import Suspense and lazy
// Remove BrowserRouter import, as it's now in App.js
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser } from '../store/features/auth/authSelectors'; // Keep selectCurrentUser

// Import your public page components
import LoginPage from '../pages/Auth/Login/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPatient/RegisterPage';


// //////////////////////////////////////////////////////////////////////////////////////////
// Lazy load Hospital related page components
const HospitalDashboard = lazy(() => import('../pages/Hospital/HospitalDashboard/HospitalDashboard'));
const HospitalListPage = lazy(() => import('../pages/Hospital/HospitalListPage/HospitalListPage'));
const RegisterVaccinePage = lazy(() => import('../pages/Hospital/RegisterVaccinePage/RegisterVaccinePage'));
const UpdateVaccineStockPage = lazy(() => import('../pages/Hospital/VaccinesStock/VaccinesStockPage'));
const ApproveVaccinationOrderPage = lazy(() => import('../pages/Hospital/ApproveVaccinationOrderPage/ApproveVaccinationOrderPage')); // You need to create this file
const HospitalVaccinatedListPage = lazy(() => import('../pages/Hospital/HospitalVaccinatedListPage/HospitalVaccinatedListPage'));
// Create a CreateVaccinationOrderPage on Behalf of the Patient
// const CreateVaccinationOrderPage = lazy(() => import('../pages/Hospital/CreateVaccinationOrder/CreateVaccinationOrderPage'));



// //////////////////////////////////////////////////////////////////////////////////////////
// Reports Pages
const ReportsDashboard = lazy(() => import('../pages/Reports/ReportsDashboard/ReportsDashboard.js'));
const AgeGenderReportPage = lazy(() => import('../pages/Reports/AgeGenderReportPage/AgeGenderReportPage'));
const DosesAdministeredReportPage = lazy(() => import('../pages/Reports/DosesAdministeredReportPage/DosesAdministeredReportPage'));
const PopulationCoverageReportPage = lazy(() => import('../pages/Reports/PopulationCoverageReportPage/PopulationCoverageReportPage'));


// //////////////////////////////////////////////////////////////////////////////////////////
// Patient Pages
const PatientDashboardPage = lazy(() => import('../pages/Patient/PatientDashboard/PatientDashboardPage'));
const CreatePatientVaccinationOrderPage = lazy(() => import('../pages/Patient/CreateVaccinationOrder/CreatePatientVaccinationOrderPage'));
const PatientVaccinationOrdersPage = lazy(() => import('../pages/Patient/PatientVaccinationOrders/PatientVaccinationOrdersPage'));


// //////////////////////////////////////////////////////////////////////////////////////////
// Watchlist Page
const WatchlistDisplayPage = lazy(() => import('../pages/Watchlist/WatchlistDisplayPage'));


// PrivateRoute component - Updated to check roles
const PrivateRoute = ({ children, allowedRoles }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const currentUser = useSelector(selectCurrentUser); // Get current user to check role

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Optional: Add role-based access control here
    if (allowedRoles && !allowedRoles.includes(currentUser?.role)) {
        // If user is authenticated but doesn't have an allowed role
        return <Navigate to="/" replace />; // Redirect to home or a /unauthorized page
    }

    return children;
};

const AppRoutes = () => {
    return (
        <Suspense fallback={<div>Loading page...</div>}> {/* Correct: Suspense wrapper is active */}
            <Routes>
                {/* Public Routes - These should be active as you have LoginPage and RegisterPage */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/" element={<Navigate to="/login" replace />} /> {/* Redirect root to login */}

                {/*Hospital Staff Routes (Protected) - HospitalDashboard UNCOMMENTED */}
                <Route
                    path="/hospital"
                    element={
                        <PrivateRoute allowedRoles={['hospital_staff']}>
                            <HospitalDashboard />
                        </PrivateRoute>
                    }
                />

                {/* Other hospital routes are still commented out as their components don't exist yet: */}
                {/* Admin-only routes (UNCOMMENT HospitalListPage route) */}
                <Route
                    path="/hospital/hospitals"
                    element={
                        <PrivateRoute allowedRoles={['admin', 'hospital_staff']}>
                            <HospitalListPage />
                        </PrivateRoute>
                    }
                />

                <Route
                 path="/hospital/vaccines/register"
                 element={
                 <PrivateRoute allowedRoles={['admin', 'hospital_staff']}>
                 <RegisterVaccinePage />
                 </PrivateRoute>
                 }
                />

                <Route
                 path="/hospital/vaccines/stock"
                 element={
                 <PrivateRoute allowedRoles={['admin', 'hospital_staff']}>
                 <UpdateVaccineStockPage />
                 </PrivateRoute>
                 }
                />

                <Route
                    path="/hospital/orders/pending-approval" // New path for the approval list page
                    element={
                        <PrivateRoute allowedRoles={['admin', 'hospital_staff']}>
                            <ApproveVaccinationOrderPage /> {/* New component for the list */}
                        </PrivateRoute>
                    }
                />

                {/*<Route*/}
                {/*    path="/hospital/orders/create-for-patient"*/}
                {/*    element={*/}
                {/*        <PrivateRoute allowedRoles={['admin', 'hospital_staff']}>*/}
                {/*            <CreateVaccinationOrderPage />*/}
                {/*        </PrivateRoute>*/}
                {/*    }*/}
                {/*/>*/}

                <Route
                 path="/hospital/vaccinated-list"
                 element={
                 <PrivateRoute allowedRoles={['admin', 'hospital_staff']}>
                 <HospitalVaccinatedListPage />
                 </PrivateRoute>
                 }
                />

                {/* Admin-only routes (still commented out, but would typically use /admin/* paths) */}
                {/*
                <Route
                    path="/admin/hospitals" // Admin-specific route for overall hospital management
                    element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <HospitalListPage />
                        </PrivateRoute>
                    }
                />
                */}

                {/* Patient Routes (Protected) */}
                <Route
                    path="/patient/dashboard"
                    element={
                        <PrivateRoute allowedRoles={['patient']}>
                            <PatientDashboardPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/patient/orders/create" // This route remains for staff/admin creating orders for patients
                    element={
                        <PrivateRoute allowedRoles={['patient']}>
                            <CreatePatientVaccinationOrderPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/patient/orders" // Route for patient to view approved orders
                    element={
                        <PrivateRoute allowedRoles={['patient']}>
                            <PatientVaccinationOrdersPage />
                        </PrivateRoute>
                    }
                />

                {/* Reporting Routes (Protected, accessible to specific roles) - ALL COMMENTED OUT */}
                <Route
                    path="/reports" // General reports dashboard
                    element={
                        <PrivateRoute allowedRoles={['admin', 'hospital_staff']}>
                            <ReportsDashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/reports/age-gender" // Specific report page, if you break them out
                    element={
                        <PrivateRoute allowedRoles={['admin', 'hospital_staff']}>
                            <AgeGenderReportPage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/reports/doses-administered" // Specific report page
                    element={
                        <PrivateRoute allowedRoles={['admin', 'hospital_staff']}>
                            <DosesAdministeredReportPage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/reports/population-coverage" // Specific report page
                    element={
                        <PrivateRoute allowedRoles={['admin', 'hospital_staff']}>
                            <PopulationCoverageReportPage />
                        </PrivateRoute>
                    }
                />

                {/* Watchlist (Public or accessible to all authenticated users)*/}
                <Route
                    path="/watchlist"
                    element={
                        <PrivateRoute allowedRoles={['admin', 'hospital_staff', 'patient']}>
                            <WatchlistDisplayPage />
                        </PrivateRoute>
                    }
                />


                {/*/!* Admin-only routes (if HospitalListPage is for admin) *!/*/}
                {/*<Route*/}
                {/*    path="/admin/hospitals" // Admin-specific route for overall hospital management*/}
                {/*    element={*/}
                {/*        <PrivateRoute allowedRoles={['admin']}>*/}
                {/*            <HospitalListPage />*/}
                {/*        </PrivateRoute>*/}
                {/*    }*/}
                {/*/>*/}

                {/* Catch-all for undefined routes */}
                <Route path="*" element={<div>404 Not Found</div>} />
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;