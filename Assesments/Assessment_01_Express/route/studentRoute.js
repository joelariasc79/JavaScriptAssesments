const expressObj = require('express');

// const studentRoute = expressObj.Router();
const path = require('path');


let studentRouter = expressObj.Router({}) //options - strict, readonly etc


// 1. GET /route - Get all students (similar to default route)
studentRouter.get('/list', (req, res) => {
    res.send('List of students');
});


studentRouter.get('/list3Students', (req, res) => {
    const students = [
        { id: 1, name: 'Alice', major: 'Computer Science' },
        { id: 2, name: 'Bob', major: 'Engineering' },
        { id: 3, name: 'Charlie', major: 'Mathematics' },
    ];
    res.json(students);
});

// 2. GET /route/:studentId - Get a specific route using route parameter
studentRouter.get('/:studentId', (req, res) => {
    const studentId = req.params.studentId;
    const students = [
        { id: 1, name: 'Alice', major: 'Computer Science' },
        { id: 2, name: 'Bob', major: 'Engineering' },
        { id: 3, name: 'Charlie', major: 'Mathematics' },
    ];
    const route = students.find(s => s.id === parseInt(studentId));

    if (route) {
        res.json(route);
    } else {
        res.status(404).json({ message: `Student with ID ${studentId} not found` });
    }
});

// 3. GET /route/transcript - Send a static file as a response
studentRouter.get('/transcript', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'Git_DevOps_Assessment.pdf');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Error sending transcript');
        } else {
            console.log('Transcript sent successfully');
        }
    });
});

// 4. GET /route/search - Get students based on query string parameters
studentRouter.get('/search', (req, res) => {
    const { major, name } = req.query;
    let students = [
        { id: 1, name: 'Alice', major: 'Computer Science' },
        { id: 2, name: 'Bob', major: 'Engineering' },
        { id: 3, name: 'Charlie', major: 'Mathematics' },
        { id: 4, name: 'David', major: 'Computer Science' },
        { id: 5, name: 'Eve', major: 'Engineering' },
    ];

    if (major) {
        students = students.filter(s => s.major.toLowerCase() === major.toLowerCase());
    }
    if (name) {
        students = students.filter(s => s.name.toLowerCase().includes(name.toLowerCase()));
    }

    res.json(students);
});

// 5. POST /route/enroll - Enroll a new route (API of your choice)
studentRouter.post('/enroll', expressObj.json(), (req, res) => {
    const { name, major } = req.body;
    if (name && major) {
        const newStudent = { id: Date.now(), name, major };
        // In a real application, you would save this to a database
        console.log('Enrolling route:', newStudent);
        res.status(201).json({ message: 'Student enrolled successfully', route: newStudent });
    } else {
        res.status(400).json({ message: 'Please provide name and major for enrollment' });
    }
});

module.exports = studentRouter;
