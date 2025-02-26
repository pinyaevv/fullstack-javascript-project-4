import axios from '../debug/debug-axios.js';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import debug from 'debug';
import Listr from 'listr';
import { urlToFilename, urlToDirname, getExtension } from './utils.js';

const recLog = debug('page-loader');

const mapping = {
  link: 'href',
  script: 'src',
  img: 'src',
};

const preparedAssets = (website, baseDirname, htmlData) => {
  const $ = cheerio.load(htmlData, { decodeEntities: false });
  const assets = [];

  Object.entries(mapping).forEach(([tagName, attrName]) => {
    const $elements = $(tagName).toArray();
    const elementsWithUrls = $elements.map((element) => $(element))
      .filter(($element) => $element.attr(attrName))
      .map(($element) => ({ $element, url: new URL($element.attr(attrName), website) }))
      .filter(({ url }) => url.origin === website);

      elementsWithUrls.forEach(({ $element, url }) => {
        const slug = urlToFilename(`${url.hostname}${url.pathname}`);
        const filepath = path.join(baseDirname, slug);
        assets.push({ url, filename: slug });
        $element.attr(attrName, filepath);
      });
  });
  
  return { html: $.html(), assets };
};

const downloadAsset = (dirname, { filename, url }) => {
  return axios.get(url.toString(), { responseType: 'arraybuffer' })
    .then((response) => {
      const fullPath = path.join(dirname, filename);
      return fs.writeFile(fullPath, response.data);
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
          return fs.mkdir(fullOutputAssetsDirname, { recursive: true });
        });
    })
    .then(() => {
      recLog(`Saving HTML to ${fullOutputFilename}`);
      return fs.writeFile(fullOutputFilename, pageData.html);
    })
    .then(() => {
      const tasks = new Listr(pageData.assets.map((asset) => ({
        title: asset.url.toString(),
        task: () => {
          recLog(`Strating dowloading ${asset.fileName}`);
          return downloadAsset(fullOutputAssetsDirname, asset);
        }
      })));
      return tasks.run();
    })
    .catch((error) => {
      recLog('Error loading page and resources:', error);
      throw new Error('Failed to load page');
    });
};

export default downloadPage;