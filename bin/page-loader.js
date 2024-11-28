#!/usr/bin/env node

import { program } from 'commander';
import downloadPage from '../src/downloadPage.js';

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .option('-o, --output <dir>', 'output dir', process.cwd())
  .argument('<url>', 'URL to download')
  .action((url, options) => {
    const outputDir = options.output || process.cwd();
    downloadPage(url, outputDir)
      .then((filePath) => {
        console.log(`Page was successfully download into ${filePath}`);  // Выводим путь сохраненной страницы
      })
      .catch((err) => {
        console.error(`Error: ${err.message}`);  // Логируем ошибку, если она есть
      });
  });

program.parse();
