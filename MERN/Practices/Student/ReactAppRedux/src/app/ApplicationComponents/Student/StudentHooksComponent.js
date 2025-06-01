import React, { useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"; //
import {AddStudentToStore, SaveStudentToDBUsingFetch} from "../../State/Student/StudentAction";

let StudentHookComponent = (props)=>{

    //this allows us to access the state from store as we do with mapStateToProps
    let studentState = useSelector((state) => state.studentReducer.student);

    console.log("StudentHookComponent", studentState)

    //useRef - this is reference hook from react library to help us create html element using ref keyword
    let studentName = useRef(null)
    let password = useRef(null)
    let street = useRef(null)
    let mobile = useRef(null)


    useEffect(()=>{
        console.log("StudentHookComponent - useEffect")
        studentName.current.value = studentState.studentName
        password.current.value = studentState.password
        street.current.value = studentState.street
        mobile.current.value = studentState.mobile
    },[])

    //we can dispatch the action to store by using useDipatch hook which implements mapDispatchToProps

    const dispatchStudent = useDispatch();

    let submitForm = (evt)=>{
        //this is the call to dispatcher using action creater
        //debugger;
        let studentObj = {
            studentName: studentName.current.value,
            password: password.current.value,
            street: street.current.value,
            mobile: mobile.current.value
        }

        console.log("StudentHookComponent: ", studentObj)
        dispatchStudent(SaveStudentToDBUsingFetch(studentObj))

        evt.preventDefault();
    }

    return(
        <>
            <h1>User SignIn - SignUp Page - Hooks</h1>
            <form className="form-control col-md-12" onSubmit={submitForm}>
                    <b>User Name</b>
                    <input type="text" className="form-control" placeholder={"Please type Student Name"}
                           ref={studentName} maxLength={20} required></input>

                    <b>User Password</b>
                    <input type="password" className="form-control" placeholder={"Please type Student Password"}
                           ref={password} maxLength={20} required></input>


                    <b>User Address</b>
                    <input type="text" className="form-control" placeholder={"Please type Student Address"}
                           ref={street} maxLength={40} required></input>

                    <b>User Mobile</b>
                    <input type="number" className="form-control" placeholder={"Please type Student Mobile"}
                           ref={mobile} maxLength={20} required></input>

                    <button type="submit"> Login User</button>
                </form>
            </>
            )
            }

            export default StudentHookComponent;