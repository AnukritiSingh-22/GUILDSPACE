import { useState } from "react";
import API from "../api/api";

export default function CreateProject() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    required_skills: "",
    difficulty: 1,
    min_trust: 0,
    owner_id: 1
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await API.post("/projects", null, { params: form });
    alert("Project Created!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Project</h2>
      <input placeholder="Title" onChange={e => setForm({...form, title:e.target.value})} /><br /><br />
      <textarea placeholder="Description" onChange={e => setForm({...form, description:e.target.value})} /><br /><br />
      <input placeholder="Skills (comma separated)" onChange={e => setForm({...form, required_skills:e.target.value})} /><br /><br />
      <button type="submit">Create</button>
    </form>
  );
}