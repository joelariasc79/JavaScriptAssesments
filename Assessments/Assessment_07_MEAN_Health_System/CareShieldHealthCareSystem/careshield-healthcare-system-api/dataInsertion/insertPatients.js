// insertPatients.js
const mongoose = require('mongoose');
const UserModel = require('../dataModel/userDataModel'); // Adjust path if necessary

// Replace with your MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/vaccination_system'; // IMPORTANT: Change 'your_database_name'

const generateRandomData = (index) => {
    const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];
    const professions = ['Engineer', 'Teacher', 'Doctor', 'Artist', 'Student', 'Retired', 'Manager', 'Analyst'];
    // Expanded list of diseases for more variety
    const diseases = ['None', 'Diabetes', 'Hypertension', 'Asthma', 'Arthritis', 'Allergies', 'Chronic Bronchitis', 'Heart Disease', 'Kidney Disease', 'Autoimmune Disorder', 'Depression'];
    const streetNames = ['Main St', 'Oak Ave', 'Pine Ln', 'Elm Blvd', 'Maple Dr', 'Cedar Rd', 'Birch St'];
    const cities = ['Springfield', 'Rivertown', 'Oakville', 'Lakeview', 'Centerville', 'Greenwood', 'Fairview'];
    const states = ['NY', 'CA', 'TX', 'FL', 'IL', 'PA', 'OH'];
    const zipCodes = ['10001', '90210', '75001', '33101', '60601', '19101', '43001'];
    const medicalPractitioners = ['Dr. Alice Smith', 'Dr. Bob Johnson', 'Dr. Carol White', 'Dr. David Green', 'Dr. Emily Brown', 'Dr. Frank Miller'];

    // Function to get a random subset of an array
    const getRandomSubset = (arr, maxCount) => {
        const shuffled = arr.sort(() => 0.5 - Math.random()); // Shuffle array
        const count = Math.floor(Math.random() * (maxCount + 1)); // 0 to maxCount items
        return shuffled.slice(0, count);
    };

    const selectedDiseases = getRandomSubset(diseases.filter(d => d !== 'None'), 3); // Get up to 3 diseases, excluding 'None'

    // If no diseases are selected, explicitly add 'None'
    const finalDiseases = selectedDiseases.length > 0 ? selectedDiseases : ['None'];


    return {
        username: `patient${index + 1}`,
        email: `patient${index + 1}@example.com`,
        password: 'test123', // This will be hashed by the pre-save hook
        name: `Patient ${index + 1}`,
        age: Math.floor(Math.random() * 50) + 20, // Age between 20 and 70
        profession: professions[Math.floor(Math.random() * professions.length)],
        contact_number: `+1-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        address: {
            street: `${Math.floor(Math.random() * 999) + 1} ${streetNames[Math.floor(Math.random() * streetNames.length)]}`,
            city: cities[Math.floor(Math.random() * cities.length)],
            state: states[Math.floor(Math.random() * states.length)],
            zipCode: zipCodes[Math.floor(Math.random() * zipCodes.length)],
            country: 'USA'
        },
        gender: genders[Math.floor(Math.random() * genders.length)],
        pre_existing_disease: finalDiseases, // Assign the array of selected diseases
        medical_certificate_url: `https://example.com/certs/patient${index + 1}.pdf`,
        role: 'patient',
        medical_practitioner: medicalPractitioners[Math.floor(Math.random() * medicalPractitioners.length)]
    };
};

const insertPatients = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully.');

        // Clear existing patient data (optional, uncomment if you want to start fresh)
        // await UserModel.deleteMany({ role: 'patient' });
        // console.log('Existing patient data cleared.');

        const patientsToInsert = [];
        for (let i = 0; i < 100; i++) {
            patientsToInsert.push(generateRandomData(i));
        }

        console.log(`Attempting to insert ${patientsToInsert.length} patient records...`);

        const savedUsers = [];
        for (const patientData of patientsToInsert) {
            try {
                const newUser = new UserModel(patientData);
                const savedUser = await newUser.save();
                savedUsers.push(savedUser);
            } catch (error) {
                console.error(`Error saving patient ${patientData.username}:`, error.message);
                // Continue to try to save other patients even if one fails
            }
        }


        console.log(`Successfully inserted ${savedUsers.length} patients.`);
        savedUsers.forEach(user => {
            console.log(`- User: ${user.username}, Email: ${user.email}, Diseases: ${user.pre_existing_disease.join(', ')}, Role: ${user.role}`);
        });

    } catch (error) {
        console.error('Error during database operation:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
};

insertPatients();