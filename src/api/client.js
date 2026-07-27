import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')}/api/`
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

// Global response interceptor to handle invalid/expired tokens (401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized access. Token might be invalid or expired. Signing out...');
            localStorage.removeItem('manimatic_token');
            localStorage.removeItem('manimatic_profile');
            window.location.href = '/'; // Redirect and force state refresh
        }
        return Promise.reject(error);
    }
);

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


// ── Project API ──────────────────────────────────────────

export const fetchProjects = async () => {
    const response = await api.get('projects/');
    return response.data;
};

export const createProject = async (title) => {
    const response = await api.post('projects/', { title });
    return response.data;
};

export const deleteProject = async (id) => {
    const response = await api.delete(`projects/${id}/`);
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

export const fetchChats = async (projectId) => {
    const response = await api.get(`chats/?project_id=${projectId}`);
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

export const createStitch = async (projectId, videoPaths, title, transition = 'cut', editPlan = null) => {
    const payload = { project_id: projectId, video_paths: videoPaths, title, transition };
    if (editPlan) {
        payload.clips = editPlan.clips;
        payload.transitions = editPlan.transitions;
        payload.output = editPlan.output;
    }
    const response = await api.post('stitch/', payload);
    return response.data;
};

export const fetchStitchedVideos = async (projectId) => {
    const response = await api.get(`stitched/?project_id=${projectId}`);
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

// ── Video Editor Projects API ─────────────────────────────

export const fetchVideoEditorProjects = async (projectId) => {
    const response = await api.get(`video-editor/projects/?project_id=${projectId}`);
    return response.data;
};

export const createVideoEditorProject = async (projectId, title, editData) => {
    const response = await api.post('video-editor/projects/', { project_id: projectId, title, edit_data: editData });
    return response.data;
};

export const updateVideoEditorProject = async (id, title, editData) => {
    const response = await api.put(`video-editor/projects/${id}/`, { title, edit_data: editData });
    return response.data;
};

export const deleteVideoEditorProject = async (id) => {
    const response = await api.delete(`video-editor/projects/${id}/`);
    return response.data;
};

// ── Dataset Suggestions API ───────────────────────────────

export const fetchSuggestions = async (count = 4) => {
    const response = await api.get(`suggestions/?count=${count}`);
    return response.data; // [{ id, instruction, category, complexity, video_path }]
};

export const createSceneFromDataset = async (projectId, datasetId) => {
    const response = await api.post('scenes/from-dataset/', { project_id: projectId, dataset_id: datasetId });
    return response.data; // { scene, chat_id } — same shape as generateScene
};

// ── Prompt Enhancement API ────────────────────────────────

export const enhancePrompt = async (rawPrompt) => {
    const response = await api.post('enhance-prompt/', { prompt: rawPrompt });
    return response.data; // { enhanced_prompt: "..." }
};

export default api;
