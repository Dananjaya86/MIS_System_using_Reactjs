const { poolPromise, sql } = require("../db");


// ============================================================
// HELPER
// ============================================================

const safeNumber = (value) => {
    return Number(value || 0);
};


// ============================================================
// GET DASHBOARD
// ============================================================

const getDashboard = async (req, res) => {

    try {

        const pool = await poolPromise;


        // =====================================================
        // 1. SUMMARY
        // =====================================================

        const summaryResult =
            await pool.request().query(`

                DECLARE @Today DATE =
                    CAST(GETDATE() AS DATE);


                DECLARE @CurrentMonthStart DATE =
                    DATEFROMPARTS(
                        YEAR(@Today),
                        MONTH(@Today),
                        1
                    );


                DECLARE @NextMonthStart DATE =
                    DATEADD(
                        MONTH,
                        1,
                        @CurrentMonthStart
                    );


                DECLARE @CurrentYearStart DATE =
                    DATEFROMPARTS(
                        YEAR(@Today),
                        1,
                        1
                    );


                DECLARE @NextYearStart DATE =
                    DATEADD(
                        YEAR,
                        1,
                        @CurrentYearStart
                    );


                /*
                =================================================
                CURRENT MONTH SALES
                =================================================
                */

                SELECT

                    ISNULL(
                        (
                            SELECT
                                SUM(
                                    ISNULL(
                                        total_invoice_amount,
                                        0
                                    )
                                )

                            FROM Invoice

                            WHERE
                                real_date >=
                                    @CurrentMonthStart

                                AND real_date <
                                    @NextMonthStart
                        ),
                        0
                    ) AS TotalSale,


                    /*
                    =================================================
                    CURRENT MONTH RETURNS
                    =================================================
                    */

                    ISNULL(
                        (
                            SELECT
                                SUM(
                                    ISNULL(
                                        amount,
                                        0
                                    )
                                )

                            FROM Return_Details

                            WHERE
                                real_date >=
                                    @CurrentMonthStart

                                AND real_date <
                                    @NextMonthStart
                        ),
                        0
                    ) AS TotalReturn,


                    /*
                    =================================================
                    CURRENT YEAR SALES
                    =================================================
                    */

                    ISNULL(
                        (
                            SELECT
                                SUM(
                                    ISNULL(
                                        total_invoice_amount,
                                        0
                                    )
                                )

                            FROM Invoice

                            WHERE
                                real_date >=
                                    @CurrentYearStart

                                AND real_date <
                                    @NextYearStart
                        ),
                        0
                    ) AS YearSales,


                    /*
                    =================================================
                    CURRENT YEAR BUDGET
                    =================================================
                    */

                    ISNULL(
                        (
                            SELECT TOP 1
                                TotalBudget

                            FROM Budget_Master

                            WHERE
                                BudgetYear =
                                    YEAR(@Today)

                            ORDER BY
                                CreatedDate DESC
                        ),
                        0
                    ) AS YearBudget;

            `);


        const summary =
            summaryResult.recordset[0] || {};


        const totalSale =
            safeNumber(
                summary.TotalSale
            );


        const totalReturn =
            safeNumber(
                summary.TotalReturn
            );


        const netSale =
            totalSale -
            totalReturn;


        const yearSales =
            safeNumber(
                summary.YearSales
            );


        const yearBudget =
            safeNumber(
                summary.YearBudget
            );


        const achievement =
            yearBudget > 0
                ? (
                    yearSales /
                    yearBudget
                ) * 100
                : 0;



        // =====================================================
        // 2. BEST SALES REPRESENTATIVE
        // =====================================================

        const bestRepResult =
            await pool.request().query(`

                DECLARE @MonthStart DATE =
                    DATEFROMPARTS(
                        YEAR(GETDATE()),
                        MONTH(GETDATE()),
                        1
                    );


                DECLARE @NextMonth DATE =
                    DATEADD(
                        MONTH,
                        1,
                        @MonthStart
                    );


                SELECT TOP 1

                    ISNULL(
                        NULLIF(
                            LTRIM(
                                RTRIM(
                                    CONCAT(
                                        ISNULL(
                                            A.firstName,
                                            ''
                                        ),
                                        ' ',
                                        ISNULL(
                                            A.lastName,
                                            ''
                                        )
                                    )
                                )
                            ),
                            ''
                        ),
                        I.user_login
                    ) AS SalesRepName,


                    I.user_login AS LoginUser,


                    SUM(
                        ISNULL(
                            I.total_invoice_amount,
                            0
                        )
                    ) AS SalesAmount


                FROM Invoice I


                LEFT JOIN Admin_Panel A

                    ON A.login_user =
                       I.user_login


                WHERE

                    I.real_date >=
                        @MonthStart

                    AND I.real_date <
                        @NextMonth


                GROUP BY

                    I.user_login,

                    A.firstName,

                    A.lastName


                ORDER BY
                    SalesAmount DESC;

            `);


        const bestRep =
            bestRepResult.recordset[0] ||
            null;



        // =====================================================
        // 3. MOST SELLING PRODUCTS
        // =====================================================

        const productsResult =
            await pool.request().query(`

                DECLARE @MonthStart DATE =
                    DATEFROMPARTS(
                        YEAR(GETDATE()),
                        MONTH(GETDATE()),
                        1
                    );


                DECLARE @NextMonth DATE =
                    DATEADD(
                        MONTH,
                        1,
                        @MonthStart
                    );


                SELECT TOP 10

                    D.product_code AS ProductCode,

                    D.product_name AS ProductName,


                    SUM(
                        ISNULL(
                            D.qty,
                            0
                        )
                    ) AS Qty,


                    SUM(
                        ISNULL(
                            D.amount,
                            0
                        )
                    ) AS Amount


                FROM Invoice_Details D


                INNER JOIN Invoice I

                    ON I.invoice_no =
                       D.invoice_no


                WHERE

                    I.real_date >=
                        @MonthStart

                    AND I.real_date <
                        @NextMonth


                GROUP BY

                    D.product_code,

                    D.product_name


                ORDER BY
                    Qty DESC;

            `);



        // =====================================================
        // 4. BEST SELLING CUSTOMERS
        // =====================================================

        const customersResult =
            await pool.request().query(`

                DECLARE @MonthStart DATE =
                    DATEFROMPARTS(
                        YEAR(GETDATE()),
                        MONTH(GETDATE()),
                        1
                    );


                DECLARE @NextMonth DATE =
                    DATEADD(
                        MONTH,
                        1,
                        @MonthStart
                    );


                SELECT TOP 10

                    I.customer_code AS CustomerCode,


                    MAX(
                        I.customer_name
                    ) AS CustomerName,


                    SUM(
                        ISNULL(
                            D.qty,
                            0
                        )
                    ) AS Qty,


                    SUM(
                        ISNULL(
                            D.amount,
                            0
                        )
                    ) AS Amount


                FROM Invoice I


                INNER JOIN Invoice_Details D

                    ON I.invoice_no =
                       D.invoice_no


                WHERE

                    I.real_date >=
                        @MonthStart

                    AND I.real_date <
                        @NextMonth


                GROUP BY

                    I.customer_code


                ORDER BY
                    Amount DESC;

            `);



        // =====================================================
        // 5. SALES BY DATE
        // =====================================================

        const dailySalesResult =
            await pool.request().query(`

                DECLARE @MonthStart DATE =
                    DATEFROMPARTS(
                        YEAR(GETDATE()),
                        MONTH(GETDATE()),
                        1
                    );


                DECLARE @NextMonth DATE =
                    DATEADD(
                        MONTH,
                        1,
                        @MonthStart
                    );


                SELECT

                    DAY(real_date) AS SaleDay,


                    SUM(
                        ISNULL(
                            total_invoice_amount,
                            0
                        )
                    ) AS Amount


                FROM Invoice


                WHERE

                    real_date >=
                        @MonthStart

                    AND real_date <
                        @NextMonth


                GROUP BY

                    DAY(real_date)


                ORDER BY
                    SaleDay;

            `);



        // =====================================================
        // 6. LAST MONTH VS CURRENT MONTH
        // =====================================================

        const monthlySalesResult =
            await pool.request().query(`

                DECLARE @CurrentMonthStart DATE =
                    DATEFROMPARTS(
                        YEAR(GETDATE()),
                        MONTH(GETDATE()),
                        1
                    );


                DECLARE @PreviousMonthStart DATE =
                    DATEADD(
                        MONTH,
                        -1,
                        @CurrentMonthStart
                    );


                SELECT

                    ISNULL(
                        SUM(
                            CASE

                                WHEN
                                    real_date >=
                                        @PreviousMonthStart

                                    AND real_date <
                                        @CurrentMonthStart

                                THEN
                                    ISNULL(
                                        total_invoice_amount,
                                        0
                                    )

                                ELSE 0

                            END
                        ),
                        0
                    ) AS LastMonthSales,


                    ISNULL(
                        SUM(
                            CASE

                                WHEN
                                    real_date >=
                                        @CurrentMonthStart

                                THEN
                                    ISNULL(
                                        total_invoice_amount,
                                        0
                                    )

                                ELSE 0

                            END
                        ),
                        0
                    ) AS CurrentMonthSales


                FROM Invoice


                WHERE

                    real_date >=
                        @PreviousMonthStart;

            `);



        const monthlySales =
            monthlySalesResult.recordset[0] ||
            {};



        // =====================================================
        // 7. MONTHLY BUDGET
        // =====================================================

        const monthlyBudgetResult =
            await pool.request().query(`

                SELECT TOP 1

                    ISNULL(
                        TotalBudget,
                        0
                    ) AS TotalBudget


                FROM Budget_Master


                WHERE

                    BudgetYear =
                        YEAR(GETDATE())


                ORDER BY
                    CreatedDate DESC;

            `);



        const annualBudget =
            safeNumber(
                monthlyBudgetResult
                    .recordset[0]
                    ?.TotalBudget
            );


        const monthlyBudget =
            annualBudget / 12;


        const currentMonthSales =
            safeNumber(
                monthlySales.CurrentMonthSales
            );


        const monthlyRemaining =
            Math.max(
                monthlyBudget -
                currentMonthSales,
                0
            );


        const monthlyAchievement =
            monthlyBudget > 0

                ? (
                    currentMonthSales /
                    monthlyBudget
                ) * 100

                : 0;



        // =====================================================
        // 8. YEARLY BUDGET
        // =====================================================

        const yearlyBudgetResult =
            await pool.request().query(`

                SELECT TOP 1

                    BudgetYear,

                    TotalBudget


                FROM Budget_Master


                ORDER BY

                    BudgetYear DESC,

                    CreatedDate DESC;

            `);



        const yearlyBudgetRow =
            yearlyBudgetResult.recordset[0] ||
            {};



        // =====================================================
        // 9. SALES REPRESENTATIVE PERFORMANCE
        // =====================================================
     

        const repPerformanceResult =
            await pool.request().query(`

                DECLARE @CurrentYear INT =
                    YEAR(GETDATE());


                DECLARE @YearStart DATE =
                    DATEFROMPARTS(
                        @CurrentYear,
                        1,
                        1
                    );


                DECLARE @NextYear DATE =
                    DATEADD(
                        YEAR,
                        1,
                        @YearStart
                    );


                DECLARE @MonthStart DATE =
                    DATEFROMPARTS(
                        @CurrentYear,
                        MONTH(GETDATE()),
                        1
                    );


                DECLARE @NextMonth DATE =
                    DATEADD(
                        MONTH,
                        1,
                        @MonthStart
                    );


                /*
                =================================================
                SALES REPRESENTATIVES
                =================================================

                We use Admin_Panel as the main table.

                This means every active Sales Representative
                is included.

                Budget and Sales are calculated separately.
                */


                SELECT

                    A.employeeNo AS EmployeeNo,


                    /*
                    =================================================
                    SALES REP NAME
                    =================================================
                    */

                    LTRIM(
                        RTRIM(
                            CONCAT(
                                ISNULL(
                                    A.firstName,
                                    ''
                                ),
                                ' ',
                                ISNULL(
                                    A.lastName,
                                    ''
                                )
                            )
                        )
                    ) AS SalesRepName,


                    /*
                    =================================================
                    LOGIN USER
                    =================================================
                    */

                    A.login_user AS LoginUser,


                    /*
                    =================================================
                    ANNUAL BUDGET
                    =================================================

                    SUM is used because one employee may have
                    multiple allocation records.

                    */

                    ISNULL(
                        (
                            SELECT

                                SUM(
                                    ISNULL(
                                        BA.AllocatedBudget,
                                        0
                                    )
                                )

                            FROM Budget_Allocation BA


                            INNER JOIN Budget_Master BM

                                ON BM.BudgetID =
                                   BA.BudgetID


                            WHERE

                                BA.EmployeeNo =
                                    A.employeeNo

                                AND BM.BudgetYear =
                                    @CurrentYear

                        ),
                        0
                    ) AS AnnualBudget,


                    /*
                    =================================================
                    ANNUAL SALES
                    =================================================

                    Invoice.user_login
                    =
                    Admin_Panel.login_user

                    */

                    ISNULL(
                        (
                            SELECT

                                SUM(
                                    ISNULL(
                                        I.total_invoice_amount,
                                        0
                                    )
                                )

                            FROM Invoice I


                            WHERE

                                LTRIM(
                                    RTRIM(
                                        ISNULL(
                                            I.user_login,
                                            ''
                                        )
                                    )
                                )
                                =
                                LTRIM(
                                    RTRIM(
                                        ISNULL(
                                            A.login_user,
                                            ''
                                        )
                                    )
                                )


                                AND I.real_date >=
                                    @YearStart


                                AND I.real_date <
                                    @NextYear

                        ),
                        0
                    ) AS AnnualSales,


                    /*
                    =================================================
                    MONTHLY BUDGET
                    =================================================

                    Annual Budget / 12

                    */

                    ISNULL(
                        (
                            SELECT

                                SUM(
                                    ISNULL(
                                        BA.AllocatedBudget,
                                        0
                                    )
                                )

                            FROM Budget_Allocation BA


                            INNER JOIN Budget_Master BM

                                ON BM.BudgetID =
                                   BA.BudgetID


                            WHERE

                                BA.EmployeeNo =
                                    A.employeeNo

                                AND BM.BudgetYear =
                                    @CurrentYear

                        ),
                        0
                    ) / 12 AS MonthlyBudget,


                    /*
                    =================================================
                    CURRENT MONTH SALES
                    =================================================
                    */

                    ISNULL(
                        (
                            SELECT

                                SUM(
                                    ISNULL(
                                        I.total_invoice_amount,
                                        0
                                    )
                                )

                            FROM Invoice I


                            WHERE

                                LTRIM(
                                    RTRIM(
                                        ISNULL(
                                            I.user_login,
                                            ''
                                        )
                                    )
                                )
                                =
                                LTRIM(
                                    RTRIM(
                                        ISNULL(
                                            A.login_user,
                                            ''
                                        )
                                    )
                                )


                                AND I.real_date >=
                                    @MonthStart


                                AND I.real_date <
                                    @NextMonth

                        ),
                        0
                    ) AS MonthlySales,


                    /*
                    =================================================
                    LAST ALLOCATED BY
                    =================================================
                    */

                    ISNULL(
                        (
                            SELECT TOP 1

                                BA.CreatedBy

                            FROM Budget_Allocation BA


                            INNER JOIN Budget_Master BM

                                ON BM.BudgetID =
                                   BA.BudgetID


                            WHERE

                                BA.EmployeeNo =
                                    A.employeeNo

                                AND BM.BudgetYear =
                                    @CurrentYear


                            ORDER BY

                                BA.CreatedDate DESC

                        ),
                        '-'
                    ) AS AllocatedBy


                /*
                =====================================================
                MAIN TABLE
                =====================================================
                */

                FROM Admin_Panel A


                /*
                =====================================================
                ACTIVE SALES REPRESENTATIVES
                =====================================================

                This is intentionally broader than only
                position = "Sales".

                It supports positions such as:

                    Sales
                    Sales Representative
                    Sales Rep
                    Sales Executive
                    Sales Officer

                and positions containing "representative".

                =====================================================
                */

                WHERE

                    (

                        LOWER(
                            LTRIM(
                                RTRIM(
                                    ISNULL(
                                        A.position,
                                        ''
                                    )
                                )
                            )
                        ) LIKE '%sales%'


                        OR


                        LOWER(
                            LTRIM(
                                RTRIM(
                                    ISNULL(
                                        A.position,
                                        ''
                                    )
                                )
                            )
                        ) LIKE '%representative%'

                    )


                    /*
                    =================================================
                    ACTIVE STATUS
                    =================================================
                    */

                    AND

                    LOWER(
                        LTRIM(
                            RTRIM(
                                ISNULL(
                                    A.active,
                                    'yes'
                                )
                            )
                        )
                    ) <> 'no'


                /*
                =================================================
                SORT
                =================================================

                First by Annual Sales.

                If Annual Sales is equal,
                Annual Budget / performance is used later
                by frontend.

                =================================================
                */

                ORDER BY

                    AnnualSales DESC;

            `);



        // =====================================================
        // 10. ADD PERCENTAGES
        // =====================================================

        const repPerformance =
            repPerformanceResult.recordset.map(
                row => {

                    const annualBudget =
                        safeNumber(
                            row.AnnualBudget
                        );


                    const annualSales =
                        safeNumber(
                            row.AnnualSales
                        );


                    const monthlyBudget =
                        safeNumber(
                            row.MonthlyBudget
                        );


                    const monthlySales =
                        safeNumber(
                            row.MonthlySales
                        );


                    const annualPercentage =
                        annualBudget > 0

                            ? (
                                annualSales /
                                annualBudget
                            ) * 100

                            : 0;


                    const monthlyPercentage =
                        monthlyBudget > 0

                            ? (
                                monthlySales /
                                monthlyBudget
                            ) * 100

                            : 0;


                    return {

                        employeeNo:
                            row.EmployeeNo,


                        salesRepName:
                            row.SalesRepName,


                        loginUser:
                            row.LoginUser || "",


                        annualBudget,


                        annualSales,


                        annualPercentage,


                        monthlyBudget,


                        monthlySales,


                        monthlyPercentage,


                        allocatedBy:
                            row.AllocatedBy ||
                            "-"

                    };

                }
            );



        // =====================================================
        // 11. RESPONSE
        // =====================================================

        res.json({

            success: true,


            lastUpdated:
                new Date(),


            // =================================================
            // SUMMARY
            // =================================================

            summary: {

                totalSale,

                totalReturn,

                netSale,

                yearSales,

                yearBudget,

                achievement

            },


            // =================================================
            // BEST SALES REPRESENTATIVE
            // =================================================

            bestSalesRep:

                bestRep

                    ? {

                        name:
                            bestRep.SalesRepName,


                        loginUser:
                            bestRep.LoginUser,


                        amount:
                            safeNumber(
                                bestRep.SalesAmount
                            )

                    }

                    : null,


            // =================================================
            // PRODUCTS
            // =================================================

            products:
                productsResult.recordset.map(
                    item => ({

                        productCode:
                            item.ProductCode,


                        productName:
                            item.ProductName,


                        qty:
                            safeNumber(
                                item.Qty
                            ),


                        amount:
                            safeNumber(
                                item.Amount
                            )

                    })
                ),


            // =================================================
            // CUSTOMERS
            // =================================================

            customers:
                customersResult.recordset.map(
                    item => ({

                        customerCode:
                            item.CustomerCode,


                        customerName:
                            item.CustomerName,


                        qty:
                            safeNumber(
                                item.Qty
                            ),


                        amount:
                            safeNumber(
                                item.Amount
                            )

                    })
                ),


            // =================================================
            // SALES BY DATE
            // =================================================

            salesByDate:
                dailySalesResult.recordset.map(
                    item => ({

                        day:
                            Number(
                                item.SaleDay
                            ),


                        amount:
                            safeNumber(
                                item.Amount
                            )

                    })
                ),


            // =================================================
            // MONTHLY SALES
            // =================================================

            monthlySales: {

                lastMonth:
                    safeNumber(
                        monthlySales.LastMonthSales
                    ),


                currentMonth:
                    currentMonthSales

            },


            // =================================================
            // MONTHLY BUDGET
            // =================================================

            monthlyBudget: {

                annualBudget,


                monthlyBudget,


                currentMonthSales,


                remaining:
                    monthlyRemaining,


                achievement:
                    monthlyAchievement

            },


            // =================================================
            // YEARLY BUDGET
            // =================================================

            yearlyBudget: {

                year:
                    yearlyBudgetRow.BudgetYear ||
                    new Date().getFullYear(),


                budget:
                    safeNumber(
                        yearlyBudgetRow.TotalBudget
                    ),


                achieved:
                    yearSales,


                percentage:
                    achievement

            },


            // =================================================
            // SALES REPRESENTATIVE PERFORMANCE
            // =================================================

            salesRepPerformance:
                repPerformance

        });


    } catch (error) {

        console.error(
            "Dashboard Controller Error:",
            error
        );


        res.status(500).json({

            success: false,


            error:
                "Failed to load dashboard data.",


            details:
                error.message

        });

    }

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    getDashboard

};