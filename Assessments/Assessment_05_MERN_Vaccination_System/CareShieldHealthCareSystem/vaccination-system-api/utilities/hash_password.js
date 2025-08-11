const bcrypt = require('bcryptjs'); // Ensure you have bcryptjs installed: npm install bcryptjs

async function hashPassword() {
    const plainPassword = 'admin';
    const saltRounds = 10; // Use the same salt rounds as in your UserSchema.pre('save') hook
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    console.log(hashedPassword);
}

hashPassword();