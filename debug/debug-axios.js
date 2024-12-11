import axios from 'axios';
import debug from 'debug';

axios.interceptors.request.use((request) => {
  debug('Making request to:', request.url);
  return request;
});

axios.interceptors.response.use((response) => {
  debug('Received response from:, status:', response.config.url, response.status);
  return response;
}, (error) => {
  debug('Error in response from:, error:', error.config.url, error.message);
  return Promise.reject(error);
});

export default axios;