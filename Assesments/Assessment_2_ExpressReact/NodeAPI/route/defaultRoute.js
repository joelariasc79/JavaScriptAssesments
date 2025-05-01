let expressObj = require("express")
const fs = require('fs');
let router = expressObj.Router({}) //options - strict, readonly etc

globalThis.rootPath = __dirname
const path = require('path');

console.log(globalThis.rootPath)
const dataFilePath = path.join(globalThis.rootPath, 'userInfo.json'); // Define the file path

// Error handling function
function handleError(res, message, statusCode = 500) {
    console.error(message); // Log the error for debugging
    return res.status(statusCode).json({ error: message });
}


// const fileContent = fs.readFileSync(dataFilePath, 'utf8');
// existingData = fileContent ? JSON.parse(fileContent) : []; // Handle empty file
// Check if the data file exists; create it if it doesn't
if (!fs.existsSync(dataFilePath)) {
    try {
        fs.writeFileSync(dataFilePath, '[]'); // Initialize with an empty JSON array
        console.log(`File created: ${dataFilePath}`);
    } catch (err) {
        console.error(`Error creating file: ${err}`);
        // If the file doesn't exist, we can't proceed.  However, the app will still run.
        // We'll handle the file not existing in the route handler as well.
    }
}

router.get('/CreateUser', (req, res) => {
    // 1. Extract and Validate Query Parameters
    const { name, session, address, age } = req.query;

    if (!name || !session || !address || !age) {
        return handleError(res, "Missing required parameters: name, session, address, and age are required.", 400);
    }

    const parsedAge = parseInt(age, 10); // Parse age as a number
    if (isNaN(parsedAge) || parsedAge <= 0) {
        return handleError(res, "Invalid age: Age must be a positive number.", 400);
    }

    // 2. Create User Data Object
    const newUser = {
        name,
        session,
        address,
        age: parsedAge,
        timestamp: new Date().toISOString() // Add a timestamp
    };

    // 3. Read Existing Data, Append, and Write Back (with error handling)
    let existingData = [];
    try {
        if (fs.existsSync(dataFilePath)) {
            try {
                const fileContent = fs.readFileSync(dataFilePath, 'utf8');
                existingData = fileContent ? JSON.parse(fileContent) : []; // Handle empty file
            } catch (parseErr) {
                // Handle the case where the file contains invalid JSON
                return handleError(res, "Error parsing existing data file. The file may be corrupted.  Overwriting with empty data.", 500);
            }
        }
        existingData.push(newUser); // Append the new user data

        // Write the updated data back to the file
        fs.writeFileSync(dataFilePath, JSON.stringify(existingData, null, 2), 'utf8'); //pretty print json
        res.status(200).json(newUser); // Send back the newly created user
    } catch (err) {
        // Handle file writing errors (e.g., disk full, permissions)
        return handleError(res, `Error writing to data file: ${err.message}`, 500);
    }
});

module.exports = router;



// router.get('/', (req, res) => {
//     res.send('Hello World')
//   })
//
// router.get('/new', (req, res) => {
//     res.send("<h2>I know Express is very powerful</h2>")
// })
//
// router.get('/test', (req, res) => {
//
//     console.log(req)
//     console.log(req.query)
//     res.json({
//         server : "Express",
//         endpoint : "Test",
//         api : "RestFul"
//     })
// })
//
// router.get('/hello',(req, res)=>{
//     res.sendFile(globalThis.rootPath+"/public/index.html")
// })
//
// // router.get('/showAlert.js',(req, res)=>{
// //   res.sendFile(__dirname+"/showAlert.js")
// // })
//
//
// //route param
//   //http://localhost:9000/test/2500?name=test&type=queryString
//   router.get('/test/:id', (req, res) => {
//     console.log(req.params["id"])
//     console.log(req.query)
//     res.json({
//         server : "Express",
//         endpoint : "Test",
//         api : "RestFul"
//     })
//   })
//
//   //http://localhost:9000/queryString?name=test&session=queryString
//   router.get('/queryString', (req, res) => {
//     console.log(req.query)
//     res.json({
//         name : req.query["Name"],
//         session : req.query["session"],
//         api : "RestFul"
//     })
//   })
//
//
// //wild card operator
// router.all('/{*any}', (req, res, next) => {
//     res.sendFile(globalThis.rootPath+"/public/notFound.html")
//   })
//
//
//
//
//
//
//



