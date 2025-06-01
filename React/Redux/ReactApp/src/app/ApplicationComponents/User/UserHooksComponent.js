//This component will work as a sign-up page for the application but it has to be a functional component
// Functional component don't have state object like class component and callback method as setState API
// From react 16.4 we have hooks present which export some features that are defined in component classes
// like - creating and updating a state (useState)
// creating and updating the ref element (useRef)

import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux"; //
//import { AddUserToStore } from "../../State/Student/UserAction";

let UserHookComponent = (props)=>{

    //this allows us to access the state from store as we do with mapStateToProps
    let userState = useSelector((state) => state.userReducer.user);

    console.log("UserHookComponent", userState)

    //useRef - this is reference hook from react library to help us create html element using ref keyword
    // let userName = useRef(userState.userName)
    // let password = useRef(userState.password)
    // let street = useRef(userState.street)
    // let mobile = useRef(userState.mobile)

    let userName = useRef(null)
    let password = useRef(null)
    let street = useRef(null)
    let mobile = useRef(null)

    //
    useEffect(()=>{
        console.log("UserHookComponent - useEffect")
        userName.current.value = userState.userName
        password.current.value = userState.password
        street.current.value = userState.street
        mobile.current.value = userState.mobile
    },[])

    
    let submitForm = (evt)=>{
        debugger
        // let user = {
        //     userName, street
        // } 
        //this is the call to dispatcher using action creater
        // props.addUser({
        //     userName,
        //     password, 
        //     street, 
        //     mobile
        // })

        alert("Student send to signin via reducer")

        evt.preventDefault();
    }

    return(
        <>
            <h1>User SignIn - SignUp Page - Hooks</h1>
            <form className="form-control col-md-12" onSubmit={submitForm}>
                    <b>User Name</b>
                    <input type="text" className="form-control" placeholder={"Please type Student Name"}
                        ref={userName} maxLength={20} required></input>

                    <b>User Password</b>
                    <input type="text" className="form-control" placeholder={"Please type Student Password"}
                        ref={password} maxLength={20} required></input>
    

                    <b>User Address</b>
                    <input type="text" className="form-control" placeholder={"Please type Student Address"}
                        ref={street} maxLength={40} required></input>

                    <b>User Mobile</b>
                    <input type="number" className="form-control" placeholder={"Please type Student Mobile"}
                        ref={mobile} maxLength={20} required></input>


                    <button type="submit"> Login User </button>
            </form>
        </>
    )
}

export default UserHookComponent;