// src/pages/Hospital/VaccinesStock.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchVaccineStock,
    updateVaccineStock, // This is for PATCH
    createVaccineStock, // This is for POST
    clearStockStatus,
    clearCurrentStock
} from '../../../store/features/vaccineStock/vaccineStockSlice';
import {
    selectCurrentStock,
    selectLoadingStock,
    selectErrorStock,
    selectUpdateStockStatus,
    selectUpdateStockError,
    selectCreateStockStatus, // NEW: Selector for create status
    selectCreateStockError   // NEW: Selector for create error
} from '../../../store/features/vaccineStock/vaccineStockSelectors';
import { selectCurrentUser } from '../../../store/features/auth/authSelectors';
import { fetchUserProfile } from '../../../store/features/auth/authSlice';

import { fetchAllVaccines } from '../../../store/features/vaccines/vaccineSlice';
import { selectAllVaccines } from '../../../store/features/vaccines/vaccineSelectors';

import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';
import './VaccinesStockPage.css';

const VaccinesStockPage = () => {
    const dispatch = useDispatch();

    const currentUser = useSelector(selectCurrentUser);
    const allVaccines = useSelector(selectAllVaccines);
    const currentStock = useSelector(selectCurrentStock); // This will be null if record doesn't exist (quantity 0)
    const loadingStock = useSelector(selectLoadingStock);
    const errorStock = useSelector(selectErrorStock);

    const updateStatus = useSelector(selectUpdateStockStatus); // Status for PATCH
    const updateError = useSelector(selectUpdateStockError);

    const createStatus = useSelector(selectCreateStockStatus); // NEW: Status for POST
    const createError = useSelector(selectCreateStockError);   // NEW: Error for POST


    const [selectedVaccineId, setSelectedVaccineId] = useState('');
    const [proposedStock, setProposedStock] = useState(20);
    const [pageError, setPageError] = useState('');

    const hospitalId = currentUser?.hospital?._id;

    // 1. Fetch patient profile to ensure hospital data is available
    useEffect(() => {
        if (currentUser && currentUser.userId && !currentUser.hospital) {
            dispatch(fetchUserProfile(currentUser.userId));
        }
    }, [dispatch, currentUser]);

    // 2. Fetch all vaccines when component mounts
    useEffect(() => {
        dispatch(fetchAllVaccines());
    }, [dispatch]);

    // 3. Fetch vaccine stock when hospitalId or selectedVaccineId changes
    useEffect(() => {
        if (hospitalId && selectedVaccineId) {
            dispatch(fetchVaccineStock({ hospitalId, vaccineId: selectedVaccineId }));
        } else {
            dispatch(clearCurrentStock());
            setProposedStock(20); // Reset proposed stock to 20 when no vaccine is selected
        }
    }, [dispatch, hospitalId, selectedVaccineId]);

    // UPDATED useEffect for initializing proposedStock with currentStock or default 20
    useEffect(() => {
        if (loadingStock || errorStock) {
            return;
        }

        if (selectedVaccineId) {
            if (currentStock !== null && currentStock !== undefined) {
                // If currentStock exists and its quantity is less than 20, propose 20.
                // Otherwise, propose the current quantity.
                if (currentStock.quantity < 20) {
                    setProposedStock(20);
                } else {
                    setProposedStock(currentStock.quantity);
                }
            } else {
                // If selected but currentStock is null/undefined (meaning record not found, quantity 0), default to 20
                setProposedStock(20);
            }
        } else {
            // No vaccine selected, default proposed stock to 20
            setProposedStock(20);
        }
    }, [currentStock, selectedVaccineId, loadingStock, errorStock]);


    // Handle update/create success/failure
    useEffect(() => {
        if (updateStatus === 'succeeded' || createStatus === 'succeeded') {
            alert('Vaccine stock operation completed successfully!');
            setPageError('');
            dispatch(clearStockStatus()); // Clears both update and create statuses
            // Re-fetch stock to show updated quantity
            if (hospitalId && selectedVaccineId) {
                dispatch(fetchVaccineStock({ hospitalId, vaccineId: selectedVaccineId }));
            }
        } else if (updateStatus === 'failed') {
            setPageError(updateError || 'Failed to update vaccine stock.');
            dispatch(clearStockStatus());
        } else if (createStatus === 'failed') {
            setPageError(createError || 'Failed to create vaccine stock record.');
            dispatch(clearStockStatus());
        }
    }, [updateStatus, updateError, createStatus, createError, dispatch, hospitalId, selectedVaccineId]);

    const handleUpdateStock = (e) => {
        e.preventDefault();
        setPageError('');

        if (!hospitalId) {
            setPageError('User is not associated with a hospital or hospital data is missing.');
            return;
        }
        if (!selectedVaccineId) {
            setPageError('Please select a vaccine.');
            return;
        }
        const parsedProposedStock = parseInt(proposedStock);
        if (isNaN(parsedProposedStock) || parsedProposedStock < 0) {
            setPageError('Proposed Stock must be a non-negative number.');
            return;
        }

        const currentQty = currentStock?.quantity || 0; // Will be 0 if currentStock is null/undefined

        // Determine if we need to CREATE or UPDATE
        if (currentStock === null || currentStock === undefined) {
            // Record does not exist, so CREATE it
            if (parsedProposedStock === 0) {
                setPageError('Cannot create a new stock record with a proposed quantity of 0.');
                return;
            }
            dispatch(createVaccineStock({
                hospitalId,
                vaccineId: selectedVaccineId,
                initialQuantity: parsedProposedStock, // Send proposed stock as initial quantity
            }));
        } else {
            // Record exists, so UPDATE it
            const changeQty = parsedProposedStock - currentQty;

            if (changeQty === 0) {
                setPageError('Proposed stock is the same as current stock. No update needed.');
                return;
            }

            const resultingQuantity = currentQty + changeQty;

            if (resultingQuantity < 0) {
                setPageError('Stock cannot be negative. Please enter a valid proposed quantity.');
                return;
            }

            dispatch(updateVaccineStock({
                hospitalId,
                vaccineId: selectedVaccineId,
                changeQty: changeQty, // Send the difference to add/subtract
            }));
        }
    };

    // Calculate changeQty for display
    const displayCurrentQty = currentStock?.quantity || 0;
    const displayProposedQty = proposedStock === '' ? 0 : parseInt(proposedStock);
    const displayChangeQty = displayProposedQty - displayCurrentQty;
    const isChangeQtyNegative = displayChangeQty < 0;

    // Determine overall loading state for the button
    const isSubmitting = updateStatus === 'loading' || createStatus === 'loading';

    if (loadingStock && !currentStock && selectedVaccineId && hospitalId) {
        return (
            <div className="update-vaccine-stock-container">
                <p>Loading vaccine stock information...</p>
            </div>
        );
    }

    if (!currentUser || !hospitalId) {
        return (
            <div className="update-vaccine-stock-container">
                <p className="error-message">You are not assigned to a hospital or user data is incomplete. Please contact an administrator.</p>
            </div>
        );
    }

    return (
        <div className="update-vaccine-stock-container">
            <h2>Vaccines Stock</h2>
            <p>Hospital: <strong>{currentUser.hospital?.name || 'Loading...'}</strong></p>

            <form onSubmit={handleUpdateStock} className="update-stock-form">
                <div className="form-group">
                    <label htmlFor="vaccineSelect">Select Vaccine:</label>
                    <select
                        id="vaccineSelect"
                        value={selectedVaccineId}
                        onChange={(e) => setSelectedVaccineId(e.target.value)}
                        required
                        className="select-box"
                    >
                        <option value="">-- Select a Vaccine --</option>
                        {allVaccines.map((vaccine) => (
                            <option key={vaccine._id} value={vaccine._id}>
                                {vaccine.name} ({vaccine.manufacturer})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedVaccineId && (loadingStock || errorStock) ? (
                    loadingStock ? (
                        <p>Loading vaccine stock...</p>
                    ) : (
                        <p className="error-message">Error loading stock: {errorStock}</p>
                    )
                ) : (
                    <>
                        <Input
                            label="Current Quantity"
                            id="currentQuantity"
                            type="number"
                            value={displayCurrentQty}
                            readOnly
                            disabled
                            className="read-only-input"
                        />
                        <Input
                            label="Proposed Stock Quantity"
                            id="proposedStock"
                            type="number"
                            value={proposedStock}
                            onChange={(e) => setProposedStock(e.target.value)}
                            placeholder="Enter proposed stock"
                            required
                            min="0"
                        />
                        <div className="form-group">
                            <label htmlFor="changeQuantity">Change Quantity:</label>
                            <Input
                                id="changeQuantity"
                                type="text"
                                value={displayChangeQty}
                                readOnly
                                disabled
                                className={`read-only-input ${isChangeQtyNegative ? 'negative-change' : ''}`}
                            />
                        </div>
                    </>
                )}

                {pageError && <p className="form-error-message">{pageError}</p>}
                {isSubmitting && <p>Processing stock update...</p>} {/* Consolidated loading message */}

                <Button type="submit" variant="primary" disabled={isSubmitting || !selectedVaccineId}>
                    {isSubmitting ? 'Processing...' : 'Save Stock'}
                </Button>
            </form>
        </div>
    );
};

export default VaccinesStockPage;