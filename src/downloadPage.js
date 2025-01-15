import axios from '../debug/debug-axios.js';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import debug from 'debug';
import Listr from 'listr';

const recLog = debug('page-loader');

const generateFileName = (resourceUrl) => {
  const ext = path.extname(resourceUrl) || '.html';
  const baseName = resourceUrl
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${encodeURIComponent(baseName)}${ext}`;
};

// Александр, на данный момент вроде все работает, но выдаёт новую ошибку - https://github.com/pinyaevv/fullstack-javascript-project-4/actions/runs/12789585482/job/35653341807#step:3:181
// Я опять попробовал загружать различные ресурсы, иногда возникает проблема с зависшими запросами. Может проблема в этом?
//  ✔ Downloading: /assets/photoswipe-2d378d82.css
// ⠹ Downloading: /assets/index-31944ff4.css
// ⠹ Downloading: /assets/favicon.ico
// ⠹ Downloading: /assets/favicon-16x16.png
// Толи они не успевают загружаться, толи с сервером что-то.. Я попробовал установить таймаут и ограничил параллельную загрузку до 10 задача(файлов). Но проблема не решилась.

const downloadResource = (baseUrl, outputDir, resourceUrl, element, attr, $, resourcesDir) => {
  const fullUrl = new URL(resourceUrl, baseUrl).toString();
  const fileName = generateFileName(resourceUrl);
  const isHtml = path.extname(fileName) === '.html';
  const filePath = isHtml ? path.join(outputDir, fileName) : path.join(resourcesDir, fileName);

  const axiosConfig = {
    responseType: 'arraybuffer',
    timeout: 10000,
  };

  return axios
    .get(fullUrl, axiosConfig)
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
      const errorMessage = `Error downloading resource: ${fullUrl}, ${err.message}`;
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

      return fs.access(resourcesDir) // а зачем запрещать создавать папку для хранения? Т.е. по условию папка в которую мы будем загружать должна уже быть создана. Мы сами выбираем и создаём её?
        .catch(() => { return fs.mkdir(resourcesDir) })
        .then(() => {
          const downloadTasks = [];
          const pageOrigin = new URL(url).origin;

          $('link[href], script[src], img[src]').each((_, element) => {
            const attr = $(element).is('link') || $(element).is('script') ? 'href' : 'src';
            const resourceUrl = $(element).attr(attr);

            if (!resourceUrl) {
              return;
            };

            const fullUrl = new URL(resourceUrl, url).toString();

            if (fullUrl.startsWith(pageOrigin)) {
              const task = {
                title: `Downloading: ${resourceUrl}`,
                task: () => downloadResource(url, outputDir, resourceUrl, element, attr, $, resourcesDir)
                  .catch((err) => {
                    console.error(`Error downloading resource: ${resourceUrl}, ${err.message}`);
                  }),
              };
              downloadTasks.push(task);
            }
          });

          const tasks = new Listr(downloadTasks, {
            concurrent: 10,
            exitOnError: false,
          });

          recLog('Starting to download resources for page:', url);
          return tasks.run()
        })
        .then(() => {
          const htmlFileName = generateFileName(url);
          const htmlFilePath = path.join(outputDir, htmlFileName);

          return fs.writeFile(htmlFilePath, $.html(), 'utf-8').then(() => {
            recLog('Page saved to:', htmlFilePath);
            return htmlFilePath;
          });
        });
    });
};

export default downloadPage;