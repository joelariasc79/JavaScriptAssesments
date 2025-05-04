import React, { Component, createRef } from "react";

export default class ComponentUserSignIn extends Component {

    constructor(props){
        super();

        this.state = {
            userName : "Joel",
            userPassword : "es",
            userMobile : "459-572-9872"
        }

        this.userNameRef = createRef()
        this.userPasswordRef = createRef()
        this.userMobileRef = createRef()
    }

    textBoxOnChange = (evt)=>{
        let target = evt.target;
        let classList = target.classList;

        if (classList.contains("userName")) {
            this.setState({
                userName : target.value
            })
        }

        if (classList.contains("userPassword")) {
            this.setState({
                userPassword : target.value
            })
        }

        if (classList.contains("userMobile")) {
            this.setState({
                userMobile : target.value
            })
        }

        evt.preventDefault();
    }

    saveUserClick = (evt)=>{
        alert(this.state.userName + ", " + this.state.userPassword + ", " + this.state.userMobile +" will be saved")
        evt.preventDefault();
    }


    submitForm = (evt)=>{
        let userName = this.userNameRef.current.value
        let userPassword = this.userPasswordRef.current.value
        let userMobile = this.userMobileRef.current.value

        this.setState({
            userName,
            userPassword,
            userMobile
        })

        evt.preventDefault();
    }

    render(){
        console.log("render call userSign!!")
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
                                   placeholder="Please provide user name" maxLength={20}
                                   onChange={this.textBoxOnChange}></input>
                        </div>
                    </div>
                    <div className="form-control">
                        <div className="col-md-3">
                            <b>User Password</b>
                        </div>
                        <div className="col-md-7">
                            <input type="password" className="form-control textbox userPassword"
                                   value={this.state.userPassword}
                                   placeholder="Please provide user password" maxLength={15}
                                   onChange={this.textBoxOnChange}></input>
                        </div>
                    </div>
                    <div className="form-control">
                        <div className="col-md-3">
                            <b>User mobile</b>
                        </div>
                        <div className="col-md-7">
                            <input type="tel" className="form-control textbox userMobile"
                                   value={this.state.userMobile}
                                   placeholder="123-456-7890" maxLength={12}
                                   onChange={this.textBoxOnChange}></input>
                        </div>
                    </div>
                    <div className="form-control">
                        <div className="col-md-7">
                            <input type="submit" className="form-control button" onClick={this.saveUserClick}
                                   value={"Save User Submit"}></input>
                            <input type="button" className="form-control button" onClick={this.saveUserClick}
                                   value={"Save User Button"}></input>
                        </div>
                    </div>

                </div>

                <hr/>

                <h1>Un-controlled Way component building using form based structure</h1>
                <form className="form-control col-md-12" action={"/api/saveUser"} method="post"
                      onSubmit={this.submitForm}>
                    <b>User Name</b>
                    <input type="text" className="form-control" placeholder={"Please type User Name"}
                           ref={this.userNameRef} value={this.state.userName} maxLength={20} required></input>

                    <b>User Password</b>
                    <input type="password" className="form-control" placeholder={"Default User Password"}
                           ref={this.userPasswordRef} value={this.state.userPassword} maxLength={15} required></input>

                    <b>User Mobile</b>
                    <input type="tel" className="form-control" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                           placeholder={"123-456-7890"}
                           ref={this.userMobileRef} value={this.state.userMobile} maxLength={12} required></input>

                    <button type="submit"> Submit</button>
                    <button type="button" onClick={this.submitForm}> Save Button</button>
                </form>
            </>
        )
    }
}


//Task to complete on 1st May 2025
// 1. create UserSignIn component using uncontrolled way, should be class component, userName, password,
// mobile can be passed and shown upon form submit, use a button to do the same
// 2. create StudentSignIn component using controlled way, should be class component, userName, password,
// mobile can be passed and shown upon sign in click, use a button to do the same
