import React, { useEffect, useRef, useState } from 'react';
import { Film, Loader2, Menu, PanelLeftClose, PlaySquare, RefreshCw, X } from 'lucide-react';
import Canvas from './Canvas';
import CodePreview from './CodePreview';
import GenerateBar from './GenerateBar';
import GhostPreview from './GhostPreview';
import Inspector from './Inspector';
import LibrarySidebar from './LibrarySidebar';
import ProjectTray from './ProjectTray';
import Breadcrumbs from './Breadcrumbs';
import { usePlaygroundStore } from './store/playgroundStore';
import { checkSceneStatus, createPlaygroundProject, deletePlaygroundProject, fetchPlaygroundProjects, renderPlayground, updatePlaygroundProject } from './api/playground';
import VideoPlayer from '../components/VideoPlayer';

function PlaygroundPage({ resolution = '720p', onRendered, isSidebarOpen = true, toggleSidebar, activeProjectId }) {
  const title = usePlaygroundStore((s) => s.title);
  const setTitle = usePlaygroundStore((s) => s.setTitle);
  const manifest = usePlaygroundStore((s) => s.manifest);
  const compiledPython = usePlaygroundStore((s) => s.compiledPython);
  const projectId = usePlaygroundStore((s) => s.projectId);
  const graphData = usePlaygroundStore((s) => s.graphData);
  const loadProject = usePlaygroundStore((s) => s.loadProject);
  const markSaved = usePlaygroundStore((s) => s.markSaved);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [renderedScene, setRenderedScene] = useState(null);
  const [showPanels, setShowPanels] = useState(true);
  const [showRenderOutput, setShowRenderOutput] = useState(true);
  const pollRef = useRef(null);

  const loadProjects = async () => {
    if (!activeProjectId) return;
    setProjectsLoading(true);
    try {
      setProjects(await fetchPlaygroundProjects(activeProjectId));
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [activeProjectId]);

  const saveProject = async () => {
    if (!activeProjectId) return;

    let currentTitle = title;
    if (!projectId && currentTitle === 'Untitled Playground') {
      const newName = window.prompt("Enter a name for this Playground:", "My Playground");
      if (newName === null) return; // User cancelled
      currentTitle = newName.trim() || 'Untitled Playground';
      setTitle(currentTitle);
    }

    setSaving(true);
    try {
      const payload = { title: currentTitle, graph_data: graphData(), manifest, compiled_python: compiledPython };
      const project = projectId ? await updatePlaygroundProject(projectId, payload) : await createPlaygroundProject(activeProjectId, payload);
      markSaved(project);
      await loadProjects();
    } finally {
      setSaving(false);
    }
  };

  const render = async () => {
    if (!activeProjectId) return;

    let currentTitle = title;
    if (!projectId && currentTitle === 'Untitled Playground') {
      const newName = window.prompt("Enter a name for this Playground:", "My Playground");
      if (newName === null) return; // User cancelled
      currentTitle = newName.trim() || 'Untitled Playground';
      setTitle(currentTitle);
    }

    setRendering(true);
    setRenderedScene(null);
    setShowRenderOutput(true);
    try {
      const response = await renderPlayground({ 
        manifest, 
        quality: resolution, 
        playgroundId: projectId, 
        projectId: activeProjectId, 
        title: currentTitle 
      });
      setRenderedScene(response.scene);
      if (onRendered) onRendered(response.scene, response.chat_id);
      pollRef.current && clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        const scene = await checkSceneStatus(response.scene.id);
        setRenderedScene(scene);
        if (!['pending', 'rendering', 'generating_code'].includes(scene.status)) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setRendering(false);
        }
      }, 3000);
    } catch (error) {
      setRendering(false);
      setRenderedScene({ status: 'error', error_message: error.response?.data?.error || 'Render request failed.' });
    }
  };

  const deleteProject = async (id) => {
    await deletePlaygroundProject(id);
    await loadProjects();
  };

  return (
    <div className="flex h-full min-w-0 flex-1 bg-black text-[#a1a1aa]">
      <LibrarySidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-[#333333] bg-[#0a0a0a] px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {!isSidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="rounded-lg border border-[#333333] p-2 text-[#a1a1aa] hover:bg-[#111111] hover:text-white"
                  title="Open sidebar"
                >
                  <Menu size={18} />
                </button>
              )}
              <div className="rounded-lg bg-[#222222] p-2 text-white"><PlaySquare size={18} /></div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="min-w-0 bg-transparent text-lg font-semibold text-white outline-none"
              />
            </div>
            <div className="mt-1"><Breadcrumbs /></div>
          </div>
          <div className="flex items-center gap-2">
            {renderedScene && !showRenderOutput && (
              <button 
                onClick={() => setShowRenderOutput(true)} 
                className="flex items-center gap-2 rounded-lg border border-[#333333] px-3 py-1.5 text-sm font-medium text-[#a1a1aa] hover:text-white bg-[#111111] transition-colors"
              >
                <Film size={15} />
                Output
              </button>
            )}
            <button onClick={loadProjects} className="rounded-lg border border-[#333333] p-2 text-[#a1a1aa] hover:text-white" title="Refresh projects">
              <RefreshCw size={16} className={projectsLoading ? "animate-spin text-white" : ""} />
            </button>
            <button 
              onClick={() => setShowPanels(!showPanels)} 
              className={`rounded-lg border border-[#333333] p-2 hover:text-white transition-colors ${showPanels ? 'bg-[#111111] text-white' : 'text-[#a1a1aa]'}`} 
              title="Toggle Panels"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <Canvas />
            <CodePreview />
            <GenerateBar onRender={render} onSave={saveProject} rendering={rendering} saving={saving} />
          </div>
          {showPanels && (
            <div className="flex w-80 shrink-0 flex-col border-l border-[#333333]">
              <Inspector />
              <GhostPreview />
              <ProjectTray projects={projects} loading={projectsLoading} onOpen={loadProject} onDelete={deleteProject} />
            </div>
          )}
        </div>
      </main>
      {renderedScene && showRenderOutput && (
        <aside className="w-[30rem] shrink-0 border-l border-[#333333] bg-[#0a0a0a] flex flex-col">
          <div className="flex items-center justify-between border-b border-[#333333] px-4 py-3 shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Film size={16} />
              Render Output
            </div>
            <div className="flex items-center gap-3">
              {rendering && <Loader2 size={16} className="animate-spin text-white" />}
              <button 
                onClick={() => setShowRenderOutput(false)} 
                className="p-1 hover:bg-[#222222] rounded-md text-[#a1a1aa] hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="overflow-hidden rounded-lg border border-[#333333] bg-black">
              <VideoPlayer mainVideoUrl={renderedScene.video_path || null} status={renderedScene.status} />
            </div>
            {renderedScene.error_message && (
              <pre className="mt-3 max-h-48 overflow-auto rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-100 whitespace-pre-wrap">{renderedScene.error_message}</pre>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

export default PlaygroundPage;
