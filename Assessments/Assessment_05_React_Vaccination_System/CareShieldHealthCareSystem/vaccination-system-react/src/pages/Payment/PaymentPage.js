import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // Import useDispatch
import { markOrderAsPaid } from '../../store/features/vaccinationOrder/vaccinationOrderSlice'; // Import the action

import './PaymentPage.css';

const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch(); // Initialize useDispatch

    const [orderId, setOrderId] = useState(null);
    const [amount, setAmount] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending', 'processing', 'completed', 'failed'
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get('orderId');
        const amt = params.get('amount');

        if (id && amt) {
            setOrderId(id);
            setAmount(parseFloat(amt).toFixed(2));
            setPaymentStatus('pending'); // Reset status on new orderId
        } else {
            setPaymentStatus('failed');
            setErrorMessage('Invalid payment request: Missing order ID or amount.');
            console.error('Missing orderId or amount in URL parameters.');
        }
    }, [location.search]);

    const handlePerformPayment = async () => {
        if (!orderId || !amount) {
            setErrorMessage('Cannot process payment: Order details are missing.');
            setPaymentStatus('failed');
            return;
        }

        setPaymentStatus('processing');
        setErrorMessage(''); // Clear previous errors

        try {
            // --- This is where a REAL backend API call would go ---
            /*
            const response = await axios.post('/api/process-payment', {
                orderId: orderId,
                amount: amount,
            });

            if (response.data.success) {
                // If your backend call successfully marks the order as paid,
                // you might not need to dispatch markOrderAsPaid here,
                // just navigate back and let the patient orders page refetch.
                setPaymentStatus('completed');
            } else {
                setPaymentStatus('failed');
                setErrorMessage(response.data.message || 'Payment processing failed on the server.');
            }
            */

            // For now, we'll keep a *simulated* delay and success/failure for demonstration
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network request delay

            // Simulate success or failure
            const simulatedSuccess = Math.random() > 0.1; // 90% chance of success for demo

            if (simulatedSuccess) {
                setPaymentStatus('completed');
                // *** Dispatch the Redux action to mark the order as paid ***
                dispatch(markOrderAsPaid(orderId)); // Pass the orderId to the action
            } else {
                setPaymentStatus('failed');
                setErrorMessage('Simulated payment failed. Please try again.');
            }

        } catch (error) {
            console.error("Error during payment processing:", error);
            setPaymentStatus('failed');
            setErrorMessage('An unexpected error occurred during payment. Please try again.');
        }
    };

    const handleGoBack = () => {
        navigate('/patient/orders'); // Navigate back to the patient's orders page
    };

    let content;
    if (paymentStatus === 'failed') {
        content = (
            <>
                <p className="error-message">Payment Failed!</p>
                <p>{errorMessage || 'There was an issue processing your payment. Please try again.'}</p>
                <button className="payment-button" onClick={handleGoBack}>Go back to My Orders</button>
            </>
        );
    } else if (paymentStatus === 'pending') {
        content = (
            <>
                <p>You are about to pay for Order #...{orderId ? orderId.substring(orderId.length - 6) : 'N/A'}</p>
                <h3>Amount: ${amount}</h3>
                <button className="payment-button" onClick={handlePerformPayment}>Perform Payment</button>
            </>
        );
    } else if (paymentStatus === 'processing') {
        content = <p className="processing-message">Processing your payment...</p>;
    } else if (paymentStatus === 'completed') {
        content = (
            <>
                <p className="success-message">Payment Completed Successfully!</p>
                <p>Order #...{orderId ? orderId.substring(orderId.length - 6) : 'N/A'} for ${amount} has been processed.</p>
                <button className="payment-button" onClick={handleGoBack}>Go back to My Orders</button>
            </>
        );
    }

    return (
        <div className="payment-simulate-container">
            <h2>Payment Gateway</h2>
            <div className="payment-content">
                {content}
            </div>
        </div>
    );
};

export default PaymentPage;