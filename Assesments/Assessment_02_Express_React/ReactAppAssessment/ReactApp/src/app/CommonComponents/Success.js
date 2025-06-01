import React, { Component } from "react";
import SuccessChild from "./SuccessChild.jsx";
import SuccessStory from "./SuccessStory";


export default class Success extends Component {

    constructor(props){
        super();

        this.state = {
            name : "Joel",
            address: "2525 Old Farm Road"
        }
    }

    render(){
        return(
            <>

                <div className="container mt-4">
                    <div className="card">
                        <div className="card-body">
                            <h1 className="display-4">Home Component</h1>
                        <h2 className="lead">This is Joel</h2>
                        <h3 className="text-muted">Have a great day</h3>
                        </div>
                    </div>
                        <SuccessChild name={this.state.name} address={this.state.address}>
                            <h4 className="text-primary">Passed in the SuccessChild component as prop</h4>
                            <SuccessStory/>
                        </SuccessChild>
                    </div>
                </>
        )
    }
}

