import fs from 'fs';
import path from 'path';
import nock from 'nock';
import os from 'os';
import downloadPage from './src/downloadPage.js';

let tempDir;

beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

afterEach(async () => {
    await fs.promise.rm(tempDir, { recursive: true });
});

test('download page and save it', async () => {
    const url = 'https://ru.hexlet.io/courses';
    const dataExpected = '<html><body>Content</html></body>';

    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, dataExpected);
    
    const filePath = await downloadPage(url, tempDir);
    const fileExists = await fs.promises
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);

    const fileData = await fs.promises.readFile(filePath, 'utf-8');
    expect(fileData).toBe(dataExpected);
});

test('download another page and save it', async () =>{
    const url = 'https://ru.hexlet.io/another-courses';
    const dataExpected = '<html><body>Another content</html></body>';

    nock('https://ru.hexlet.io')
      .get('/another-courses')
      .reply(200, dataExpected);
    
    const filePath = await downloadPage(url, tempDir);
    const fileExists = await fs.promises
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);

    const fileData = await fs.promises.readFile(filePath, 'utf-8');
    expect(fileData).toBe(dataExpected);
});