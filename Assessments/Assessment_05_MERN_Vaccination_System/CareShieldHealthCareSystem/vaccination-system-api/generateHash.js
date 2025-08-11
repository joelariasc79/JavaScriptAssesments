// generateHash.js
const bcrypt = require('bcryptjs');

const plainPassword = 'admin';
const saltRounds = 10; // A common salt round value

bcrypt.hash(plainPassword, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error hashing password:', err);
    } else {
        console.log('Hashed Password:', hash);
        // Copy this hash value to use in your SQL insert script
    }
});