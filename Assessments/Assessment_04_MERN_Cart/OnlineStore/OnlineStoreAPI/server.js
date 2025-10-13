// OnlineStoreAPI/servers.js

require('dotenv').config();
let express = require('express');
const http = require('http'); // Import http and Socket.IO Server
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require("cors");
// const path = require('path'); // Needed for serving static files (if you serve React build)

const app = express();




// *******************************************************************************************
// GET ROUTES
// *******************************************************************************************

// const notification = require('./DataModel/notificationDataModel'); // Corrected path based on your folder structure

// Correctly import userRouter and authenticateToken from the userRoute module
const { userRouter, authenticateToken } = require("./route/userRoute")
const productRoute = require("./route/productRoute")
const cartRoute = require("./route/cartRoute")
const orderRoute = require('./route/orderRoute');
const couponRoute = require('./route/couponRoute');
const notificationService = require('./services/notificationService'); // Corrected path based on your folder structure
const setupScheduledTasks = require('./utils/cronJobs'); // Assuming this path is correct




// ******************************************************************************************
// MIDDLEWARE
// *******************************************************************************************

app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.json({limit:'2mb', extended:false})); // json middle-ware for setting request content type to json in body

// *******************************************************************************************

// Allowing the cross origin resource sharing
// Ensure this CORS config matches your frontend's URL (e.g., http://localhost:3000 for React dev server)
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:9000'], // Add your React dev server URL here
    methods: ['GET', 'POST', 'PUT', 'DELETE'] // Add all methods your API uses
}));

// *******************************************************************************************

// MongoDB Connection (ensure this is only done once)
mongoose.connect('mongodb://localhost:27017/shoppingcartdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

globalThis.rootPath = __dirname;

// *******************************************************************************************

// IF YOU ARE GENERATING THE FRONT END FROM EXPRESS:
// setting up the middleware static to handle all the static files we need to serve to client
// app.use(express.static(path.join(__dirname, '../frontend/build')));

// *******************************************************************************************

// Use the routers
app.use(productRoute);
app.use(cartRoute);
app.use(userRouter);
app.use(orderRoute);
app.use(couponRoute);




// *******************************************************************************************
// JOBS:
// *******************************************************************************************

setupScheduledTasks();




// *******************************************************************************************
// AUTHENTICATION:
// *******************************************************************************************

// Example of a protected route using the authenticateToken middleware
// This route will only be accessible if a valid JWT is provided in the Authorization header.
app.get('/api/protected-data', authenticateToken, (req, res) => {
    // If we reach here, the token is valid, and req.patient contains the decoded payload (userId, username)
    res.status(200).json({ message: `Access granted! Welcome, ${req.user.username}. This is protected data.` });
});




// *******************************************************************************************
// DEFAULT ROUTE
// *******************************************************************************************

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Shopping cart API is running!');
});






// *******************************************************************************************
// WEBSOCKET
// *******************************************************************************************

// --- Socket.IO Integration ---
const server = http.createServer(app); // Create an HTTP server from your Express app

// Initialize Socket.IO server and configure CORS for it
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000'], // Socket.IO also needs CORS configured, match frontend URL
        methods: ['GET', 'POST']
    }
});

// Store connected users (socket.id -> userId string)
const connectedUsers = new Map();



// *******************************************************************************************
// NOTIFICATION SERVICE
// Initialize notification service with the Socket.IO instance and the connectedUsers map
// *******************************************************************************************

notificationService.init(io, connectedUsers);

io.on('connection', (socket) => {
    console.log(`User connected to Socket.IO: ${socket.id}`);

    // Listen for 'setUserId' event from the client to associate a patient with a socket
    socket.on('setUserId', async (userId) => {
        connectedUsers.set(socket.id, userId);
        console.log(`User ${userId} associated with socket ${socket.id}`);

        // Setup static notifications for the patient upon connection/login
        await notificationService.setupStaticNotifications(userId);

        // Also, send the current unread count to the newly connected patient
        const unreadCount = await notificationService.getUnreadNotificationCount(userId);
        socket.emit('notificationCountUpdate', { count: unreadCount });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const userId = connectedUsers.get(socket.id);
        connectedUsers.delete(socket.id);
        console.log(`User disconnected from Socket.IO: ${socket.id} (User: ${userId || 'N/A'})`);
    });

    // --- Example: Handling custom events from client (e.g., chat messages) ---
    socket.on('sendChatMessage', (message) => {
        console.log(`Received chat message from ${socket.id}: "${message}"`);
        // Broadcast the message to all connected clients
        io.emit('newChatMessage', { sender: connectedUsers.get(socket.id) || socket.id, message, timestamp: new Date().toISOString() });
    });
});



// *******************************************************************************************
// --- API Endpoints for Notifications (for Frontend to fetch) ---
// *******************************************************************************************


// Get all notifications for a specific patient
app.get('/api/notifications/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        // Security check: Ensure the token's patient ID matches the requested patient ID
        if (req.user.userId !== userId) { // Assuming req.patient.userId is the string userId
            return res.status(403).json({ message: "Forbidden: You can only view your own notifications." });
        }

        const notifications = await notificationService.getNotifications(userId);
        const unreadCount = notifications.filter(n => !n.read).length;

        res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Failed to fetch notifications." });
    }
});

// Get unread notification count for a specific patient
app.get('/api/notifications/count/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        // Security check: Ensure the token's patient ID matches the requested patient ID
        if (req.user.userId !== userId) {
            return res.status(403).json({ message: "Forbidden: You can only view your own notification count." });
        }
        const unreadCount = await notificationService.getUnreadNotificationCount(userId);
        res.status(200).json({ count: unreadCount });
    } catch (error) {
        console.error("Error fetching unread notification count:", error);
        res.status(500).json({ message: "Failed to fetch unread notification count." });
    }
});


// Mark a notification as read
app.put('/api/notifications/:notificationId/read', authenticateToken, async (req, res) => {
    try {
        const notificationId = req.params.notificationId;
        const notification = await notificationService.markNotificationAsRead(notificationId);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found." });
        }
        // Optional Security Check: Ensure the notification belongs to the authenticated patient
        if (notification.userId && req.user.id && notification.userId.toString() !== req.user.id.toString()) {
            // Assuming req.patient.id is the ObjectId and notification.userId is also ObjectId
            return res.status(403).json({ message: "Forbidden: You can only mark your own notifications as read." });
        }
        res.status(200).json({ message: "Notification marked as read.", notification });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ message: "Failed to mark notification as read." });
    }
});

// Clear (delete) notifications for a specific patient (new API)
app.delete('/api/notifications/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        const type = req.query.type; // Optional query parameter for type

        // Security check: Ensure the token's patient ID matches the requested patient ID
        if (req.user.userId !== userId) {
            return res.status(403).json({ message: "Forbidden: You can only clear your own notifications." });
        }

        const result = await notificationService.clearUserNotifications(userId, type);

        if (result.deletedCount > 0) {
            res.status(200).json(result);
        } else {
            // If deletedCount is 0, it means either no notifications matched, or patient not found/invalid ID
            // The service already logs warnings for patient not found/invalid ID cases.
            res.status(200).json({ deletedCount: 0, message: "No notifications found to clear or patient not found." });
        }
    } catch (error) {
        console.error("Error clearing patient notifications:", error);
        res.status(500).json({ message: "Failed to clear notifications." });
    }
});


// *******************************************************************************************
// --- REST API Endpoints to Trigger Notifications (for Testing or Internal Use) ---
// *******************************************************************************************

// Endpoint to broadcast a general notification to all connected clients
app.post('/api/notify/broadcast', async (req, res) => {
    const notificationMessage = req.query.message || 'A new general event occurred!';
    await notificationService.createNotification(null, notificationMessage, 'broadcast_event'); // userId: null for broadcast
    res.status(200).send('Broadcast notification sent.');
});

// Endpoint to send a private notification to a specific patient (requires userId in query)
app.post('/api/notify/user/:userId', async (req, res) => {
    const targetUserId = req.params.userId; // This userId is the string userId, not ObjectId
    const notificationMessage = req.query.message || `Hello ${targetUserId}, here's a private update!`;
    await notificationService.createNotification(targetUserId, notificationMessage, 'private_message');
    res.status(200).send(`Private notification triggered for user ${targetUserId}.`);
});




// *******************************************************************************************
// Start the server, listening on the specified port
// *******************************************************************************************


const PORT = process.env.PORT || 9000; // Use your existing port 9000
server.listen(PORT, () => {
    console.log(`Express and Socket.IO server listening on http://localhost:${PORT}`);
    console.log('Ensure your React frontend is configured to connect to this URL.');
});