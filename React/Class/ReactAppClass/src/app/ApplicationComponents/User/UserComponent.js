//This component will work as a sign-up page for the application but it has to be a functional component
// Functional component don't have state object like class component and callback method as setState API
// From react 16.4 we have hooks present which export some features that are defined in component classes
// like - creating and updating a state (useState)
// creating and updating the ref element (useRef)

import React, { useState, useRef } from "react"

let UserComponent = (props)=>{

    // the class component inherits from Component base class from react and has implementation for state and 
    // its API's setState and forceUpdate
    // constructor(){
    //     this.state = {}
    // }
    //this.state.userName = "new name"

    //useState - hook implements an object to create the state and a callback to udpate the state
    let [userName, updateUserName] = useState("Default Student")
    let [userAddress, updateUserAddress] = useState("Default Address")


    let textBoxOnChange = (evt)=>{
        //using the state updater to update the userName state
        updateUserName(evt.target.value) //works same way as setState to call react renderer
    }

    let saveUserClick = ()=>{}

    return(
        <>
            <h1>User SignIn - SignUp Page</h1>
            <div className="form col-md-12">
                     <div className="form-control">
                         <div className="col-md-3">
                             <b>User Name</b>
                         </div>
                         <div className="col-md-7">
                             <input type="text" className="form-control textbox userName" value={userName}
                                 placeholder="Please provide user name" maxLength={20} onChange={textBoxOnChange}></input>
                         </div>
                     </div>
                     <div className="form-control">
                         <div className="col-md-3">
                             <b>User Address</b>
                         </div>
                         <div className="col-md-7">
                             <input type="text" className="form-control textbox userAddress" value={userAddress}
                                 placeholder="Please provide user name" maxLength={30} 
                                    onChange={(evt)=>updateUserAddress(evt.target.value)}></input>
                         </div>
                     </div>
                     <div className="form-control">
                         <div className="col-md-3">
                             <label>{"this.state.userName"}</label>
                         </div>
                         <div className="col-md-3">
                             <label>{"this.state.userAddress"}</label>
                         </div>
                         <div className="col-md-7">
                             <input type="submit" className="form-control button" onClick={saveUserClick} value={"Save Student"}></input>
                         </div>
                     </div>
                </div>
        </>
    )
}

export default UserComponent;