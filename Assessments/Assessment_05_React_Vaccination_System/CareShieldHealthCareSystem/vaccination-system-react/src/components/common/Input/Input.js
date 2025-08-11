// components/common/Input/Input.js
import React from 'react';
import PropTypes from 'prop-types';
import './Input.css'; // Assuming an Input.css for specific input styles

const Input = ({
                   label,
                   id,
                   type = 'text',
                   value,
                   onChange,
                   placeholder,
                   required = false,
                   disabled = false,
                   readOnly = false,
                   error, // String for error message
                   className = '',
                   ...props
               }) => {
    const inputClasses = [
        'input-field',
        error ? 'input-field--error' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className="input-group">
            {label && (
                <label htmlFor={id} className="input-label">
                    {label} {required && <span className="required-star">*</span>}
                </label>
            )}
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                readOnly={readOnly}
                className={inputClasses}
                {...props}
            />
            {error && <p className="input-error-message">{error}</p>}
        </div>
    );
};

Input.propTypes = {
    label: PropTypes.string,
    id: PropTypes.string.isRequired,
    type: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    error: PropTypes.string, // Error message string
    className: PropTypes.string,
};

export default Input;
