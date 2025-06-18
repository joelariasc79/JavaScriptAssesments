//store will be working as a container to hold initial states and logic to update the reducers
//store objects come from redux library
//combineReducers - is a hook used to combine multiple reducers as a single entity as redux will allow only one reducers per application
//getDefaultMiddleware - is a hook used to pass or inject some additional features like logger etc.in the execution cycle
//configureStore - is a hook used to pass intial state and the reducers 
//reducer - is a function which works with switch case (for each action type) and updates the state
// for every change returns new state
//each component will have its respective reducer 
//action - is the object a reducer accepts to create a new state
//action - object => action type (increment) ,payload (+5)


import { combineReducers } from "redux";
import { configureStore } from '@reduxjs/toolkit';

import userReducer from "./User/UserReducer";
import productReducer from "./Product/ProductReducer";
import cartReducer from "./Cart/CartReducer";


let rootReducer = combineReducers({
    userReducer, //userReducer : userReducer //short hand for es6
    productReducer,
    cartReducer
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

// Redux - the data management library for front-end applications (not just react)
// Reducers <callback functions - with switch case using action <type and payload>>
// Actions  <action object consists of <type and payload>>
// ActionCreator <can be understood as the event handler call from the front end>
// Dispatcher <creates a pipeline of multiple actions and takes them to store/reducer>
// Store <collection of reducers/states and acts as parent of all react app components so that states can be accessed via props>