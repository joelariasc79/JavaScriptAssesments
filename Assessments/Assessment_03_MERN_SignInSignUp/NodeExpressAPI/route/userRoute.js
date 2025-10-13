//all patient api's will come here starting with sign-in and sign-up
//we import userData models and create object to connect with patient collection

let expressObj = require("express")

let userRouter = expressObj.Router({}) //options - strict, readonly etc

let userDataModel = require("../DataModel/userDataModel");


userRouter.post("/api/signinup",(req, res)=>{
    let userData = req.body; //this will be the patient object inserted by end patient at fron end
    console.log(userData)
    userDataModel.findOne({userName:req.body.userName}).then((existingUser)=>{
        
        if(existingUser){//patient exists so send the patient details - sign in
            
            res.send(existingUser)            
        }
        else{
            let userDataObj = new userDataModel(userData)//this creates a valid mongo db object with all sql operations
            
            userDataObj.save().then((newUser)=>{//will get _id once document is created
                console.log("successful signup ", newUser);
                res.send(newUser) //{userName : "value"....}
            }).catch((err1)=>{
                console.log("err signup", err1);
                res.send("error while sign up")
            })

        }
    })

})

userRouter.get('/api/users', (req, res) => {

    userDataModel.find()//find all the users from users collection and send back
    .then((users)=>{
        res.send(users)
    })
    .catch((errr)=>{
        console.log(errr)
        res.send("Error while fetching users")
    })
})

module.exports = userRouter;
