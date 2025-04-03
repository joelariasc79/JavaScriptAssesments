// 31st March - 2025 : ES6, eventloop and core JS questions
// All questions are mandatory - 14 out of 15 needs to be done, 1st question is equal to two question so can't be left
// 7th requires proper elaboration and example

// 1. How to preserve the immutability on my heroes list? Solve below problems using the same
// Creates shallow copies of objects, which is essential for creating new objects based on existing ones without modifying the originals.
// a. Get heroes who are not evils
// b. Print Unique family names
// c. Print Hero Names from given objects, and append sir in each of them before printing
// d. Do we have any hero in Marvel Family who is not evil


const heroes = [
  { name: 'Wolverine',      family: 'Marvel',    isEvil: false },
  { name: 'Deadpool',       family: 'Marvel',    isEvil: false },
  { name: 'Magneto',        family: 'Marvel',    isEvil: true  },
  { name: 'Charles Xavier', family: 'Marvel',    isEvil: false },
  { name: 'Batman',         family: 'DC Comics', isEvil: false },
  { name: 'Harley Quinn',   family: 'DC Comics', isEvil: true  },
  { name: 'Legolas',        family: 'Tolkien',   isEvil: false },
  { name: 'Gandalf',        family: 'Tolkien',   isEvil: false },
  { name: 'Saruman',        family: 'Tolkien',   isEvil: true  }
]

// a.
const noneEvils = heroes.filter(hero => !hero.isEvil);
console.log("Good Heroes:", noneEvils);

// b.

const uniqueNamesReduce = heroes.reduce((unique, hero) => {
  if (!unique.includes(hero.name)) {
    unique.push(hero.name);
  }
  return unique;
}, [])

console.log("Unique Names:", uniqueNamesReduce);

//Alternative solution
const uniqueNames = [...new Set(heroes.map(hero => hero.name))];
console.log("Unique Names:", uniqueNames);

// c.
heroes.forEach(hero => console.log("Sr. " + hero.name));

// d.
const noneMarvel = heroes.filter(hero => hero.family === 'Marvel');
noneMarvelEvil = noneMarvel.filter(hero => !hero.isEvil);
const evilHeroCount = noneMarvelEvil.some(hero => hero.isEvil);

console.log("Are There Marvel Heroes: who are not evil", evilHeroCount);

//2. Use the spread and rest operator to create a function which can multiply numbers from 1...n (n is the number of choice),
//   using apply keyword we need to implement this one


let Multiplication = function (...numbers) {
  let mul = 0;

  mul = numbers.reduce((prevVal, currentVal, index, array )=>{
    return prevVal * currentVal;
  }, 1)

  return mul
}

function arrayOfNumbers(n) {
  start = 1;
  result =[]

    for (let i = start; i <= n; i++){
      result.push(i)

  }

  return result;
}

const numbers = arrayOfNumbers(5);
console.log("Numbers:", numbers);

const mul =Multiplication(...numbers);
console.log("Multiplication:", mul);


//3. Print the last name through destructuring and add a contact number:9119119110 as well
const person = {
    userDetails :{
        first: "Joel",
        last: "Arias"
    }
}

let userDetails = person.userDetails;
let {first, last} = userDetails;
console.log("First Name: " +first);
console.log("Last Name: "+ last);

//4. Give me an example of const data manipulation

const myArray = [1, 2, 3];

// But you *can* modify the contents of the array or object:
myArray.push(4); // myArray is now [1, 2, 3, 4]
console.log(myArray);

//5. What is the difference between for-of and for-in show with examples
// for-of iterate over values
// for-in iterate over keys

//6. Give me an example of bind and write its usage, comparison with arrow function

const button = {
  message: "Button clicked!",
  handleClick: function() {
    console.log(this.message); // 'this' refers to the button object
  }
};

// Without bind, 'this' inside handleClick would refer to the global object (window) in a browser or undefined in strict mode.
setTimeout(button.handleClick.bind(button), 1000); // Output after 1 second: Button clicked!

// *******************************************************************
// WIt Arrow Function:
const button1 = {
  message: "Button clicked!",
  handleClick: function() {
    setTimeout(() => {
      console.log(this.message);
    }, 1000);
  }
};

button1.handleClick(); //output after 1 second: Button 2 clicked.


//7. Create an example showing usage of event loop in concurrent execution cycle

// The JavaScript event loop is a mechanism that enables asynchronous programming, allowing JavaScript to handle non-blocking operations.
//
// Concepts:
//
// Single-Threaded Nature: JavaScript runs on a single thread, meaning it can only execute one task at a time.
// This could lead to issues if lengthy tasks block the thread. The event loop helps avoid such bottlenecks.
//
// Call Stack: JavaScript uses a "call stack" to manage the execution of function calls. When a function is invoked,
// it is pushed onto the stack. Once execution finishes, it is removed (popped) from the stack.
//
// Web APIs and Task Queue: When an asynchronous operation (like setTimeout, HTTP requests, or DOM events) is called,
// the browser or Node.js environment handles it in the background using Web APIs. Once the operation completes,
// a "callback function" is queued in the task queue (also called the message queue).
//
// Event Loop: The event loop continuously monitors the call stack and task queue. If the call stack is empty,
// it moves the first callback from the task queue to the call stack for execution.

setTimeout(() => {
  console.log("Inside setTimeout callback (after 2 seconds)");
}, 2000);

setTimeout(() => {
  console.log("Inside setTimeout callback (after 0 seconds)");
}, 0);

for (let i = 0; i < 1000; i++) {
  console.log(i);
}


//8. create an example showing usage of short hand and default param.

let name = "joel", lastName = "Arias", age = 45;


let persona = {
  name,
  lastName,
  age
}

console.log(persona);

//9. Create two objects with some properties and merge them using Object method and ES6 way

let estudiante = {
  major: "Computer Science"
}

// const mergedObj1 = Object.assign(obj1, obj2);
const people = Object.assign({}, persona, estudiante);
console.log("People: " , people);

//10. Give me an example of map and set collection each with at least four properties implemented - like get, set, clear, etc
// Map

const amigos = new Map();
amigos.set(people, "amigos");
console.log(amigos.get(people));
console.log(amigos.keys());
amigos.clear();
console.log(amigos.values());


// Set

const numeros = new Set();
numeros.add(5);
numeros.add(5);
numeros.add(1);
console.log(numeros);
console.log(numeros.has(3));
numeros.delete(5);
console.log(numeros);

//11. Create a promise object that get resolved after two seconds and rejected after three. Also it returns five ES6 features on resolved

const firstN = "Alice";
const ageP = 30;
const numb = [1, 2, 3, 4, 5];
const per = { firstName: "Bob", lastName: "Smith", city: "New York" };

let promiseObj = new Promise((resolve, reject)=>{
setTimeout(() => {
  resolve({
    "Template literals": `Hello, my name is ${firstN} and I am ${ageP} years old.`, // ES6 Feature 1
    "Arrow functions": numb.map(number => number * number), // ES6 Feature 2
    "Destructuring assignment": { firstName, city } = per, // ES6 Feature 3
    "Shorthand": {firstN, ageP}, // ES6 Feature 4
    "Default Param": function (a=0, b=0) {return a + b} // ES6 Feature 5
  })
}, 2000);

setTimeout(() => {
  reject({
    status : "Failed",
    code : 500,
    message : "Internal server error!!"
  })
}, 3000);

})


promiseObj
    .then((data)=>{ //this access the data send when promise is resolved
      console.log(data) //upon success you'll make call to authorization
    })
    .catch((err)=>{ // this access the data send when promise is rejected
      console.log(err)
    })


//13. Use the question #11 to build promises using async and await - with multithread

function createPromise() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        "Template literals": `Hello, my name is ${firstN} and I am ${ageP} years old.`,
        "Arrow functions": numb.map(number => number * number),
        "Destructuring assignment": { firstName: per.firstName, city: per.city }, // Corrected destructuring
        "Shorthand": { firstN, ageP },
        "Default Param": function (a = 0, b = 0) { return a + b }
      });
    }, 2000);

    setTimeout(() => {
      reject({
        status: "Failed",
        code: 500,
        message: "Internal server error!!"
      });
    }, 3000);
  });
}

async function processData() {
  try {
    const data = await createPromise();
    console.log("Promise resolved:", data);
    // Simulate authorization call (replace with your actual logic)
    console.log("Simulating authorization...");
    await simulateAuthorization(); // Simulate an async authorization call
  } catch (error) {
    console.error("Promise rejected:", error);
  }
}

async function simulateAuthorization() {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Authorization successful (simulated)");
      resolve();
    }, 1500);
  });
}

processData();

// Multithreading (using worker threads in Node.js)
const { Worker } = require('worker_threads');

async function processDataInWorker() {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js'); // Create a worker thread
    worker.on('message', resolve); // Listen for messages from the worker
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
    worker.postMessage({ firstN, ageP, numb, per }); // Send data to the worker
  });
}

async function main() {
  try {
    const workerResult = await processDataInWorker();
    console.log('Worker result:', workerResult);
  } catch (err) {
    console.error('Worker error:', err);
  }
}

main();



//14. Create an example of generator function of your choice


function* numberGenerator(start, end) {
  for (let i = start; i <= end; i++) {
    yield i;
  }
}

// Example usage:
const generator = numberGenerator(1, 5);

console.log(generator.next().value); // Output: 1
console.log(generator.next().value); // Output: 2
console.log(generator.next().value); // Output: 3
console.log(generator.next().value); // Output: 4
console.log(generator.next().value); // Output: 5
console.log(generator.next().value); // Output: undefined


//15. Explain your knowledge on function and object prototype what is the purpose of the same - example

// Function prototype: Functions in JavaScript automatically have a prototype property, which is itself an object.
// This property is key for creating inheritance among objects. When a function is used as a constructor (via new),
// the object created inherits from the prototype.

function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function() {
  console.log(`${this.name} makes a noise.`);
};

const dog = new Animal('Dog');
dog.speak();


// Object prototype: Every JavaScript object has a hidden, internal link to a prototype object.
// This prototype can either be another object or null. When trying to access a property or method,
// JavaScript first searches the object itself. If it doesn't find it there, it moves up the prototype chain.

const parentGreet = {
  greet() {
    console.log('Hello!');
  }
};

const childGreet = Object.create(parentGreet); // Sets the prototype of childObject as parentObject
childGreet.greet(); // Output: Hello!



// Purpose:

// Inheritance: Prototypes enable objects to share properties and methods without duplicating them across instances,
// reducing memory usage.
// Dynamic Behavior: You can modify or extend object behavior during runtime by altering the prototype.
// Performance: Instead of duplicating methods in every object, prototypes allow centralized definitions.