import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ArrowLeft, Code2, Database, Film, MessageSquareText, Search } from 'lucide-react';
import Logo from './Logo';

function compactCategory(label) {
    return (label || 'Uncategorized').replace(/\s*\([^)]*\)/g, '');
}

function DatasetPage() {
    const [dataset, setDataset] = React.useState(null);
    const [loadError, setLoadError] = React.useState('');
    const [category, setCategory] = React.useState('All');
    const [complexity, setComplexity] = React.useState('All');
    const [selectedId, setSelectedId] = React.useState('');
    const [query, setQuery] = React.useState('');

    React.useEffect(() => {
        let active = true;
        fetch('/manim-dataset-viewer.json')
            .then((response) => {
                if (!response.ok) throw new Error('Dataset viewer file was not found.');
                return response.json();
            })
            .then((payload) => {
                if (!active) return;
                setDataset(payload);
                setSelectedId(payload.examples?.find((example) => example.video_exists)?.id || payload.examples?.[0]?.id || '');
            })
            .catch((error) => {
                if (!active) return;
                setLoadError(error.message || 'Unable to load dataset.');
            });

        return () => {
            active = false;
        };
    }, []);

    const examples = dataset?.examples || [];
    const categories = React.useMemo(() => ['All', ...Object.keys(dataset?.stats?.categories || {})], [dataset]);
    const complexities = React.useMemo(() => ['All', ...Object.keys(dataset?.stats?.complexities || {})], [dataset]);

    const filteredExamples = React.useMemo(() => {
        const search = query.trim().toLowerCase();
        return examples.filter((example) => {
            const matchesCategory = category === 'All' || example.category === category;
            const matchesComplexity = complexity === 'All' || example.complexity === complexity;
            const matchesSearch = !search || `${example.instruction} ${example.scene_class}`.toLowerCase().includes(search);
            return matchesCategory && matchesComplexity && matchesSearch;
        });
    }, [category, complexity, examples, query]);

    React.useEffect(() => {
        if (!filteredExamples.length) {
            setSelectedId('');
            return;
        }
        if (!filteredExamples.some((example) => example.id === selectedId)) {
            setSelectedId(filteredExamples[0].id);
        }
    }, [filteredExamples, selectedId]);

    const selectedExample = filteredExamples.find((example) => example.id === selectedId) || filteredExamples[0];
    const categoryCount = category === 'All' ? examples.length : dataset?.stats?.categories?.[category] || 0;
    const complexityCount = complexity === 'All' ? examples.length : dataset?.stats?.complexities?.[complexity] || 0;
    const selectedPairCount = category === 'All'
        ? complexityCount
        : complexity === 'All'
            ? categoryCount
            : dataset?.stats?.category_complexities?.[category]?.[complexity] || 0;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
            <header className="sticky top-0 z-40 border-b border-[#333333] bg-black">
                <div className="mx-auto flex max-w-[1800px] items-center justify-between px-5 py-4 lg:px-8">
                    <button
                        onClick={() => { window.location.href = '/'; }}
                        className="inline-flex items-center gap-3 text-left"
                    >
                        <Logo size={34} />
                        <span className="text-xl font-semibold tracking-wide">Manimatic</span>
                    </button>
                    <button
                        onClick={() => { window.location.href = '/'; }}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#333333] bg-[#111111] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#27272a]"
                    >
                        <ArrowLeft size={16} />
                        Auth page
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-[1800px] px-5 py-10 lg:px-8">
                <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr] xl:items-end">
                    <div>
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#333333] bg-[#111111] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white">
                            <Database size={15} />
                            Public custom dataset
                        </div>
                        <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                            Explore the verified Manim training examples.
                        </h1>
                        <p className="mt-5 max-w-3xl text-base leading-7 text-[#a1a1aa]">
                            Select a category and complexity, then inspect each prompt, Python code, and rendered video.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            ['Total examples', dataset?.stats?.total || 0],
                            // ['Mapped videos', dataset?.stats?.with_video || 0],
                            ['Category count', categoryCount],
                            ['Current filter', selectedPairCount],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-2xl border border-[#333333] bg-[#0a0a0a] p-5">
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#71717a]">{label}</p>
                                <p className="mt-2 text-3xl font-black text-white">{value}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-10 rounded-3xl border border-[#333333] bg-[#0a0a0a]">
                    {loadError ? (
                        <div className="p-8 text-[#d4d4d8]">{loadError}</div>
                    ) : !dataset ? (
                        <div className="p-8 font-mono text-sm text-[#a1a1aa]">Loading dataset...</div>
                    ) : (
                        <>
                            <div className="grid gap-4 border-b border-[#333333] p-5 xl:grid-cols-[1fr_1fr_1.4fr]">
                                <label className="block">
                                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-[#71717a]">Category</span>
                                    <select
                                        value={category}
                                        onChange={(event) => setCategory(event.target.value)}
                                        className="h-11 w-full rounded-xl border border-[#333333] bg-black px-4 text-sm font-semibold text-white outline-none"
                                    >
                                        {categories.map((item) => (
                                            <option key={item} value={item}>{item === 'All' ? 'All categories' : compactCategory(item)}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-[#71717a]">Complexity</span>
                                    <select
                                        value={complexity}
                                        onChange={(event) => setComplexity(event.target.value)}
                                        className="h-11 w-full rounded-xl border border-[#333333] bg-black px-4 text-sm font-semibold text-white outline-none"
                                    >
                                        {complexities.map((item) => (
                                            <option key={item} value={item}>{item === 'All' ? 'All levels' : item}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-[#71717a]">Search</span>
                                    <div className="flex h-11 items-center gap-3 rounded-xl border border-[#333333] bg-black px-4">
                                        <Search size={17} className="text-[#a1a1aa]" />
                                        <input
                                            value={query}
                                            onChange={(event) => setQuery(event.target.value)}
                                            placeholder="Search prompt or scene class..."
                                            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-[#71717a]"
                                        />
                                    </div>
                                </label>
                            </div>

                            <div className="grid min-h-[calc(100vh-260px)] xl:grid-cols-[380px_1fr]">
                                <aside className="border-b border-[#333333] p-4 xl:border-b-0 xl:border-r">
                                    <div className="mb-3 flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#71717a]">
                                        <span>Examples</span>
                                        <span>{filteredExamples.length}</span>
                                    </div>
                                    <div className="max-h-[calc(120vh-330px)] min-h-[520px] space-y-2 overflow-y-auto pr-1">
                                        {filteredExamples.map((example, index) => (
                                            <button
                                                key={example.id}
                                                onClick={() => setSelectedId(example.id)}
                                                className={`w-full rounded-2xl border p-4 text-left transition-colors ${example.id === selectedExample?.id ? 'border-white bg-white text-black' : 'border-[#333333] bg-black text-white hover:bg-[#111111]'}`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-xs font-black">{String(index + 1).padStart(2, '0')}</span>
                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${example.id === selectedExample?.id ? 'border-black text-black' : 'border-[#333333] text-[#d4d4d8]'}`}>
                                                        {example.video_exists ? 'Video' : 'No video'}
                                                    </span>
                                                </div>
                                                <p className="mt-3 line-clamp-3 text-[13px] font-semibold leading-5">{example.instruction}</p>
                                                <p className={`mt-3 text-[11px] ${example.id === selectedExample?.id ? 'text-black' : 'text-[#71717a]'}`}>
                                                    {example.complexity} / {example.scene_class || 'Scene'}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </aside>

                                <div className="space-y-5 p-5">
                                    <section className="grid gap-5 2xl:grid-cols-[minmax(520px,0.9fr)_minmax(560px,1.1fr)]">
                                        <div className="rounded-2xl border border-[#333333] bg-black p-5">
                                            <div className="mb-4 flex items-center gap-3">
                                                <MessageSquareText size={19} />
                                                <h2 className="text-xl font-bold">Prompt</h2>
                                            </div>
                                            <p className="min-h-[170px] text-base font-semibold leading-7 text-white">
                                                {selectedExample?.instruction || 'No example selected.'}
                                            </p>
                                            <div className="mt-5 flex flex-wrap gap-2">
                                                {[selectedExample?.category, selectedExample?.complexity, selectedExample?.scene_class].filter(Boolean).map((item) => (
                                                    <span key={item} className="rounded-full border border-[#333333] bg-[#111111] px-3 py-1 text-[11px] font-bold text-[#d4d4d8]">
                                                        {item === selectedExample?.category ? compactCategory(item) : item}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-[#333333] bg-black p-5">
                                            <div className="mb-4 flex items-center gap-3">
                                                <Film size={19} />
                                                <h2 className="text-xl font-bold">Rendered video</h2>
                                            </div>
                                            {selectedExample?.video_exists && selectedExample?.video_path ? (
                                                <video
                                                    key={selectedExample.video_path}
                                                    src={selectedExample.video_path}
                                                    autoPlay
                                                    muted
                                                    controls
                                                    playsInline
                                                    className="aspect-video w-full rounded-xl border border-[#333333] bg-black object-contain"
                                                />
                                            ) : (
                                                <div className="grid aspect-video place-items-center rounded-xl border border-[#333333] bg-[#050505] p-8 text-center text-sm leading-6 text-[#a1a1aa]">
                                                    No matched video found yet.
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    <section className="rounded-2xl border border-[#333333] bg-black">
                                        <div className="flex items-center gap-3 border-b border-[#333333] px-5 py-4">
                                            <Code2 size={19} />
                                            <h2 className="text-xl font-bold">Python code</h2>
                                        </div>
                                        <SyntaxHighlighter
                                            language="python"
                                            style={vscDarkPlus}
                                            showLineNumbers
                                            customStyle={{
                                                margin: 0,
                                                minHeight: 520,
                                                maxHeight: '72vh',
                                                overflow: 'auto',
                                                background: '#000000',
                                                fontSize: 12,
                                                lineHeight: 1.58,
                                            }}
                                            lineNumberStyle={{ color: '#52525b', minWidth: '3em' }}
                                        >
                                            {selectedExample?.output || '# Select an example to inspect the Manim code.'}
                                        </SyntaxHighlighter>
                                    </section>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}

export default DatasetPage;
