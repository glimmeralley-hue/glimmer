import React from 'react';

const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
    const sizeClasses = {
        sm: 'spinner-border-sm',
        md: '',
        lg: 'spinner-border-lg'
    };

    return (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div className={`spinner-border text-primary ${sizeClasses[size]}`} role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            {message && (
                <p className="text-white opacity-50 mt-3 mb-0 small">
                    {message}
                </p>
            )}
        </div>
    );
};

export default LoadingSpinner;
