// cypress/e2e/Login.cy.js

describe("Login Page Tests", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/"); // Login page URL
  });

  it("should load the login page", () => {
    cy.get("input[placeholder='Username']").should("exist");
    cy.get("input[placeholder='Password']").should("exist");
    cy.get(".btn-login").should("exist");
    cy.get(".btn-cancel").should("exist");
  });

  it("should allow typing username and password", () => {
    cy.get("input[placeholder='Username']").type("dana143");
    cy.get("input[placeholder='Password']").type("123**");
  });

  it("should login successfully with valid credentials", () => {
    // Intercept the login POST request
    cy.intercept("POST", "http://localhost:5000/api/login").as("loginRequest");

    cy.get("input[placeholder='Username']").type("dana143");
    cy.get("input[placeholder='Password']").type("123**");

    cy.get(".btn-login").click();

    // Wait for login request to complete and check response
    cy.wait("@loginRequest").its("response.statusCode").should("eq", 200);

    // Check that the login alert is displayed
    cy.get(".alert-title").should("contain.text", "Login Successful!");
    cy.get(".alert-message").should("contain.text", "Welcome back, dana143");

    // Wait for redirect to Dashboard
    cy.url().should("include", "/Dashboard");
  });

  it("should show error for invalid login", () => {
    cy.intercept("POST", "http://localhost:5000/api/login").as("loginRequest");

    cy.get("input[placeholder='Username']").type("wronguser");
    cy.get("input[placeholder='Password']").type("wrongpass");

    cy.get(".btn-login").click();

    cy.wait("@loginRequest");

    // Check for warning alert
    cy.get(".alert-title").should("contain.text", "Login Failed!");
  });

  it("should clear inputs when Cancel clicked", () => {
    cy.get("input[placeholder='Username']").type("testuser");
    cy.get("input[placeholder='Password']").type("12345");

    cy.get(".btn-cancel").click();

    cy.get("input[placeholder='Username']").should("have.value", "");
    cy.get("input[placeholder='Password']").should("have.value", "");
  });
});
