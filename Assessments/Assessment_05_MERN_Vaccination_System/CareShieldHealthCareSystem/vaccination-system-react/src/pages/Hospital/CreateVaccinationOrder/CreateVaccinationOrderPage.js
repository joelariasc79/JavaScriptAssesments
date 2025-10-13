// // src/pages/Hospital/CreateVaccinationOrderPage.js
// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import {
//     createVaccinationOrder,
//     clearCreateStatus
// } from '../../../store/features/vaccinationOrder/vaccinationOrderSlice';
// import {
//     selectCreateOrderStatus,
//     selectCreateOrderError
// } from '../../../store/features/vaccinationOrder/vaccinationOrderSelectors';
// import { selectCurrentUser } from '../../../store/features/auth/authSelectors';
//
// import { fetchAllVaccines } from '../../../store/features/vaccines/vaccineSlice';
// import { selectAllVaccines } from '../../../store/features/vaccines/vaccineSelectors';
//
// import { fetchAllUsers } from '../../../store/features/users/usersSlice';
// import { selectAllPatients } from '../../../store/features/users/usersSelectors';
//
// // Import actions and selectors for hospitals
// import { fetchAllHospitals } from '../../../store/features/hospitals/hospitalSlice';
// import { selectAllHospitals } from '../../../store/features/hospitals/hospitalSelectors';
//
// import Input from '../../../components/common/Input/Input';
// import Button from '../../../components/common/Button/Button';
// import './CreateVaccinationOrderPage.css';
//
// const CreateVaccinationOrderPage = () => {
//     const dispatch = useDispatch();
//     const navigate = useNavigate();
//
//     const currentUser = useSelector(selectCurrentUser);
//     const allVaccines = useSelector(selectAllVaccines);
//     const allPatients = useSelector(selectAllPatients);
//     const allHospitals = useSelector(selectAllHospitals); // Get all hospitals
//     const createOrderStatus = useSelector(selectCreateOrderStatus);
//     const createOrderError = useSelector(selectCreateOrderError);
//
//     // State for form fields
//     const [selectedPatientId, setSelectedPatientId] = useState('');
//     const [selectedVaccineId, setSelectedVaccineId] = useState('');
//     const [selectedHospitalId, setSelectedHospitalId] = useState(''); // New state for selected hospital
//     const [doseNumber, setDoseNumber] = useState('');
//     const [chargeToBePaid, setChargeToBePaid] = useState('');
//     const [formError, setFormError] = useState('');
//
//     // Fetch necessary data on component mount
//     useEffect(() => {
//         dispatch(fetchAllVaccines());
//         dispatch(fetchAllUsers());
//         dispatch(fetchAllHospitals()); // Fetch all hospitals
//     }, [dispatch]);
//
//     // Handle order creation status
//     useEffect(() => {
//         if (createOrderStatus === 'succeeded') {
//             alert('Vaccination order created successfully!');
//             dispatch(clearCreateStatus());
//             // Clear form fields
//             setSelectedPatientId('');
//             setSelectedVaccineId('');
//             setSelectedHospitalId(''); // Clear selected hospital
//             setDoseNumber('');
//             setChargeToBePaid('');
//             setFormError('');
//             // Redirect to a relevant page, perhaps the hospital dashboard or a list of orders
//             navigate('/hospital'); // Or '/vaccination-orders' if you have one
//         } else if (createOrderStatus === 'failed') {
//             setFormError(createOrderError || 'Failed to create vaccination order. Please try again.');
//         }
//     }, [createOrderStatus, createOrderError, dispatch, navigate]);
//
//     // Calculate chargeToBePaid based on selected vaccine and selected hospital charges
//     useEffect(() => {
//         if (selectedVaccineId && selectedHospitalId) {
//             const vaccine = allVaccines.find(v => v._id === selectedVaccineId);
//             const hospital = allHospitals.find(h => h._id === selectedHospitalId);
//
//             if (vaccine && hospital) {
//                 const vaccinePrice = vaccine.price || 0;
//                 const hospitalCharges = hospital.charges || 0; // Use charges from selected hospital
//
//                 const calculatedCharge = vaccinePrice + hospitalCharges;
//                 setChargeToBePaid(calculatedCharge.toFixed(2));
//             } else {
//                 setChargeToBePaid('');
//             }
//         } else {
//             setChargeToBePaid('');
//         }
//     }, [selectedVaccineId, selectedHospitalId, allVaccines, allHospitals]); // Depend on selectedHospitalId and allHospitals
//
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setFormError('');
//
//         if (!selectedPatientId || !selectedVaccineId || !selectedHospitalId || !doseNumber) {
//             setFormError('All fields are required: Patient, Vaccine, Hospital, and Dose Number.');
//             return;
//         }
//
//         const parsedDoseNumber = parseInt(doseNumber);
//         const parsedChargeToBePaid = parseFloat(chargeToBePaid);
//
//         if (isNaN(parsedDoseNumber) || parsedDoseNumber <= 0) {
//             setFormError('Dose Number must be a positive integer.');
//             return;
//         }
//         if (isNaN(parsedChargeToBePaid) || parsedChargeToBePaid < 0) {
//             setFormError('Calculated charge is invalid. Please select a valid vaccine and hospital.');
//             return;
//         }
//
//         const orderData = {
//             userId: selectedPatientId,
//             hospitalId: selectedHospitalId, // Use the selected hospital ID
//             vaccineId: selectedVaccineId,
//             dose_number: parsedDoseNumber,
//             charge_to_be_paid: parsedChargeToBePaid,
//         };
//
//         dispatch(createVaccinationOrder(orderData));
//     };
//
//     // No longer need to check for currentUser.hospital for rendering the form
//     // The page can always load, and the patient chooses the hospital.
//
//     return (
//         <div className="create-vaccination-order-container">
//             <h2>Create New Vaccination Order</h2>
//
//             <form onSubmit={handleSubmit} className="create-order-form">
//                 <div className="form-group">
//                     <label htmlFor="hospitalSelect">Select Hospital:</label>
//                     <select
//                         id="hospitalSelect"
//                         value={selectedHospitalId}
//                         onChange={(e) => setSelectedHospitalId(e.target.value)}
//                         required
//                         className="select-box"
//                     >
//                         <option value="">-- Select a Hospital --</option>
//                         {allHospitals.map((hospital) => (
//                             <option key={hospital._id} value={hospital._id}>
//                                 {hospital.name} ({hospital.address})
//                             </option>
//                         ))}
//                     </select>
//                 </div>
//
//                 <div className="form-group">
//                     <label htmlFor="patientSelect">Select Patient:</label>
//                     <select
//                         id="patientSelect"
//                         value={selectedPatientId}
//                         onChange={(e) => setSelectedPatientId(e.target.value)}
//                         required
//                         className="select-box"
//                     >
//                         <option value="">-- Select a Patient --</option>
//                         {allPatients.map((patient) => (
//                             <option key={patient._id} value={patient._id}>
//                                 {patient.name} ({patient.username} - {patient.email})
//                             </option>
//                         ))}
//                     </select>
//                 </div>
//
//                 <div className="form-group">
//                     <label htmlFor="vaccineSelect">Select Vaccine:</label>
//                     <select
//                         id="vaccineSelect"
//                         value={selectedVaccineId}
//                         onChange={(e) => setSelectedVaccineId(e.target.value)}
//                         required
//                         className="select-box"
//                     >
//                         <option value="">-- Select a Vaccine --</option>
//                         {allVaccines.map((vaccine) => (
//                             <option key={vaccine._id} value={vaccine._id}>
//                                 {vaccine.name} ({vaccine.manufacturer})
//                             </option>
//                         ))}
//                     </select>
//                 </div>
//
//                 <Input
//                     label="Dose Number"
//                     id="doseNumber"
//                     type="number"
//                     value={doseNumber}
//                     onChange={(e) => setDoseNumber(e.target.value)}
//                     placeholder="e.g., 1, 2"
//                     required
//                     min="1"
//                 />
//
//                 <Input
//                     label="Charge to be Paid ($)"
//                     id="chargeToBePaid"
//                     type="number"
//                     value={chargeToBePaid}
//                     readOnly
//                     placeholder="Calculated automatically"
//                     required
//                     min="0"
//                     step="0.01"
//                 />
//
//                 {formError && <p className="form-error-message">{formError}</p>}
//                 {createOrderStatus === 'loading' && <p>Creating order...</p>}
//
//                 <Button type="submit" variant="primary" disabled={createOrderStatus === 'loading'}>
//                     Create Order
//                 </Button>
//             </form>
//         </div>
//     );
// };
//
// export default CreateVaccinationOrderPage;