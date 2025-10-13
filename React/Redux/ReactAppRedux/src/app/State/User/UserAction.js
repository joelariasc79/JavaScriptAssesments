//action - is an object which contains two things
// type - the type of action is needed
// payload - the data object to be updated once type is matched

import * as actionTypes from "../ActionTypes";
import axios from  "axios";

export const AddUserToStore = (user)=>{
    return{ 
        type: actionTypes.AddUserToStore, // this should be the same as present in switch condition
        payload : user
    } 
}

//need to make a ajax - asynchronous javascript like xml - be used to make parallel server/api calls
//React.fetch() - we can use to make API or can add axios library to achieve the same

export const SaveUserToDBUsingFetch = (userObj)=>{
    console.log("SaveUserToDBUsingFetch called")
    return (dispatch)=>{
        window.fetch("http://localhost:9000/user/api/signinup", //uri - api path
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
            },
            body : JSON.stringify(userObj)}) //JSON object can't travel from client to server so needs to be converted to string
            .then((response)=>response.json())
            .then((userData)=>{
                console.log(userData)
                //dispatch or send saved/signin patient to reducer
                dispatch(AddUserToStore(userData))
            })
            .catch((error)=>console.log(error))
        }
}


//save patient to db for signup or signin purpose
// patient object and we need to send this as request body to node api by using ajax call
// axios - can be used to make call or react.fetch can also be used to do the same
//get, put, post, update, delete

export const SaveUserToDB = (user)=>{

    return (dispatch)=>{
        axios.post("http://localhost:9000/user/api/signinup",//uri or end point of singninup api
            user // the patient state object we dispatch from the patient component
        ).then((axiosResponseData)=>{
            console.log("Sigin Success ", axiosResponseData)
            
            //we need to read specific patient data from complete response object
            let userData = axiosResponseData.data;

            //this is now going to be dispatched to store and update the redux values
            dispatch(AddUserToStore(userData))
        })
        .catch((errrObj)=>console.log("Error occurred at sign-in sign-up", errrObj))
    }
}
