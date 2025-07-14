// components/common/Modal/Modal.js
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import './Modal.css'; // Assuming a Modal.css for specific modal styles

const Modal = ({ isOpen, onClose, title, children, footer, className = '' }) => {
    const modalRef = useRef();

    // Close modal on escape key press
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    // Handle clicks outside the modal content
    const handleOverlayClick = (event) => {
        // Only close the modal if the click target is exactly the overlay itself,
        // not any of its children (which might include the date picker's pop-up).
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) {
        return null;
    }

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className={`modal-content ${className}`} ref={modalRef}>
                <div className="modal-header">
                    {title && <h3 className="modal-title">{title}</h3>}
                    <button className="modal-close-button" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>,
        document.body // Append modal to the body
    );
};

Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    footer: PropTypes.node, // Can be a React element or string
    className: PropTypes.string,
};

export default Modal;


// // components/common/Modal/Modal.js
// import React, { useEffect, useRef } from 'react';
// import ReactDOM from 'react-dom';
// import PropTypes from 'prop-types';
// import './Modal.css'; // Assuming a Modal.css for specific modal styles
//
// const Modal = ({ isOpen, onClose, title, children, footer, className = '' }) => {
//     const modalRef = useRef();
//
//     // Close modal on escape key press
//     useEffect(() => {
//         const handleEscape = (event) => {
//             if (event.key === 'Escape') {
//                 onClose();
//             }
//         };
//         if (isOpen) {
//             document.addEventListener('keydown', handleEscape);
//         }
//         return () => {
//             document.removeEventListener('keydown', handleEscape);
//         };
//     }, [isOpen, onClose]);
//
//     // Handle clicks outside the modal content
//     const handleOverlayClick = (event) => {
//         if (modalRef.current && !modalRef.current.contains(event.target)) {
//             onClose();
//         }
//     };
//
//     if (!isOpen) {
//         return null;
//     }
//
//     return ReactDOM.createPortal(
//         <div className="modal-overlay" onClick={handleOverlayClick}>
//             <div className={`modal-content ${className}`} ref={modalRef}>
//                 <div className="modal-header">
//                     {title && <h3 className="modal-title">{title}</h3>}
//                     <button className="modal-close-button" onClick={onClose}>
//                         &times;
//                     </button>
//                 </div>
//                 <div className="modal-body">
//                     {children}
//                 </div>
//                 {footer && <div className="modal-footer">{footer}</div>}
//             </div>
//         </div>,
//         document.body // Append modal to the body
//     );
// };
//
// Modal.propTypes = {
//     isOpen: PropTypes.bool.isRequired,
//     onClose: PropTypes.func.isRequired,
//     title: PropTypes.string,
//     children: PropTypes.node.isRequired,
//     footer: PropTypes.node, // Can be a React element or string
//     className: PropTypes.string,
// };
//
// export default Modal;
