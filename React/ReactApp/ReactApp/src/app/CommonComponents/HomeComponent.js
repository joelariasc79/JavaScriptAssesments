import React, { Component, PureComponent } from "react";
import {PropTypes} from "prop-types";

//export default class Home extends Component {

//PureComponent has inbuilt implementation of shouldComponentUpdate to compare and check at least for one state or props change
//before making a render call
export default class Home extends PureComponent {

    //creation life cycle starts
    constructor(props){
        super();
        //initializing the state/props/fields etc
        this.state = {
            userName : props.user.userName,
            userAge : props.user.userAge,
            userAddress : "No Space on earth!!",
            userData : props.userData
        }
        this.counter = 100;        
        this.intervalObject = null;
        //this.incrementCounter();

        this.userNameRef = React.createRef();//creates a reference pointer so that html can be accessed with this 

        //html will not be present so this can't be accessed in contructor LC method
        //this.userNameRef.current.value = "Value has been updated"
        //this.userNameRef.current.focus();
    }
    
    //this creation life cycle method ensure html is rendered on browser we can make call to fetch data and bind it to html element
    componentDidMount(){
        console.log("componentDidMount" )

        setTimeout(()=>{
            this.userNameRef.current.value = "Value has been updated"
            this.userNameRef.current.focus();
        },2000)
        
    }

    incrementCounter = ()=>{
        this.intervalObject = setInterval(()=> {//continous loop
                this.setState(
                    {userAge : this.counter})
                //console.log(this.state.counter)
                this.counter++;
                console.log(this.counter)
                
            }, 2000);//runs every  2 seconds forever - unless cleared
    }

    changeUserAddressEvent = (evt)=>{
        //this api is tightly coupled with react renderer to create new virtual dom using all the update life cycle methods
        this.setState({
            userAddress : "Somewhere on earth!!!"
        })

        //when we update the state using force update it directly calls render to create virtual dom
        // this.state.userAddress = "Somewhere on earth!!!"
        // this.forceUpdate()

        evt.preventDefault();
    }

    //update life cycle methods
    //this life cycle method is directly depends on state changes - setState or forceUpdate within component or by props update by parent component
    // shouldComponentUpdate(nextProps, nextState){ //it containe props and state which are going to be updated in new virtual dom
    //     console.log("shouldComponentUpdate is called after every state update and receives updated state and props")
    //     console.log("nextProps ",nextProps)
    //     console.log("nextState ",nextState)
    //     if (nextState.userAddress == this.state.userAddress) {
    //         return false //set to false will skip the call to render method
    //     } else {
    //         return true //set to true will call the render method
    //     }
    // }


    //update life cycle methods called after render
    getSnapshotBeforeUpdate(prevState, prevProps){
        console.log("getSnapshotBeforeUpdate");
        // console.log("prevState", prevState);
        // console.log("prevProps", prevProps);

        // this.prevUser = prevState.user;
        // this.setState({
        //     user : this.prevUser
        // })

        return {
            prevState,
            prevProps
        }
    }

    componentDidUpdate(prevState, prevProps){
        console.log("componentDidUpdate");
        // console.log("prevState",prevState);
        // console.log("prevProps", prevProps);

        // this.setState({
        //     uState : prevState.uState
        // })
    }

    //destruction life cycle method
    //it must be used to clear all the api calls, reference that are used in current component
    componentWillUnmount(){
        
        console.log("componentWillUnmount is called")
        //clearInterval(this.intervalObject);
    }

    //render life cycle method must be implemented to return the view/virtual dom/jsx
    render(){
        console.log("Home Render!!!")
        return(
            <>
                <h1>Home Component</h1>  

                <input type="text" value={this.state.userName} ref={this.userNameRef} />

                <label>{this.state.userAge}</label>
                
                <hr />
                <label>{this.state.userAddress}</label>
                {/* binding event to a button in react component */}
                <button onClick={this.changeUserAddressEvent}>Change User Address</button>
            </>
        )
    }
}

//we should use default props to assign default values to the properties that we use in our component
// Home.defaultProps = {
//     userName : "The Default User Name",
//     userAge : 25
// }


//proptypes are used to mark the properties we use in the component as required so that it shows waring if not present
//and can be fixed

// Home.propTypes = {
//     userName : PropTypes.string.isRequired,
//     userAge : PropTypes.number.isRequired,
//     userData : PropTypes.string.isRequired
// }