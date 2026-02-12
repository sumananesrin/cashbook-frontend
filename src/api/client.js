import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api'

const api = axios.create({
    baseURL: API_BASE_URL,
})

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// API endpoints
export const cashbookApi = {
    list: () => api.get('/v1/cashbooks/'),
    create: (data) => api.post('/v1/cashbooks/', data),
    getUserRole: (cashbookId) => api.get(`/v1/cashbooks/${cashbookId}/user-role/`),
    delete: (id) => api.delete(`/v1/cashbooks/${id}/`),
}

export const transactionApi = {
    list: (params) => api.get('/v1/transactions/', { params }),
    create: (data) => api.post('/v1/transactions/', data),
    update: (id, data) => api.put(`/v1/transactions/${id}/`, data),
    delete: (id) => api.delete(`/v1/transactions/${id}/`),
}

export const summaryApi = {
    get: (cashbookId, filters = {}) => api.get('/v1/summary/', { params: { cashbook: cashbookId, ...filters } }),
}

export const categoryApi = {
    list: (params) => api.get('/v1/categories/', { params }),
    create: (data) => api.post('/v1/categories/', data),
}

export const memberApi = {
    list: (params) => api.get('/v1/members/', { params }),
    create: (data) => api.post('/v1/members/', data),
}

export const partyApi = {
    list: (params) => api.get('/v1/parties/', { params }),
    create: (data) => api.post('/v1/parties/', data),
}

export const paymentModeApi = {
    list: (params) => api.get('/v1/payment-modes/', { params }),
    create: (data) => api.post('/v1/payment-modes/', data),
}

export const businessApi = {
    list: () => api.get('/v1/businesses/'),
    create: (data) => api.post('/v1/businesses/', data),
}

export const reportsApi = {
    list: () => api.get('/v1/reports/'),
    get: (id) => api.get(`/v1/reports/${id}/`),
    downloadExcel: (id) => api.get(`/v1/reports/${id}/export_excel/`, { responseType: 'blob' }),
    downloadPdf: (id) => api.get(`/v1/reports/${id}/export_pdf/`, { responseType: 'blob' }),
}

export default api
