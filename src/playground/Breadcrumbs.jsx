import React from 'react';
import { ChevronRight, GitFork } from 'lucide-react';

function Breadcrumbs() {
  return (
    <div className="flex items-center gap-1 text-xs text-[#71717a]">
      <GitFork size={14} />
      <span className="text-[#a1a1aa]">Root Scene</span>
      <ChevronRight size={13} />
      <span>Sub-scene ready</span>
    </div>
  );
}

export default Breadcrumbs;
