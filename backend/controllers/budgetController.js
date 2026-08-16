const { poolPromise, sql } = require("../db");


/*
|--------------------------------------------------------------------------
| GET BUDGET YEARS
|--------------------------------------------------------------------------
*/
exports.getBudgetYears = async (req, res) => {

    try {

        const pool =
            await poolPromise;


        const result =
            await pool.request().query(`

                SELECT
                    BudgetYear AS year

                FROM Budget_Master

                ORDER BY
                    BudgetYear DESC

            `);


        let years =
            result.recordset || [];


        /*
        |--------------------------------------------------------------------------
        | ALWAYS SHOW CURRENT YEAR
        |--------------------------------------------------------------------------
        */
        const currentYear =
            new Date().getFullYear();


        const exists =
            years.some(
                item =>
                    Number(item.year) ===
                    currentYear
            );


        if (!exists) {

            years.unshift({

                year:
                    currentYear

            });

        }


        res.json(
            years
        );


    } catch (err) {

        console.error(
            "getBudgetYears error:",
            err
        );


        res.status(500).json({

            error:
                "Failed to load budget years",

            details:
                err.message

        });

    }

};


/*
|--------------------------------------------------------------------------
| GET SALES REPRESENTATIVES
|--------------------------------------------------------------------------
*/
exports.getSalesReps = async (req, res) => {

    try {

        const pool =
            await poolPromise;


        const result =
            await pool.request().query(`

                SELECT

                    employeeNo,

                    firstName,

                    lastName,

                    callingName,

                    position,

                    login_user,

                    LTRIM(RTRIM(

                        ISNULL(
                            firstName,
                            ''
                        )

                        +

                        CASE

                            WHEN
                                ISNULL(
                                    firstName,
                                    ''
                                ) <> ''

                                AND

                                ISNULL(
                                    lastName,
                                    ''
                                ) <> ''

                            THEN ' '

                            ELSE ''

                        END

                        +

                        ISNULL(
                            lastName,
                            ''
                        )

                    )) AS salesRepName


                FROM Admin_Panel


                WHERE

                    LOWER(
                        LTRIM(
                            RTRIM(
                                ISNULL(
                                    position,
                                    ''
                                )
                            )
                        )
                    ) LIKE '%sales%'


                    AND


                    (

                        LOWER(
                            LTRIM(
                                RTRIM(
                                    ISNULL(
                                        position,
                                        ''
                                    )
                                )
                            )
                        ) LIKE '%representative%'


                        OR


                        LOWER(
                            LTRIM(
                                RTRIM(
                                    ISNULL(
                                        position,
                                        ''
                                    )
                                )
                            )
                        ) LIKE '%sales rep%'


                        OR


                        LOWER(
                            LTRIM(
                                RTRIM(
                                    ISNULL(
                                        position,
                                        ''
                                    )
                                )
                            )
                        ) LIKE '%salesman%'


                        OR


                        LOWER(
                            LTRIM(
                                RTRIM(
                                    ISNULL(
                                        position,
                                        ''
                                    )
                                )
                            )
                        ) LIKE '%sales person%'

                    )


                ORDER BY

                    firstName,

                    lastName

            `);


        res.json(
            result.recordset
        );


    } catch (err) {

        console.error(
            "getSalesReps error:",
            err
        );


        res.status(500).json({

            error:
                "Failed to load Sales Representatives",

            details:
                err.message

        });

    }

};


/*
|--------------------------------------------------------------------------
| GET REMAINING BUDGET
|--------------------------------------------------------------------------
*/
exports.getRemainingBudget = async (req, res) => {

    try {

        const year =
            Number(
                req.params.year
            );


        if (!year) {

            return res.status(400).json({

                error:
                    "Valid year required"

            });

        }


        const pool =
            await poolPromise;


        const masterResult =
            await pool.request()

                .input(
                    "year",
                    sql.Int,
                    year
                )

                .query(`

                    SELECT

                        BudgetID,

                        TotalBudget

                    FROM Budget_Master

                    WHERE
                        BudgetYear =
                        @year

                `);


        /*
        |--------------------------------------------------------------------------
        | NO BUDGET
        |--------------------------------------------------------------------------
        */
        if (
            masterResult.recordset.length === 0
        ) {

            return res.json({

                totalBudget:
                    0,

                allocatedBudget:
                    0,

                remainingBudget:
                    0,

                exists:
                    false

            });

        }


        const budgetID =
            masterResult
                .recordset[0]
                .BudgetID;


        const totalBudget =
            Number(
                masterResult
                    .recordset[0]
                    .TotalBudget ||
                0
            );


        const allocationResult =
            await pool.request()

                .input(
                    "budgetID",
                    sql.Int,
                    budgetID
                )

                .query(`

                    SELECT

                        ISNULL(
                            SUM(
                                AllocatedBudget
                            ),
                            0
                        ) AS allocatedBudget

                    FROM Budget_Allocation

                    WHERE
                        BudgetID =
                        @budgetID

                `);


        const allocatedBudget =
            Number(
                allocationResult
                    .recordset[0]
                    .allocatedBudget ||
                0
            );


        res.json({

            totalBudget,

            allocatedBudget,

            remainingBudget:
                Math.max(
                    totalBudget -
                    allocatedBudget,
                    0
                ),

            exists:
                true

        });


    } catch (err) {

        console.error(
            "getRemainingBudget error:",
            err
        );


        res.status(500).json({

            error:
                "Failed to load remaining budget",

            details:
                err.message

        });

    }

};


/*
|--------------------------------------------------------------------------
| ADD / ALLOCATE BUDGET
|--------------------------------------------------------------------------
*/
exports.addBudget = async (req, res) => {

    const pool =
        await poolPromise;


    const transaction =
        new sql.Transaction(
            pool
        );


    try {

        const {

            year,

            totalBudget,

            employeeNo,

            allocatedBudget,

            login_user

        } = req.body;


        const budgetYear =
            Number(year);


        const masterBudget =
            Number(totalBudget);


        const allocation =
            Number(allocatedBudget);


        const username =
            req.user?.username ||
            login_user ||
            "Unknown";


        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        if (!budgetYear) {

            return res.status(400).json({

                error:
                    "Year is required"

            });

        }


        if (
            !masterBudget ||
            masterBudget <= 0
        ) {

            return res.status(400).json({

                error:
                    "Enter a valid Total Budget"

            });

        }


        if (!employeeNo) {

            return res.status(400).json({

                error:
                    "Select Sales Representative"

            });

        }


        if (
            !allocation ||
            allocation <= 0
        ) {

            return res.status(400).json({

                error:
                    "Enter a valid allocation amount"

            });

        }


        await transaction.begin();


        /*
        |--------------------------------------------------------------------------
        | FIND MASTER
        |--------------------------------------------------------------------------
        */
        const masterResult =
            await new sql.Request(
                transaction
            )

                .input(
                    "year",
                    sql.Int,
                    budgetYear
                )

                .query(`

                    SELECT

                        BudgetID,

                        TotalBudget

                    FROM Budget_Master

                    WHERE
                        BudgetYear =
                        @year

                `);


        let budgetID;

        let existingTotalBudget;


        /*
        |--------------------------------------------------------------------------
        | CREATE MASTER
        |--------------------------------------------------------------------------
        */
        if (
            masterResult.recordset.length === 0
        ) {

            const insertResult =
                await new sql.Request(
                    transaction
                )

                    .input(
                        "year",
                        sql.Int,
                        budgetYear
                    )

                    .input(
                        "totalBudget",
                        sql.Decimal(
                            18,
                            2
                        ),
                        masterBudget
                    )

                    .input(
                        "createdBy",
                        sql.VarChar(
                            100
                        ),
                        username
                    )

                    .query(`

                        INSERT INTO Budget_Master
                        (
                            BudgetYear,

                            TotalBudget,

                            CreatedBy,

                            CreatedDate
                        )

                        OUTPUT
                            INSERTED.BudgetID

                        VALUES
                        (
                            @year,

                            @totalBudget,

                            @createdBy,

                            GETDATE()
                        )

                    `);


            budgetID =
                insertResult
                    .recordset[0]
                    .BudgetID;


            existingTotalBudget =
                masterBudget;

        }

        /*
        |--------------------------------------------------------------------------
        | EXISTING MASTER
        |--------------------------------------------------------------------------
        */
        else {

            budgetID =
                masterResult
                    .recordset[0]
                    .BudgetID;


            existingTotalBudget =
                Number(
                    masterResult
                        .recordset[0]
                        .TotalBudget
                );

        }


        /*
        |--------------------------------------------------------------------------
        | CHECK DUPLICATE REP
        |--------------------------------------------------------------------------
        */
        const duplicate =
            await new sql.Request(
                transaction
            )

                .input(
                    "budgetID",
                    sql.Int,
                    budgetID
                )

                .input(
                    "employeeNo",
                    sql.VarChar(
                        50
                    ),
                    employeeNo
                )

                .query(`

                    SELECT
                        AllocationID

                    FROM Budget_Allocation

                    WHERE
                        BudgetID =
                        @budgetID

                    AND
                        EmployeeNo =
                        @employeeNo

                `);


        if (
            duplicate.recordset.length > 0
        ) {

            throw new Error(

                "This Sales Rep is already allocated for this year."

            );

        }


        /*
        |--------------------------------------------------------------------------
        | CURRENT ALLOCATION
        |--------------------------------------------------------------------------
        */
        const allocatedResult =
            await new sql.Request(
                transaction
            )

                .input(
                    "budgetID",
                    sql.Int,
                    budgetID
                )

                .query(`

                    SELECT

                        ISNULL(
                            SUM(
                                AllocatedBudget
                            ),
                            0
                        ) AS allocated

                    FROM Budget_Allocation

                    WHERE
                        BudgetID =
                        @budgetID

                `);


        const alreadyAllocated =
            Number(
                allocatedResult
                    .recordset[0]
                    .allocated ||
                0
            );


        const remaining =
            existingTotalBudget -
            alreadyAllocated;


        /*
        |--------------------------------------------------------------------------
        | PREVENT OVER ALLOCATION
        |--------------------------------------------------------------------------
        */
        if (
            allocation >
            remaining
        ) {

            throw new Error(

                `Allocation exceeds remaining budget. ` +

                `Remaining Budget: Rs. ` +

                remaining.toLocaleString(
                    "en-LK",
                    {
                        minimumFractionDigits:
                            2
                    }
                )

            );

        }


        /*
        |--------------------------------------------------------------------------
        | INSERT ALLOCATION
        |--------------------------------------------------------------------------
        */
        await new sql.Request(
            transaction
        )

            .input(
                "budgetID",
                sql.Int,
                budgetID
            )

            .input(
                "employeeNo",
                sql.VarChar(
                    50
                ),
                employeeNo
            )

            .input(
                "allocatedBudget",
                sql.Decimal(
                    18,
                    2
                ),
                allocation
            )

            .input(
                "createdBy",
                sql.VarChar(
                    100
                ),
                username
            )

            .query(`

                INSERT INTO Budget_Allocation
                (
                    BudgetID,

                    EmployeeNo,

                    AllocatedBudget,

                    CreatedBy,

                    CreatedDate
                )

                VALUES
                (
                    @budgetID,

                    @employeeNo,

                    @allocatedBudget,

                    @createdBy,

                    GETDATE()
                )

            `);


        await transaction.commit();


        const newRemaining =
            remaining -
            allocation;


        res.json({

            success:
                true,

            message:
                "Budget allocated successfully",

            username,

            totalBudget:
                existingTotalBudget,

            allocatedBudget:
                allocation,

            previousAllocated:
                alreadyAllocated,

            remainingBudget:
                newRemaining

        });


    } catch (err) {

        try {

            await transaction.rollback();

        } catch (
            rollbackError
        ) {

            console.error(
                "Rollback error:",
                rollbackError
            );

        }


        console.error(
            "addBudget error:",
            err
        );


        res.status(400).json({

            error:
                err.message ||
                "Failed to add budget"

        });

    }

};


/*
|--------------------------------------------------------------------------
| CHANGE TOTAL BUDGET
|--------------------------------------------------------------------------
*/
exports.changeBudget = async (req, res) => {

    const pool =
        await poolPromise;


    const transaction =
        new sql.Transaction(
            pool
        );


    try {

        const {

            year,

            newTotalBudget,

            login_user

        } = req.body;


        const budgetYear =
            Number(year);


        const newBudget =
            Number(
                newTotalBudget
            );


        const username =
            req.user?.username ||
            login_user ||
            "Unknown";


        if (!budgetYear) {

            return res.status(400).json({

                error:
                    "Year is required"

            });

        }


        if (
            !newBudget ||
            newBudget <= 0
        ) {

            return res.status(400).json({

                error:
                    "Enter a valid new Total Budget"

            });

        }


        await transaction.begin();


        /*
        |--------------------------------------------------------------------------
        | MASTER
        |--------------------------------------------------------------------------
        */
        const masterResult =
            await new sql.Request(
                transaction
            )

                .input(
                    "year",
                    sql.Int,
                    budgetYear
                )

                .query(`

                    SELECT

                        BudgetID,

                        TotalBudget

                    FROM Budget_Master

                    WHERE
                        BudgetYear =
                        @year

                `);


        if (
            masterResult.recordset.length === 0
        ) {

            throw new Error(
                "Budget for this year does not exist."
            );

        }


        const budgetID =
            masterResult
                .recordset[0]
                .BudgetID;


        const oldBudget =
            Number(
                masterResult
                    .recordset[0]
                    .TotalBudget
            );


        /*
        |--------------------------------------------------------------------------
        | ALLOCATED
        |--------------------------------------------------------------------------
        */
        const allocationResult =
            await new sql.Request(
                transaction
            )

                .input(
                    "budgetID",
                    sql.Int,
                    budgetID
                )

                .query(`

                    SELECT

                        ISNULL(
                            SUM(
                                AllocatedBudget
                            ),
                            0
                        ) AS allocated

                    FROM Budget_Allocation

                    WHERE
                        BudgetID =
                        @budgetID

                `);


        const allocated =
            Number(
                allocationResult
                    .recordset[0]
                    .allocated ||
                0
            );


        /*
        |--------------------------------------------------------------------------
        | NEW TOTAL CANNOT BE BELOW ALREADY ALLOCATED
        |--------------------------------------------------------------------------
        */
        if (
            newBudget <
            allocated
        ) {

            throw new Error(

                `New Total Budget cannot be less than already allocated budget.` +

                `\n\nAllocated: Rs. ` +

                allocated.toLocaleString(
                    "en-LK",
                    {
                        minimumFractionDigits:
                            2
                    }
                )

            );

        }


        /*
        |--------------------------------------------------------------------------
        | UPDATE MASTER
        |--------------------------------------------------------------------------
        */
        await new sql.Request(
            transaction
        )

            .input(
                "budgetID",
                sql.Int,
                budgetID
            )

            .input(
                "newTotalBudget",
                sql.Decimal(
                    18,
                    2
                ),
                newBudget
            )

            .query(`

                UPDATE Budget_Master

                SET
                    TotalBudget =
                    @newTotalBudget

                WHERE
                    BudgetID =
                    @budgetID

            `);


        await transaction.commit();


        res.json({

            success:
                true,

            message:
                "Budget changed successfully",

            username,

            year:
                budgetYear,

            oldBudget,

            newBudget,

            allocatedBudget:
                allocated,

            remainingBudget:
                newBudget -
                allocated

        });


    } catch (err) {

        try {

            await transaction.rollback();

        } catch (
            rollbackError
        ) {

            console.error(
                "Rollback error:",
                rollbackError
            );

        }


        console.error(
            "changeBudget error:",
            err
        );


        res.status(400).json({

            error:
                err.message ||
                "Failed to change budget"

        });

    }

};


/*
|--------------------------------------------------------------------------
| BUDGET SUMMARY
|--------------------------------------------------------------------------
*/
exports.getBudgetSummary = async (req, res) => {

    try {

        const year =
            Number(
                req.params.year
            );


        if (!year) {

            return res.status(400).json({

                error:
                    "Valid year required"

            });

        }


        const pool =
            await poolPromise;


        /*
        |--------------------------------------------------------------------------
        | DATE INFORMATION
        |--------------------------------------------------------------------------
        */
        const today =
            new Date();


        const currentMonth =
            today.getMonth() + 1;


        const currentYear =
            today.getFullYear();


        /*
        |--------------------------------------------------------------------------
        | ANNUAL DATE RANGE
        |--------------------------------------------------------------------------
        */
        const yearStart =
            `${year}-01-01`;


        const nextYear =
            year + 1;


        const yearEnd =
            `${nextYear}-01-01`;


        /*
        |--------------------------------------------------------------------------
        | MONTH DATE RANGE
        |--------------------------------------------------------------------------
        */
        const monthStart =
            `${year}-${String(
                currentMonth
            ).padStart(2, "0")}-01`;


        const monthEndDate =
            new Date(
                year,
                currentMonth,
                1
            );


        const monthEnd =
            `${monthEndDate.getFullYear()}-${String(
                monthEndDate.getMonth() + 1
            ).padStart(2, "0")}-01`;


        /*
        |--------------------------------------------------------------------------
        | TOTAL ANNUAL BUDGET
        |--------------------------------------------------------------------------
        */
        const budgetResult =
            await pool.request()

                .input(
                    "year",
                    sql.Int,
                    year
                )

                .query(`

                    SELECT

                        ISNULL(
                            SUM(
                                TotalBudget
                            ),
                            0
                        ) AS totalBudget

                    FROM Budget_Master

                    WHERE
                        BudgetYear =
                        @year

                `);


        const totalBudget =
            Number(
                budgetResult
                    .recordset[0]
                    .totalBudget ||
                0
            );


        /*
        |--------------------------------------------------------------------------
        | ANNUAL SALES
        |--------------------------------------------------------------------------
        */
        const annualSalesResult =
            await pool.request()

                .input(
                    "yearStart",
                    sql.DateTime,
                    new Date(
                        `${yearStart}T00:00:00`
                    )
                )

                .input(
                    "yearEnd",
                    sql.DateTime,
                    new Date(
                        `${yearEnd}T00:00:00`
                    )
                )

                .query(`

                    SELECT

                        ISNULL(
                            SUM(
                                ISNULL(
                                    d.amount,
                                    0
                                )

                                -

                                ISNULL(
                                    d.discount_amount,
                                    0
                                )
                            ),
                            0
                        ) AS actualSales

                    FROM Invoice i

                    INNER JOIN Invoice_Details d

                        ON i.invoice_no =
                           d.invoice_no

                    WHERE

                        i.real_date >=
                        @yearStart

                    AND

                        i.real_date <
                        @yearEnd

                `);


        const actualSales =
            Number(
                annualSalesResult
                    .recordset[0]
                    .actualSales ||
                0
            );


        /*
        |--------------------------------------------------------------------------
        | ANNUAL PERCENTAGE
        |--------------------------------------------------------------------------
        */
        const annualPercentage =
            totalBudget > 0

                ? (
                    actualSales /
                    totalBudget
                ) * 100

                : 0;


        /*
        |--------------------------------------------------------------------------
        | CURRENT MONTH SALES
        |--------------------------------------------------------------------------
        */
        const monthlySalesResult =
            await pool.request()

                .input(
                    "monthStart",
                    sql.DateTime,
                    new Date(
                        `${monthStart}T00:00:00`
                    )
                )

                .input(
                    "monthEnd",
                    sql.DateTime,
                    new Date(
                        `${monthEnd}T00:00:00`
                    )
                )

                .query(`

                    SELECT

                        ISNULL(
                            SUM(
                                ISNULL(
                                    d.amount,
                                    0
                                )

                                -

                                ISNULL(
                                    d.discount_amount,
                                    0
                                )
                            ),
                            0
                        ) AS monthlySales

                    FROM Invoice i

                    INNER JOIN Invoice_Details d

                        ON i.invoice_no =
                           d.invoice_no

                    WHERE

                        i.real_date >=
                        @monthStart

                    AND

                        i.real_date <
                        @monthEnd

                `);


        const monthlySales =
            Number(
                monthlySalesResult
                    .recordset[0]
                    .monthlySales ||
                0
            );


        /*
        |--------------------------------------------------------------------------
        | MONTHLY BUDGET = ANNUAL / 12
        |--------------------------------------------------------------------------
        */
        const monthlyBudget =
            totalBudget /
            12;


        const monthlyPercentage =
            monthlyBudget > 0

                ? (
                    monthlySales /
                    monthlyBudget
                ) * 100

                : 0;


        /*
        |--------------------------------------------------------------------------
        | SALES REP BUDGET
        |--------------------------------------------------------------------------
        */
        const allocationResult =
            await pool.request()

                .input(
                    "year",
                    sql.Int,
                    year
                )

                .query(`

                    SELECT

                        ba.EmployeeNo,

                        ba.AllocatedBudget,

                        ba.CreatedBy,

                        a.login_user,

                        LTRIM(RTRIM(

                            ISNULL(
                                a.firstName,
                                ''
                            )

                            +

                            CASE

                                WHEN

                                    ISNULL(
                                        a.firstName,
                                        ''
                                    ) <> ''

                                    AND

                                    ISNULL(
                                        a.lastName,
                                        ''
                                    ) <> ''

                                THEN ' '

                                ELSE ''

                            END

                            +

                            ISNULL(
                                a.lastName,
                                ''
                            )

                        )) AS salesRepName


                    FROM Budget_Allocation ba


                    INNER JOIN Budget_Master bm

                        ON bm.BudgetID =
                           ba.BudgetID


                    LEFT JOIN Admin_Panel a

                        ON a.employeeNo =
                           ba.EmployeeNo


                    WHERE

                        bm.BudgetYear =
                        @year


                    ORDER BY

                        salesRepName

                `);


        /*
        |--------------------------------------------------------------------------
        | SALES REP PERFORMANCE
        |--------------------------------------------------------------------------
        */
        const repWise =
            [];


        for (
            const row
            of allocationResult.recordset
        ) {

            const annualRepBudget =
                Number(
                    row.AllocatedBudget ||
                    0
                );


            const monthlyRepBudget =
                annualRepBudget /
                12;


            /*
            |--------------------------------------------------------------------------
            | ANNUAL REP SALES
            |--------------------------------------------------------------------------
            */
            const repAnnualResult =
                await pool.request()

                    .input(
                        "loginUser",
                        sql.VarChar(
                            100
                        ),
                        row.login_user ||
                        ""
                    )

                    .input(
                        "yearStart",
                        sql.DateTime,
                        new Date(
                            `${yearStart}T00:00:00`
                        )
                    )

                    .input(
                        "yearEnd",
                        sql.DateTime,
                        new Date(
                            `${yearEnd}T00:00:00`
                        )
                    )

                    .query(`

                        SELECT

                            ISNULL(
                                SUM(

                                    ISNULL(
                                        d.amount,
                                        0
                                    )

                                    -

                                    ISNULL(
                                        d.discount_amount,
                                        0
                                    )

                                ),
                                0
                            ) AS sales

                        FROM Invoice i

                        INNER JOIN Invoice_Details d

                            ON i.invoice_no =
                               d.invoice_no

                        WHERE

                            i.user_login =
                            @loginUser

                        AND

                            i.real_date >=
                            @yearStart

                        AND

                            i.real_date <
                            @yearEnd

                    `);


            const repAnnualSales =
                Number(
                    repAnnualResult
                        .recordset[0]
                        .sales ||
                    0
                );


            /*
            |--------------------------------------------------------------------------
            | MONTHLY REP SALES
            |--------------------------------------------------------------------------
            */
            const repMonthlyResult =
                await pool.request()

                    .input(
                        "loginUser",
                        sql.VarChar(
                            100
                        ),
                        row.login_user ||
                        ""
                    )

                    .input(
                        "monthStart",
                        sql.DateTime,
                        new Date(
                            `${monthStart}T00:00:00`
                        )
                    )

                    .input(
                        "monthEnd",
                        sql.DateTime,
                        new Date(
                            `${monthEnd}T00:00:00`
                        )
                    )

                    .query(`

                        SELECT

                            ISNULL(
                                SUM(

                                    ISNULL(
                                        d.amount,
                                        0
                                    )

                                    -

                                    ISNULL(
                                        d.discount_amount,
                                        0
                                    )

                                ),
                                0
                            ) AS sales

                        FROM Invoice i

                        INNER JOIN Invoice_Details d

                            ON i.invoice_no =
                               d.invoice_no

                        WHERE

                            i.user_login =
                            @loginUser

                        AND

                            i.real_date >=
                            @monthStart

                        AND

                            i.real_date <
                            @monthEnd

                    `);


            const repMonthlySales =
                Number(
                    repMonthlyResult
                        .recordset[0]
                        .sales ||
                    0
                );


            /*
            |--------------------------------------------------------------------------
            | PERCENTAGES
            |--------------------------------------------------------------------------
            */
            const repAnnualPercentage =
                annualRepBudget > 0

                    ? (
                        repAnnualSales /
                        annualRepBudget
                    ) * 100

                    : 0;


            const repMonthlyPercentage =
                monthlyRepBudget > 0

                    ? (
                        repMonthlySales /
                        monthlyRepBudget
                    ) * 100

                    : 0;


            /*
            |--------------------------------------------------------------------------
            | BALANCES
            |--------------------------------------------------------------------------
            */
            const annualBalance =
                annualRepBudget -
                repAnnualSales;


            const monthlyBalance =
                monthlyRepBudget -
                repMonthlySales;


            repWise.push({

                employeeNo:
                    row.EmployeeNo,

                salesRepName:
                    row.salesRepName ||
                    row.EmployeeNo,

                login_user:
                    row.login_user ||
                    "",


                /*
                |--------------------------------------------------------------------------
                | ANNUAL
                |--------------------------------------------------------------------------
                */
                annualBudget:
                    annualRepBudget,

                annualSales:
                    repAnnualSales,

                annualPercentage:
                    Number(
                        repAnnualPercentage
                    ),

                annualBalance:
                    annualBalance,


                /*
                |--------------------------------------------------------------------------
                | MONTHLY
                |--------------------------------------------------------------------------
                */
                monthlyBudget:
                    monthlyRepBudget,

                monthlySales:
                    repMonthlySales,

                monthlyPercentage:
                    Number(
                        repMonthlyPercentage
                    ),

                monthlyBalance:
                    monthlyBalance,


                /*
                |--------------------------------------------------------------------------
                | EXISTING FIELD COMPATIBILITY
                |--------------------------------------------------------------------------
                */
                allocatedBudget:
                    annualRepBudget,

                actualSales:
                    repAnnualSales,

                percentage:
                    Number(
                        repAnnualPercentage
                    ),

                remainingBudget:
                    annualBalance,

                allocatedBy:
                    row.CreatedBy ||
                    ""

            });

        }


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */
        res.json({

            year,

            totalBudget,

            actualSales,

            percentage:
                Number(
                    annualPercentage
                ),


            repWise,


            currentMonth: {

                year,

                month:
                    currentMonth,

                budget:
                    monthlyBudget,

                sales:
                    monthlySales,

                percentage:
                    Number(
                        monthlyPercentage
                    )

            }

        });


    } catch (err) {

        console.error(
            "getBudgetSummary error:",
            err
        );


        res.status(500).json({

            error:
                "Failed to load budget summary",

            details:
                err.message

        });

    }

};