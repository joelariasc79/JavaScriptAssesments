import React from "react"; // this is responsible to parse the JSX code
import { NavLink, useNavigate } from "react-router-dom";
import { connect } from "react-redux"; //helps to connect react component with redux store

let Header = (props)=>{
    let student = props.student; //reading from mapStateToProps which reads from studentReducer.patient
    
    console.log("header student: " + student);
    
    const studentName = student && student.studentName ? student.studentName : "";

    console.log("header studentName: " + studentName);

    //navigate hook is used to create navigation link on the fly and send the request to given component
    // const navigateHook = useNavigate();
    // const navigateWithName = ()=>{
    //     navigateHook("/about/5000/Alec P.")
    // }

    return(
        <>
            {studentName !=""?
            <h2>Hi {studentName}, {student.mobile} , Welcome Student sponsored by Tech Team SIT</h2>:
            <h2>Welcome Student sponsored by Tech Team SIT,
                <div><h3>Please click on login button to proceed to login.</h3></div>
            </h2>
        }   
            <div>
                {/*<NavLink to="/patient"  className="button" activeclassname="true"> Login </NavLink>*/}
                <NavLink to="/studenthook"  className="button" activeclassname="true"> Login Hook </NavLink>
                {/*<NavLink to="/home"  className="button" activeclassname="true"> Home </NavLink>*/}
                {/*<NavLink to="/about"  className="button" activeclassname="true"> About </NavLink>*/}
            </div>
        </>
    )
}

//subscribing from store - mapStateToProps - allows to access the store data in react component as props
let mapStateToProps = (store)=>{
    return{
        student : store.studentReducer.student //this is accessing patient data from patient reducer and will be used in component as props
    }
}

export default connect(mapStateToProps, null)(Header);