//action - is an object which contains two things
// type - the type of action is needed
// payload - the data object to be updated once type is matched

import * as actionTypes from "../ActionTypes"

export const AddUserToStore = (user)=>{
    return{ 
        type: actionTypes.AddUserToStore, // this should be the same as present in switch condition
        payload : user
    } 
}