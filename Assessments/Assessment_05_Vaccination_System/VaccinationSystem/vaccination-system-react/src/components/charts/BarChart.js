// D3.js chart components
// src/components/charts/BarChart/BarChart.js
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3'; // Import D3

const BarChart = ({ data, width = 600, height = 400, margin = { top: 20, right: 30, bottom: 40, left: 90 } }) => {
    const svgRef = useRef();

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Clear previous chart
        svg.selectAll('*').remove();

        // Create scales
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.label)) // e.g., Age group, Gender
            .range([0, innerWidth])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)]) // e.g., Number of people, Percentage
            .range([innerHeight, 0]);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add X axis
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'translate(-10,0)rotate(-45)')
            .style('text-anchor', 'end');

        // Add Y axis
        g.append('g')
            .call(d3.axisLeft(yScale));

        // Add bars
        g.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.label))
            .attr('y', d => yScale(d.value))
            .attr('width', xScale.bandwidth())
            .attr('height', d => innerHeight - yScale(d.value))
            .attr('fill', 'steelblue');

    }, [data, width, height, margin]);

    return (
        <svg ref={svgRef} width={width} height={height}></svg>
    );
};

export default BarChart;
