console.log("This file is part of webpack configuration and is loaded via bundle.js refered in index.html")

import React from "react"
import ApplicationComponent from "./app/application"
import * as ReactDOM from "react-dom/client"
import { Provider } from "react-redux";
import store from "./app/State/store";

//creating root of the react application where we can load the react app
const root = ReactDOM.createRoot(document.getElementById("root"));


//bootstrapping the react application
root.render(
    //this makes store available as super parent or super props for entire application
    <Provider store={store}> 
        <ApplicationComponent/>
    </Provider>
)
