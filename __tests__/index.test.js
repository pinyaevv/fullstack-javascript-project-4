import fs from 'fs/promises';
import path, { dirname, join } from 'path';
import nock from 'nock';
import os from 'os';
import downloadPage from '../src/downloadPage.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getFixturePath = (filename) => join(__dirname, '..', '__fixtures__', filename);
const getDataFile = (filename) => fs.readFileSync(getFixturePath(filename), 'utf-8');

let tempDir;

beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

afterEach(async () => {
    await fs.rm(tempDir, { recursive: true });
});

test('download page and save it', async () => {
    const url = 'https://ru.hexlet.io/courses';
    const dataExpected = '<html><body>Content</html></body>';

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

test('download another page and save it', async () =>{
    const url = 'https://ru.hexlet.io/another-courses';
    const dataExpected = '<html><body>Another content</html></body>';

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

test('download page and image', async () =>{
  const url = 'https://ru.hexlet.io/courses';
  const dataFile = getDataFile('page.html');
  const dataExpected = getDataFile('expectedPage.html');
  const pathFileImage = path.join(tempDir, 'ru-hexlet-io-courses_files', 'ru-hexlet-io-assets-professions-nodejs.png');

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
  expect(fileData).toBe(dataExpected);
});