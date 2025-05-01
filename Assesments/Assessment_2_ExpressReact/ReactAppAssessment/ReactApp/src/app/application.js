import React, {Component} from "react";
import "./app.css";
import Success from "./CommonComponents/Success";

export default class ApplicationComponent extends Component {

    render(){
        
        console.log("Render method is called!!")
        return(

            <Success />
        )
    }
}
