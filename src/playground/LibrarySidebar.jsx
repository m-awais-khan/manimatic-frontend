import React, { useMemo, useState } from 'react';
import { Box, ChevronDown, CirclePlus, Filter, Search, Sparkles, Timer, Type } from 'lucide-react';
import { registryByCategory } from './registry/manimRegistry';
import { usePlaygroundStore } from './store/playgroundStore';

const categoryIcon = {
  Mobjects: Box,
  Animations: Sparkles,
  Logic: Timer,
};

function LibrarySidebar() {
  const addNode = usePlaygroundStore((s) => s.addNode);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState({ Mobjects: true, Animations: true, Logic: true });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(registryByCategory).map(([category, items]) => [
      category,
      q ? items.filter((item) => `${item.label} ${item.group}`.toLowerCase().includes(q)) : items,
    ]);
  }, [query]);

  return (
    <aside className="w-72 shrink-0 border-r border-[#333333] bg-[#0a0a0a] flex flex-col">
      <div className="p-4 border-b border-[#333333]">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Type size={17} />
          Node Library
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#333333] bg-black px-3 py-2">
          <Search size={15} className="text-[#71717a]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search classes"
            className="w-full bg-transparent text-sm text-white placeholder:text-[#71717a] outline-none"
          />
          <Filter size={14} className="text-[#71717a]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.map(([category, items]) => {
          const Icon = categoryIcon[category] || Box;
          return (
            <section key={category}>
              <button
                onClick={() => setOpen((prev) => ({ ...prev, [category]: !prev[category] }))}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#71717a]"
              >
                <span className="flex items-center gap-2"><Icon size={14} />{category}</span>
                <ChevronDown size={14} className={open[category] ? '' : '-rotate-90'} />
              </button>
              {open[category] && (
                <div className="mt-1 grid grid-cols-1 gap-1.5">
                  {items.map((item) => (
                    <button
                      key={item.type}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData('application/manimatic-node', item.type)}
                      onClick={() => addNode(item.type)}
                      className="group flex items-center justify-between rounded-lg border border-[#222222] bg-[#111111] px-3 py-2 text-left hover:border-[#555555] hover:bg-[#161616] transition-colors"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[#ededed] truncate">{item.label}</span>
                        <span className="block text-[11px] text-[#71717a] truncate">{item.group}</span>
                      </span>
                      <CirclePlus size={15} className="text-[#71717a] group-hover:text-white shrink-0" />
                    </button>
                  ))}
                  {items.length === 0 && <div className="px-3 py-4 text-xs text-[#71717a]">No matches.</div>}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}

export default LibrarySidebar;
