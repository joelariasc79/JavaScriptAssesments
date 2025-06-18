import React, { useCallback, useMemo, useState } from "react";
import Title from "./Title";
import Button from "./Button";
import Count from "./Count";

export default function Hooks(params) {

    let [age, setAge] = useState(19);
    let [salary, setSalary] = useState(1000);

    let incrementAge = useCallback((evt)=>{
        console.log("incrementAge")
        age++;
        setAge(age)
        evt.preventDefault()
    },[age]);

    let incrementSalry = useCallback((evt)=>{
        console.log("incrementSalary")
        salary = salary + 100;
        setSalary(salary)
        evt.preventDefault()
    },[salary])

    //memoizes data and calculates only if the input value is changed
    let isEven = useMemo(()=>{
        console.log("IsEven")
        let i = 1
        while(i < 2000000000) i++; //this is forcefully slowing the processing 

        return age % 2 === 0;
    },[age]);    

    return(
        <>
            <Title />
            <Button handleClick={incrementAge}>
                {"   Increment Age"}
            </Button>
            <Count text={" Incremented Age"} count={age}></Count>

            <hr/>
            <span>{isEven ? ' Even' : ' Odd'}</span>
            {/* <span>{isEven() ? ' Even' : ' Odd'}</span> */}
            <hr/>

            <Button handleClick={incrementSalry}>
                {"   Increment Salary"}
            </Button>
            <Count text={" Incremented Salary"} count={salary}></Count>

        </>
    )
}