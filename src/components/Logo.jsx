import React from 'react';

const Logo = ({ size = 24, className = "" }) => (
    <img 
        src="/manimatic_logo.png" 
        alt="Manimatic Logo" 
        width={size} 
        height={size} 
        className={`object-contain ${className}`}
    />
);

export default Logo;
