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
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (token, data) => API.post(`/auth/reset-password/${token}`, data),
  getDepartments: () => API.get('/auth/departments'),
};

export const studentAPI = {
  getSubjects: () => API.get('/student/subjects'),
  submitFeedback: (data) => API.post('/student/feedback', data),
  getMyFeedback: () => API.get('/student/feedback'),
};

export const lecturerAPI = {
  getFeedback: () => API.get('/lecturer/feedback'),
  getReport: (params) => API.get('/lecturer/report', { params }),
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
  getPendingUsers: () => API.get('/admin/users/pending'),
  updateUserApproval: (userId, data) => API.put(`/admin/users/${userId}/approval`, data),
  promoteToHod: (userId) => API.put(`/admin/users/${userId}/promote-hod`),
  demoteHod: (userId) => API.put(`/admin/users/${userId}/demote-hod`),
  importStudents: (formData) => API.post('/admin/students/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  importLecturers: (formData) => API.post('/admin/lecturers/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  downloadFeedbackReportPdf: (params) => API.get('/admin/feedback-report/pdf', {
    params,
    responseType: 'blob',
  }),
};

export default API;