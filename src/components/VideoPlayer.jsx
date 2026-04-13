import React from 'react';
import { Layers } from 'lucide-react';

const VideoPlayer = ({ mainVideoUrl }) => {
    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-xl sticky top-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-400">
                <Layers className="w-5 h-5" />
                Player
            </h2>
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner border border-slate-700 flex items-center justify-center relative group">
                {mainVideoUrl ? (
                    <video
                        src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${mainVideoUrl}`}
                        controls
                        autoPlay
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="text-center p-6 px-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-600">
                            <Layers className="w-8 h-8" />
                        </div>
                        <p className="text-slate-500 font-medium">No video generated yet</p>
                        <p className="text-sm text-slate-600 mt-2 text-center">Configure a scene on the left and hit generate to see your Manim animation here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoPlayer;
