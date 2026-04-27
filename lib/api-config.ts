export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export const API_URLS = {
  auth: `${API_BASE_URL}/api/auth`,
  hospitals: `${API_BASE_URL}/api/hospitals`,
  doctors: `${API_BASE_URL}/api/doctors`,
  appointments: `${API_BASE_URL}/api/appointments`,
  stats: `${API_BASE_URL}/api/stats`,
  emergencies: `${API_BASE_URL}/api/emergencies`,
  wards: `${API_BASE_URL}/api/wards`,
  ambulances: `${API_BASE_URL}/api/ambulances`,
  medicalRecords: `${API_BASE_URL}/api/medical-records`,
  messages: `${API_BASE_URL}/api/messages`,
  uploads: `${API_BASE_URL}/uploads`,
};
