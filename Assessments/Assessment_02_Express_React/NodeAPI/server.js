let express = require('express')
const app = express() //when we invoke it creates an express application which helps to build a web server
const defaultRoute = require("./route/defaultRoute")
const deafultApp = express();

app.use("/", deafultApp) //=>  app.use("/student", studentApp) 
deafultApp.use("/",defaultRoute) //redirecting all requests to default route to get served

console.log("Rest API is listening at 9000")
app.listen(9000)


