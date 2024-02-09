// ...

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    // ...

    test("Then the form should be rendered and event listeners should be attached", () => {
      // ...
    });

    // ...

    describe("When I submit the form", () => {
      test("Then the handleSubmit method should be called", () => {
        // ...
      });
    });

    describe("When I submit the form with valid data", () => {
      test("Then the bill should be created", async () => {
        // ...
      });
    });
  });
});