//all user api's will come here starting with sign-in and sign-up
//we import userData models and create object to connect with user collection

let expressObj = require("express")

let userRouter = expressObj.Router({}) //options - strict, readonly etc

let userDataModel = require("../DataModel/userDataModel");


userRouter.post("/api/signinup",(req, res)=>{
    let userData = req.body; //this will be the user object inserted by end user at fron end
    console.log(userData)
    userDataModel.findOne({userName:req.body.userName}).then((existingUser)=>{
        
        if(existingUser){//user exists so send the user details - sign in
            
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


// New API to explicitly create a new user
userRouter.post("/api/createuser", (req, res) => {
    let userData = req.body;

    // First, check if a user with the same userName already exists to prevent duplicates
    userDataModel.findOne({ userName: userData.userName })
        .then((existingUser) => {
            if (existingUser) {
                console.log("User with this username already exists:", existingUser.userName);
                return res.status(409).send("User with this username already exists.");
            }

            // If the user doesn't exist, create and save the new user
            let newUser = new userDataModel(userData);
            newUser.save()
                .then((createdUser) => {
                    console.log("New user created successfully:", createdUser.userName);
                    res.status(201).send(createdUser);
                })
                .catch((err) => {
                    console.log("Error creating new user:", err);
                    res.status(500).send("Error creating new user.");
                });
        })
        .catch((err) => {
            console.log("Error checking for existing user:", err);
            res.status(500).send("Internal server error.");
        });
});

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
