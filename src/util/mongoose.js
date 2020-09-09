const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
}).then((result) => {
  console.log('mongoose success!');
}).catch((err) => {
  console.log('mongoose fail!');
  console.log(err);
});
