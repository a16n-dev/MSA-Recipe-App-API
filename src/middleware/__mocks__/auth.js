const { fbUser1, fbUser2, fbUser3 } = require('../../../tests/fixtures/firebase');

const authCheck = (req, res, next) => {
  if (req.headers.authtoken) {
    if (req.headers.authtoken === 'fb_token_1') {
      req.user = fbUser1;
    } else if (req.headers.authtoken === 'fb_token_2') {
      req.user = fbUser2;
    } else if (req.headers.authtoken === 'fb_token_3') {
      req.user = fbUser3;
    }
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const authObserve = (req, res, next) => {
  if (req.headers.authtoken) {
    if (req.headers.authtoken === 'fb_token_1') {
      req.user = fbUser1;
    } else if (req.headers.authtoken === 'fb_token_2') {
      req.user = fbUser2;
    } else if (req.headers.authtoken === 'fb_token_3') {
      req.user = fbUser3;
    }
    next();
  } else {
    next();
  }
};

module.exports = {
  authCheck,
  authObserve,
};
