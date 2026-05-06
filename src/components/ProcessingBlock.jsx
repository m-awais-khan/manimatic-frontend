import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Code2, Layers, AlertTriangle, CheckCircle2, PlaySquare, ChevronRight, X } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import VideoPlayer from './VideoPlayer';

const ProcessingBlock = ({ msg, model, onSceneClick, isPreviewOpen }) => {
    const [activeTab, setActiveTab] = useState('logs');

    // Seed initial logs based on what the server says the status is when first mounted.
    // This means if we switch back to a chat mid-render, we see a useful state, not a blank "Initializing".
    const getInitialLogs = (status) => {
        if (status === 'rendering') {
            return [
                { text: 'Initializing engine...', type: 'info', id: 0 },
                { text: `Generating Manim code with ${model}...`, type: 'info', id: 1 },
                { text: 'Code generation successful.', type: 'success', id: 2 },
                { text: 'Compiling Manim animation engine...', type: 'info', id: 3 },
                { text: 'Rendering video frames (This may take a minute)...', type: 'info', id: 4 },
            ];
        } else if (status === 'generating_code') {
            if (msg.code) {
                // If code exists, we are in the self-healing retry loop!
                return [
                    { text: 'Initializing engine...', type: 'info', id: 0 },
                    { text: `Generating Manim code with ${model}...`, type: 'info', id: 1 },
                    { text: 'Code generation successful.', type: 'success', id: 2 },
                    { text: 'Compiling Manim animation engine...', type: 'info', id: 3 },
                    { text: 'Rendering video frames (This may take a minute)...', type: 'info', id: 4 },
                    { text: '⚠️ Execution failed! Syntax or Runtime error detected.', type: 'error', id: 5 },
                    { text: `Initiating Self-Healing Agent Loop...`, type: 'warning', id: 6 },
                    { text: `Analyzing error and regenerating code with ${model}...`, type: 'info', id: 7 },
                ];
            } else {
                return [
                    { text: 'Initializing engine...', type: 'info', id: 0 },
                    { text: `Generating Manim code with ${model}...`, type: 'info', id: 1 },
                ];
            }
        } else if (status === 'error') {
            return [
                { text: 'Initializing engine...', type: 'info', id: 0 },
                { text: 'An error occurred during generation.', type: 'error', id: 1 },
                { text: msg.error_message || 'Generation failed after multiple attempts.', type: 'error', id: 2 },
            ];
        }
        return [{ text: 'Initializing engine...', type: 'info', id: 0 }];
    };

    const [logs, setLogs] = useState(() => getInitialLogs(msg.status));
    const [healCount, setHealCount] = useState(0);
    const prevStatusRef = useRef(msg.status);
    const logCounter = useRef(10); // Start high to avoid id collisions with seeded logs

    const addLog = (text, type) => {
        setLogs(prev => [...prev, { text, type, id: logCounter.current++ }]);
    };

    useEffect(() => {
        const prev = prevStatusRef.current;
        const status = msg.status;

        if (prev !== status) {
            if (status === 'pending') {
                addLog('Added to generation queue...', 'info');
            } else if (status === 'generating_code') {
                if (prev === 'rendering') {
                    // We came back from rendering! This means it failed and is self-healing.
                    setHealCount(c => c + 1);
                    addLog('⚠️ Execution failed! Syntax or Runtime error detected.', 'error');
                    addLog(`Initiating Self-Healing Agent Loop (Attempt ${healCount + 1})...`, 'warning');
                    addLog(`Analyzing error and regenerating code with ${model}...`, 'info');
                } else {
                    addLog(`Generating Manim code with ${model}...`, 'info');
                }
            } else if (status === 'rendering') {
                addLog('Code generation successful.', 'success');
                addLog('Compiling Manim animation engine...', 'info');
                addLog('Rendering video frames (This may take a minute)...', 'info');
            } else if (status === 'completed') {
                addLog('Render complete! Video compiled successfully.', 'success');
            } else if (status === 'error' || status === 'failed') {
                addLog(`Fatal Error: ${msg.error_message || 'Generation failed.'}`, 'error');
            }
            prevStatusRef.current = status;
        }
    }, [msg.status, healCount, model, msg.error_message]);

    const isProcessing = msg.status !== 'completed' && msg.status !== 'error' && msg.status !== 'failed';
    const isRendering = msg.status === 'rendering';

    if (msg.status === 'completed') {
        return (
            <div className="w-full bg-[#0a0a0a] border border-[#333333] rounded-2xl overflow-hidden shadow-sm my-6 p-4">
                <div className="flex flex-col md:flex-row gap-6 h-48">
                    {/* Small Video Preview */}
                    <div className="w-full md:w-[280px] h-full flex-shrink-0">
                         {msg.video_path ? <VideoPlayer mainVideoUrl={msg.video_path} minimal={true} /> : <div className="flex items-center justify-center h-full bg-black rounded-xl border border-[#222222] text-[#444444]"><AlertTriangle size={24} /></div>}
                    </div>

                    {/* Code Snippet & Button */}
                    <div className="flex-1 flex flex-col justify-between overflow-hidden">
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="flex items-center gap-2 mb-2 shrink-0">
                                <Code2 size={14} className="text-emerald-400" />
                                <span className="text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">Generated Code</span>
                            </div>
                            <div className="bg-black border border-[#222222] rounded-xl overflow-y-auto flex-1 text-xs relative">
                                <div className="absolute inset-0">
                                    <SyntaxHighlighter language="python" style={vscDarkPlus} customStyle={{ margin: 0, padding: '12px', background: 'transparent' }} className="no-scrollbar">
                                        {msg.code || '# Code not available'}
                                    </SyntaxHighlighter>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-3 shrink-0">
                             <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium uppercase tracking-wider">
                                <CheckCircle2 size={14} />
                                Ready
                            </div>
                            {msg.sceneId && onSceneClick && (
                                <button
                                    onClick={() => onSceneClick(msg.sceneId)}
                                    className={`flex items-center gap-1.5 text-[10px] font-medium text-white px-2.5 py-1 rounded-md border transition-colors shadow-sm whitespace-nowrap ${
                                        isPreviewOpen 
                                            ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-200'
                                            : 'bg-[#222222] hover:bg-[#333333] border-[#444444]'
                                    }`}
                                >
                                    {isPreviewOpen ? <X size={12} /> : <PlaySquare size={12} />}
                                    {isPreviewOpen ? 'Close Workspace' : 'Open in Workspace'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-[#0a0a0a] border border-[#333333] rounded-2xl overflow-hidden shadow-2xl my-6">
            
            {/* Terminal Header */}
            <div className="bg-[#111111] border-b border-[#333333] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal size={16} className="text-[#71717a]" />
                    <span className="text-xs font-mono text-[#a1a1aa] tracking-wider uppercase">Manimatic Engine</span>
                </div>
                {isProcessing && (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-medium text-emerald-400 uppercase tracking-widest text-[10px]">Processing</span>
                    </div>
                )}
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Visualizer / Video Area */}
                <div className="bg-black border border-[#222222] rounded-xl overflow-hidden relative aspect-video flex items-center justify-center">
                    {isRendering ? (
                        <div className="w-full h-full relative">
                            <video 
                                src="/manimatic_logo_animation.mp4" 
                                autoPlay loop muted playsInline 
                                className="w-full h-full object-cover opacity-30 mix-blend-screen"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                <Layers size={32} className="text-[#ededed] mb-4 animate-bounce" />
                                <div className="text-lg font-bold text-white tracking-widest uppercase">Rendering</div>
                                <div className="text-xs text-[#a1a1aa] mt-2 font-mono">Compiling frames...</div>
                            </div>
                        </div>
                    ) : isProcessing ? (
                        <div className="w-full h-full relative flex flex-col items-center justify-center">
                            <Code2 size={32} className="text-[#444444] mb-4 animate-pulse" />
                            <div className="text-sm font-medium text-[#71717a] tracking-widest uppercase font-mono">
                                {msg.status === 'generating_code' ? 'Writing Code...' : 'Pending...'}
                            </div>
                            {healCount > 0 && (
                                <div className="mt-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2">
                                    <AlertTriangle size={12} className="text-amber-500" />
                                    <span className="text-[10px] text-amber-500 font-mono">Self-Healing Active</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-[#444444]">
                            <AlertTriangle size={32} />
                        </div>
                    )}
                </div>

                {/* Terminal Logs Area */}
                <div className="bg-[#050505] border border-[#222222] rounded-xl overflow-hidden max-h-[300px] flex flex-col">
                    {/* Terminal Tabs */}
                    <div className="flex border-b border-[#222222] bg-[#0a0a0a] shrink-0 overflow-x-auto no-scrollbar">
                        <button 
                            onClick={() => setActiveTab('logs')} 
                            className={`px-4 py-2 text-[10px] font-mono tracking-widest uppercase transition-colors whitespace-nowrap ${activeTab === 'logs' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-[#111111]' : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#111111]'}`}
                        >
                            Status
                        </button>
                        {msg.code && (
                            <button 
                                onClick={() => setActiveTab('code')} 
                                className={`px-4 py-2 text-[10px] font-mono tracking-widest uppercase transition-colors whitespace-nowrap ${activeTab === 'code' ? 'text-blue-400 border-b-2 border-blue-400 bg-[#111111]' : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#111111]'}`}
                            >
                                Source Code
                            </button>
                        )}
                        {msg.error_message && (
                            <button 
                                onClick={() => setActiveTab('error')} 
                                className={`px-4 py-2 text-[10px] font-mono tracking-widest uppercase transition-colors whitespace-nowrap ${activeTab === 'error' ? 'text-rose-400 border-b-2 border-rose-400 bg-[#111111]' : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#111111]'}`}
                            >
                                Compiler Trace
                            </button>
                        )}
                    </div>

                    {/* Terminal Content */}
                    <div className="p-4 font-mono text-xs overflow-y-auto flex-1 flex flex-col gap-2 relative">
                        {activeTab === 'logs' && (
                            <>
                                <AnimatePresence initial={false}>
                                    {logs.map((log) => (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex items-start gap-2 ${
                                                log.type === 'error' ? 'text-rose-400' :
                                                log.type === 'warning' ? 'text-amber-400' :
                                                log.type === 'success' ? 'text-emerald-400' :
                                                'text-[#a1a1aa]'
                                            }`}
                                        >
                                            <ChevronRight size={14} className="shrink-0 mt-0.5 opacity-50" />
                                            <span className="leading-relaxed">{log.text}</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {isProcessing && (
                                    <motion.div 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: [0, 1, 0] }} 
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="w-2 h-4 bg-[#a1a1aa] ml-6 mt-1"
                                    />
                                )}
                            </>
                        )}

                        {activeTab === 'code' && (
                            <div className="w-full text-[10px] leading-snug">
                                <SyntaxHighlighter language="python" style={vscDarkPlus} customStyle={{ margin: 0, padding: 0, background: 'transparent' }} className="no-scrollbar">
                                    {msg.code}
                                </SyntaxHighlighter>
                            </div>
                        )}

                        {activeTab === 'error' && (
                            <div className="w-full text-[10px] leading-relaxed text-rose-400 whitespace-pre-wrap">
                                {msg.error_message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcessingBlock;
