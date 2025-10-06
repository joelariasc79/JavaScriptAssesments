const mongoose = require('mongoose');
const UserModel = require('../dataModel/userDataModel'); // Adjust the path as needed

// Replace with your MongoDB connection string
const mongoURI = 'mongodb://localhost:27017/your_database_name';

const insertAdminUser = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected successfully.');

        // Check if an admin user already exists to prevent duplicates
        const existingAdmin = await UserModel.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists. No new user was created.');
            mongoose.disconnect();
            return;
        }

        const adminUser = new UserModel({
            username: 'admin',
            email: 'admin@gmail.com',
            password: 'admin', // The pre-save hook will hash this password
            name: 'Admin',
            contact_number: '555-123-4567', // A placeholder number
            role: 'admin'
            // Fields like age, profession, and address are optional for an admin role
        });

        const savedUser = await adminUser.save();
        console.log('Admin user successfully created and saved to the database:', savedUser);

    } catch (error) {
        console.error('Error inserting admin user:', error);
    } finally {
        mongoose.disconnect();
    }
};

insertAdminUser();
