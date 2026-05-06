"use client";
import { useEffect, useState } from "react";

type Project = {
  id: number;
  name: string;
};

type Task = {
  id: number;
  title: string;
  completed: boolean;
  project_id: number;
};

export default function Home() {
  const [token, setToken] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);

  const [newProject, setNewProject] = useState("");
  const [newTask, setNewTask] = useState("");

  // ==========================
  // 🔐 SIGNUP
  // ==========================
  const signup = async () => {
    await fetch("http://localhost:4000/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    alert("Signup successful");
  };

  // ==========================
  // 🔑 LOGIN
  // ==========================
  const login = async () => {
    const res = await fetch("http://localhost:4000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    localStorage.setItem("token", data.token);

    setToken(data.token);

    fetchProjects(data.token);
  };

  // ==========================
  // 📁 FETCH PROJECTS
  // ==========================
  const fetchProjects = async (passedToken?: string) => {
    const savedToken =
      passedToken || localStorage.getItem("token");

    if (!savedToken) return;

    const res = await fetch("http://localhost:4000/projects", {
      headers: {
        Authorization: `Bearer ${savedToken}`,
      },
    });

    const data = await res.json();

    setProjects(data);

    // auto-select first project
    if (data.length > 0) {
      setSelectedProject(data[0]);
      fetchTasks(data[0].id, savedToken);
    }
  };

  // ==========================
  // 📥 FETCH TASKS
  // ==========================
  const fetchTasks = async (
    projectId: number,
    passedToken?: string
  ) => {
    const savedToken =
      passedToken || localStorage.getItem("token");

    if (!savedToken) return;

    const res = await fetch(
      `http://localhost:4000/tasks?project_id=${projectId}`,
      {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      }
    );

    const data = await res.json();

    setTasks(data);
  };

  // ==========================
  // ➕ CREATE PROJECT
  // ==========================
  const createProject = async () => {
    const savedToken = localStorage.getItem("token");

    if (!newProject || !savedToken) return;

    await fetch("http://localhost:4000/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${savedToken}`,
      },
      body: JSON.stringify({
        name: newProject,
      }),
    });

    setNewProject("");

    fetchProjects();
  };

  // ==========================
  // ➕ CREATE TASK
  // ==========================
  const createTask = async () => {
    const savedToken = localStorage.getItem("token");

    if (
      !newTask ||
      !selectedProject ||
      !savedToken
    ) return;

    await fetch("http://localhost:4000/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${savedToken}`,
      },
      body: JSON.stringify({
        title: newTask,
        project_id: selectedProject.id,
      }),
    });

    setNewTask("");

    fetchTasks(selectedProject.id);
  };

  // ==========================
  // ✅ TOGGLE TASK
  // ==========================
  const toggleTask = async (task: Task) => {
    const savedToken = localStorage.getItem("token");

    await fetch(`http://localhost:4000/tasks/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${savedToken}`,
      },
      body: JSON.stringify({
        title: task.title,
        completed: !task.completed,
      }),
    });

    fetchTasks(task.project_id);
  };

  // ==========================
  // 🗑️ DELETE TASK
  // ==========================
  const deleteTask = async (task: Task) => {
    const savedToken = localStorage.getItem("token");

    await fetch(`http://localhost:4000/tasks/${task.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${savedToken}`,
      },
    });

    fetchTasks(task.project_id);
  };

  // ==========================
  // 🔄 RESTORE SESSION
  // ==========================
  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (savedToken) {
      setToken(savedToken);
      fetchProjects(savedToken);
    }
  }, []);

  // ==========================
  // UI
  // ==========================
  if (!token) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>Client Task Dashboard</h1>

        <div>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button onClick={signup}>
            Signup
          </button>

          <button onClick={login}>
            Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        display: "flex",
        height: "100vh",
      }}
    >
      {/* ==========================
          SIDEBAR
      ========================== */}
      <aside
        style={{
          width: "300px",
          borderRight: "1px solid #ccc",
          padding: "1rem",
        }}
      >
        <h2>Projects</h2>

        <div
          style={{
            marginBottom: "1rem",
          }}
        >
          <input
            placeholder="New project"
            value={newProject}
            onChange={(e) =>
              setNewProject(e.target.value)
            }
          />

          <button onClick={createProject}>
            Add
          </button>
        </div>

        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => {
              setSelectedProject(project);
              fetchTasks(project.id);
            }}
            style={{
              padding: "0.75rem",
              cursor: "pointer",
              background:
                selectedProject?.id === project.id
                  ? "#ddd"
                  : "transparent",
              marginBottom: "0.5rem",
            }}
          >
            {project.name}
          </div>
        ))}
      </aside>

      {/* ==========================
          TASK PANEL
      ========================== */}
      <section
        style={{
          flex: 1,
          padding: "2rem",
        }}
      >
        <h1>
          {selectedProject?.name || "Select Project"}
        </h1>

        {selectedProject && (
          <>
            <div
              style={{
                marginBottom: "1rem",
              }}
            >
              <input
                placeholder="New task"
                value={newTask}
                onChange={(e) =>
                  setNewTask(e.target.value)
                }
              />

              <button onClick={createTask}>
                Add Task
              </button>
            </div>

            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  padding: "1rem",
                  border: "1px solid #ccc",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  onClick={() =>
                    toggleTask(task)
                  }
                  style={{
                    cursor: "pointer",
                    textDecoration:
                      task.completed
                        ? "line-through"
                        : "none",
                  }}
                >
                  {task.title}
                </span>

                <button
                  onClick={() =>
                    deleteTask(task)
                  }
                >
                  Delete
                </button>
              </div>
            ))}
          </>
        )}
      </section>
    </main>
  );
}