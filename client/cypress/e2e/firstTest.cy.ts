/// <reference types="cypress" />

describe("first-test", () => {
  beforeEach("setup", () => {
    // cy.visit("https://example.cypress.io");
    // cy.visit("https://www.google.com");
  });

  it("passes", () => {
    cy.visit("http://localhost:5000/");
  });
});
