let express = require("express");
let router = express.Router({}),
CartDataModel = require("../DataModel/cartDataModel");

//cart api's
router.post("/api/saveUserCart",(req, res)=>{

    CartDataModel.findOne({userid: req.body.userid})
        .then((cartDbObj) => {        
                if (!cartDbObj) { //checks for null cart of given patient
                        console.log("No cartitems Present, Adding / Inserting!"); 
                        let cartObj = new CartDataModel(req.body);

                        cartObj.save().then((data)=>{                                  
                            res.json(data);
                        }).catch((err)=>{
                            res.send("Error Occurred"+ err);
                        });
                }
                else{ //update the cart for given patient
                    console.log("CartItems Present, Replacing / Updating!");
                    cartDbObj.cart = req.body.cart;//replacing db cart with cart that patient has sent from cartcomponent page
                    
                    cartDbObj.save()
                    .then((data)=>{        
                        // setTimeout(()=>{
                            res.json(data);
                        //},10000)                        
                    })
                    .catch((err)=>{
                        res.send("Error Occurred"+ err);
                    })
                }
  })
  .catch((err)=>{
        console.log("got an error!", err);            
        res.send("error while fetching cart!");
  });

});

router.post("/api/getUserCart",(req, res)=>{
    CartDataModel.findOne({userid: req.body.userid})
        .then((cart) => { res.json(cart) })
        .catch((err)=>{res.send("Error Occurred"+ err);})
});

module.exports = router;