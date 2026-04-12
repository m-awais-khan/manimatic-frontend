import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/api/`
    : 'http://localhost:8000/api/';

const api = axios.create({
    baseURL: baseURL,
});

// Inject auth token into every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('manimatic_token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
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
