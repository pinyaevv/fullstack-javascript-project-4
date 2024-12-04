import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

// Функция для генерации имени файла с учётом расширения
const generateFileName = (resourceUrl) => {
  const ext = path.extname(resourceUrl) || '.html'; // Используем расширение файла, если оно есть
  const baseName = resourceUrl
    .replace(/^https?:\/\//, '')  // Убираем протокол
    .replace(/[^a-zA-Z0-9]/g, '-') // Заменяем все неалфавитные символы на дефисы
    .replace(/-$/, ''); // Убираем дефис в конце
  return `${baseName}${ext}`;
};

// Функция для скачивания ресурса
const downloadResource = (baseUrl, outputDir, resourceUrl, element, attr, $) => {
  const fullUrl = new URL(resourceUrl, baseUrl).toString();
  const fileName = generateFileName(resourceUrl);
  const filePath = path.join(outputDir, fileName);

  return axios
    .get(fullUrl, { responseType: 'arraybuffer' })
    .then((response) => {
      if (response.status !== 200) {
        console.warn(`Resource ${fullUrl} not found, status code: ${response.status}`);
        return;
      }

      // Сохраняем ресурс в локальную папку
      return fs.writeFile(filePath, response.data).then(() => {
        // Обновляем аттрибут элемента с путём к локальному файлу
        const relativePath = path.posix.join(path.basename(outputDir), fileName);
        $(element).attr(attr, relativePath);
        console.log(`Resource downloaded: ${fullUrl}`);
      });
    })
    .catch((err) => {
      console.error(`Error downloading resource ${fullUrl}: ${err.message}`);
    });
};

// Основная функция для скачивания страницы
const downloadPage = (url, outputDir) => {
  console.log(`Started downloading page: ${url}`);
  return axios
    .get(url)
    .then((response) => {
      const pageContent = response.data;
      const $ = cheerio.load(pageContent);

      const dirName = url
        .replace(/^https?:\/\//, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .concat('_files');
      const resourcesDir = path.join(outputDir, dirName);

      // Создаем папку для ресурсов
      return fs
        .mkdir(resourcesDir, { recursive: true })
        .then(() => {
          const downloadPromises = [];

          // Преобразуем все локальные ресурсы (собираем ресурсы из link, script и img)
          $('link[href], script[src], img[src]').each((_, element) => {
            const attr = $(element).is('link') || $(element).is('script') ? 'href' : 'src';
            const resourceUrl = $(element).attr(attr);

            // Загружаем все ресурсы, преобразуя относительные URL в абсолютные
            if (resourceUrl) {
              downloadPromises.push(
                downloadResource(url, resourcesDir, resourceUrl, element, attr, $)
              );
            }
          });

          // Ждем загрузки всех ресурсов, затем сохраняем HTML страницу
          return Promise.all(downloadPromises).then(() => {
            const fileName = generateFileName(url);
            const filePath = path.join(outputDir, fileName);

            return fs.writeFile(filePath, $.html(), 'utf-8').then(() => {
              console.log(`Page saved: ${filePath}`);
              return filePath;
            });
          });
        });
    })
    .catch((err) => {
      console.error(`Error downloading page: ${err.message}`);
      throw new Error(`Error downloading page: ${err.message}`);
    });
};

export default downloadPage;