let mongooseObj = require("mongoose");
schemaObj = mongooseObj.Schema; //using the schema class from mongoose

//creates db with name mernstack19 or opens a connection if already present
mongooseObj.connect("mongodb://127.0.0.1/data25"); 

let CartSchema = new schemaObj({
    userid: { type:String, required:true},
    cart: Object
},
{
    versionKey: false //false - set to false then it wont create in mongodb
});

let CartModel = mongooseObj.model("cart",CartSchema);
module.exports = CartModel;
//note: donot put versionkey to true or it will start throwing error