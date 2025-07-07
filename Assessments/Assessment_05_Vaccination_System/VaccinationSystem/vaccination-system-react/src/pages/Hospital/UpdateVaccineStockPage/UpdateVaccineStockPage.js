// src/pages/Hospital/UpdateVaccineStockPage.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchVaccineStock,
    updateVaccineStock,
    clearStockStatus,
    clearCurrentStock
} from '../../../store/features/vaccineStock/vaccineStockSlice';
import {
    selectCurrentStock,
    selectLoadingStock,
    selectErrorStock,
    selectUpdateStockStatus,
    selectUpdateStockError
} from '../../../store/features/vaccineStock/vaccineStockSelectors';
import { selectCurrentUser } from '../../../store/features/auth/authSelectors';
import { fetchUserProfile } from '../../../store/features/auth/authSlice';

import { fetchAllVaccines } from '../../../store/features/vaccines/vaccineSlice';
import { selectAllVaccines } from '../../../store/features/vaccines/vaccineSelectors';

import Input from '../../../components/common/Input/Input';
import Button from '../../../components/common/Button/Button';
import './UpdateVaccineStockPage.css';

const UpdateVaccineStockPage = () => {
    const dispatch = useDispatch();

    const currentUser = useSelector(selectCurrentUser);
    const allVaccines = useSelector(selectAllVaccines);
    const currentStock = useSelector(selectCurrentStock);
    const loadingStock = useSelector(selectLoadingStock);
    const errorStock = useSelector(selectErrorStock);
    const updateStatus = useSelector(selectUpdateStockStatus);
    const updateError = useSelector(selectUpdateStockError);

    const [selectedVaccineId, setSelectedVaccineId] = useState('');
    const [proposedStock, setProposedStock] = useState(20);
    const [pageError, setPageError] = useState('');

    const hospitalId = currentUser?.hospital?._id;

    // 1. Fetch user profile to ensure hospital data is available
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
                // Apply the new logic here:
                // if current quantity is < 20 then proposed qty = 20
                // if not proposed qty = qty (meaning if current quantity is >= 20, then proposed qty = current qty)
                if (currentStock.quantity < 20) {
                    setProposedStock(20);
                } else {
                    setProposedStock(currentStock.quantity);
                }
            } else {
                // If selected but currentStock is not available (e.g., truly null response), default to 20
                setProposedStock(20);
            }
        } else {
            // No vaccine selected, default proposed stock to 20
            setProposedStock(20);
        }
    }, [currentStock, selectedVaccineId, loadingStock, errorStock]);


    // Handle update success/failure
    useEffect(() => {
        if (updateStatus === 'succeeded') {
            alert('Vaccine stock updated successfully!');
            setPageError('');
            dispatch(clearStockStatus());
            if (hospitalId && selectedVaccineId) {
                dispatch(fetchVaccineStock({ hospitalId, vaccineId: selectedVaccineId }));
            }
        } else if (updateStatus === 'failed') {
            setPageError(updateError || 'Failed to update vaccine stock.');
            dispatch(clearStockStatus());
        }
    }, [updateStatus, updateError, dispatch, hospitalId, selectedVaccineId]);

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

        const currentQty = currentStock?.quantity || 0;
        const changeQty = parsedProposedStock - currentQty;

        if (changeQty === 0 && currentStock) {
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
            changeQty: changeQty,
        }));
    };

    // Calculate changeQty for display
    const displayCurrentQty = currentStock?.quantity || 0;
    const displayProposedQty = proposedStock === '' ? 0 : parseInt(proposedStock);
    const displayChangeQty = displayProposedQty - displayCurrentQty;
    const isChangeQtyNegative = displayChangeQty < 0;

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
            <h2>Update Vaccine Stock</h2>
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
                {updateStatus === 'loading' && <p>Updating stock...</p>}

                <Button type="submit" variant="primary" disabled={updateStatus === 'loading' || !selectedVaccineId}>
                    Update Stock
                </Button>
            </form>
        </div>
    );
};

export default UpdateVaccineStockPage;