import React, {Component} from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./app.css";
import Footer from "./CommonComponents/FooterComponent";
import Header from "./CommonComponents/HeaderComponent";
// import Home from "./CommonComponents/HomeComponent";
// import StudentComponent from "./ApplicationComponents/Student/StudentContainer.js";
import StudentHookComponent from "./ApplicationComponents/Student/StudentHooksComponent.js";

export default class ApplicationComponent extends Component {

    /**
     *
     */
    constructor(props) {
        super();
        this.state = {
            studentName : "react patient ",
            student : {
                    studentName : "Test Student",
                    studentAge : 19
                    }
        }
        this.sessionName = "MERNStack - React Props"
    }

    // changeStudentNameEvent = (studentName)=>{
    //
    //     this.setState({
    //         studentName : studentName
    //     })
    //
    //     console.log(this.state.studentName)
    //
    //     evt.preventDefault();
    // }


    render(){
        
        console.log("Render method is called!!")
        return( //vitual dom or jsx code (javascript like xml structure)
            <Router>                
                <div className="topdiv">
                    <Header />
                        <Routes>
                            {/*<Route path="/" element={<Home patient={this.state.patient} />}/>*/}
                            {/*<Route path="home" element={<Home patient={this.state.patient} />}/>*/}
                            {/*<Route path="patient" element={<StudentComponent />}/>*/}
                            <Route path="studenthook" element={<StudentHookComponent />}/>
                        </Routes>
                    <Footer sessionName={this.sessionName}/>
                </div>    
            </Router>      
        )
    }
}