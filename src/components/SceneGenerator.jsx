import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { generateScene } from '../api/client';
import { Settings2, Wand2 } from 'lucide-react';

const SceneGenerator = ({ onSceneAdded }) => {
    const [prompt, setPrompt] = useState("");
    const [subject, setSubject] = useState("Math");
    const [animationType, setAnimationType] = useState("2D Graphics");
    const [duration, setDuration] = useState(10);
    const [bgColor, setBgColor] = useState("#000000"); // default dark for manim
    const [textColor, setTextColor] = useState("#FFFFFF");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsGenerating(true);
        try {
            const data = await generateScene({
                prompt,
                subject,
                animation_type: animationType,
                duration,
                background_color: bgColor,
                text_color: textColor
            });
            onSceneAdded(data);
            setPrompt("");
        } catch (error) {
            console.error("Failed to start generation", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-6 rounded-2xl shadow-xl hover:border-slate-600 transition-colors"
        >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-400">
                <Settings2 className="w-5 h-5" />
                Configure Scene
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        rows="3"
                        placeholder="E.g., Draw a circle, then transform it into a square..."
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                        <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500"
                        >
                            {["Math", "Physics", "Computer Science", "General"].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Animation Type</label>
                        <select
                            value={animationType}
                            onChange={(e) => setAnimationType(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500"
                        >
                            {["2D Graphics", "Text/Equations", "Graph/Plot", "3D"].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Duration (seconds)</label>
                        <input
                            type="number"
                            min="2" max="60"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1">BG Color</label>
                            <input
                                type="color"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                className="w-full h-10 rounded cursor-pointer bg-slate-900 border border-slate-700"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1">Text Color</label>
                            <input
                                type="color"
                                value={textColor}
                                onChange={(e) => setTextColor(e.target.value)}
                                className="w-full h-10 rounded cursor-pointer bg-slate-900 border border-slate-700"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                >
                    {isGenerating ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            Initializing...
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-5 h-5" />
                            Generate Scene
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
};

export default SceneGenerator;
