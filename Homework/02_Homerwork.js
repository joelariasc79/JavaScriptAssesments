// Create two examples of your own choice to make a strong map and a weak map
// and a list of unique names of 10 states of your favourite country you wish to visit on world tour

let weakMap = new WeakMap();
let obj2 = { Name: 'Joel' };
weakMap.set(obj2, 'weakData');
console.log(weakMap.get(obj2))


let strongMap = new Map();
let obj = { Name: 'Joel' };
strongMap.set(obj, 'data');
console.log(strongMap)


const mexicanStates = [
    "Aguascalientes",
    "Baja California",
    "Baja California Sur",
    "Campeche",
    "Chiapas",
    "Chihuahua",
    "Coahuila",
    "Colima",
    "Durango",
    "Guanajuato",
];

console.log(mexicanStates);