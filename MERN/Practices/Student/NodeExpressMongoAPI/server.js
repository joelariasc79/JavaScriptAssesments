let express = require('express')
const app = express() //when we invoke it creates an express application which helps to build a web server

const defaultRoute = require("./route/defaultRoute")
const deafultApp = express();

const studentRoute = require("./route/studentRoute")
const userApp = express();
const cors = require("cors");

globalThis.rootPath = __dirname
 
//allowing the cross origin resource sharing
app.use(cors())//using cors middleware to allow resource sharing with different ports in localhost

//setting up the middleware static to handle all the static files we need to serve to client
// serve static files like images css using static middleware 
app.use('/static', express.static('public')) //localhost:9000/static/alert_info.js

//json middle-ware for setting request content type to json in body
app.use(express.json({limit:'2mb', extended:false})); 


app.use("/student", userApp)
userApp.use("/",studentRoute)


app.use("/", deafultApp) //=>  app.use("/student", studentApp) 
deafultApp.use("/",defaultRoute) //redirecting all requests to default route to get served


console.log("Rest API is listening at 9000")
app.listen(9000)



//
//
// // server.js (or app.js)
//
// const express = require('express');
// const cors = require('cors');
// const bcrypt = require('bcryptjs'); // For password hashing
// const jwt = require('jsonwebtoken'); // For creating JSON Web Tokens
//
// const app = express();
// const PORT = process.env.PORT || 5000;
//
// // --- Middleware ---
// app.use(cors()); // Enable CORS for all origins (for development)
// app.use(express.json()); // Enable parsing of JSON request bodies
//
// // --- Simulated Database (In-memory array for demonstration) ---
// // In a real MERN app, this would be a MongoDB collection
// const users = []; // Stores user objects: { id, name, email, passwordHash }
//
// // --- JWT Secret (DO NOT USE HARDCODED SECRET IN PRODUCTION) ---
// const JWT_SECRET = 'your_super_secret_jwt_key'; // Replace with a strong, random key in production!
//
// // --- Routes ---
//
// // 1. Student Sign Up
// app.post('/api/signup', async (req, res) => {
//     const { name, email, password } = req.body;
//
//     if (!name || !email || !password) {
//         return res.status(400).json({ message: 'All fields are required.' });
//     }
//
//     // Check if user already exists
//     if (users.some(user => user.email === email)) {
//         return res.status(409).json({ message: 'Email already registered.' });
//     }
//
//     try {
//         // Hash password
//         const salt = await bcrypt.genSalt(10);
//         const passwordHash = await bcrypt.hash(password, salt);
//
//         // Create new user object (simulated DB entry)
//         const newUser = {
//             id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1, // Simple ID generation
//             name,
//             email,
//             passwordHash,
//         };
//         users.push(newUser);
//
//         console.log('New user registered:', newUser.email);
//         // console.log('Current users in DB:', users); // For debugging
//
//         res.status(201).json({ message: 'Registration successful!' });
//
//     } catch (error) {
//         console.error('Signup error:', error);
//         res.status(500).json({ message: 'Server error during registration.' });
//     }
// });
//
// // 2. Student Sign In
// app.post('/api/signin', async (req, res) => {
//     const { email, password } = req.body;
//
//     if (!email || !password) {
//         return res.status(400).json({ message: 'Email and password are required.' });
//     }
//
//     // Find user by email
//     const user = users.find(u => u.email === email);
//     if (!user) {
//         return res.status(401).json({ message: 'Invalid credentials.' });
//     }
//
//     try {
//         // Compare provided password with stored hash
//         const isMatch = await bcrypt.compare(password, user.passwordHash);
//         if (!isMatch) {
//             return res.status(401).json({ message: 'Invalid credentials.' });
//         }
//
//         // Generate JWT token
//         const payload = {
//             user: {
//                 id: user.id,
//                 email: user.email,
//                 name: user.name // Include name in payload for frontend
//             }
//         };
//
//         jwt.sign(
//             payload,
//             JWT_SECRET,
//             { expiresIn: '1h' }, // Token expires in 1 hour
//             (err, token) => {
//                 if (err) throw err;
//                 console.log('Student logged in:', user.email);
//                 res.json({
//                     message: 'Login successful!',
//                     token,
//                     user: {
//                         id: user.id,
//                         name: user.name,
//                         email: user.email
//                     }
//                 });
//             }
//         );
//
//     } catch (error) {
//         console.error('Signin error:', error);
//         res.status(500).json({ message: 'Server error during login.' });
//     }
// });
//
// // --- Start Server ---
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//     console.log('Access signup at: http://localhost:5000/api/signup');
//     console.log('Access signin at: http://localhost:5000/api/signin');
// });