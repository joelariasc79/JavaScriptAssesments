import React, {Component} from "react";
import Joel from "./CommonComponents/joel";


export default class ApplicationComponent extends Component {

    constructor(props) {
        super();
        this.headerTitle = "This the the Header Component";
    }

    render(){
        return(
            <div>
                <Joel headerTitle={this.headerTitle}/>
            </div>
        )
    }
}