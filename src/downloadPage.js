import axios from '../debug/debug-axios.js';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import debug from 'debug';
import Listr from 'listr';
import { urlToFilename, urlToDirname, getExtension } from './utils.js';

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
        console.error(`Failed to download resource: ${fullUrl} with status: ${response.status}`);
        return;
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
          console.error(`Error writing resource to file: ${filePath}, ${err.message}`);
          process.exit(1);
        });
    })
    .catch((err) => {
      console.error(`Failed to download resource: ${fullUrl}, ${err.message}`);
      process.exit(1);
    });
};

const downloadPage = (url, outputDir = '') => {
  recLog('Started downloading page', url);

  const parsedUrl = new URL(url);
  const slug = (parsedUrl.hostname + parsedUrl.pathname);
  const fileName = urlToFilename(slug);
  const fullOutputDirname = path.join(outputDir, fileName);
  const extension = getExtension(fileName) === '.html' ? '' : '.html';
  const fullOutputFilename = path.join(fullOutputDirname, fileName + extension);
  const assetsDirname = urlToDirname(slug);
  const fullOutputAssetsDirname = path.join(fullOutputDirname, assetsDirname);

  let pageData = '';

  return axios.get(url)
    .then((response) => {
      recLog('Page downloaded');

      pageData = preparedAssets(parsedUrl.origin, assetsDirname, response.data);

      recLog(`Checking if assets directory: ${fullOutputAssetsDirname}`);
      return fs.access(fullOutputAssetsDirname)
        .catch(() => {
          recLog(`Creating assets directory: ${fullOutputAssetsDirname}`);
          return fs.mkdir(fullOutputAssetsDirname);
        })
        .then(() => pageData);
    })
    .then(() => {
      recLog(`Saving HTML to ${fullOutputFilename}`);
      return fs.writeFile(fullOutputFilename, pageData);
    })
};

export default downloadPage;