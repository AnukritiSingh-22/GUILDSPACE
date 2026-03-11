import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div style={styles.nav}>
      <h2>GILDSPACE</h2>
      <div>
        <Link to="/" style={styles.link}>Home</Link>
        <Link to="/create" style={styles.link}>Create</Link>
      </div>
    </div>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 30px",
    backgroundColor: "#111",
    color: "white",
  },
  link: {
    marginLeft: "20px",
    color: "white",
    textDecoration: "none",
  }
};