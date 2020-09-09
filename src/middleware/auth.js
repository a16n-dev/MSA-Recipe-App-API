const admin = require('firebase-admin');

const serviceAccount = require('./fbServiceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://recipe-app-f83d1.firebaseio.com',
});

const authCheck = (req, res, next) => {
  if (req.headers.authtoken) {
    admin
      .auth()
      .verifyIdToken(req.headers.authtoken)
      .then((result) => {
        req.user = result;
        next();
      })
      .catch((error) => console.log(error));
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = authCheck;
