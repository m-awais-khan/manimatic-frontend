import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkSceneStatus } from '../api/client';
import { RefreshCw, Play, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const SceneList = ({ scenes, onUpdateScene }) => {
    // Poll for updates on pending/generating/rendering scenes
    useEffect(() => {
        const activeScenes = scenes.filter(s =>
            ['pending', 'generating_code', 'rendering'].includes(s.status)
        );

        if (activeScenes.length === 0) return;

        const interval = setInterval(() => {
            activeScenes.forEach(async (scene) => {
                try {
                    const updatedScene = await checkSceneStatus(scene.id);
                    if (updatedScene.status !== scene.status) {
                        onUpdateScene(updatedScene);
                    }
                } catch (e) {
                    console.error("Error polling scene", scene.id, e);
                }
            });
        }, 5000); // 5 seconds

        return () => clearInterval(interval);
    }, [scenes, onUpdateScene]);

    if (scenes.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-800/20 rounded-xl border border-slate-700 border-dashed">
                <p className="text-slate-400">No scenes generated yet. Start by generating one above!</p>
            </div>
        );
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
            case 'generating_code':
            case 'rendering':
                return <Loader2 className="w-5 h-5 animate-spin text-blue-400" />;
            case 'completed':
                return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-400" />;
            default:
                return <RefreshCw className="w-5 h-5 text-slate-400" />;
        }
    };

    const getStatusMessage = (status) => {
        switch (status) {
            case 'pending': return 'Queued...';
            case 'generating_code': return 'Writing Code...';
            case 'rendering': return 'Rendering frames...';
            case 'completed': return 'Finished';
            case 'error': return 'Failed';
            default: return status;
        }
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-200">Generated Scenes ({scenes.length})</h3>
            <div className="grid gap-4">
                <AnimatePresence>
                    {scenes.map((scene) => (
                        <motion.div
                            key={scene.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    {getStatusIcon(scene.status)}
                                    <span className="font-medium text-slate-200 capitalize">
                                        {getStatusMessage(scene.status)}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 pointer-events-none">
                                        {scene.animation_type}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 truncate pr-4">
                                    "{scene.prompt}"
                                </p>
                                {scene.status === 'error' && (
                                    <p className="text-xs text-red-400 mt-2 bg-red-400/10 p-2 rounded">
                                        {scene.error_message}
                                    </p>
                                )}
                            </div>

                            {scene.status === 'completed' && scene.video_path && (
                                <a
                                    href={`${scene.video_path?.startsWith('http') ? scene.video_path : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + scene.video_path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors whitespace-nowrap"
                                >
                                    <Play className="w-4 h-4" />
                                    Watch Video
                                </a>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SceneList;
