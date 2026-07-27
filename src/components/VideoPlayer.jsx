import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import axios from 'axios';

const VideoPlayer = ({ mainVideoUrl, minimal = false }) => {
    const [videoSrc, setVideoSrc] = useState(null);

    useEffect(() => {
        if (!mainVideoUrl) {
            setVideoSrc(null);
            return;
        }

        const fullUrl = mainVideoUrl.startsWith('http')
            ? mainVideoUrl
            : mainVideoUrl.startsWith('/dataset-videos/')
                ? `https://zgovfehpokusvxyxwvhl.supabase.co/storage/v1/object/public${mainVideoUrl}`
                : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + mainVideoUrl;

        // Fetch the video as a blob to inject the ngrok bypass header
        const fetchVideo = async () => {
            try {
                const response = await axios.get(fullUrl, {
                    responseType: 'blob',
                    headers: {
                        'ngrok-skip-browser-warning': '69420'
                    }
                });
                const blobUrl = URL.createObjectURL(response.data);
                setVideoSrc(blobUrl);
            } catch (err) {
                console.error("Failed to load video blob", err);
                // Fallback to direct URL if blob fetch fails
                setVideoSrc(fullUrl);
            }
        };

        fetchVideo();

        return () => {
            if (videoSrc && videoSrc.startsWith('blob:')) {
                URL.revokeObjectURL(videoSrc);
            }
        };
    }, [mainVideoUrl]);

    const playerContent = (
        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner border border-[#333333] flex items-center justify-center relative group w-full h-full">
            {videoSrc ? (
                <video
                    src={videoSrc}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                />
            ) : mainVideoUrl ? (
                <div className="text-[#a1a1aa] animate-pulse">Loading video...</div>
            ) : (
                <div className="text-center p-6 px-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#111111] rounded-full flex items-center justify-center mb-4 text-[#71717a]">
                        <Layers className="w-8 h-8" />
                    </div>
                    <p className="text-[#71717a] font-medium">No video generated yet</p>
                    <p className="text-sm text-[#71717a] mt-2 text-center">Configure a scene on the left and hit generate to see your Manim animation here.</p>
                </div>
            )}
        </div>
    );

    if (minimal) {
        return playerContent;
    }

    return (
        <div className="bg-[#111111]  border border-[#333333] rounded-2xl p-6  sticky top-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
                <Layers className="w-5 h-5" />
                Player
            </h2>
            {playerContent}
        </div>
    );
};

export default VideoPlayer;
