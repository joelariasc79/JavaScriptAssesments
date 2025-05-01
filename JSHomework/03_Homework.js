// try writing your favourite quotes on life lessons or from tech experts in expression you need to write the expert name or reference


let favouritesQuetoes = `
Life Lessons:

"The impediment to action advances action. What stands in the way becomes the way."
Marcus Aurelius (Stoic Philosopher)
My take: This is a powerful reminder that obstacles aren't roadblocks, but opportunities. Challenges force us to adapt, 
innovate, and ultimately grow. It's about shifting perspective, and seeing the potential for learning within every adversity.

"Our greatest glory is not in never falling, but in rising every time we fall."
Confucius (Chinese Philosopher)
My take: Resilience is key. It's not about avoiding failure, which is impossible, but about having the courage 
and determination to pick ourselves up and keep moving forward. Every "rise" makes us stronger.

"The best time to plant a tree was 20 years ago. The second best time is now."
Chinese Proverb
My take: Procrastination is a thief of dreams. This quote is a gentle nudge to stop waiting for the "perfect" moment. 
The best time to start is always now.

"You must be the change you wish to see in the world."
Mahatma Gandhi (Indian Activist)
My take: Real change starts with individual action. We can't wait for others to create the world we want; 
we must embody those values ourselves. It is a very personal and powerful lesson.`


console.log(favouritesQuetoes);


// Questions :
// Spread Operator -
// create a list of vaccines and print
// create doctor object and print his qualifications and other details using spread
// create a vaccine object with details like - name, no of doses required, price etc and merge it with nearest doctor object using spread


let vaccines = ["COVID-19", "Influenza (Flu)","MMR","DTaP/Tdap","Polio","Hepatitis A","Hepatitis B","HPV (Human Papillomavirus"]

console.log("vaccines: " + vaccines)

let doctor = {
    FirstName: "Joshep",
    LastName: "Hernadez",
    Age: 65,
    UndergraduateEducation: "bachelor's degree in Health",
    MedicalSchool: "Harvard Medical School (Massachusetts)",
    BoardCertification: "American Board of Otolaryngology"
}

const vaccineInfo = {
    "COVID-19": {
        doses: "Varies (initial series + boosters)",
        price: "Varies (often free with insurance or government programs)",
    },
    "Influenza (Flu)": {
        doses: "1 (annual)",
        price: "Varies (often covered by insurance)",
    },
    "MMR": {
        doses: "1-2",
        price: "Varies",
    },
    "DTaP/Tdap": {
        doses: "Varies (series + boosters)",
        price: "Varies",
    },
    "Polio": {
        doses: "4",
        price: "Varies",
    },
    "Hepatitis A": {
        doses: "2",
        price: "Varies",
    },
    "Hepatitis B": {
        doses: "3",
        price: "Varies",
    },
    "HPV (Human Papillomavirus)": {
        doses: "2-3",
        price: "Varies",
    },
};

console.log(vaccineInfo);


const doctorVaccines = {...doctor, ...vaccineInfo};

console.log(doctorVaccines);


// Rest Parameter -
// create a function which accepts start and end of number and generates a array of that size, [100....150]
// then use this array to pass as spread operator into a function named largesum
// in largesum we should accept the array in rest parameter (...arrayOfNums), and then add the numbers

function arrayOfNumbers(start, end) {
    result =[]
    if (end >= start){
        for (let i = start; i <= end; i++){
            result.push(i)
        }
    }

    return result;
}

let arrayNum = arrayOfNumbers(100, 110)
console.log(arrayNum)

console.log(LargeSum(...arrayNum))


// Task - create a class named as account accepting 3 or more params  like - name, acct, type etc and
// has three methods to show balance, user details and account offers

class Account{
    currentBalance = 5426
    accountOffers = "None"

    constructor(name, account , type){
        this.name = name
        this.account = account
        this.type = type
    }

    getBalance = ()=>console.log("Balance: " + this.currentBalance);

    getUserDetails = ()=>{
        console.log("\nUser details: ")
        console.log("Account Number: " + this.account);
        console.log("Name: " + this.name);
        console.log("Type: " + this.type);
    }

    getOffers = ()=>console.log("Account Offeres: " + this.accountOffers);

}

let user = new Account("Joel",6, "admin")

console.log(user);

user.getBalance();

user.getUserDetails();
user.getOffers();
