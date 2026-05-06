import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, Shield, Loader2 } from 'lucide-react';
import { fetchTrainingConsent, updateTrainingConsent } from '../api/client';

const RESOLUTIONS = [
    { label: '480p', value: '480p', desc: 'Low — Fast rendering' },
    { label: '720p', value: '720p', desc: 'Medium — Balanced' },
    { label: '1080p', value: '1080p', desc: 'High — Best quality' },
    { label: '2K', value: '4k', desc: 'Ultra — Slow rendering' },
];

/* ─── Animated Toggle ─────────────────────────────────── */
function Toggle({ checked, onChange, disabled }) {
    return (
        <button
            id="training-consent-toggle"
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${checked ? 'bg-white' : 'bg-[#333333]'}`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${
                    checked ? 'translate-x-5 bg-black' : 'translate-x-0 bg-[#71717a]'
                }`}
            />
        </button>
    );
}

/* ─── Main Modal ──────────────────────────────────────── */
function SettingsModal({ isOpen, onClose, resolution, onResolutionChange }) {
    const [selected, setSelected] = useState(resolution || '720p');

    // Training consent state
    const [consented, setConsented] = useState(true); // default ON
    const [consentLoading, setConsentLoading] = useState(false);
    const [consentError, setConsentError] = useState(null);

    // Sync resolution whenever modal opens or prop changes
    useEffect(() => {
        setSelected(resolution || '720p');
    }, [resolution, isOpen]);

    // Fetch real consent state from backend every time the modal opens
    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;

        const load = async () => {
            try {
                const data = await fetchTrainingConsent();
                if (!cancelled) {
                    setConsented(data.consented);
                    setConsentError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Could not fetch training consent:', err);
                    setConsentError('Could not load preference.');
                }
            }
        };

        load();
        return () => { cancelled = true; };
    }, [isOpen]);

    const handleConsentToggle = useCallback(async (newValue) => {
        const previous = consented;
        setConsented(newValue);          // optimistic update
        setConsentLoading(true);
        setConsentError(null);

        try {
            await updateTrainingConsent(newValue);
        } catch (err) {
            console.error('Failed to update training consent:', err);
            setConsented(previous);      // roll back on failure
            setConsentError('Failed to save. Please try again.');
        } finally {
            setConsentLoading(false);
        }
    }, [consented]);

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
                className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-[#0a0a0a] border border-[#333333] rounded-2xl w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#333333]">
                        <h2 className="text-lg font-semibold text-white">Settings</h2>
                        <button
                            id="settings-close-btn"
                            onClick={onClose}
                            className="p-2 text-[#a1a1aa] hover:text-white hover:bg-[#111111] rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-8">

                        {/* Resolution Setting */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Monitor size={18} className="text-white" />
                                <h3 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider">
                                    Render Resolution
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {RESOLUTIONS.map((res) => (
                                    <button
                                        key={res.value}
                                        id={`resolution-${res.value}`}
                                        onClick={() => setSelected(res.value)}
                                        className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all ${
                                            selected === res.value
                                                ? 'bg-white text-black border-[#333333] ring-1 ring-[#ededed]'
                                                : 'bg-[#111111] border-[#333333] hover:bg-[#111111] hover:border-slate-600'
                                        }`}
                                    >
                                        <span className={`text-sm font-bold ${selected === res.value ? 'text-black' : 'text-[#a1a1aa]'}`}>
                                            {res.label}
                                        </span>
                                        <span className={`text-xs mt-0.5 ${selected === res.value ? 'text-[#333333]' : 'text-[#71717a]'}`}>
                                            {res.desc}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-[#222222]" />

                        {/* Privacy / Training Consent */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Shield size={18} className="text-white" />
                                <h3 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider">
                                    Privacy
                                </h3>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white leading-snug">
                                        Use my data to improve Manimatic AI
                                    </p>
                                    <p className="text-xs text-[#71717a] mt-1 leading-relaxed">
                                        Allow Manimatic to use your prompts and animations to
                                        train and improve our custom AI model. You can opt out
                                        at any time.
                                    </p>
                                    {consentError && (
                                        <p className="text-xs text-red-400 mt-2">{consentError}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                                    {consentLoading && (
                                        <Loader2
                                            size={14}
                                            className="text-[#a1a1aa] animate-spin"
                                        />
                                    )}
                                    <Toggle
                                        checked={consented}
                                        onChange={handleConsentToggle}
                                        disabled={consentLoading}
                                    />
                                </div>
                            </div>

                            {/* Status pill */}
                            <div className="mt-3">
                                <span
                                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                                        consented
                                            ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50'
                                            : 'bg-[#1a1a1a] text-[#71717a] border border-[#2a2a2a]'
                                    }`}
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                            consented ? 'bg-emerald-400' : 'bg-[#71717a]'
                                        }`}
                                    />
                                    {consented ? 'Data sharing enabled' : 'Opted out — data not used for training'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#333333]">
                        <button
                            id="settings-cancel-btn"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#111111] rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            id="settings-save-btn"
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
