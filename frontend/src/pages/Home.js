import { useEffect, useState } from "react";
import API from "../api/api";
import { Link } from "react-router-dom";

export default function Home() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
  API.get("/projects")
    .then(res => {
      console.log(res.data);
      setProjects(res.data);
    })
    .catch(err => {
      console.log("ERROR:", err);
    });
}, []);

  return (
    <div>
      <h2>Available Collaborations</h2>
      {projects.map(project => (
        <div key={project.id} style={card}>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <p><strong>Skills:</strong> {project.required_skills}</p>
          <Link to={`/project/${project.id}`}>View</Link>
        </div>
      ))}
    </div>
  );
}

const card = {
  border: "1px solid #ddd",
  padding: "20px",
  marginBottom: "15px",
  borderRadius: "8px"
};