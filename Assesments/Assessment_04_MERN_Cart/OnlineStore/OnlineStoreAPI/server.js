let express = require('express')
const app = express() //when we invoke it creates an express application which helps to build a web server
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// MongoDB Connection (ensure this is only done once)
mongoose.connect('mongodb://localhost:27017/shoppingcartdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded


// const defaultRoute = require("./route/defaultRoute")
// const deafultApp = express();

const productRoute = require("./route/productRoute")
// const productApp = express();

const cartRoute = require("./route/cartRoute")
// const cartApp = express();

const userRoute = require("./route/userRoute")
// const userApp = express();

const orderRoute = require('./route/./orderRoute');

//calling the cors instance 
const cors = require("cors");

globalThis.rootPath = __dirname
 
//allowing the cross origin resource sharing
app.use(cors())//using cors middleware to allow resource sharing with different ports in localhost

//setting up the middleware static to handle all the static files we need to serve to client
// serve static files like images css using static middleware 
// app.use('/static', express.static('public')) //localhost:9000/static/alert_info.js

//json middle-ware for setting request content type to json in body
app.use(express.json({limit:'2mb', extended:false}));


// Use the routers
app.use(productRoute);
app.use(cartRoute);
app.use(userRoute);
app.use(orderRoute);

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Shopping Cart API is running!');
});

console.log("Rest API is listening at 9000")
app.listen(9000)