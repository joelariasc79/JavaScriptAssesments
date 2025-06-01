import * as actionTypes from "../ActionTypes"

let initialState = {
    student : {
        studentName : "",
        password : "",
        street : "",
        mobile : ""
    }
}

let studentReducer = (state = initialState, action) => {
    console.log("Student Reducer ", action)

    console.log("Student Reducer student.studentName", state.student.studentName)
    console.log("Student Reducer action.type", action.type)

    switch (action.type) {
        case actionTypes.AddStudentToStore:
            return {...state, student: action.payload}
    
        default:
            return state
    }

}

//ADDSTUDENTTOSTORE
export default studentReducer;