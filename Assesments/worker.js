
const { parentPort } = require('worker_threads');

parentPort.on('message', (data) => {
  const { firstN, ageP, numb, per } = data;
  setTimeout(() => {
    parentPort.postMessage({
      "Template literals": `Hello, my name is ${firstN} and I am ${ageP} years old.`,
      "Arrow functions": numb.map(number => number * number),
      "Destructuring assignment": { firstName: per.firstName, city: per.city },
      "Shorthand": { firstN, ageP },
      "Default Param": function (a = 0, b = 0) { return a + b }
    });
  }, 2000);
});