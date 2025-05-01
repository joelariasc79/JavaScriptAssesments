import React, { Component, createRef } from "react";

export default class ComponentTypes extends Component {

    constructor(props){
        super();

        this.state = {
            userName : "Default",
            userAddress : "Nowhere on earth!!!"
        }

        //reference element which will allow us to access the html upon button click
        this.userNameRef = createRef()
        this.userAddressRef = createRef()
    }

    textBoxOnChange = (evt)=>{
        let target = evt.target;
        let classList = target.classList;

        if (classList.contains("userName")) {
            this.setState({
                userName : target.value
            })
        } else {
            this.setState({
                userAddress : target.value
            })
        }
        //console.log(evt)
        //debugger
        evt.preventDefault();
    }

    saveUserClick = (evt)=>{
        alert(this.state.userAddress + this.state.userName +" Will be saved")
        // a code to save data to db using api and ajax will come here

        evt.preventDefault();
    }


    submitForm = (evt)=>{
        let userName = this.userNameRef.current.value
        let userAddress = this.userAddressRef.current.value
        this.setState({
            userName,
            userAddress
        })

        //alert(this.state.userAddress + this.state.userName +" Will be saved")

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
                     <div className="form-control">
                         <div className="col-md-3">
                             <b>User Address</b>
                         </div>
                         <div className="col-md-7">
                             <input type="text" className="form-control textbox userAddress" value={this.state.userAddress}
                                 placeholder="Please provide user name" maxLength={30} onChange={this.textBoxOnChange}></input>
                         </div>
                     </div>
                     <div className="form-control">
                         <div className="col-md-3">
                             <label>{this.state.userName}</label>
                         </div>
                         <div className="col-md-3">
                             <label>{this.state.userAddress}</label>
                         </div>
                         <div className="col-md-7">
                             <input type="submit" className="form-control button" onClick={this.saveUserClick} value={"Save User"}></input>
                         </div>
                     </div>
                </div>                
                
                <hr/>

                <h1>Un-controlled Way component building using form based structure</h1>
                <form className="form-control col-md-12" action={"/api/saveUser"} method="post" 
                    onSubmit={this.submitForm}>
                    <b>User Name</b>
                    <input type="text" className="form-control" placeholder={"Please type User Name"} 
                        ref={this.userNameRef} maxLength={20} required></input>

                    <b>User Address</b>
                    <input type="text" className="form-control" placeholder={"Default User Address"} 
                        ref={this.userAddressRef} maxLength={20} required></input>

                    <button type="submit"> Save </button>
                </form>
            </>
        )
    }
}