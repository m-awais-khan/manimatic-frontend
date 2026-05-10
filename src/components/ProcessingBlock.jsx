import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Code2, Layers, AlertTriangle, CheckCircle2, PlaySquare, ChevronRight, X } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import VideoPlayer from './VideoPlayer';
import Logo from './Logo';

const ShatterShard = ({ index }) => {
    const x = (index % 4) * 25;
    const y = Math.floor(index / 4) * 25;
    const randomX = (Math.random() - 0.5) * 800;
    const randomY = (Math.random() - 0.7) * 800;
    const randomRotate = (Math.random() - 0.5) * 720;
    
    return (
        <motion.div
            initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
            animate={{ opacity: 0, x: randomX, y: randomY, rotate: randomRotate, scale: 0.5 }}
            transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute bg-[#111111] border border-[#333333]/30"
            style={{ width: '25%', height: '25%', left: `${x}%`, top: `${y}%`, zIndex: 50, pointerEvents: 'none' }}
        />
    );
};

const ProcessingBlock = ({ msg, model, onSceneClick, isPreviewOpen }) => {
    const [activeTab, setActiveTab] = useState('logs');
    const [isShattering, setIsShattering] = useState(false);
    const [showChatBubble, setShowChatBubble] = useState(false);

    // Deriving logs from manifest history ensures they are persistent and 'stateless'
    const derivedLogs = useMemo(() => {
        const list = [{ text: 'Initializing engine...', type: 'info', id: 'init' }];
        if (msg.status === 'pending') return list;

        list.push({ text: `Generating Manim code with ${model}...`, type: 'info', id: 'gen-init' });
        
        // If we have never successfully generated code (even once), stop here
        if (msg.status === 'generating_code' && !msg.code) return list;

        // If we reach here, at least Attempt 1 code generation was successful
        list.push({ text: 'Code generation successful.', type: 'success', id: 'succ-init' });
        
        // Now we show Attempt 1's rendering logs ONLY IF we haven't failed yet 
        // OR if we failed AFTER starting to render
        const history = msg.manifest?.history || [];
        const attempt1Failed = history.some(h => h.attempt === 1);
        
        if (!attempt1Failed || msg.status === 'rendering' || msg.status === 'completed') {
            list.push({ text: 'Compiling Manim animation engine...', type: 'info', id: 'comp-init' });
            list.push({ text: 'Rendering video frames...', type: 'info', id: 'rend-init' });
        }

        // Process failures from history chronologically
        history.forEach((fail, i) => {
            list.push({ text: `⚠️ Execution failed! Attempt ${fail.attempt} failed.`, type: 'error', id: `err-${i}` });
            list.push({ text: `Trace: ${fail.error}`, type: 'error', id: `trace-${i}` });
            list.push({ text: `Initiating Self-Healing Agent Loop (Attempt ${fail.attempt + 1})...`, type: 'warning', id: `heal-${i}` });
            list.push({ text: `Analyzing error and regenerating code...`, type: 'info', id: `fix-${i}` });
            
            // If the scene is currently in rendering or later for a NEW attempt, show the success logs
            if (msg.status === 'rendering' || msg.status === 'completed' || (msg.manifest?.attempt > fail.attempt + 1)) {
                list.push({ text: 'Code generation successful.', type: 'success', id: `succ-${i}` });
                list.push({ text: 'Compiling Manim animation engine...', type: 'info', id: `comp-after-${i}` });
                list.push({ text: 'Rendering video frames...', type: 'info', id: `rend-after-${i}` });
            }
        });

        if (msg.status === 'completed') {
            list.push({ text: 'Render complete! Video compiled successfully.', type: 'success', id: 'final' });
        } else if (msg.status === 'error') {
            list.push({ text: `Fatal Error: ${msg.error_message || 'Generation failed.'}`, type: 'error', id: 'final-err' });
        }

        return list;
    }, [msg.status, msg.manifest, msg.code, msg.error_message, model]);

    useEffect(() => {
        const isChatOnly = msg.status === 'completed' && !msg.code && !msg.video_path;
        if (isChatOnly && !showChatBubble && !isShattering) {
            setIsShattering(true);
            setTimeout(() => {
                setShowChatBubble(true);
                setIsShattering(false);
            }, 1000);
        }
    }, [msg.status, msg.code, msg.video_path, showChatBubble, isShattering]);

    const isProcessing = msg.status !== 'completed' && msg.status !== 'error' && msg.status !== 'failed';
    const isRendering = msg.status === 'rendering';
    const isRepairing = (msg.status === 'generating_code' && msg.code) || msg.manifest?.repairing;

    if (showChatBubble) {
        return (
            <div className="w-full flex justify-start my-6">
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="max-w-2xl bg-[#111111] border border-[#222222] rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Logo size={18} />
                        <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-widest">Manimatic</span>
                    </div>
                    <p className="text-base text-[#d4d4d8] leading-relaxed">{msg.text_response}</p>
                </motion.div>
            </div>
        );
    }

    if (msg.status === 'completed' && msg.code) {
        return (
            <div className="w-full bg-[#0a0a0a] border border-[#333333] rounded-2xl overflow-hidden shadow-sm my-6 p-4">
                <div className="flex flex-col md:flex-row gap-6 h-48">
                    <div className="w-full md:w-[280px] h-full flex-shrink-0">
                         {msg.video_path ? <VideoPlayer mainVideoUrl={msg.video_path} minimal={true} /> : <div className="flex items-center justify-center h-full bg-black rounded-xl border border-[#222222] text-[#444444]"><AlertTriangle size={24} /></div>}
                    </div>
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
                                <CheckCircle2 size={14} /> Ready
                            </div>
                            {msg.sceneId && onSceneClick && (
                                <button onClick={() => onSceneClick(msg.sceneId)} className={`flex items-center gap-1.5 text-[10px] font-medium text-white px-2.5 py-1 rounded-md border transition-colors shadow-sm whitespace-nowrap ${isPreviewOpen ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-[#222222] border-[#444444]'}`}>
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
        <div className="w-full relative min-h-[100px]">
            {isShattering && (
                <div className="absolute inset-0 z-50 pointer-events-none">
                    {Array.from({ length: 16 }).map((_, i) => (
                        <ShatterShard key={i} index={i} />
                    ))}
                </div>
            )}
            <motion.div animate={isShattering ? { opacity: 0, scale: 1.1, filter: 'blur(10px)', transition: { duration: 0.4 } } : { opacity: 1, scale: 1, filter: 'blur(0px)' }} className="w-full bg-[#0a0a0a] border border-[#333333] rounded-2xl overflow-hidden shadow-2xl my-6">
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
                    <div className="bg-black border border-[#222222] rounded-xl overflow-hidden relative aspect-video flex items-center justify-center">
                        {isRendering ? (
                            <div className="w-full h-full relative">
                                <video src="/manimatic_logo_animation.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover opacity-30 mix-blend-screen" />
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
                                {isRepairing && (
                                    <div className="mt-4 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2 animate-bounce shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                                        <AlertTriangle size={12} className="text-amber-500" />
                                        <span className="text-[10px] text-amber-500 font-mono uppercase tracking-tighter font-bold">Self-Healing Active</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-[#444444]"><AlertTriangle size={32} /></div>
                        )}
                    </div>
                    <div className="bg-[#050505] border border-[#222222] rounded-xl overflow-hidden max-h-[300px] flex flex-col">
                        <div className="flex border-b border-[#222222] bg-[#0a0a0a] shrink-0 overflow-x-auto no-scrollbar">
                            <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 text-[10px] font-mono tracking-widest uppercase transition-colors whitespace-nowrap ${activeTab === 'logs' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-[#111111]' : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#111111]'}`}>Status</button>
                            {msg.code && <button onClick={() => setActiveTab('code')} className={`px-4 py-2 text-[10px] font-mono tracking-widest uppercase transition-colors whitespace-nowrap ${activeTab === 'code' ? 'text-blue-400 border-b-2 border-blue-400 bg-[#111111]' : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#111111]'}`}>Source Code</button>}
                            {msg.error_message && <button onClick={() => setActiveTab('error')} className={`px-4 py-2 text-[10px] font-mono tracking-widest uppercase transition-colors whitespace-nowrap ${activeTab === 'error' ? 'text-rose-400 border-b-2 border-rose-400 bg-[#111111]' : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#111111]'}`}>Compiler Trace</button>}
                        </div>
                        <div className="p-4 font-mono text-xs overflow-y-auto flex-1 flex flex-col gap-2 relative">
                            {activeTab === 'logs' && (
                                <>
                                    <AnimatePresence initial={false}>
                                        {derivedLogs.map((log) => (
                                            <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex items-start gap-2 ${log.type === 'error' ? 'text-rose-400' : log.type === 'warning' ? 'text-amber-400' : log.type === 'success' ? 'text-emerald-400' : 'text-[#a1a1aa]'}`}>
                                                <ChevronRight size={14} className="shrink-0 mt-0.5 opacity-50" />
                                                <span className="leading-relaxed">{log.text}</span>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {isProcessing && <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-4 bg-[#a1a1aa] ml-6 mt-1" />}
                                </>
                            )}
                            {activeTab === 'code' && <div className="w-full text-[10px] leading-snug"><SyntaxHighlighter language="python" style={vscDarkPlus} customStyle={{ margin: 0, padding: 0, background: 'transparent' }} className="no-scrollbar">{msg.code}</SyntaxHighlighter></div>}
                            {activeTab === 'error' && <div className="w-full text-[10px] leading-relaxed text-rose-400 whitespace-pre-wrap">{msg.error_message}</div>}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProcessingBlock;
