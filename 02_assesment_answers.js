


// Practice -


console.log("\nPractice: ")


// Questions for practice

// 1. print firstname, total marks and Individual Subject Marks, using object and nested destructuring
let Student = {
    FirstName : "Stacy",
    Standard : "Higher Secondary",
    Session : "Final Session",
    TotalMarks : "75%",
    Subject : {
        Physics : 80,
        Chemistry : 89,
        Language : 92
    }
}

let {FirstName, TotalMarks, Subject} = Student


console.log("\n1 .")
console.log(FirstName)
console.log(TotalMarks)
console.log(Subject)

// 2. along with that also create a lastname and Ecology as (marks) "95", without making any change in Student

let StudentWithLastName = {
    ...Student, // Spread the original Student object
    LastName: "Smith", // Add the LastName property
    Subject: {
        ...Student.Subject, // Spread the original Subject object
        Ecology: 95 // Add the Ecology property
    }
};

console.log("\n2 .")
console.log(StudentWithLastName);


// 3. create an array of your aspirations, print first three to achieve in 2024,25,26 and keep others in ...rest operator,
// using array destructuring

let aspirations = [
    "Master a new programming language",
    "Publish a technical blog post",
    "Complete a challenging personal project",
    "Run a half-marathon",
    "Travel to a new country",
    "Learn a musical instrument",
    "Volunteer regularly at a local charity",
    "Read 50 books",
    "Start a small business",
    "Improve public speaking skills"
];

let [aspiration2024, aspiration2025, aspiration2026, ...rest] = aspirations;

console.log("\n3 .")
console.log("Aspirations for 2024:", aspiration2024);
console.log("Aspirations for 2025:", aspiration2025);
console.log("Aspirations for 2026:", aspiration2026);
console.log("Remaining Aspirations:", rest);


// 4. create a function with name multiply which accepts three parameters, and return multiplication of all
// but if we dont pass any parameter it returns 0

function Multiplication(p1=1, p2=1, p3=1) {
    if (p1 && p2 && p3) {
        return p1*p2*p3
    }
    else{
        return 0
    }

    return p1+p2+p3
}

console.log("\n4 .")
console.log(Multiplication())
console.log(Multiplication(1,2,3))
console.log(Multiplication(1,2))
console.log(Multiplication(1))

// 5. create an array of 1 - 5 and add arr[newval] = at 6th place, print the output using for of and for in loop

console.log("\n5 .")
let arr =[6 ,7,8]
let arrNum = [1,2,3,4,5,arr]

console.log("\non:")
for (num in arrNum) {
    console.log(arrNum[num])
}

console.log("\nof:")
for (num of arrNum) {
    console.log(num)
}

// 6. create an example of const where we can update on property of the object, where it says const is mutable
console.log("\n6 .")

const mutable = {a:"a",b:"b"}
mutable.b = "mutable";

console.log(mutable)

// 7. create a for loop using var and let, print each value in timeout after 2 second and try to
// demonstrate functional scope of var and lexical of let

console.log("\n7 .")

for (var i = 0; i  < 5; i++) {
    setTimeout(() => {
        console.log(i)
    }, 2000);
}

for (let index = 0; index < 5; index++) {
    setTimeout(() => {
        console.log(index)
    }, 2000);
} // 0 1 2 3 4