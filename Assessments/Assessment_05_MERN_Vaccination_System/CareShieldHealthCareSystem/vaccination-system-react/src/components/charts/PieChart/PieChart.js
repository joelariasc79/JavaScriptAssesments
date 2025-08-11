// D3.js chart components
// src/components/charts/PieChart/PieChart.js

import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';
import './PieChart.css'; // Create this CSS file

const PieChart = ({ data, width = 400, height = 400, outerRadius = 150, innerRadius = 0 }) => {
    const svgRef = useRef();

    useEffect(() => {
        if (!data || data.length === 0) {
            d3.select(svgRef.current).selectAll('*').remove(); // Clear SVG if no data
            return;
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear SVG on re-render

        const radius = Math.min(width, height) / 2;

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        // Set up the color scale (using D3's built-in schemes or your custom colors)
        const color = d3.scaleOrdinal()
            .range(d3.schemeCategory10); // Or use your custom color array: ['#4CAF50', '#1976D2', '#FFC107', ...]

        // Generate the pie slices
        const pie = d3.pie()
            .value(d => d.count)
            .sort(null); // Keep original order, or sort by value: (a, b) => a.count - b.count

        const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        const outerArc = d3.arc()
            .innerRadius(outerRadius * 1.1)
            .outerRadius(outerRadius * 1.1);

        // Draw slices
        const arcs = g.selectAll('.arc')
            .data(pie(data))
            .enter().append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('d', arc)
            .attr('fill', (d, i) => color(d.data._id)); // Use color based on category ID

        // Add labels
        arcs.append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .attr('dy', '0.35em')
            .style('text-anchor', 'middle')
            .style('font-size', '0.8rem')
            .style('fill', 'var(--color-text-primary)') // Or a contrasting color
            .text(d => d.data._id);

        // Optional: Add polylines and labels outside for better readability if space is an issue
        // For simplicity, we'll keep labels inside the arcs for now.
        // For more complex labels, you might use d3-arc-text or external labels.

    }, [data, width, height, outerRadius, innerRadius]);

    return (
        <div className="chart-container pie-chart-container">
            <svg ref={svgRef} width={width} height={height}></svg>
        </div>
    );
};

PieChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        count: PropTypes.number.isRequired
    })).isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
    outerRadius: PropTypes.number,
    innerRadius: PropTypes.number,
};

export default PieChart;