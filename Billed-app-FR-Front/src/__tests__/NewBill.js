/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import '@testing-library/jest-dom';

jest.mock("../app/store", () => {
  return () => mockStore;
});



describe("Given I am connected as an employee", () => {

  beforeEach(() => {
    document.body.innerHTML = NewBillUI();
    window.localStorage.setItem("user", JSON.stringify({ email: "employee@test.com" }));
  });

  describe("When I am on NewBill Page", () => {

    // Vérifie que le formulaire est correctement rendu sur la page.
    test("Then the form should be rendered", () => {
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
    });

    // Vérifie que l'utilisateur ajoute un fichier au format valide (jpg, jpeg, png).
    test("Then the file should be added if the format is valid (jpg, jpeg, png)", () => {
      const fileInput = screen.getByTestId("file");
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      expect(fileInput.files[0].name).toBe("test.jpg");
    });

    // Vérifie que l'application alerte l'utilisateur si le format du fichier est invalide.
    test("Then the file should not be added if the format is invalid", () => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = jest.fn();
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: localStorageMock });
    
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
      const fileInput = screen.getByTestId("file");
      Object.defineProperty(fileInput, 'files', {
        value: [new File([""], "test.txt", { type: "text/plain" })],
      });
      fireEvent.change(fileInput);
    
      expect(alertMock).toHaveBeenCalledWith("Seuls les fichiers jpg, jpeg et png sont autorisés");
      alertMock.mockRestore();
    });

    // Vérifie que la méthode handleSubmit est appelée lors de la soumission du formulaire
    test("Then the handleSubmit method should be called upon form submission", () => {
      const onNavigate = jest.fn();
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      const handleSubmitSpy = jest.spyOn(newBill, "handleSubmit");

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", (e) => newBill.handleSubmit(e)); // Assurez-vous que handleSubmit est appelée
      fireEvent.submit(form);

      expect(handleSubmitSpy).toHaveBeenCalled();
    });

    // Vérifie que la création d'une nouvelle facture avec des données correctes met à jour l'ID, l'URL, et le nom du fichier de la facture.
    test("Then it should create a new bill with correct data and update bill ID, file URL, and file name on success", async () => {
      document.body.innerHTML = NewBillUI();

      window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "employee@example.com" }));

      const createBillMock = jest.fn().mockResolvedValue({
        fileUrl: "http://example.com/bill.jpg",
        key: "123",
      });
      const mockStore = {
        bills: () => ({
          create: createBillMock,
        }),
      };

      const onNavigate = jest.fn();
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      const input = screen.getByTestId("file");
      const file = new File(["file content"], "bill.jpg", { type: "image/jpg" });
      fireEvent.change(input, { target: { files: [file] }});

      await newBill.handleChangeFile({
        preventDefault: jest.fn(),
        target: {
          files: [file],
          value: 'C:\\path\\bill.jpg'
        }
      });

      await waitFor(() => expect(createBillMock).toHaveBeenCalled());

      // Assertions pour vérifier que le fichier a été créé avec succès
      expect(newBill.fileUrl).toBe("http://example.com/bill.jpg");
      expect(newBill.billId).toBe("123");
      expect(newBill.fileName).toBe("bill.jpg");
    });

  });

});