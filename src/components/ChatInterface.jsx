import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Send, Menu, PlaySquare, X, ChevronDown, Plus, Sparkles, Wand2, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import ProcessingBlock from './ProcessingBlock';
import { enhancePrompt } from '../api/client';

/* ── Suggestion Chip ──────────────────────────────────────────
   Shows a fixed-height truncated card. On hover a floating panel
   appears beside it (via React portal) showing the full instruction
   — the chip itself never resizes.
*/
const PREVIEW_LEN = 88;
const POPOVER_W   = 300;

function SuggestionChip({ s, index, isGenerating, onSuggestionClick }) {
    const [hovered, setHovered]       = useState(false);
    const [popoverStyle, setPopoverStyle] = useState({});
    const btnRef = useRef(null);
    const isLong = s.instruction.length > PREVIEW_LEN;

    const handleMouseEnter = () => {
        if (btnRef.current && isLong) {
            const rect = btnRef.current.getBoundingClientRect();
            const GAP  = 14;
            const vw   = window.innerWidth;
            const vh   = window.innerHeight;

            // Prefer right side; flip left if not enough room
            let left = rect.right + GAP;
            if (left + POPOVER_W > vw - 16) {
                left = rect.left - POPOVER_W - GAP;
            }

            // Clamp vertically so panel never clips bottom of viewport
            let top = rect.top;
            const estimatedH = 160; // conservative estimate
            if (top + estimatedH > vh - 16) {
                top = vh - estimatedH - 16;
            }

            setPopoverStyle({ top, left, width: POPOVER_W });
        }
        setHovered(true);
    };

    const handleMouseLeave = () => setHovered(false);

    return (
        <>
            {/* ── The chip itself ── fixed height, never grows ── */}
            <motion.button
                ref={btnRef}
                id={`suggestion-${s.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07, duration: 0.25 }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={() => onSuggestionClick && onSuggestionClick(s)}
                disabled={isGenerating}
                className={`flex flex-col items-start text-left px-4 py-3 rounded-xl border w-full
                    transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed
                    ${
                        hovered
                            ? 'border-[#444444] bg-[#111111]'
                            : 'border-[#222222] bg-[#0d0d0d]'
                    }`}
            >
                <p className={`text-sm leading-snug line-clamp-2 transition-colors duration-150 ${
                    hovered ? 'text-white' : 'text-[#d4d4d8]'
                }`}>
                    {isLong
                        ? s.instruction.slice(0, PREVIEW_LEN - 3) + '…'
                        : s.instruction}
                </p>
            </motion.button>

            {/* ── Floating full-prompt panel ── portal so it escapes any overflow */}
            {isLong && createPortal(
                <AnimatePresence>
                    {hovered && (
                        <motion.div
                            initial={{ opacity: 0, x: -8, scale: 0.97 }}
                            animate={{ opacity: 1, x: 0,  scale: 1    }}
                            exit={{    opacity: 0, x: -8, scale: 0.97 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            style={{ position: 'fixed', zIndex: 9999, ...popoverStyle }}
                            className="pointer-events-none rounded-xl border border-[#333333]
                                bg-[#0d0d0d] shadow-2xl shadow-black/70 p-4"
                        >
                            <p className="text-[10px] font-semibold text-[#71717a] uppercase tracking-widest mb-2">
                                Full prompt
                            </p>
                            <p className="text-sm text-[#e4e4e7] leading-relaxed">
                                {s.instruction}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}

function ChatInterface({ currentChat, chatHistory, onGenerate, isGenerating, isSidebarOpen, toggleSidebar, hasCompletedScene, isPreviewOpen, togglePreview, onSceneClick, selectedModel, onModelChange, suggestions = [], onSuggestionClick }) {
    const [prompt, setPrompt] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [suggestedPrompt, setSuggestedPrompt] = useState(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const modelDropdownRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isGenerating]);

    const handleEnhance = async () => {
        if (!prompt.trim() || isEnhancing) return;
        setIsEnhancing(true);
        setSuggestedPrompt(null);
        try {
            const data = await enhancePrompt(prompt.trim());
            setSuggestedPrompt(data.enhanced_prompt);
        } catch (err) {
            console.error('Enhance failed:', err);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleApplySuggestion = () => {
        setPrompt(suggestedPrompt);
        setSuggestedPrompt(null);
    };

    const handleDiscardSuggestion = () => {
        setSuggestedPrompt(null);
    };

    const MODELS = [
        { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Google' },
        { id: 'groq-llama-3.3-70b-versatile', label: 'Llama 3.3 70B', provider: 'Groq (Fast)' },
        { 
            id: 'custom-manim-model', 
            label: 'Custom Manim Model', 
            provider: 'Manimatic',
            disabled: true,
            note: 'Due to limited resources these features are unavailable for now.'
        },
        {
            id: 'manimatic-qwen32b-modal',
            label: 'Manimatic 32B',
            provider: 'Modal A100',
            disabled: true,
            note: 'Due to limited resources these features are unavailable for now.'
        },
    ];

    const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];
    const isModal32BSelected = currentModel.id === 'manimatic-qwen32b-modal';

    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            // First collapse the height so scrollHeight recalculates correctly
            textarea.style.height = '60px';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${Math.min(Math.max(scrollHeight, 60), 200)}px`;
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [prompt]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
            setImagePreview(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if ((prompt.trim() || selectedImage) && !isGenerating && !isEnhancing) {
            onGenerate(prompt, selectedImage);
            setPrompt('');
            clearImage();
        }
    };

    // Cleanup object URL on unmount
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    // Close model dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
                setIsModelDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isNewChat = !currentChat;

    return (
        <div className="flex-1 flex flex-col h-full bg-black relative min-w-[350px]">
            {/* Toggle Sidebar Button */}
            {!isSidebarOpen && (
                <div className="absolute top-4 left-4 z-10">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 bg-[#111111] hover:bg-[#27272a]  rounded-lg text-[#a1a1aa] hover:text-white transition-colors  border border-[#333333]"
                        title="Open Sidebar"
                    >
                        <Menu size={20} />
                    </button>
                </div>
            )}



            {/* Top Right Controls */}
            {hasCompletedScene && !isPreviewOpen && (
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={togglePreview}
                        className="flex items-center gap-2 px-3 py-2 bg-[#111111] hover:bg-[#27272a]  rounded-lg text-[#a1a1aa] hover:text-white transition-colors  border border-[#333333] font-medium text-sm"
                    >
                        <PlaySquare size={16} />
                        Show Preview
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-8">
                <AnimatePresence mode="popLayout">
                    {isNewChat ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-full flex flex-col items-center justify-center -mt-20"
                        >
                            <div className="flex flex-col items-center justify-center flex-1 space-y-4">
                                <div className="w-full max-w-2xl mx-auto overflow-hidden rounded-2xl">
                                    <video
                                        src="/manimatic_logo_animation.mp4"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                                <h1 className="text-2xl font-semibold text-white">How can I help you animate?</h1>

                                {/* Suggestion Chips */}
                                {suggestions.length > 0 && (
                                    <div className="w-full max-w-2xl mt-2">
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <Sparkles size={13} className="text-[#71717a]" />
                                            <span className="text-xs text-[#71717a] font-medium uppercase tracking-wider">Try an example</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {suggestions.map((s, i) => (
                                                <SuggestionChip
                                                    key={s.id}
                                                    s={s}
                                                    index={i}
                                                    isGenerating={isGenerating}
                                                    onSuggestionClick={onSuggestionClick}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>    <p className="text-[#a1a1aa]">Describe what you want to see, and I'll generate the Manim code.</p>
                        </motion.div>
                    ) : (
                        <div className="max-w-3xl mx-auto space-y-6">
                            {chatHistory.map((msg, index) => (
                                <motion.div
                                    key={currentChat ? `${currentChat}-${index}` : `new-${index}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full flex flex-col items-center"
                                >
                                    {msg.role === 'user' ? (
                                        <div className="w-full max-w-3xl flex flex-col gap-3 my-4">
                                            {msg.image && (
                                                <div className="w-full">
                                                    <img
                                                        src={msg.image}
                                                        alt="Attached"
                                                        className="rounded-xl max-h-48 w-auto object-cover border border-[#333333]"
                                                    />
                                                </div>
                                            )}
                                            <div className="text-base text-white tracking-tight leading-relaxed">
                                                {msg.content}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full max-w-4xl">
                                            <ProcessingBlock 
                                                msg={msg} 
                                                model={currentModel.label} 
                                                onSceneClick={onSceneClick} 
                                                isPreviewOpen={isPreviewOpen}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            {/* Invisible element to anchor auto-scroll */}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className={`p-4 ${isNewChat ? 'absolute bottom-8 left-0 right-0 max-w-3xl mx-auto' : 'border-t border-[#333333] bg-black '}`}>
                <div className={isNewChat ? '' : 'max-w-3xl mx-auto'}>
                    <form onSubmit={handleSubmit} className="relative bg-[#111111] rounded-2xl border border-[#333333]  transition-shadow transition-colors focus-within:border-[#333333] focus-within:ring-1 focus-within:ring-[#ededed]">

                        {/* Model Selector inside Input Box */}
                        <div className="pt-2 px-3 pb-0" ref={modelDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-all"
                                title="Change Model"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                {currentModel.label}
                                <ChevronDown size={12} className={`transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isModelDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute bottom-full left-0 mb-2 w-56 bg-[#111111] border border-[#333333] rounded-xl overflow-hidden z-20 shadow-xl"
                                    >
                                        {MODELS.map((model) => (
                                            <button
                                                type="button"
                                                key={model.id}
                                                disabled={model.disabled}
                                                onClick={() => {
                                                    if (model.disabled) return;
                                                    onModelChange && onModelChange(model.id);
                                                    setIsModelDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                                                    model.disabled
                                                        ? 'opacity-50 cursor-not-allowed bg-transparent'
                                                        : selectedModel === model.id
                                                            ? 'bg-white text-black'
                                                            : 'text-[#a1a1aa] hover:bg-[#27272a]/70 hover:text-white'
                                                }`}
                                            >
                                                <div className={`w-2 h-2 rounded-full shrink-0 ${
                                                    model.disabled 
                                                        ? 'bg-[#3f3f46]' 
                                                        : selectedModel === model.id ? 'bg-black' : 'bg-slate-600'
                                                }`} />
                                                <div>
                                                    <div className={`font-medium ${model.disabled ? 'text-[#71717a]' : ''}`}>{model.label}</div>
                                                    <div className={`text-xs ${
                                                        model.disabled 
                                                            ? 'text-[#52525b]' 
                                                            : selectedModel === model.id ? 'text-black/70' : 'text-[#71717a]'
                                                    }`}>{model.provider}</div>
                                                    {model.note && (
                                                        <div className={`text-[10px] leading-snug mt-0.5 ${
                                                            model.disabled 
                                                                ? 'text-[#52525b]' 
                                                                : selectedModel === model.id ? 'text-black/60' : 'text-[#71717a]'
                                                        }`}>
                                                            {model.note}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Image Preview Area */}
                        {imagePreview && (
                            <div className="pt-3 px-4 pb-1">
                                <div className="relative inline-block">
                                    <img src={imagePreview} alt="Reference" className="w-20 h-20 object-cover rounded-lg border border-[#333333]" />
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        className="absolute -top-2 -right-2 p-1 bg-[#27272a] hover:bg-slate-600 outline-2 outline-slate-800 outline text-[#a1a1aa] rounded-full transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Enhance Prompt Suggestion Popover */}
                        <AnimatePresence>
                            {suggestedPrompt && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute bottom-full mb-3 left-0 right-0 z-30"
                                >
                                    <div className="bg-[#111111] border border-[#3f3f46] rounded-2xl p-4 shadow-2xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Wand2 size={13} className="text-white shrink-0" />
                                            <span className="text-[10px] font-mono uppercase tracking-widest text-white">Enhanced Prompt</span>
                                        </div>
                                        <p className="text-sm text-[#e4e4e7] leading-relaxed mb-3">{suggestedPrompt}</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleApplySuggestion}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#e5e5e5] text-black text-xs font-medium rounded-lg transition-colors"
                                            >
                                                <Check size={12} /> Apply
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDiscardSuggestion}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222222] hover:bg-[#333333] border border-[#444444] text-[#a1a1aa] text-xs font-medium rounded-lg transition-colors"
                                            >
                                                <X size={12} /> Discard
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-end">
                            {/* Hidden File Input */}
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                className="hidden"
                            />

                            {/* Image Upload Button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isGenerating || !selectedModel.startsWith('gemini')}
                                className="p-3 mb-1.5 ml-1 text-[#a1a1aa] hover:text-white disabled:opacity-50 transition-colors"
                                title={!selectedModel.startsWith('gemini') ? "This model doesn't support images" : "Attach image"}
                            >
                                <Plus size={20} />
                            </button>

                            {/* Text Input */}
                            <textarea
                                ref={textareaRef}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                                placeholder="Ask anything about math, physics, or drawing..."
                                className="flex-1 bg-transparent py-4 px-2 text-[#a1a1aa] placeholder-slate-500 focus:outline-none resize-none h-[60px] max-h-[200px] no-scrollbar"
                                rows="1"
                            />

                            {/* Enhance Button */}
                            {prompt.trim() && (
                                <button
                                    type="button"
                                    onClick={handleEnhance}
                                    disabled={isEnhancing || isGenerating}
                                    className="m-3 p-2 text-[#a1a1aa] hover:text-white hover:bg-[#27272a] border border-transparent hover:border-[#333333] disabled:opacity-40 rounded-xl transition-all"
                                    title="Enhance prompt with AI"
                                >
                                    {isEnhancing
                                        ? <Loader2 size={18} className="animate-spin" />
                                        : <Wand2 size={18} />}
                                </button>
                            )}

                            {/* Send Button */}
                            <button
                                type="submit"
                                disabled={(!prompt.trim() && !selectedImage) || isGenerating || isEnhancing}
                                className="m-3 p-2 bg-white hover:bg-[#e5e5e5] disabled:bg-[#27272a] disabled:text-[#71717a] text-black rounded-xl transition-colors"
                            >
                                <Send size={18} className={(prompt.trim() || selectedImage) && !isGenerating && !isEnhancing ? 'translate-x-0.5 -translate-y-0.5 transition-transform' : ''} />
                            </button>
                        </div>
                    </form>
                    {isModal32BSelected && (
                        <p className="mt-2 px-1 text-xs text-[#a1a1aa] leading-relaxed">
                            Manimatic 32B runs on Modal A100. First request can take 2-5 minutes while the model wakes up.
                        </p>
                    )}
                    {isNewChat && (
                        <p className="text-center text-xs text-[#71717a] mt-4">
                            Manimatic can make mistakes. Verify important animations.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChatInterface;
