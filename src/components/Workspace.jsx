import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from './VideoPlayer';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaySquare, X, ChevronDown, ChevronRight, Code2, Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const SceneContainer = ({ scene, isActive }) => {
    const [isOpen, setIsOpen] = useState(isActive);
    const [isCodeOpen, setIsCodeOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(scene.code);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    // Expand or collapse based on active status
    useEffect(() => {
        setIsOpen(isActive);
    }, [isActive]);

    return (
        <div id={`scene-container-${scene.id || scene._id}`} className="bg-[#111111] border border-[#333333] rounded-2xl overflow-hidden  transition-all duration-300">
            {/* Header / Toggle */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#111111] transition-colors"
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-2 bg-[#222222] text-[#ededed] rounded-lg shrink-0">
                        <PlaySquare size={16} className="text-white" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[10px] text-[#71717a] font-medium uppercase tracking-wider mb-0.5 shrink-0">User Prompt</span>
                        <span className="text-sm font-semibold text-[#a1a1aa] truncate block w-full">{scene.prompt}</span>
                    </div>
                    {scene.reference_image && (
                        <img
                            src={`${scene.reference_image?.startsWith('http') ? scene.reference_image : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + scene.reference_image}`}
                            alt="Reference"
                            className="w-10 h-10 rounded-lg object-cover border border-[#333333] shrink-0"
                        />
                    )}
                </div>
                <div className="text-[#71717a] shrink-0 ml-4">
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
                        className="overflow-hidden border-t border-[#333333] bg-[#0a0a0a]"
                    >
                        <div className="p-4 space-y-4">
                            {/* Reference Image */}
                            {scene.reference_image && (
                                <div className="bg-[#111111] rounded-xl border border-[#333333] p-3">
                                    <span className="text-[10px] text-[#71717a] font-medium uppercase tracking-wider mb-2 block">Reference Image</span>
                                    <img
                                        src={`${scene.reference_image?.startsWith('http') ? scene.reference_image : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + scene.reference_image}`}
                                        alt="Reference"
                                        className="rounded-lg max-h-40 w-auto object-contain border border-[#333333]"
                                    />
                                </div>
                            )}
                            {/* Video */}
                            <div className="bg-black rounded-xl border border-[#333333] overflow-hidden shadow-inner">
                                <VideoPlayer mainVideoUrl={scene.video_path ? scene.video_path : null} status={scene.status} />
                            </div>

                            {/* Nested Code Collapsible */}
                            {scene.code && (
                                <div className="border border-[#333333] rounded-xl overflow-hidden bg-black shadow-inner">
                                    <div
                                        onClick={() => setIsCodeOpen(!isCodeOpen)}
                                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#111111] transition-colors bg-[#111111]"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Code2 size={16} className="text-emerald-400" />
                                            <span className="text-sm font-medium text-[#a1a1aa]">Generated Code</span>
                                        </div>
                                        <div className="text-[#71717a]">
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
                                                <div className="border-t border-[#333333] text-sm relative group">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCopyCode();
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 rounded-md bg-[#222222] text-[#a1a1aa] hover:text-white hover:bg-[#333333] opacity-0 group-hover:opacity-100 transition-all border border-[#333333] z-10"
                                                        title="Copy code"
                                                    >
                                                        {isCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                                    </button>
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
    const [workspaceWidth, setWorkspaceWidth] = useState(60);
    const [isDragging, setIsDragging] = useState(false);

    // Auto scroll to the active scene when opened or when active scene changes
    useEffect(() => {
        if (isPreviewOpen && activeScene && scrollRef.current) {
            // Small timeout to ensure DOM has rendered the expansion before scrolling
            setTimeout(() => {
                const el = document.getElementById(`scene-container-${activeScene.id || activeScene._id}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 150);
        }
    }, [activeScene, isPreviewOpen, scenes.length]);

    // Resizing logic
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            // Calculate width as percentage of window width from the right edge
            const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
            // Min 30%, Max 65%
            const clamped = Math.max(30, Math.min(newWidth, 65));
            setWorkspaceWidth(clamped);
        };
        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = 'default';
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isDragging]);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };


    if (!scenes || scenes.length === 0) return null;

    const displayScenes = scenes.filter(s => s.status === 'completed' && !s.text_response);

    return (
        <AnimatePresence>
            {isPreviewOpen && displayScenes.length > 0 && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: `${workspaceWidth}%`, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={isDragging ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full border-l border-[#333333] bg-[#0a0a0a] flex flex-col overflow-hidden shrink-0 relative"
                >
                    {/* Drag Handle */}
                    <div 
                        onMouseDown={handleMouseDown}
                        className="absolute left-0 top-0 bottom-0 w-2 -ml-1 cursor-col-resize z-50 hover:bg-[#a1a1aa]/30 active:bg-[#a1a1aa]/50 transition-colors"
                    />

                    {/* Header Fixed */}
                    <div className="flex items-center justify-between p-5 border-b border-[#333333] bg-[#0a0a0a]  z-10 shrink-0 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#222222] text-[#ededed] rounded-lg">
                                <PlaySquare size={18} className="text-white" />
                            </div>
                            <h2 className="text-base font-semibold text-white">Generation History</h2>
                        </div>
                        <button onClick={closePreview} className="p-2 text-[#a1a1aa] hover:text-white hover:bg-[#111111] rounded-lg transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Scrollable List */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[#0a0a0a]">
                        {displayScenes.map((scene, index) => (
                            <SceneContainer
                                key={scene.id || scene._id}
                                scene={scene}
                                isActive={activeScene ? ((scene.id || scene._id) === (activeScene.id || activeScene._id)) : (index === displayScenes.length - 1)}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default Workspace;
