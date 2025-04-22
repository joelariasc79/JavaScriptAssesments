import React, {Component} from "react";
import JoelHeader from "./CommonComponents/JoelComponent";

export default class ApplicationComponent extends Component {

    constructor(props) {
        super();
        this.state = {
            name : "Joel",
        }
    }

    changeNameEvent = (evt)=>{
        this.setState({
            name : "James"
        })
    }


    render(){
        return(
            <div>
                <JoelHeader headerTitle={this.props.headerTitle}/>
                <h2>{this.state.name}</h2>
                <button onClick={this.changeNameEvent}>Change Name</button>
            </div>
        )
    }
}