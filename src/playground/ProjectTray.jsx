import React from 'react';
import { FolderOpen, Trash2 } from 'lucide-react';

function ProjectTray({ projects, onOpen, onDelete, loading }) {
  return (
    <div className="max-h-44 overflow-y-auto border-t border-[#333333] bg-[#0a0a0a] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#71717a]">
        <FolderOpen size={14} />
        Projects
      </div>
      {loading && <div className="text-xs text-[#71717a]">Loading projects...</div>}
      {!loading && projects.length === 0 && <div className="text-xs text-[#71717a]">No saved playgrounds yet.</div>}
      <div className="space-y-1">
        {projects.map((project) => (
          <div key={project.id} className="group flex items-center justify-between rounded-lg px-2 py-2 text-sm text-[#a1a1aa] hover:bg-[#111111] hover:text-white">
            <button onClick={() => onOpen(project)} className="min-w-0 flex-1 truncate text-left">{project.title}</button>
            <button onClick={() => onDelete(project.id)} className="opacity-0 group-hover:opacity-100 text-[#71717a] hover:text-rose-400">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectTray;
