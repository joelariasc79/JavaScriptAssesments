import React from "react";

let SuccessChild = (props) => {
    // Access props directly
    const {name, address} = props; // Destructuring for cleaner code

    return (
        <div className="card">
            <div className="card-body">
                <p className="card-text"><b>Name:</b> <span className="font-weight-bold">{name}</span></p>
                <p className="card-text"><b>Address:</b> <span className="font-weight-bold">{address}</span></p>
                <div className="mt-4">
                {props.children && props.children[0]}
                {props.children && props.children[1]}
                </div>
            </div>
        </div>
    );
};



export default SuccessChild; // Best practice:  Export the component