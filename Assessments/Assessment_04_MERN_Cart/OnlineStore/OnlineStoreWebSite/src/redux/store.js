import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk'; // Use named import for Redux Thunk 3.x
import rootReducer from './rootReducer'; // Your combined reducers

const store = createStore(
    rootReducer,
    applyMiddleware(thunk) // Apply the thunk middleware
);

export default store;
