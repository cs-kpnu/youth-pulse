import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getSurveys = async () => {
    const response = await api.get('surveys/');
    return response.data;
};

export const getSurvey = async (id: string) => {
    const response = await api.get(`surveys/${id}`);
    return response.data;
};

export const loginAdmin = async (password: string, nickname?: string) => {
    const response = await api.post('admin/login', { password, nickname });
    return response.data;
};

export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const saveSurvey = async (data: any) => {
    const ownerId = localStorage.getItem('ownerId') || 'root';
    const response = await api.post('admin/save', { ...data, owner_id: ownerId });
    return response.data;
};

export const analyzeAll = async (surveyId: string | number, title: string, questions: any[]) => {
    const response = await api.post(`surveys/${surveyId}/analyze/all`, { title, questions });
    return response.data;
};

export const getAllSurveysFull = async () => {
    const ownerId = localStorage.getItem('ownerId');
    const response = await api.get('admin/all_full', {
        params: { owner_id: ownerId }
    });
    return response.data;
};

export const updateSurvey = async (id: string, data: any) => {
    const response = await api.put(`admin/survey/${id}`, data);
    return response.data;
};

export const deleteSurvey = async (id: string) => {
    const response = await api.delete(`admin/survey/${id}`);
    return response.data;
};

export const generateDescription = async (title: string, questions: any[]) => {
    const response = await api.post('admin/generate_desc', { title, questions });
    return response.data;
};

export const exportSurveyPdf = async (surveyId: string | number) => {
    const response = await api.get(`surveys/${surveyId}/pdf`, {
        responseType: 'blob',
    });
    return response.data;
};
