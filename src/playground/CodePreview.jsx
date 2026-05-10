import React, { useState } from 'react';
import { Check, Code2, Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { usePlaygroundStore } from './store/playgroundStore';

function CodePreview() {
  const code = usePlaygroundStore((s) => s.compiledPython);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section className="h-64 shrink-0 border-t border-[#333333] bg-[#0a0a0a] flex flex-col">
      <div className="flex items-center justify-between border-b border-[#333333] px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Code2 size={16} />
          Deterministic Python
        </div>
        <button onClick={copy} className="flex items-center gap-2 rounded-lg border border-[#333333] px-3 py-1.5 text-xs text-[#a1a1aa] hover:text-white">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="flex-1 overflow-auto text-sm">
        <SyntaxHighlighter language="python" style={vscDarkPlus} customStyle={{ margin: 0, minHeight: '100%', background: 'transparent', padding: '14px' }}>
          {code}
        </SyntaxHighlighter>
      </div>
    </section>
  );
}

export default CodePreview;
