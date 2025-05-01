import React, { Component } from "react";

export default class ComponentTypes extends Component {

    constructor(props){
        super();

        this.state = {
            userName : "Default"
        }
    }

    textBoxOnChange = (evt)=>{

        let target = evt.target.value;

        this.setState({
            userName : target
        })

        //console.log(evt)
        //debugger

        evt.preventDefault();
    }

    render(){
        console.log("render call!!")
        return(
            <>
                <h1>Controlled Way component building using div based structure</h1>        
                <div className="form col-md-12">
                     <div className="form-control">
                         <div className="col-md-3">
                             <b>User Name</b>
                         </div>
                         <div className="col-md-7">
                             <input type="text" className="form-control textbox userName" value={this.state.userName}
                                 placeholder="Please provide user name" maxLength={20} onChange={this.textBoxOnChange}></input>
                         </div>
                     </div>
                </div>

                
                <hr/>
            </>
        )
    }
}