import React, { Component, PureComponent } from "react";

import LoginComponent from "../ApplicationComponents/User/loginComponent.jsx";

//export default class Home extends Component {

//PureComponent has inbuilt implementation of shouldComponentUpdate to compare and check at least for one state or props change
//before making a render call
export default class Home extends PureComponent {

    //creation life cycle starts
    constructor(props){
        super();
    }

    //render life cycle method must be implemented to return the view/virtual dom/jsx
    render(){
        console.log("Home Render!!!")
        return(
            <div className={"loadimage form"} style={{border:"1px solid red"}}>
                <LoginComponent />
            </div>
        )
    }
}
