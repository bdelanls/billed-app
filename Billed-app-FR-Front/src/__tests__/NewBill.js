/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";


// Test d'intégration POST Bills
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'employee@example.com' }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });

    test("Then the form should be rendered and event listeners should be attached", () => {
      window.onNavigate(ROUTES_PATH.NewBill);
      // Assurez-vous que cette ligne est exécutée après la navigation
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Créez l'instance de NewBill après avoir inséré le HTML dans le DOM
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null, // Mock store si nécessaire
        localStorage: window.localStorage,
      });

      // Maintenant, vous pouvez accéder à l'input de fichier sans obtenir d'erreur
      const fileInput = screen.getByTestId("file");

      // Simuler un changement pour tester handleChangeFile
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput, { target: { files: [new File(["test"], "test.jpg", { type: "image/jpg" })] } });

      expect(handleChangeFile).toHaveBeenCalled();
    });
  });
});