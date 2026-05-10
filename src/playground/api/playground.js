import { checkSceneStatus } from '../../api/client';
import apiClient from '../../api/client';

export const renderPlayground = async ({ manifest, quality, chatId, playgroundId, projectId, title }) => {
  const response = await apiClient.post('playground/render/', {
    manifest,
    quality,
    chat_id: chatId,
    project_id: projectId,
    playground_id: playgroundId,
    title,
  });
  return response.data;
};

export const fetchPlaygroundProjects = async (projectId) => {
  const response = await apiClient.get(`playground/projects/?project_id=${projectId}`);
  return response.data;
};

export const createPlaygroundProject = async (projectId, payload) => {
  const response = await apiClient.post('playground/projects/', { ...payload, project_id: projectId });
  return response.data;
};

export const updatePlaygroundProject = async (id, payload) => {
  const response = await apiClient.put(`playground/projects/${id}/`, payload);
  return response.data;
};

export const deletePlaygroundProject = async (id) => {
  await apiClient.delete(`playground/projects/${id}/`);
};

export { checkSceneStatus };
