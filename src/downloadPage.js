import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

const downloadPage = (url, outputDir) => {
  const { hostname, protocol } = new URL(url);
  return axios.get(url)
    .then((response) => {
      const pageContent = response.data;

      const $ = cheerio.load(pageContent);
      
      const dirName = url
        .replace(/^https?:\/\//, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .concat('_files');

      const dir = path.join(outputDir, dirName);

      return fs.mkdir(dir, { recursive: true })
        .then(() => {
          const images = $('img').toArray();

          const imageDownload = images.map((img) => {
            let imgUrl = $(img).attr('src');

            if (imgUrl && imgUrl.startsWith('/')) {
              imgUrl = `${protocol}//${hostname}${imgUrl}`;
            }

            if (imgUrl) {
              const imgName = imgUrl
                .replace(/^https?:\/\//, '')
                .replace(/[^a-zA-Z0-9]/g, '-')
                .replace(/-\w+$/, '')
                + path.extname(imgUrl);

              const imgPath = path.join(dir, imgName);

              return axios.get(imgUrl, { responseType: 'arraybuffer' })
                .then((imageResponse) => {
                  return fs.writeFile(imgPath, imageResponse.data)
                    .then(() => {
                      const relativePath = path.posix.join(path.basename(dir), imgName);
                      $(img).attr('src', relativePath);
                    });
                })
                .catch((err) => {
                  console.error(`Ошибка скачивания изображения ${imgUrl}: ${err.message}`);
                  return Promise.reject(err);
                });
            }
          });

          return Promise.all(imageDownload)
            .then(() => {
              const fileName = url
                .replace(/^https?:\/\//, '')
                .replace(/[^a-zA-Z0-9]/g, '-')
                .concat('.html');

              const filePath = path.join(outputDir, fileName);

              return fs.writeFile(filePath, $.html(), 'utf-8')
                .then(() => filePath);
            });
        });
    })
    .catch((err) => {
      return Promise.reject(new Error(`Ошибка при скачивании страницы: ${err.message}`));
    });
};

export default downloadPage;