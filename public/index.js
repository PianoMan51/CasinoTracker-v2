import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import {
  get,
  getDatabase,
  push,
  ref,
  remove,
  set,
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDu9UYjpqGogqGLNr3OfEBUkR1_JzxDgWs",
  authDomain: "casinotracker-f0c56.firebaseapp.com",
  databaseURL: "https://casinotracker-f0c56-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "casinotracker-f0c56",
  storageBucket: "casinotracker-f0c56.appspot.com",
  messagingSenderId: "370070512708",
  appId: "1:370070512708:web:a99cd1372708492b5cc811",
  measurementId: "G-35ZW2CF4YJ",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let bet_input = document.getElementById("bet_input");
let win_input = document.getElementById("win_input");
let entriesList = document.getElementById("entriesList");
let inputsContainer = document.getElementById("inputsContainer");
let currentMonthSpan = document.querySelectorAll(".currentMonthSpan");
let currentMonth = parseInt(localStorage.getItem("currentMonth")) || 0;
let currentPageContent = localStorage.getItem("currentPageContent") || "dashboard";
let removeBtn = document.querySelector("#removeEntry");
let editBtn = document.querySelector("#editEntry");
let openInputs = document.querySelector("#openInput");
let washButton = document.getElementById("wash");
let view_toggle = document.getElementById("view_toggle");
let outcomeX_toggle = document.getElementById("outcome_x_toggle");
let actualDate = new Date();
let year = 2024;
let currentFilterElement = null;
let isAscending = true;
let totalView = false;
let outcome_x = false;
let toggle_washSessions = false;
let activeRemove = false;
let activeEdit = false;
let activeAdd = false;

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const mons = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const m = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

async function getMisc(type) {
  const dataRef = ref(db, type);

  try {
    const snapshot = await get(dataRef);

    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

view_toggle.addEventListener("click", function () {
  totalView = !totalView;
  view_toggle.classList.toggle("active");

  document.querySelectorAll("#quick_info .buttons button").forEach((button) => {
    button.disabled = totalView ? true : false;
  });

  updateList();
});

document.querySelectorAll(".listHeaders span").forEach((sort) => {
  sort.addEventListener("click", () => {
    sortEntries(entriesList, sort.innerHTML);
    isAscending = !isAscending;
  });
});

document.querySelectorAll(".prevMonth").forEach((button) => {
  button.onclick = () => {
    changeMonth("prev");
  };
});

document.querySelectorAll(".nextMonth").forEach((button) => {
  button.onclick = () => {
    changeMonth("next");
  };
});

document.querySelector(".pageContent." + currentPageContent).style.display = "flex";

document.querySelectorAll(".sidebar_buttons.nav_buttons .nav").forEach((button) => {
  if (button.getAttribute("name") == localStorage.getItem("currentPageContent")) {
    button.classList.add("active");
  }
  resetInputs();
});

document.querySelector(".sidebar_buttons.toolbar_buttons").style.display = localStorage.getItem("currentPageContent") == "table" ? "flex" : "none";

document.querySelectorAll(".nav_buttons .nav").forEach((button) => {
  button.addEventListener("click", function () {
    nav(button.getAttribute("name"));
  });
});

document.querySelector(".card.currentMonthProfit").onclick = () => {
  nav("table");
  currentMonth = actualDate.getMonth();
  localStorage.setItem("currentMonth", currentMonth);
  updateList();
};

document.querySelector(".card.totalProfit").onclick = () => {
  nav("table");
  totalView = true;
  view_toggle.classList.add("active");
  updateList();
};

outcomeX_toggle.onclick = () => {
  outcome_x = !outcome_x;
  outcomeX_toggle.classList.toggle("active");

  let index = toggle_washSessions ? 3 : 5 

  Array.from(entriesList.children).forEach((entry) => {
    entry.children[index].innerHTML = outcome_x ? Number(entry.getAttribute("data-outcome_x")).toFixed(2) + "x" : entry.getAttribute("data-outcome_amount");
  });
};

function nav(page) {
  document.querySelectorAll(".pageContent").forEach((page) => {
    page.style.display = "none";
  });

  document.querySelectorAll(".nav_buttons .nav").forEach((nav) => {
    if (nav.getAttribute("name") == page) {
      document.querySelectorAll(".nav_buttons .nav").forEach((button) => {
        button.classList.remove("active");
      });
      nav.classList.add("active");
    }
  });

  document.querySelector(".sidebar_buttons.toolbar_buttons").style.display = page == "table" ? "flex" : "none";

  document.querySelector(".pageContent." + page).style.display = "flex";
  localStorage.setItem("currentPageContent", page);
  resetInputs();
}

openInputs.onclick = () => {
  activeAdd = !activeAdd;
  if (activeAdd) {
    document.getElementById("table_list_totals").style.display = "none";
    inputsContainer.style.display = "flex";
    document.querySelector("#entry_date .date_input.day").value = actualDate.getDate();
    document.querySelector("#entry_date .date_input.month").value = actualDate.getMonth() + 1;

  } else {
    document.getElementById("table_list_totals").style.display = "flex";
    inputsContainer.style.display = "none";
  }
};

removeBtn.onclick = () => {
  activeRemove = !activeRemove;
  document.querySelectorAll(".entryContainer").forEach((element) => {
    element.classList.toggle("deletable");
  });
};

editBtn.onclick = () => {
  activeEdit = !activeEdit;
  activeRemove = false;
  document.querySelectorAll(".entryContainer").forEach((element) => {
    element.classList.toggle("editable");
  });
};

washButton.onclick = ()=>{
  toggle_washSessions = !toggle_washSessions;
  toggle_washSessions ? updateWashSession() : updateList();
}

document.querySelectorAll(".nav.actionButtons").forEach((button) => {
  button.addEventListener("click", function () {
    if (button.classList.contains("active")) {
      button.classList.remove("active");
    } else {
      document.querySelectorAll(".nav.actionButtons.active").forEach((activeButton) => {
        activeButton.classList.remove("active");
      });
      button.classList.add("active");
    }
  });
});

function changeMonth(direction) {
  if (direction == "prev") {
    currentMonth = (currentMonth - 1 + 12) % 12;
  } else if (direction == "next") {
    currentMonth = (currentMonth + 1) % 12;
  }
  localStorage.setItem("currentMonth", currentMonth);
  updateList();
}

document.getElementById("inputsContainerButton").onclick = () => {
  if (bet_input.value) {
    addEntry();
  } else {
    resetInputs();
  }
};

function addEntry() {
  let day_input = document.querySelector(".date_input.day").value; 
  let month_input = document.querySelector(".date_input.month").value;

  let day = day_input < 10 ? "0" + day_input : day_input;
  let month = month_input < 10 ? "0" + month_input : month_input;

  console.log(day, month);

  // Construct the entry data object
  let entry = {
    date: day + "/" + month,
    casino: document.querySelector(".select_casino").value,
    campaign: document.querySelector(".select_campaign").value,
    bet: bet_input.value,
    win: win_input.value,
    cashed_out: false,
  };

  // Create a reference for the new entry using push() to generate a unique key
  const entriesRef = ref(db, `Entries/${year}/${months[document.querySelector(".date_input.month").value - 1]}`);
  const newEntryRef = push(entriesRef);

  // Write the entry data to the new entry
  set(newEntryRef, entry)
    .then(() => {
      // If the data was written successfully, update the UI and perform other actions
      updateList();
      updateDashboard();

      // Toggle UI elements and reset inputs
      inputsContainer.classList.toggle("hidden");
      activeAdd = false;
      openInputs.classList.toggle("active");
      updateMonthCharts();
      resetInputs();
    })
    .catch((error) => {
      console.error("Error writing new entry: ", error);
    });
}

function resetInputs() {
  bet_input.value = "";
  win_input.value = "";

  document.getElementById("inputsContainer").classList.add("hidden");
  document.getElementById("openInput").classList.remove("active");

  document.getElementById("table_list_totals").style.display = "flex";
  inputsContainer.style.display = "none";
  activeAdd = false;
}

async function fetchMonthEntries(year, month) {
  const entriesRef = ref(db, `Entries/${year}/${month}`);
  const snapshot = await get(entriesRef);

  if (snapshot.exists()) {
    // Get the data and return an array of entries with their keys
    const data = snapshot.val();
    return Object.entries(data).map(([key, value]) => ({ key, ...value }));
  } else {
    return [];
  }
}

async function fetchYearEntries(year) {
  let allEntries = [];
  for (let i = 0; i < 12; i++) {
    const data = await fetchMonthEntries(year, months[i]);
    allEntries.push(...data);
  }
  return allEntries;
}

function createEntryContainer(entry, key) {
  // Calculate profit and determine color based on entry's status
  let bet = parseInt(entry.bet);
  let win = parseInt(entry.win);
  let profit = parseInt(entry.win - entry.bet);

  let color = entry.cashed_out ? (profit >= 0 ? "var(--green)" : "var(--red)") : "var(--yellow)";

  // Create the entry container and set its class
  let entryContainer = document.createElement("div");
  entryContainer.setAttribute("class", "entryContainer");
  entryContainer.setAttribute("data-key", key); // Set the unique key as a data attribute

  let vp = window.innerWidth;

  let formatted_outcome = entry.win ? "$" + (vp > 360 ? profit.toFixed(2) : profit.toFixed(0)) : "$";
  let formatted_outcomeX = entry.win / (entry.bet > 1 ? entry.bet : 1);

  entryContainer.setAttribute("data-outcome_amount", formatted_outcome);
  entryContainer.setAttribute("data-outcome_x", formatted_outcomeX);

  entryContainer.innerHTML = `
    <span>${entry.date}</span>
    <span>${entry.casino}</span>
    <span>${entry.campaign ? entry.campaign : "N/A"}</span>
    <span>$${vp > 360 ? bet.toFixed(2) : bet.toFixed(0)}</span>
    <span>${entry.win ? "$" + (vp > 360 ? win.toFixed(2) : win.toFixed(0)) : "$"}</span>
    <span style="background-color: ${color}; color: white">${ outcome_x ? formatted_outcomeX.toFixed(2) + "x" : formatted_outcome}</span>
    <input class="checkBox ${entry.cashed_out ? "checked" : ""}" type="checkbox" ${entry.win ? "" : "disabled"}>
  `;

  entryContainer.children[3].value = bet;
  entryContainer.children[4].value = win;
  entryContainer.children[5].value = profit;
  entryContainer.children[6].checked = entry.cashed_out;

  // Set up the checkBox click event listener
  let checkBox = entryContainer.querySelector(".checkBox");
  checkBox.onclick = () => {
    if (entry.win) {
      checkCash(checkBox, key);
    }
  };

  // Set cursor style based on whether the entry has a win value
  checkBox.style.cursor = entry.win ? "pointer" : "not-allowed";

  // Add click event listeners for entryContainer
  entryContainer.addEventListener("click", function (event) {
    if (activeRemove && confirm("Are you sure you want to remove this?")) {
      removeEntry(event);
    }
  });

  entryContainer.addEventListener("click", editEntry);

  return entryContainer;
}

async function updateList() {
  currentMonthSpan.forEach((span) => {
    span.innerHTML = totalView ? "Total" : months[localStorage.getItem("currentMonth")];
  });

  try {
    let entries = [];

    // Fetch data based on the view mode
    if (!totalView) {
      // Await the result of fetchMonthEntries before using it
      const data = await fetchMonthEntries(year, months[currentMonth]);
      if (data) {
        entries = data; // Data already includes keys
      }
    } else {
      const data = await fetchYearEntries(year);
      if (data) {
        entries.push(...data);
      }
    }

    entriesList.innerHTML = "";

    entries.forEach((entry) => {
      let entryContainer = createEntryContainer(entry, entry.key); // Pass the key
      entriesList.append(entryContainer);
    });

    updateMonthLists();
  } catch (error) {
    console.error("Error updating list", error);
  }

  // Apply the current filter if applicable
  if (currentFilterElement) {
    filterEntries(currentFilterElement);
  }

  updateMonthCharts();
  if(toggle_washSessions) updateWashSession()
  updateStatistics()
}

function updateStatistics() { 
  let bet_sum = 0;
  let win_sum = 0;

  let filteredChildren = Array.from(entriesList.children).filter((child) => child.classList.contains("filter"));

  let outcomes = currentFilterElement ? filteredChildren : Array.from(entriesList.children);

  outcomes.forEach((entry) => {
    bet_sum += Number(entry.children[toggle_washSessions ? 1 : 3].value);
    win_sum += Number(entry.children[toggle_washSessions ? 2 : 4].value) || 0;
  });

  document.querySelector(".statistics.bet_total .value").innerHTML = "$" + bet_sum;
  document.querySelector(".statistics.win_total .value").innerHTML = "$" + win_sum;
  document.querySelector(".statistics.outcome_x .value").innerHTML = (win_sum / (bet_sum == 0 ? 1 : bet_sum)).toFixed(2) + "x";
  document.querySelector(".statistics.count .value").innerHTML = outcomes.length;
  document.querySelector(".statistics.bet_average .value").innerHTML = "$" + (bet_sum / outcomes.length).toFixed(0);
  document.querySelector(".statistics.win_average .value").innerHTML = "$" + (win_sum / outcomes.length).toFixed(0);
  document.querySelector(".statistics.outcome_average .value").innerHTML = "$" + ((win_sum - bet_sum) / outcomes.length).toFixed(0);
}

function checkCash(checkBox, key) {
  let entryContainer = checkBox.parentNode;
  entryContainer.classList.toggle("pending");
  checkBox.classList.toggle("checked");
  let profit = entryContainer.children[5].value;

  entryContainer.children[5].style.backgroundColor = checkBox.classList.contains("checked")
    ? profit >= 0
      ? "var(--green"
      : "var(--red)"
    : "var(--yellow)";

  let content = {
    date: entryContainer.children[0].innerHTML,
    casino: entryContainer.children[1].innerHTML,
    campaign: entryContainer.children[2].innerHTML,
    bet: entryContainer.children[3].value,
    win: entryContainer.children[4].value,
    cashed_out: checkBox.classList.contains("checked") ? true : false,
  };

  // Reference the specific entry using its unique key
  const entryRef = ref(db, `Entries/${year}/${months[currentMonth]}/${key}`);

  // Overwrite the existing entry with the updated content
  set(entryRef, content)
    .then(() => {
      // If the data was written successfully, update the UI and perform other actions
      updateDashboard();
      updateMonthCharts();
    })
    .catch((error) => {
      console.error("Error updating entry: ", error);
    });
}

async function updateDashboard() {
  const cardAmount = document.querySelectorAll(".info .value");
  const cardSpan = document.querySelectorAll(".info .value_span");

  // Create values for cards and elements
  const totalCurrentMonthProfit = { value: 0 };
  const totalProfits = { value: 0 };
  const totalLosses = { value: 0 };
  const pendings = { value: 0 };
  const entries = { value: 0 };
  const totalBarchartList = [];
  const casinos = await getMisc("Casinos");
  const campaigns = await getMisc("Campaigns");

  const casinoTotalProfits = Object.fromEntries(casinos.map((casino) => [casino, 0]));
  const campaignTotalProfits = Object.fromEntries(campaigns.map((campaign) => [campaign, 0]));

  const casinoEntryCounts = Object.fromEntries(casinos.map((casino) => [casino, 0]));
  const campaignEntryCounts = Object.fromEntries(campaigns.map((campaign) => [campaign, 0]));

  const updateProfits = (data) => {
    let dashcard_totalProfits = 0;
    let barData = 0;

    if (data) {
      data.forEach((entry) => {
        const outcome = entry.win - entry.bet;
        casinoTotalProfits[entry.casino] = (casinoTotalProfits[entry.casino] || 0) + outcome;
        campaignTotalProfits[entry.campaign] = (campaignTotalProfits[entry.campaign] || 0) + outcome;

        casinoEntryCounts[entry.casino] = (casinoEntryCounts[entry.casino] || 0) + 1;
        campaignEntryCounts[entry.campaign] = (campaignEntryCounts[entry.campaign] || 0) + 1;

        let [entry_day, entry_month] = entry.date.split("/").map(Number);

        entries.value++;

        if (entry.cashed_out) {
          totalProfits.value += +outcome;
          totalLosses.value += outcome < 0 ? outcome : 0;
          totalCurrentMonthProfit.value += entry_month == actualDate.getMonth() + 1 ? +outcome : 0;

          dashcard_totalProfits += +outcome;
        } else {
          pendings.value += +entry.bet;
        }

        barData = dashcard_totalProfits;
      });
    }

    return barData;
  };

  try {
    const promises = months.map((month) => fetchMonthEntries("2024", month));
    const results = await Promise.all(promises);

    results.forEach((data) => {
      const dataCategory = updateProfits(data);
      totalBarchartList.push(dataCategory.toFixed(0));
    });

    const createTotalElement = (entries, entryCounts, containerId) => {
      const container = document.getElementById(containerId);
      container.innerHTML = "";
      entries.forEach(([name, profit]) => {
        const color = profit > 0 ? "var(--green)" : "var(--red)";
        const count = entryCounts[name] || 0;
        const element = document.createElement("div");
        element.setAttribute(
          "class",
          `${containerId.substring(0, containerId.length - 6)} filter listContainerElement`
        );
        element.innerHTML = `
          <span class="label">${name ? name : "Other"}</span>
          <span class="counts" value="${count}" style="background-color: var(--background)">${count}</span>
          <span class="profits" value="${profit}" style="background-color: ${color}">$${profit.toFixed(0)}</span>
        `;
        container.append(element);

        element.addEventListener("click", function () {
          totalView = "true";
          document.getElementById("view_toggle").classList.add("active");

          currentFilterElement = element;

          nav("table");

          updateList();
        });
      });
    };

    const sortedCasinoEntries = Object.entries(casinoTotalProfits).sort((a, b) => b[1] - a[1]);
    const sortedCampaignEntries = Object.entries(campaignTotalProfits).sort((a, b) => b[1] - a[1]);

    createTotalElement(sortedCasinoEntries, casinoEntryCounts, "casinoTotals");
    createTotalElement(sortedCampaignEntries, campaignEntryCounts, "campaignTotals");

    dashBoardTotalBarchart.data.datasets[0].data = totalBarchartList;
    dashBoardTotalBarchart.data.labels = months;
    document.querySelector(".currentMonthProfit .value").textContent = "$" + totalCurrentMonthProfit.value.toFixed(0);
    document.querySelector(".currentMonthProfit .value_span").textContent = months[actualDate.getMonth()];
    document.querySelector(".totalProfit .value").textContent = "$" + totalProfits.value.toFixed(0);
    document.querySelector(".totalLoss .value").textContent = "$" + totalLosses.value.toFixed(0);
    document.querySelector(".totalWin .value").textContent =
      "$" + (totalLosses.value * -1 + totalProfits.value).toFixed(0);
    document.querySelector(".totalPending .value").textContent = "$" + pendings.value.toFixed(0);
    document.querySelector(".entryCount .value").textContent =
      entries.value + "/$" + (totalProfits.value / entries.value).toFixed(0);

    dashBoardTotalBarchart.update();
  } catch (error) {
    console.error("Error fetching data", error);
  } finally {
    cardAmount.forEach((element) => (element.style.backgroundColor = ""));
    cardSpan.forEach((element) => (element.style.backgroundColor = ""));
  }
}

function updateMonthCharts(category) {
  let wins = 0;
  let losses = 0;
  let pendings = 0;
  let positives = 0;
  let negatives = 0;
  let pendingsAmount = 0;
  let monthTotalProfit = 0;
  let monthBarCategory = [];
  let monthAccOutcome = [];
  let monthBarData = {};
  let barColors = [];

  let entries = currentFilterElement
    ? document.querySelectorAll(".entryContainer.filter")
    : document.querySelectorAll(".entryContainer");
  entries.forEach((entry, index) => {
    let casino = entry.children[1].innerHTML;
    let campaign = entry.children[2].innerHTML;
    let bet = entry.children[3].value;
    let win = entry.children[4].value;
    let outcome = win - bet;
    let cashed_out = entry.children[6].classList.contains("checked");

    if (category == "Casinos") {
      if (!monthBarCategory.includes(casino)) {
        monthBarCategory.push(casino);
        monthBarData[casino] = 0;
      }
    } else {
      if (!monthBarCategory.includes(campaign)) {
        monthBarCategory.push(campaign);
        monthBarData[campaign] = 0;
      }
    }

    monthAccOutcome.push((monthAccOutcome[index - 1] || 0) + (cashed_out ? outcome : 0));

    if (cashed_out) {
      outcome >= 0 ? (wins += +outcome) : (losses += +outcome);
    }

    outcome >= 0 ? positives++ : "";
    outcome < 0 ? negatives++ : "";
    !cashed_out && win ? (pendings += +outcome) : "";
    !cashed_out ? pendingsAmount++ : "";

    if (cashed_out) {
      if (category == "Casinos") {
        monthTotalProfit += +outcome;
        monthBarData[casino] += +outcome;
      } else {
        monthTotalProfit += +outcome;
        monthBarData[campaign] += +outcome;
      }
    }
  });

  document.querySelector(".doughnut.profits").innerHTML = "$" + monthTotalProfit.toFixed(0);
  document.querySelector(".doughnut.sub.ratio").innerHTML = `${positives}/${negatives}/${pendingsAmount}`;

  // Filter out categories where the data is 0
  let filteredData = Object.entries(monthBarData).filter(([, value]) => value !== 0);

  let sortedData = filteredData.sort((a, b) => b[1] - a[1]);

  let sortedChartData = sortedData.map((entry) => entry[1]);

  sortedChartData.forEach((val, index, arr) => {
    if (val < 0) {
      arr[index] = val * -1;
      barColors.push("rgb(231, 76, 60)");
    } else {
      barColors.push("rgb(46, 204, 113)");
    }
  });

  if (wins == 0 && losses == 0) {
    monthDoughnutProfit.data.datasets[0].data = [100];
    monthDoughnutProfit.data.datasets[0].backgroundColor = ["rgb(243, 156, 18)"];
  } else {
    monthDoughnutProfit.data.datasets[0].data = [wins, losses, pendings];
    monthDoughnutProfit.data.datasets[0].backgroundColor = [
      "rgb(46, 204, 113)",
      "rgb(231, 76, 60)",
      "rgb(241, 196, 15)",
    ];

    month_linechart.data.datasets[0].data = monthAccOutcome;
    month_linechart.data.labels = Array.from({ length: monthAccOutcome.length }, (_, i) => i + 1);
  }
  monthDoughnutProfit.update();
  month_linechart.update();
}

async function removeEntry(event) {
  if (activeRemove) {
    try {
      // Locate the entry container and get the unique key
      let entryContainer = event.target.closest(".entryContainer");
      let entryKey = entryContainer.getAttribute("data-key"); // Assuming each entry container has a 'data-key' attribute

      if (!entryKey) {
        console.error("No key found for this entry.");
        return;
      }

      // Construct the path to the Firebase database reference using the key
      const entryRef = ref(db, `Entries/${year}/${months[currentMonth]}/${entryKey}`);

      // Remove the entry from Firebase
      await remove(entryRef);

      // If the entry was removed successfully, update the UI and perform other actions
      entryContainer.remove();
      updateMonthCharts();
      updateList();
      activeRemove = false;
      removeBtn.classList.remove("active");

      document.querySelectorAll(".entryContainer").forEach((element) => {
        element.classList.remove("deletable");
      });
    } catch (error) {
      console.error("Error removing data from Firebase:", error);
    }
  }
}

function editEntry(event) {
  let container = event.target.closest(".entryContainer");
  let key = container.getAttribute("data-key");

  if (activeEdit) {
    document.getElementById("doneEditing").style.display = "flex";
    editBtn.style.display = "none";

    container.removeEventListener("click", editEntry);

    document.querySelectorAll(".entryContainer").forEach((container) => {
      container.classList.remove("selected");
    });

    container.classList.add("selected");

    let spans = container.querySelectorAll("span:not(:last-of-type)");

    container.children[3].innerHTML = container.children[3].value;

    if (container.children[4].innerHTML == "$") {
      container.children[4].innerHTML = "";
    } else {
      container.children[4].innerHTML = container.children[4].value;
    }

    spans.forEach((span) => {
      span.contentEditable = true;
    });

    document.getElementById("doneEditing").onclick = () => {
      let content = {
        date: container.children[0].innerHTML,
        casino: container.children[1].innerHTML,
        campaign: container.children[2].innerHTML,
        bet: container.children[3].innerHTML,
        win: container.children[4].innerHTML,
        cashed_out: container.querySelector(".checkBox").classList.contains("checked") ? true : false,
      };

      // Reference the specific entry using its unique key
      const entryRef = ref(db, `Entries/${year}/${months[currentMonth]}/${key}`);

      set(entryRef, content)
        .then(() => {
          document.querySelectorAll(".entryContainer").forEach((container) => {
            container.classList.remove("selected");
            container.classList.remove("editable");
          });

          spans.forEach((span) => {
            span.contentEditable = false;
          });

          activeEdit = false;
          editBtn.classList.remove("active");
          document.getElementById("doneEditing").style.display = "none";
          editBtn.style.display = "flex";
          updateList();
        })
        .catch((error) => {
          console.error("Error updating entry: ", error);
        });
    };
  }
}

async function updateMonthLists() {
  let casinoContainerList = document.querySelector("#monthCasinoTotals");
  let campaignContainerList = document.querySelector("#monthCampaignTotals");

  let entries = document.querySelectorAll(".entryContainer");
  const casinos = [];
  const campaigns = [];

  entries.forEach((entry) => {
    const casino = entry.children[1].innerHTML;
    const campaign = entry.children[2].innerHTML;
    if (!casinos.includes(casino)) {
      casinos.push(casino);
    }
    if (!campaigns.includes(campaign)) {
      campaigns.push(campaign);
    }
  });

  casinoContainerList.innerHTML = "";
  campaignContainerList.innerHTML = "";

  createMonthContainers(casinos, "casino");
  createMonthContainers(campaigns, "campaign");

  function createMonthContainers(list, name) {
    list.forEach((item) => {
      let listContainerElement = document.createElement("div");
      listContainerElement.setAttribute("class", `${name} filter listContainerElement`);

      let count = 0;
      let profit = 0;

      entries.forEach((entry) => {
        if (name == "casino") {
          if (item == entry.children[1].innerHTML) {
            count++;
            profit += entry.children[5].value;
          }
        } else {
          if (item == entry.children[2].innerHTML) {
            count++;
            profit += entry.children[5].value;
          }
        }
      });

      const color = profit > 0 ? "var(--green)" : "var(--red)";

      listContainerElement.innerHTML = `<span class="label">${item}</span><span class="counts">${count}</span><span class="profits" style="background-color: ${color}">$${profit}</span>`;

      if (currentFilterElement) {
        if (currentFilterElement.querySelector(".label").innerHTML == item)
          listContainerElement.classList.add("selected");
      }

      if (name == "casino") {
        casinoContainerList.append(listContainerElement);
      } else {
        campaignContainerList.append(listContainerElement);
      }
    });
  }

  isAscending = false;
  sortEntries(document.querySelector("#casinoList div"), "listedTotals");
  sortEntries(document.querySelector("#campaignList div"), "listedTotals");

  let elements = document.querySelectorAll("#table_list_totals .table.section.list .listedTotals .listContainerElement");
  elements.forEach((el) => {
    el.querySelector(".label").onclick = function () {
      //resets list, shows every entry
      document.querySelectorAll(".entryContainer").forEach((entry) => {
        entry.style.display = "flex";
      });

      if (this.parentElement.classList.contains("selected")) {
        this.parentElement.classList.remove("selected");
        currentFilterElement = null;
      } else {
        document.querySelectorAll("#table_list_totals .table.section.list .listedTotals div").forEach((e) => {
          e.classList.remove("selected");
        });
        this.parentElement.classList.add("selected");
        currentFilterElement = this.parentElement;
      }

      if (el.querySelector(".label").innerText == "Vask ASG") {
        washButton.style.display = "flex";
      } else {
        washButton.style.display = "none";
        toggle_washSessions = false;
      }

      toggle_washSessions ? washButton.classList.add("active") : washButton.classList.remove("active");

      filterEntries(currentFilterElement);
      updateList();
    };
  });
}

function updateWashSession() {
  let lastDate = null;
  let ASG_entries = [];
  let washSession = [];

  document.querySelectorAll(".entryContainer.filter").forEach((entry) => {
    let currentDate = entry.children[0].innerText;

    if (currentDate !== lastDate) {
      if (washSession.length > 0) {
        ASG_entries.push(washSession);
      }
      washSession = [entry];
      lastDate = currentDate;
    } else {
      washSession.push(entry);
    }
  });

  if (washSession.length > 0) {
    ASG_entries.push(washSession);
  }

  entriesList.innerHTML = "";

  ASG_entries.forEach((washSession) => {
    let washSessionContainer = document.createElement("div");
    washSessionContainer.setAttribute("class", "washSessionContainer filter");

    let bet = 0;
    let win = 0;
    let date;

    washSession.forEach((entry) => {
      date = entry.children[0].innerText;
      bet += entry.children[3].value;
      win += entry.children[4].value;
    });

    let formatted_outcome = "$" + (win - bet).toFixed(2);
    let formatted_outcomeX = (win / bet) + "x";

    washSessionContainer.setAttribute("data-outcome_amount", formatted_outcome);
    washSessionContainer.setAttribute("data-outcome_x", formatted_outcomeX);

    washSessionContainer.innerHTML = `
        <span>${date}</span>
        <span>$${bet}</span>
        <span>$${win}</span>
        <span style="background-color: ${win - bet >= 0 ? "var(--green)" : "var(--red)"}; color: white; margin-left: auto">${outcome_x ? formatted_outcomeX : formatted_outcome}</span>`;

        washSessionContainer.children[1].value = bet;
        washSessionContainer.children[2].value = win;
        washSessionContainer.children[3].value = win - bet;
    
    entriesList.appendChild(washSessionContainer);
  });

  updateStatistics();
}

function filterEntries(currentFilterElement) {
  let entries = document.querySelectorAll(".entryContainer");
  if (currentFilterElement) {
    entries.forEach((entry) => {
      let filterCategory =
        currentFilterElement.classList[0] == "casino" ? entry.children[1].innerHTML : entry.children[2].innerHTML;
      if (filterCategory == currentFilterElement.querySelector(".label").innerHTML) {
        entry.classList.toggle("filter");
      } else {
        entry.style.display = "none";
      }
    });
  }
}

function sortEntries(entries, sort) {
  const entriesArray = Array.from(entries.children);

  const parseProfit = (profitString) => parseFloat(profitString.replace(/[^0-9.-]+/g, ""));

  const parseDate = (dateString) => {
    const [day, month] = dateString.split("/").map(Number);
    const year = new Date().getFullYear();
    return new Date(year, month - 1, day); // month is 0-indexed in JS Date
  };

  const getSortingFunction =
    (index, parser = (x) => x) =>
    (a, b) => {
      const A = parser(a.children[index].innerText);
      const B = parser(b.children[index].innerText);
      return isAscending ? A - B : B - A;
    };

  const stringSort = (index) => (a, b) => {
    const A = a.children[index].innerText;
    const B = b.children[index].innerText;
    return isAscending ? A.localeCompare(B) : B.localeCompare(A);
  };

  const sortMapping = {
    Date: getSortingFunction(0, parseDate),
    Bet: getSortingFunction(3, parseProfit),
    Win: getSortingFunction(4, parseProfit),
    Outcome: getSortingFunction(5, parseProfit),
    Casino: stringSort(1),
    Campaign: stringSort(2),
    listedTotals: getSortingFunction(1, parseProfit),
  };

  if (sort in sortMapping) {
    entriesArray.sort(sortMapping[sort]);
  }

  entries.innerHTML = "";
  entriesArray.forEach((entry) => entries.appendChild(entry));
}

let dashBoardTotalBarchart = new Chart("dashboard_total_barchart", {
  type: "bar",
  data: {
    labels: [],
    datasets: [
      {
        data: [],
        borderRadius: 10,
        borderSkipped: false,
        backgroundColor: "rgb(46, 204, 113)",
      },
    ],
  },
  options: {
    maintainAspectRatio: false,
    scales: {
      y: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          callback: function (value) {
            if (value >= 1000) {
              return value / 1000 + "k";
            }
            return value;
          },
        },
        min: 0,
        max: 9000,
      },
      x: {
        border: {
          display: false,
        },
        grid: {
          display: false,
        },
        ticks: {
          // Manually set tick values
          callback: function (value) {
            if (document.body.clientWidth > 1050) {
              return months[value];
            } else if (document.body.clientWidth > 360) {
              return mons[value];
            } else {
              return m[value];
            }
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        displayColors: false,
        callbacks: {
          label: function (tooltipItem) {
            let value = tooltipItem.raw;
            return "$" + value;
          },
        },
      },
    },
    onClick: (event) => {
      const points = dashBoardTotalBarchart.getElementsAtEventForMode(event, "nearest", { intersect: true }, false);

      if (points.length) {
        const firstPoint = points[0];
        const month = dashBoardTotalBarchart.data.labels[firstPoint.index];

        currentMonth = months.indexOf(month);
        localStorage.setItem("currentMonth", currentMonth);
        currentFilterElement = null;
        totalView = false;

        document.querySelectorAll(".pageContent").forEach((page) => {
          page.style.display = "none";
        });
        document.querySelector(".pageContent.table").style.display = "flex";
        changeMonth();
      }
    },
    onHover: (event, elements) => {
      if (elements.length) {
        event.native.target.style.cursor = "pointer";
      } else {
        event.native.target.style.cursor = "default";
      }
    },
  },
});

let monthDoughnutProfit = new Chart("month_doughnut_profits", {
  type: "doughnut",
  data: {
    labels: ["Wins", "Losses", "Pendings"],
    datasets: [
      {
        data: [],
        backgroundColor: [],
      },
    ],
  },
  options: {
    maintainAspectRatio: true,
    borderWidth: 4,
    borderRadius: 16,
    onHover: { mode: null },
    cutout: "70%",
    plugins: {
      tooltip: {
        displayColors: false,
        callbacks: {
          label: function (tooltipItem) {
            let value = tooltipItem.raw;
            return "$" + value;
          },
        },
        labels: {
          display: false,
        },
      },
      legend: {
        display: false,
      },
    },
  },
});

let month_linechart = new Chart("month_linechart", {
  type: "line",
  data: {
    labels: [], // Keep it empty as needed
    datasets: [
      {
        data: [], // Your data will go here
        borderColor: "rgb(46, 204, 113)", // Line color
        borderWidth: 4, // Line thickness
        fill: false, // No fill under the line
        tension: 0.2, // Smooth curve for the line
        pointRadius: 0, // No dots on the line
        pointBackgroundColor: "rgb(46, 204, 113)",
        pointHoverRadius: 4, // No hover effect on points
        borderCapStyle: "round",
      },
    ],
  },
  options: {
    maintainAspectRatio: false,
    scales: {
      y: {
        grid: {
          display: false, // No grid lines
        },
        border: {
          display: false,
        },
        ticks: {
          padding: 10, // Adds some space between ticks and the axis
          callback: function (value) {
            if (value >= 1000) {
              return value / 1000 + "k"; // Display large numbers in 'k' format
            }
            return value;
          },
        },
        min: 0,
      },
      x: {
        grid: {
          display: false, // No grid lines
        },
        border: {
          display: false,
        },
        ticks: {
          display: false, // Hide X-axis labels
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Hides the legend for a clean look
      },
      tooltip: {
        enabled: true, // Show tooltips
        displayColors: false, // Disable color indicators in tooltip
        callbacks: {
          title: () => null, // Disable the X-axis label in the tooltip
          label: function (tooltipItem) {
            let value = tooltipItem.raw;
            return "$" + value; // Display value with a $ prefix
          },
        },
      },
    },
    interaction: {
      mode: "nearest", // Find the nearest point
      axis: "x", // Based on x-axis
      intersect: false, // Do not require the cursor to intersect with the point
    },
    onHover: (event, chartElement) => {
      if (chartElement.length) {
        // If a point is found
        month_linechart.setActiveElements(chartElement); // Highlight the point
        month_linechart.tooltip.setActiveElements(chartElement, event); // Trigger the tooltip
        month_linechart.update();
      } else {
        month_linechart.setActiveElements([]); // Clear any active elements
        month_linechart.tooltip.setActiveElements([], event); // Hide the tooltip
        month_linechart.update();
      }
    },
  },
});

window.addEventListener("resize", function () {
  dashBoardTotalBarchart.update();
});

updateDashboard();
changeMonth();
