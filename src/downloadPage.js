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
    .replace(/^-/, '')
    .replace(/-$/, '');
  return `${encodeURIComponent(baseName)}${ext}`;
};

const downloadResource = (baseUrl, outputDir, resourceUrl, element, attr, $) => {
  const fullUrl = new URL(resourceUrl, baseUrl).toString();
  const fileName = generateFileName(resourceUrl);
  const filePath = path.join(outputDir, fileName);

  return axios
    .get(fullUrl, { responseType: 'arraybuffer' })
    .then((response) => {
      if (response.status !== 200) {
        return;
      }

      return fs.writeFile(filePath, response.data).then(() => {
        const relativePath = path.posix.join(path.basename(outputDir), fileName);
        $(element).attr(attr, relativePath);
      });
    })
};

const downloadPage = (url, outputDir) => {
  console.log('Debug logging started');
  recLog('Started downloading page', url);
  console.log('Debug logging ended');
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
            const htmlFileName = generateFileName(url);
            const htmlFilePath = path.join(outputDir, 'page-loader', htmlFileName);

            return fs.writeFile(htmlFilePath, $.html(), 'utf-8').then(() => {
              recLog('Page saved to:', htmlFilePath);
              return htmlFilePath;
            });
          });
        });
    })
    .catch((err) => {
      throw new Error(`Error downloading page: ${err.message}`);
    });
};

export default downloadPage;