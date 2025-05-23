// Initialize app
function init() {
  // DOM elements
  const transactionListEl = document.getElementById("transaction-list");
  const dateEl = document.getElementById("date");
  const balanceEl = document.getElementById("balance");
  const incomeEl = document.getElementById("income");
  const expenseEl = document.getElementById("expense");
  const generateReportBtn = document.getElementById("generate-report-btn");
  const categoryDropdowns = [document.getElementById("category")];
  const addCategoryBtn = document.getElementById("add-category-btn");
  const saveCategoryBtn = document.getElementById("save-category-btn");
  const closeCategoryModalBtn = document.getElementById("close-modal");
  const chartContainer = document.getElementById("chart");

  // Event listeners
  generateReportBtn.addEventListener("click", generateReport);
  addCategoryBtn.addEventListener("click", openCategoryModal);
  saveCategoryBtn.addEventListener("click", addNewCategory);
  closeCategoryModalBtn.addEventListener("click", closeCategoryModal);

  // Set default date to today
  dateEl.valueAsDate = new Date();
  transactionListEl.innerHTML = "";
  transactions
    .slice()
    .reverse()
    .forEach((transaction) => {
      addTransactionDOM(transaction, transactionListEl);
    });
  updateValues(balanceEl, incomeEl, expenseEl);
  updateCategoryDropdowns(categoryDropdowns);
  setupTabs();

  createChart(chartContainer);
}

function getTransactionsFromStorage() {
  let transactions = localStorage.getItem("transaction");
  return transactions ? JSON.parse(transactions) : [];
}

let categories = JSON.parse(localStorage.getItem("categories")) || [
  "Food",
  "Transportation",
  "Housing",
  "Utilities",
  "Entertainment",
  "Income",
  "Other",
];

let transactions = getTransactionsFromStorage();

// Add transaction
function addTransaction(e, descriptionEl, amountEl, categoryEl, dateEl) {
  e.preventDefault();

  const description = descriptionEl.value.trim();
  const amountValue = amountEl.value.trim();
  const category = categoryEl.value;
  const date = dateEl.value;

  // --- Validation Start ---
  if (!description) {
    alert("Please add a description.");
    descriptionEl.focus(); // Optional: focus the field
    return; // Stop the function
  }

  if (!amountValue) {
    alert("Please add an amount.");
    amountEl.focus(); // Optional: focus the field
    return; // Stop the function
  }

  const amount = parseFloat(amountValue);
  if (isNaN(amount)) {
    alert("Please enter a valid number for the amount.");
    amountEl.focus(); // Optional: focus the field
    return; // Stop the function
  }

  if (!date) {
    alert("Please select a date.");
    dateEl.focus(); // Optional: focus the field
    return; // Stop the function
  }
  // --- Validation End ---


  const newTransaction = {
    id: generateID(), // Add an ID to the transaction
    description,
    amount, // Use the parsed float amount
    category,
    date,
  };

  transactions.push(newTransaction);
  updateLocalStorage();

  // --- Reset Fields Start ---
  descriptionEl.value = "";
  amountEl.value = "";
  // Optionally reset category and date, or keep them for faster entry
  // categoryEl.value = categories[0]; // Reset to the first category if needed
  // dateEl.valueAsDate = new Date(); // Reset date to today if needed
  // --- Reset Fields End ---

  // No need to call init() here, it's called after addTransaction in the event listener
}

// Generate unique ID
function generateID() {
  // Simple ID generation, consider a more robust method for larger apps
  return Math.floor(Math.random() * 100000000);
}

// Update local storage
function updateLocalStorage() {
  // Use the global 'transactions' array
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Remove transaction
function removeTransaction(id) {
  transactions = transactions.filter((transaction) => transaction.id !== id);
  updateLocalStorage();
  init();
}

// Update values
function updateValues(balanceEl, incomeEl, expenseEl) {
  const amounts = transactions.map((transaction) => transaction.amount);

  const total = amounts.reduce((acc, amount) => {
    // Corrected the reduce logic for total balance
    return acc + amount;
  }, 0);

  const income = amounts
    .filter((amount) => amount > 0)
    .reduce((acc, amount) => acc + amount, 0);

  // Corrected the reduce logic for expense (sum of negative amounts)
  const expense = amounts
    .filter((amount) => amount < 0)
    .reduce((acc, amount) => acc + amount, 0); // Keep it negative

  // Apply .toFixed(2) for consistent formatting
  balanceEl.textContent = `Rs ${total.toFixed(2)}`;
  incomeEl.textContent = `+Rs ${income.toFixed(2)}`;
  // Use Math.abs() here for display, but keep the original expense value negative
  expenseEl.textContent = `-Rs ${Math.abs(expense).toFixed(2)}`;
}

// Add transactions to DOM
function addTransactionDOM(transaction, transactionListEl) {
  // Determine sign based on amount
  const sign = transaction.amount < 0 ? "-" : "+";
  // Determine class based on amount
  const itemClass = transaction.amount < 0 ? "minus" : "plus";

  const item = document.createElement("li");
  // Assign the correct class (plus or minus)
  item.className = itemClass;

  const detailsDiv = document.createElement("div");
  detailsDiv.className = "details";

  const descSpan = document.createElement("span");
  descSpan.className = "description";
  descSpan.textContent = transaction.description;

  const catSpan = document.createElement("span");
  catSpan.className = "category";
  catSpan.textContent = transaction.category; // Keep category display

  const dateSpan = document.createElement("span");
  dateSpan.className = "date";
  dateSpan.textContent = transaction.date; // Keep date display

  detailsDiv.appendChild(descSpan);
  detailsDiv.appendChild(catSpan);
  detailsDiv.appendChild(dateSpan);

  const amountSpan = document.createElement("span");
  // Use the determined class for amount styling as well
  amountSpan.className = `amount ${itemClass}`;
  // Use the correct sign and absolute value
  amountSpan.textContent = `${sign}Rs ${Math.abs(transaction.amount).toFixed(
    2
  )}`;

  let deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "×";
  // Add onclick handler to call removeTransaction with the correct id
  deleteBtn.onclick = () => removeTransaction(transaction.id);


  item.appendChild(detailsDiv);
  item.appendChild(amountSpan);
  item.appendChild(deleteBtn);

  // Use appendChild instead of insertAdjacentHTML to attach the fully constructed item
  // with its event listener
  transactionListEl.appendChild(item);

  // The following lines are no longer needed as the button and its listener
  // are added directly above.
  // transactionListEl.insertAdjacentHTML("beforeend", item.outerHTML);
  // deleteBtn = transactionListEl.lastElementChild.querySelector(".delete-btn");
}

function createChart(chartContainer) {
  chartContainer.innerHTML = "";

  if ((transactions.length = 0)) {
    chartContainer.textContent = "No data to display";
    return;
  }

  // Create category summary focusing on expenses
  const categorySummary = {};

  // Initialize categories for expenses
  transactions.forEach((transaction) => {
    if (transaction.amount < 0 && !categorySummary[transaction.category]) {
      categorySummary[transaction.category] = 0;
    }
  });

  // Sum expenses by category (only negative amounts)
  transactions.forEach((transaction) => {
    if (transaction.amount < 0) {
      categorySummary[transaction.category] += Math.abs(transaction.amount);
    }
  });

  // Remove categories with no expenses
  Object.keys(categorySummary).forEach((key) => {
    if (categorySummary[key] === 0) {
      delete categorySummary[key];
    }
  });

  if (Object.keys(categorySummary).length === 0) {
    chartContainer.textContent = "No expense data to display";
    return;
  }

  // Find maximum amount for scaling
  const maxAmount = Math.max(Object.values(categorySummary));

  // Sort categories by amount (highest to lowest)
  const sortedCategories = Object.keys(categorySummary).sort(
    (a, b) => categorySummary[b] - categorySummary[a]
  );

  // Create y-axis labels (amount)
  const yAxis = document.createElement("div");
  yAxis.className = "y-axis";

  // Create 5 tick marks
  const numTicks = 5;
  for (let i = numTicks; i >= 0; i--) {
    const tick = document.createElement("div");
    tick.className = "tick";
    const value = (maxAmount * i) / numTicks;
    tick.textContent = `Rs ${value.toFixed(0)}`;
    yAxis.appendChild(tick);
  }

  // Don't change the following line
  chartContainer.insertAdjacentHTML("beforeend", yAxis.outerHTML);

  // Create grid lines
  const gridLines = document.createElement("div");
  gridLines.className = "grid-lines";

  for (let i = numTicks; i >= 0; i--) {
    const line = document.createElement("div");
    line.className = "grid-line";
    gridLines.appendChild(line);
  }

  // Don't change the following line
  chartContainer.insertAdjacentHTML("beforeend", gridLines.outerHTML);

  // Create bars for each category
  sortedCategories.forEach((category, index) => {
    const amount = categorySummary[category];
    // Calculate height percentage based on the maximum amount
    const percentage = (amount / maxAmount) * 100;

    const barGroup = document.createElement("div");
    barGroup.className = "bar-group";

    const bar = document.createElement("div");
    bar.className = "bar";
    // Set the height explicitly using percentage
    bar.style.height = `${percentage}%`;
    bar.style.animationDelay = `${index * 0.1}s`;

    // Create tooltip with amount
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.textContent = `Rs ${amount.toFixed(2)}`;
    bar.appendChild(tooltip);

    const label = document.createElement("div");
    label.className = "bar-label";
    label.textContent = category;

    // Don't change the following line
    chartContainer.insertAdjacentHTML("beforeend", barGroup.outerHTML);

    init();
  });
}

// Generate report
function generateReport() {
  let reportText = "Budget Report\n\n";

  // Summary
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  reportText += `Total Income: Rs ${totalIncome.toFixed(2)}\n`;
  reportText += `Total Expense: Rs ${Math.abs(totalExpense).toFixed(2)}\n`;
  reportText += `Balance: Rs ${balance.toFixed(2)}\n\n`;

  // Category breakdown
  reportText += "Expense Breakdown by Category:\n";

  const categorySummary = {};

  transactions.forEach((t) => {
    if (t.amount < 0) {
      categorySummary[t.category] += Math.abs(t.amount);
    }
  });

  for (const category in categorySummary) {
    reportText += `${category}: Rs ${categorySummary[category].toFixed(2)}\n`;
  }

  alert(reportText);
}

function setupTabs() {
  // Setup tabs
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");

      // Remove active class from all buttons and contents
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      // Add active class to current button and content
      btn.classList.add("active");
      document.getElementById(`${tabId}-tab`).classList.add("active");
    });
  });
}

// Open category modal
function openCategoryModal() {
  document.getElementById("category-modal").classList.add("active");
  renderCategoryList();
}

// Close category modal
function closeCategoryModal() {
  document.getElementById("category-modal").classList.remove("active");
}

// Render category list in modal
function renderCategoryList() {
  const categoryList = document.getElementById("category-list");
  categoryList.innerHTML = "";

  categories.forEach((category) => {
    const categoryItem = document.createElement("div");
    categoryItem.classList.add("category-item");
    categoryItem.innerHTML = `
      <span>${category}</span>
      <button class="delete-category" data-category="${category}">&times;</button>
    `;
    categoryList.appendChild(categoryItem);
  });

  // Add event listeners to delete buttons
  document.querySelectorAll(".delete-category").forEach((button) => {
    button.addEventListener("click", function () {
      deleteCategory(this.getAttribute("data-category"));
      saveCategoriesAndUpdate();
      init();
    });
  });
}

// Add new category
function addNewCategory() {
  const newCategoryInput = document.getElementById("new-category");
  const categoryName = newCategoryInput.value.trim();

  if (!categoryName) {
    alert("Please enter a category name");
    return;
  }

  // Check if category already exists
  if (categories.includes(categoryName)) {
    alert("This category already exists");
    return;
  }

  // Add new category
  categories.push(categoryName);
  saveCategoriesAndUpdate();

  // Clear input
  newCategoryInput.value = "";
}

// Remove a category and reassign its transactions to “Other”
function deleteCategory(categoryToDelete) {
  // 1. Remove from category list
  categories = categories.filter(c => c !== categoryToDelete);
  // 2. Reassign any transactions still bearing that category
  transactions.forEach(tx => {
    if (tx.category === categoryToDelete) {
      tx.category = "Other";
    }
  });
  // 3. Persist changes
  localStorage.setItem("categories", JSON.stringify(categories));
  updateLocalStorage();                // update transactions storage
  updateCategoryDropdowns([document.getElementById("category")]);
  init();                              // re-render
}

// Save categories to localStorage and update UI
function saveCategoriesAndUpdate() {
  localStorage.setItem("categories", JSON.stringify(categories));
  const categoryDropdowns = [document.getElementById("category")];
  updateCategoryDropdowns(categoryDropdowns);
  renderCategoryList();
}

// Rebuild all <select> dropdowns from raw category names
function updateCategoryDropdowns(dropdowns) {
  dropdowns.forEach(dd => {
    dd.innerHTML = "";
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;       // no toLowerCase, no extra formatting
      option.textContent = cat;
      dd.appendChild(option);
    });
  });
}

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  // ... existing code ...
  const formEl = document.getElementById("transaction-form");
  const descriptionEl = document.getElementById("description");
  const amountEl = document.getElementById("amount");
  const categoryEl = document.getElementById("category");
  const dateEl = document.getElementById("date");

  formEl.addEventListener("submit", (e) => {
    addTransaction(e, descriptionEl, amountEl, categoryEl, dateEl);
    // init() is called here after addTransaction finishes (including validation and reset)
    init();
  });
  init(); // Initial load
  // ... existing help panel code ...
});

export {
  addTransaction,
  transactions,
  categories,
  getTransactionsFromStorage,
  updateLocalStorage,
  updateCategoryDropdowns,
  removeTransaction,
  createChart,
  generateReport,
  openCategoryModal,
  closeCategoryModal,
  addNewCategory,
  deleteCategory,
  saveCategoriesAndUpdate,
  renderCategoryList,
  setupTabs,
  updateValues,
  addTransactionDOM,
};
