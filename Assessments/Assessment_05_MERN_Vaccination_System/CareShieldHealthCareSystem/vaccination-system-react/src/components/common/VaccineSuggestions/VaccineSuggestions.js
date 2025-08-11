// components/common/VaccineSuggestions/VaccineSuggestions.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, ListGroup, Card } from 'react-bootstrap';

import { fetchVaccineSuggestions } from '../../../store/features/vaccineSuggestions/vaccineSuggestionsSlice';
import { selectCurrentUser } from '../../../store/features/auth/authSelectors';
import {
    selectVaccineSuggestions,
    selectSuggestionsStatus,
    selectSuggestionsError,
} from '../../../store/features/vaccineSuggestions/vaccineSuggestionsSelectors';

// Add this CSS style to a CSS file or as a style block in your component
// You can also use inline styles, but this is a cleaner approach
// You can adjust the height value (e.g., '300px') to whatever size you prefer.
const listStyle = {
    maxHeight: '200px', // Set a maximum height for the list
    overflowY: 'auto', // Enable vertical scrolling if content exceeds the height
};

const VaccineSuggestions = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const currentUser = useSelector(selectCurrentUser);

    const patientId = currentUser?._id;

    const data = useSelector(selectVaccineSuggestions);
    const status = useSelector(selectSuggestionsStatus);
    const error = useSelector(selectSuggestionsError);

    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // Log to confirm the state of your variables
        console.log('VaccineSuggestions useEffect fired:', { patientId, status });

        // FIX: Use a more reliable condition to trigger the fetch
        // Dispatch the fetch if a patientId is available and we are NOT already loading.
        if (patientId && (status === 'idle' || (status === 'failed' && data.length === 0))) {
            dispatch(fetchVaccineSuggestions(patientId));
        }
    }, [patientId, status, data, dispatch]); // 'data' added to the dependency array

    useEffect(() => {
        // Show the modal only if suggestions were successfully fetched and there are some
        if (status === 'succeeded' && Array.isArray(data) && data.length > 0) {
            setShowModal(true);
        }
    }, [status, data]);

    const handleCloseModal = () => setShowModal(false);
    const handleCreateOrder = () => {
        handleCloseModal();
        navigate('/patient/orders/create');
    };

    // ----------------------------------------------------------------------
    // UI Display Logic
    // ----------------------------------------------------------------------
    if (status === 'loading' && patientId) {
        return (
            <Card className="my-3">
                <Card.Body>
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading vaccine suggestions...</p>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    if (status === 'failed' && error) {
        return (
            <Card className="my-3 border-danger">
                <Card.Body>
                    <p className="text-danger">Error: {error}</p>
                </Card.Body>
            </Card>
        );
    }

    return (
        <div className="my-4">
            <Card>
                <Card.Body>
                    <Card.Title>Your Vaccine Suggestions</Card.Title>
                    {Array.isArray(data) && data.length > 0 ? (
                        <div style={listStyle}> {/* Add this div with the style */}
                            <ListGroup variant="flush">
                                {data.map(suggestion => (
                                    <ListGroup.Item key={suggestion.vaccineDetails._id}>
                                        <strong>{suggestion.vaccineDetails.name}</strong>
                                        <p className="mb-0">Type: {suggestion.vaccineDetails.type}</p>
                                        <p className="mb-0">
                                            Doses needed: {suggestion.dosesStatus.required - suggestion.dosesStatus.taken} of {suggestion.dosesStatus.required}
                                        </p>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </div>
                    ) : (
                        <p className="text-muted">No new vaccine suggestions at this time.</p>
                    )}
                </Card.Body>
            </Card>

            {/*This is commented because is always displayed with the dashboard is loaded*/}
            {/*It shoudl be loaded only after the patient is logged*/}
            {/*{Array.isArray(data) && data.length > 0 && (*/}
            {/*    <Modal show={showModal} onHide={handleCloseModal}>*/}
            {/*        <Modal.Header closeButton>*/}
            {/*            <Modal.Title>New Vaccine Suggestions!</Modal.Title>*/}
            {/*        </Modal.Header>*/}
            {/*        <Modal.Body>*/}
            {/*            <p>Based on your profile, we have some new vaccine suggestions for you. Would you like to create an order now?</p>*/}
            {/*            <ListGroup>*/}
            {/*                {data.map(suggestion => (*/}
            {/*                    <ListGroup.Item key={suggestion.vaccineDetails._id}>*/}
            {/*                        <strong>{suggestion.vaccineDetails.name}</strong> ({suggestion.dosesStatus.required - suggestion.dosesStatus.taken} dose(s) needed)*/}
            {/*                    </ListGroup.Item>*/}
            {/*                ))}*/}
            {/*            </ListGroup>*/}
            {/*        </Modal.Body>*/}
            {/*        <Modal.Footer>*/}
            {/*            <Button variant="secondary" onClick={handleCloseModal}>*/}
            {/*                Maybe Later*/}
            {/*            </Button>*/}
            {/*            <Button variant="primary" onClick={handleCreateOrder}>*/}
            {/*                Create Order*/}
            {/*            </Button>*/}
            {/*        </Modal.Footer>*/}
            {/*    </Modal>*/}
            {/*)}*/}
        </div>
    );
};

export default VaccineSuggestions;