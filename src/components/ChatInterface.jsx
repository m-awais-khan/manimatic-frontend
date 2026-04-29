import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Menu, PlaySquare, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

function ChatInterface({ currentChat, chatHistory, onGenerate, isGenerating, isSidebarOpen, toggleSidebar, hasCompletedScene, isPreviewOpen, togglePreview, onSceneClick, selectedModel, onModelChange }) {
    const [prompt, setPrompt] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const modelDropdownRef = useRef(null);

    const MODELS = [
        { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Google' },
        { id: 'custom-manim-model', label: 'Custom Manim Model', provider: 'Local/Colab' },
    ];

    const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

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
        if ((prompt.trim() || selectedImage) && !isGenerating) {
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
        <div className="flex-1 flex flex-col h-full bg-black relative">
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

            {/* Model Selector */}
            <div className={`absolute top-4 z-10 ${!isSidebarOpen ? 'left-16' : 'left-4'}`} ref={modelDropdownRef}>
                <button
                    onClick={() => isNewChat && setIsModelDropdownOpen(!isModelDropdownOpen)}
                    disabled={!isNewChat}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border   ${isNewChat
                        ? 'bg-[#111111] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white border-[#333333] cursor-pointer'
                        : 'bg-[#111111] text-[#71717a] border-[#333333] cursor-not-allowed'
                        }`}
                    title={isNewChat ? 'Select Model' : 'Model cannot be changed after chat starts'}
                >
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    {currentModel.label}
                    {isNewChat && <ChevronDown size={14} className={`transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />}
                </button>

                <AnimatePresence>
                    {isModelDropdownOpen && isNewChat && (
                        <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-1 w-56 bg-[#111111] border border-[#333333] rounded-xl  overflow-hidden z-20"
                        >
                            {MODELS.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        onModelChange && onModelChange(model.id);
                                        setIsModelDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${selectedModel === model.id
                                        ? 'bg-white text-black/15 text-white'
                                        : 'text-[#a1a1aa] hover:bg-[#27272a]/70 hover:text-white'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${selectedModel === model.id ? 'bg-white text-black' : 'bg-slate-600'}`} />
                                    <div>
                                        <div className="font-medium">{model.label}</div>
                                        <div className="text-xs text-[#71717a]">{model.provider}</div>
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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
                                <div className="p-4 bg-[#222222] text-[#ededed] rounded-2xl border border-[#333333]  ">
                                    <Logo size={40} />
                                </div>
                                <h1 className="text-2xl font-semibold text-white">How can I help you animate?</h1>
                            </div>    <p className="text-[#a1a1aa]">Describe what you want to see, and I'll generate the Manim code.</p>
                        </motion.div>
                    ) : (
                        <div className="max-w-3xl mx-auto space-y-6">
                            {chatHistory.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="p-1.5 bg-white text-black rounded-lg shrink-0 border border-[#333333] shadow-md">
                                            <Logo size={18} />
                                        </div>
                                    )}
                                    <div
                                        className={`px-4 py-3 rounded-2xl max-w-[80%] ${msg.role === 'user'
                                            ? 'bg-white text-black rounded-br-sm'
                                            : 'bg-[#111111] text-[#a1a1aa] border border-[#333333] rounded-bl-sm'
                                            } ${msg.role === 'assistant' && msg.status === 'completed' ? 'cursor-pointer hover:ring-1 hover:ring-[#ededed] transition-shadow' : ''}`}
                                        onClick={() => {
                                            if (msg.role === 'assistant' && msg.status === 'completed' && msg.sceneId && onSceneClick) {
                                                onSceneClick(msg.sceneId);
                                            }
                                        }}
                                    >
                                        {msg.image && (
                                            <div className="mb-2 -mx-1 -mt-1">
                                                <img
                                                    src={msg.image}
                                                    alt="Attached"
                                                    className="rounded-xl max-h-48 w-auto object-cover border border-white/10"
                                                />
                                            </div>
                                        )}
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                        {msg.status && (
                                            <div className="mt-2 text-xs opacity-70 flex items-center gap-2">
                                                {msg.status === 'pending' || msg.status === 'generating_code' || msg.status === 'rendering' ? (
                                                    <span className="flex items-center gap-2"><div className="w-2 h-2 bg-white text-black rounded-full animate-pulse" /> {msg.status.replace('_', ' ')}...</span>
                                                ) : msg.status === 'completed' ? (
                                                    <span className="text-emerald-400">Generation Complete</span>
                                                ) : (
                                                    <span className="text-rose-400">Error: {msg.error_message || 'Unknown error'}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className={`p-4 ${isNewChat ? 'absolute bottom-8 left-0 right-0 max-w-3xl mx-auto' : 'border-t border-[#333333] bg-black '}`}>
                <div className={isNewChat ? '' : 'max-w-3xl mx-auto'}>
                    <form onSubmit={handleSubmit} className="relative bg-[#111111] rounded-2xl border border-[#333333]  transition-shadow transition-colors focus-within:border-[#333333] focus-within:ring-1 focus-within:ring-[#ededed]">
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

                        <div className="flex items-end">
                            {/* Hidden File Input */}
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                className="hidden"
                            />

                            {/* Image Upload Button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isGenerating}
                                className="p-3 mb-1.5 ml-1 text-[#a1a1aa] hover:text-white disabled:opacity-50 transition-colors"
                                title="Attach screenshot"
                            >
                                <ImageIcon size={20} />
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

                            {/* Send Button */}
                            <button
                                type="submit"
                                disabled={(!prompt.trim() && !selectedImage) || isGenerating}
                                className="m-3 p-2 bg-white hover:bg-[#e5e5e5] disabled:bg-[#27272a] disabled:text-[#71717a] text-black rounded-xl transition-colors"
                            >
                                <Send size={18} className={(prompt.trim() || selectedImage) && !isGenerating ? 'translate-x-0.5 -translate-y-0.5 transition-transform' : ''} />
                            </button>
                        </div>
                    </form>
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
