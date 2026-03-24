import React from 'react';

const Loader = () => (
    <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
        </div>
    </div>
);

export default Loader; // <--- Make sure this line is there!
