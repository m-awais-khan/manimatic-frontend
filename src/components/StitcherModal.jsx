import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, ChevronDown, ChevronRight, Play, Film, ArrowUp, ArrowDown, Scissors } from 'lucide-react';
import { fetchChats, fetchChatDetails, createStitch, fetchStitchedVideos } from '../api/client';
import Logo from './Logo';
import BlobVideo from './BlobVideo';

function StitcherModal({ isOpen, onClose, onStitchComplete, activeProjectId }) {
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
        if (isOpen && activeProjectId) {
            loadSources(activeProjectId);
            setSelectedVideos([]);
            setPreviewVideo(null);
            setStitchTitle('');
            setTransition('cut');
        }
    }, [isOpen, activeProjectId]);

    const loadSources = async (projectId) => {
        try {
            const [chatData, stitchedData] = await Promise.all([
                fetchChats(projectId),
                fetchStitchedVideos(projectId)
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
        if (selectedVideos.length < 2 || !activeProjectId) return;
        setIsStitching(true);
        try {
            const paths = selectedVideos.map(v => v.video_path);
            const title = stitchTitle.trim() || `Stitched ${new Date().toLocaleString()}`;
            const newStitch = await createStitch(activeProjectId, paths, title, transition);
            if (onStitchComplete) onStitchComplete(newStitch);
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
                className="fixed inset-0 z-50 flex items-center justify-center bg-black  p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="bg-[#0a0a0a] border border-[#333333] rounded-2xl  w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#333333] bg-[#0a0a0a] shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#222222] text-[#ededed] rounded-lg border border-purple-500/20">
                                <Scissors size={20} className="text-white" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Video Stitcher</h2>
                        </div>
                        <button onClick={onClose} className="p-2 text-[#a1a1aa] hover:text-white hover:bg-[#111111] rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex flex-1 overflow-hidden">
                        <div className="w-1/2 border-r border-[#333333] flex flex-col overflow-hidden">
                            <div className="px-4 py-3 border-b border-[#333333] shrink-0">
                                <h3 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider">Available Videos</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                                {chats.map(chat => (
                                    <div key={chat.id} className="rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleChat(chat.id)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#a1a1aa] hover:bg-[#111111] rounded-lg transition-colors"
                                        >
                                            {expandedChat === chat.id
                                                ? <ChevronDown size={16} className="text-[#71717a] shrink-0" />
                                                : <ChevronRight size={16} className="text-[#71717a] shrink-0" />
                                            }
                                            <Film size={14} className="text-white shrink-0" />
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
                                                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111111] hover:bg-[#111111] transition-colors group"
                                                                    >
                                                                        <button
                                                                            onClick={() => setPreviewVideo(scene.video_path)}
                                                                            className="p-1 text-[#71717a] hover:text-white transition-colors"
                                                                            title="Preview"
                                                                        >
                                                                            <Play size={14} />
                                                                        </button>
                                                                        <span className="text-xs text-[#a1a1aa] truncate flex-1">
                                                                            #{idx + 1}: {scene.prompt?.slice(0, 40)}...
                                                                        </span>
                                                                        <button
                                                                            onClick={() => addVideo(scene)}
                                                                            className="p-1 text-[#71717a] hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                                                                            title="Add to queue"
                                                                        >
                                                                            <Plus size={14} />
                                                                        </button>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-xs text-[#71717a] px-3 py-2">No completed videos in this chat.</p>
                                                            )
                                                        ) : (
                                                            <p className="text-xs text-[#71717a] px-3 py-2 animate-pulse">Loading...</p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}

                                {stitchedVideos.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-[#333333]">
                                        <button
                                            onClick={() => setShowStitchedSection(!showStitchedSection)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#a1a1aa] hover:bg-[#111111] rounded-lg transition-colors"
                                        >
                                            {showStitchedSection
                                                ? <ChevronDown size={16} className="text-[#71717a] shrink-0" />
                                                : <ChevronRight size={16} className="text-[#71717a] shrink-0" />
                                            }
                                            <Scissors size={14} className="text-white shrink-0" />
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
                                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111111] hover:bg-[#111111] transition-colors group"
                                                            >
                                                                <button
                                                                    onClick={() => setPreviewVideo(sv.video_path)}
                                                                    className="p-1 text-[#71717a] hover:text-white transition-colors"
                                                                    title="Preview"
                                                                >
                                                                    <Play size={14} />
                                                                </button>
                                                                <span className="text-xs text-[#a1a1aa] truncate flex-1">
                                                                    {sv.title}
                                                                </span>
                                                                <button
                                                                    onClick={() => addVideo(sv)}
                                                                    className="p-1 text-[#71717a] hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
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

                            {previewVideo && (
                                <div className="border-t border-[#333333] p-3 shrink-0 bg-black">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-[#71717a] font-medium uppercase tracking-wider">Preview</span>
                                        <button onClick={() => setPreviewVideo(null)} className="text-[#71717a] hover:text-white">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <BlobVideo
                                        url={previewVideo}
                                        className="w-full rounded-lg border border-[#333333] bg-black"
                                        style={{ maxHeight: '180px' }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="w-1/2 flex flex-col overflow-hidden">
                            <div className="px-4 py-3 border-b border-[#333333] shrink-0 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider">
                                    Queue ({selectedVideos.length})
                                </h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {selectedVideos.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-[#71717a] space-y-3">
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
                                            className="flex items-center gap-2 px-3 py-2.5 bg-[#111111] border border-[#333333] rounded-xl group"
                                        >
                                            <span className="text-xs font-bold text-white w-6 text-center shrink-0">{index + 1}</span>
                                            <span className="text-sm text-[#a1a1aa] truncate flex-1">{video.label}</span>

                                            <div className="flex items-center gap-1 transition-opacity">
                                                <button
                                                    onClick={() => setPreviewVideo(video.video_path)}
                                                    className="p-1.5 text-[#a1a1aa] hover:text-white bg-[#222222] hover:bg-[#333333] rounded-md transition-colors"
                                                    title="Preview"
                                                >
                                                    <Play size={12} />
                                                </button>
                                                <button
                                                    onClick={() => moveVideo(index, -1)}
                                                    disabled={index === 0}
                                                    className="p-1.5 text-[#a1a1aa] hover:text-white bg-[#222222] hover:bg-[#333333] rounded-md disabled:opacity-30 transition-colors"
                                                    title="Move up"
                                                >
                                                    <ArrowUp size={12} />
                                                </button>
                                                <button
                                                    onClick={() => moveVideo(index, 1)}
                                                    disabled={index === selectedVideos.length - 1}
                                                    className="p-1.5 text-[#a1a1aa] hover:text-white bg-[#222222] hover:bg-[#333333] rounded-md disabled:opacity-30 transition-colors"
                                                    title="Move down"
                                                >
                                                    <ArrowDown size={12} />
                                                </button>
                                                <button
                                                    onClick={() => removeVideo(index)}
                                                    className="p-1.5 text-[#a1a1aa] hover:text-white bg-[#222222] hover:bg-rose-900 rounded-md transition-colors"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            <div className="border-t border-[#333333] p-4 space-y-3 shrink-0 bg-[#0a0a0a]">
                                <input
                                    type="text"
                                    value={stitchTitle}
                                    onChange={(e) => setStitchTitle(e.target.value)}
                                    placeholder="Stitched video title (optional)"
                                    className="w-full px-3 py-2 bg-[#111111] border border-[#333333] rounded-lg text-sm text-[#a1a1aa] placeholder-slate-500 focus:outline-none focus:border-[#666666] focus:ring-1 focus:ring-[#666666]"
                                />

                                <div>
                                    <span className="text-[10px] text-[#71717a] font-semibold uppercase tracking-wider mb-1.5 block">Transition</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {TRANSITIONS.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTransition(t.id)}
                                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${transition === t.id
                                                    ? 'bg-white text-black border-white ring-1 ring-white/30'
                                                    : 'bg-[#111111] border-[#333333] text-[#a1a1aa] hover:text-white hover:bg-[#27272a]'
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
                                    disabled={selectedVideos.length < 2 || isStitching || !activeProjectId}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black hover:bg-[#e5e5e5] disabled:bg-[#27272a] disabled:text-[#71717a] rounded-xl text-sm font-medium transition-colors border border-[#333333]"
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
