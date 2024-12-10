import axios from '../debug/debug-axios.js';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import debug from 'debug';

const recLog = debug('page-loader');

const generateFileName = (resourceUrl) => {
  const ext = path.extname(resourceUrl) || '.html';
  const baseName = resourceUrl
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-$/, '');
  return `${baseName}${ext}`;
};

const downloadResource = (baseUrl, outputDir, resourceUrl, element, attr, $) => {
  const fullUrl = new URL(resourceUrl, baseUrl).toString();
  const fileName = generateFileName(resourceUrl);
  const filePath = path.join(outputDir, fileName);
  recLog('Generated file path for resource:', filePath);

  return axios
    .get(fullUrl, { responseType: 'arraybuffer' })
    .then((response) => {
      if (response.status !== 200) {
        recLog('Resource not found:', fullUrl, response.status);
        return;
      }

      return fs.writeFile(filePath, response.data).then(() => {
        const relativePath = path.posix.join(path.basename(outputDir), fileName);
        $(element).attr(attr, relativePath);
        recLog('Resource downloaded', fullUrl);
      });
    })
};

const downloadPage = (url, outputDir) => {
  recLog('Started downloading page', url);
  return axios
    .get(url)
    .then((response) => {
      const pageContent = response.data;
      recLog('Received data from server', pageContent.length);
      const $ = cheerio.load(pageContent);

      const dirName = url
        .replace(/^https?:\/\//, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .concat('_files');
      const resourcesDir = path.join(outputDir, dirName);

      return fs
        .mkdir(resourcesDir, { recursive: true })
        .then(() => {
          recLog('Created resources directory:', resourcesDir);
          const downloadPromises = [];

          $('link[href], script[src], img[src]').each((_, element) => {
            const attr = $(element).is('link') || $(element).is('script') ? 'href' : 'src';
            const resourceUrl = $(element).attr(attr);

            if (resourceUrl) {
              downloadPromises.push(
                downloadResource(url, resourcesDir, resourceUrl, element, attr, $)
              );
            }
          });
          
          recLog('Starting to download resources for page:', url);
          return Promise.all(downloadPromises).then(() => {
            const fileName = generateFileName(url);
            const filePath = path.join(outputDir, fileName);

            return fs.writeFile(filePath, $.html(), 'utf-8').then(() => {
              recLog('Page saved to:', filePath);
              return filePath;
            });
          });
        });
    })
    .catch((err) => {
      recLog('Error downloading page:', err);
      throw new Error(`Error downloading page: ${err.message}`);
    });
};

export default downloadPage;