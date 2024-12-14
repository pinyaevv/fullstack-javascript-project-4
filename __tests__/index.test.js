import * as fs from 'fs/promises';
import debug from 'debug';
import path, { dirname } from 'path';
import nock from 'nock';
import os from 'os';
import downloadPage from '../src/downloadPage.js';
import { fileURLToPath } from 'url';

const logNock = debug('page-loader:nock');

nock.recorder.rec({
  output_objects: true,
  logging: (data) => {
    if (data && data.method && data.status) {
      logNock(`Request: ${data.method} ${data.url}`);
      logNock(`Response: ${data.status} for ${data.url}`);
    }
  },
});

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
    nock.disableNetConnect();
    nock.cleanAll();
});

afterEach(async () => {
    await fs.rm(tempDir, { recursive: true });
});

test('download page and save it', async () => {
    const url = 'https://ru.hexlet.io/courses';
    const dataFile = await getDataFile('page.html');
    const dataExpected = await getDataFile('expectedPage.html');

    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, dataFile);
    
    try {
      const filePath = await downloadPage(url, tempDir);

      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
        expect(fileExists).toBe(true);

      const fileData = await fs.readFile(filePath, 'utf-8');
      expect(fileData).toBe(dataExpected);
    } catch (error) {
      console.error('Ошибка при скачивании файла courses:', error);
    }
    
});

test('download page, image and other resource', async () => {
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

  nock('https://ru.hexlet.io')
    .get('/assets/application.css')
    .reply(200, '/* CSS content */');

  nock('https://ru.hexlet.io')
    .get('/packs/js/runtime.js')
    .reply(200, '/* JS content */');

  try {
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
  } catch (error) {
    console.error('Ошибка при скачивании файла:', error);
  }
});

test ('handles HTTP error response (404)', async () => {
  const url = 'https://ru.hexlet.io/notfound';

  nock('https://ru.hexlet.io')
    .get('/notfound')
    .reply(404);

  await expect(downloadPage(url, tempDir)).rejects.toThrow('Failed to download resource');
});

test('handles file system error (permission denied)', async () => {
  const url = 'https://ru.hexlet.io';
  
  jest.spyOn(fs, 'writeFile').mockImplementation(() => {
    throw new Error('EACCES: permission denied');
  });

  await expect(downloadPage(url, tempDir)).rejects.toThrow('EACCES: permission denied');
});

test('handles directory creation error', async () => {
  const url = 'https://ru.hexlet.io';
  const errorMessage = 'EACCES: permission denied, mkdir';

  jest.spyOn(fs, 'mkdir').mockImplementation(() => {
    throw new Error(errorMessage);
  });

  await expect(downloadPage(url, tempDir)).rejects.toThrow(errorMessage);

  expect(fs.mkdir).toHaveBeenCalled();
});


test('handles network error', async () => {
  const url = 'https://ru.hexlet.io';

  nock('https://ru.hexlet.io')
    .get('/')
    .replyWithError('Network error');

  await expect(downloadPage(url, tempDir)).rejects.toThrow('Network error');
});