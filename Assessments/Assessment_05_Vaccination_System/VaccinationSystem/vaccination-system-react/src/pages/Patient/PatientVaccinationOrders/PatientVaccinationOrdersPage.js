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
    selectMarkPaidError,
    selectScheduleAppointmentStatus,
    selectScheduleAppointmentError,
    selectMarkVaccinatedStatus,
    selectMarkVaccinatedError,
    selectCancelOrderStatus,
    selectCancelOrderError,
} from '../../../store/features/vaccinationOrder/vaccinationOrderSelectors';
import { selectCurrentUser } from '../../../store/features/auth/authSelectors';

import Modal from '../../../components/common/Modal/Modal';
import Button from '../../../components/common/Button/Button';
import Input from '../../../components/common/Input/Input';
import { generateQRCodeImage } from '../../../utils/qrCodeGenerator'; // Import the QR code utility

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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '' });
    const [selectedOrderIdForScheduling, setSelectedOrderIdForScheduling] = useState(null);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null); // State for payment order
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState(''); // State to store QR code data URL

    const patientId = currentUser?._id;

    // Fetch orders on component mount
    useEffect(() => {
        if (patientId) {
            dispatch(fetchPatientVaccinationOrders());
        }
        return () => {
            dispatch(clearFetchPatientOrdersStatus());
            dispatch(clearMarkPaidStatus());
            dispatch(clearScheduleAppointmentStatus());
            dispatch(clearMarkVaccinatedStatus());
            dispatch(clearCancelOrderStatus());
        };
    }, [dispatch, patientId]);

    // Handle success/failure of actions
    useEffect(() => {
        if (markPaidStatus === 'succeeded') {
            setModalContent({ title: 'Payment Confirmed!', message: 'Your payment has been successfully processed.' });
            setIsModalOpen(true);
            dispatch(clearMarkPaidStatus());
            dispatch(fetchPatientVaccinationOrders()); // Re-fetch orders
            setSelectedOrderForPayment(null); // Clear selected payment order
            setQrCodeDataUrl(''); // Clear QR code URL
        } else if (markPaidStatus === 'failed') {
            setModalContent({ title: 'Payment Failed', message: markPaidError || 'Failed to process payment.' });
            setIsModalOpen(true);
            dispatch(clearMarkPaidStatus());
            setSelectedOrderForPayment(null); // Clear selected payment order
            setQrCodeDataUrl(''); // Clear QR code URL
        }

        if (scheduleStatus === 'succeeded') {
            setModalContent({ title: 'Appointment Scheduled!', message: 'Your vaccination appointment has been successfully scheduled.' });
            setIsModalOpen(true);
            setAppointmentDate('');
            setSelectedOrderIdForScheduling(null);
            dispatch(clearScheduleAppointmentStatus());
            dispatch(fetchPatientVaccinationOrders());
        } else if (scheduleStatus === 'failed') {
            setModalContent({ title: 'Scheduling Failed', message: scheduleError || 'Failed to schedule appointment.' });
            setIsModalOpen(true);
            dispatch(clearScheduleAppointmentStatus());
        }

        if (markVaccinatedStatus === 'succeeded') {
            setModalContent({ title: 'Vaccination Confirmed!', message: 'Your vaccination has been successfully recorded.' });
            setIsModalOpen(true);
            dispatch(clearMarkVaccinatedStatus());
            dispatch(fetchPatientVaccinationOrders());
        } else if (markVaccinatedStatus === 'failed') {
            setModalContent({ title: 'Vaccination Confirmation Failed', message: markVaccinatedError || 'Failed to confirm vaccination.' });
            setIsModalOpen(true);
            dispatch(clearMarkVaccinatedStatus());
        }

        if (cancelStatus === 'succeeded') {
            setModalContent({ title: 'Order Cancelled!', message: 'Your vaccination order has been successfully cancelled.' });
            setIsModalOpen(true);
            dispatch(clearCancelOrderStatus());
            dispatch(fetchPatientVaccinationOrders());
        } else if (cancelStatus === 'failed') {
            setModalContent({ title: 'Order Cancellation Failed', message: cancelError || 'Failed to cancel order.' });
            setIsModalOpen(true);
            dispatch(clearCancelOrderStatus());
        }
    }, [
        markPaidStatus, markPaidError, scheduleStatus, scheduleError,
        markVaccinatedStatus, markVaccinatedError, cancelStatus, cancelError,
        dispatch // Removed fetchPatientVaccinationOrders as it's not a direct dependency for this useEffect
    ]);

    // Modified handlePay to open QR modal with loading state
    const handlePay = async (order) => {
        setSelectedOrderForPayment(order);
        setIsModalOpen(true); // Open modal first

        // Set a loading message initially
        setModalContent({
            title: 'Scan to Pay',
            message: <div className="loading-qr">Generating QR Code...</div>
        });

        const qrContent = JSON.stringify({
            orderId: order._id,
            amount: order.charge_to_be_paid,
            vaccine: order.vaccineId?.name,
            hospital: order.hospitalId?.name
        });

        try {
            const url = await generateQRCodeImage(qrContent, 200);
            setQrCodeDataUrl(url); // Store URL in state
            setModalContent({
                title: 'Scan to Pay',
                message: (
                    <div className="qr-payment-modal-content">
                        <p>Please scan the QR code below to complete your payment of <strong>${order.charge_to_be_paid.toFixed(2)}</strong> for order #...{order._id.substring(order._id.length - 6)}.</p>
                        <img
                            src={url} // Use the directly generated URL here
                            alt="Payment QR Code"
                            className="payment-qr-code"
                        />
                        <p className="qr-instruction">
                            (This is a simulated payment. After scanning, click "Confirm Payment".)
                        </p>
                    </div>
                )
            });
        } catch (error) {
            console.error("Failed to generate QR code:", error);
            setModalContent({
                title: 'Error',
                message: 'Failed to generate QR code. Please try again.'
            });
            setQrCodeDataUrl(''); // Clear on error
        }
    };

    // Function to confirm payment after QR scan (simulated)
    const handleConfirmPayment = () => {
        if (selectedOrderForPayment) {
            if (window.confirm('Are you sure you want to confirm this payment?')) {
                dispatch(markOrderAsPaid(selectedOrderForPayment._id));
                // Modal will close automatically based on useEffect for markPaidStatus
            }
        }
    };

    const handleScheduleAppointmentClick = (orderId) => {
        setSelectedOrderIdForScheduling(orderId);
        setAppointmentDate('');
        setIsModalOpen(true);
        setModalContent({
            title: 'Schedule Your Appointment',
            message: (
                <>
                    <p>Please select a date for your vaccination appointment:</p>
                    <Input
                        label="Appointment Date"
                        id="appointmentDate"
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                    />
                </>
            )
        });
    };

    const handleConfirmSchedule = () => {
        if (!appointmentDate) {
            alert('Please select an appointment date.');
            return;
        }
        if (new Date(appointmentDate).getTime() < Date.now()) {
            alert('Appointment date cannot be in the past.');
            return;
        }
        dispatch(scheduleAppointment({ orderId: selectedOrderIdForScheduling, appointmentDate }));
        // Modal will close automatically based on useEffect for scheduleStatus
    };

    const handleMarkVaccinated = (orderId) => {
        if (window.confirm('Are you sure you want to confirm this vaccination was received?')) {
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
        setSelectedOrderForPayment(null); // Clear selected payment order
        setQrCodeDataUrl(''); // Clear QR code URL
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
                        const isPendingApproval = order.vaccinationStatus === 'pending_approval'; // New condition for pending approval

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
                                            onClick={() => handlePay(order)} // Pass the full order object
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
                    selectedOrderForPayment ? ( // If a payment order is selected, show confirm payment button
                        <Button onClick={handleConfirmPayment} disabled={markPaidStatus === 'loading'}>
                            {markPaidStatus === 'loading' ? 'Confirming...' : 'Confirm Payment'}
                        </Button>
                    ) : selectedOrderIdForScheduling ? ( // If scheduling an appointment
                        <Button onClick={handleConfirmSchedule} disabled={scheduleStatus === 'loading'}>
                            {scheduleStatus === 'loading' ? 'Confirm Schedule' : 'Confirm Schedule'}
                        </Button>
                    ) : ( // Default close button
                        <Button onClick={closeModal}>Close</Button>
                    )
                }
            >
                {modalContent.message}
            </Modal>
        </div>
    );
};

export default PatientVaccinationOrdersPage;