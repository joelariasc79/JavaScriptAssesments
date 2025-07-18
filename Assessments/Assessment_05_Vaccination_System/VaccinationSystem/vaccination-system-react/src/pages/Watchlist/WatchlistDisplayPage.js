// src/pages/Watchlist/WatchlistDisplayPage.js

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWatchlistSummary, clearWatchlistSummary } from '../../store/features/reports/reportsSlice'; // Adjust path as necessary
import {
    selectWatchlistSummary,
    selectReportsStatus, // General status for all reports
    selectReportsError // General error for all reports
} from '../../store/features/reports/reportsSelectors'; // Adjust path as necessary

import { Carousel } from 'react-responsive-carousel'; // Import the Carousel component
import 'react-responsive-carousel/lib/styles/carousel.min.css'; // Import Carousel styles

import './WatchlistDisplayPage.css'; // Import your custom CSS file

// Define SLIDE_INTERVAL_MS here
const SLIDE_INTERVAL_MS = 5000; // Time in milliseconds for each slide to display

const WatchlistDisplayPage = () => {
    const dispatch = useDispatch();
    const watchlistSummary = useSelector(selectWatchlistSummary);
    const status = useSelector(selectReportsStatus);
    const error = useSelector(selectReportsError);

    // Fetch data when the component mounts
    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchWatchlistSummary());
        }
        // Clean up data when component unmounts
        return () => {
            dispatch(clearWatchlistSummary());
        };
    }, [status, dispatch]);

    let content;

    if (status === 'loading') {
        content = <p>Loading watchlist summary...</p>;
    } else if (status === 'failed') {
        content = <p className="error-message">Error loading watchlist summary: {error}</p>;
    } else if (status === 'succeeded' && watchlistSummary) {
        // Prepare carousel items from the fetched data
        const carouselItems = [];

        // Add Age Distribution items
        if (watchlistSummary.ageDistribution && watchlistSummary.ageDistribution.length > 0) {
            watchlistSummary.ageDistribution.forEach(item => {
                carouselItems.push(
                    <div key={`age-${item.age_group}`} className="carousel-item">
                        <h3 className="item-title">Age Group: {item.age_group}</h3>
                        <p className="item-value">{item.percentage}%</p>
                        <p className="item-detail"></p> {/* Removed "of patients" */}
                    </div>
                );
            });
        }

        // Add Gender Distribution items
        if (watchlistSummary.genderDistribution && watchlistSummary.genderDistribution.length > 0) {
            watchlistSummary.genderDistribution.forEach(item => {
                carouselItems.push(
                    <div key={`gender-${item.gender}`} className="carousel-item">
                        <h3 className="item-title">Gender: {item.gender}</h3>
                        <p className="item-value">{item.percentage}%</p>
                        <p className="item-detail"></p> {/* Removed "of patients" */}
                    </div>
                );
            });
        }

        // Add Overall Population Coverage item
        if (watchlistSummary.overallPopulationCoverage) {
            carouselItems.push(
                <div key="overall-coverage" className="carousel-item">
                    <h3 className="item-title">Overall Population Coverage</h3>
                    <p className="item-value">{watchlistSummary.overallPopulationCoverage.percentage}%</p>
                    <p className="item-detail">
                        ({watchlistSummary.overallPopulationCoverage.vaccinatedPatients} /{' '}
                        {watchlistSummary.overallPopulationCoverage.totalPatients} patients)
                    </p>
                </div>
            );
        }

        content = (
            <div className="watchlist-carousel-wrapper">
                {carouselItems.length > 0 ? (
                    <Carousel
                        showArrows={true}
                        showStatus={false}
                        showIndicators={true}
                        infiniteLoop={true}
                        autoPlay={true}
                        interval={SLIDE_INTERVAL_MS}
                        transitionTime={800}
                        stopOnHover={true}
                        showThumbs={false}
                        className="custom-carousel"
                    >
                        {carouselItems}
                    </Carousel>
                ) : (
                    <p>No summary data available to display in carousel.</p>
                )}
            </div>
        );
    } else {
        content = <p>No watchlist summary data to display.</p>;
    }

    return (
        <div className="watchlist-display-page">
            <h2 className="page-title">Watchlist (Live Updates)</h2>
            {content}
        </div>
    );
};

export default WatchlistDisplayPage;