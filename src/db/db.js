import mongoose from "mongoose";

const ConnectDB = async () => {
  try {
    const conn =  await mongoose.connect(process.env.DB_URL, {
            dbName: 'database' 
        });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default ConnectDB