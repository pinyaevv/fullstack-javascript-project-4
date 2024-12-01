import fs from 'fs/promises';
import path, { dirname } from 'path';
import nock from 'nock';
import os from 'os';
import downloadPage from '../src/downloadPage.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const getDataFile = async (filename) => {
  const data = await fs.readFile(getFixturePath(filename), 'utf-8');
  return data;
};

const normalizeHtml = (html) => html.replace(/\s+/g, '').trim();

let tempDir;

beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

afterEach(async () => {
    await fs.rm(tempDir, { recursive: true });
});

test('download page and save it', async () => {
    const url = 'https://ru.hexlet.io/courses';
    const dataExpected = '<html><head></head><body>Content</body></html>';

    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, dataExpected);
    
    const filePath = await downloadPage(url, tempDir);
    const fileExists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);

    const fileData = await fs.readFile(filePath, 'utf-8');
    expect(fileData).toBe(dataExpected);
});

test('download another page and save it', async () => {
    const url = 'https://ru.hexlet.io/another-courses';
    const dataExpected = '<html><head></head><body>Another content</body></html>';

    nock('https://ru.hexlet.io')
      .get('/another-courses')
      .reply(200, dataExpected);
    
    const filePath = await downloadPage(url, tempDir);
    const fileExists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);

    const fileData = await fs.readFile(filePath, 'utf-8');
    expect(fileData).toBe(dataExpected);
});

test('download page and image', async () => {
  const url = 'https://ru.hexlet.io/courses';
  const dataFile = await getDataFile('page.html');
  const dataExpected = await getDataFile('expectedPage.html');
  const imageBuffer = await getDataFile('ru-hexlet-io-courses_files/nodejs.png');
  const pathFileImage = path.join(
    tempDir, 
    'ru-hexlet-io-courses_files', 
    'ru-hexlet-io-assets-professions-nodejs.png');

  nock('https://ru.hexlet.io')
    .get('/assets/professions/nodejs.png')
    .reply(200, imageBuffer);

  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, dataFile);
  
  const filePath = await downloadPage(url, tempDir);
  
  const fileExists = await fs
    .access(pathFileImage)
    .then(() => true)
    .catch(() => false);
  expect(fileExists).toBe(true);

  const fileData = await fs.readFile(filePath, 'utf-8');
  expect(normalizeHtml(fileData)).toBe(normalizeHtml(dataExpected));

  const updatedHtml = await fs.readFile(filePath, 'utf-8');
  expect(updatedHtml).toContain('ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png');
});

test('downloading other resources', async () => {
  const url = 'https://ru.hexlet.io/courses';
  const dataFile = await getDataFile('page.html');
  const dataFileExpected = await getDataFile('expectedPage.html');
  const cssFile = await getDataFile('ru-hexlet-io-courses_files/application.css');
  const jsFile = await getDataFile('ru-hexlet-io-courses_files/rutime.js');

  const pathFileCss = path.join(
    tempDir,
    'ru-hexlet-io-courses_files',
    'ru-hexlet-io-assets-application.css');

  const pathFileJs = path.join(
    tempDir,
    'ru-hexlet-io-courses_files',
    'ru-hexlet-io-packs-js-runtime.js');

  nock(url)
    .get('/assets/application.css')
    .reply(200, cssFile);

  nock(url)
    .get('packs/js/runtime.js')
    .reply(200, jsFile);

  const filePath = await downloadPage(url, tempDir);

  const fileExistsCss = await fs
    resource.access([pathFileCss, pathFileJs])
    .then(() => true)
    .catch(() => false);
    expect(fileExistsCss).toBe(true);

  const fileData = await fs.readFile(filePath, 'utf-8');
  expect(normalizeHtml(fileData)).toBe(normalizeHtml(dataFile));

  const updatedHtml = await fs.readFile(fileData, 'utf-8');
  expect(normalizeHtml(updatedHtml)).toBe(normalizeHtml(dataFileExpected));
});