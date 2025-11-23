import { useEffect, useRef, useState } from "react";
import Chart from 'chart.js/auto';
import './dashboard.css';
import Menu from '../componants/Menu';


export default function Dashboard() {
  const salesByDateRef = useRef(null);
  const monthlySalesRef = useRef(null);
  const monthlyBudgetRef = useRef(null);
  const yearlyBudgetRef = useRef(null);

  // Store chart instances
  const chartInstances = useRef([]);

  //  Username + Date states
  const [username, setUsername] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    // Get username from localStorage (set after login)
    const storedUser = localStorage.getItem("username") || "Guest";
    setUsername(storedUser);

    // Format current date
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    setCurrentDate(formattedDate);
  }, []);

  useEffect(() => {
    // Destroy any previous charts
    chartInstances.current.forEach((chart) => chart.destroy());
    chartInstances.current = [];

    // Sales by Date (Line Chart)
    const salesByDateChart = new Chart(salesByDateRef.current, {
      type: "line",
      data: {
        labels: ["01", "05", "10", "15", "20", "25", "30"],
        datasets: [
          {
            label: "Sales (Rs)",
            data: [500, 1500, 2000, 2500, 3000, 4000, 4500],
            borderColor: "#2c3e50",
            backgroundColor: "rgba(44, 62, 80, 0.2)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
    });
    chartInstances.current.push(salesByDateChart);

    // Last vs Current Month (Bar Chart)
    const monthlySalesChart = new Chart(monthlySalesRef.current, {
      type: "bar",
      data: {
        labels: ["Last Month", "Current Month"],
        datasets: [
          {
            label: "Sales (Rs)",
            data: [20000, 25000],
            backgroundColor: ["#3498db", "#2ecc71"],
          },
        ],
      },
    });
    chartInstances.current.push(monthlySalesChart);

    // Monthly Budget (Doughnut Chart)
    const monthlyBudgetChart = new Chart(monthlyBudgetRef.current, {
      type: "doughnut",
      data: {
        labels: ["Achieved", "Remaining"],
        datasets: [
          {
            data: [25000, 5000],
            backgroundColor: ["#27ae60", "#bdc3c7"],
          },
        ],
      },
    });
    chartInstances.current.push(monthlyBudgetChart);

    // Yearly Budget vs Achievements (Bar Chart)
    const yearlyBudgetChart = new Chart(yearlyBudgetRef.current, {
      type: "bar",
      data: {
        labels: ["Budget", "Achieved"],
        datasets: [
          {
            label: "Amount (Rs)",
            data: [300000, 255000],
            backgroundColor: ["#9b59b6", "#2ecc71"],
          },
        ],
      },
    });
    chartInstances.current.push(yearlyBudgetChart);

   
    return () => {
      chartInstances.current.forEach((chart) => chart.destroy());
    };
  }, []);

  return (
    <div className="dashboard-container">
      <Menu />

      <div className="dashboard-content">
       
        <div className="dashboard-header">
          <h1 className="dashhead">Welcome to Milkee Managment Information Syatem</h1>  
          <span className="dashboard-username">👤 {username}</span>
          <span className="dashboard-date">📅 {currentDate}</span>
        </div>

       
        <div className="cards">
          <div className="card">
            <h3>Total Sale</h3>
            <p id="totalSale">Rs.25,000</p>
          </div>
          <div className="card">
            <h3>Total Return</h3>
            <p id="totalReturn">Rs.1,200</p>
          </div>
          <div className="card">
            <h3>Net Sale</h3>
            <p id="netSale">Rs.23,800</p>
          </div>
          <div className="card">
            <h3>Best Sales Rep</h3>
            <p>Dananjaya Dasanayake</p>
          </div>
          <div className="card">
            <h3>Achievements</h3>
            <p>Rs.80,000 (85%)</p>
          </div>
        </div>

        {/* Tables */}
        <div className="row-tables">
          <div className="table-box">
            <div className="section-title">Most Selling Products</div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Amount (Rs)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Product A</td><td>120</td><td>3,600</td></tr>
                <tr><td>Product B</td><td>90</td><td>2,700</td></tr>
                <tr><td>Product C</td><td>70</td><td>2,100</td></tr>
                <tr><td>Product D</td><td>50</td><td>1,500</td></tr>
              </tbody>
            </table>
          </div>

          <div className="table-box">
            <div className="section-title">Best Selling Customers</div>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Qty</th>
                  <th>Amount (Rs)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Customer 1</td><td>300</td><td>9,000</td></tr>
                <tr><td>Customer 2</td><td>250</td><td>7,500</td></tr>
                <tr><td>Customer 3</td><td>180</td><td>5,400</td></tr>
                <tr><td>Customer 4</td><td>150</td><td>4,500</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div className="charts">
          <div className="chart-box">
            <h3>Sales by Date</h3>
            <canvas ref={salesByDateRef}></canvas>
          </div>
          <div className="chart-box">
            <h3>Last vs Current Month</h3>
            <canvas ref={monthlySalesRef}></canvas>
          </div>
          <div className="chart-box">
            <h3>Monthly Budget</h3>
            <canvas ref={monthlyBudgetRef}></canvas>
          </div>
          <div className="chart-box">
            <h3>Yearly Budget vs Achievements</h3>
            <canvas ref={yearlyBudgetRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
