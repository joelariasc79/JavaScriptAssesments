console.log("This file is part of webpack configuration and is loaded via bundle.js refered in index.html")

import React from "react"
import ApplicationComponent from "./app/application"
import * as ReactDOM from "react-dom/client"

//creating root of the react application where we can load the react app
const root = ReactDOM.createRoot(document.getElementById("root"));

//bootstrapping the react application
root.render(
    <ApplicationComponent/>
)
