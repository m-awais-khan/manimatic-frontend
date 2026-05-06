import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/api/`
    : 'http://localhost:8000/api/';

const api = axios.create({
    baseURL: baseURL,
});

// Inject auth token and ngrok bypass into every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('manimatic_token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    // Bypass Ngrok's free tier warning page for GET requests
    config.headers['ngrok-skip-browser-warning'] = '69420';
    return config;
});

// ── Auth API ──────────────────────────────────────────────

export const googleAuth = async (idToken) => {
    const response = await api.post('auth/google/', { id_token: idToken });
    return response.data;
};

export const fetchProfile = async () => {
    const response = await api.get('auth/profile/');
    return response.data;
};

export const wipeUserData = async () => {
    const response = await api.delete('auth/wipe/');
    return response.data;
};

export const deleteAccount = async () => {
    const response = await api.delete('auth/profile/');
    return response.data;
};

export const fetchTrainingConsent = async () => {
    const response = await api.get('auth/training-consent/');
    return response.data; // { consented: true | false }
};

export const updateTrainingConsent = async (consented) => {
    const response = await api.post('auth/training-consent/', { consented });
    return response.data; // { consented: bool, action: string }
};


// ── Scene API ─────────────────────────────────────────────

export const generateScene = async (data) => {
    const isFormData = data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await api.post('scenes/', data, config);
    return response.data;
};

export const checkSceneStatus = async (sceneId) => {
    const response = await api.get(`scenes/${sceneId}/`);
    return response.data;
};

// ── Chat API ──────────────────────────────────────────────

export const fetchChats = async () => {
    const response = await api.get('chats/');
    return response.data;
};

export const fetchChatDetails = async (chatId) => {
    const response = await api.get(`chats/${chatId}/`);
    return response.data;
};

export const deleteChat = async (chatId) => {
    const response = await api.delete(`chats/${chatId}/`);
    return response.data;
};

// ── Stitcher API ──────────────────────────────────────────

export const createStitch = async (videoPaths, title, transition = 'cut') => {
    const response = await api.post('stitch/', { video_paths: videoPaths, title, transition });
    return response.data;
};

export const fetchStitchedVideos = async () => {
    const response = await api.get('stitched/');
    return response.data;
};

export const fetchStitchedVideoDetail = async (id) => {
    const response = await api.get(`stitched/${id}/`);
    return response.data;
};

export const deleteStitchedVideo = async (id) => {
    const response = await api.delete(`stitched/${id}/`);
    return response.data;
};

// ── Dataset Suggestions API ───────────────────────────────

export const fetchSuggestions = async (count = 4) => {
    const response = await api.get(`suggestions/?count=${count}`);
    return response.data; // [{ id, instruction, category, complexity, video_path }]
};

export const createSceneFromDataset = async (datasetId) => {
    const response = await api.post('scenes/from-dataset/', { dataset_id: datasetId });
    return response.data; // { scene, chat_id } — same shape as generateScene
};

// ── Prompt Enhancement API ────────────────────────────────

export const enhancePrompt = async (rawPrompt) => {
    const response = await api.post('enhance-prompt/', { prompt: rawPrompt });
    return response.data; // { enhanced_prompt: "..." }
};
