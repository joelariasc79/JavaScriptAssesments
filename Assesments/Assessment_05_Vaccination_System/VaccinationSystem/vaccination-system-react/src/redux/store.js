import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk'; // Use named import for Redux Thunk 3.x
import rootReducer from './rootReducer'; // Your combined reducers

const store = createStore(
    rootReducer,
    applyMiddleware(thunk) // Apply the thunk middleware
);

export default store;


// // src/redux/store.js
// import { createStore, applyMiddleware } from 'redux';
// import { thunk } from 'redux-thunk'; // Correct import for modern Redux Toolkit or just thunk
// import { composeWithDevTools } from '@redux-devtools/extension'; // For Redux DevTools Extension
// import rootReducer from './rootReducer';
//
// const middleware = [thunk];
//
// const store = createStore(
//     rootReducer,
//     composeWithDevTools(applyMiddleware(...middleware))
// );
//
// export default store;