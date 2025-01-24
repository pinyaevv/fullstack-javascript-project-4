#!/usr/bin/env node

import { program } from 'commander';
import downloadPage from '../index.js';
import path from 'path';

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .argument('<url>', 'URL to download')
  .action((url, options) => {
    const outputDir = path.resolve(options.output);
    downloadPage(url, outputDir)
      .then((filePath) => {
        console.log(`Page was successfully download into ${filePath}`);
      })
      .catch((err) => {
        console.error(`Error downloading page: ${err.message}`);
        process.exit(1);
      });
  });

program.parse();
