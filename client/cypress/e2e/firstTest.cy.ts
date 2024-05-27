/// <reference types="cypress" />

const CYPRESS_TEST_URL = (Cypress.env("TESTING_WEB_URL") as string) || "http://localhost:5000";

describe("first-test", () => {
  beforeEach("setup", () => {
    // cy.visit("https://example.cypress.io");
    // cy.visit("http://localhost:5000");
    cy.visit(CYPRESS_TEST_URL);
  });

  it("checks user login", () => {
    cy.get('[data-cy-testid="login-header"]').should(
      "contain",
      "Welcome to the Virginia Tech Digital Assessment Application!"
    );
    cy.contains("Welcome to the Virginia Tech Digital Assessment Application!").should("exist");
    cy.contains("Welcome to the Virginia Tech Digital Assessment Application!").should("be.visible");
    cy.contains("Welcome to the Virginia Tech Digital Assessment Application!").should("not.be.disabled");
    cy.get('[data-cy-testid="login-header"] b').should("have.length", 1);
  });
});
