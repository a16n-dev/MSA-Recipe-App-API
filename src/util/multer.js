const multer = require('multer');

const upload = multer({
  limits: {
    fileSize: 8000000,
  },
  // eslint-disable-next-line consistent-return
  fileFilter(req, file, cb) {
    if (!file.originalname.toLowerCase().match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error('Please upload an image'));
    }

    cb(undefined, true);
  },
});

module.exports = upload;
