import React from "react"; // this is responsible to parse the JSX code
import { NavLink, useNavigate } from "react-router-dom";
import { connect } from "react-redux"; //helps to connect react component with redux store

let Header = (props)=>{
    let user = props.user; //reading from mapStateToProps which reads from userReducer.patient
    
    console.log(user)
    
    const usrName = user && user.userName ? user.userName : "";

    //navigate hook is used to create navigation link on the fly and send the request to given component
    const navigateHook = useNavigate();
    const navigateWithName = ()=>{
        navigateHook("/about/5000/Alec P.")
    }

    return(
        <>
            {usrName !=""?
            <h2>Hi {usrName}, {user.mobile} , Welcome to Shopping Cart sponsored by Tech Team SIT</h2>:
            <h2>Welcome to Shopping Cart sponsored by Tech Team SIT,
                <div><h3>Please click on login button to proceed to login.</h3></div>
            </h2>
        }   
            <div>
                <NavLink to="/home"  className="button" activeclassname="true"> Home </NavLink>
                {/* <NavLink to="/patient"  className="button" activeclassname="true"> Login </NavLink> */}
                <NavLink to="/userhook"  className="button" activeclassname="true"> Login </NavLink>
                <NavLink to="/product"  className="button" activeclassname="true"> Product </NavLink>
                <NavLink to="/cart"  className="button" activeclassname="true"> Cart </NavLink>
                <NavLink to="/checkout"  className="button" activeclassname="true"> Checkout </NavLink>
                <NavLink to="/about"  className="button" activeclassname="true"> About </NavLink>               
                <NavLink to="/hook"  className="button" activeclassname="true"> Hooks </NavLink>               

                {/* <NavLink to="/comp"  className="button" activeclassname="true"> Controlled/UnControlled </NavLink> */}
                {/* <NavLink to="/about/2025"  className="button" activeclassname="true"> About </NavLink> */}
                {/* <NavLink to="/about/2025/dat"  className="button" activeclassname="true"> About </NavLink> */}
            </div>

            {/* <button onClick={navigateWithName} >About With Name</button> */}
        </>
    )
}

//subscribing from store - mapStateToProps - allows to access the store data in react component as props
let mapStateToProps = (store)=>{
    return{
        user : store.userReducer.user //this is accessing patient data from patient reducer and will be used in component as props
    }
}

export default connect(mapStateToProps, null)(Header);