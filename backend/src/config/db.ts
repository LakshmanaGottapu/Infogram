import mongoose from 'mongoose';
import logger from './logger.js';

const options = {
  
  // Timeout settings
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  
  // Connection pool settings
  maxPoolSize: 50,
  minPoolSize: 5,
  waitQueueTimeoutMS: 10000,
  
  // Reconnection and reliability
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  
  // Additional recommended options
  family: 4, // Use IPv4, skip IPv6
};
async function connectDB(){
  logger.info('Connecting to MongoDB...');

  try{
    await mongoose.connect(process.env.MONGO_URI, options);
    // Get the default connection
    const db = mongoose.connection;
    // Event handlers
    db.on('connected', () => {
      logger.info('MongoDB connected successfully!');
      console.log('MongoDB connected!');
    });

    db.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      console.error('MongoDB connection error:', err);
    });

    db.on('disconnected', () => {
      logger.warn('MongoDB disconnected!');
      console.log('MongoDB disconnected!');
      // Optionally attempt to reconnect here
    });

    process.on('beforeExit', async () => {
      logger.info('Node process is exiting, closing MongoDB connection...');
      console.log('Node process is exiting, closing MongoDB connection...');
      await db.close(true);
    })
  }
  catch(e){
      logger.error('MongoDB connection error: ', e);
      // If the connection fails, log the error and exit the process
      console.log('MongoDB connection error: ', e);
      logger.error('Exiting process due to MongoDB connection failure.');
      console.error('Exiting process due to MongoDB connection failure.');
      process.exit(1);
  }
}



// If the Node process ends, close the Mongoose connection
// process.on('SIGINT', () => {
//   db.close(() => {
//     console.log('MongoDB connection disconnected through app termination');
//     process.exit(0);
//   });
// });
// export default createDBConnection;

export default connectDB;