import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/api";

export default function ProjectDetails() {
  const { id } = useParams();
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    API.get(`/ai/rank/${id}`).then(res => setRanking(res.data));
  }, [id]);

  return (
    <div>
      <h2>AI Suggested Collaborators</h2>
      {ranking.map(user => (
        <div key={user.user_id} style={card}>
          <p>{user.user_name}</p>
          <p>Score: {user.score}</p>
        </div>
      ))}
    </div>
  );
}

const card = {
  border: "1px solid #ccc",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "5px"
};