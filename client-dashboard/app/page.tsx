"use client";
import { useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  completed: boolean;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");

  const fetchTasks = async () => {
    const res = await fetch("http://localhost:4000/tasks");
    const data = await res.json();
    setTasks(data);
  };

  const addTask = async () => {
    if (!title) return;

    await fetch("http://localhost:4000/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    setTitle("");
    fetchTasks();
  };

  // ✅ Toggle complete
  const toggleTask = async (task: Task) => {
    await fetch(`http://localhost:4000/tasks/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: task.title,
        completed: !task.completed,
      }),
    });

    fetchTasks();
  };

  // 🗑️ Delete task
  const deleteTask = async (id: number) => {
    await fetch(`http://localhost:4000/tasks/${id}`, {
      method: "DELETE",
    });

    fetchTasks();
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Client Task Dashboard</h1>

      {/* ➕ Add Task */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a task..."
          style={{ padding: "0.5rem", marginRight: "0.5rem" }}
        />
        <button onClick={addTask}>Add Task</button>
      </div>

      {/* 📋 Task List */}
      <ul>
        {tasks.map((task) => (
          <li key={task.id} style={{ marginBottom: "0.5rem" }}>
            
            {/* 👇 Click to toggle */}
            <span
              onClick={() => toggleTask(task)}
              style={{
                cursor: "pointer",
                textDecoration: task.completed ? "line-through" : "none",
                marginRight: "1rem",
              }}
            >
              {task.title} {task.completed ? "✅" : "❌"}
            </span>

            {/* 🗑️ Delete */}
            <button onClick={() => deleteTask(task.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}