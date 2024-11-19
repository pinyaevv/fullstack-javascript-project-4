import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const downloadPage = (url, outputDir) => {
  return axios.get(url)
    .then((response) => {
      const pageContent = response.data;

      const fileName = url
        .replace(/^https?:\/\//, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .concat('.html');

      const filePath = path.join(outputDir, fileName);

      return fs.writeFile(filePath, pageContent, 'utf-8')
        .then(() => filePath);
    })
    .catch((err) => {
      return Promise.reject(new Error(`Ошибка при скачивании страницы: ${err.message}`));
    });
};

export default downloadPage;
