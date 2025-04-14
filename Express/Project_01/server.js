let express = require('express')
const app = express() //when we invoke it creates an express application which helps to build a web server

const studentsRoute = require("./route/studentRoute")
const deafultApp = express();

globalThis.rootPath = __dirname
const path = require('path');
port = 9001


// setting up the middleware static to handle all the static files we need to serve to client
// Static middleware to serve files from the 'public' directory
app.use('/static', express.static(path.join(__dirname, 'public')));

// Default route (for comparison)
app.get('/', (req, res) => {
    res.send('Hello from the default route!');
});

app.use("/", deafultApp) //=>  app.use("/student", studentApp)
deafultApp.use("/students",studentsRoute) //redirecting all requests to default route to get served


// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});


