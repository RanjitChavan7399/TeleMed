const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected!'))
  .catch(e => console.error('MongooseError:', e.message));
