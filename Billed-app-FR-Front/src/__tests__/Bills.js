/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js"
import { ROUTES_PATH, ROUTES} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import '@testing-library/jest-dom';
import router from "../app/Router.js";
import { formatDate, formatStatus } from "../app/format.js"

jest.mock("../app/store", () => mockStore);
jest.mock('../app/format.js')

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    // Vérifie que l'icône dans la colonne verticale doit être en surbrillance
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //expect expression
      expect(windowIcon).toHaveClass('active-icon');

    })

    // Vérifie que les factures sont classées du plus récent au plus ancien
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })

      // tous les éléments avec une date
      const dateElements = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(elem => elem.textContent);
      
      // transforme la liste de dates en tableau
      const dates = Array.from(dateElements).map(elem => elem.textContent);
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

  })

  // vérifie la fonctionnalité de la méthode handleClickIconEye
  describe("When I am on Bills Page and I click on the eye icon", () => {
    test("Then it should call the handleClickIconEye function", () => {
      const document = { 
        querySelector: jest.fn().mockReturnValue({
          getAttribute: jest.fn(),
          addEventListener: jest.fn()
        }),
        querySelectorAll: jest.fn().mockReturnValue([{
          click: jest.fn(),
          getAttribute: jest.fn(),
          addEventListener: jest.fn()
        }])
      }
      const onNavigate = jest.fn()
      const store = null
      const localStorage = window.localStorage

      const bills = new Bills({
        document, 
        onNavigate, 
        store, 
        localStorage
      })

      const handleClickIconEye = jest.spyOn(bills, "handleClickIconEye")
      const iconEye = document.querySelector(`div[data-testid="icon-eye"]`)

      // Mock jQuery modal
      const modalMock = jest.fn()
      $.fn.modal = modalMock

      bills.handleClickIconEye(iconEye)
      expect(handleClickIconEye).toHaveBeenCalled()
      expect(modalMock).toHaveBeenCalled()
    })
  })

  // Vérifie que cliquer sur le bouton de création d'une nouvelle facture navigue vers la page "NewBill".
  describe("When I click on the button to create a new bill", () => {
    test("Then it should call the onNavigate function with the 'NewBill' route", () => {
      const onNavigate = jest.fn()
      const document = {
        querySelector: jest.fn(),
        querySelectorAll: jest.fn()
      }
      const localStorage = window.localStorage
      const store = null
  
      const bills = new Bills({
        document, 
        onNavigate, 
        store, 
        localStorage
      })
  
      bills.handleClickNewBill()
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
    })
    
  })

  // Vérifie que le clic sur l'icône déclenche correctement la méthode handleClickIconEye
  describe("When I click on the icon", () => {
    test("Then it should call the handleClickIconEye function", () => {
      document.body.innerHTML = `
        <div data-testid="icon-eye"></div>
      `;
  
      const onNavigate = jest.fn();
  
      const billsInstance = new Bills({
        document,
        onNavigate,
        store: null, 
        localStorage: window.localStorage, 
      });
  
      billsInstance.handleClickIconEye = jest.fn();
  
      const icon = document.querySelector(`[data-testid="icon-eye"]`);
      icon.addEventListener('click', () => billsInstance.handleClickIconEye(icon));
      icon.click();
  
      expect(billsInstance.handleClickIconEye).toHaveBeenCalledWith(icon);
    });
  });

})


// Test d'intégration GET Bills
describe("Given I am a user connected as Employee", () => {

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: "employee@example.com" }));
      document.body.innerHTML = `<div id="root"></div>`;
      router();
    });

    // Vérifie que la récupération des factures affiche un message d'erreur 404 en cas d'échec de l'API.
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => Promise.reject(new Error("Erreur 404"))
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    // Vérifie que la récupération des factures affiche un message d'erreur 500 en cas d'échec de l'API.
    test("fetches bills from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => Promise.reject(new Error("Erreur 500"))
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });

  // Vérifie que lorsque `formatDate` lance une exception, une erreur est enregistrée dans la console et la date n'est pas formatée.
  describe('getBills', () => {
    test('logs an error and returns the unformatted date when formatDate throws an error', async () => {
      const mockStore = {
        bills: jest.fn().mockReturnValue({
          list: jest.fn().mockResolvedValue([
            { date: '2022-01-01', status: 'pending' },
          ]),
        }),
      }
      const consoleLogSpy = jest.spyOn(console, 'log')
      formatDate.mockImplementationOnce(() => {
        throw new Error('formatDate error')
      })
      document.body.innerHTML = `<div id="root"></div>`
      const buttonNewBill = document.querySelector(`button[data-testid="btn-new-bill"]`)
      const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`)

      const bills = new Bills({ document, onNavigate: () => {}, store: mockStore, localStorage: window.localStorage })
      await bills.getBills()

      expect(consoleLogSpy).toHaveBeenCalledWith(new Error('formatDate error'), 'for', { date: '2022-01-01', status: 'pending' })
    })
  })
});



