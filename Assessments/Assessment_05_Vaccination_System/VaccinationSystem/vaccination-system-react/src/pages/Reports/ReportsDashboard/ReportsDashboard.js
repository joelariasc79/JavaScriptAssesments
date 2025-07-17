import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../../../components/common/DashboardCard/DashboardCard';
import Button from '../../../components/common/Button/Button'; // Import the Button component
import './ReportsDashboard.css'; // Import the CSS for this page

const ReportsDashboard = () => {
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleGoBack = () => {
        navigate('/hospital'); // Navigate to the Hospital Dashboard path
    };

    return (
        <div className="reports-dashboard-container">
            <div className="reports-header">
                <h2>Vaccination Reports</h2>
                <Button
                    onClick={handleGoBack}
                    variant="success" // Use a secondary variant for a 'back' action
                    size="small" // A smaller button might be appropriate for a navigation control
                >
                    Go Back to Hospital Dashboard
                </Button>
            </div>


            <div className="reports-grid">
                {/* User Demographics Report Card */}
                <DashboardCard
                    title="User Demographics"
                    description="View patient demographics by age group, gender, pre-existing conditions, and medical practitioners."
                    onClick={() => handleNavigation('/reports/age-gender')}
                />

                {/* Doses Administered Report Card */}
                <DashboardCard
                    title="Doses Administered"
                    description="Analyze the number of vaccine doses administered over time or by hospital."
                    onClick={() => handleNavigation('/reports/doses-administered')}
                />

                {/* Population Coverage Report Card */}
                <DashboardCard
                    title="Population Coverage"
                    description="See the percentage of the target population vaccinated in different regions or hospitals."
                    onClick={() => handleNavigation('/reports/population-coverage')}
                />

                {/* Add more specific report cards as you develop them */}
                {/* Example: Daily Vaccination Trends, Vaccine Stock Levels, etc. */}
            </div>
        </div>
    );
};

export default ReportsDashboard;


// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import DashboardCard from '../../../components/common/DashboardCard/DashboardCard';
// import './ReportsDashboard.css'; // Import the CSS for this page
//
// const ReportsDashboard = () => {
//     const navigate = useNavigate();
//
//     const handleNavigation = (path) => {
//         navigate(path);
//     };
//
//     return (
//         <div className="reports-dashboard-container">
//             <h2>Vaccination Reports</h2>
//
//             <div className="reports-grid">
//                 {/* User Demographics Report Card */}
//                 <DashboardCard
//                     title="User Demographics"
//                     description="View patient demographics by age group, gender, pre-existing conditions, and medical practitioners."
//                     onClick={() => handleNavigation('/reports/age-gender')}
//                     // NOTE: '/reports/age-gender' is a placeholder. If you want a single page
//                     // with dropdowns for groupBy, you might navigate to '/reports' and handle
//                     // the groupBy selection on that page. For now, it links to a more specific report name.
//                 />
//
//                 {/* Doses Administered Report Card */}
//                 <DashboardCard
//                     title="Doses Administered"
//                     description="Analyze the number of vaccine doses administered over time or by hospital."
//                     onClick={() => handleNavigation('/reports/doses-administered')}
//                 />
//
//                 {/* Population Coverage Report Card */}
//                 <DashboardCard
//                     title="Population Coverage"
//                     description="See the percentage of the target population vaccinated in different regions or hospitals."
//                     onClick={() => handleNavigation('/reports/population-coverage')}
//                 />
//
//                 {/* Add more specific report cards as you develop them */}
//                 {/* Example: Daily Vaccination Trends, Vaccine Stock Levels, etc. */}
//             </div>
//         </div>
//     );
// };
//
// export default ReportsDashboard;