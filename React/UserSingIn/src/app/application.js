import React, {Component} from "react";
import "./app.css";
import ComponentUserSignIn from "./CommonComponents/ComponentUserSignIn";

export default class ApplicationComponent extends Component {

    constructor(props) {
        super();
    }

    render(){
        
        console.log("Render method is called!!")
        return( //vitual dom or jsx code (javascript like xml structure)
            <>
                <ComponentUserSignIn />
            </>
        )
    }
}


































//update life cycle method
// shouldComponentUpdate(nextProps, nextState){
   // let name = "Joel", x=5, y = 9;
    //let sessionName = "MERNStack - React Props"
//     console.log(nextState) //the updated state version
//     //console.log(nextProps)
//     // if (this.state.userName == nextState.userName) {
//     //     return false //will not invoke render method
//     // } else {
//     //     return true
//     // }


//     return true //if we need to call render next
//     //return false //if we need not to call render next
// }


// <hr />
//                     <hr />
//                     <Home />
//                     <b>{this.state.userName}</b>
//                     <hr />
//                     {/* binding event to a button in react component */}
//                     <button onClick={this.changeUserNameEvent}>Change User Name</button>
//                     <hr />
//                     <NotFound />
//                     <hr />


{/* 
    
    <h1>This is coming from Application Component</h1>
                    
                    <b>{name}</b>
                    <hr />
                    <b>Multiply 5*10 = {5*10} </b>
                    <hr />
                    <b>Sum 5+9 = {5+9} </b> */}