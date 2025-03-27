const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quickbill';
        console.log('Connecting to MongoDB...', mongoURI);
        
        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Test the connection with a simple query
        await mongoose.connection.db.admin().ping();
        console.log('Database ping successful');

        // Handle connection events
        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('Error closing MongoDB connection:', err);
                process.exit(1);
            }
        });

        return conn;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        // Log more details about the error
        if (error.name === 'MongoServerSelectionError') {
            console.error('Could not connect to MongoDB server');
            console.error('Please check:');
            console.error('1. MongoDB is installed and running (mongod process)');
            console.error('2. MongoDB is accepting connections on port 27017');
            console.error('3. If using MongoDB Atlas, check network access and credentials');
            console.error('4. Try connecting to MongoDB locally first');
            console.error('\nTo start MongoDB locally:');
            console.error('1. Install MongoDB Community Edition');
            console.error('2. Run: mongod --dbpath /data/db');
            console.error('3. Verify MongoDB is running: mongo or mongosh');
        }
        process.exit(1);
    }
};

module.exports = connectDB;