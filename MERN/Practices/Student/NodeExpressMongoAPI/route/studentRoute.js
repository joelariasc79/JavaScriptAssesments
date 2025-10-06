//all user api's will come here starting with sign-in and sign-up
//we import userData models and create object to connect with user collection

let expressObj = require("express")

let studentRouter = expressObj.Router({}) //options - strict, readonly etc

let studentDataModel = require("../DataModel/studentDataModel");


studentRouter.post("/api/signinup",(req, res)=>{
    let studentData = req.body; //this will be the user object inserted by end user at front end
    console.log("user data: " + studentData.studentName)
    studentDataModel.findOne({studentName:req.body.studentName}).then((existingStudent)=>{
        
        if(existingStudent){//user exists so send the user details - sign in
            res.send(existingStudent)
        }
        else{
            let studentDataObj = new studentDataModel(studentData)//this creates a valid mongo db object with all sql operations

            studentDataObj.save().then((newStudent)=>{//will get _id once document is created
                console.log("successful signup ", newStudent);
                res.send(newStudent) //{userName : "value"....}
            }).catch((err1)=>{
                console.log("err signup", err1);
                res.send("error while sign up")
            })

        }
    })

})

studentRouter.get('/api/students', (req, res) => {

    studentDataModel.find()//find all the users from users collection and send back
    .then((users)=>{
        res.send(users)
    })
    .catch((errr)=>{
        console.log(errr)
        res.send("Error while fetching users")
    })
})

module.exports = studentRouter;
