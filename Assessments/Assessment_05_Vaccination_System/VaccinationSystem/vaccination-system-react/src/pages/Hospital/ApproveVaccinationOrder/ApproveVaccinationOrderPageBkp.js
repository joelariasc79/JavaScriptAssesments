// src/pages/Hospital/ApproveVaccinationOrder/ApproveVaccinationOrderPageBpk.js
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchPendingApprovalOrders,
    approveVaccinationOrder,
    rejectVaccinationOrder,
    clearApproveStatus,
    clearRejectStatus,
} from '../../../store/features/pendingOrders/pendingOrdersSlice';
import {
    selectPendingApprovalOrders,
    selectPendingApprovalOrdersLoading,
    selectPendingApprovalOrdersError,
    selectApproveStatus,
    selectApproveError,
    selectRejectStatus,
    selectRejectError,
} from '../../../store/features/pendingOrders/pendingOrdersSelectors';
import { selectCurrentUser } from '../../../store/features/auth/authSelectors';

import './ApproveVaccinationOrderPage.css'; // Will be updated for card styling

const ApproveVaccinationOrderPage = () => {
    const dispatch = useDispatch();
    const currentUser = useSelector(selectCurrentUser);

    const orders = useSelector(selectPendingApprovalOrders);
    const loading = useSelector(selectPendingApprovalOrdersLoading);
    const error = useSelector(selectPendingApprovalOrdersError);
    const approveStatus = useSelector(selectApproveStatus);
    const approveError = useSelector(selectApproveError);
    const rejectStatus = useSelector(selectRejectStatus);
    const rejectError = useSelector(selectRejectError);

    const hospitalId = currentUser?.role === 'hospital_staff' ? currentUser.hospital._id : null;

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState('createdAt:desc');

    const memoizedFetchOrders = useCallback(() => {
        if (currentUser?.role === 'hospital_staff' && hospitalId) {
            dispatch(fetchPendingApprovalOrders(hospitalId));
        }
    }, [dispatch, hospitalId, currentUser?.role]);

    useEffect(() => {
        memoizedFetchOrders();
    }, [memoizedFetchOrders]);

    useEffect(() => {
        if (approveStatus === 'succeeded' || rejectStatus === 'succeeded') {
            memoizedFetchOrders();
            dispatch(clearApproveStatus());
            dispatch(clearRejectStatus());
        }
    }, [approveStatus, rejectStatus, dispatch, memoizedFetchOrders]);

    const handleApprove = (orderId) => {
        if (window.confirm('Are you sure you want to approve this vaccination order?')) {
            dispatch(approveVaccinationOrder(orderId));
        }
    };

    const handleReject = (orderId) => {
        if (window.confirm('Are you sure you want to reject this vaccination order?')) {
            dispatch(rejectVaccinationOrder(orderId));
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    const handleSortChange = (e) => {
        setSort(e.target.value);
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    if (loading) {
        return <div className="loading">Loading pending orders...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    if (currentUser?.role !== 'hospital_staff') {
        return <div className="info-message">Access denied. This page is only for hospital staff.</div>;
    }

    if (!hospitalId) {
        return <div className="info-message">Your staff account is not associated with a hospital. Please contact an administrator.</div>;
    }

    // Client-side filtering and sorting logic (remains the same)
    const filteredAndSortedOrders = orders.filter(order => {
        const patientName = order.userId?.name || '';
        const vaccineName = order.vaccineId?.name || '';
        const searchLower = searchQuery.toLowerCase();
        return patientName.toLowerCase().includes(searchLower) || vaccineName.toLowerCase().includes(searchLower);
    }).sort((a, b) => {
        const [sortBy, sortOrder] = sort.split(':');
        let valA, valB;

        if (sortBy === 'createdAt') {
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
        } else if (sortBy === 'patientName') {
            valA = (a.userId?.name || '').toLowerCase();
            valB = (b.userId?.name || '').toLowerCase();
        } else if (sortBy === 'vaccineName') {
            valA = (a.vaccineId?.name || '').toLowerCase();
            valB = (b.vaccineId?.name || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    // Client-side pagination logic (remains the same)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredAndSortedOrders.slice(startIndex, endIndex);
    const totalLocalPages = Math.ceil(filteredAndSortedOrders.length / limit);

    return (
        <div className="approve-orders-container">
            <h2>Pending Approval Vaccination Orders</h2>

            {approveStatus === 'succeeded' && <div className="success-message">Order approved successfully!</div>}
            {approveError && <div className="error-message">Error approving order: {approveError}</div>}
            {rejectStatus === 'succeeded' && <div className="success-message">Order rejected successfully!</div>}
            {rejectError && <div className="error-message">Error rejecting order: {rejectError}</div>}

            <div className="orders-controls">
                <div className="search-input-container">
                    <input
                        type="text"
                        placeholder="Search patient/vaccine name..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                </div>
                <select value={sort} onChange={handleSortChange} className="sort-select">
                    <option value="createdAt:desc">Newest First</option>
                    <option value="createdAt:asc">Oldest First</option>
                    <option value="patientName:asc">Patient Name (A-Z)</option>
                    <option value="patientName:desc">Patient Name (Z-A)</option>
                    <option value="vaccineName:asc">Vaccine Name (A-Z)</option>
                    <option value="vaccineName:desc">Vaccine Name (Z-A)</option>
                </select>
            </div>

            {paginatedOrders.length === 0 ? (
                <p>No pending approval vaccination orders found for this hospital matching your criteria.</p>
            ) : (
                <>
                    {/* Reverted to card-based layout */}
                    <div className="orders-list">
                        {paginatedOrders.map((order) => (
                            <div key={order._id} className="order-card">
                                <h3>Order #{order._id.substring(order._id.length - 6)}</h3>
                                <p><strong>Patient:</strong> {order.userId?.name || 'N/A'} ({order.userId?.email || order.userId?.username || 'N/A'})</p>
                                <p><strong>Hospital:</strong> {order.hospitalId?.name || 'N/A'}</p>
                                <p><strong>Vaccine:</strong> {order.vaccineId?.name || 'N/A'} ({order.vaccineId?.type || 'N/A'})</p>
                                <p><strong>Dose Number:</strong> {order.dose_number}</p>
                                <p><strong>Charge:</strong> ${order.charge_to_be_paid.toFixed(2)}</p>
                                <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                                <p><strong>Status:</strong> <span className={`status-${order.vaccinationStatus}`}>{order.vaccinationStatus.replace('_', ' ')}</span></p>

                                <div className="order-actions">
                                    <button
                                        onClick={() => handleApprove(order._id)}
                                        disabled={approveStatus === 'loading' || rejectStatus === 'loading'}
                                        className="btn-approve"
                                    >
                                        {approveStatus === 'loading' ? 'Approving...' : 'Approve'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(order._id)}
                                        disabled={approveStatus === 'loading' || rejectStatus === 'loading'}
                                        className="btn-reject"
                                    >
                                        {rejectStatus === 'loading' ? 'Rejecting...' : 'Reject'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pagination-controls">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1 || loading}
                        >
                            Previous
                        </button>
                        <span>Page {page} of {totalLocalPages}</span>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalLocalPages || loading}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ApproveVaccinationOrderPage;