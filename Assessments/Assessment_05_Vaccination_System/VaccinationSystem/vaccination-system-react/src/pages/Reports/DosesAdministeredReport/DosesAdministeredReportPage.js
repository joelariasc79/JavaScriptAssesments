import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    fetchDosesDailyReport,
    clearReportsStatus
} from '../../../store/features/reports/reportsSlice';
import {
    selectDosesDailyReport,
    selectReportsStatus,
    selectReportsError
} from '../../../store/features/reports/reportsSelectors';
import Table from '../../../components/common/Table/Table';
import Button from '../../../components/common/Button/Button';
import BarChart from '../../../components/charts/BarChart/BarChart';
import PieChart from '../../../components/charts/PieChart/PieChart';
import './DosesAdministeredReportPage.css';

const DosesAdministeredReportPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // State for the grouping criterion: 'daily' or 'hospital'
    // NOTE: Your backend code for 'doses-administered' currently supports 'daily' and 'hospital'.
    // If 'daily' is the only filter for the new fetchDosesDailyReport thunk, you might simplify this.
    // For now, keeping 'daily' as default based on the thunk name.
    const [groupBy, setGroupBy] = useState('daily');

    // Select data from Redux store
    // UPDATED: Use selectDosesDailyReport
    const reportData = useSelector(selectDosesDailyReport);
    const status = useSelector(selectReportsStatus);
    const error = useSelector(selectReportsError);

    // Fetch data when component mounts or groupBy changes
    useEffect(() => {
        // UPDATED: Call fetchDosesDailyReport.
        // If your backend for 'doses-daily' supports a 'groupBy' filter, pass it here.
        // Otherwise, you might remove the groupBy state if this report is strictly daily.
        dispatch(fetchDosesDailyReport({ groupBy })); // Pass groupBy as a filter object
        // Cleanup function: clear report status when component unmounts
        return () => {
            dispatch(clearReportsStatus());
        };
    }, [dispatch, groupBy]); // Re-fetch when groupBy changes

    // Define table columns based on the current groupBy
    const getTableColumns = () => {
        let headerLabel = '';
        switch (groupBy) { // Keeping groupBy logic if your API supports it for dosesDaily
            case 'daily':
                headerLabel = 'Date';
                break;
            case 'hospital':
                headerLabel = 'Hospital Name';
                break;
            default:
                headerLabel = 'Category';
        }

        return [
            {
                header: headerLabel,
                accessor: '_id' // MongoDB aggregation usually uses _id for the grouped key
            },
            {
                header: 'Doses Count',
                accessor: 'count'
            }
        ];
    };

    // Helper function to format _id for display in table/charts
    // const formatCategory = (category) => {
    //     if (groupBy === 'daily') { // Keeping groupBy logic here too
    //         try {
    //             return new Date(category).toLocaleDateString('en-US', {
    //                 year: 'numeric',
    //                 month: 'short',
    //                 day: 'numeric'
    //             });
    //         } catch (e) {
    //             return String(category);
    //         }
    //     }
    //     if (typeof category === 'string') {
    //         return category.charAt(0).toUpperCase() + category.slice(1);
    //     }
    //     return String(category || 'Unknown/Not Provided');
    // };

    const formatCategory = (category) => {
        // Ensure category is not null/undefined before checking type
        if (category === null || category === undefined) {
            return 'Unknown/Not Provided';
        }

        // Convert category to string for consistent handling
        const categoryString = String(category);

        if (groupBy === 'daily') {
            // Attempt to parse date only if it looks like a string
            if (typeof categoryString === 'string' && categoryString.length > 0) {
                try {
                    // Make sure the date string is in a parseable format, e.g., "YYYY-MM-DD"
                    const date = new Date(categoryString);
                    if (!isNaN(date.getTime())) { // Check if date is valid
                        return date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                    }
                } catch (e) {
                    console.error("Error parsing date in formatCategory:", categoryString, e);
                    // Fallback if parsing fails
                }
            }
            return `Invalid Date: ${categoryString}`; // Indicate that the date was invalid
        }
        // For other categories like hospital names
        if (typeof categoryString === 'string') {
            // Capitalize first letter or format snake_case if applicable
            if (categoryString.includes('_')) {
                return categoryString.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            }
            return categoryString.charAt(0).toUpperCase() + categoryString.slice(1);
        }
        return String(category || 'Unknown/Not Provided'); // Fallback for non-string/non-date types
    };



    // Handler for the "Go Back" button
    const handleGoBack = () => {
        navigate('/reports');
    };

    // Render content based on status
    let content;
    if (status === 'loading') {
        content = <div className="report-status">Loading doses administered report...</div>;
    } else if (status === 'failed') {
        content = <div className="report-error">Error: {error?.message || 'Failed to load report.'}</div>;
    } else if (status === 'succeeded') {
        if (reportData && reportData.length > 0) {
            const formattedData = reportData.map(item => ({
                ...item,
                _id: formatCategory(item._id),
                count: Number(item.count) || 0
            }));

            const validChartData = formattedData.filter(d => d._id !== 'Unknown/Not Provided' && d.count > 0);

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
                <h2>Doses Administered Report</h2>
                <Button
                    onClick={handleGoBack}
                    variant="success"
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
                    <option value="daily">Daily</option>
                    <option value="hospital">Hospital</option>
                </select>
            </div>

            {content}
        </div>
    );
};

export default DosesAdministeredReportPage;