import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5555',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response Error:', error.response.data);
      console.error('Status:', error.response.status);

      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        // Redirect to login
        window.location.href = '/signin';
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api; 