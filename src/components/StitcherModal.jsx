import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Plus,
    Trash2,
    ChevronDown,
    ChevronRight,
    Play,
    Film,
    ArrowUp,
    ArrowDown,
    Scissors,
    SlidersHorizontal,
    Gauge,
    Timer,
    Download,
    MonitorPlay,
    Layers,
    Sparkles,
    SplitSquareHorizontal,
    RotateCcw,
    Save,
    FilePlus2,
    FolderOpen,
    Pause,
} from 'lucide-react';
import {
    fetchChats,
    fetchChatDetails,
    createStitch,
    fetchStitchedVideos,
    fetchVideoEditorProjects,
    createVideoEditorProject,
    updateVideoEditorProject,
    deleteVideoEditorProject,
} from '../api/client';
import BlobVideo from './BlobVideo';

const TRANSITIONS = [
    { id: 'cut', label: 'Cut' },
    { id: 'fade', label: 'Fade' },
    { id: 'fadeblack', label: 'Fade Black' },
    { id: 'fadewhite', label: 'Fade White' },
    { id: 'dissolve', label: 'Dissolve' },
    { id: 'wipeleft', label: 'Wipe Left' },
    { id: 'wiperight', label: 'Wipe Right' },
    { id: 'slideleft', label: 'Slide Left' },
    { id: 'slideright', label: 'Slide Right' },
    { id: 'smoothleft', label: 'Smooth Left' },
];

const OUTPUT_PRESETS = [
    { id: '480p', label: '480p' },
    { id: '720p', label: '720p' },
    { id: '1080p', label: '1080p' },
];

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];

const qualityToCrf = {
    compact: 28,
    balanced: 23,
    crisp: 19,
};

const MotionDiv = motion.div;
const TRANSITION_SECONDS = 0.5;

function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
    const whole = Math.round(seconds);
    const mins = Math.floor(whole / 60);
    const secs = String(whole % 60).padStart(2, '0');
    return `${mins}:${secs}`;
}

function resolveVideoUrl(url) {
    if (!url) return '';
    return url.startsWith('http') ? url : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + url;
}

function makeClip(video) {
    const path = video.video_path;
    return {
        id: `${path}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        video_path: path,
        label: video.prompt || video.title || 'Video clip',
        type: video.prompt ? 'scene' : 'stitched',
        speed: 1,
        trim_start: 0,
        trim_end: 0,
    };
}

function StitcherModal({ isOpen, onClose, onStitchComplete, activeProjectId, projects = [] }) {
    const [chats, setChats] = useState([]);
    const [stitchedVideos, setStitchedVideos] = useState([]);
    const [expandedChat, setExpandedChat] = useState(null);
    const [chatScenes, setChatScenes] = useState({});
    const [clips, setClips] = useState([]);
    const [transitions, setTransitions] = useState([]);
    const [selectedClipId, setSelectedClipId] = useState(null);
    const [previewVideo, setPreviewVideo] = useState(null);
    const [durations, setDurations] = useState({});
    const [isRendering, setIsRendering] = useState(false);
    const [title, setTitle] = useState('');
    const [showStitchedSection, setShowStitchedSection] = useState(false);
    const [outputPreset, setOutputPreset] = useState('720p');
    const [outputFps, setOutputFps] = useState(30);
    const [outputQuality, setOutputQuality] = useState('balanced');
    const [savedProjects, setSavedProjects] = useState([]);
    const [activeEditorProjectId, setActiveEditorProjectId] = useState(null);
    const [isSavingProject, setIsSavingProject] = useState(false);
    const [editorProjectId, setEditorProjectId] = useState(activeProjectId || '');
    const [isTimelinePreview, setIsTimelinePreview] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const nextProjectId = activeProjectId || projects[0]?.id || '';
            setEditorProjectId(nextProjectId);
            resetEditor();
        }
    }, [isOpen, activeProjectId, projects]);

    useEffect(() => {
        if (isOpen && editorProjectId) {
            setChats([]);
            setStitchedVideos([]);
            setSavedProjects([]);
            loadSources(editorProjectId);
        }
    }, [isOpen, editorProjectId]);

    useEffect(() => {
        clips.forEach((clip) => {
            if (durations[clip.video_path]) return;
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = resolveVideoUrl(clip.video_path);
            video.onloadedmetadata = () => {
                setDurations((prev) => ({ ...prev, [clip.video_path]: video.duration || 0 }));
            };
        });
    }, [clips, durations]);

    const selectedClip = useMemo(
        () => clips.find((clip) => clip.id === selectedClipId) || clips[0] || null,
        [clips, selectedClipId]
    );

    const totalDuration = useMemo(() => {
        return clips.reduce((sum, clip) => {
            const sourceDuration = durations[clip.video_path] || 6;
            const trimmed = Math.max(0.1, sourceDuration - clip.trim_start - clip.trim_end);
            return sum + trimmed / clip.speed;
        }, 0);
    }, [clips, durations]);

    const resetEditor = () => {
        setClips([]);
        setTransitions([]);
        setSelectedClipId(null);
        setPreviewVideo(null);
        setIsTimelinePreview(false);
        setTitle('');
        setOutputPreset('720p');
        setOutputFps(30);
        setOutputQuality('balanced');
        setActiveEditorProjectId(null);
        setExpandedChat(null);
        setChatScenes({});
    };

    const buildEditData = () => ({
        clips,
        transitions,
        output: {
            preset: outputPreset,
            fps: outputFps,
            quality: outputQuality,
            crf: qualityToCrf[outputQuality],
        },
    });

    const applyEditorProject = (editorProject) => {
        const editData = editorProject.edit_data || {};
        const loadedClips = Array.isArray(editData.clips)
            ? editData.clips.map((clip) => ({ ...clip, id: clip.id || `${clip.video_path}_${Date.now()}_${Math.random().toString(16).slice(2)}` }))
            : [];
        setClips(loadedClips);
        setTransitions(Array.isArray(editData.transitions) ? editData.transitions.slice(0, Math.max(0, loadedClips.length - 1)) : []);
        setTitle(editorProject.title || '');
        setOutputPreset(editData.output?.preset || '720p');
        setOutputFps(editData.output?.fps || 30);
        setOutputQuality(editData.output?.quality || 'balanced');
        setActiveEditorProjectId(editorProject.id);
        setSelectedClipId(loadedClips[0]?.id || null);
        setPreviewVideo(loadedClips[0]?.video_path || null);
    };

    const saveEditorProject = async () => {
        if (!editorProjectId) return;
        setIsSavingProject(true);
        try {
            const projectTitle = title.trim() || `Edit ${new Date().toLocaleString()}`;
            const editData = buildEditData();
            const saved = activeEditorProjectId
                ? await updateVideoEditorProject(activeEditorProjectId, projectTitle, editData)
                : await createVideoEditorProject(editorProjectId, projectTitle, editData);
            setTitle(saved.title);
            setActiveEditorProjectId(saved.id);
            setSavedProjects((prev) => [saved, ...prev.filter((project) => project.id !== saved.id)]);
        } catch (err) {
            console.error('Failed to save editor project', err);
        } finally {
            setIsSavingProject(false);
        }
    };

    const removeEditorProject = async (projectId) => {
        try {
            await deleteVideoEditorProject(projectId);
            setSavedProjects((prev) => prev.filter((project) => project.id !== projectId));
            if (activeEditorProjectId === projectId) resetEditor();
        } catch (err) {
            console.error('Failed to delete editor project', err);
        }
    };

    const loadSources = async (projectId) => {
        try {
            const [chatData, stitchedData, editorData] = await Promise.all([
                fetchChats(projectId),
                fetchStitchedVideos(projectId),
                fetchVideoEditorProjects(projectId),
            ]);
            setChats(chatData);
            setStitchedVideos(stitchedData.filter((video) => video.status === 'completed'));
            setSavedProjects(editorData);
        } catch (err) {
            console.error('Failed to load video sources', err);
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
                    (scene) => scene.status === 'completed' && scene.video_path && !scene.text_response
                );
                setChatScenes((prev) => ({ ...prev, [chatId]: completedScenes }));
            } catch (err) {
                console.error('Failed to load chat scenes', err);
            }
        }
    };

    const addClip = (video) => {
        const nextClip = makeClip(video);
        setClips((prev) => {
            const next = [...prev, nextClip];
            setTransitions((current) => {
                if (next.length <= 1) return [];
                return [...current, 'cut'].slice(0, next.length - 1);
            });
            return next;
        });
        setSelectedClipId(nextClip.id);
        setPreviewVideo(nextClip.video_path);
        setIsTimelinePreview(false);
    };

    const removeClip = (index) => {
        setClips((prev) => {
            const removed = prev[index];
            const next = prev.filter((_, i) => i !== index);
            setTransitions((current) => current.filter((_, i) => i !== Math.max(0, index - 1)).slice(0, Math.max(0, next.length - 1)));
            if (removed?.id === selectedClipId) {
                setSelectedClipId(next[index]?.id || next[index - 1]?.id || null);
            }
            return next;
        });
    };

    const moveClip = (index, direction) => {
        setClips((prev) => {
            const target = index + direction;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    const updateClip = (clipId, updates) => {
        setClips((prev) => prev.map((clip) => (clip.id === clipId ? { ...clip, ...updates } : clip)));
    };

    const updateTransition = (index, value) => {
        setTransitions((prev) => prev.map((item, i) => (i === index ? value : item)));
    };

    const resetClip = () => {
        if (!selectedClip) return;
        updateClip(selectedClip.id, { speed: 1, trim_start: 0, trim_end: 0 });
    };

    const handleRender = async () => {
        if (clips.length < 2 || !editorProjectId) return;
        setIsRendering(true);
        try {
            const videoPaths = clips.map((clip) => clip.video_path);
            const exportTitle = title.trim() || `Edited video ${new Date().toLocaleString()}`;
            const editPlan = buildEditData();
            const firstTransition = transitions.find((item) => item !== 'cut') || 'cut';
            const newStitch = await createStitch(editorProjectId, videoPaths, exportTitle, firstTransition, editPlan);
            onStitchComplete?.(newStitch, editorProjectId);
            onClose();
        } catch (err) {
            console.error('Video export failed', err);
        } finally {
            setIsRendering(false);
        }
    };

    if (!isOpen) return null;

    const selectedDuration = selectedClip ? durations[selectedClip.video_path] || 0 : 0;
    const selectedTrimmed = selectedClip
        ? Math.max(0.1, selectedDuration - selectedClip.trim_start - selectedClip.trim_end)
        : 0;

    return (
        <AnimatePresence>
            <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3"
                onClick={onClose}
            >
                <MotionDiv
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.96, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-[92vh] w-full max-w-7xl overflow-hidden rounded-xl border border-[#333333] bg-[#080808] text-white"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="flex h-14 items-center justify-between border-b border-[#333333] px-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#3a3a3a] bg-[#151515]">
                                <MonitorPlay size={18} />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold">Video Editor</h2>
                                <div className="mt-1 flex items-center gap-2 text-xs text-[#858585]">
                                    <FolderOpen size={12} />
                                    <select
                                        value={editorProjectId}
                                        onChange={(event) => {
                                            setEditorProjectId(event.target.value);
                                            resetEditor();
                                        }}
                                        className="max-w-64 rounded-md border border-[#333333] bg-[#111111] px-2 py-1 text-xs text-[#d4d4d4] outline-none"
                                    >
                                        {projects.length === 0 ? (
                                            <option value="">No project</option>
                                        ) : (
                                            projects.map((project) => (
                                                <option key={project.id} value={project.id}>{project.title}</option>
                                            ))
                                        )}
                                    </select>
                                    <span>{clips.length} clips · {formatDuration(totalDuration)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsTimelinePreview((value) => !value)}
                                disabled={clips.length === 0}
                                className="flex h-9 items-center gap-2 rounded-lg border border-[#333333] bg-[#151515] px-3 text-sm font-medium text-[#d4d4d4] transition hover:bg-[#222222] hover:text-white disabled:opacity-50"
                            >
                                {isTimelinePreview ? <Pause size={15} /> : <Play size={15} />}
                                Preview Edit
                            </button>
                            <button
                                onClick={resetEditor}
                                className="flex h-9 items-center gap-2 rounded-lg border border-[#333333] bg-[#151515] px-3 text-sm font-medium text-[#d4d4d4] transition hover:bg-[#222222] hover:text-white"
                            >
                                <FilePlus2 size={15} />
                                New
                            </button>
                            <button
                                onClick={saveEditorProject}
                                disabled={isSavingProject || !editorProjectId}
                                className="flex h-9 items-center gap-2 rounded-lg border border-[#333333] bg-[#151515] px-3 text-sm font-medium text-[#d4d4d4] transition hover:bg-[#222222] hover:text-white disabled:opacity-50"
                            >
                                <Save size={15} />
                                {isSavingProject ? 'Saving' : 'Save'}
                            </button>
                            <button
                                onClick={handleRender}
                                disabled={clips.length < 2 || isRendering || !editorProjectId}
                                className="flex h-9 items-center gap-2 rounded-lg border border-white bg-white px-4 text-sm font-semibold text-black transition hover:bg-[#e8e8e8] disabled:border-[#333333] disabled:bg-[#1d1d1d] disabled:text-[#777777]"
                            >
                                <Download size={15} />
                                {isRendering ? 'Exporting' : 'Export'}
                            </button>
                            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#a1a1aa] transition hover:bg-[#171717] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="grid h-[calc(92vh-56px)] min-w-0 grid-rows-[minmax(0,1fr)_220px]">
                        <div className="grid min-h-0 min-w-0 grid-cols-[280px_minmax(0,1fr)_320px] overflow-hidden">
                            <aside className="min-h-0 min-w-0 border-r border-[#333333]">
                                <div className="flex h-11 items-center justify-between border-b border-[#333333] px-4">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa]">Media</span>
                                    <Film size={15} className="text-[#a1a1aa]" />
                                </div>
                                <div className="h-[calc(100%-44px)] overflow-y-auto overflow-x-hidden p-3">
                                    {savedProjects.length > 0 && (
                                        <div className="mb-3 border-b border-[#2b2b2b] pb-3">
                                            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[#858585]">Saved Edits</div>
                                            <div className="space-y-1">
                                                {savedProjects.map((project) => (
                                                    <SavedProjectRow
                                                        key={project.id}
                                                        project={project}
                                                        isActive={project.id === activeEditorProjectId}
                                                        onOpen={() => applyEditorProject(project)}
                                                        onDelete={() => removeEditorProject(project.id)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {chats.map((chat) => (
                                        <div key={chat.id} className="mb-1">
                                            <button
                                                onClick={() => toggleChat(chat.id)}
                                                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-[#c8c8c8] transition hover:bg-[#151515]"
                                            >
                                                {expandedChat === chat.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                                <span className="truncate">{chat.title}</span>
                                            </button>
                                            {expandedChat === chat.id && (
                                                <div className="space-y-1 py-1 pl-5">
                                                    {chatScenes[chat.id] ? (
                                                        chatScenes[chat.id].length > 0 ? (
                                                            chatScenes[chat.id].map((scene, index) => (
                                                                <MediaRow
                                                                    key={scene.id}
                                                                    label={`Scene ${index + 1}: ${scene.prompt || ''}`}
                                                                    onPreview={() => {
                                                                        setPreviewVideo(scene.video_path);
                                                                        setIsTimelinePreview(false);
                                                                    }}
                                                                    onAdd={() => addClip(scene)}
                                                                />
                                                            ))
                                                        ) : (
                                                            <p className="px-2 py-2 text-xs text-[#777777]">No completed videos.</p>
                                                        )
                                                    ) : (
                                                        <p className="px-2 py-2 text-xs text-[#777777]">Loading...</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {stitchedVideos.length > 0 && (
                                        <div className="mt-3 border-t border-[#2b2b2b] pt-3">
                                            <button
                                                onClick={() => setShowStitchedSection((value) => !value)}
                                                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-[#c8c8c8] transition hover:bg-[#151515]"
                                            >
                                                {showStitchedSection ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                                <Scissors size={14} />
                                                <span>Exports</span>
                                            </button>
                                            {showStitchedSection && (
                                                <div className="space-y-1 py-1 pl-5">
                                                    {stitchedVideos.map((video) => (
                                                        <MediaRow
                                                            key={video.id}
                                                            label={video.title}
                                                            onPreview={() => {
                                                                setPreviewVideo(video.video_path);
                                                                setIsTimelinePreview(false);
                                                            }}
                                                            onAdd={() => addClip(video)}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </aside>

                            <main className="flex min-h-0 min-w-0 flex-col bg-black">
                                <div className="flex h-11 items-center justify-between border-b border-[#333333] px-4">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa]">Preview</span>
                                    <div className="flex items-center gap-2 text-xs text-[#858585]">
                                        <Timer size={14} />
                                        {formatDuration(totalDuration)}
                                    </div>
                                </div>
                                <div className="flex min-h-0 flex-1 items-center justify-center p-5">
                                    {isTimelinePreview && clips.length > 0 ? (
                                        <EditorPreviewPlayer
                                            key={clips.map((clip) => clip.id).join('|')}
                                            clips={clips}
                                            transitions={transitions}
                                            durations={durations}
                                            onClipChange={(clip) => {
                                                setSelectedClipId(clip.id);
                                                setPreviewVideo(clip.video_path);
                                            }}
                                        />
                                    ) : previewVideo ? (
                                        <BlobVideo
                                            url={previewVideo}
                                            className="max-h-full w-full max-w-4xl rounded-lg border border-[#252525] bg-black object-contain"
                                            style={{ aspectRatio: '16 / 9' }}
                                        />
                                    ) : (
                                        <div className="flex aspect-video w-full max-w-4xl items-center justify-center rounded-lg border border-dashed border-[#333333] bg-[#080808]">
                                            <Play size={30} className="text-[#555555]" />
                                        </div>
                                    )}
                                </div>
                            </main>

                            <aside className="min-h-0 min-w-0 overflow-hidden border-l border-[#333333]">
                                <div className="flex h-11 items-center gap-2 border-b border-[#333333] px-4">
                                    <SlidersHorizontal size={15} className="text-[#a1a1aa]" />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa]">Inspector</span>
                                </div>
                                <div className="h-[calc(100%-44px)] overflow-y-auto overflow-x-hidden p-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#858585]">Title</label>
                                            <input
                                                value={title}
                                                onChange={(event) => setTitle(event.target.value)}
                                                placeholder="Export title"
                                                className="h-9 w-full rounded-lg border border-[#333333] bg-[#111111] px-3 text-sm text-white outline-none transition focus:border-[#777777]"
                                            />
                                        </div>

                                        <section className="rounded-lg border border-[#2b2b2b] bg-[#101010] p-3">
                                            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                                <Gauge size={15} />
                                                Clip
                                            </div>
                                            {selectedClip ? (
                                                <div className="space-y-3">
                                                    <p className="line-clamp-2 text-sm text-[#d4d4d4]">{selectedClip.label}</p>
                                                    <ControlGroup label="Speed">
                                                        <div className="grid grid-cols-4 gap-1">
                                                            {SPEEDS.map((speed) => (
                                                                <button
                                                                    key={speed}
                                                                    onClick={() => updateClip(selectedClip.id, { speed })}
                                                                    className={`h-8 rounded-md border text-xs transition ${selectedClip.speed === speed ? 'border-white bg-white text-black' : 'border-[#333333] bg-[#171717] text-[#bdbdbd] hover:text-white'}`}
                                                                >
                                                                    {speed}x
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </ControlGroup>
                                                    <ControlGroup label={`Trim start · ${selectedClip.trim_start.toFixed(1)}s`}>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max={Math.max(0, selectedDuration - selectedClip.trim_end - 0.2)}
                                                            step="0.1"
                                                            value={selectedClip.trim_start}
                                                            onChange={(event) => updateClip(selectedClip.id, { trim_start: Number(event.target.value) })}
                                                            className="w-full"
                                                        />
                                                    </ControlGroup>
                                                    <ControlGroup label={`Trim end · ${selectedClip.trim_end.toFixed(1)}s`}>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max={Math.max(0, selectedDuration - selectedClip.trim_start - 0.2)}
                                                            step="0.1"
                                                            value={selectedClip.trim_end}
                                                            onChange={(event) => updateClip(selectedClip.id, { trim_end: Number(event.target.value) })}
                                                            className="w-full"
                                                        />
                                                    </ControlGroup>
                                                    <div className="flex items-center justify-between text-xs text-[#858585]">
                                                        <span>Source {formatDuration(selectedDuration)}</span>
                                                        <span>Edited {formatDuration(selectedTrimmed / selectedClip.speed)}</span>
                                                    </div>
                                                    <button
                                                        onClick={resetClip}
                                                        className="flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-[#333333] text-xs text-[#c8c8c8] transition hover:bg-[#191919] hover:text-white"
                                                    >
                                                        <RotateCcw size={13} />
                                                        Reset clip
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-[#777777]">Select a clip in the timeline.</p>
                                            )}
                                        </section>

                                        <section className="rounded-lg border border-[#2b2b2b] bg-[#101010] p-3">
                                            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                                <Download size={15} />
                                                Export
                                            </div>
                                            <ControlGroup label="Size">
                                                <Segmented options={OUTPUT_PRESETS} value={outputPreset} onChange={setOutputPreset} />
                                            </ControlGroup>
                                            <ControlGroup label="Frame rate">
                                                <Segmented
                                                    options={[{ id: 24, label: '24' }, { id: 30, label: '30' }, { id: 60, label: '60' }]}
                                                    value={outputFps}
                                                    onChange={setOutputFps}
                                                />
                                            </ControlGroup>
                                            <ControlGroup label="Quality">
                                                <Segmented
                                                    options={[{ id: 'compact', label: 'Compact' }, { id: 'balanced', label: 'Balanced' }, { id: 'crisp', label: 'Crisp' }]}
                                                    value={outputQuality}
                                                    onChange={setOutputQuality}
                                                />
                                            </ControlGroup>
                                        </section>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        <section className="min-h-0 min-w-0 overflow-hidden border-t border-[#333333] bg-[#0b0b0b]">
                            <div className="flex h-10 items-center justify-between border-b border-[#262626] px-4">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#a1a1aa]">
                                    <Layers size={15} />
                                    Timeline
                                </div>
                                <div className="text-xs text-[#858585]">{clips.length < 2 ? 'Add at least two clips to export' : `${clips.length - 1} transitions`}</div>
                            </div>
                            <div className="h-[180px] min-w-0 overflow-x-auto overflow-y-hidden p-3">
                                {clips.length === 0 ? (
                                    <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-[#333333] text-sm text-[#777777]">
                                        Add videos from the media bin
                                    </div>
                                ) : (
                                    <div className="flex h-full w-max min-w-full items-stretch">
                                    {clips.map((clip, index) => {
                                        const sourceDuration = durations[clip.video_path] || 6;
                                        const editedDuration = Math.max(0.1, sourceDuration - clip.trim_start - clip.trim_end) / clip.speed;
                                        const width = Math.max(150, Math.min(340, editedDuration * 38));
                                        return (
                                            <React.Fragment key={clip.id}>
                                                <div
                                                    style={{ width }}
                                                    className={`flex shrink-0 flex-col justify-between rounded-lg border p-3 transition ${selectedClipId === clip.id ? 'border-white bg-[#1b1b1b]' : 'border-[#333333] bg-[#121212] hover:border-[#555555]'}`}
                                                    onClick={() => {
                                                        setSelectedClipId(clip.id);
                                                        setPreviewVideo(clip.video_path);
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <div className="mb-1 flex items-center gap-1 text-xs text-[#858585]">
                                                                <SplitSquareHorizontal size={12} />
                                                                Clip {index + 1}
                                                            </div>
                                                            <p className="truncate text-sm font-medium text-white">{clip.label}</p>
                                                        </div>
                                                        <button
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                removeClip(index);
                                                            }}
                                                            className="rounded-md p-1 text-[#858585] transition hover:bg-[#2a1414] hover:text-white"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="rounded-md bg-[#252525] px-2 py-1 text-xs text-[#d4d4d4]">{clip.speed}x</span>
                                                        <span className="text-xs text-[#858585]">{formatDuration(editedDuration)}</span>
                                                        <div className="flex items-center gap-1">
                                                            <IconButton disabled={index === 0} onClick={() => moveClip(index, -1)} icon={<ArrowUp size={12} />} />
                                                            <IconButton disabled={index === clips.length - 1} onClick={() => moveClip(index, 1)} icon={<ArrowDown size={12} />} />
                                                        </div>
                                                    </div>
                                                </div>
                                                {index < clips.length - 1 && (
                                                    <div className="flex w-32 shrink-0 flex-col items-center justify-center gap-2 px-2">
                                                        <Sparkles size={15} className="text-[#858585]" />
                                                        <select
                                                            value={transitions[index] || 'cut'}
                                                            onChange={(event) => updateTransition(index, event.target.value)}
                                                            className="h-8 w-full rounded-md border border-[#333333] bg-[#111111] px-2 text-xs text-[#d4d4d4] outline-none"
                                                        >
                                                            {TRANSITIONS.map((transition) => (
                                                                <option key={transition.id} value={transition.id}>{transition.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </MotionDiv>
            </MotionDiv>
        </AnimatePresence>
    );
}

function EditorPreviewPlayer({ clips, transitions, durations, onClipChange }) {
    const videoRef = useRef(null);
    const transitionTimeoutRef = useRef(null);
    const [clipIndex, setClipIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [transitionName, setTransitionName] = useState('');
    const [transitionClip, setTransitionClip] = useState(null);
    const onClipChangeRef = useRef(onClipChange);
    const clip = clips[clipIndex] || null;
    const sourceDuration = clip ? durations[clip.video_path] || 0 : 0;
    const clipEnd = clip ? Math.max(0.1, sourceDuration - clip.trim_end) : 0;

    useEffect(() => {
        onClipChangeRef.current = onClipChange;
    }, [onClipChange]);

    useEffect(() => {
        return () => {
            if (transitionTimeoutRef.current) {
                window.clearTimeout(transitionTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!clip || !videoRef.current) return;
        const video = videoRef.current;
        video.playbackRate = clip.speed || 1;
        video.currentTime = clip.trim_start || 0;
        onClipChangeRef.current?.(clip);
        if (isPlaying) {
            video.play().catch(() => {});
        }
    }, [clipIndex, clip, isPlaying]);

    const advanceClip = () => {
        if (transitionName || transitionTimeoutRef.current) return;

        if (clipIndex >= clips.length - 1) {
            setIsPlaying(false);
            return;
        }

        const transition = transitions[clipIndex] || 'cut';
        if (transition !== 'cut') {
            const label = TRANSITIONS.find((item) => item.id === transition)?.label || transition;
            const nextClip = clips[clipIndex + 1];
            setTransitionName(label);
            setTransitionClip(nextClip);
            transitionTimeoutRef.current = window.setTimeout(() => {
                transitionTimeoutRef.current = null;
                setTransitionName('');
                setTransitionClip(null);
                setClipIndex((index) => Math.min(index + 1, clips.length - 1));
            }, TRANSITION_SECONDS * 1000);
        } else {
            setClipIndex((index) => Math.min(index + 1, clips.length - 1));
        }
    };

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video || !clip) return;
        if (video.currentTime >= clipEnd - 0.05) {
            video.pause();
            advanceClip();
        }
    };

    const togglePlayback = () => {
        const video = videoRef.current;
        if (!video) return;
        if (isPlaying) {
            video.pause();
            setIsPlaying(false);
        } else {
            if (clipIndex >= clips.length - 1 && video.currentTime >= clipEnd - 0.05) {
                setClipIndex(0);
                setTransitionName('');
                setTransitionClip(null);
            }
            video.play().catch(() => {});
            setIsPlaying(true);
        }
    };

    if (!clip) {
        return null;
    }

    return (
        <div className="relative flex w-full max-w-4xl flex-col gap-3">
            <div className="relative overflow-hidden rounded-lg border border-[#252525] bg-black">
                <video
                    key={clip.id}
                    ref={videoRef}
                    src={resolveVideoUrl(clip.video_path)}
                    className={`aspect-video w-full bg-black object-contain transition-opacity duration-500 ${transitionName ? 'opacity-35' : 'opacity-100'}`}
                    controls={false}
                    onLoadedMetadata={() => {
                        if (videoRef.current) {
                            videoRef.current.currentTime = clip.trim_start || 0;
                            videoRef.current.playbackRate = clip.speed || 1;
                        }
                    }}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={advanceClip}
                />
                {transitionClip && (
                    <video
                        key={`next_${transitionClip.id}`}
                        src={resolveVideoUrl(transitionClip.video_path)}
                        className={`absolute inset-0 aspect-video w-full bg-black object-contain transition-opacity duration-500 ${transitionName ? 'opacity-100' : 'opacity-0'}`}
                        muted
                        playsInline
                        autoPlay
                        style={{
                            clipPath: transitionName.toLowerCase().includes('wipe') ? 'inset(0 0 0 0)' : undefined,
                        }}
                    />
                )}
                {transitionName && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md border border-white/15 bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                        {transitionName}
                    </div>
                )}
            </div>
            <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-[#252525] bg-[#101010] px-3 py-2">
                <button
                    onClick={togglePlayback}
                    className="flex h-8 shrink-0 items-center gap-2 rounded-md border border-[#333333] px-3 text-xs text-[#d4d4d4] transition hover:bg-[#222222] hover:text-white"
                >
                    {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
                <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-center text-xs text-[#a1a1aa]">
                    <span className="shrink-0 text-white">Clip {clipIndex + 1}</span>
                    <span className="shrink-0 text-[#555555]">/</span>
                    <span className="shrink-0">{clips.length}</span>
                    <span className="shrink-0 text-[#555555]">·</span>
                    <span className="block min-w-0 truncate">{clip.label}</span>
                </div>
                <button
                    onClick={() => {
                        setClipIndex(0);
                        setIsPlaying(true);
                    }}
                    className="flex h-8 shrink-0 items-center gap-2 rounded-md border border-[#333333] px-3 text-xs text-[#d4d4d4] transition hover:bg-[#222222] hover:text-white"
                >
                    <RotateCcw size={13} />
                    Restart
                </button>
            </div>
        </div>
    );
}

function MediaRow({ label, onPreview, onAdd }) {
    return (
        <div className="group flex items-center gap-2 rounded-lg bg-[#111111] px-2 py-2 text-xs text-[#bdbdbd]">
            <button onClick={onPreview} className="rounded-md p-1 text-[#858585] transition hover:bg-[#222222] hover:text-white">
                <Play size={13} />
            </button>
            <span className="min-w-0 flex-1 truncate">{label}</span>
            <button onClick={onAdd} className="rounded-md p-1 text-[#858585] opacity-100 transition hover:bg-[#222222] hover:text-white">
                <Plus size={13} />
            </button>
        </div>
    );
}

function SavedProjectRow({ project, isActive, onOpen, onDelete }) {
    return (
        <div className={`group flex items-center gap-2 rounded-lg px-2 py-2 text-xs ${isActive ? 'bg-[#242424] text-white' : 'bg-[#111111] text-[#bdbdbd]'}`}>
            <button onClick={onOpen} className="min-w-0 flex-1 truncate text-left">
                {project.title}
            </button>
            <button onClick={onDelete} className="rounded-md p-1 text-[#858585] transition hover:bg-[#2a1414] hover:text-white">
                <Trash2 size={13} />
            </button>
        </div>
    );
}

function ControlGroup({ label, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#858585]">{label}</label>
            {children}
        </div>
    );
}

function Segmented({ options, value, onChange }) {
    return (
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-[#2b2b2b] bg-[#151515] p-1">
            {options.map((option) => (
                <button
                    key={option.id}
                    onClick={() => onChange(option.id)}
                    className={`h-8 rounded-md text-xs font-medium transition ${value === option.id ? 'bg-white text-black' : 'text-[#bdbdbd] hover:bg-[#242424] hover:text-white'}`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

function IconButton({ icon, onClick, disabled }) {
    return (
        <button
            disabled={disabled}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            className="rounded-md bg-[#252525] p-1 text-[#bdbdbd] transition hover:bg-[#333333] hover:text-white disabled:opacity-30"
        >
            {icon}
        </button>
    );
}

export default StitcherModal;
