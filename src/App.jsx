import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Workspace from './components/Workspace';
import StitcherModal from './components/StitcherModal';
import SettingsModal from './components/SettingsModal';
import AuthPage from './components/AuthPage';
import DatasetPage from './components/DatasetPage';
import BlobVideo from './components/BlobVideo';
import PlaygroundPage from './playground/PlaygroundPage';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import Logo from './components/Logo';
import { fetchProjects, createProject, deleteProject, fetchChats, fetchChatDetails, generateScene, checkSceneStatus, deleteChat, fetchStitchedVideos, deleteStitchedVideo, googleAuth, wipeUserData, deleteAccount, fetchSuggestions, createSceneFromDataset } from './api/client';

function App() {
  if (window.location.pathname === '/dataset') {
    return <DatasetPage />;
  }

  // Auth state
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('manimatic_token'));
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('manimatic_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [activeView, setActiveView] = useState(() => window.location.pathname === '/playground' ? 'playground' : 'chat');

  // Chat context state
  const [chatHistory, setChatHistory] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [activeScene, setActiveScene] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Stitcher state
  const [isStitcherOpen, setIsStitcherOpen] = useState(false);
  const [stitchedVideos, setStitchedVideos] = useState([]);
  const [previewStitchedVideo, setPreviewStitchedVideo] = useState(null);

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [resolution, setResolution] = useState(() => localStorage.getItem('manimatic_resolution') || '720p');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

  // Suggestion chips state
  const [suggestions, setSuggestions] = useState([]);

  const pollIntervalRef = useRef(null);

  // Initial load — only when authenticated
  useEffect(() => {
    if (authToken) {
      loadProjects();
      loadSuggestions();
    }
  }, [authToken]);

  // When active project changes, load its specific data
  useEffect(() => {
    if (authToken && activeProjectId) {
      loadChats(activeProjectId);
      loadStitchedVideos(activeProjectId);
      setCurrentChatId(null);
    } else {
      setChats([]);
      setStitchedVideos([]);
      setCurrentChatId(null);
    }
  }, [authToken, activeProjectId]);

  // Auth handlers
  const handleGoogleAuth = async (idToken) => {
    try {
      const data = await googleAuth(idToken);
      localStorage.setItem('manimatic_token', data.token);
      localStorage.setItem('manimatic_profile', JSON.stringify(data.profile));
      setAuthToken(data.token);
      setUserProfile(data.profile);
    } catch (err) {
      console.error('Auth failed', err);
      alert('Sign-in failed. Please try again.');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('manimatic_token');
    localStorage.removeItem('manimatic_profile');
    setAuthToken(null);
    setUserProfile(null);
    setProjects([]);
    setActiveProjectId(null);
    setChats([]);
    setChatHistory([]);
    setScenes([]);
    setActiveScene(null);
    setCurrentChatId(null);
    setStitchedVideos([]);
    setSuggestions([]);
  };

  const handleWipeData = async () => {
    try {
      await wipeUserData();
      setProjects([]);
      setActiveProjectId(null);
      setChats([]);
      setChatHistory([]);
      setScenes([]);
      setActiveScene(null);
      setCurrentChatId(null);
      setStitchedVideos([]);
      setActiveView('chat');
      window.history.pushState({}, '', '/');
      // Reset playground store
      import('./playground/store/playgroundStore').then(module => {
        module.usePlaygroundStore.getState().newProject();
      });
    } catch (err) {
      console.error('Wipe failed', err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      handleSignOut();
    } catch (err) {
      console.error('Delete account failed', err);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
      if (data.length > 0 && !activeProjectId) {
        setActiveProjectId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  const handleCreateProject = async (title) => {
    try {
      const newProject = await createProject(title);
      setProjects(prev => [newProject, ...prev]);
      setActiveProjectId(newProject.id);
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProjectId === id) {
        setActiveProjectId(null);
      }
    } catch (error) {
      console.error("Failed to delete project", error);
    }
  };

  const loadChats = async (projectId) => {
    try {
      const data = await fetchChats(projectId);
      setChats(data);
    } catch (error) {
      console.error("Failed to fetch chats", error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const data = await fetchSuggestions(4);
      setSuggestions(data);
    } catch (err) {
      console.error('Failed to load suggestions', err);
    }
  };

  const loadStitchedVideos = async (projectId) => {
    try {
      const data = await fetchStitchedVideos(projectId);
      setStitchedVideos(data);
    } catch (error) {
      console.error("Failed to fetch stitched videos", error);
    }
  };

  // CRITICAL FIX: Clear stale data from the previous chat IMMEDIATELY (synchronously)
  // before loadChatDetails runs asynchronously. Without this, ProcessingBlock mounts
  // with the old chat's msg.status and permanently seeds the wrong logs — e.g.,
  // Chat B's 'error' status bleeds into Chat A's engine display when switching chats.
  useEffect(() => {
    setChatHistory([]);
    setScenes([]);
    setActiveScene(null);
    setIsPreviewOpen(false);

    if (currentChatId) {
      loadChatDetails(currentChatId);
    }
  }, [currentChatId]);

  const loadChatDetails = async (id) => {
    try {
      const data = await fetchChatDetails(id);

      const history = [];
      data.scenes.forEach(scene => {
        const imageUrl = scene.reference_image ? `${scene.reference_image?.startsWith('http') ? scene.reference_image : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + scene.reference_image}` : null;
        history.push({ role: 'user', content: scene.prompt, image: imageUrl });

        history.push({
          role: 'assistant',
          content: 'Generating animation...',
          text_response: scene.text_response,
          sceneId: scene.id || scene._id,
          status: scene.status,
          target_model: scene.target_model,
          error_message: scene.error_message,
          video_path: scene.video_path,
          code: scene.code
        });
      });
      setChatHistory(history);
      setScenes(data.scenes);

      if (data.scenes.length > 0) {
        const lastScene = data.scenes[data.scenes.length - 1];
        setActiveScene(lastScene);
        if (lastScene.status === 'completed') {
          setIsPreviewOpen(true);
        } else {
          setIsPreviewOpen(false);
        }
      } else {
        setActiveScene(null);
        setIsPreviewOpen(false);
      }

      // Check if any scenes are still processing and resume polling
      const activeScenes = data.scenes.filter(s => ['pending', 'generating_code', 'rendering'].includes(s.status));
      if (activeScenes.length > 0) {
        setIsGenerating(true);
        startPolling(id);
      } else {
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Failed to load chat details", error);
    }
  };

  const handleDeleteChat = async (id) => {
    try {
      await deleteChat(id);
      setChats(prev => prev.filter(c => c.id !== id));
      if (currentChatId === id) {
        setCurrentChatId(null);
      }
    } catch (error) {
      console.error("Failed to delete chat", error);
    }
  };

  // ── Suggestion chip handler ──────────────────────────────
  const handleSuggestionClick = async (suggestion) => {
    if (isGenerating) return;
    setIsGenerating(true);

    // Show prompt in chat history immediately
    setChatHistory([{ role: 'user', content: suggestion.instruction }]);

    try {
      const response = await createSceneFromDataset(activeProjectId, suggestion.id);
      const newScene = response.scene;
      const newChatId = response.chat_id;

      setCurrentChatId(newChatId);
      setScenes([newScene]);
      setActiveScene(newScene);
      setIsPreviewOpen(true);
      setIsGenerating(false);

      // Add the completed assistant message
      setChatHistory([
        { role: 'user', content: suggestion.instruction },
        {
          role: 'assistant',
          content: 'Animation ready from Manimatic dataset.',
          text_response: newScene.text_response,
          sceneId: newScene.id,
          status: 'completed',
          video_path: newScene.video_path,
          code: newScene.code,
        },
      ]);

      loadChats(activeProjectId);
      loadSuggestions(); // refresh for next new chat
    } catch (err) {
      console.error('Suggestion scene creation failed', err);
      setIsGenerating(false);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Failed to load this example.', status: 'error' }]);
    }
  };

  const handleDeleteStitched = async (id) => {
    try {
      await deleteStitchedVideo(id);
      setStitchedVideos(prev => prev.filter(sv => sv.id !== id));
    } catch (error) {
      console.error("Failed to delete stitched video", error);
    }
  };

  const handleGenerate = async (promptText, imageFile = null) => {
    setIsGenerating(true);

    // Create image preview URL for chat history before sending
    const imageUrl = imageFile ? URL.createObjectURL(imageFile) : null;
    setChatHistory(prev => [...prev, { role: 'user', content: promptText, image: imageUrl }]);

    try {
      const payload = new FormData();
      payload.append('prompt', promptText);

      if (imageFile) {
        payload.append('reference_image', imageFile);
      }

      if (currentChatId) {
        payload.append('chat_id', currentChatId);
      }

      if (activeProjectId) {
        payload.append('project_id', activeProjectId);
      }

      payload.append('quality', resolution);
      payload.append('target_model', selectedModel);

      const response = await generateScene(payload);

      let newChatId = currentChatId;

      if (!currentChatId && response.chat_id) {
        newChatId = response.chat_id;
        setCurrentChatId(response.chat_id);
        loadChats(activeProjectId);
      }

      const newScene = response.scene;
      const isModal32B = selectedModel === 'manimatic-qwen32b-modal';

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: isModal32B
          ? 'Starting Manimatic 32B on Modal. First request may take a few minutes...'
          : 'Generating animation...',
        sceneId: newScene.id,
        status: newScene.status,
        target_model: newScene.target_model || selectedModel
      }]);
      setActiveScene(newScene);
      startPolling(newChatId);

    } catch (error) {
      console.error("Generation failed", error);
      setIsGenerating(false);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Task failed to execute.', status: 'error' }]);
    }
  };

  const startPolling = (chatId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const data = await fetchChatDetails(chatId);

        const activeScenes = data.scenes.filter(s => ['pending', 'generating_code', 'rendering'].includes(s.status));

        const history = [];
        data.scenes.forEach(scene => {
          const imageUrl = scene.reference_image ? `${scene.reference_image?.startsWith('http') ? scene.reference_image : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + scene.reference_image}` : null;
          history.push({ role: 'user', content: scene.prompt, image: imageUrl });

          history.push({
            role: 'assistant',
            content: 'Generating animation...',
            text_response: scene.text_response,
            sceneId: scene.id || scene._id,
            status: scene.status,
            target_model: scene.target_model,
            error_message: scene.error_message,
            video_path: scene.video_path,
            code: scene.code
          });
        });
        setChatHistory(history);
        setScenes(data.scenes);

        if (data.scenes.length > 0) {
          setActiveScene(data.scenes[data.scenes.length - 1]);
        }

        if (activeScenes.length === 0) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setIsGenerating(false);
          setIsPreviewOpen(true);
          loadChats(activeProjectId);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 3000);
  };

  if (!authToken) {
    return <AuthPage onAuthSuccess={handleGoogleAuth} />;
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden text-[#a1a1aa] font-sans selection:bg-white text-black/30">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        projects={projects}
        activeProject={activeProjectId}
        setActiveProject={setActiveProjectId}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        chats={chats}
        currentChat={currentChatId}
        activeView={activeView}
        setCurrentChat={(id) => {
          const isSameChat = id === currentChatId;
          const isDifferentView = activeView !== 'chat';
          
          if (!isSameChat || isDifferentView) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
              setIsGenerating(false);
            }
            setActiveView('chat');
            window.history.pushState({}, '', '/');
            
            if (isSameChat && isDifferentView) {
              loadChatDetails(id);
            } else {
              setCurrentChatId(id);
            }
          }
        }}
        startNewChat={() => {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setIsGenerating(false);
          }
          setCurrentChatId(null);
          setActiveView('chat');
          window.history.pushState({}, '', '/');
          loadSuggestions(); // pick fresh random suggestions for the new chat
        }}
        onOpenPlayground={() => {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setIsGenerating(false);
          }
          setActiveView('playground');
          window.history.pushState({}, '', '/playground');
        }}
        onDeleteChat={handleDeleteChat}
        onOpenStitcher={() => setIsStitcherOpen(true)}
        stitchedVideos={stitchedVideos}
        onPlayStitched={(sv) => {
          if (sv.video_path) {
            setPreviewStitchedVideo(sv);
          }
        }}
        onDeleteStitched={handleDeleteStitched}
        onOpenSettings={() => setIsSettingsOpen(true)}
        userProfile={userProfile}
        onSignOut={handleSignOut}
        onWipeData={handleWipeData}
        onDeleteAccount={handleDeleteAccount}
      />
      <main className="flex-1 flex overflow-hidden">
        {activeView === 'playground' ? (
          <PlaygroundPage
            resolution={resolution}
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            activeProjectId={activeProjectId}
            onRendered={(scene, chatId) => {
              if (chatId) setCurrentChatId(chatId);
              setScenes(prev => [scene, ...prev.filter(s => s.id !== scene.id)]);
              setActiveScene(scene);
              loadChats(activeProjectId);
            }}
          />
        ) : projects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-black px-6 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-black border border-[#333333] shadow-lg shadow-white/5">
              <Logo size={48} />
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-white tracking-tight">Welcome to Manimatic</h2>
            <p className="mb-8 max-w-sm text-sm text-[#a1a1aa] leading-relaxed">
              To start generating math and physics animations, you'll first need to create a project.
            </p>
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-create-project'));
              }}
              className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#e5e5e5] shadow-lg shadow-white/10"
            >
              Create a Project in the Sidebar
            </button>
          </div>
        ) : (
          <>
            <ChatInterface
              currentChat={currentChatId}
              chatHistory={chatHistory}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              isSidebarOpen={isSidebarOpen}
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              hasCompletedScene={scenes.some(s => s.status === 'completed' && s.code)}
              isPreviewOpen={isPreviewOpen}
              togglePreview={() => setIsPreviewOpen(!isPreviewOpen)}
              onSceneClick={(sceneId) => {
                const scene = scenes.find((s) => s.id === sceneId || s._id === sceneId);
                if (scene) {
                  setActiveScene(scene);
                  setIsPreviewOpen(prev => !prev);
                }
              }}
              selectedModel={selectedModel}
              onModelChange={(m) => setSelectedModel(m)}
              suggestions={suggestions}
              onSuggestionClick={handleSuggestionClick}
            />
            <Workspace
              scenes={scenes}
              activeScene={activeScene}
              isSidebarOpen={isSidebarOpen}
              isPreviewOpen={isPreviewOpen}
              closePreview={() => setIsPreviewOpen(false)}
            />
          </>
        )}
      </main>

      <StitcherModal
        isOpen={isStitcherOpen}
        onClose={() => setIsStitcherOpen(false)}
        activeProjectId={activeProjectId}
        projects={projects}
        onStitchComplete={(newStitch, editorProjectId) => {
          if (newStitch) {
            // Instantly show the new stitched video as pending in the sidebar
            if (!editorProjectId || editorProjectId === activeProjectId) {
              setStitchedVideos(prev => [newStitch, ...prev]);
            }
          }
          const pollProjectId = editorProjectId || activeProjectId;
          const pollStitch = setInterval(async () => {
            try {
              const data = await fetchStitchedVideos(pollProjectId);
              if (pollProjectId === activeProjectId) {
                setStitchedVideos(data);
              }
              const processing = data.filter(sv => sv.status === 'pending' || sv.status === 'processing');
              if (processing.length === 0) {
                clearInterval(pollStitch);
              }
            } catch (err) {
              console.error("Stitch poll error", err);
              clearInterval(pollStitch);
            }
          }, 3000);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        resolution={resolution}
        onResolutionChange={(r) => {
          setResolution(r);
          localStorage.setItem('manimatic_resolution', r);
        }}
      />

      {/* Stitched Video Preview Panel */}
      <AnimatePresence>
        {previewStitchedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black  p-6"
            onClick={() => setPreviewStitchedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0a] border border-[#333333] rounded-2xl  w-full max-w-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#333333]">
                <h3 className="text-sm font-semibold text-white truncate">{previewStitchedVideo.title}</h3>
                <div className="flex items-center gap-2">
                  <a
                    href={`${previewStitchedVideo.video_path?.startsWith('http') ? previewStitchedVideo.video_path : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + previewStitchedVideo.video_path}`}
                    download
                    className="p-1.5 text-[#a1a1aa] hover:text-white hover:bg-[#111111] rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </a>
                  <button
                    onClick={() => setPreviewStitchedVideo(null)}
                    className="p-1.5 text-[#a1a1aa] hover:text-white hover:bg-[#111111] rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              {/* Video */}
              <div className="p-4 bg-black">
                <BlobVideo
                  url={previewStitchedVideo.video_path}
                  className="w-full rounded-lg"
                  style={{ maxHeight: '70vh' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
