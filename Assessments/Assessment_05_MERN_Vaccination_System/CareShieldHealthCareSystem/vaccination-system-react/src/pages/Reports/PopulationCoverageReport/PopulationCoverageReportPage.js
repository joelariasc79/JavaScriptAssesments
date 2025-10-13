// src/pages/Reports/PopulationCoverageReport/PopulationCoverageReport.js

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    fetchPopulationCoverageReport,
    clearReportsStatus
} from '../../../store/features/reports/reportsSlice';
import {
    selectPopulationCoverageReport,
    selectReportsStatus,
    selectReportsError
} from '../../../store/features/reports/reportsSelectors';
import Table from '../../../components/common/Table/Table'; // Re-using Table
import Button from '../../../components/common/Button/Button';
import BarChart from '../../../components/charts/BarChart/BarChart';
import PieChart from '../../../components/charts/PieChart/PieChart';
import './PopulationCoverageReportPage.css';

const PopulationCoverageReportPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Select data from Redux store
    // reportData will be an object like:
    // { totalPatients: N, vaccinatedPatients: M, coveragePercentage: P }
    const reportData = useSelector(selectPopulationCoverageReport);
    const status = useSelector(selectReportsStatus);
    const error = useSelector(selectReportsError);

    // Fetch data when component mounts
    useEffect(() => {
        // You can pass filters here if your backend supports them, e.g., { hospitalId: 'xyz' }
        // The backend you provided takes 'hospitalId' as a query param.
        // For admin, it would be: dispatch(fetchPopulationCoverageReport({ hospitalId: 'someId' }));
        // For hospital_staff, the backend uses req.patient.hospitalId automatically.
        dispatch(fetchPopulationCoverageReport({})); // Fetch without specific filters initially
        // Cleanup function: clear report status when component unmounts
        return () => {
            dispatch(clearReportsStatus());
        };
    }, [dispatch]);

    // Handler for the "Go Back" button
    const handleGoBack = () => {
        navigate('/reports'); // Navigate back to the main Reports Dashboard path
    };

    // Render content based on status
    let content;
    if (status === 'loading') {
        content = <div className="report-status">Loading population coverage report...</div>;
    } else if (status === 'failed') {
        content = <div className="report-error">Error: {error?.message || 'Failed to load report.'}</div>;
    } else if (status === 'succeeded') {
        // Check if reportData is a valid object and has the expected properties
        if (reportData && typeof reportData.coveragePercentage === 'number' && typeof reportData.totalPatients === 'number') {
            const { totalPatients, vaccinatedPatients, coveragePercentage } = reportData;

            // Prepare data for Table component (as a specific set of key metrics)
            const tableData = [
                { metric: 'Total Registered Patients', value: totalPatients },
                { metric: 'Vaccinated Patients', value: vaccinatedPatients },
                { metric: 'Population Coverage', value: `${coveragePercentage.toFixed(2)}%` }
            ];

            const tableColumns = [
                { header: 'Metric', accessor: 'metric' },
                { header: 'Value', accessor: 'value' }
            ];

            // Prepare data for Bar and Pie Charts (Covered vs Uncovered)
            const uncoveredPatients = totalPatients - vaccinatedPatients;
            const chartData = [
                { _id: 'Covered', count: vaccinatedPatients },
                { _id: 'Uncovered', count: uncoveredPatients }
            ];

            // Filter out categories with zero count for charts if desired, though often good to show 0.
            const validChartData = chartData.filter(d => d.count > 0);


            content = (
                <div className="report-content">
                    {/* Display main percentage prominently */}
                    <div className="coverage-summary">
                        <h3>Overall Population Coverage:</h3>
                        <p className="coverage-percentage-display">{coveragePercentage.toFixed(2)}%</p>
                    </div>

                    <h3>Key Metrics</h3>
                    <Table data={tableData} columns={tableColumns} />

                    {totalPatients > 0 && validChartData.length > 0 ? (
                        <>
                            <h3>Population Status (Counts)</h3>
                            <BarChart data={validChartData} />

                            <h3>Population Distribution</h3>
                            <PieChart data={validChartData} />
                        </>
                    ) : (
                        <div className="no-data-message">No sufficient data (e.g., total patients is 0) to render charts.</div>
                    )}
                </div>
            );
        } else {
            content = <div className="no-data-message">No population coverage data available or data format is unexpected.</div>;
        }
    } else {
        content = <div className="report-status">Report not yet loaded.</div>;
    }

    return (
        <div className="report-page-container">
            <div className="report-header-section">
                <h2>Population Coverage Report</h2>
                <Button
                    onClick={handleGoBack}
                    variant="success" // Green color
                    size="small"
                >
                    Go Back to Reports Dashboard
                </Button>
            </div>

            {/* No specific filters for this report yet, but can be added here if needed */}
            {content}
        </div>
    );
};

export default PopulationCoverageReportPage;