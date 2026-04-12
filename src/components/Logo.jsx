import React from 'react';

const Logo = ({ size = 24, className = "" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <defs>
            <linearGradient id="manimLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" /> {/* indigo-400 */}
                <stop offset="100%" stopColor="#c084fc" /> {/* purple-400 */}
            </linearGradient>
            <linearGradient id="manimLogoGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a5b4fc" /> {/* indigo-300 */}
                <stop offset="100%" stopColor="#d8b4fe" /> {/* purple-300 */}
            </linearGradient>
        </defs>
        <path
            d="M3 20V6.5a2.5 2.5 0 013.9-2.07l5.1 3.82 5.1-3.82A2.5 2.5 0 0121 6.5V20"
            stroke="url(#manimLogoGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M12 12V20"
            stroke="url(#manimLogoGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="12" cy="8.5" r="2.5" fill="url(#manimLogoGradientLight)" />
    </svg>
);

export default Logo;
