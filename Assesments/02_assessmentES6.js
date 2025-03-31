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

//5. What is the difference between for-of and for-in show with examples
// for-of iterate over values
// for-in iterate over keys

//6. Give me an example of bind and write its usage, comparison with arrow function
//

//7. Create an example showing usage of event loop in concurrent execution cycle

//8. create an example showing usage of short hand and default param.

//9. Create two objects with some properties and merge them using Object method and ES6 way

//10. Give me an example of map and set collection each with at least four properties implemented - like get, set, clear, etc

//11. Create a promise object that get resloved after two seconds and rejected after three. Also it returns five ES6 features on resolved

//12. Use the spread and rest operator to create a function which can multiple numbers from 1...n (n is the number of choice)

//13. Use the question #11 to build promises using async and await - with multithread

//14. Create an example of generator function of your choice

//15. Explain your knowledge on function and object protoype what is the purpose of the same - example