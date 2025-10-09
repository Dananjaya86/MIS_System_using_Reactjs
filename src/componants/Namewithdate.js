import React, { useEffect, useState } from "react";
import './Namewithdate.css';

export default function Namewithdate() {
  const [date, setDate] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("username") || "Guest";
    setUsername(savedUser);

    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    setDate(formattedDate);
  }, []);

  return (
    <div className="dashboard-headeronecom">
      <span className="dashboard-usernamecom">👤 {username}</span>
      <span className="dashboard-datecom">📅 {date}</span>
    </div>
  );
}
