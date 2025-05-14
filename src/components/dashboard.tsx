import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { logout } = useAuth();

  return (
    <div>
      this is dashboard
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;
