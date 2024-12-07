import axios from 'axios';
import debug from 'debug';

const axiosDebug = debug('axios');

axios.interceptors.request.use((config) => {
  axiosDebug('Request: %O', config);
  return config;
});

axios.interceptors.response.use(
  (response) => {
    axiosDebug('Response: %O', response);
    return response;
  },
  (error) => {
    axiosDebug('Error: %O', error);
    return Promise.reject(error);
  }
);

export default axios;