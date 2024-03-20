const fs = require('fs');
const sharp = require('sharp');
const sharpFullHD = sharp();

const generalName = 'gImg_';

const width = 1200;
const height = 1200;

// cover for normal resizing
// inside for keeping dimensions
const options = {
  fit: 'cover',
  // background: '#ffffff',
};
// const width = 1200;
// const height = 800;

function makeProceccedDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

const path = __dirname + '/images';
const outputPath = path + '/processed';
const extraName = '';

fs.readdir(path, (err, items) => {
  if (err || items.length === 0) return;
  makeProceccedDir(outputPath);
  console.log(items.length);
  processImage(items);
});

// TODO: add possible count in naming
// let count;
const processImage = async function (restArr) {
  // count = count || 0;
  // `${generalName}.${name[1]}` ||
  if (restArr.length === 0) return;
  const img = restArr.shift();
  if (!/\.(gif|jpg|jpeg|tif|tiff|png|webp|jfif)$/i.test(img))
    return processImage(restArr);
  let name = img.split('.');
  console.log(name);
  name = `${name[0]}${extraName}.jpg`
    .replace(/ /g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '');

  sharp(`${path}/${img}`)
    .flatten({ background: '#ffffff' })
    .resize(width, height, options)
    .toFile(`${outputPath}/${name}`, (err, info) => {
      if (err) {
        console.log(err);
        throw new Error();
      }
      return processImage(restArr);
    });
};

// 1920x1080  ->  1280x720
// 1920x1280  ->  1280x853,33333
