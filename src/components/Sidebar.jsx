import React, { useState, useRef, useEffect } from 'react';
import { MessageSquarePlus, MessageSquare, Menu, Settings, Trash2, AlertTriangle, Scissors, Play, ChevronDown, ChevronRight, LogOut, DatabaseZap, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

function Sidebar({ isOpen, toggleSidebar, chats, currentChat, setCurrentChat, startNewChat, onDeleteChat, onOpenStitcher, stitchedVideos, onPlayStitched, onDeleteStitched, onOpenSettings, userProfile, onSignOut, onWipeData, onDeleteAccount }) {
    const [chatToDelete, setChatToDelete] = useState(null);
    const [stitchedToDelete, setStitchedToDelete] = useState(null);
    const [showStitched, setShowStitched] = useState(true);
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const accountMenuRef = useRef(null);

    // Close account menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
                setShowAccountMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const confirmDelete = () => {
        if (chatToDelete) {
            onDeleteChat(chatToDelete.id);
            setChatToDelete(null);
        }
    };

    const confirmDeleteStitched = () => {
        if (stitchedToDelete) {
            onDeleteStitched && onDeleteStitched(stitchedToDelete.id);
            setStitchedToDelete(null);
        }
    };

    const hasEnoughChats = chats.length >= 2;

    return (
        <>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 260, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="h-full bg-[#0a0a0a] border-r border-[#333333] flex flex-col pt-4 overflow-hidden shrink-0"
                    >
                        {/* Header */}
                        <div className="flex flex-col gap-3 px-4 mb-4">
                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2.5">
                                    <Logo size={28} />
                                    <span className="font-semibold text-xl tracking-wide text-white">Manimatic</span>
                                </div>
                                <button
                                    onClick={toggleSidebar}
                                    className="p-1.5 hover:bg-[#111111] rounded-lg text-[#a1a1aa] hover:text-white transition-colors"
                                >
                                    <Menu size={20} />
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={startNewChat}
                                    className="flex-1 justify-center flex items-center gap-2 px-3 py-2.5 bg-white text-black hover:bg-[#e5e5e5] rounded-xl text-sm font-medium transition-colors   border border-[#333333]"
                                >
                                    <MessageSquarePlus size={16} />
                                    New Chat
                                </button>
                                <button
                                    onClick={onOpenStitcher}
                                    disabled={!hasEnoughChats}
                                    className="justify-center flex items-center gap-1.5 px-3 py-2.5 bg-white text-black hover:bg-[#e5e5e5] disabled:bg-[#27272a] disabled:text-[#71717a] rounded-xl text-sm font-medium transition-colors border border-[#333333] disabled:border-[#333333]"
                                    title={hasEnoughChats ? "Stitch Videos" : "Need at least 2 chats"}
                                >
                                    <Scissors size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-3 space-y-1">
                            {/* Chat History */}
                            <h3 className="text-xs font-semibold text-[#71717a] uppercase tracking-wider mb-2 mt-2 px-2">History</h3>
                            {chats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${currentChat === chat.id
                                        ? 'bg-[#111111] text-white'
                                        : 'text-[#a1a1aa] hover:bg-[#111111] hover:text-white'
                                        }`}
                                >
                                    <button
                                        onClick={() => setCurrentChat(chat.id)}
                                        className="flex items-center gap-3 flex-1 truncate text-left"
                                    >
                                        <MessageSquare size={16} className="shrink-0" />
                                        <span className="truncate">{chat.title}</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setChatToDelete(chat);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-[#a1a1aa] hover:text-rose-400 hover:bg-[#27272a]/50 rounded-md transition-all shrink-0"
                                        title="Delete Chat"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}

                            {/* Stitched Videos Section */}
                            {stitchedVideos && stitchedVideos.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-[#333333]">
                                    <button
                                        onClick={() => setShowStitched(!showStitched)}
                                        className="w-full flex items-center gap-2 px-2 mb-2"
                                    >
                                        {showStitched ? <ChevronDown size={14} className="text-[#71717a]" /> : <ChevronRight size={14} className="text-[#71717a]" />}
                                        <h3 className="text-xs font-semibold text-[#71717a] uppercase tracking-wider">Stitched</h3>
                                    </button>
                                    <AnimatePresence>
                                        {showStitched && stitchedVideos.map(sv => (
                                            <motion.div
                                                key={sv.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-[#a1a1aa] hover:bg-[#111111] hover:text-white transition-colors"
                                            >
                                                <button
                                                    onClick={() => onPlayStitched && onPlayStitched(sv)}
                                                    className="flex items-center gap-3 flex-1 truncate text-left"
                                                >
                                                    <Scissors size={14} className="text-white shrink-0" />
                                                    <span className="truncate">{sv.title}</span>
                                                </button>
                                                {sv.status === 'processing' && (
                                                    <span className="text-xs text-white animate-pulse shrink-0">Processing...</span>
                                                )}
                                                {sv.status === 'completed' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setStitchedToDelete(sv);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-[#a1a1aa] hover:text-rose-400 hover:bg-[#27272a]/50 rounded-md transition-all shrink-0"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[#333333] space-y-1">
                            {/* User Profile Button */}
                            <div className="relative" ref={accountMenuRef}>
                                <button
                                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-[#a1a1aa] hover:bg-[#111111] hover:text-white rounded-lg transition-colors text-sm"
                                >
                                    {userProfile?.profile_picture ? (
                                        <img src={userProfile.profile_picture} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover border border-slate-600 shrink-0" />
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {(userProfile?.display_name || 'U')[0]}
                                        </div>
                                    )}
                                    <span className="truncate font-medium">{userProfile?.display_name || 'Account'}</span>
                                </button>

                                {/* Account Dropdown */}
                                <AnimatePresence>
                                    {showAccountMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute bottom-full left-0 right-0 mb-1 bg-[#111111] border border-[#333333] rounded-xl  overflow-hidden z-30"
                                        >
                                            <div className="p-2 border-b border-[#333333]">
                                                <p className="text-xs text-[#71717a] px-2 truncate">{userProfile?.email}</p>
                                            </div>
                                            <div className="p-1">
                                                <button
                                                    onClick={() => { setShowAccountMenu(false); onSignOut && onSignOut(); }}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#a1a1aa] hover:bg-[#27272a]/70 hover:text-white rounded-lg transition-colors"
                                                >
                                                    <LogOut size={15} /> Sign Out
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('This will permanently delete ALL your chats, videos, and stitched videos. Continue?')) {
                                                            setShowAccountMenu(false);
                                                            onWipeData && onWipeData();
                                                        }
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-amber-400 hover:bg-[#27272a]/70 rounded-lg transition-colors"
                                                >
                                                    <DatabaseZap size={15} /> Wipe All Data
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('This will permanently delete your account and ALL data. This cannot be undone!')) {
                                                            setShowAccountMenu(false);
                                                            onDeleteAccount && onDeleteAccount();
                                                        }
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-[#27272a]/70 rounded-lg transition-colors"
                                                >
                                                    <UserX size={15} /> Delete Account
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button
                                onClick={onOpenSettings}
                                className="w-full flex items-center gap-3 px-3 py-2 text-[#a1a1aa] hover:bg-[#111111] hover:text-white rounded-lg transition-colors text-sm"
                            >
                                <Settings size={18} />
                                <span>Settings</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {chatToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black  px-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0a0a0a] border border-[#333333] p-6 rounded-2xl  max-w-sm w-full"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-red-500/10 text-rose-500 rounded-full shrink-0">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Delete Chat?</h3>
                                    <p className="text-sm text-[#a1a1aa] mt-1 line-clamp-2">
                                        "{chatToDelete.title}" will be permanently removed.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    onClick={() => setChatToDelete(null)}
                                    className="px-4 py-2 text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#111111] rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors  shadow-rose-600/20"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stitched Delete Confirmation Modal */}
            <AnimatePresence>
                {stitchedToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black  px-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0a0a0a] border border-[#333333] p-6 rounded-2xl  max-w-sm w-full"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-red-500/10 text-rose-500 rounded-full shrink-0">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Delete Stitched Video?</h3>
                                    <p className="text-sm text-[#a1a1aa] mt-1 line-clamp-2">
                                        "{stitchedToDelete.title}" will be permanently removed.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    onClick={() => setStitchedToDelete(null)}
                                    className="px-4 py-2 text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#111111] rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteStitched}
                                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors  shadow-rose-600/20"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default Sidebar;
