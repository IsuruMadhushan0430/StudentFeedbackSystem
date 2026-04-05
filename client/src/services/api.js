import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getDepartments: () => API.get('/auth/departments'),
};

export const studentAPI = {
  getSubjects: () => API.get('/student/subjects'),
  submitFeedback: (data) => API.post('/student/feedback', data),
  getMyFeedback: () => API.get('/student/feedback'),
};

export const lecturerAPI = {
  getFeedback: () => API.get('/lecturer/feedback'),
  getReport: () => API.get('/lecturer/report'),
  getSubjects: () => API.get('/lecturer/subjects'),
};

export const adminAPI = {
  addDepartment: (data) => API.post('/admin/department', data),
  addSubject: (data) => API.post('/admin/subject', data),
  assignLecturer: (subjectId, payload) => API.put(`/admin/subject/${subjectId}/assign-lecturer`, payload),
  deleteUser: (userId) => API.delete(`/admin/user/${userId}`),
  setSemester: (data) => API.post('/admin/semester', data),
  updateSemester: (semesterId, data) => API.put(`/admin/semester/${semesterId}`, data),
  getDashboardData: () => API.get('/admin/dashboard-data'),
  deleteDepartment: (departmentId) => API.delete(`/admin/department/${departmentId}`),
  deleteSubject: (subjectId) => API.delete(`/admin/subject/${subjectId}`),
};

export default API;