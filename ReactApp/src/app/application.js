import React, {Component} from "react";
import Footer from "./CommonComponents/FooterComponent";

export default class ApplicationComponent extends Component {

    /**
     *
     */
    constructor(props) {
        super();
        this.state = {
            userName : "SomeUser",
            userAddress : "SomeAddress"
        }
        this.sessionName = "MERNStack - ReactJoel Props"
    }

    changeUserNameEvent = (evt)=>{

        //this.state.userName = "Tejasvi" //with this way render method will not be called and no new virtual dom will be created

        //we have registered API (callback) from react to make state changes and call render method
        //so that new virtual dom gets created

        this.setState({
            userName : `Dat -  
                This is coming from Application Component
                This is coming from Application Component

                This is coming from Application Component

                This is coming from Application Component`,
            //userAddress : "Somewhere on earth!!!!!!"
        })


        //updating the state using force update - not recommended but can be used if needed

        // this.state.userName = `Dat -  
        //         This is coming from Application Component
        //         This is coming from Application Component

        //         This is coming from Application Component

        //         This is coming from Application Component`

        // this.forceUpdate()//it will directly call the render method and will skip life cycle methods such as shouldComponentUpdate

        //this.sessionName = "The session is on react and state and its virtual dom coupling!!!"
        console.log(this.state.userName)//not updated immediately as - the change is done via callback and as soon as callback 
        // returns value the log line is passed already executed

        //alert("User Name is updated!!")

        evt.preventDefault();
    }

    //update life cycle method
    shouldComponentUpdate(nextProps, nextState){

        console.log(nextState) //the updated state version
        //console.log(nextProps)
        if (this.state.userName == nextState.userName) {
            return false //will not invoke render method
        } else {
            return true
        }


        //return true //if we need to call render next
        //return false //if we need not to call render next
    }

    render(){
        let name = "Joel", x=5, y = 9;
        //let sessionName = "MERNStack - ReactJoel Props"
        console.log("Render method is called!!")
        return( //vitual dom or jsx code (javascript like xml structure)
            <div>
                <h1>This is coming from Application Component</h1>
                
                <b>{name}</b>
                <hr />
                <b>Multiply 5*10 = {5*10} </b>
                <hr />
                <b>Sum 5+9 = {5+9} </b>
                <hr />
                <b>{this.state.userName}</b>
                <hr />
                <Footer sessionName={this.sessionName}/>

                {/* binding event to a button in react component */}
                <button onClick={this.changeUserNameEvent}>Change User Name</button>
            </div>            
        )
    }
}