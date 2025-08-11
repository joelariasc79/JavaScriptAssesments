// // src/pages/Reports/AgeGenderReport/AgeGenderReport.js
// src/pages/Reports/AgeGenderReport/AgeGenderReport.js

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    fetchUserDemographicsReport,
    clearReportsStatus
} from '../../../store/features/reports/reportsSlice';
import {
    selectUserDemographicsReport,
    selectReportsStatus,
    selectReportsError
}
    from '../../../store/features/reports/reportsSelectors';
import Table from '../../../components/common/Table/Table';
import Button from '../../../components/common/Button/Button';
import BarChart from '../../../components/charts/BarChart/BarChart';
import PieChart from '../../../components/charts/PieChart/PieChart';
import './AgeGenderReportPage.css';

const AgeGenderReportPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [groupBy, setGroupBy] = useState('gender');
    const reportData = useSelector(selectUserDemographicsReport);
    const status = useSelector(selectReportsStatus);
    const error = useSelector(selectReportsError);

    useEffect(() => {
        dispatch(fetchUserDemographicsReport(groupBy));
        return () => {
            dispatch(clearReportsStatus());
        };
    }, [dispatch, groupBy]);

    const getTableColumns = () => {
        let headerLabel = '';
        switch (groupBy) {
            case 'gender':
                headerLabel = 'Gender';
                break;
            case 'age_group':
                headerLabel = 'Age Group';
                break;
            case 'pre_existing_disease':
                headerLabel = 'Pre-existing Disease';
                break;
            case 'medical_practitioner':
                headerLabel = 'Medical Practitioner';
                break;
            default:
                headerLabel = 'Category';
        }

        return [
            {
                header: headerLabel,
                accessor: '_id'
            },
            {
                header: 'Count',
                accessor: 'count'
            }
        ];
    };

    const capitalize = (s) => {
        if (typeof s !== 'string') return s;
        if (s === null || s === undefined) return 'N/A';
        if (!isNaN(s) && !isNaN(parseFloat(s))) return String(s);
        if (s.includes('_')) {
            return s.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const handleGoBack = () => {
        navigate('/reports');
    };

    let content;
    if (status === 'loading') {
        content = <div className="report-status">Loading user demographics report...</div>;
    } else if (status === 'failed') {
        content = <div className="report-error">Error: {error?.message || 'Failed to load report.'}</div>;
    } else if (status === 'succeeded') {
        if (reportData && reportData.length > 0) {
            const formattedData = reportData.map(item => ({
                ...item,
                _id: item._id !== null && item._id !== undefined ? capitalize(String(item._id)) : 'Unknown'
            }));

            const validChartData = formattedData.filter(d => d._id !== 'Unknown' && d.count != null);

            content = (
                <div className="report-content">
                    <h3>Report Data Table</h3>
                    <Table data={formattedData} columns={getTableColumns()} />

                    {validChartData.length > 0 ? (
                        <>
                            <h3>Bar Chart View</h3>
                            <BarChart data={validChartData} />

                            <h3>Pie Chart View</h3>
                            <PieChart data={validChartData} />
                        </>
                    ) : (
                        <div className="no-data-message">No valid data available to render charts.</div>
                    )}
                </div>
            );
        } else {
            content = <div className="no-data-message">No data available for this grouping.</div>;
        }
    } else {
        content = <div className="report-status">Select a grouping option to view the report.</div>;
    }

    return (
        <div className="report-page-container">
            <div className="report-header-section">
                <h2>User Demographics Report</h2>
                <Button
                    onClick={handleGoBack}
                    variant="success" // CHANGED from "secondary" to "success"
                    size="small"
                >
                    Go Back to Reports Dashboard
                </Button>
            </div>

            <div className="report-controls">
                <label htmlFor="groupBy">Group By:</label>
                <select
                    id="groupBy"
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                >
                    <option value="gender">Gender</option>
                    <option value="age_group">Age Group</option>
                    <option value="pre_existing_disease">Pre-existing Disease</option>
                    <option value="medical_practitioner">Medical Practitioner</option>
                </select>
            </div>

            {content}
        </div>
    );
};

export default AgeGenderReportPage;

