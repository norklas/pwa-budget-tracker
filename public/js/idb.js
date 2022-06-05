// Create variable to hold db connection
let db;
// Establish a connection to IndexedDB database
const request = indexedDB.open("budget_tracker", 1);

// This event will emit if the database version changes
request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("new_transaction", { autoIncrement: true });
};

// Upon a successful
request.onsuccess = function (event) {
  // When db is successfully created with its object store
  db = event.target.result;
  // Check if app is online
  if (navigator.onLine) {
    uploadTransaction();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// Will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
  // Open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // Access the object store
  const budgetObjectStore = transaction.objectStore("new_transaction");

  // Add record to your store with add method
  budgetObjectStore.add(record);
}

// Function that will handle collecting all of the data
function uploadTransaction() {
  // Open a transaction on your db
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // Access your object store
  const budgetObjectStore = transaction.objectStore("new_transaction");

  // Get all transactions from store and set to a variable
  const getAll = budgetObjectStore.getAll();

  // Upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
    // If there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // Open one more transaction
          const transaction = db.transaction(["new_transaction"], "readwrite");
          // Access the object store
          const budgetObjectStore =
            transaction.objectStore("new_transaction");
          // Clear all items in your store
          budgetObjectStore.clear();

          alert("All saved transactions has been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// Listen for app coming back online
window.addEventListener("online", uploadTransaction);
