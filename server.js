const mongoose = require('mongoose');
const dotenv = require('dotenv');

// CONFIG BEFORE IMPORTING APP
dotenv.config({ path: './config.env' });
const app = require('./app');

///////////////
// DATABASE CONNECTION
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.set('strictQuery', false);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => console.log('DB connection successful!'));

///////////////
// START SERVER
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
