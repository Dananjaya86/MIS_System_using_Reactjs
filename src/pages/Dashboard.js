import {
    useEffect,
    useRef,
    useState
} from "react";

import Chart from "chart.js/auto";

import "./dashboard.css";

import Menu from "../componants/Menu";


export default function Dashboard() {

    // =========================================================
    // CHART REFERENCES
    // =========================================================

    const salesByDateRef = useRef(null);

    const monthlySalesRef = useRef(null);

    const monthlyBudgetRef = useRef(null);

    const yearlyBudgetRef = useRef(null);


    // =========================================================
    // CHART INSTANCES
    // =========================================================

    const chartInstances = useRef({});


    // =========================================================
    // USER
    // =========================================================

    const [username, setUsername] =
        useState("Guest");

    const [currentDate, setCurrentDate] =
        useState("");


    // =========================================================
    // DASHBOARD DATA
    // =========================================================

    const [dashboard, setDashboard] =
        useState({

            summary: {

                totalSale: 0,

                totalReturn: 0,

                netSale: 0,

                yearSales: 0,

                yearBudget: 0,

                achievement: 0

            },


            bestSalesRep: null,


            products: [],


            customers: [],


            salesByDate: [],


            monthlySales: {

                lastMonth: 0,

                currentMonth: 0

            },


            monthlyBudget: {

                annualBudget: 0,

                monthlyBudget: 0,

                currentMonthSales: 0,

                remaining: 0,

                achievement: 0

            },


            yearlyBudget: {

                year:
                    new Date().getFullYear(),

                budget: 0,

                achieved: 0,

                percentage: 0

            },


            salesRepPerformance: []

        });


    // =========================================================
    // LOADING
    // =========================================================

    const [loading, setLoading] =
        useState(true);


    const [lastUpdated, setLastUpdated] =
        useState(null);


    // =========================================================
    // LOAD DASHBOARD
    // =========================================================

    const loadDashboard = async () => {

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/dashboard",
                {
                    headers: {
                        Authorization:
                            `Bearer ${
                                localStorage.getItem(
                                    "token"
                                ) || ""
                            }`
                    }
                }
            );


        const data =
            await response.json();


        // =====================================================
        // DEBUG SALES REPRESENTATIVES
        // =====================================================

        console.log(
            "Sales Rep Performance:",
            data.salesRepPerformance
        );

        console.log(
            "Sales Rep Count:",
            data.salesRepPerformance?.length
        );


        // =====================================================
        // CHECK RESPONSE
        // =====================================================

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to load dashboard."
            );

        }


        // =====================================================
        // SET DASHBOARD DATA
        // =====================================================

        setDashboard(data);


        setLastUpdated(
            new Date()
        );


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    } finally {

        setLoading(false);

    }

};

    // =========================================================
    // INITIAL LOAD + LIVE UPDATE
    // =========================================================

    useEffect(() => {

        const storedUser =
            localStorage.getItem(
                "username"
            ) || "Guest";


        setUsername(
            storedUser
        );


        const updateDate = () => {

            const today =
                new Date();


            setCurrentDate(
                today.toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                    }
                )
            );

        };


        updateDate();


        loadDashboard();


        // -----------------------------------------------------
        // LIVE UPDATE EVERY 30 SECONDS
        // -----------------------------------------------------

        const interval =
            setInterval(
                () => {

                    loadDashboard();

                },
                30000
            );


        return () => {

            clearInterval(
                interval
            );

        };

    }, []);


    // =========================================================
    // CREATE / UPDATE CHARTS
    // =========================================================

    useEffect(() => {

        if (loading) {
            return;
        }


        // -----------------------------------------------------
        // DESTROY OLD CHARTS
        // -----------------------------------------------------

        Object.values(
            chartInstances.current
        ).forEach(
            chart => {

                if (chart) {
                    chart.destroy();
                }

            }
        );


        chartInstances.current = {};


        // =====================================================
        // SALES BY DATE
        // =====================================================

        if (
            salesByDateRef.current
        ) {

            const daysInMonth =
                new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() + 1,
                    0
                ).getDate();


            const labels =
                Array.from(
                    {
                        length:
                            daysInMonth
                    },
                    (_, index) =>
                        String(
                            index + 1
                        ).padStart(
                            2,
                            "0"
                        )
                );


            const dailyData =
                labels.map(
                    (_, index) => {

                        const row =
                            dashboard.salesByDate.find(
                                item =>
                                    Number(
                                        item.day
                                    ) ===
                                    index + 1
                            );


                        return row
                            ? Number(
                                row.amount
                            )
                            : 0;

                    }
                );


            chartInstances.current.salesByDate =
                new Chart(
                    salesByDateRef.current,
                    {

                        type: "line",

                        data: {

                            labels,

                            datasets: [

                                {

                                    label:
                                        "Sales (Rs)",

                                    data:
                                        dailyData,

                                    borderColor:
                                        "#2563eb",

                                    backgroundColor:
                                        "rgba(37, 99, 235, 0.12)",

                                    borderWidth:
                                        3,

                                    fill:
                                        true,

                                    tension:
                                        0.4,

                                    pointRadius:
                                        3,

                                    pointHoverRadius:
                                        7

                                }

                            ]

                        },

                        options: {

                            responsive:
                                true,

                            maintainAspectRatio:
                                false,

                            animation: {

                                duration:
                                    1000

                            },

                            plugins: {

                                legend: {

                                    display:
                                        true

                                },

                                tooltip: {

                                    callbacks: {

                                        label:
                                            context =>
                                                ` Rs.${formatMoney(
                                                    context.parsed.y
                                                )}`

                                    }

                                }

                            },

                            scales: {

                                y: {

                                    beginAtZero:
                                        true,

                                    ticks: {

                                        callback:
                                            value =>
                                                `Rs.${formatCompact(
                                                    value
                                                )}`

                                    }

                                }

                            }

                        }

                    }
                );

        }


        // =====================================================
        // LAST VS CURRENT MONTH
        // =====================================================

        if (
            monthlySalesRef.current
        ) {

            chartInstances.current.monthlySales =
                new Chart(
                    monthlySalesRef.current,
                    {

                        type: "bar",

                        data: {

                            labels: [

                                "Last Month",

                                "Current Month"

                            ],

                            datasets: [

                                {

                                    label:
                                        "Sales (Rs)",

                                    data: [

                                        Number(
                                            dashboard
                                                .monthlySales
                                                .lastMonth
                                        ),

                                        Number(
                                            dashboard
                                                .monthlySales
                                                .currentMonth
                                        )

                                    ],

                                    backgroundColor: [

                                        "#3b82f6",

                                        "#22c55e"

                                    ],

                                    borderRadius:
                                        10

                                }

                            ]

                        },

                        options: {

                            responsive:
                                true,

                            maintainAspectRatio:
                                false,

                            animation: {

                                duration:
                                    1200

                            },

                            plugins: {

                                legend: {

                                    display:
                                        true

                                }

                            },

                            scales: {

                                y: {

                                    beginAtZero:
                                        true,

                                    ticks: {

                                        callback:
                                            value =>
                                                `Rs.${formatCompact(
                                                    value
                                                )}`

                                    }

                                }

                            }

                        }

                    }
                );

        }


        // =====================================================
        // MONTHLY BUDGET
        // =====================================================

        if (
            monthlyBudgetRef.current
        ) {

            const achieved =
                Number(
                    dashboard
                        .monthlyBudget
                        .currentMonthSales
                );


            const remaining =
                Number(
                    dashboard
                        .monthlyBudget
                        .remaining
                );


            chartInstances.current.monthlyBudget =
                new Chart(
                    monthlyBudgetRef.current,
                    {

                        type: "doughnut",

                        data: {

                            labels: [

                                "Achieved",

                                "Remaining"

                            ],

                            datasets: [

                                {

                                    data: [

                                        achieved,

                                        remaining

                                    ],

                                    backgroundColor: [

                                        "#22c55e",

                                        "#cbd5e1"

                                    ],

                                    borderWidth:
                                        0,

                                    hoverOffset:
                                        8

                                }

                            ]

                        },

                        options: {

                            responsive:
                                true,

                            maintainAspectRatio:
                                false,

                            cutout:
                                "68%",

                            animation: {

                                animateRotate:
                                    true,

                                animateScale:
                                    true,

                                duration:
                                    1400

                            },

                            plugins: {

                                legend: {

                                    position:
                                        "top"

                                }

                            }

                        }

                    }
                );

        }


        // =====================================================
        // YEARLY BUDGET
        // =====================================================

        if (
            yearlyBudgetRef.current
        ) {

            chartInstances.current.yearlyBudget =
                new Chart(
                    yearlyBudgetRef.current,
                    {

                        type: "bar",

                        data: {

                            labels: [

                                "Budget",

                                "Achieved"

                            ],

                            datasets: [

                                {

                                    label:
                                        "Amount (Rs)",

                                    data: [

                                        Number(
                                            dashboard
                                                .yearlyBudget
                                                .budget
                                        ),

                                        Number(
                                            dashboard
                                                .yearlyBudget
                                                .achieved
                                        )

                                    ],

                                    backgroundColor: [

                                        "#8b5cf6",

                                        "#22c55e"

                                    ],

                                    borderRadius:
                                        10

                                }

                            ]

                        },

                        options: {

                            responsive:
                                true,

                            maintainAspectRatio:
                                false,

                            animation: {

                                duration:
                                    1200

                            },

                            plugins: {

                                legend: {

                                    display:
                                        true

                                }

                            },

                            scales: {

                                y: {

                                    beginAtZero:
                                        true,

                                    ticks: {

                                        callback:
                                            value =>
                                                `Rs.${formatCompact(
                                                    value
                                                )}`

                                    }

                                }

                            }

                        }

                    }
                );

        }


        // -----------------------------------------------------
        // CLEANUP
        // -----------------------------------------------------

        return () => {

            Object.values(
                chartInstances.current
            ).forEach(
                chart => {

                    if (chart) {
                        chart.destroy();
                    }

                }
            );

        };

    }, [
        dashboard,
        loading
    ]);


    // =========================================================
    // MONEY FORMAT
    // =========================================================

    function formatMoney(value) {

        return Number(
            value || 0
        ).toLocaleString(
            "en-LK",
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        );

    }


    function formatCompact(value) {

        const number =
            Number(value || 0);


        if (
            number >= 1000000
        ) {

            return (
                (number / 1000000)
                    .toFixed(1)
                + "M"
            );

        }


        if (
            number >= 1000
        ) {

            return (
                (number / 1000)
                    .toFixed(1)
                + "K"
            );

        }


        return number;

    }


    // =========================================================
    // TOP 5 SALES REPRESENTATIVES
    // =========================================================

    
    const topFiveReps = [
        ...(dashboard.salesRepPerformance || [])
    ]
        .sort(
            (a, b) => {

                const percentageA =
                    Number(
                        a.annualPercentage || 0
                    );

                const percentageB =
                    Number(
                        b.annualPercentage || 0
                    );


                if (
                    percentageB !==
                    percentageA
                ) {

                    return (
                        percentageB -
                        percentageA
                    );

                }


                return (
                    Number(
                        b.annualSales || 0
                    ) -
                    Number(
                        a.annualSales || 0
                    )
                );

            }
        )
        .slice(0, 5);


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="dashboard-container">

            <Menu />


            <div className="dashboard-content">


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="dashboard-header">

                    <div className="dashboard-title-area">

                        <h1 className="dashhead">

                            Welcome to Milkee
                            Management Information System

                        </h1>


                        <div className="dashboard-live">

                            <span className="live-dot"></span>

                            LIVE

                        </div>

                    </div>


                    <div className="dashboard-user-area">

                        <span className="dashboard-username">

                            👤 {username}

                        </span>


                        <span className="dashboard-date">

                            📅 {currentDate}

                        </span>

                    </div>

                </div>


                {/* =================================================
                    LAST UPDATED
                ================================================= */}

                <div className="dashboard-status">

                    <span>

                        {loading
                            ? "Loading dashboard..."
                            : "Dashboard connected to database"
                        }

                    </span>


                    {lastUpdated && (

                        <span>

                            Last updated:{" "}

                            {lastUpdated.toLocaleTimeString()}

                        </span>

                    )}

                </div>


                {/* =================================================
                    SUMMARY CARDS
                ================================================= */}

                <div className="cards">


                    {/* TOTAL SALE */}

                    <div className="card sale-card">

                        <div className="card-icon">

                            💰

                        </div>


                        <div>

                            <h3>
                                Total Sale
                            </h3>


                            <p>

                                Rs.

                                {formatMoney(
                                    dashboard
                                        .summary
                                        .totalSale
                                )}

                            </p>


                            <small>
                                Current Month
                            </small>

                        </div>

                    </div>


                    {/* RETURN */}

                    <div className="card return-card">

                        <div className="card-icon">

                            ↩️

                        </div>


                        <div>

                            <h3>
                                Total Return
                            </h3>


                            <p>

                                Rs.

                                {formatMoney(
                                    dashboard
                                        .summary
                                        .totalReturn
                                )}

                            </p>


                            <small>
                                Current Month
                            </small>

                        </div>

                    </div>


                    {/* NET SALE */}

                    <div className="card net-card">

                        <div className="card-icon">

                            📈

                        </div>


                        <div>

                            <h3>
                                Net Sale
                            </h3>


                            <p>

                                Rs.

                                {formatMoney(
                                    dashboard
                                        .summary
                                        .netSale
                                )}

                            </p>


                            <small>
                                Sales − Returns
                            </small>

                        </div>

                    </div>


                    {/* BEST REP */}

                    <div className="card rep-card">

                        <div className="card-icon">

                            🏆

                        </div>


                        <div>

                            <h3>
                                Best Sales Rep
                            </h3>


                            <p className="best-rep-name">

                                {
                                    dashboard
                                        .bestSalesRep
                                        ?.name ||

                                    "No Sales Data"
                                }

                            </p>


                            <small>

                                Rs.

                                {formatMoney(
                                    dashboard
                                        .bestSalesRep
                                        ?.amount
                                )}

                            </small>

                        </div>

                    </div>


                    {/* ACHIEVEMENT */}

                    <div className="card achievement-card">

                        <div className="card-icon">

                            🎯

                        </div>


                        <div>

                            <h3>
                                Year Achievement
                            </h3>


                            <p>

                                Rs.

                                {formatMoney(
                                    dashboard
                                        .summary
                                        .yearSales
                                )}

                            </p>


                            <div className="achievement-mini-bar">

                                <div
                                    style={{
                                        width:
                                            `${Math.min(
                                                Number(
                                                    dashboard
                                                        .summary
                                                        .achievement ||
                                                    0
                                                ),
                                                100
                                            )}%`
                                    }}
                                />

                            </div>


                            <small>

                                {Number(
                                    dashboard
                                        .summary
                                        .achievement ||
                                    0
                                ).toFixed(2)}

                                % of annual budget

                            </small>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    TABLES
                ================================================= */}

                <div className="row-tables">


                    {/* MOST SELLING PRODUCTS */}

                    <div className="table-box">

                        <div className="section-heading">

                            <div>

                                <span className="section-icon">

                                    📦

                                </span>


                                <div>

                                    <h2>
                                        Most Selling Products
                                    </h2>

                                    <p>
                                        Current month
                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="table-scroll">

                            <table>

                                <thead>

                                    <tr>

                                        <th>
                                            Product
                                        </th>

                                        <th>
                                            Qty
                                        </th>

                                        <th>
                                            Amount (Rs)
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {
                                        dashboard.products
                                            .length === 0

                                            ? (

                                                <tr>

                                                    <td
                                                        colSpan="3"
                                                        className="empty-data"
                                                    >

                                                        No product sales

                                                    </td>

                                                </tr>

                                            )

                                            : (

                                                dashboard.products
                                                    .map(
                                                        (
                                                            product,
                                                            index
                                                        ) => (

                                                            <tr
                                                                key={
                                                                    product.productCode ||
                                                                    index
                                                                }
                                                            >

                                                                <td>

                                                                    <strong>

                                                                        {
                                                                            product.productName
                                                                        }

                                                                    </strong>

                                                                </td>


                                                                <td>

                                                                    {
                                                                        Number(
                                                                            product.qty
                                                                        ).toFixed(
                                                                            0
                                                                        )
                                                                    }

                                                                </td>


                                                                <td>

                                                                    Rs.{" "}

                                                                    {formatMoney(
                                                                        product.amount
                                                                    )}

                                                                </td>

                                                            </tr>

                                                        )
                                                    )

                                            )
                                    }

                                </tbody>

                            </table>

                        </div>

                    </div>


                    {/* BEST CUSTOMERS */}

                    <div className="table-box">

                        <div className="section-heading">

                            <div>

                                <span className="section-icon">

                                    👥

                                </span>


                                <div>

                                    <h2>
                                        Best Selling Customers
                                    </h2>

                                    <p>
                                        Current month
                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="table-scroll">

                            <table>

                                <thead>

                                    <tr>

                                        <th>
                                            Customer
                                        </th>

                                        <th>
                                            Qty
                                        </th>

                                        <th>
                                            Amount (Rs)
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {
                                        dashboard.customers
                                            .length === 0

                                            ? (

                                                <tr>

                                                    <td
                                                        colSpan="3"
                                                        className="empty-data"
                                                    >

                                                        No customer sales

                                                    </td>

                                                </tr>

                                            )

                                            : (

                                                dashboard.customers
                                                    .map(
                                                        (
                                                            customer,
                                                            index
                                                        ) => (

                                                            <tr
                                                                key={
                                                                    customer.customerCode ||
                                                                    index
                                                                }
                                                            >

                                                                <td>

                                                                    <strong>

                                                                        {
                                                                            customer.customerName ||
                                                                            customer.customerCode
                                                                        }

                                                                    </strong>

                                                                </td>


                                                                <td>

                                                                    {Number(
                                                                        customer.qty
                                                                    ).toFixed(
                                                                        0
                                                                    )}

                                                                </td>


                                                                <td>

                                                                    Rs.{" "}

                                                                    {formatMoney(
                                                                        customer.amount
                                                                    )}

                                                                </td>

                                                            </tr>

                                                        )
                                                    )

                                            )
                                    }

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    CHARTS
                ================================================= */}

                <div className="charts">


                    {/* SALES BY DATE */}

                    <div className="chart-box">

                        <div className="chart-header">

                            <div>

                                <h3>
                                    Sales by Date
                                </h3>

                                <span>
                                    Current Month Daily Sales
                                </span>

                            </div>


                            <span className="chart-badge">

                                LIVE

                            </span>

                        </div>


                        <div className="chart-container">

                            <canvas
                                ref={
                                    salesByDateRef
                                }
                            />

                        </div>

                    </div>


                    {/* LAST VS CURRENT */}

                    <div className="chart-box">

                        <div className="chart-header">

                            <div>

                                <h3>
                                    Last vs Current Month
                                </h3>

                                <span>
                                    Monthly comparison
                                </span>

                            </div>

                        </div>


                        <div className="chart-container">

                            <canvas
                                ref={
                                    monthlySalesRef
                                }
                            />

                        </div>

                    </div>


                    {/* MONTHLY BUDGET */}

                    <div className="chart-box">

                        <div className="chart-header">

                            <div>

                                <h3>
                                    Monthly Budget
                                </h3>

                                <span>

                                    Rs.

                                    {formatMoney(
                                        dashboard
                                            .monthlyBudget
                                            .monthlyBudget
                                    )}

                                    {" "} / month

                                </span>

                            </div>


                            <span className="percentage-badge">

                                {Number(
                                    dashboard
                                        .monthlyBudget
                                        .achievement ||
                                    0
                                ).toFixed(1)}

                                %

                            </span>

                        </div>


                        <div className="chart-container">

                            <canvas
                                ref={
                                    monthlyBudgetRef
                                }
                            />

                        </div>

                    </div>


                    {/* YEARLY BUDGET */}

                    <div className="chart-box">

                        <div className="chart-header">

                            <div>

                                <h3>
                                    Yearly Budget vs Achievement
                                </h3>

                                <span>

                                    {dashboard
                                        .yearlyBudget
                                        .year}

                                </span>

                            </div>


                            <span className="percentage-badge">

                                {Number(
                                    dashboard
                                        .yearlyBudget
                                        .percentage ||
                                    0
                                ).toFixed(1)}

                                %

                            </span>

                        </div>


                        <div className="chart-container">

                            <canvas
                                ref={
                                    yearlyBudgetRef
                                }
                            />

                        </div>

                    </div>

                </div>


                {/* =================================================
                    TOP 5 SALES REP PERFORMANCE
                ================================================= */}

                <div className="rep-performance-box">


                    {/* HEADER */}

                    <div className="section-heading">

                        <div>

                            <span className="section-icon">

                                🏆

                            </span>


                            <div>

                                <h2>

                                    Top 5 Sales Representative
                                    Performance

                                </h2>


                                <p>

                                    Best performers based on
                                    annual achievement %

                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="rep-table-scroll">

                        <table className="rep-table">


                            <thead>

                                <tr>

                                    <th>
                                        Rank
                                    </th>

                                    <th>
                                        Sales Representative
                                    </th>

                                    <th>
                                        Annual Budget
                                    </th>

                                    <th>
                                        Annual Sales
                                    </th>

                                    <th>
                                        Annual %
                                    </th>

                                    <th>
                                        Monthly Budget
                                    </th>

                                    <th>
                                        Monthly Sales
                                    </th>

                                    <th>
                                        Monthly %
                                    </th>

                                </tr>

                            </thead>


                            <tbody>


                                {
                                    topFiveReps.length === 0

                                        ? (

                                            <tr>

                                                <td
                                                    colSpan="8"
                                                    className="empty-data"
                                                >

                                                    No Sales Representative
                                                    Budget Data

                                                </td>

                                            </tr>

                                        )

                                        : (

                                            topFiveReps.map(
                                                (
                                                    rep,
                                                    index
                                                ) => {

                                                    const rank =
                                                        index + 1;


                                                    const annualPercentage =
                                                        Number(
                                                            rep.annualPercentage ||
                                                            0
                                                        );


                                                    const monthlyPercentage =
                                                        Number(
                                                            rep.monthlyPercentage ||
                                                            0
                                                        );


                                                    return (

                                                        <tr
                                                            key={
                                                                rep.employeeNo ||
                                                                index
                                                            }
                                                            className={
                                                                `top-rep-row top-rep-${rank}`
                                                            }
                                                        >


                                                            {/* RANK */}

                                                            <td>

                                                                <div
                                                                    className={
                                                                        `rank-badge rank-${rank}`
                                                                    }
                                                                >

                                                                    {rank === 1 && "🥇"}

                                                                    {rank === 2 && "🥈"}

                                                                    {rank === 3 && "🥉"}

                                                                    {rank === 4 && "4"}

                                                                    {rank === 5 && "5"}

                                                                </div>

                                                            </td>


                                                            {/* SALES REP */}

                                                            <td>

                                                                <div className="top-rep-name">

                                                                    <strong>

                                                                        {
                                                                            rep.salesRepName
                                                                        }

                                                                    </strong>


                                                                    <span
                                                                        className={
                                                                            `rank-label rank-label-${rank}`
                                                                        }
                                                                    >

                                                                        {rank === 1 &&
                                                                            "🏆 Best Performer"
                                                                        }

                                                                        {rank === 2 &&
                                                                            "🥈 2nd Best"
                                                                        }

                                                                        {rank === 3 &&
                                                                            "🥉 3rd Best"
                                                                        }

                                                                        {rank === 4 &&
                                                                            "⭐ 4th Best"
                                                                        }

                                                                        {rank === 5 &&
                                                                            "⭐ 5th Best"
                                                                        }

                                                                    </span>

                                                                </div>

                                                            </td>


                                                            {/* ANNUAL BUDGET */}

                                                            <td>

                                                                Rs.{" "}

                                                                {formatMoney(
                                                                    rep.annualBudget
                                                                )}

                                                            </td>


                                                            {/* ANNUAL SALES */}

                                                            <td>

                                                                Rs.{" "}

                                                                {formatMoney(
                                                                    rep.annualSales
                                                                )}

                                                            </td>


                                                            {/* ANNUAL % */}

                                                            <td>

                                                                <span
                                                                    className={
                                                                        annualPercentage >= 100
                                                                            ? "performance-good"
                                                                            : annualPercentage >= 75
                                                                                ? "performance-warning"
                                                                                : "performance-danger"
                                                                    }
                                                                >

                                                                    {annualPercentage.toFixed(
                                                                        1
                                                                    )}

                                                                    %

                                                                </span>

                                                            </td>


                                                            {/* MONTHLY BUDGET */}

                                                            <td>

                                                                Rs.{" "}

                                                                {formatMoney(
                                                                    rep.monthlyBudget
                                                                )}

                                                            </td>


                                                            {/* MONTHLY SALES */}

                                                            <td>

                                                                Rs.{" "}

                                                                {formatMoney(
                                                                    rep.monthlySales
                                                                )}

                                                            </td>


                                                            {/* MONTHLY % */}

                                                            <td>

                                                                <span
                                                                    className={
                                                                        monthlyPercentage >= 100
                                                                            ? "performance-good"
                                                                            : monthlyPercentage >= 75
                                                                                ? "performance-warning"
                                                                                : "performance-danger"
                                                                    }
                                                                >

                                                                    {monthlyPercentage.toFixed(
                                                                        1
                                                                    )}

                                                                    %

                                                                </span>

                                                            </td>

                                                        </tr>

                                                    );

                                                }

                                            )

                                        )
                                }


                            </tbody>

                        </table>

                    </div>


                </div>


            </div>

        </div>

    );

}