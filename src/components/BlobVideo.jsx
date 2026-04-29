import React, { useState, useEffect } from 'react';

const BlobVideo = ({ url, className, style }) => {
    const [blobSrc, setBlobSrc] = useState(null);
    useEffect(() => {
        let isMounted = true;
        let blobUrl = null;
        if (!url) { setBlobSrc(null); return; }
        const fullUrl = url.startsWith('http') ? url : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + url;
        fetch(fullUrl, { headers: { 'ngrok-skip-browser-warning': '69420' }})
            .then(res => res.blob())
            .then(blob => {
                if (isMounted) {
                    blobUrl = URL.createObjectURL(blob);
                    setBlobSrc(blobUrl);
                }
            })
            .catch(() => {
                if (isMounted) setBlobSrc(fullUrl);
            });
        return () => {
            isMounted = false;
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [url]);
    
    if (!blobSrc) return <div className={`animate-pulse bg-[#111111] ${className}`} style={style} />;
    return <video src={blobSrc} controls autoPlay className={className} style={style} crossOrigin="anonymous" />;
};

export default BlobVideo;
