import { combineReducers } from "redux";
import { configureStore } from '@reduxjs/toolkit';

import studentReducer from "./Student/StudentReducer";


let rootReducer = combineReducers({
    studentReducer: studentReducer
})


function logger({ getState }) {

  return next => action => {
    console.log('will dispatch', action)

    // Call the next dispatch method in the middleware chain.
    const returnValue = next(action)

    console.log('state after dispatch', getState())

    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue
  }
}

//create or configure and export the store from this code
export default configureStore({
        reducer : rootReducer,
        middleware : (getDefaultMiddleware) => getDefaultMiddleware().concat(logger)
    },
    {},//inital state if we want to set from store instead of reducer
)