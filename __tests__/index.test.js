import fs from 'fs/promises';
import debug from 'debug';
import path, { dirname } from 'path';
import nock from 'nock';
import os from 'os';
import downloadPage from '../src/downloadPage.js';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

const logNock = debug('page-loader:nock');
nock.disableNetConnect();

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
console.log('tempDir:', tempDir);

beforeEach(async () => {
  console.log('Before creating tempDir', tempDir);
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  console.log('TempDir Path created:', tempDir);
  nock.cleanAll();
  jest.spyOn(process, 'exit').mockImplementation(() => {});
});

afterEach(async () => {
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true });
  }
  jest.restoreAllMocks();
});

test('download page and save it', async () => {
  console.log('tempDir inside test:', tempDir);
  const url = 'https://ru.hexlet.io/courses';
  const dataFile = await getDataFile('page.html');
  const dataExpected = await getDataFile('expectedPage.html');

  const normalizedDataExpected = normalizeHtml(dataExpected);
  
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, dataFile);

  await downloadPage(url, tempDir);

  const pageLoaderDir = path.join(tempDir, 'page-loader');

  console.log('Checking existence of page-loader directory at:', pageLoaderDir);

  const pageLoaderExists = await fs
    .access(pageLoaderDir) 
    .then(() => true)
    .catch(() => false);
  console.log(`page-loader directory exists:`, pageLoaderExists);
  expect(pageLoaderExists).toBe(true);

  const htmlFileName = generateFileName(url);
  const htmlFilePath = path.join(pageLoaderDir, htmlFileName);

  const fileExists = await fs
    .access(htmlFilePath) 
    .then(() => true)
    .catch(() => false);
  console.log(`File exists at ${htmlFilePath}:`, fileExists);
  expect(fileExists).toBe(true);

  const fileData = await fs.readFile(htmlFilePath, 'utf-8');
  const normalizedFileData = normalizeHtml(fileData);

  expect(normalizedFileData).toBe(normalizedDataExpected);
});

test('handles HTTP error response (404)', async () => {
  const url = 'https://ru.hexlet.io/notfound';

  nock('https://ru.hexlet.io')
    .get('/notfound')
    .reply(404);
  
  nock('https://fonts.googleapis.com')
    .get('/some-resource')
    .reply(404, 'Not Found');

  nock('https://fonts.gstatic.com')
    .get('/some-resource')
    .reply(404, 'Not Found');

    try {
      await downloadPage(url, tempDir);
    } catch (e) {
      expect(e.message).toMatch(/Failed to download resource/);
      expect(process.exit).toHaveBeenCalledWith(1);
    }
});

test('handles file system error (permission denied)', async () => {
  const url = 'https://ru.hexlet.io';

  jest.spyOn(fs, 'writeFile').mockImplementation(() => {
    throw new Error('EACCES: permission denied');
  });

  try {
    await downloadPage(url, tempDir);
  } catch (e) {
    expect(e.message).toMatch(/EACCES: permission denied/);
    expect(process.exit).toHaveBeenCalledWith(1);
  }
});

test('handles directory creation error', async () => {
  const url = 'https://ru.hexlet.io';
  const errorMessage = 'EACCES: permission denied, mkdir';

  jest.spyOn(fs, 'mkdir').mockImplementation(() => {
    throw new Error(errorMessage);
  });

  try {
    await downloadPage(url, tempDir);
  } catch (e) {
    expect(e.message).toMatch(/EACCES: permission denied/);
    expect(process.exit).toHaveBeenCalledWith(1);
  }
});

test('handles network error', async () => {
  const url = 'https://ru.hexlet.io';

  nock('https://ru.hexlet.io')
    .get('/')
    .replyWithError('Network error');

    try {
      await downloadPage(url, tempDir);
    } catch (e) {
      expect(e.message).toMatch(/Network error/);
      expect(process.exit).toHaveBeenCalledWith(1);
    }
});