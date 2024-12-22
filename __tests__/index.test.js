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

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
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
  const dataFile = await getDataFile('page.html');
  const dataExpected = await getDataFile('expectedPage.html');

  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, dataFile);

  const filePath = path.join(__dirname, '../__fixtures__/expectedPage.html');

  let fileExists = false;
  try {
    await fs.access(filePath);
    fileExists = true;
  } catch (err) {
    console.error('Error checking file existence:', err);
    fileExists = false;
  }
  expect(fileExists).toBe(true);

  const fileData = await fs.readFile(filePath, 'utf-8');
  
  expect(normalizeHtml(fileData)).toEqual(normalizeHtml(dataExpected));
});

test('HTTP error handling (404)', async () => {
  const url = 'https://ru.hexlet.io/';

  nock('https://cdn2.hexlet.io')
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

test('network error handling', async () => {
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

// Александр, тестов скорее всего не хватает. Попробую успеть добавить до вашей первой обратной связи. Отправляю так, поскольку отстаю от графика.
// Я понимаю, что тесты должны обращаться четко к фикстуре как например сделано у меня в тесте 'download page and save it'.
// И видимо где-то в основной логике downloadPage.js есть ошибка, поскольку мне не удалось добиться чтобы он скачивал только локальные ресурсы.
// Точнее он скачивает локальные, но по тесту я вижу, что обращается к другим хостам (cdn2.hexlet.io, kz.hexlet.io/). Хотя в тесте я их мокировал через nock(возможно не верно).
// И вообще должен ли код в данном проекте обращаться к реальным страницам? Или нужно делать чтобы не только тест, но и сам код обращался по переданному пути в фикстуру?
// Также ещё добавлю тест на проверку сохранения изображений.