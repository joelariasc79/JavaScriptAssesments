// src/pages/Patient/PatientVaccinationOrders/PatientVaccinationOrdersPage.js

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchPatientVaccinationOrders,
    markOrderAsPaid,
    scheduleAppointment,
    markOrderAsVaccinated,
    cancelOrderByPatient,
    clearFetchPatientOrdersStatus,
    clearMarkPaidStatus,
    clearScheduleAppointmentStatus,
    clearMarkVaccinatedStatus,
    clearCancelOrderStatus,
} from '../../../store/features/vaccinationOrder/vaccinationOrderSlice';
import {
    selectPatientOrders,
    selectFetchPatientOrdersStatus,
    selectFetchPatientOrdersError,
    selectMarkPaidStatus,
    selectMarkPaidError, // Corrected from `markPaidError`
    selectScheduleAppointmentStatus,
    selectScheduleAppointmentError,
    selectMarkVaccinatedStatus,
    selectMarkVaccinatedError,
    selectCancelOrderStatus,
    selectCancelOrderError,
    // NEW Selectors for email status
    selectMarkVaccinatedEmailStatus,
    selectMarkVaccinatedEmailMessage,
} from '../../../store/features/vaccinationOrder/vaccinationOrderSelectors';
import { selectCurrentUser } from '../../../store/features/auth/authSelectors';
import apiService from '../../../api/apiService';

import Modal from '../../../components/common/Modal/Modal';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import { generateQRCodeImage } from '../../../utils/qrCodeGenerator';

import './PatientVaccinationOrdersPage.css';

const PatientVaccinationOrdersPage = () => {
    const dispatch = useDispatch();
    const currentUser = useSelector(selectCurrentUser);
    const orders = useSelector(selectPatientOrders);
    const fetchStatus = useSelector(selectFetchPatientOrdersStatus);
    const fetchError = useSelector(selectFetchPatientOrdersError);

    const markPaidStatus = useSelector(selectMarkPaidStatus);
    const markPaidError = useSelector(selectMarkPaidError);
    const scheduleStatus = useSelector(selectScheduleAppointmentStatus);
    const scheduleError = useSelector(selectScheduleAppointmentError);
    const markVaccinatedStatus = useSelector(selectMarkVaccinatedStatus);
    const markVaccinatedError = useSelector(selectMarkVaccinatedError);
    const cancelStatus = useSelector(selectCancelOrderStatus);
    const cancelError = useSelector(selectCancelOrderError);

    // NEW Selectors for email status
    const markVaccinatedEmailStatus = useSelector(selectMarkVaccinatedEmailStatus);
    const markVaccinatedEmailMessage = useSelector(selectMarkVaccinatedEmailMessage);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', type: '' });
    const [selectedOrderIdForScheduling, setSelectedOrderIdForScheduling] = useState(null);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const [isSendingQrEmail, setIsSendingQrEmail] = useState(false);

    const patientId = currentUser?._id;

    const getTodayYYYYMMDD = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        if (patientId) {
            dispatch(fetchPatientVaccinationOrders(patientId));
        }
        return () => {
            dispatch(clearFetchPatientOrdersStatus());
            dispatch(clearMarkPaidStatus());
            dispatch(clearScheduleAppointmentStatus());
            dispatch(clearMarkVaccinatedStatus());
            dispatch(clearCancelOrderStatus());
        };
    }, [dispatch, patientId]);

    useEffect(() => {
        if (markPaidStatus === 'succeeded') {
            setModalContent({ title: 'Payment Confirmed!', type: 'info' });
            setIsModalOpen(true);
            dispatch(clearMarkPaidStatus());
            setSelectedOrderForPayment(null);
            setQrCodeDataUrl('');
        } else if (markPaidStatus === 'failed') {
            setModalContent({ title: 'Payment Failed', type: 'error' });
            setIsModalOpen(true);
            dispatch(clearMarkPaidStatus());
            setSelectedOrderForPayment(null);
            setQrCodeDataUrl('');
        }

        if (scheduleStatus === 'succeeded') {
            setModalContent({ title: 'Appointment Scheduled!', type: 'info' });
            setIsModalOpen(true);
            setSelectedOrderIdForScheduling(null);
            dispatch(clearScheduleAppointmentStatus());
            dispatch(fetchPatientVaccinationOrders(patientId));
        } else if (scheduleStatus === 'failed') {
            setModalContent({ title: 'Scheduling Failed', type: 'error' });
            setIsModalOpen(true);
            dispatch(clearScheduleAppointmentStatus());
        }

        if (markVaccinatedStatus === 'succeeded') {
            let title = 'Vaccination Confirmed!';
            let message = 'Vaccination recorded successfully.';

            // Check the email status returned from the backend via Redux state
            if (markVaccinatedEmailStatus === 'sent') {
                message = `Vaccination recorded. Certificate has been sent to your registered email address.`;
            } else if (markVaccinatedEmailStatus === 'failed' || markVaccinatedEmailStatus === 'error') {
                title = 'Vaccination Confirmed (Email Issue)';
                message = `Vaccination recorded, but there was an issue sending the certificate email: ${markVaccinatedEmailMessage || 'Unknown error'}. Please contact support.`;
            } else {
                // This case should ideally not happen if backend consistently sends status
                message = `Vaccination recorded. Certificate email status: ${markVaccinatedEmailStatus}.`;
            }

            setModalContent({ title: title, type: 'info', message: message });
            setIsModalOpen(true);
            dispatch(clearMarkVaccinatedStatus()); // This now also clears email status states
            dispatch(fetchPatientVaccinationOrders(patientId));
        } else if (markVaccinatedStatus === 'failed') {
            setModalContent({ title: 'Vaccination Confirmation Failed', type: 'error', message: markVaccinatedError || 'An unexpected error occurred.' });
            setIsModalOpen(true);
            dispatch(clearMarkVaccinatedStatus());
        }

        if (cancelStatus === 'succeeded') {
            setModalContent({ title: 'Order Cancelled!', type: 'info' });
            setIsModalOpen(true);
            dispatch(clearCancelOrderStatus());
            dispatch(fetchPatientVaccinationOrders(patientId));
        } else if (cancelStatus === 'failed') {
            setModalContent({ title: 'Order Cancellation Failed', type: 'error' });
            setIsModalOpen(true);
            dispatch(clearCancelOrderStatus());
        }
    }, [
        markPaidStatus, markPaidError, scheduleStatus, scheduleError,
        markVaccinatedStatus, markVaccinatedError, cancelStatus, cancelError,
        markVaccinatedEmailStatus, markVaccinatedEmailMessage, // NEW dependencies for email status
        dispatch, patientId
    ]);

    const handlePay = async (order) => {
        setSelectedOrderForPayment(order);
        setIsModalOpen(true);
        setModalContent({
            title: 'Scan to Pay',
            type: 'qr-payment',
            // message will be set dynamically below
        });
        const paymentPageUrl = `${window.location.origin}/pay-qr-simulate?orderId=${order._id}&amount=${order.charge_to_be_paid}`;

        try {
            // Display initial loading message while QR is generating and email is sending
            setModalContent(prev => ({
                ...prev,
                message: <div className="loading-qr">Generating QR Code and sending email...</div>
            }));
            const url = await generateQRCodeImage(paymentPageUrl, 200);
            setQrCodeDataUrl(url);

            // Update modal content with QR code and initial email status
            setModalContent((prevContent) => ({
                ...prevContent,
                message: (
                    <div className="qr-payment-modal-content">
                        <p>Please scan the QR code below to complete your payment of <strong>${order.charge_to_be_paid.toFixed(2)}</strong> for order #...{order._id.substring(order._id.length - 6)}.</p>
                        <p className="qr-instruction">
                            (This QR code leads to a simulated payment page. After scanning, return here.)
                        </p>
                        <img
                            src={url}
                            alt="Payment QR Code"
                            className="payment-qr-code"
                        />
                        {isSendingQrEmail ? (
                            <p className="sending-email-status">Sending QR code to your email...</p>
                        ) : (
                            <p className="email-status">Sending QR code to your email...</p>
                        )}
                    </div>
                )
            }));
            setIsSendingQrEmail(true);
            console.log("Sending request to backend for QR email using apiService...");

            const result = await apiService.sendQrCodeEmail(order._id, patientId, paymentPageUrl);
            console.log('QR code email dispatch result:', result.data.message);

            // Update modal message to confirm email sent successfully
            setModalContent((prevContent) => ({
                ...prevContent,
                message: (
                    <div className="qr-payment-modal-content">
                        <p>Please scan the QR code below to complete your payment of <strong>${order.charge_to_be_paid.toFixed(2)}</strong> for order #...{order._id.substring(order._id.length - 6)}.</p>
                        <p className="qr-instruction">
                            (This QR code leads to a simulated payment page. After scanning, return here.)
                        </p>
                        <img
                            src={url}
                            alt="Payment QR Code"
                            className="payment-qr-code"
                        />
                        <p className="email-status success-email-status">QR code sent to your registered email address!</p>
                    </div>
                )
            }));
        } catch (error) {
            console.error("Failed to generate QR code or send email:", error);
            const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
            setModalContent({
                title: 'Error',
                type: 'error',
                message: errorMessage
            });
            setQrCodeDataUrl('');
        } finally {
            setIsSendingQrEmail(false);
        }
    };

    const handleScheduleAppointmentClick = (orderId) => {
        setSelectedOrderIdForScheduling(orderId);
        setAppointmentDate('');
        setIsModalOpen(true);
        setModalContent({
            title: 'Schedule Your Appointment',
            type: 'schedule-appointment',
            // Message will be rendered directly in Modal children for reactivity
        });
    };

    const handleConfirmSchedule = () => {
        if (!appointmentDate) {
            alert('Please select an appointment date.');
            return;
        }

        const selectedDate = new Date(appointmentDate);
        selectedDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate.getTime() < today.getTime()) {
            alert('Appointment date cannot be in the past.');
            return;
        }
        dispatch(scheduleAppointment({ orderId: selectedOrderIdForScheduling, appointmentDate }));
        setAppointmentDate('');
    };

    const handleMarkVaccinated = (orderId) => {
        if (window.confirm('Are you sure you want to confirm this vaccination was received?')) {
            // The backend's mark-vaccinated endpoint will now trigger the certificate email.
            // We just dispatch the action to mark as vaccinated.
            dispatch(markOrderAsVaccinated({ orderId, vaccinationDate: new Date().toISOString() }));
        }
    };

    const handleCancelOrder = (orderId) => {
        if (window.confirm('Are you sure you want to cancel this vaccination order?')) {
            dispatch(cancelOrderByPatient(orderId));
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOrderIdForScheduling(null);
        setAppointmentDate('');

        if (selectedOrderForPayment) {
            dispatch(fetchPatientVaccinationOrders(patientId));
        }
        setSelectedOrderForPayment(null);

        setQrCodeDataUrl('');
        setIsSendingQrEmail(false);
        setModalContent({ title: '', type: '' });
    };

    // Helper function to render dynamic modal content based on type
    const renderModalBody = () => {
        switch (modalContent.type) {
            case 'schedule-appointment':
                return (
                    <>
                        <p>Please select a date for your vaccination appointment:</p>
                        <Input
                            label="Appointment Date"
                            id="appointmentDate"
                            type="date"
                            value={appointmentDate}
                            onChange={(e) => {
                                console.log("e.target.value: " + e.target.value);
                                setAppointmentDate(e.target.value);
                                // Log the state after a short delay to see the updated value
                                setTimeout(() => {
                                    console.log("appointmentDate (after setState): " + appointmentDate);
                                }, 0);
                            }}
                            min={getTodayYYYYMMDD()}
                            required
                        />
                    </>
                );
            case 'qr-payment':
                return modalContent.message;
            case 'info':
            case 'error':
            default:
                return modalContent.message;
        }
    };

    if (fetchStatus === 'loading') {
        return <div className="loading">Loading your approved orders...</div>;
    }

    if (fetchError) {
        return <div className="error-message">Error fetching orders: {fetchError}</div>;
    }

    if (!patientId) {
        return <div className="info-message">Please log in as a patient to view your orders.</div>;
    }

    return (
        <div className="patient-approved-orders-container">
            <h2>My Approved Vaccination Orders</h2>

            {orders.length === 0 ? (
                <p>You have no approved vaccination orders at this time.</p>
            ) : (
                <div className="orders-grid">
                    {orders.map((order) => {
                        const isPaid = order.paymentStatus === 'paid';
                        const isScheduled = order.appointmentStatus === 'scheduled';
                        const isPendingScheduling = order.appointmentStatus === 'pending_scheduling';
                        const isVaccinated = order.vaccinationStatus === 'vaccinated';
                        const isCancelled = order.vaccinationStatus === 'cancelled';
                        const isPendingApproval = order.vaccinationStatus === 'pending_approval';


                        const appointmentDateObj = order.appointment_date ? new Date(order.appointment_date) : null;
                        const isAppointmentInFuture = appointmentDateObj && appointmentDateObj.getTime() > Date.now();
                        const isAppointmentInPastOrToday = appointmentDateObj && appointmentDateObj.getTime() <= Date.now();
                        return (
                            <div key={order._id} className={`order-card ${isCancelled ? 'card-cancelled' : ''} ${isVaccinated ? 'card-vaccinated' : ''}`}>
                                <h3>Order #{order._id.substring(order._id.length - 6)}</h3>
                                <p><strong>Hospital:</strong> {order.hospitalId?.name || 'N/A'}</p>
                                <p><strong>Vaccine:</strong> {order.vaccineId?.name || 'N/A'} ({order.vaccineId?.type || 'N/A'})</p>
                                <p><strong>Dose:</strong> {order.dose_number}</p>
                                <p><strong>Charge:</strong> ${order.charge_to_be_paid.toFixed(2)}</p>
                                <p><strong>Payment Status:</strong> <span className={`status-${order.paymentStatus}`}>{order.paymentStatus.replace('_', ' ')}</span></p>
                                <p><strong>Appointment Status:</strong> <span className={`status-${order.appointmentStatus}`}>{order.appointmentStatus.replace('_', ' ')}</span></p>
                                <p><strong>Vaccination Status:</strong> <span className={`status-${order.vaccinationStatus}`}>{order.vaccinationStatus.replace('_', ' ')}</span></p>

                                {order.appointment_date && (
                                    <p><strong>Appointment Date:</strong> {new Date(order.appointment_date).toLocaleDateString()} at {new Date(order.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                )}

                                <div className="order-actions">
                                    {!isPendingApproval && !isPaid && !isCancelled && !isVaccinated && (
                                        <Button
                                            onClick={() => handlePay(order)}
                                            disabled={markPaidStatus === 'loading'}
                                            variant="primary"
                                        >
                                            {markPaidStatus === 'loading' ? 'Processing...' : 'Pay Now'}
                                        </Button>
                                    )}

                                    {!isPendingApproval && isPaid && isPendingScheduling && !isCancelled && !isVaccinated && (
                                        <Button
                                            onClick={() => handleScheduleAppointmentClick(order._id)}
                                            disabled={scheduleStatus === 'loading'}
                                            variant="secondary"
                                        >
                                            {scheduleStatus === 'loading' ? 'Scheduling...' : 'Schedule Appointment'}
                                        </Button>
                                    )}

                                    {!isPendingApproval && isPaid && isScheduled && isAppointmentInFuture && !isCancelled && !isVaccinated && (
                                        <p className="appointment-info">Appointment set for: {new Date(order.appointment_date).toLocaleDateString()}</p>
                                    )}

                                    {!isPendingApproval && isPaid && isScheduled && isAppointmentInPastOrToday && !isCancelled && !isVaccinated && (
                                        <Button
                                            onClick={() => handleMarkVaccinated(order._id)}
                                            disabled={markVaccinatedStatus === 'loading'}
                                            variant="success"
                                        >
                                            {markVaccinatedStatus === 'loading' ? 'Confirming...' : 'Mark Vaccinated'}
                                        </Button>
                                    )}

                                    {!isPendingApproval && !isCancelled && !isVaccinated && (
                                        <Button
                                            onClick={() => handleCancelOrder(order._id)}
                                            disabled={cancelStatus === 'loading'}
                                            variant="danger"
                                        >
                                            {cancelStatus === 'loading' ? 'Cancelling...' : 'Cancel Order'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={modalContent.title}
                footer={
                    selectedOrderIdForScheduling ?
                        (
                            <Button onClick={handleConfirmSchedule} disabled={scheduleStatus === 'loading'}>
                                {scheduleStatus === 'loading' ? 'Confirm Schedule' : 'Confirm Schedule'}
                            </Button>
                        ) : (
                            <Button onClick={closeModal}>Close</Button>
                        )
                }
            >
                {/* Render content dynamically based on modalContent.type */}
                {renderModalBody()}
            </Modal>
        </div>
    );
};

export default PatientVaccinationOrdersPage;

// // src/pages/Patient/PatientVaccinationOrders/PatientVaccinationOrdersPage.js
//
// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//     fetchPatientVaccinationOrders,
//     markOrderAsPaid,
//     scheduleAppointment,
//     markOrderAsVaccinated,
//     cancelOrderByPatient,
//     clearFetchPatientOrdersStatus,
//     clearMarkPaidStatus,
//     clearScheduleAppointmentStatus,
//     clearMarkVaccinatedStatus,
//     clearCancelOrderStatus,
// } from '../../../store/features/vaccinationOrder/vaccinationOrderSlice';
// import {
//     selectPatientOrders,
//     selectFetchPatientOrdersStatus,
//     selectFetchPatientOrdersError,
//     selectMarkPaidStatus,
//     selectMarkPaidError, // Corrected from `markPaidError`
//     selectScheduleAppointmentStatus,
//     selectScheduleAppointmentError,
//     selectMarkVaccinatedStatus,
//     selectMarkVaccinatedError,
//     selectCancelOrderStatus,
//     selectCancelOrderError,
// } from '../../../store/features/vaccinationOrder/vaccinationOrderSelectors';
// import { selectCurrentUser } from '../../../store/features/auth/authSelectors';
// import apiService from '../../../api/apiService';
//
// import Modal from '../../../components/common/Modal/Modal';
// import Button from '../../../components/common/Button/Button';
// import Input from '../../../components/common/Input/Input';
// import { generateQRCodeImage } from '../../../utils/qrCodeGenerator';
//
// import './PatientVaccinationOrdersPage.css';
//
// const PatientVaccinationOrdersPage = () => {
//     const dispatch = useDispatch();
//     const currentUser = useSelector(selectCurrentUser);
//     const orders = useSelector(selectPatientOrders);
//     const fetchStatus = useSelector(selectFetchPatientOrdersStatus);
//     const fetchError = useSelector(selectFetchPatientOrdersError);
//
//     const markPaidStatus = useSelector(selectMarkPaidStatus);
//     const markPaidError = useSelector(selectMarkPaidError); // Corrected
//     const scheduleStatus = useSelector(selectScheduleAppointmentStatus);
//     const scheduleError = useSelector(selectScheduleAppointmentError);
//     const markVaccinatedStatus = useSelector(selectMarkVaccinatedStatus);
//     const markVaccinatedError = useSelector(selectMarkVaccinatedError);
//     const cancelStatus = useSelector(selectCancelOrderStatus);
//     const cancelError = useSelector(selectCancelOrderError);
//
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [modalContent, setModalContent] = useState({ title: '', type: '' }); // Added 'type' to distinguish modal content
//     const [selectedOrderIdForScheduling, setSelectedOrderIdForScheduling] = useState(null);
//     const [appointmentDate, setAppointmentDate] = useState(''); // Holds YYYY-MM-DD or ""
//     const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
//     const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
//     const [isSendingQrEmail, setIsSendingQrEmail] = useState(false);
//
//     const patientId = currentUser?._id;
//
//     const getTodayYYYYMMDD = () => {
//         const today = new Date();
//         const year = today.getFullYear();
//         const month = String(today.getMonth() + 1).padStart(2, '0');
//         const day = String(today.getDate()).padStart(2, '0');
//         return `${year}-${month}-${day}`;
//     };
//
//     useEffect(() => {
//         if (patientId) {
//             dispatch(fetchPatientVaccinationOrders(patientId));
//         }
//         return () => {
//             dispatch(clearFetchPatientOrdersStatus());
//             dispatch(clearMarkPaidStatus());
//             dispatch(clearScheduleAppointmentStatus());
//             dispatch(clearMarkVaccinatedStatus());
//             dispatch(clearCancelOrderStatus());
//         };
//     }, [dispatch, patientId]);
//
//     useEffect(() => {
//         if (markPaidStatus === 'succeeded') {
//             setModalContent({ title: 'Payment Confirmed!', type: 'info' }); // Use type for message
//             setIsModalOpen(true);
//             dispatch(clearMarkPaidStatus());
//             setSelectedOrderForPayment(null);
//             setQrCodeDataUrl('');
//         } else if (markPaidStatus === 'failed') {
//             setModalContent({ title: 'Payment Failed', type: 'error' }); // Use type for message
//             setIsModalOpen(true);
//             dispatch(clearMarkPaidStatus());
//             setSelectedOrderForPayment(null);
//             setQrCodeDataUrl('');
//         }
//
//         if (scheduleStatus === 'succeeded') {
//             setModalContent({ title: 'Appointment Scheduled!', type: 'info' }); // Use type for message
//             setIsModalOpen(true);
//             setSelectedOrderIdForScheduling(null);
//             dispatch(clearScheduleAppointmentStatus());
//             dispatch(fetchPatientVaccinationOrders(patientId));
//         } else if (scheduleStatus === 'failed') {
//             setModalContent({ title: 'Scheduling Failed', type: 'error' }); // Use type for message
//             setIsModalOpen(true);
//             dispatch(clearScheduleAppointmentStatus());
//         }
//
//         if (markVaccinatedStatus === 'succeeded') {
//             setModalContent({ title: 'Vaccination Confirmed!', type: 'info' }); // Use type for message
//             setIsModalOpen(true);
//             dispatch(clearMarkVaccinatedStatus());
//             dispatch(fetchPatientVaccinationOrders(patientId));
//         } else if (markVaccinatedStatus === 'failed') {
//             setModalContent({ title: 'Vaccination Confirmation Failed', type: 'error' }); // Use type for message
//             setIsModalOpen(true);
//             dispatch(clearMarkVaccinatedStatus());
//         }
//
//         if (cancelStatus === 'succeeded') {
//             setModalContent({ title: 'Order Cancelled!', type: 'info' }); // Use type for message
//             setIsModalOpen(true);
//             dispatch(clearCancelOrderStatus());
//             dispatch(fetchPatientVaccinationOrders(patientId));
//         } else if (cancelStatus === 'failed') {
//             setModalContent({ title: 'Order Cancellation Failed', type: 'error' }); // Use type for message
//             setIsModalOpen(true);
//             dispatch(clearCancelOrderStatus());
//         }
//     }, [
//         markPaidStatus, markPaidError, scheduleStatus, scheduleError,
//         markVaccinatedStatus, markVaccinatedError, cancelStatus, cancelError,
//         dispatch, patientId
//     ]);
//
//     const handlePay = async (order) => {
//         setSelectedOrderForPayment(order);
//         setIsModalOpen(true);
//
//         setModalContent({
//             title: 'Scan to Pay',
//             type: 'qr-payment', // Distinguish QR payment modal
//             // message will be set dynamically below
//         });
//
//         const paymentPageUrl = `${window.location.origin}/pay-qr-simulate?orderId=${order._id}&amount=${order.charge_to_be_paid}`;
//
//         try {
//             // Display initial loading message while QR is generating and email is sending
//             setModalContent(prev => ({
//                 ...prev,
//                 message: <div className="loading-qr">Generating QR Code and sending email...</div>
//             }));
//
//             const url = await generateQRCodeImage(paymentPageUrl, 200);
//             setQrCodeDataUrl(url);
//
//             // Update modal content with QR code and initial email status
//             setModalContent((prevContent) => ({
//                 ...prevContent,
//                 message: (
//                     <div className="qr-payment-modal-content">
//                         <p>Please scan the QR code below to complete your payment of <strong>${order.charge_to_be_paid.toFixed(2)}</strong> for order #...{order._id.substring(order._id.length - 6)}.</p>
//                         <p className="qr-instruction">
//                             (This QR code leads to a simulated payment page. After scanning, return here.)
//                         </p>
//                         <img
//                             src={url}
//                             alt="Payment QR Code"
//                             className="payment-qr-code"
//                         />
//                         {isSendingQrEmail ? (
//                             <p className="sending-email-status">Sending QR code to your email...</p>
//                         ) : (
//                             <p className="email-status">Sending QR code to your email...</p>
//                         )}
//                     </div>
//                 )
//             }));
//
//             setIsSendingQrEmail(true);
//             console.log("Sending request to backend for QR email using apiService...");
//
//             const result = await apiService.sendQrCodeEmail(order._id, patientId, paymentPageUrl);
//
//             console.log('QR code email dispatch result:', result.data.message);
//
//             // Update modal message to confirm email sent successfully
//             setModalContent((prevContent) => ({
//                 ...prevContent,
//                 message: (
//                     <div className="qr-payment-modal-content">
//                         <p>Please scan the QR code below to complete your payment of <strong>${order.charge_to_be_paid.toFixed(2)}</strong> for order #...{order._id.substring(order._id.length - 6)}.</p>
//                         <p className="qr-instruction">
//                             (This QR code leads to a simulated payment page. After scanning, return here.)
//                         </p>
//                         <img
//                             src={url}
//                             alt="Payment QR Code"
//                             className="payment-qr-code"
//                         />
//                         <p className="email-status success-email-status">QR code sent to your registered email address!</p>
//                     </div>
//                 )
//             }));
//
//         } catch (error) {
//             console.error("Failed to generate QR code or send email:", error);
//             const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
//             setModalContent({
//                 title: 'Error',
//                 type: 'error', // Use type for error
//                 message: errorMessage
//             });
//             setQrCodeDataUrl('');
//         } finally {
//             setIsSendingQrEmail(false);
//         }
//     };
//
//     const handleScheduleAppointmentClick = (orderId) => {
//         setSelectedOrderIdForScheduling(orderId);
//         setAppointmentDate(''); // Ensure it's empty on opening
//         setIsModalOpen(true);
//         setModalContent({
//             title: 'Schedule Your Appointment',
//             type: 'schedule-appointment', // New: Distinguish this modal type
//             // Message will be rendered directly in Modal children for reactivity
//         });
//     };
//
//     const handleConfirmSchedule = () => {
//         if (!appointmentDate) {
//             alert('Please select an appointment date.');
//             return;
//         }
//
//         const selectedDate = new Date(appointmentDate);
//         selectedDate.setHours(0, 0, 0, 0);
//
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//
//         if (selectedDate.getTime() < today.getTime()) {
//             alert('Appointment date cannot be in the past.');
//             return;
//         }
//         dispatch(scheduleAppointment({ orderId: selectedOrderIdForScheduling, appointmentDate }));
//         setAppointmentDate(''); // Clear immediately upon dispatch to reset the input
//     };
//
//     const handleMarkVaccinated = (orderId) => {
//         if (window.confirm('Are you sure you want to confirm this vaccination was received?')) {
//             dispatch(markOrderAsVaccinated({ orderId, vaccinationDate: new Date().toISOString() }));
//         }
//     };
//
//     const handleCancelOrder = (orderId) => {
//         if (window.confirm('Are you sure you want to cancel this vaccination order?')) {
//             dispatch(cancelOrderByPatient(orderId));
//         }
//     };
//
//     const closeModal = () => {
//         setIsModalOpen(false);
//         setSelectedOrderIdForScheduling(null);
//         setAppointmentDate('');
//
//         if (selectedOrderForPayment) {
//             dispatch(fetchPatientVaccinationOrders(patientId));
//         }
//         setSelectedOrderForPayment(null);
//
//         setQrCodeDataUrl('');
//         setIsSendingQrEmail(false);
//         setModalContent({ title: '', type: '' }); // Reset modal content type and title
//     };
//
//     // Helper function to render dynamic modal content based on type
//     const renderModalBody = () => {
//         switch (modalContent.type) {
//             case 'schedule-appointment':
//                 return (
//                     <>
//                         <p>Please select a date for your vaccination appointment:</p>
//                         <Input
//                             label="Appointment Date"
//                             id="appointmentDate"
//                             type="date"
//                             value={appointmentDate}
//                             onChange={(e) => {
//                                 console.log("e.target.value: " + e.target.value);
//                                 setAppointmentDate(e.target.value);
//                                 // Log the state after a short delay to see the updated value
//                                 setTimeout(() => {
//                                     console.log("appointmentDate (after setState): " + appointmentDate);
//                                 }, 0);
//                             }}
//                             min={getTodayYYYYMMDD()}
//                             required
//                         />
//                     </>
//                 );
//             case 'qr-payment':
//                 return modalContent.message; // Message is already JSX from handlePay
//             case 'info':
//             case 'error':
//             default:
//                 return modalContent.message; // For simple info/error messages
//         }
//     };
//
//
//     if (fetchStatus === 'loading') {
//         return <div className="loading">Loading your approved orders...</div>;
//     }
//
//     if (fetchError) {
//         return <div className="error-message">Error fetching orders: {fetchError}</div>;
//     }
//
//     if (!patientId) {
//         return <div className="info-message">Please log in as a patient to view your orders.</div>;
//     }
//
//     return (
//         <div className="patient-approved-orders-container">
//             <h2>My Approved Vaccination Orders</h2>
//
//             {orders.length === 0 ? (
//                 <p>You have no approved vaccination orders at this time.</p>
//             ) : (
//                 <div className="orders-grid">
//                     {orders.map((order) => {
//                         const isPaid = order.paymentStatus === 'paid';
//                         const isScheduled = order.appointmentStatus === 'scheduled';
//                         const isPendingScheduling = order.appointmentStatus === 'pending_scheduling';
//                         const isVaccinated = order.vaccinationStatus === 'vaccinated';
//                         const isCancelled = order.vaccinationStatus === 'cancelled';
//                         const isPendingApproval = order.vaccinationStatus === 'pending_approval';
//
//                         const appointmentDateObj = order.appointment_date ? new Date(order.appointment_date) : null;
//                         const isAppointmentInFuture = appointmentDateObj && appointmentDateObj.getTime() > Date.now();
//                         const isAppointmentInPastOrToday = appointmentDateObj && appointmentDateObj.getTime() <= Date.now();
//                         return (
//                             <div key={order._id} className={`order-card ${isCancelled ? 'card-cancelled' : ''} ${isVaccinated ? 'card-vaccinated' : ''}`}>
//                                 <h3>Order #{order._id.substring(order._id.length - 6)}</h3>
//                                 <p><strong>Hospital:</strong> {order.hospitalId?.name || 'N/A'}</p>
//                                 <p><strong>Vaccine:</strong> {order.vaccineId?.name || 'N/A'} ({order.vaccineId?.type || 'N/A'})</p>
//                                 <p><strong>Dose:</strong> {order.dose_number}</p>
//                                 <p><strong>Charge:</strong> ${order.charge_to_be_paid.toFixed(2)}</p>
//                                 <p><strong>Payment Status:</strong> <span className={`status-${order.paymentStatus}`}>{order.paymentStatus.replace('_', ' ')}</span></p>
//                                 <p><strong>Appointment Status:</strong> <span className={`status-${order.appointmentStatus}`}>{order.appointmentStatus.replace('_', ' ')}</span></p>
//                                 <p><strong>Vaccination Status:</strong> <span className={`status-${order.vaccinationStatus}`}>{order.vaccinationStatus.replace('_', ' ')}</span></p>
//
//                                 {order.appointment_date && (
//                                     <p><strong>Appointment Date:</strong> {new Date(order.appointment_date).toLocaleDateString()} at {new Date(order.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
//                                 )}
//
//                                 <div className="order-actions">
//                                     {!isPendingApproval && !isPaid && !isCancelled && !isVaccinated && (
//                                         <Button
//                                             onClick={() => handlePay(order)}
//                                             disabled={markPaidStatus === 'loading'}
//                                             variant="primary"
//                                         >
//                                             {markPaidStatus === 'loading' ? 'Processing...' : 'Pay Now'}
//                                         </Button>
//                                     )}
//
//                                     {!isPendingApproval && isPaid && isPendingScheduling && !isCancelled && !isVaccinated && (
//                                         <Button
//                                             onClick={() => handleScheduleAppointmentClick(order._id)}
//                                             disabled={scheduleStatus === 'loading'}
//                                             variant="secondary"
//                                         >
//                                             {scheduleStatus === 'loading' ? 'Scheduling...' : 'Schedule Appointment'}
//                                         </Button>
//                                     )}
//
//                                     {!isPendingApproval && isPaid && isScheduled && isAppointmentInFuture && !isCancelled && !isVaccinated && (
//                                         <p className="appointment-info">Appointment set for: {new Date(order.appointment_date).toLocaleDateString()}</p>
//                                     )}
//
//                                     {!isPendingApproval && isPaid && isScheduled && isAppointmentInPastOrToday && !isCancelled && !isVaccinated && (
//                                         <Button
//                                             onClick={() => handleMarkVaccinated(order._id)}
//                                             disabled={markVaccinatedStatus === 'loading'}
//                                             variant="success"
//                                         >
//                                             {markVaccinatedStatus === 'loading' ? 'Confirming...' : 'Mark Vaccinated'}
//                                         </Button>
//                                     )}
//
//                                     {!isPendingApproval && !isCancelled && !isVaccinated && (
//                                         <Button
//                                             onClick={() => handleCancelOrder(order._id)}
//                                             disabled={cancelStatus === 'loading'}
//                                             variant="danger"
//                                         >
//                                             {cancelStatus === 'loading' ? 'Cancelling...' : 'Cancel Order'}
//                                         </Button>
//                                     )}
//                                 </div>
//                             </div>
//                         );
//                     })}
//                 </div>
//             )}
//
//             <Modal
//                 isOpen={isModalOpen}
//                 onClose={closeModal}
//                 title={modalContent.title}
//                 footer={
//                     selectedOrderIdForScheduling ?
//                         (
//                             <Button onClick={handleConfirmSchedule} disabled={scheduleStatus === 'loading'}>
//                                 {scheduleStatus === 'loading' ? 'Confirm Schedule' : 'Confirm Schedule'}
//                             </Button>
//                         ) : (
//                             <Button onClick={closeModal}>Close</Button>
//                         )
//                 }
//             >
//                 {/* Render content dynamically based on modalContent.type */}
//                 {renderModalBody()}
//             </Modal>
//         </div>
//     );
// };
//
// export default PatientVaccinationOrdersPage;
