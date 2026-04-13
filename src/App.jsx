import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Workspace from './components/Workspace';
import StitcherModal from './components/StitcherModal';
import SettingsModal from './components/SettingsModal';
import AuthPage from './components/AuthPage';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { fetchChats, fetchChatDetails, generateScene, checkSceneStatus, deleteChat, fetchStitchedVideos, deleteStitchedVideo, googleAuth, wipeUserData, deleteAccount } from './api/client';

function App() {
  // Auth state
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('manimatic_token'));
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('manimatic_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

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

  const pollIntervalRef = useRef(null);

  // Initial load — only when authenticated
  useEffect(() => {
    if (authToken) {
      loadChats();
      loadStitchedVideos();
    }
  }, [authToken]);

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
    setChats([]);
    setChatHistory([]);
    setScenes([]);
    setActiveScene(null);
    setCurrentChatId(null);
    setStitchedVideos([]);
  };

  const handleWipeData = async () => {
    try {
      await wipeUserData();
      setChats([]);
      setChatHistory([]);
      setScenes([]);
      setActiveScene(null);
      setCurrentChatId(null);
      setStitchedVideos([]);
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

  useEffect(() => {
    if (currentChatId) {
      loadChatDetails(currentChatId);
    } else {
      setChatHistory([]);
      setScenes([]);
      setActiveScene(null);
    }
  }, [currentChatId]);

  const loadChats = async () => {
    try {
      const data = await fetchChats();
      setChats(data);
    } catch (error) {
      console.error("Failed to fetch chats", error);
    }
  };

  const loadStitchedVideos = async () => {
    try {
      const data = await fetchStitchedVideos();
      setStitchedVideos(data);
    } catch (error) {
      console.error("Failed to fetch stitched videos", error);
    }
  };

  const loadChatDetails = async (id) => {
    try {
      const data = await fetchChatDetails(id);

      const history = [];
      data.scenes.forEach(scene => {
        const imageUrl = scene.reference_image ? `${scene.reference_image?.startsWith('http') ? scene.reference_image : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + scene.reference_image}` : null;
        history.push({ role: 'user', content: scene.prompt, image: imageUrl });

        if (scene.text_response) {
          history.push({
            role: 'assistant',
            content: scene.text_response,
          });
        } else {
          history.push({
            role: 'assistant',
            content: 'Generating animation...',
            sceneId: scene.id || scene._id,
            status: scene.status,
            error_message: scene.error_message
          });
        }
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

      payload.append('quality', resolution);
      payload.append('target_model', selectedModel);

      const response = await generateScene(payload);

      let newChatId = currentChatId;

      if (!currentChatId && response.chat_id) {
        newChatId = response.chat_id;
        setCurrentChatId(response.chat_id);
        loadChats();
      }

      const newScene = response.scene;

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Generating animation...',
        sceneId: newScene.id,
        status: newScene.status
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

        const activeScenes = data.scenes.filter(s => s.status === 'pending' || s.status === 'generating_code' || s.status === 'rendering');

        const history = [];
        data.scenes.forEach(scene => {
          const imageUrl = scene.reference_image ? `${scene.reference_image?.startsWith('http') ? scene.reference_image : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + scene.reference_image}` : null;
          history.push({ role: 'user', content: scene.prompt, image: imageUrl });

          if (scene.text_response) {
            history.push({
              role: 'assistant',
              content: scene.text_response,
            });
          } else {
            history.push({
              role: 'assistant',
              content: 'Generating animation...',
              sceneId: scene.id || scene._id,
              status: scene.status,
              error_message: scene.error_message
            });
          }
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
          loadChats();
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
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200 font-sans selection:bg-indigo-500/30">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        chats={chats}
        currentChat={currentChatId}
        setCurrentChat={(id) => {
          if (id !== currentChatId) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
              setIsGenerating(false);
            }
            setCurrentChatId(id);
          }
        }}
        startNewChat={() => {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setIsGenerating(false);
          }
          setCurrentChatId(null);
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
        <ChatInterface
          currentChat={currentChatId}
          chatHistory={chatHistory}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          hasCompletedScene={scenes.some(s => s.status === 'completed')}
          isPreviewOpen={isPreviewOpen}
          togglePreview={() => setIsPreviewOpen(!isPreviewOpen)}
          onSceneClick={(sceneId) => {
            const scene = scenes.find((s) => s.id === sceneId || s._id === sceneId);
            if (scene) {
              setActiveScene(scene);
              setIsPreviewOpen(true);
            }
          }}
          selectedModel={selectedModel}
          onModelChange={(m) => setSelectedModel(m)}
        />
        <Workspace
          scenes={scenes}
          activeScene={activeScene}
          isSidebarOpen={isSidebarOpen}
          isPreviewOpen={isPreviewOpen}
          closePreview={() => setIsPreviewOpen(false)}
        />
      </main>

      {/* Stitcher Modal */}
      <StitcherModal
        isOpen={isStitcherOpen}
        onClose={() => setIsStitcherOpen(false)}
        onStitchComplete={() => {
          const pollStitch = setInterval(async () => {
            try {
              const data = await fetchStitchedVideos();
              setStitchedVideos(data);
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-6"
            onClick={() => setPreviewStitchedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white truncate">{previewStitchedVideo.title}</h3>
                <div className="flex items-center gap-2">
                  <a
                    href={`${previewStitchedVideo.video_path?.startsWith('http') ? previewStitchedVideo.video_path : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + previewStitchedVideo.video_path}`}
                    download
                    className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </a>
                  <button
                    onClick={() => setPreviewStitchedVideo(null)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              {/* Video */}
              <div className="p-4 bg-black">
                <video
                  src={`${previewStitchedVideo.video_path?.startsWith('http') ? previewStitchedVideo.video_path : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + previewStitchedVideo.video_path}`}
                  controls
                  autoPlay
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
