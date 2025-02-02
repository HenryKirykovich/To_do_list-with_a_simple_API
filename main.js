// Select elements
const authForm = document.getElementById("my-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const todoSection = document.getElementById("todo-section");
const todoList = document.getElementById("todo-list");

// Listen for form submission (Registration or Login)
authForm.addEventListener("submit", async(event) => {
    event.preventDefault(); // Prevent page refresh

    const username = usernameInput.value;
    const password = passwordInput.value;

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    // Determine which button was clicked
    const clickedButton = event.submitter.classList.contains("btn") ? "login" : "register";
    if (clickedButton === "register") {
        await registerUser(username, password);
    } else {
        await loginUser(username, password);
    }
});


// Register function
async function registerUser(username, password) {
    try {
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.status === 201) {
            alert("🎉 Registration successful! Now please log in.");

            // Automatically clear input fields
            usernameInput.value = "";
            passwordInput.value = "";

            // Optional: Auto-focus on username input for login
            usernameInput.focus();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error("Registration error:", error);
        alert("An error occurred while registering. Please try again.");
    }
}

// Login function
async function loginUser(username, password) {
    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.status === 200) {
            console.log("Received Token:", data.token); // Debugging: Log the token

            // Save token in cookies
            document.cookie = `authToken=${data.token}; path=/; Secure`;

            authForm.style.display = "none"; // Hide login form
            todoSection.style.display = "block"; // Show todo list
            fetchTodos(); // Fetch user's todos
        } else {
            alert("Login failed: " + data.message);
        }
    } catch (error) {
        console.error("Login error:", error);
    }
}

// Fetch todos
async function fetchTodos() {
    const authToken = getCookie("authToken");
    if (!authToken) {
        alert("You must be logged in!");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/todos", {
            method: "GET",
            headers: { "Authorization": `Bearer ${authToken}` }
        });

        const todos = await response.json();
        displayTodos(todos);
    } catch (error) {
        console.error("Error fetching todos:", error);
    }
}


// Display todos
function displayTodos(todos) {
    const todoList = document.getElementById("todo-list");
    todoList.innerHTML = ""; // Clear old items

    todos.forEach(todo => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `<span><strong>${todo.title}</strong>: ${todo.description}</span>`;

        // Create a container for buttons
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("todo-buttons");

        // "Complete" Button
        const completeBtn = document.createElement("button");
        completeBtn.textContent = "Complete";
        completeBtn.classList.add("complete-btn");
        completeBtn.addEventListener("click", () => markTodoComplete(todo.id));

        // "Edit" Button
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.classList.add("edit-btn");
        editBtn.addEventListener("click", () => editTodo(todo));

        // "Delete" Button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";

        deleteBtn.classList.add("delete-btn");
        deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

        // Append buttons inside the container
        buttonContainer.appendChild(completeBtn);
        buttonContainer.appendChild(editBtn);
        buttonContainer.appendChild(deleteBtn);

        // Append the button container to the list item
        listItem.appendChild(buttonContainer);

        // Append the List Item to the Todo List
        todoList.appendChild(listItem);
    });
}

async function markTodoComplete(todoId) {
    const authToken = getCookie("authToken");

    if (!authToken) {
        alert("❌ You are not authenticated. Please log in again.");
        return;
    }

    console.log(`🔍 Marking Task ${todoId} as complete`);

    try {
        // ✅ Step 1: Mark as Complete
        const updateResponse = await fetch(`http://localhost:3000/todos/${todoId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({
                completed: true // ✅ Only update completion status
            })
        });

        if (!updateResponse.ok) {
            alert("❌ Failed to update task.");
            return;
        }

        alert("✅ Task marked as complete!");

        // ✅ Step 2: Delete the Task After Completing
        const deleteResponse = await fetch(`http://localhost:3000/todos/${todoId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${authToken}` }
        });

        if (deleteResponse.ok) {
            console.log(`🗑️ Task ${todoId} deleted.`);
            fetchTodos(); // ✅ Refresh the list
        } else {
            alert("❌ Task completed, but failed to delete.");
        }
    } catch (error) {
        console.error("❌ Error updating/deleting todo:", error);
        alert("❌ An error occurred.");
    }
}



function editTodo(todo) {
    const newTitle = prompt("Edit Title:", todo.title);
    const newDescription = prompt("Edit Description:", todo.description);

    if (!newTitle || !newDescription) {
        alert("❌ Both title and description are required!");
        return;
    }

    updateTodo(todo.id, newTitle, newDescription);
}

async function updateTodo(todoId, title, description) {
    const authToken = getCookie("authToken");

    if (!authToken) {
        alert("❌ You are not authenticated. Please log in again.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/todos/${todoId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({
                title,
                description
            })
        });

        if (response.ok) {
            alert("✅ Task updated successfully!");
            fetchTodos(); // ✅ Refresh list after editing
        } else {
            const errorText = await response.text();
            console.error("❌ Update failed:", errorText);
            alert("❌ Failed to update todo.");
        }
    } catch (error) {
        console.error("❌ Error updating todo:", error);
    }
}


// Get token from cookies
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
}





// Delete todo
async function deleteTodo(todoId) {
    const authToken = getCookie("authToken");

    try {
        const response = await fetch(`http://localhost:3000/todos/${todoId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${authToken}` }
        });

        if (response.status === 204) {
            fetchTodos(); // Refresh list
        } else {
            alert("Failed to delete todo.");
        }
    } catch (error) {
        console.error("Error deleting todo:", error);
    }
}

// Add Todo Button Click Event
document.getElementById("add-todo").addEventListener("click", async() => {
    const title = document.getElementById("todo-title").value.trim();
    const description = document.getElementById("todo-description").value.trim();
    const authToken = getCookie("authToken");

    if (!authToken) {
        alert("You are not authenticated. Please log in again.");
        return;
    }

    if (!title || !description) {
        alert("Please enter a title and description.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/todos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({ title, description })
        });

        if (response.ok) {
            alert("Todo added successfully!");
            document.getElementById("todo-title").value = ""; // Clear input
            document.getElementById("todo-description").value = ""; // Clear input
            fetchTodos(); // Refresh the todo list
        } else {
            const errorMessage = await response.json();
            alert("Failed to add todo: " + (errorMessage.message || "Unknown error"));
        }
    } catch (error) {
        console.error("Error adding todo:", error);
        alert("An error occurred while adding the todo.");
    }
});


document.getElementById("logout-btn").addEventListener("click", () => {
    // Remove authToken cookie
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Hide Todo Section, Show Login Form
    authForm.style.display = "block";
    todoSection.style.display = "none";

    // Optional: Clear input fields
    usernameInput.value = "";
    passwordInput.value = "";
});