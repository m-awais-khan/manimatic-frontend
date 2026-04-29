import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Code2, Layers, AlertTriangle, CheckCircle2, PlaySquare, ChevronRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import VideoPlayer from './VideoPlayer';

const ProcessingBlock = ({ msg, model, onSceneClick }) => {
    const [logs, setLogs] = useState([{ text: 'Initializing engine...', type: 'info', id: 0 }]);
    const [healCount, setHealCount] = useState(0);
    const prevStatusRef = useRef(msg.status);
    const logCounter = useRef(1);

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
            } else if (status === 'failed') {
                addLog(`Fatal Error: ${msg.error_message}`, 'error');
            }
            prevStatusRef.current = status;
        }
    }, [msg.status, healCount, model, msg.error_message]);

    const isProcessing = msg.status !== 'completed' && msg.status !== 'failed';
    const isRendering = msg.status === 'rendering';

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
                    {msg.status === 'completed' && msg.video_path ? (
                        <VideoPlayer mainVideoUrl={msg.video_path} />
                    ) : isRendering ? (
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
                <div className="bg-[#050505] border border-[#222222] rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-[300px] flex flex-col gap-2">
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
                </div>
            </div>

            {/* Footer / Actions */}
            {msg.status === 'completed' && (
                <div className="bg-[#111111] border-t border-[#333333] p-3 flex justify-between items-center px-4">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium uppercase tracking-wider">
                        <CheckCircle2 size={14} />
                        Ready
                    </div>
                    {msg.sceneId && onSceneClick && (
                        <button
                            onClick={() => onSceneClick(msg.sceneId)}
                            className="flex items-center gap-2 text-xs font-medium text-white bg-[#222222] hover:bg-[#333333] px-3 py-1.5 rounded-lg border border-[#444444] transition-colors"
                        >
                            <PlaySquare size={14} />
                            Open in Workspace
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProcessingBlock;
