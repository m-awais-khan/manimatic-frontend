import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor } from 'lucide-react';

const RESOLUTIONS = [
    { label: '480p', value: '480p', desc: 'Low — Fast rendering' },
    { label: '720p', value: '720p', desc: 'Medium — Balanced' },
    { label: '1080p', value: '1080p', desc: 'High — Best quality' },
    { label: '2K', value: '4k', desc: 'Ultra — Slow rendering' },
];

function SettingsModal({ isOpen, onClose, resolution, onResolutionChange }) {
    const [selected, setSelected] = useState(resolution || '720p');

    useEffect(() => {
        setSelected(resolution || '720p');
    }, [resolution, isOpen]);

    const handleSave = () => {
        onResolutionChange(selected);
        onClose();
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
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-[#0a0a0a] border border-[#333333] rounded-2xl  w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#333333]">
                        <h2 className="text-lg font-semibold text-white">Settings</h2>
                        <button onClick={onClose} className="p-2 text-[#a1a1aa] hover:text-white hover:bg-[#111111] rounded-lg transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Resolution Setting */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Monitor size={18} className="text-white" />
                                <h3 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider">Render Resolution</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {RESOLUTIONS.map((res) => (
                                    <button
                                        key={res.value}
                                        onClick={() => setSelected(res.value)}
                                        className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all ${selected === res.value
                                                ? 'bg-white text-black border-[#333333] ring-1 ring-[#ededed]'
                                                : 'bg-[#111111] border-[#333333] hover:bg-[#111111] hover:border-slate-600'
                                            }`}
                                    >
                                        <span className={`text-sm font-bold ${selected === res.value ? 'text-black' : 'text-[#a1a1aa]'}`}>
                                            {res.label}
                                        </span>
                                        <span className={`text-xs mt-0.5 ${selected === res.value ? 'text-[#333333]' : 'text-[#71717a]'}`}>{res.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#333333]">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#111111] rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm font-medium bg-white text-black hover:bg-[#e5e5e5] rounded-xl transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default SettingsModal;
