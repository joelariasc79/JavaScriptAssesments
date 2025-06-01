let expressObj = require("express")

let router = expressObj.Router({}) //options - strict, readonly etc



router.get('/', (req, res) => {
    res.send('Hello World')
  })
  
router.get('/new', (req, res) => {
    res.send("<h2>I know Express is very powerful</h2>")
})
  
router.get('/test', (req, res) => {

    console.log(req)
    console.log(req.query)
    res.json({
        server : "Express",
        endpoint : "Test",
        api : "RestFul"
    })
})

router.get('/hello',(req, res)=>{
    res.sendFile(globalThis.rootPath+"/public/index.html")
})

// router.get('/showAlert.js',(req, res)=>{
//   res.sendFile(__dirname+"/showAlert.js")
// })


//route param
  //http://localhost:9000/test/2500?name=test&type=queryString
  router.get('/test/:id', (req, res) => {
    console.log(req.params["id"])
    console.log(req.query)
    res.json({
        server : "Express",
        endpoint : "Test",
        api : "RestFul"
    })
  })

  //http://localhost:9000/queryString?name=test&session=queryString
  router.get('/queryString', (req, res) => {    
    console.log(req.query)
    res.json({
        name : req.query["Name"],
        session : req.query["session"],
        api : "RestFul"
    })
  })


//wild card operator
router.all('/{*any}', (req, res, next) => {
    res.sendFile(globalThis.rootPath+"/public/notFound.html")
  })


module.exports = router;  

//createNew route with Name Student and have at least 5 API's there similar to defaultRoute,
//Load these API's via new express app, using mounting and
//also demonstrate - routeParam, 
// static middle ware, 
// sending file back as repsonce, 
// using query string to get data in api, and fifth api is of your choice!!