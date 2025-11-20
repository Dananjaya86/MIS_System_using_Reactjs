/// <reference types="cypress" />

describe("Customer Details Page Tests", () => {

  beforeEach(() => {
    cy.visit("http://localhost:3000/");

    // Login
    cy.get("input[placeholder='Username']").type("dana143");
    cy.get("input[placeholder='Password']").type("123**");
    cy.get(".btn-login").click();
    cy.url().should("include", "/Dashboard");

    // Intercept customer API calls
    cy.intercept("GET", "/api/customers?login_user=dana143").as("getCustomers");
    cy.intercept("POST", "/api/customers/ledger").as("getCustomerLedger");
    cy.intercept("GET", "/api/customers/nextcode").as("getNextCode");

    cy.visit("http://localhost:3000/CustomerDetails");
    cy.wait("@getCustomers");
  });

  // Helper function: retry until table has rows
  const waitForTableRows = () => {
    cy.get("table.customer-gridcus tbody tr", { timeout: 20000 }).should("have.length.greaterThan", 0);
  };

  it("should load the customer details page", () => {
    waitForTableRows();
  });

  it("should open New customer form and allow typing", () => {
    cy.get(".btncnewcus").click();
    cy.wait("@getNextCode");

    cy.get("input[name='name']", { timeout: 15000 })
  .should("exist")
  .and("not.have.attr", "readonly")
  .type("Test Customer", { force: true });

    cy.get("input[name='address']").should("exist").type("123 Test Street", { force: true });
    cy.get("input[name='phone']").should("exist").type("0712345678", { force: true });
    cy.get("input[name='contactPerson']").should("exist").type("John Doe", { force: true });
  });

  it("should save a new customer", () => {
    cy.get(".btncsavecus", { timeout: 10000 }).should("exist").click({ force: true });

    cy.on("window:alert", (txt) => {
      expect(txt.toLowerCase()).to.include("customer saved");
    });

    cy.wait("@getCustomers");
    waitForTableRows();
  });

  it("should edit an existing customer", () => {
    waitForTableRows();

    cy.get("table.customer-gridcus tbody tr").first().within(() => {
      cy.get(".btncmodifycus", { timeout: 10000 }).should("exist").click({ force: true });
    });

    cy.get("input[name='name']").should("exist").and("not.have.attr", "readonly")
      .clear().type("Updated Customer", { force: true });

    cy.get(".btncmodifycus").click({ force: true });

    cy.on("window:alert", (txt) => {
      expect(txt.toLowerCase()).to.include("updated");
    });

    cy.wait("@getCustomers");
    waitForTableRows();
  });

  it("should delete a customer", () => {
    waitForTableRows();

    cy.get("table.customer-gridcus tbody tr").first().within(() => {
      cy.get(".btncdeletecus", { timeout: 10000 }).should("exist").click({ force: true });
    });

    cy.on("window:confirm", () => true);
    cy.wait("@getCustomers");
    waitForTableRows();
  });

  it("should search customers", () => {
    waitForTableRows();

    cy.get("table.customer-gridcus tbody tr").last().invoke("text").then((text) => {
      cy.get("input[placeholder='Search...']").clear().type(text.trim(), { force: true });

      cy.get("table.customer-gridcus tbody tr", { timeout: 20000 })
        .should("contain.text", text.trim());
    });
  });

  it("should navigate pagination if multiple pages exist", () => {
    waitForTableRows();

    cy.get(".pagination-next", { timeout: 10000 }).then(($btn) => {
      if ($btn.length > 0) {
        cy.wrap($btn).click({ force: true });
        waitForTableRows();
      } else {
        cy.log("Pagination next button not found; skipping test");
      }
    });
  });

});
