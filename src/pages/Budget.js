import React, {
    useEffect,
    useState
} from "react";

import "./budget.css";
import AlertBox from "../componants/Alertboxre";


export default function Budget({ onClose }) {

    // ============================================================
    // USERNAME
    // ============================================================

    const [username, setUsername] = useState("");


    // ============================================================
    // YEARS
    // ============================================================

    const [years, setYears] = useState([]);


    // ============================================================
    // SELECTED YEAR
    // ============================================================

    const [selectedYear, setSelectedYear] = useState(
        String(new Date().getFullYear())
    );


    // ============================================================
    // SALES REPRESENTATIVES
    // ============================================================

    const [salesReps, setSalesReps] = useState([]);


    // ============================================================
    // SUMMARY
    // ============================================================

    const [summary, setSummary] = useState({
        totalBudget: 0,
        actualSales: 0,
        percentage: 0,

        repWise: [],

        currentMonth: {
            budget: 0,
            sales: 0,
            percentage: 0
        }
    });


    // ============================================================
    // ADD BUDGET FORM
    // ============================================================

    const [totalBudget, setTotalBudget] = useState("");

    const [selectedRep, setSelectedRep] = useState("");

    const [allocatedBudget, setAllocatedBudget] = useState("");


    // ============================================================
    // REMAINING BUDGET
    // ============================================================

    const [remainingBudget, setRemainingBudget] = useState(0);


    // ============================================================
    // LOADING
    // ============================================================

    const [loading, setLoading] = useState(false);


    // ============================================================
    // CHANGE BUDGET MODE
    // ============================================================

    const [changeBudgetMode, setChangeBudgetMode] =
        useState(false);

    const [newBudgetValue, setNewBudgetValue] =
        useState("");


    // ============================================================
    // AUTH HEADERS
    // ============================================================

    const getAuthHeaders = () => ({
        "Content-Type": "application/json",

        "Authorization":
            `Bearer ${
                localStorage.getItem("token") || ""
            }`
    });


    const [alert, setAlert] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null
});  

const showAlert = (
    type,
    title,
    message,
    onConfirm = null
) => {

    setAlert({
        show: true,
        type,
        title,
        message,
        onConfirm
    });

};


const closeAlert = () => {

    setAlert(prev => ({
        ...prev,
        show: false,
        onConfirm: null
    }));

};


    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {

        const loggedUser =
            localStorage.getItem("username") || "Guest";

        setUsername(loggedUser);

        loadYears();

        loadSalesReps();

    }, []);


    // ============================================================
    // LOAD YEARS
    // ============================================================

    const loadYears = async () => {

        const currentYear =
            new Date().getFullYear();

        try {

            const res = await fetch(
                "http://localhost:5000/api/budget/years",
                {
                    headers: getAuthHeaders()
                }
            );

            const data = await res.json();

            if (!res.ok) {

                throw new Error(
                    data.error ||
                    "Failed to load budget years."
                );

            }

            let yearList =
                Array.isArray(data)
                    ? data
                    : [];


            // ----------------------------------------------------
            // CURRENT YEAR MUST EXIST
            // ----------------------------------------------------

            const currentExists =
                yearList.some(
                    item =>
                        Number(item.year) ===
                        currentYear
                );


            if (!currentExists) {

                yearList.unshift({
                    year: currentYear
                });

            }


            // ----------------------------------------------------
            // REMOVE DUPLICATES
            // ----------------------------------------------------

            yearList =
                yearList.filter(
                    (item, index, self) =>
                        index ===
                        self.findIndex(
                            x =>
                                Number(x.year) ===
                                Number(item.year)
                        )
                );


            // ----------------------------------------------------
            // NEWEST YEAR FIRST
            // ----------------------------------------------------

            yearList.sort(
                (a, b) =>
                    Number(b.year) -
                    Number(a.year)
            );


            setYears(yearList);

            setSelectedYear(
                String(currentYear)
            );

        } catch (err) {

            console.error(
                "Year loading error:",
                err
            );

            
            setYears([
                {
                    year: currentYear
                }
            ]);

            setSelectedYear(
                String(currentYear)
            );

        }

    };


    // ============================================================
    // LOAD SALES REPRESENTATIVES
    // ============================================================

    const loadSalesReps = async () => {

        try {

            const res = await fetch(
                "http://localhost:5000/api/budget/sales-reps",
                {
                    headers: getAuthHeaders()
                }
            );

            const data = await res.json();

            if (!res.ok) {

                throw new Error(
                    data.error ||
                    "Failed to load Sales Representatives."
                );

            }


            setSalesReps(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {

            console.error(
                "Sales rep loading error:",
                err
            );

            setSalesReps([]);

        }

    };


    // ============================================================
    // YEAR CHANGE
    // ============================================================

    useEffect(() => {

        if (!selectedYear) {
            return;
        }

        loadSummary(selectedYear);

        loadRemainingBudget(selectedYear);

    }, [selectedYear]);


    // ============================================================
    // LOAD SUMMARY
    // ============================================================

    const loadSummary = async (year) => {

        try {

            setLoading(true);


            const res = await fetch(
                `http://localhost:5000/api/budget/summary/${year}`,
                {
                    headers: getAuthHeaders()
                }
            );


            const data = await res.json();


            if (!res.ok) {

                throw new Error(
                    data.error ||
                    "Failed to load budget summary."
                );

            }


            setSummary({

                totalBudget:
                    Number(
                        data.totalBudget || 0
                    ),

                actualSales:
                    Number(
                        data.actualSales || 0
                    ),

                percentage:
                    Number(
                        data.percentage || 0
                    ),

                repWise:
                    Array.isArray(data.repWise)
                        ? data.repWise
                        : [],

                currentMonth: {

                    budget:
                        Number(
                            data.currentMonth?.budget || 0
                        ),

                    sales:
                        Number(
                            data.currentMonth?.sales || 0
                        ),

                    percentage:
                        Number(
                            data.currentMonth?.percentage || 0
                        )

                }

            });

        } catch (err) {

            console.error(
                "Budget summary error:",
                err
            );

            setSummary({
                totalBudget: 0,
                actualSales: 0,
                percentage: 0,
                repWise: [],

                currentMonth: {
                    budget: 0,
                    sales: 0,
                    percentage: 0
                }
            });

        } finally {

            setLoading(false);

        }

    };


    // ============================================================
    // LOAD REMAINING BUDGET
    // ============================================================

    const loadRemainingBudget = async (year) => {

        try {

            const res = await fetch(
                `http://localhost:5000/api/budget/remaining/${year}`,
                {
                    headers: getAuthHeaders()
                }
            );


            const data = await res.json();


            if (!res.ok) {
                return;
            }


            const dbTotal =
                Number(
                    data.totalBudget || 0
                );


            const dbRemaining =
                Number(
                    data.remainingBudget || 0
                );


            setRemainingBudget(
                dbRemaining
            );


            
            if (dbTotal > 0) {

                setTotalBudget(
                    dbTotal.toFixed(2)
                );

            }

            
            else {

                setTotalBudget("");

            }

        } catch (err) {

            console.error(
                "Remaining budget error:",
                err
            );

        }

    };


    // ============================================================
    // ADD BUDGET
    // ============================================================

    const handleAddBudget = async () => {

       
        if (!selectedYear) {

            alert(
                "Please select a year."
            );

            return;

        }


        // --------------------------------------------------------
        // TOTAL BUDGET
        // --------------------------------------------------------

        if (
            !totalBudget ||
            Number(totalBudget) <= 0
        ) {

            showAlert(
        "warning",
        "Total Budget Required",
        "Please enter a valid Total Budget."
    );  

            return;

        }


        // --------------------------------------------------------
        // SALES REP
        // --------------------------------------------------------

        if (!selectedRep) {

            showAlert(
        "warning",
        "Sales Representative Required",
        "Please select a Sales Representative."
    );

            return;

        }


        // --------------------------------------------------------
        // ALLOCATION
        // --------------------------------------------------------

        if (
            !allocatedBudget ||
            Number(allocatedBudget) <= 0
        ) {

            showAlert(
        "warning",
        "Allocation Required",
        "Please enter a valid Allocate Budget amount."
    );

            return;

        }


        // --------------------------------------------------------
        // CALCULATE AVAILABLE BUDGET
        // --------------------------------------------------------

        const effectiveRemainingBudget =
            Number(summary.totalBudget) > 0
                ? Number(remainingBudget)
                : Number(totalBudget || 0);


        // --------------------------------------------------------
        // CHECK ALLOCATION
        // --------------------------------------------------------

        if (
            Number(allocatedBudget) >
            effectiveRemainingBudget
        ) {

            showAlert(
        "error",
        "Budget Exceeded",
        "Allocated Budget cannot exceed the Remaining Budget.\n\n" +
        "Remaining Budget: Rs. " +
        formatMoney(
            effectiveRemainingBudget
        )
    );

            return;

        }


        try {

            setLoading(true);


            const res = await fetch(
                "http://localhost:5000/api/budget/add",
                {
                    method: "POST",

                    headers: getAuthHeaders(),

                    body: JSON.stringify({

                        year:
                            Number(
                                selectedYear
                            ),

                        totalBudget:
                            Number(
                                totalBudget
                            ),

                        employeeNo:
                            selectedRep,

                        allocatedBudget:
                            Number(
                                allocatedBudget
                            ),

                        login_user:
                            username

                    })

                }
            );


            const data = await res.json();


            if (!res.ok) {

                throw new Error(
                    data.error ||
                    "Failed to add budget."
                );

            }


            // ----------------------------------------------------
            // SUCCESS
            // ----------------------------------------------------

            showAlert(
    "success",
    "Budget Allocated Successfully",
    "Budget has been allocated successfully.\n\n" +
    "User: " +
    username +
    "\n\n" +
    "Remaining Budget: Rs. " +
    formatMoney(
        data.remainingBudget
    )
);


            // ----------------------------------------------------
            // CLEAR FORM
            // ----------------------------------------------------

            setSelectedRep("");

            setAllocatedBudget("");


            // ----------------------------------------------------
            // REFRESH
            // ----------------------------------------------------

            await loadSummary(
                selectedYear
            );

            await loadRemainingBudget(
                selectedYear
            );


        } catch (err) {

            console.error(
                "Add budget error:",
                err
            );

            showAlert(
    "error",
    "Budget Allocation Failed",
    err.message ||
    "Failed to add budget."
);

        } finally {

            setLoading(false);

        }

    };


    // ============================================================
    // CHANGE TOTAL BUDGET
    // ============================================================

    const handleChangeBudget = async () => {

        // --------------------------------------------------------
        // YEAR
        // --------------------------------------------------------

        if (!selectedYear) {

            showAlert(
        "warning",
        "Year Required",
        "Please select a year."
    );

            return;

        }


        // --------------------------------------------------------
        // NEW BUDGET
        // --------------------------------------------------------

        if (
            !newBudgetValue ||
            Number(newBudgetValue) <= 0
        ) {

            showAlert(
        "warning",
        "Invalid Budget",
        "Please enter a valid new Total Budget."
    );

            return;

        }


        // --------------------------------------------------------
        // GET CURRENTLY ALLOCATED BUDGET
        // --------------------------------------------------------

        const allocated =
            Number(
                summary.repWise?.reduce(
                    (total, rep) =>
                        total +
                        Number(
                            rep.annualBudget ||
                            rep.allocatedBudget ||
                            0
                        ),
                    0
                )
            );


        // --------------------------------------------------------
        // NEW TOTAL CANNOT BE LESS THAN ALLOCATED
        // --------------------------------------------------------

        if (
            Number(newBudgetValue) < allocated
        ) {

            showAlert(
        "error",
        "Invalid Total Budget",
        "New Total Budget cannot be less than the already allocated budget.\n\n" +
        "Allocated Budget: Rs. " +
        formatMoney(allocated)
    );

            return;

        }


        try {

            setLoading(true);


            const res = await fetch(
                "http://localhost:5000/api/budget/change",
                {
                    method: "PUT",

                    headers: getAuthHeaders(),

                    body: JSON.stringify({

                        year:
                            Number(
                                selectedYear
                            ),

                        newTotalBudget:
                            Number(
                                newBudgetValue
                            ),

                        login_user:
                            username

                    })

                }
            );


            const data = await res.json();


            if (!res.ok) {

                throw new Error(
                    data.error ||
                    "Failed to change budget."
                );

            }


            showAlert(
    "success",
    "Budget Changed Successfully",
    "Budget has been changed successfully.\n\n" +

    "Old Budget: Rs. " +
    formatMoney(
        data.oldBudget
    ) +

    "\n\n" +

    "New Budget: Rs. " +
    formatMoney(
        data.newBudget
    )
);


            // ----------------------------------------------------
            // CLOSE CHANGE MODE
            // ----------------------------------------------------

            setChangeBudgetMode(false);

            setNewBudgetValue("");


            // ----------------------------------------------------
            // REFRESH
            // ----------------------------------------------------

            await loadSummary(
                selectedYear
            );

            await loadRemainingBudget(
                selectedYear
            );


        } catch (err) {

            console.error(
                "Change budget error:",
                err
            );

            showAlert(
    "error",
    "Budget Change Failed",
    err.message ||
    "Failed to change budget."
);
        } finally {

            setLoading(false);

        }

    };


    // ============================================================
    // FORMAT MONEY
    // ============================================================

    const formatMoney = (value) => {

        return Number(
            value || 0
        ).toLocaleString(
            "en-LK",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

    };


    // ============================================================
    // CURRENT MONTH NAME
    // ============================================================

    const currentMonthName =
        new Date().toLocaleString(
            "en-US",
            {
                month: "long"
            }
        );


    // ============================================================
    // PERCENTAGE CLASS
    // ============================================================

    const getPercentageClass = (
        percentage
    ) => {

        const value =
            Number(percentage || 0);


        if (value >= 100) {
            return "budget-success";
        }


        if (value >= 75) {
            return "budget-warning";
        }


        return "budget-danger";

    };


    // ============================================================
    // PROGRESS WIDTH
    // ============================================================

    const getProgressWidth = (
        percentage
    ) => {

        const value =
            Number(percentage || 0);


        return Math.min(
            Math.max(
                value,
                0
            ),
            100
        );

    };


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <div className="budget-overlay">

            <div className="budget-modal">


                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="budget-header">

                    <div>

                        <h2>
                            Budget
                        </h2>

                        <span>
                            Sales Budget & Performance
                        </span>

                    </div>


                    <div className="budget-header-right">

                        <div className="budget-login-user">

                            <span>
                                User
                            </span>

                            <strong>
                                👤 {username}
                            </strong>

                        </div>


                        <button
                            type="button"
                            className="budget-close-btn"
                            onClick={onClose}
                        >
                            ×
                        </button>

                    </div>

                </div>


                {/* ==================================================
                    YEAR SELECTOR
                ================================================== */}

                <div className="budget-top-section">

                    <div className="budget-year-box">

                        <label>
                            Year
                        </label>


                        <select
                            value={selectedYear}
                            onChange={(e) =>
                                setSelectedYear(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                Select Year
                            </option>


                            {years.map(
                                item => (

                                    <option
                                        key={item.year}
                                        value={item.year}
                                    >
                                        {item.year}
                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {selectedYear && (

                        <div className="budget-year-title">

                            Budget Year:

                            <strong>
                                {selectedYear}
                            </strong>

                        </div>

                    )}

                </div>


                {/* ==================================================
                    SUMMARY
                ================================================== */}

                {selectedYear && (

                    <>

                        {/* ==================================================
                            SUMMARY CARDS
                        ================================================== */}

                        <div className="budget-summary-cards">


                            {/* TOTAL BUDGET */}

                            <div className="budget-field">

                                <label>
                                    Total Budget
                                </label>


                                <input
                                    type="number"
                                    value={totalBudget}
                                    readOnly
                                    className="total-budget-readonly"
                                    placeholder="Enter total budget"
                                />


                                {summary.totalBudget > 0 && (

                                    <button
                                        type="button"
                                        className="change-budget-btn"
                                        onClick={() => {

                                            setNewBudgetValue(
                                                summary.totalBudget
                                            );

                                            setChangeBudgetMode(
                                                true
                                            );

                                        }}
                                    >
                                        Change Budget
                                    </button>

                                )}


                                {changeBudgetMode && (

                                    <div className="change-budget-box">

                                        <label>
                                            New Total Budget
                                        </label>


                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={newBudgetValue}
                                            onChange={(e) =>
                                                setNewBudgetValue(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Enter new total budget"
                                        />


                                        <div className="change-budget-actions">

                                            <button
                                                type="button"
                                                className="save-change-budget-btn"
                                                onClick={
                                                    handleChangeBudget
                                                }
                                                disabled={loading}
                                            >
                                                {loading
                                                    ? "Saving..."
                                                    : "Save Change"
                                                }
                                            </button>


                                            <button
                                                type="button"
                                                className="cancel-change-budget-btn"
                                                onClick={() => {

                                                    setChangeBudgetMode(
                                                        false
                                                    );

                                                    setNewBudgetValue(
                                                        ""
                                                    );

                                                }}
                                            >
                                                Cancel
                                            </button>

                                        </div>

                                    </div>

                                )}

                            </div>


                            {/* ACTUAL SALES */}

                            <div className="budget-field">

                                <label>
                                    Actual Sales
                                </label>

                                <div className="budget-summary-value">

                                    Rs.{" "}

                                    {formatMoney(
                                        summary.actualSales
                                    )}

                                </div>

                            </div>


                            {/* ACHIEVEMENT */}

                            <div
                                className={
                                    `budget-field ` +
                                    getPercentageClass(
                                        summary.percentage
                                    )
                                }
                            >

                                <label>
                                    Achievement
                                </label>

                                <div className="budget-summary-value">

                                    {Number(
                                        summary.percentage || 0
                                    ).toFixed(2)}

                                    %

                                </div>

                            </div>

                        </div>


                        {/* ==================================================
                            CURRENT MONTH
                        ================================================== */}

                        {Number(selectedYear) ===
                            new Date().getFullYear()
                            && (

                                <div className="current-month-section">

                                    <div className="current-month-header">

                                        <h3>
                                            Current Month
                                        </h3>

                                        <span>

                                            {currentMonthName}{" "}

                                            {new Date().getFullYear()}

                                        </span>

                                    </div>


                                    <div className="current-month-cards">


                                        {/* MONTH BUDGET */}

                                        <div className="current-month-card">

                                            <span>
                                                Current Month Budget
                                            </span>

                                            <strong>

                                                Rs.{" "}

                                                {formatMoney(
                                                    summary
                                                        .currentMonth
                                                        ?.budget
                                                )}

                                            </strong>

                                        </div>


                                        {/* MONTH SALES */}

                                        <div className="current-month-card">

                                            <span>
                                                Current Month Sales
                                            </span>

                                            <strong>

                                                Rs.{" "}

                                                {formatMoney(
                                                    summary
                                                        .currentMonth
                                                        ?.sales
                                                )}

                                            </strong>

                                        </div>


                                        {/* MONTH PERCENTAGE */}

                                        <div
                                            className={
                                                `current-month-card ` +
                                                getPercentageClass(
                                                    summary
                                                        .currentMonth
                                                        ?.percentage
                                                )
                                            }
                                        >

                                            <span>
                                                Achievement
                                            </span>

                                            <strong>

                                                {Number(
                                                    summary
                                                        .currentMonth
                                                        ?.percentage ||
                                                    0
                                                ).toFixed(2)}

                                                %

                                            </strong>

                                        </div>

                                    </div>

                                </div>

                            )
                        }


                        {/* ==================================================
                            SALES REPRESENTATIVE PERFORMANCE
                        ================================================== */}

                        <div className="budget-grid-section">

                            <div className="section-title">

                                <h3>
                                    Sales Representative Performance
                                </h3>

                            </div>


                            <div className="budget-table-wrapper">

                                <table className="budget-table">

                                    <thead>

                                        <tr>

                                            <th>
                                                #
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

                                            <th>
                                                Allocated By
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {summary.repWise?.length === 0
                                            ? (

                                                <tr>

                                                    <td
                                                        colSpan="9"
                                                        className="no-data"
                                                    >
                                                        No Sales Rep budget data
                                                    </td>

                                                </tr>

                                            )
                                            : (

                                                summary.repWise.map(
                                                    (rep, index) => (

                                                        <tr
                                                            key={
                                                                rep.employeeNo ||
                                                                index
                                                            }
                                                        >

                                                            {/* NUMBER */}

                                                            <td>
                                                                {index + 1}
                                                            </td>


                                                            {/* SALES REP */}

                                                            <td className="rep-name">

                                                                {
                                                                    rep.salesRepName ||
                                                                    `${rep.firstName || ""} ${rep.lastName || ""}`.trim() ||
                                                                    rep.employeeNo
                                                                }

                                                                <small>
                                                                    {
                                                                        rep.employeeNo
                                                                    }
                                                                </small>

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

                                                                <div className="percentage-cell">

                                                                    <div className="progress-bar">

                                                                        <div
                                                                            className={
                                                                                `progress-fill ` +
                                                                                getPercentageClass(
                                                                                    rep.annualPercentage
                                                                                )
                                                                            }

                                                                            style={{
                                                                                width:
                                                                                    `${getProgressWidth(
                                                                                        rep.annualPercentage
                                                                                    )}%`
                                                                            }}

                                                                        />

                                                                    </div>


                                                                    <span>

                                                                        {Number(
                                                                            rep.annualPercentage ||
                                                                            0
                                                                        ).toFixed(2)}

                                                                        %

                                                                    </span>

                                                                </div>

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

                                                                <div className="percentage-cell">

                                                                    <div className="progress-bar">

                                                                        <div
                                                                            className={
                                                                                `progress-fill ` +
                                                                                getPercentageClass(
                                                                                    rep.monthlyPercentage
                                                                                )
                                                                            }

                                                                            style={{
                                                                                width:
                                                                                    `${getProgressWidth(
                                                                                        rep.monthlyPercentage
                                                                                    )}%`
                                                                            }}

                                                                        />

                                                                    </div>


                                                                    <span>

                                                                        {Number(
                                                                            rep.monthlyPercentage ||
                                                                            0
                                                                        ).toFixed(2)}

                                                                        %

                                                                    </span>

                                                                </div>

                                                            </td>


                                                            {/* ALLOCATED BY */}

                                                            <td>

                                                                {
                                                                    rep.allocatedBy ||
                                                                    "-"
                                                                }

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

                    </>

                )}


                {/* ==================================================
                    ADD BUDGET
                    OUTSIDE selectedYear BLOCK
                ================================================== */}

                <div className="add-budget-section">

                    <div className="section-title">

                        <h3>
                            Add Budget
                        </h3>

                    </div>


                    <div className="budget-form">


                        {/* USER NAME */}

                        <div className="budget-field">

                            <label>
                                User Name
                            </label>

                            <input
                                type="text"
                                value={username}
                                readOnly
                                className="username-readonly"
                            />

                        </div>


                        {/* TOTAL BUDGET */}

                        <div className="budget-field">

                            <label>
                                Total Budget
                            </label>


                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={totalBudget}
                                onChange={(e) =>
                                    setTotalBudget(
                                        e.target.value
                                    )
                                }
                                disabled={
                                    Number(
                                        summary.totalBudget
                                    ) > 0
                                }
                                placeholder="Enter total budget"
                            />


                            {Number(
                                summary.totalBudget
                            ) > 0 && (

                                <small>
                                    Total budget already exists.
                                    Use "Change Budget" to modify it.
                                </small>

                            )}

                        </div>


                        {/* SALES REPRESENTATIVE */}

                        <div className="budget-field">

                            <label>
                                Sales Representative
                            </label>


                            <select
                                value={selectedRep}
                                onChange={(e) =>
                                    setSelectedRep(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Select Sales Rep
                                </option>


                                {salesReps.map(
                                    rep => (

                                        <option
                                            key={
                                                rep.employeeNo
                                            }
                                            value={
                                                rep.employeeNo
                                            }
                                        >

                                            {
                                                rep.salesRepName ||
                                                `${rep.firstName || ""} ${rep.lastName || ""}`.trim() ||
                                                rep.employeeNo
                                            }

                                        </option>

                                    )
                                )}

                            </select>


                            {salesReps.length === 0 && (

                                <small>
                                    No Sales Representatives loaded.
                                </small>

                            )}

                        </div>


                        {/* ALLOCATE BUDGET */}

                        <div className="budget-field">

                            <label>
                                Allocate Budget
                            </label>


                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={allocatedBudget}
                                onChange={(e) =>
                                    setAllocatedBudget(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter amount"
                            />

                        </div>


                        {/* REMAINING BUDGET */}

                        <div className="budget-field remaining-field">

                            <label>
                                Remaining Budget
                            </label>


                            <div className="remaining-budget">

                                Rs.{" "}

                                {formatMoney(

                                    Math.max(

                                        0,

                                        (
                                            Number(
                                                summary.totalBudget
                                            ) > 0

                                                ? Number(
                                                    remainingBudget
                                                )

                                                : Number(
                                                    totalBudget || 0
                                                )
                                        )

                                        -

                                        Number(
                                            allocatedBudget || 0
                                        )

                                    )

                                )}

                            </div>

                        </div>


                        {/* ADD BUTTON */}

                        <button
                            type="button"
                            className="add-budget-btn"
                            onClick={handleAddBudget}
                            disabled={loading}
                        >

                            {loading
                                ? "Saving..."
                                : "Add Budget"
                            }

                        </button>

                    </div>

                </div>
<AlertBox
    show={alert.show}
    type={alert.type}
    title={alert.title}
    message={alert.message}
    onClose={closeAlert}
    onConfirm={alert.onConfirm}
/>

            </div>

        </div>

    );

}