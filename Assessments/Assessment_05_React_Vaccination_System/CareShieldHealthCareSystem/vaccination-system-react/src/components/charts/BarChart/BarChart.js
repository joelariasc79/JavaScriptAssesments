// D3.js chart components
// src/components/charts/BarChart/BarChart.js

import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';
import './BarChart.css'; // Create this CSS file

const BarChart = ({ data, width = 600, height = 400, margin = { top: 20, right: 30, bottom: 60, left: 60 } }) => {
    const svgRef = useRef();

    useEffect(() => {
        if (!data || data.length === 0) {
            d3.select(svgRef.current).selectAll('*').remove(); // Clear SVG if no data
            return;
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear SVG on re-render

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Define scales
        const x = d3.scaleBand()
            .domain(data.map(d => d._id))
            .range([0, innerWidth])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .nice()
            .range([innerHeight, 0]);

        // Draw bars
        g.selectAll('.bar')
            .data(data)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d._id))
            .attr('y', d => y(d.count))
            .attr('width', x.bandwidth())
            .attr('height', d => innerHeight - y(d.count));

        // Add X axis
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x))
            .selectAll('text') // Rotate x-axis labels if they are long
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');

        // Add Y axis
        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y).ticks(5)); // Fewer ticks for cleaner look

        // Add Y axis label
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 15) // Adjust position
            .attr("x", 0 - (innerHeight / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("class", "y-axis-label")
            .text("Count");

    }, [data, width, height, margin]); // Re-run effect if data or dimensions change

    return (
        <div className="chart-container bar-chart-container">
            <svg ref={svgRef} width={width} height={height}></svg>
        </div>
    );
};

BarChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        count: PropTypes.number.isRequired
    })).isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
    margin: PropTypes.shape({
        top: PropTypes.number,
        right: PropTypes.number,
        bottom: PropTypes.number,
        left: PropTypes.number,
    }),
};

export default BarChart;
