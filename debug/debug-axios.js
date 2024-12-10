import axios from 'axios';
import debug from 'debug';

const logAxios = debug('page-loader:axios');

axios.interceptors.request.use(request => {
  logAxios(`Request: ${request.method.toUpperCase()} ${request.url}`);
  return request;
});

axios.interceptors.response.use(response => {
  logAxios(`Response: ${response.status} ${response.config.url}`);
  return response;
}, error => {
  logAxios(`Error: ${error.response ? error.response.status : 'No response'} ${error.config.url}`);
  return Promise.reject(error);
});