// Uncomment 10, and temporarily delete Q6

// Q1. Create a file with name basics and show all the features that you know about javascript?
// (minimum 5 and maximum 8 topics)
// Try explaining in 1-2 lines : example - Prototype : An object which behaves as a link between two
// functions and provides inheritance

console.log("\nQ1. ");


// a. Prototype: Functions that can be inherited. When an Object calls an function it first look in himself functions,
// if is not founded it looked into the object prototype.

function Person(name) {
    this.name = name;
}

Person.prototype.sayHello = function() {
    console.log("\nHello, my name is " + this.name);
};

var person1 = new Person("Alice");
person1.sayHello();

Person.prototype.sayHello = function() {
    console.log("Hello, my name is " + this.name);
};

console.log(person1.__proto__ === Person.prototype); //true.

// b. Closure: A closure is a function that remembers the variables from its lexical scope
// (the scope in which it was defined) even when the outer function has finished executing.
// This allows inner functions to access and use variables from outer functions.

function outerFunction(outerVar) {
    function innerFunction(innerVar) {
        console.log(outerVar + innerVar);
    }
    return innerFunction;
}

var closureExample = outerFunction(10);
closureExample(5); // Output: 15


// c. Hoisting: Variables are functions are declared at the top, then they exist before they are defined

console.log(myVar); // Output: undefined
var myVar = 10;

myFunction(); // Output: Hello
function myFunction() {
    console.log("Hello");
}

// d. Callback: A callback is a function that is passed as an argument to another function and
// is executed after the first function has finished its operation

function doSomething(callback) {
    setTimeout(function() {
        console.log("Doing something...");
        callback();
    }, 1000);
}

function finished() {
    console.log("Finished!");
}

doSomething(finished);

// e. Overloading: JavaScript doesn't have overloading, because if the same function is declared two times,
// the second function overwrite the first. To simulate overloading JavaScript lets you all the function
// with different number of parameters if they are less than the number of declared parameters.

function myFunction(arg1, arg2) {
    if (arguments.length === 1) {
        console.log("One argument: " + arg1);
    } else if (arguments.length === 2) {
        console.log("Two arguments: " + arg1 + ", " + arg2);
    } else {
        console.log("Too many arguments.");
    }
}

myFunction(10); // Output: One argument: 10
myFunction(10, 20); // Output: Two arguments: 10, 20

// f. Apply: calls a function with a given this value and arguments provided as an array.

var person = {
    fullName: function(city, country) {
        return this.FName + " " + this.LName + ", " + city + ", " + country;
    }
};

var person1 = {
    FName: "John",
    LName: "Doe"
};

var result = person.fullName.apply(person1, ["Oslo", "Norway"]);
console.log(result); // Output: John Doe, Oslo, Norway

myFunction(10); // Output: One argument: 10
myFunction(10, 20); // Output: Two arguments: 10, 20

//Q2. As javascript is not a type safe and has auto cast feature - try showing below values from the same variable
// and its type as well :values are - "Robert ", .0266, false, {myname : "Test Me"}, 25166665, undefined, true, "Robert Jr.", null, {}, -32767

console.log("\nQ2. ");
nonSafeType = "Robert ";
console.log(nonSafeType);
nonSafeType = .0266;
console.log(nonSafeType);
nonSafeType = false;
console.log(nonSafeType);
nonSafeType = {myname : "Test Me"};
console.log(nonSafeType);
nonSafeType = 25166665;
console.log(nonSafeType);
nonSafeType = undefined;
console.log(nonSafeType);
nonSafeType = true;
console.log(nonSafeType);
nonSafeType = "Robert Jr.";
console.log(nonSafeType);
nonSafeType = true;
console.log(nonSafeType);
nonSafeType = null;
console.log(nonSafeType);
nonSafeType = {};
console.log(nonSafeType);
nonSafeType = -32767;
console.log(nonSafeType);


// Q3. Create a function with name showUserInfo, this function expects three params, firstname, lastname and age
//  print all the details in the given function

console.log("\nQ3. ");
function showUserInfo(firstname, lastname, age){
    console.log(firstname, lastname, age);
}

showUserInfo('Joel', 'Arias', 45);

// Q4. Create a function with name doaddition, pass three parameters and return the sum of all the three numbers
// below output needs to be monitored - doaddition(2,3,4), doaddition(2), doaddition(2.3,3), doaddition("first", 2, "three")
// analyse the outputs we get and try explaining the reasons behind!!

console.log("\nQ4. ");
function doAddition(n1 =0, n2=0, n3 = 0 ){
    console.log(n1+n2+n3);
}
doAddition(2,3,4);
doAddition(2);
doAddition(2,3,3);
doAddition("first",3,"three");
// In this case because there is at least one string parameter it concatenates the parameters instead of summing them


// Q5. Give me an example of your choice for each of the below concepts

// a. closure,
console.log("\nQ5. ");
function outerFunction(outerVariable) {
    return function innerFunction(innerVariable) {
        console.log("Outer:", outerVariable);
        console.log("Inner:", innerVariable);
    };
}

const innerFunction = outerFunction("outer variable");
innerFunction("inner variable"); // Accesses outerVariable even after outerFunction has finished
// Outer: outer variable
// Inner: inner variable


// b. hoisting,

console.log(hoistedVariable); // Undefined
var hoistedVariable = "hello";

// c. constructor function

function Employee(firstName, address, empId) {
    this.firstName = firstName;
    this.address = address;
    this.empId = empId;
}
class Vehicle {
    constructor(make, model, year) {
        this.make = make;
        this.model = model;
        this.year = year;
    }
}


// Q6. What is the purpose of call, apply and bind ? and why they are used ? whats the difference between bind and apply ?
console.log("\nQ6. ");
//     Use call() or apply() when you want to execute a function immediately with a specific this context.
//     Use apply() when you have the arguments in an array.
//     Use bind() when you want to create a new function with a pre-set this context and/or pre-set arguments for later execution.

// For Me:
// Purpose and Why They Are Used:
//
//     Controlling the this Context:
//     In JavaScript, the value of this inside a function depends on how the function is called. These methods provide a way to explicitly set the this value, regardless of how the function is invoked.
//     This is essential when you want to use a function in the context of a different object.
//     Borrowing Methods:
//     They allow you to "borrow" methods from one object and apply them to another object. This is useful for code reuse and flexibility.
//     Function Currying and Partial Application:
//     bind is particularly useful for creating new functions with pre-set arguments, a technique known as currying or partial application.
//     Detailed Explanation:
//
//     call():
// Executes a function immediately.
// Takes the this value as the first argument, followed by the function's arguments individually.
// Example: function.call(thisArg, arg1, arg2, ...)
// apply():
// Executes a function immediately.
// Takes the this value as the first argument, and the function's arguments as an array.
// Example: function.apply(thisArg, [arg1, arg2, ...])
// bind():
// Creates a new function that, when called, has its this value set to the provided value.
//     Takes the this value as the first argument, followed by optional arguments that will be pre-set when the new function is called.
//     Does not execute the function immediately; it returns a new function.
//     Example: function.bind(thisArg, arg1, arg2, ...)
// Differences Between bind() and apply():
//
// Execution:
//     apply() executes the function immediately.
// bind() returns a new function that can be executed later.
//     Arguments:
// apply() takes arguments as an array.
// bind() takes arguments individually.
//     Return Value:
//     apply() returns the result of the function execution.
// bind() returns a new function.
//     Example Scenarios:

const person = {
    firstName: "John",
    lastName: "Doe",
    getFullName: function() {
        return this.firstName + " " + this.lastName;
    }
};

const anotherPerson = {
    firstName: "Jane",
    lastName: "Smith"
};

// Using call()
console.log(person.getFullName.call(anotherPerson)); // Output: Jane Smith

// Using apply()
console.log(person.getFullName.apply(anotherPerson)); // Output: Jane Smith

// Using bind()
const janeFullName = person.getFullName.bind(anotherPerson);
console.log(janeFullName()); // Output: Jane Smith

//example of apply with arguments.
function product(a,b){
    return a * b;
}

console.log(product.apply(null,[5,5])); //output 25

//example of bind with arguments.
function product2(a,b){
    return a * b;
}

const fiveTimes = product2.bind(null,5);
console.log(fiveTimes(6)); //output 30


// Q7. Create an example of bind using Student object, where a function returns data with SetTimeOut and we fix it by bind.

console.log("\nQ7. ");

// Without bind()

// var Student = {
//     FName: "Eric",
//     Location: "Somewhere in australia",
//     Age: 20,
//     subjectList: ['Math', 'Physics'],
//
//     getData: function() {
//         setTimeout(function() {
//             console.log("Data for " + this.FName + ": " + this.subjectList.join(", "));
//         }, 2000);
//     }
// };

// Problem: 'this' inside the setTimeout callback refers to the global object (window or global), not Student.
// Student.getData(); // Without bind, 'this.FName' will be undefined.

// Solution: Use bind to set 'this' to the Student object.
var Student2 = {
    FName: "Alice",
    Location: "Some other place",
    Age: 22,
    subjectList: ['Chemistry', 'Biology'],
    getData: function() {
        setTimeout(function() {
            console.log("Data for " + this.FName + ": " + this.subjectList.join(", "));
        }.bind(this), 2000); // Bind 'this' to the current Student2 context
    }
};

Student2.getData(); // With bind, 'this' refers to Student2.


// Q8. Create an example of creating object with null prototype. What would be the purpose of the same?
// Creating an object with a null prototype using Object.create(null) serves a very specific purpose: to create
// a truly empty object, free from any inherited properties or methods.

// Purpose and Benefits:

//   Creating Pure Data Stores (Maps/Dictionaries):
//
//      When you need an object to act solely as a key-value store (like a dictionary or map), you don't want
//      any accidental interference from inherited properties.
//      For example, if you're storing patient-provided keys, there's a risk that a key might accidentally
//      shadow a property inherited from Object.prototype (like toString or hasOwnProperty).
//      Using Object.create(null) eliminates this risk, ensuring that your data store is completely isolated.
//
//   Avoiding Prototype Pollution:
//
//      Prototype pollution is a security vulnerability where an attacker can manipulate the prototype of
//      built-in JavaScript objects, potentially affecting the behavior of the entire application.
//      Using objects with null prototypes can help mitigate this risk by limiting the scope of potential
//      prototype modifications.
//
//   Performance Improvements (In Some Cases):
//
//      Accessing properties on an object with a null prototype is slightly faster than accessing properties
//      on a regular object, because the JavaScript engine doesn't have to traverse the prototype chain.
//      While the performance difference is usually negligible, it can be noticeable in performance-critical
//      applications that perform a large number of property lookups.
//
//   Creating Isolated Objects:
//
//      In situations where you need to create objects that are completely isolated from the standard JavaScript
//      object hierarchy, Object.create(null) is the ideal solution.
//      This can be useful for creating objects that represent data structures or entities in a specific domain.


console.log("\nQ8. ");

const nullPerson = Object.create(null);

// Add properties to the object:
nullPerson.name = "Joel";
nullPerson.value = 42;
console.log(nullPerson); // Output: { name: 'Example', value: 42 }
console.log(nullPerson.toString); // Output: undefined


// Q9. How do we merge different objects properties using Object class function

console.log("\nQ9. ");

const target = { a: 1, b: 2 };
const source1 = { b: 3, c: 4 };
const source2 = { d: 5 };

const mergedObject = Object.assign(target, source1, source2);

console.log(mergedObject); // Output: { a: 1, b: 3, c: 4, d: 5 }
console.log(target); // Output: { a: 1, b: 3, c: 4, d: 5 } (target object is modified)

const mergedObject1 = Object.assign({}, source1, source2);
console.log(mergedObject1); // Output: { a: 1, b: 3, c: 4, d: 5 }

// Q10. Create an object literal and export it to another file and import and show that there, by logging the value returned

console.log("\nQ10. ");

// person.js
const PersonExport = {
    name: "Joel",
    value: 45,
    greet: function() {
        return `Hello from ${this.name}!`;
    }
};

export default PersonExport; // Export the object

// main.js
import PersonExport from './person.js'; // Import the object

console.log(PersonExport); // Log the entire object
console.log(PersonExport.name); // Log a specific property
console.log(PersonExport.greet()); // Log the result of a method call

