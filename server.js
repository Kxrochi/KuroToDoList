// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON bodies
app.use(express.json());

let tasks = []; // In-memory task storage
let taskIdCounter = 1; // Simple ID counter for tasks

// Route to serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to fetch tasks
app.get('/tasks', (req, res) => {
    res.json(tasks);
});

// Route to create a new task
app.post('/tasks', (req, res) => {
    const { task, date, points } = req.body;
    const newTask = { id: taskIdCounter++, task, date, points, completed: false, timestamp: Date.now() }; // Add timestamp
    tasks.push(newTask);
    res.json(newTask);
});

// Route to update task completion
app.put('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed; // Toggle completion
        res.json(task);
    } else {
        res.status(404).send('Task not found');
    }
});

// Route to delete a task
app.delete('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    tasks = tasks.filter(t => t.id !== taskId);
    res.status(204).send(); // No content
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});