document.addEventListener('DOMContentLoaded', () => {
    // loading user data from localStorage. if there's nothing, start with an empty array and 0 exp.
    const userData = JSON.parse(localStorage.getItem('userData')) || { tasks: [], userExp: 0 }; 
    const tasks = userData.tasks; 
    let userExp = userData.userExp; 

    // function to calculate the user's level based on their exp.
    const calculateLevel = () => {
        let level = 1;
        let expNeeded = 10; // Starting with 10 points needed for level 1
        let totalExp = 0;

        // This loop keeps doubling the exp Needed until user has enough exp to level up.
        while (userExp >= totalExp + expNeeded) {
            totalExp += expNeeded;
            expNeeded *= 2; // Doubling the points needed for the next level
            level++;
        }

        return { level, expNeeded, totalExp }; // level info
    };

    // function to calculate time left until a task's deadline
    const calculateTimeLeft = (deadline) => {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diffMs = deadlineDate - now; // in milliseconds

        if (diffMs <= 0) {
            return "Deadline Passed"; 
        }

        // Converting milliseconds to days, hours and mins.
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        // Returns string showing time left
        if (diffDays > 0) {
            return `${diffDays} days ${diffHours} hours`;
        } else if (diffHours > 0) {
            return `${diffHours} hours ${diffMinutes} mins`;
        } else {
            return `${diffMinutes} mins`;
        }
    };

    // dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');

    darkModeToggle.addEventListener('change', (e) => {
        document.body.classList.toggle('dark-mode', e.target.checked);
    }); 

    //function to render the tasks in the table.
    const renderTasks = () => {
        const tbody = document.querySelector('tbody');
        tbody.innerHTML = ''; // Clearing the table
        const sortedTasks = tasks.slice().sort((a, b) => {
            // Sort tasks by completion status and timestamp.
            if (a.completed === b.completed) {
                return a.timestamp - b.timestamp;
            }
            return a.completed - b.completed; // Incomplete tasks come first
        });
        sortedTasks.forEach((task) => {
            const row = document.createElement('tr');
            row.className = task.completed ? 'completed-row' : ''; // Add a class if the task is completed
            
            // Add click event to the entire row to toggle completion.
            row.addEventListener('click', (e) => {
                if (!e.target.closest('button')) { // for not toggling if clicking delete button
                    toggleTaskCompletion(task.id);
                }
            });

            // row with task info.
            row.innerHTML = `
                <td class="${task.completed ? 'completed' : ''}">${task.completed ? '✔️' : '⭕'} ${task.task}</td>
                <td>${calculateTimeLeft(task.date)}</td>
                <td>
                    <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="event.stopPropagation(); toggleTaskCompletion(${task.id})">
                </td>
                <td>
                    <i class="fas fa-trash" onclick="deleteTask(${task.id}); event.stopPropagation();" style="cursor: pointer;"></i>
                </td>
            `;
            tbody.appendChild(row); // Add the row to the table
        });
    };

    // This function updates the user's level display
    const renderLevel = () => {
        const { level, expNeeded, totalExp } = calculateLevel(); // Get the current level info
        document.getElementById('levelText').textContent = `Level: ${level}`; // Show level
        document.getElementById('expText').textContent = `${userExp - totalExp} / ${expNeeded}`; // Show experience points
    
        // Update the progress bar in the level section
        const levelProgressBar = document.querySelector('#levelSection .progress-bar-inner'); // Target the progress bar in the level section
        levelProgressBar.style.width = `${((userExp - totalExp) / expNeeded) * 100}%`; // Update the progress bar
    
        // Update the progress bar in the navigation section
        const navProgressBar = document.querySelector('nav .progress-bar-inner'); // Target the progress bar in the navigation
        navProgressBar.style.width = `${((userExp - totalExp) / expNeeded) * 100}%`; // Update the progress bar
    };
    
    // saves the tasks and user data to localStorage. 
    const saveTasks = () => {
        const userData = {
            tasks: tasks,
            userExp: userExp
        };
        localStorage.setItem('userData', JSON.stringify(userData)); // Save everything to localStorage
    };

    // renders the task history.
    const renderHistory = () => {
    const historyTableBody = document.getElementById('historyTableBody');
    historyTableBody.innerHTML = ''; // Clear existing rows
    const history = JSON.parse(localStorage.getItem('taskHistory')) || []; // Get task history from localStorage

    if (history.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" style="text-align: center;">No history available</td>`;
        historyTableBody.appendChild(row);
    } else {
        history.forEach((task) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${task.task}</td>
                <td>${task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'}</td>
                <td>${task.completedAt ? new Date(task.completedAt).toLocaleString() : 'Not Completed'}</td>
                <td>${task.points}</td>
                <td>${task.deletedAt ? new Date(task.deletedAt).toLocaleString() : 'Not Deleted'}</td>
            `;
            historyTableBody.appendChild(row); // Add the row to the history table
        });
    }
};

    // toggles the completion status of a task
    window.toggleTaskCompletion = (id) => {
        const task = tasks.find((task) => task.id === id); // Find the task by ID
        if (task) {
            task.completed = !task.completed; // Toggle the completed status
            task.completedAt = task.completed ? new Date().toISOString() : null; // Set completion date if completed
            userExp += task.completed ? task.points : -task.points; // Update user experience points
            renderTasks(); // Re-render the tasks
            renderLevel(); // Update the level display
            saveTasks(); // Save the updated tasks
        } else {
            console.error("Task not found for the given ID:", id); // Log error if task isn't found
        }
    };

    // deletes a task and saves it to history.
    window.deleteTask = (id) => {
        const taskIndex = tasks.findIndex(task => task.id === id); // Find the index of the task
        if (taskIndex !== -1) {
            const deletedTask = tasks[taskIndex]; // Get the task to delete
            deletedTask.deletedAt = new Date().toISOString(); // Set deletion date
            // Store the deleted task in history
            const history = JSON.parse(localStorage.getItem('taskHistory')) || [];
            history.push(deletedTask); // Add to history
            localStorage.setItem('taskHistory', JSON.stringify(history)); // Save history to localStorage

            tasks.splice(taskIndex, 1); // Remove the task from the tasks array
            renderTasks(); // Re-render the tasks
            saveTasks(); // Save the updated tasks
        }
    };

    // toggles the task form visibility.
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        document.getElementById('taskForm').classList.toggle('hidden'); // Show or hide the task form
    });

    // resets the user's level.
    document.getElementById('resetLevelBtn').addEventListener('click', () => {
        userExp = 0; // Reset user experience points to 0
        const { level, expNeeded, totalExp } = calculateLevel(); // Recalculate level
        renderLevel(); // Update the level display
        saveTasks(); // Save the updated user data
    });

    let taskIdCounter = 0; // counter for task IDs, helps to keep track of each task uniquely.
    document.getElementById('addTaskForm').addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent the default form submission
        const task = document.getElementById('taskDescription').value; // Get the task description
        const date = document.getElementById('taskDate').value; // Get the task deadline
        const points = parseInt(document.getElementById('taskPoints').value, 10); // Get the points for the task
        const timestamp = Date.now(); // Get the current timestamp
        tasks.push({
            id: taskIdCounter++, // Assign a unique ID to the task
            task,
            date,
            points,
            completed: false, // New tasks start as not completed
            timestamp,
            createdAt: new Date().toISOString(), // Store the creation date
            completedAt: null, // Initially null since it's not completed yet
            deletedAt: null // Initially null since it hasn't been deleted
        });
        renderTasks(); // Re-render the tasks to show the new one
        saveTasks(); // Save the updated tasks to localStorage
        document.getElementById('taskForm').classList.add('hidden'); // Hide the task form after adding
    });

    // switching between different sections of the app
    document.getElementById('homeBtn').addEventListener('click', () => {
        document.getElementById('tasksSection').classList.remove('hidden'); // Show tasks section
        document.getElementById('levelSection').classList.add('hidden'); // Hide level section
        document.getElementById('historySection').classList.add('hidden'); // Hide history section
    });

    document.getElementById('levelBtn').addEventListener('click', () => {
        document.getElementById('tasksSection').classList.add('hidden'); // Hide tasks section
        document.getElementById('levelSection').classList.remove('hidden'); // Show level section
        document.getElementById('historySection').classList.add('hidden'); // Hide history section
        renderLevel(); // Update the level display
    });

    document.getElementById('historyBtn').addEventListener('click', () => {
        document.getElementById('tasksSection').classList.add('hidden'); // Hide tasks section
        document.getElementById('levelSection').classList.add('hidden'); // Hide level section
        document.getElementById('historySection').classList.remove('hidden'); // Show history section
        renderHistory(); // Render the history when the History tab is opened
    });

    document.getElementById('resetHistoryBtn').addEventListener('click', () => {
        // Clear the task history from local storage
        localStorage.removeItem('taskHistory');
        
        // Re-render the history section to reflect the changes
        renderHistory();
    });

    renderTasks(); // Initial render of tasks when the page loads
    renderLevel(); // Initial render of the user's level
});