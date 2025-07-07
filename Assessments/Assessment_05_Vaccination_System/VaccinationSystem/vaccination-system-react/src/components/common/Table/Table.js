// components/common/Table/Table.js
import React from 'react';
import PropTypes from 'prop-types';
import './Table.css'; // Assuming a Table.css for specific table styles

const Table = ({ data, columns, className = '' }) => {
    if (!data || data.length === 0) {
        return <p>No data to display.</p>;
    }

    return (
        <div className={`table-container ${className}`}>
            <table className="table">
                <thead>
                <tr>
                    {columns.map((col, index) => (
                        <th key={index}>{col.header}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {columns.map((col, colIndex) => (
                            <td key={colIndex}>
                                {typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

Table.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            header: PropTypes.node.isRequired, // Can be string, number, or React element
            accessor: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired, // String for key, func for custom render
        })
    ).isRequired,
    className: PropTypes.string,
};

export default Table;
