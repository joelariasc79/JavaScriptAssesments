// components/common/Button/Button.js
import React from 'react';
import PropTypes from 'prop-types';
import './Button.css'; // Assuming a Button.css for specific button styles

const Button = ({
                    children,
                    onClick,
                    type = 'button', // 'button', 'submit', 'reset'
                    variant = 'primary', // 'primary', 'secondary', 'danger', 'outline'
                    size = 'medium', // 'small', 'medium', 'large'
                    disabled = false,
                    className = '',
                    ...props
                }) => {
    const buttonClasses = [
        'button',
        `button--${variant}`,
        `button--${size}`,
        disabled ? 'button--disabled' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            onClick={onClick}
            className={buttonClasses}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

Button.propTypes = {
    children: PropTypes.node.isRequired,
    onClick: PropTypes.func,
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'outline']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    className: PropTypes.string,
};

export default Button;
