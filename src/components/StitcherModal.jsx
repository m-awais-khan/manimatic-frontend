import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, ChevronDown, ChevronRight, Play, Film, ArrowUp, ArrowDown, Scissors } from 'lucide-react';
import { fetchChats, fetchChatDetails, createStitch, fetchStitchedVideos } from '../api/client';
import Logo from './Logo';

function StitcherModal({ isOpen, onClose, onStitchComplete }) {
    const [chats, setChats] = useState([]);
    const [stitchedVideos, setStitchedVideos] = useState([]);
    const [expandedChat, setExpandedChat] = useState(null);
    const [chatScenes, setChatScenes] = useState({});
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [previewVideo, setPreviewVideo] = useState(null);
    const [isStitching, setIsStitching] = useState(false);
    const [stitchTitle, setStitchTitle] = useState('');
    const [showStitchedSection, setShowStitchedSection] = useState(false);
    const [transition, setTransition] = useState('cut');

    const TRANSITIONS = [
        { id: 'cut', label: 'Cut', desc: 'No transition' },
        { id: 'fade', label: 'Fade', desc: 'Cross fade' },
        { id: 'fadeblack', label: 'Fade Black', desc: 'Through black' },
        { id: 'fadewhite', label: 'Fade White', desc: 'Through white' },
        { id: 'dissolve', label: 'Dissolve', desc: 'Pixel dissolve' },
        { id: 'wipeleft', label: 'Wipe Left', desc: 'Wipe effect' },
        { id: 'slideright', label: 'Slide Right', desc: 'Slide effect' },
    ];

    useEffect(() => {
        if (isOpen) {
            loadSources();
            setSelectedVideos([]);
            setPreviewVideo(null);
            setStitchTitle('');
            setTransition('cut');
        }
    }, [isOpen]);

    const loadSources = async () => {
        try {
            const [chatData, stitchedData] = await Promise.all([
                fetchChats(),
                fetchStitchedVideos()
            ]);
            setChats(chatData);
            setStitchedVideos(stitchedData.filter(s => s.status === 'completed'));
        } catch (err) {
            console.error("Failed to load sources", err);
        }
    };

    const toggleChat = async (chatId) => {
        if (expandedChat === chatId) {
            setExpandedChat(null);
            return;
        }
        setExpandedChat(chatId);
        if (!chatScenes[chatId]) {
            try {
                const data = await fetchChatDetails(chatId);
                const completedScenes = data.scenes.filter(
                    s => s.status === 'completed' && s.video_path && !s.text_response
                );
                setChatScenes(prev => ({ ...prev, [chatId]: completedScenes }));
            } catch (err) {
                console.error("Failed to load chat scenes", err);
            }
        }
    };

    const addVideo = (video) => {
        // Prevent duplicate by checking path
        const key = video.video_path;
        setSelectedVideos(prev => [...prev, {
            id: `${key}_${Date.now()}`,
            video_path: video.video_path,
            label: video.prompt || video.title || 'Stitched Video',
            type: video.prompt ? 'scene' : 'stitched'
        }]);
    };

    const removeVideo = (index) => {
        setSelectedVideos(prev => prev.filter((_, i) => i !== index));
    };

    const moveVideo = (index, direction) => {
        setSelectedVideos(prev => {
            const newList = [...prev];
            const targetIndex = index + direction;
            if (targetIndex < 0 || targetIndex >= newList.length) return prev;
            [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
            return newList;
        });
    };

    const handleStitch = async () => {
        if (selectedVideos.length < 2) return;
        setIsStitching(true);
        try {
            const paths = selectedVideos.map(v => v.video_path);
            const title = stitchTitle.trim() || `Stitched ${new Date().toLocaleString()}`;
            await createStitch(paths, title, transition);
            if (onStitchComplete) onStitchComplete();
            onClose();
        } catch (err) {
            console.error("Stitch failed", err);
        } finally {
            setIsStitching(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <Scissors size={20} className="text-purple-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Video Stitcher</h2>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Left Panel — Source Browser */}
                        <div className="w-1/2 border-r border-slate-800 flex flex-col overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-800/50 shrink-0">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Available Videos</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                                {/* Chat Sections */}
                                {chats.map(chat => (
                                    <div key={chat.id} className="rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleChat(chat.id)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800/70 rounded-lg transition-colors"
                                        >
                                            {expandedChat === chat.id
                                                ? <ChevronDown size={16} className="text-slate-500 shrink-0" />
                                                : <ChevronRight size={16} className="text-slate-500 shrink-0" />
                                            }
                                            <Film size={14} className="text-indigo-400 shrink-0" />
                                            <span className="truncate">{chat.title}</span>
                                        </button>

                                        <AnimatePresence>
                                            {expandedChat === chat.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pl-8 pr-2 py-1 space-y-1">
                                                        {chatScenes[chat.id] ? (
                                                            chatScenes[chat.id].length > 0 ? (
                                                                chatScenes[chat.id].map((scene, idx) => (
                                                                    <div
                                                                        key={scene.id}
                                                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 transition-colors group"
                                                                    >
                                                                        <button
                                                                            onClick={() => setPreviewVideo(scene.video_path)}
                                                                            className="p-1 text-slate-500 hover:text-indigo-400 transition-colors"
                                                                            title="Preview"
                                                                        >
                                                                            <Play size={14} />
                                                                        </button>
                                                                        <span className="text-xs text-slate-400 truncate flex-1">
                                                                            #{idx + 1}: {scene.prompt?.slice(0, 40)}...
                                                                        </span>
                                                                        <button
                                                                            onClick={() => addVideo(scene)}
                                                                            className="p-1 text-slate-500 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                                                                            title="Add to queue"
                                                                        >
                                                                            <Plus size={14} />
                                                                        </button>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-xs text-slate-500 px-3 py-2">No completed videos in this chat.</p>
                                                            )
                                                        ) : (
                                                            <p className="text-xs text-slate-500 px-3 py-2 animate-pulse">Loading...</p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}

                                {/* Stitched Videos Section */}
                                {stitchedVideos.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-800/50">
                                        <button
                                            onClick={() => setShowStitchedSection(!showStitchedSection)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800/70 rounded-lg transition-colors"
                                        >
                                            {showStitchedSection
                                                ? <ChevronDown size={16} className="text-slate-500 shrink-0" />
                                                : <ChevronRight size={16} className="text-slate-500 shrink-0" />
                                            }
                                            <Scissors size={14} className="text-purple-400 shrink-0" />
                                            <span>Previously Stitched</span>
                                        </button>

                                        <AnimatePresence>
                                            {showStitchedSection && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pl-8 pr-2 py-1 space-y-1">
                                                        {stitchedVideos.map(sv => (
                                                            <div
                                                                key={sv.id}
                                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 transition-colors group"
                                                            >
                                                                <button
                                                                    onClick={() => setPreviewVideo(sv.video_path)}
                                                                    className="p-1 text-slate-500 hover:text-indigo-400 transition-colors"
                                                                    title="Preview"
                                                                >
                                                                    <Play size={14} />
                                                                </button>
                                                                <span className="text-xs text-slate-400 truncate flex-1">
                                                                    {sv.title}
                                                                </span>
                                                                <button
                                                                    onClick={() => addVideo(sv)}
                                                                    className="p-1 text-slate-500 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                                                                    title="Add to queue"
                                                                >
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            {/* Preview Player */}
                            {previewVideo && (
                                <div className="border-t border-slate-800 p-3 shrink-0 bg-slate-950/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Preview</span>
                                        <button onClick={() => setPreviewVideo(null)} className="text-slate-500 hover:text-white">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <video
                                        src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${previewVideo}`}
                                        controls
                                        autoPlay
                                        className="w-full rounded-lg border border-slate-800 bg-black"
                                        style={{ maxHeight: '180px' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right Panel — Selection Queue */}
                        <div className="w-1/2 flex flex-col overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-800/50 shrink-0 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                    Queue ({selectedVideos.length})
                                </h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {selectedVideos.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-3">
                                        <Scissors size={32} className="opacity-30" />
                                        <p className="text-sm">Click <Plus size={12} className="inline" /> on videos to add them here</p>
                                    </div>
                                ) : (
                                    selectedVideos.map((video, index) => (
                                        <motion.div
                                            key={video.id}
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/60 border border-slate-700/40 rounded-xl group"
                                        >
                                            <span className="text-xs font-bold text-indigo-400 w-6 text-center shrink-0">{index + 1}</span>
                                            <span className="text-sm text-slate-300 truncate flex-1">{video.label}</span>

                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setPreviewVideo(video.video_path)}
                                                    className="p-1 text-slate-500 hover:text-indigo-400"
                                                    title="Preview"
                                                >
                                                    <Play size={12} />
                                                </button>
                                                <button
                                                    onClick={() => moveVideo(index, -1)}
                                                    disabled={index === 0}
                                                    className="p-1 text-slate-500 hover:text-white disabled:opacity-20"
                                                    title="Move up"
                                                >
                                                    <ArrowUp size={12} />
                                                </button>
                                                <button
                                                    onClick={() => moveVideo(index, 1)}
                                                    disabled={index === selectedVideos.length - 1}
                                                    className="p-1 text-slate-500 hover:text-white disabled:opacity-20"
                                                    title="Move down"
                                                >
                                                    <ArrowDown size={12} />
                                                </button>
                                                <button
                                                    onClick={() => removeVideo(index)}
                                                    className="p-1 text-slate-500 hover:text-rose-400"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Stitch Controls */}
                            <div className="border-t border-slate-800 p-4 space-y-3 shrink-0 bg-slate-900/95">
                                <input
                                    type="text"
                                    value={stitchTitle}
                                    onChange={(e) => setStitchTitle(e.target.value)}
                                    placeholder="Stitched video title (optional)"
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                                />

                                {/* Transition Selector */}
                                <div>
                                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5 block">Transition</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {TRANSITIONS.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTransition(t.id)}
                                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${transition === t.id
                                                        ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 ring-1 ring-purple-500/30'
                                                        : 'bg-slate-800/50 border-slate-700/30 text-slate-400 hover:text-slate-300 hover:bg-slate-800'
                                                    }`}
                                                title={t.desc}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleStitch}
                                    disabled={selectedVideos.length < 2 || isStitching}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-purple-600/20 border border-purple-500/50"
                                >
                                    <Scissors size={16} />
                                    {isStitching ? 'Stitching...' : `Stitch ${selectedVideos.length} Videos`}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default StitcherModal;
