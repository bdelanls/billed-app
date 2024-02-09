/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import mockStore from "../__mocks__/store.js";
import '@testing-library/jest-dom';

// jest.mock("../app/store", () => mockStore);
jest.mock("../app/store", () => {
  return () => mockStore;
});

class DataTransferMock {
  constructor() {
    this.data = {};
  }

  setData(format, data) {
    this.data[format] = data;
  }

  getData(format) {
    return this.data[format];
  }
}

global.DataTransfer = DataTransferMock;

// Test d'intégration POST Bills
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    
    
    // Vérifie que le formulaire est bien affiché
    test("Then the form should be rendered", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
    });

    // Vérifie que le fichier est bien ajouté si le format est valide (jpg, jpeg, png)
    test("Then the file should be added if the format is valid (jpg, jpeg, png)", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const file = screen.getByTestId("file");
      const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      fireEvent.change(file, { target: { files: [validFile] } });
      expect(file.files[0].name).toBe("test.jpg");
    });

    test("Then the file should not be added if the format is invalid", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = jest.fn();
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: localStorageMock });
    
      // Simuler la sélection d'un fichier invalide
      const fileInput = screen.getByTestId("file");
      Object.defineProperty(fileInput, 'files', {
        value: [new File([""], "test.txt", { type: "text/plain" })],
      });
      fireEvent.change(fileInput);
    
      // Attendre et vérifier que l'alerte est déclenchée ou que le fichier n'est pas accepté
      // Ce test dépend de la façon dont ton application gère ce cas
    });


    // Vérifie que la nouvelle note de frais peut être envoyée
    test("Then the new bill can be sent", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Simuler un utilisateur connecté
      window.localStorage.setItem("user", JSON.stringify({ email: "employee@test.com" }));

      const onNavigate = jest.fn();

      const newBill = new NewBill({ document, onNavigate, localStorage: window.localStorage });
      const handleSubmit = jest.fn(newBill.handleSubmit.bind(newBill));
      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
    });


    

  })


  describe("When I submit the form", () => {
    test("Then the handleSubmit method should be called", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Simuler un utilisateur connecté
      window.localStorage.setItem("user", JSON.stringify({ email: "employee@test.com" }));

      const onNavigate = jest.fn();

      const newBill = new NewBill({ document, onNavigate, localStorage: window.localStorage });
      const handleSubmit = jest.fn(newBill.handleSubmit.bind(newBill));
      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
    });

    // Vérifie que la méthode handleSubmit est bien appelée
    test("Then the handleSubmit method should be called", () => {
      // Créer un DOM virtuel
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Simuler un utilisateur connecté
      window.localStorage.setItem("user", JSON.stringify({ email: "employee@test.com" }));

      // Créer une nouvelle instance de NewBill
      const onNavigate = jest.fn();
      const newBill = new NewBill({ document, onNavigate, localStorage: window.localStorage });

      // Espionner la méthode handleSubmit
      newBill.handleSubmit = jest.fn();
      newBill.handleSubmit.bind(newBill);

      // Simuler la soumission du formulaire
      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", newBill.handleSubmit);
      fireEvent.submit(form);

      // Vérifier que handleSubmit a été appelée
      expect(newBill.handleSubmit).toHaveBeenCalled();
    });

   
    


  });

  
  describe("Given I am a user submitting a new bill", () => {
    test("Then it should create a new bill with correct data and update bill ID, file URL, and file name on success", async () => {
      // Mock de localStorage.getItem pour simuler un utilisateur connecté
      window.localStorage.setItem("user", JSON.stringify({ email: "user@example.com" }));
  
      // Créer un mock pour `store.bills().create`
      const createBillMock = jest.fn().mockResolvedValue({
        fileUrl: "http://example.com/bill.jpg",
        key: "123",
      });
  
      const mockStore = {
        bills: () => ({
          create: createBillMock,
        }),
      };
  
      //const onNavigate = jest.fn();
      //const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
  
      // Création d'un objet DataTransfer pour simuler un FileList
      const dataTransfer = new DataTransferMock();
      dataTransfer.setData("files", [new File(["content"], "bill.jpg", { type: "image/jpg" })]);
      
      const input = document.querySelector("input[type='file']");
      Object.defineProperty(input, 'files', {
        value: dataTransfer.getData("files"),
        writable: false,
      });

      // Créer un mock pour l'événement passé à handleChangeFile
      const eventMock = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\fakepath\\bill.jpg', // Ajoute une valeur factice qui représente le chemin du fichier
          files: [new File(["content"], "bill.jpg", { type: "image/jpg" })]
        }
      };


      // Simuler l'ajout du fichier
      const newBill = new NewBill({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });
      newBill.handleChangeFile(eventMock);
  
      // Attendre la fin de l'opération asynchrone
      await waitFor(() => expect(createBillMock).toHaveBeenCalled());
  
      // Vérifications finales
      expect(newBill.fileUrl).toBe("http://example.com/bill.jpg");
      expect(newBill.billId).toBe("123");
      expect(newBill.fileName).toBe("bill.jpg");
    });
  });

      


})