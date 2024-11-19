#!/usr/bin/env node

import { program } from 'commander';
import downloadPage from '../src/downloadPage.js';

program
  .name('pageloader')
  .description('Page loader utility')
  .version('1.0.0')
  .option('-o, --output <dir>', 'output dir', process.cwd())
  .argument('<url>', 'URL to download')
  .action((url, option) => {
    downloadPage(url, option.output)
    .then((filePath) => console.log(filePath))
    .catch((err) => console.error(err.message));
  });

  program.parse();