import axios from '../debug/debug-axios.js';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import debug from 'debug';
import Listr from 'listr';

const recLog = debug('page-loader');

const generateFileName = (resourceUrl) => {
  const parsedUrl = new URL(resourceUrl);
  const ext = path.extname(parsedUrl.pathname) || '.html';

  let baseName = resourceUrl
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9.]/g, '-')
    .replace(/^-+|-+$/g, '');

  if (ext !== '.html') {
    baseName = baseName.slice(0, -ext.length).replace(/\./g, '-');
  }

  return `${encodeURIComponent(baseName)}${ext}`;
};

const downloadResource = (baseUrl, outputDir, resourceUrl, element, attr, $, resourcesDir) => {
  const fullUrl = new URL(resourceUrl, baseUrl).toString();
  const fileName = generateFileName(resourceUrl);
  const isHtml = path.extname(fileName) === '.html';
  const filePath = isHtml ? path.join(outputDir, fileName) : path.join(resourcesDir, fileName);

  return axios
    .get(fullUrl, { responseType: 'arraybuffer' })
    .then((response) => {
      if (response.status !== 200) {
        const errorMessage = `Failed to download resource: ${fullUrl} with status: ${response.status}`;
        console.error(errorMessage);
        process.exit(1);
      }

      return fs.writeFile(filePath, response.data)
        .then(() => {
          const relativePath = isHtml
            ? fileName
            : path.posix.join(path.basename(resourcesDir), fileName);
          $(element).attr(attr, relativePath);
          recLog(`Resource saved: ${filePath}`);
        })
        .catch((err) => {
          const errorMessage = `Error writing resource to file: ${filePath}, ${err.message}`;
          console.error(errorMessage);
          process.exit(1);
        });
    })
    .catch((err) => {
      const errorMessage = `Network error while downloading resource: ${fullUrl}, ${err.message}`;
      console.error(errorMessage);
      process.exit(1);
    });
};

const downloadPage = (url, outputDir = '') => {
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

      return fs.access(resourcesDir)
        .catch(() => fs.mkdir(resourcesDir))
        .then(() => {
          const downloadTasks = [];
          const pageOrigin = new URL(url).origin;

          $('link[href], script[src], img[src]').each((_, element) => {
            const attr = $(element).is('link') || $(element).is('script') ? 'href' : 'src';
            const resourceUrl = $(element).attr(attr);

            if (!resourceUrl) {
              return;
            }

            const fullUrl = new URL(resourceUrl, url).toString();

            if (fullUrl.startsWith(pageOrigin)) {
              const task = {
                title: `Downloading: ${resourceUrl}`,
                task: () => downloadResource(url, outputDir, resourceUrl, element, attr, $, resourcesDir)
                  .catch((err) => {
                    console.error(`Error downloading resource: ${resourceUrl}, ${err.message}`);
                    throw err;
                  }),
              };
              downloadTasks.push(task);
            }
          });

          const tasks = new Listr(downloadTasks, {
            concurrent: true,
            exitOnError: false,
          });

          recLog('Starting to download resources for page:', url);
          return tasks.run();
        })
        .then(() => {
          const htmlFileName = generateFileName(url);
          const htmlFilePath = path.join(outputDir, htmlFileName);

          return fs.writeFile(htmlFilePath, $.html(), 'utf-8').then(() => {
            recLog('Page saved to:', htmlFilePath);
            return htmlFilePath;
          });
        });
    })
    .catch((err) => {
      console.error(`Error downloading page: ${url}, ${err.message}`);
      process.exit(1);
    });
};

export default downloadPage;