import React from 'react';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
    ArrowRight,
    CheckCircle2,
    Code2,
    Database,
    Film,
    Layers,
    MessageSquareText,
    Play,
    Scissors,
    Sparkles,
    Terminal,
    Wand2,
} from 'lucide-react';
import Logo from './Logo';

const GOOGLE_CLIENT_ID = '1099239564139-tb9e7vmnmlquk2uojsmikrune76lj5n8.apps.googleusercontent.com';

const softReveal = {
    initial: { opacity: 0, y: 36, scale: 0.98 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: true, margin: '-120px' },
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
};

const workflow = [
    {
        icon: MessageSquareText,
        title: 'Enter a prompt',
        copy: 'Describe a math, physics, or drawing animation in natural language.',
    },
    {
        icon: Code2,
        title: 'Generate Manim code',
        copy: 'The workspace shows the generated Python code instead of hiding the process.',
    },
    {
        icon: Film,
        title: 'Render the scene',
        copy: 'Follow the engine logs while the animation compiles into a playable video.',
    },
    {
        icon: Scissors,
        title: 'Stitch scenes',
        copy: 'Combine multiple rendered clips into one longer explanatory video.',
    },
];

const features = [
    'Prompt-to-Manim generation',
    'Custom dataset training examples',
    'Reference image support',
    'Generated code preview',
    'Render status logs',
    'Scene history and replay',
    'Multi-scene stitching',
    'Dataset video inspection',
];

const modelRows = [
    ['Gemini 2.5 Flash', 'Multimodal prompt generation', 'Images'],
    ['Llama 3.3 70B', 'Fast text-to-code drafting', 'Text'],
    ['Custom Manim Model', 'Trained on verified Manim examples', 'Dataset'],
];

const showcasePrompt = 'Animates the Bubble Sort algorithm on a small array of numbers. Bars represent the values, which are highlighted during comparison and swapped until the array becomes sorted.';

const showcasePhases = [
    {
        key: 'prompt',
        label: 'Prompt entered',
        title: 'Describe the animation',
        copy: 'The user starts with a precise educational prompt.',
        duration: 4200,
    },
    {
        key: 'code',
        label: 'Manim code',
        title: 'Generate Python scene code',
        copy: 'Manimatic turns the request into executable Manim logic.',
        duration: 4200,
    },
    // {
    //     key: 'preview',
    //     label: 'First frames',
    //     title: 'Render the opening frames',
    //     copy: 'The scene begins compiling into a visual animation.',
    //     duration: 4200,
    // },
    {
        key: 'video',
        label: 'Final video',
        title: 'Watch the complete result',
        copy: 'The finished Manim output plays before the loop starts again.',
        duration: 34000,
    },
];

function PromptToVideoShowcase() {
    const [phaseIndex, setPhaseIndex] = React.useState(0);
    const [showcaseExample, setShowcaseExample] = React.useState(null);
    const phase = showcasePhases[phaseIndex];
    const promptText = showcaseExample?.instruction || showcasePrompt;
    const codeText = showcaseExample?.output || '# Loading BubbleSortAnimation code from the dataset...';

    React.useEffect(() => {
        let active = true;
        fetch('/manim-dataset-viewer.json')
            .then((response) => response.json())
            .then((payload) => {
                if (!active) return;
                const example = payload.examples?.find((item) => item.scene_class === 'BubbleSortAnimation');
                setShowcaseExample(example || null);
            })
            .catch(() => {
                if (active) setShowcaseExample(null);
            });

        return () => {
            active = false;
        };
    }, []);

    React.useEffect(() => {
        const timer = window.setTimeout(() => {
            setPhaseIndex((current) => (current + 1) % showcasePhases.length);
        }, phase.duration);

        return () => window.clearTimeout(timer);
    }, [phase]);

    return (
        <section className="border-b border-[#333333] bg-black px-5 py-24 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <motion.div {...softReveal} className="max-w-3xl">
                    <p className="text-sm font-bold uppercase tracking-[0.24em] text-white">Prompt to video</p>
                    <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                        See a real example become a video.
                    </h2>
                    <p className="mt-5 text-lg leading-8 text-[#a1a1aa]">
                        This loop showcases one example: prompt first, conversion steps next, then the complete Manim animation.
                    </p>
                </motion.div>

                <motion.div {...softReveal} className="mt-12 overflow-hidden border border-[#333333] bg-[#0a0a0a]">
                    <div className="grid gap-0 xl:grid-cols-[0.72fr_1.28fr]">
                        <div className="border-b border-[#333333] p-5 xl:border-b-0 xl:border-r">
                            <div className="mb-5 flex flex-wrap gap-2">
                                {showcasePhases.map((item, index) => (
                                    <button
                                        key={item.key}
                                        onClick={() => setPhaseIndex(index)}
                                        className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${index === phaseIndex ? 'border-white bg-white text-black' : 'border-[#333333] bg-black text-[#a1a1aa] hover:text-white'}`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <motion.div
                                key={phase.key}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#71717a]">{phase.label}</p>
                                <h3 className="mt-3 text-3xl font-black text-white">{phase.title}</h3>
                                <p className="mt-4 text-sm leading-6 text-[#a1a1aa]">{phase.copy}</p>
                            </motion.div>

                            <div className="mt-7 rounded-2xl border border-[#333333] bg-black p-5">
                                <div className="mb-4 flex items-center gap-3">
                                    <MessageSquareText size={18} />
                                    <span className="text-sm font-bold uppercase tracking-[0.18em] text-white">Prompt</span>
                                </div>
                                <motion.p
                                    key={`prompt-${phase.key}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.65 }}
                                    className="text-base font-semibold leading-8 text-[#ededed]"
                                >
                                    {promptText}
                                </motion.p>
                            </div>

                            <div className="mt-5 h-1 overflow-hidden rounded-full bg-[#333333]">
                                <motion.div
                                    key={`progress-${phase.key}`}
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: phase.duration / 1000, ease: 'linear' }}
                                    className="h-full bg-white"
                                />
                            </div>
                        </div>

                        <div className="p-0">
                            <motion.div
                                key={`visual-${phase.key}`}
                                initial={{ opacity: 0, scale: 0.985 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                                className="min-h-[560px] bg-black"
                            >
                                {phase.key === 'prompt' && (
                                    <div className="grid h-[560px] place-items-center bg-[#050505] p-8 text-center">
                                        <div>
                                            <Terminal size={42} className="mx-auto mb-5 text-white" />
                                            <p className="font-mono text-sm leading-7 text-[#d4d4d8]">
                                                &gt; waiting for animation prompt...
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {phase.key === 'code' && (
                                    <div className="h-[560px] overflow-hidden bg-black">
                                        <SyntaxHighlighter
                                            language="python"
                                            style={vscDarkPlus}
                                            showLineNumbers
                                            customStyle={{
                                                margin: 0,
                                                minHeight: 560,
                                                maxHeight: 560,
                                                overflow: 'auto',
                                                background: '#000000',
                                                fontSize: 12,
                                                lineHeight: 1.58,
                                                padding: '18px 20px',
                                            }}
                                            lineNumberStyle={{ color: '#52525b', minWidth: '3em' }}
                                        >
                                            {codeText}
                                        </SyntaxHighlighter>
                                    </div>
                                )}

                                {phase.key === 'video' && (
                                    <video
                                        key="complete-video"
                                        src="https://zgovfehpokusvxyxwvhl.supabase.co/storage/v1/object/public/dataset-videos/0016-bubblesortanimation.mp4"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        className="h-[560px] w-full bg-black object-cover"
                                    />
                                )}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function AuthPage({ onAuthSuccess }) {
    const googleButtonRef = React.useRef(null);

    const isInitializedRef = React.useRef(false);

    const initializeGoogle = React.useCallback(() => {
        /* global google */
        if (!window.google || !googleButtonRef.current || isInitializedRef.current) return;

        try {
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    if (response.credential) {
                        onAuthSuccess(response.credential);
                    }
                },
                itp_support: true
            });

            google.accounts.id.renderButton(googleButtonRef.current, {
                type: 'standard',
                theme: 'filled_black',
                size: 'large',
                text: 'signin_with',
                shape: 'pill',
                width: 300,
            });
            
            isInitializedRef.current = true;
        } catch (error) {
            console.error("Error initializing Google Sign-In:", error);
        }
    }, [onAuthSuccess]);

    React.useEffect(() => {
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');

        if (existingScript) {
            if (window.google) {
                initializeGoogle();
            } else {
                existingScript.addEventListener('load', initializeGoogle);
            }
            return () => {
                existingScript.removeEventListener('load', initializeGoogle);
            };
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogle;
        document.body.appendChild(script);

        return () => {
            // We usually shouldn't remove the script on unmount as it causes issues when navigating back
            // Instead, we just let it be, and the next mount will use the existing script.
        };
    }, [initializeGoogle]);

    const scrollToSignIn = () => {
        document.getElementById('signin')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const scrollToDataset = () => {
        window.location.href = '/dataset';
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-black text-white selection:bg-white selection:text-black">
            <header className="fixed left-0 right-0 top-0 z-40 border-b border-[#333333] bg-black">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
                    <div className="flex items-center gap-3">
                        <Logo size={34} />
                        <span className="text-xl font-semibold tracking-wide">Manimatic</span>
                    </div>
                    <nav className="hidden items-center gap-7 text-sm font-medium text-[#a1a1aa] md:flex">
                        <a href="#workflow" className="transition-colors hover:text-white">Workflow</a>
                        <button onClick={scrollToDataset} className="transition-colors hover:text-white">Dataset</button>
                        <a href="#features" className="transition-colors hover:text-white">Features</a>
                        <a href="#rendering" className="transition-colors hover:text-white">Rendering</a>
                    </nav>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={scrollToDataset}
                            className="hidden items-center gap-2 rounded-xl border border-[#333333] bg-[#111111] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#27272a] sm:inline-flex"
                        >
                            <Database size={16} />
                            Dataset
                        </button>
                        <button
                            onClick={scrollToSignIn}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#333333] bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#e5e5e5]"
                        >
                            Sign in
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </header>

            <main>
                <section className="relative mt-[65px] h-[calc(100vh-65px)] min-h-[560px] overflow-hidden border-b border-[#333333]">
                    <video
                        src="/manimatic_logo_animation.mp4"
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover opacity-95 grayscale"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-[28vh] bg-gradient-to-t from-black via-black/70 to-transparent" />
                </section>

                <section className="border-b border-[#333333] bg-black px-5 py-28 lg:px-8">
                    <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)]">
                        <motion.div
                            {...softReveal}
                            className="max-w-4xl"
                        >
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#333333] bg-black px-4 py-2 text-sm font-semibold text-white">
                                <Sparkles size={16} />
                                AI-powered Manim video generation
                            </div>
                            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-8xl">
                                Turn prompts into rendered Manim videos.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#d4d4d8] sm:text-xl">
                                Manimatic takes your idea, writes animation-ready Manim code, renders the scene, and shows you the final animation.
                            </p>
                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                <button
                                    onClick={scrollToSignIn}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-bold text-black transition-colors hover:bg-[#e5e5e5]"
                                >
                                    Start creating
                                    <ArrowRight size={18} />
                                </button>
                                <button
                                    onClick={scrollToDataset}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#333333] bg-black px-6 py-4 text-base font-bold text-white transition-colors hover:bg-[#111111]"
                                >
                                    View dataset
                                    <Database size={18} />
                                </button>
                            </div>
                        </motion.div>

                        <motion.div
                            {...softReveal}
                            transition={{ ...softReveal.transition, delay: 0.12 }}
                            className="rounded-3xl border border-[#333333] bg-[#0a0a0a] p-5"
                        >
                            <div className="flex items-center justify-between border-b border-[#333333] pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#111111] text-white">
                                        <Terminal size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">Manimatic Engine</p>
                                        <p className="text-xs text-[#71717a]">Prompt to final video</p>
                                    </div>
                                </div>
                                <span className="rounded-full border border-[#333333] bg-[#111111] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">Ready</span>
                            </div>
                            <div className="space-y-4 py-5 font-mono text-sm text-[#a1a1aa]">
                                <p><span className="text-white">&gt;</span> Enter prompt</p>
                                <p><span className="text-white">&gt;</span> Generate code</p>
                                <p><span className="text-white">&gt;</span> Render video</p>
                                <p><span className="text-white">&gt;</span> Stitch scenes</p>
                                <p><span className="text-white">&gt;</span> Inspect dataset</p>
                            </div>
                            <div className="rounded-2xl border border-[#333333] bg-black p-3">
                                <video
                                    src="/manimatic-promo.mp4"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    className="aspect-video w-full rounded-xl object-cover grayscale"
                                />
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section id="workflow" className="border-b border-[#333333] bg-[#0a0a0a] px-5 py-24 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <motion.div {...softReveal} className="max-w-3xl">
                            <p className="text-sm font-bold uppercase tracking-[0.24em] text-white">Workflow</p>
                            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                                The whole animation loop in one workspace.
                            </h2>
                            <p className="mt-5 text-lg leading-8 text-[#a1a1aa]">
                                From prompt entry to stitched output, every step stays visible and inspectable.
                            </p>
                        </motion.div>

                        <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {workflow.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <motion.div
                                        key={item.title}
                                        {...softReveal}
                                        transition={{ ...softReveal.transition, delay: index * 0.08 }}
                                        className="rounded-2xl border border-[#333333] bg-[#111111] p-6"
                                    >
                                        <div className="mb-8 grid h-12 w-12 place-items-center rounded-xl border border-[#333333] bg-black text-white">
                                            <Icon size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">{item.title}</h3>
                                        <p className="mt-3 text-sm leading-6 text-[#a1a1aa]">{item.copy}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <PromptToVideoShowcase />

                <section id="features" className="border-b border-[#333333] px-5 py-24 lg:px-8">
                    <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1fr] lg:items-center">
                        <motion.div {...softReveal}>
                            <p className="text-sm font-bold uppercase tracking-[0.24em] text-white">Built for Manim</p>
                            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                                Not just another chat box.
                            </h2>
                            <p className="mt-5 text-lg leading-8 text-[#a1a1aa]">
                                Manimatic is shaped around animation production: prompts in Natural Language become scenes, scenes become code, and code becomes rendered video.
                            </p>
                        </motion.div>

                        <motion.div {...softReveal} className="grid gap-3 sm:grid-cols-2">
                            {features.map((feature) => (
                                <div key={feature} className="flex items-center gap-3 rounded-2xl border border-[#333333] bg-[#0a0a0a] px-5 py-4">
                                    <CheckCircle2 size={20} className="shrink-0 text-white" />
                                    <span className="font-semibold text-[#ededed]">{feature}</span>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                <section className="border-b border-[#333333] bg-[#0a0a0a] px-5 py-24 lg:px-8">
                    <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1fr] lg:items-center">
                        <motion.div {...softReveal}>
                            <p className="text-sm font-bold uppercase tracking-[0.24em] text-white">Custom dataset</p>
                            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                                Trained on verified Manim examples.
                            </h2>
                            <p className="mt-5 text-lg leading-8 text-[#a1a1aa]">
                                We built our own Manim-focused dataset from reviewed prompts, generated Python code, and rendered animation outputs. That dataset helps the custom model understand animation structure better and improve accuracy for Manim scenes.
                            </p>
                            <button
                                onClick={scrollToDataset}
                                className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#333333] bg-black px-6 py-4 text-base font-bold text-white transition-colors hover:bg-[#111111]"
                            >
                                View public dataset
                                <Database size={18} />
                            </button>
                        </motion.div>

                        <motion.div {...softReveal} className="rounded-3xl border border-[#333333] bg-black p-6">
                            <div className="grid gap-3 sm:grid-cols-3">
                                {[
                                    ['Prompts', 'Natural language animation tasks'],
                                    ['Code', 'Verified Manim Python scripts'],
                                    ['Videos', 'Rendered outputs for inspection'],
                                ].map(([title, copy]) => (
                                    <div key={title} className="rounded-2xl border border-[#333333] bg-[#111111] p-5">
                                        <p className="text-xl font-black text-white">{title}</p>
                                        <p className="mt-3 text-sm leading-6 text-[#a1a1aa]">{copy}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section className="border-b border-[#333333] bg-[#0a0a0a] px-5 py-24 lg:px-8">
                    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
                        <motion.div {...softReveal} className="rounded-3xl border border-[#333333] bg-black p-6">
                            <div className="mb-5 flex items-center gap-3">
                                <Wand2 size={24} className="text-white" />
                                <h3 className="text-2xl font-bold">Model-aware generation</h3>
                            </div>
                            <div className="overflow-hidden rounded-2xl border border-[#333333]">
                                {modelRows.map((row, index) => (
                                    <div key={row[0]} className={`grid grid-cols-[1fr_1.2fr_auto] gap-4 px-5 py-4 text-sm ${index !== modelRows.length - 1 ? 'border-b border-[#333333]' : ''}`}>
                                        <span className="font-bold text-white">{row[0]}</span>
                                        <span className="text-[#a1a1aa]">{row[1]}</span>
                                        <span className="rounded-full border border-[#333333] bg-[#111111] px-3 py-1 text-xs font-bold text-white">{row[2]}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div {...softReveal} className="rounded-3xl border border-[#333333] bg-black p-6">
                            <div className="mb-5 flex items-center gap-3">
                                <Layers size={24} className="text-white" />
                                <h3 className="text-2xl font-bold">Scene-first workspace</h3>
                            </div>
                            <div className="space-y-4">
                                {['Prompt history stays attached to each scene.', 'Generated code can be opened, reviewed, and copied.', 'Completed scenes preview beside the chat without losing context.'].map((line) => (
                                    <div key={line} className="rounded-2xl border border-[#333333] bg-[#111111] p-5 text-[#d4d4d8]">
                                        {line}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section id="rendering" className="px-5 py-24 lg:px-8">
                    <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
                        <motion.div {...softReveal} className="rounded-3xl border border-[#333333] bg-[#111111] p-4">
                            <video
                                src="/manimatic-promo.mp4"
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="aspect-video w-full rounded-2xl bg-black object-cover grayscale"
                            />
                        </motion.div>
                        <motion.div {...softReveal}>
                            <p className="text-sm font-bold uppercase tracking-[0.24em] text-white">Rendering</p>
                            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                                Show the final Manim video, not just the idea.
                            </h2>
                            <p className="mt-5 text-lg leading-8 text-[#a1a1aa]">
                                The product experience moves from prompt to code to rendered preview, then into stitched videos for longer explanations or presentations.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <span className="rounded-full border border-[#333333] bg-[#111111] px-4 py-2 text-sm font-bold text-[#d4d4d8]">Scene previews</span>
                                <span className="rounded-full border border-[#333333] bg-[#111111] px-4 py-2 text-sm font-bold text-[#d4d4d8]">Render logs</span>
                                <span className="rounded-full border border-[#333333] bg-[#111111] px-4 py-2 text-sm font-bold text-[#d4d4d8]">Stitched output</span>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section id="signin" className="px-5 pb-24 lg:px-8">
                    <motion.div
                        {...softReveal}
                        className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[#333333] bg-[#0a0a0a]"
                    >
                        <div className="grid gap-0 lg:grid-cols-[1fr_0.72fr]">
                            <div className="p-8 sm:p-12">
                                <div className="mb-8 flex items-center gap-3">
                                    <Logo size={42} />
                                    <span className="text-2xl font-bold">Manimatic</span>
                                </div>
                                <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                                    Start building animation scenes.
                                </h2>
                                <p className="mt-5 max-w-xl text-lg leading-8 text-[#a1a1aa]">
                                    Sign in to save chats, render history, generated code, stitched videos, and your custom dataset workflow.
                                </p>
                                <div className="mt-9">
                                    <div ref={googleButtonRef} className="flex min-h-11 justify-start" />
                                </div>
                                <p className="mt-6 text-sm text-[#71717a]">
                                    Manimatic can make mistakes. Verify important animations before using them in production.
                                </p>
                            </div>
                            <div className="border-t border-[#333333] bg-black p-8 lg:border-l lg:border-t-0 lg:p-10">
                                <div className="flex min-h-[300px] flex-col justify-end rounded-2xl border border-[#333333] bg-[#050505] p-6">
                                    <div className="mb-8 flex items-center gap-4">
                                        <Logo size={56} />
                                        <div>
                                            <p className="text-2xl font-black text-white">Manimatic</p>
                                            <p className="text-sm text-[#71717a]">Prompt. Code. Render. Stitch.</p>
                                        </div>
                                    </div>
                                    <div className="mb-3 flex items-center gap-2 text-white">
                                        <Scissors size={18} />
                                        <span className="text-sm font-bold uppercase tracking-wider">Stitch scenes</span>
                                    </div>
                                    <p className="text-sm leading-6 text-[#d4d4d8]">
                                        Generate multiple scenes, then combine them into one polished Manim video.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </main>
        </div>
    );
}

export default AuthPage;
