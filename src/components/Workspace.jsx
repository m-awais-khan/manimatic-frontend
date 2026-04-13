import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaySquare, X, ChevronDown, ChevronRight, Code2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const SceneContainer = ({ scene, isLatest }) => {
    const [isOpen, setIsOpen] = useState(isLatest);
    const [isCodeOpen, setIsCodeOpen] = useState(false);

    // Auto-collapse this container if a newer scene finishes generating
    useEffect(() => {
        if (!isLatest) {
            setIsOpen(false);
        } else {
            setIsOpen(true);
        }
    }, [isLatest]);

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300">
            {/* Header / Toggle */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/60 transition-colors"
            >
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                        <PlaySquare size={16} className="text-indigo-400" />
                    </div>
                    <div className="flex flex-col truncate">
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">User Prompt</span>
                        <span className="text-sm font-semibold text-slate-200 truncate">{scene.prompt}</span>
                    </div>
                    {scene.reference_image && (
                        <img
                            src={`${scene.reference_image?.startsWith('http') ? scene.reference_image : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + scene.reference_image}`}
                            alt="Reference"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-700/50 shrink-0"
                        />
                    )}
                </div>
                <div className="text-slate-500 shrink-0 ml-4">
                    {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t border-slate-700/50 bg-slate-900/40"
                    >
                        <div className="p-4 space-y-4">
                            {/* Reference Image */}
                            {scene.reference_image && (
                                <div className="bg-slate-800/40 rounded-xl border border-slate-700/30 p-3">
                                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-2 block">Reference Image</span>
                                    <img
                                        src={`${scene.reference_image?.startsWith('http') ? scene.reference_image : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + scene.reference_image}`}
                                        alt="Reference"
                                        className="rounded-lg max-h-40 w-auto object-contain border border-slate-700/50"
                                    />
                                </div>
                            )}
                            {/* Video */}
                            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
                                <VideoPlayer mainVideoUrl={scene.video_path ? scene.video_path : null} status={scene.status} />
                            </div>

                            {/* Nested Code Collapsible */}
                            {scene.code && (
                                <div className="border border-slate-700/50 rounded-xl overflow-hidden bg-slate-950/50 shadow-inner">
                                    <div
                                        onClick={() => setIsCodeOpen(!isCodeOpen)}
                                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/60 transition-colors bg-slate-800/30"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Code2 size={16} className="text-emerald-400" />
                                            <span className="text-sm font-medium text-slate-300">Generated Code</span>
                                        </div>
                                        <div className="text-slate-500">
                                            {isCodeOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isCodeOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="border-t border-slate-800 text-sm">
                                                    <SyntaxHighlighter
                                                        language="python"
                                                        style={vscDarkPlus}
                                                        customStyle={{ margin: 0, padding: '16px', background: 'transparent' }}
                                                        className="no-scrollbar"
                                                    >
                                                        {scene.code}
                                                    </SyntaxHighlighter>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

function Workspace({ scenes, activeScene, isSidebarOpen, isPreviewOpen, closePreview }) {
    const scrollRef = useRef(null);

    // Auto scroll to bottom when new scenes are added
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [scenes, isPreviewOpen]);

    if (!scenes || scenes.length === 0) return null;

    const displayScenes = scenes.filter(s => s.status === 'completed' && !s.text_response);

    return (
        <AnimatePresence>
            {isPreviewOpen && displayScenes.length > 0 && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: isSidebarOpen ? '55%' : '65%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full border-l border-slate-800 bg-slate-900 flex flex-col overflow-hidden shrink-0 shadow-2xl"
                >
                    {/* Header Fixed */}
                    <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md z-10 shrink-0 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <PlaySquare size={18} className="text-indigo-400" />
                            </div>
                            <h2 className="text-base font-semibold text-white">Generation History</h2>
                        </div>
                        <button onClick={closePreview} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Scrollable List */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-slate-900/50">
                        {displayScenes.map((scene, index) => (
                            <SceneContainer
                                key={scene.id}
                                scene={scene}
                                isLatest={index === displayScenes.length - 1}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default Workspace;
