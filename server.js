import app from './src/app.js'
import ConnectDB from './src/db/db.js'
import 'dotenv/config';

app.listen(process.env.PORT , () => {
  console.log(`http://localhost:${process.env.PORT}`);
  ConnectDB();
});