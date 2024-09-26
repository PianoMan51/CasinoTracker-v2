import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  remove,
  push,
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
let casinoSelectsContainer = document.querySelector(".inputs .casinos.selects");
let campaignSelectsContainer = document.querySelector(".inputs .campaigns.selects");
let reopenCasinoSelects = document.querySelector(".reopen.casino");
let reopenCampaignSelects = document.querySelector(".reopen.campaign");
let monthBarChartToggle = document.getElementById("toggleBarCategory");
let actualMonth = new Date();
let year = 2024;
let currentFilterElement = null;
let isAscending = true;
let totalView = false;
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

currentMonthSpan.forEach((span) => {
  span.onclick = () => {
    totalView = !totalView;

    updateList();
    updateMonthLists();
  };
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

document.querySelectorAll(".nav").forEach((button) => {
  button.addEventListener("click", function () {
    nav(button.getAttribute("name"));
  });
});

document.querySelector(".card.currentMonthProfit").onclick = () => {
  nav("table");
  currentMonth = actualMonth.getMonth();
  localStorage.setItem("currentMonth", currentMonth);
  updateList();
};

function nav(page) {

  document.querySelectorAll(".pageContent").forEach((page) => {
    page.style.display = "none";
  });

  document.querySelector(".pageContent." + page).style.display = "flex";
  localStorage.setItem("currentPageContent", page);
  resetInputs();
}

openInputs.onclick = () => {
  activeAdd = !activeAdd;
  openInputs.classList.toggle("active");
  inputsContainer.classList.toggle("hidden");
  document.querySelector("#table").classList.toggle("blur");
};

removeBtn.onclick = () => {
  activeRemove = !activeRemove;
  activeEdit = false;
  removeBtn.classList.toggle("active");
  document.querySelectorAll(".entryContainer").forEach((element) => {
    element.classList.toggle("deletable");
  });
};

editBtn.onclick = () => {
  activeEdit = !activeEdit;
  activeRemove = false;
  editBtn.classList.toggle("active");
  document.querySelectorAll(".entryContainer").forEach((element) => {
    element.classList.toggle("editable");
  });
};

monthBarChartToggle.onclick = () => {
  monthBarChartToggle.className = monthBarChartToggle.className == "Casinos" ? "Campaigns" : "Casinos";
  monthBarChartToggle.innerHTML = monthBarChartToggle.className;
  updateMonthCharts(monthBarChartToggle.className);
};

reopenCasinoSelects.onclick = () => casinoSelectsContainer.classList.toggle("open");
reopenCampaignSelects.onclick = () => campaignSelectsContainer.classList.toggle("open");

document.querySelectorAll(".inputs .casinos.selects span").forEach((element) => {
  element.addEventListener("click", () => {
    // Remove active class from all spans and add it to the clicked span
    document.querySelectorAll(".inputs .casinos.selects span").forEach((el) => {
      el.classList.remove("active");
    });

    element.classList.toggle("active");

    document.getElementById("casinoContainer").classList.add("active");

    document.querySelector(".selectedCasino").innerHTML = element.innerHTML;

    document.querySelector(".selectedCasino").onclick = () => casinoSelectsContainer.classList.toggle("open");

    campaignSelectsContainer.classList.remove("hidden");
    campaignSelectsContainer.classList.add("open");
    casinoSelectsContainer.classList.remove("open");
  });
});

document.querySelectorAll(".inputs .campaigns.selects span").forEach((element) => {
  element.addEventListener("click", () => {
    // Remove active class from all spans and add it to the clicked span
    document.querySelectorAll(".inputs .campaigns.selects span").forEach((el) => {
      el.classList.remove("active");
    });

    element.classList.toggle("active");

    document.getElementById("campaignContainer").classList.add("active");

    document.querySelector(".selectedCampaign").innerHTML = element.innerHTML;

    document.querySelector(".selectedCampaign").onclick = () => campaignSelectsContainer.classList.toggle("open");

    campaignSelectsContainer.classList.add("hidden");
    campaignSelectsContainer.classList.remove("open");

    document.querySelector(".amountInputs").classList.remove("hidden");

    bet_input.addEventListener("input", () => {
      if (bet_input.value) {
        document.getElementById("inputsContainerButton").style.color = "var(--green)";
        document.getElementById("inputsContainerButton").style.border = "3px solid var(--green)";
        document.getElementById("inputsContainerButton").style.transform = "rotate(45deg)";
      } else {
        document.getElementById("inputsContainerButton").style.color = "var(--red)";
        document.getElementById("inputsContainerButton").style.border = "3px solid var(--red)";
        document.getElementById("inputsContainerButton").style.transform = "rotate(90deg)";
      }
    });
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
  updateMonthLists();

  openInputs.style.display = actualMonth.getMonth() !== currentMonth ? "none" : "inline";
}

document.getElementById("inputsContainerButton").onclick = () => {
  if (bet_input.value) {
    addEntry();
  } else {
    resetInputs();
  }
};

function addEntry() {
  let getDate = new Date();
  let day = getDate.getDate() < 10 ? "0" + getDate.getDate() : getDate.getDate();
  let month = getDate.getMonth() < 10 ? "0" + (getDate.getMonth() + 1) : getDate.getMonth() + 1; // Fixed month + 1

  // Construct the entry data object
  let entry = {
    date: `${day}/${month}`,
    casino: document.querySelector(".casinos.selects span.active").innerHTML,
    campaign: document.querySelector(".campaigns.selects span.active").innerHTML,
    bet: bet_input.value,
    win: win_input.value,
    cashed_out: false,
  };

  // Create a reference for the new entry using push() to generate a unique key
  const entriesRef = ref(db, `Entries/${year}/${months[currentMonth]}`);
  const newEntryRef = push(entriesRef);

  // Write the entry data to the new entry
  set(newEntryRef, entry)
    .then(() => {
      // If the data was written successfully, update the UI and perform other actions
      updateList();
      updateDashboard();

      // Toggle UI elements and reset inputs
      inputsContainer.classList.toggle("hidden");
      document.querySelector("#table").classList.toggle("blur");
      activeAdd = false;
      openInputs.classList.toggle("active");
      resetInputs();
    })
    .catch((error) => {
      console.error("Error writing new entry: ", error);
    });
}

function resetInputs() {
  bet_input.value = "";
  win_input.value = "";
  casinoSelectsContainer.classList.add("open");
  campaignSelectsContainer.classList.add("hidden");
  document.querySelector("#table").classList.remove("blur");
  document.querySelector(".amountInputs").classList.add("hidden");

  document.getElementById("inputsContainer").classList.add("hidden");
  document.getElementById("casinoContainer").classList.remove("active");
  document.getElementById("campaignContainer").classList.remove("active");
  document.getElementById("openInput").classList.remove("active");

  document.getElementById("inputsContainerButton").style.color = "var(--red)";
  document.getElementById("inputsContainerButton").style.border = "3px solid var(--red)";
  document.getElementById("inputsContainerButton").style.transform = "rotate(90deg)";

  inputsContainer.classList.add("hidden");

  document.querySelectorAll(".inputs .casinos.selects span").forEach((el) => {
    el.classList.remove("active");
  });

  document.querySelectorAll(".inputs .campaigns.selects span").forEach((el) => {
    el.classList.remove("active");
  });
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

  // Add "pending" class if the entry has not been cashed out
  if (!entry.cashed_out) {
    entryContainer.classList.add("pending");
  }

  let vp = window.innerWidth;

  entryContainer.innerHTML = `
    <span>${entry.date}</span>
    <span>${entry.casino}</span>
    <span>${entry.campaign ? entry.campaign : "N/A"}</span>
    <span>$${vp > 370 ? bet.toFixed(2) : bet.toFixed(0)}</span>
    <span>${entry.win ? "$" + (vp > 370 ? win.toFixed(2) : win.toFixed(0)) : "Pending"}</span>
    <span style="background-color: ${color}; color: white;">${
    entry.win ? "$" + (vp > 370 ? profit.toFixed(2) : profit.toFixed(0)) : "Pending"
  }</span>
    <div class="checkBox ${entry.cashed_out ? "checked" : ""}"><i class="fa-solid fa-sack-dollar ${
    vp < 370 ? "fa-2xs" : ""
  }"></i></div>
  `;

  entryContainer.children[3].value = bet;
  entryContainer.children[4].value = win;
  entryContainer.children[5].value = profit;

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
    let ASG_entries = [];
    let washSession = [];
    let lastDate = null;

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

    const data = await fetchYearEntries(year);
    data.forEach((entry) => {
      if (entry.campaign == "Vask ASG") {
        if (entry.date !== lastDate) {
          if (washSession.length > 0) {
            ASG_entries.push(washSession);
          }
          washSession = [entry];
          lastDate = entry.date;
        } else {
          washSession.push(entry);
        }
      }
    });

    if (washSession.length > 0) {
      ASG_entries.push(washSession);
    }

    document.getElementById("wash_entriesList").innerHTML = "";

    ASG_entries.forEach((washSession) => {
      let washSessionContainer = document.createElement("div");
      washSessionContainer.setAttribute("class", "washSessionContainer");
      let washSessionCasinos = document.createElement("div");
      washSessionCasinos.setAttribute("class", "washSessionCasinos");
      let bet = 0;
      let win = 0;
      let date;

      washSession.forEach((entry) => {
        let washCasino = document.createElement("span");
        washCasino.innerHTML = entry.casino;
        washSessionCasinos.appendChild(washCasino);
        date = entry.date; // Ensure 'date' is correctly taken from 'entry'
        bet += Number(entry.bet);
        win += Number(entry.win);
      });

      let dateSpan = document.createElement("span");
      dateSpan.setAttribute("class", "wash-date");
      dateSpan.innerHTML = date;

      let betSpan = document.createElement("span");
      betSpan.setAttribute("class", "wash-bet");
      betSpan.innerHTML = "$" + bet.toFixed(2);

      let winSpan = document.createElement("span");
      winSpan.setAttribute("class", "wash-win");
      winSpan.innerHTML = "$" + win.toFixed(2);

      let percentageSpan = document.createElement("span");
      percentageSpan.setAttribute("class", "wash-percentage");
      let percentage = ((win / bet - 1) * 100).toFixed(2);
      let color = "";
      percentageSpan.innerHTML = `${percentage}%`;
      if (percentage > 100) {
        color = "var(--darkgreen)";
      } else if (percentage > 80) {
        color = "var(--green)";
      } else if (percentage > 70) {
        color = "var(--yellow)";
      } else if (percentage > 30) {
        color = "var(--orange)";
      } else {
        color = "var(--red)";
      }

      percentageSpan.style.backgroundColor = color;

      let profitSpan = document.createElement("span");
      profitSpan.style.backgroundColor = win - bet >= 0 ? "var(--green)" : "var(--red)";
      profitSpan.setAttribute("class", "wash-profit");
      profitSpan.innerHTML = `$${(win - bet).toFixed(2)}`;

      // Append the dynamically created elements
      washSessionContainer.appendChild(dateSpan);
      washSessionContainer.appendChild(washSessionCasinos);
      washSessionContainer.appendChild(betSpan);
      washSessionContainer.appendChild(winSpan);
      washSessionContainer.appendChild(percentageSpan);
      washSessionContainer.appendChild(profitSpan);

      document.getElementById("wash_entriesList").appendChild(washSessionContainer);
    });

    // Clear the original content once the data is ready
    entriesList.innerHTML = "";

    // Create and append entry containers for each entry
    entries.forEach((entry) => {
      let entryContainer = createEntryContainer(entry, entry.key); // Pass the key
      entriesList.append(entryContainer);
    });
  } catch (error) {
    console.error("Error updating list", error);
  }

  // Apply the current filter if applicable
  if (currentFilterElement) {
    filterEntries(currentFilterElement);
  }

  updateMonthCharts();
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
  const entries = { value: 0};
  const totalBarchartList = [];
  const casinos = await getMisc("Casinos");
  const campaigns = await getMisc("Campaigns");
  const casinoTotalProfits = Object.fromEntries(casinos.map((casino) => [casino, 0]));
  const campaignTotalProfits = Object.fromEntries(campaigns.map((campaign) => [campaign, 0]));

  const updateProfits = (data) => {
    let dashcard_totalProfits = 0;
    let barData = 0;

    if (data) {
      data.forEach((entry) => {
        const profit = entry.win - entry.bet;
        casinoTotalProfits[entry.casino] = (casinoTotalProfits[entry.casino] || 0) + profit;
        campaignTotalProfits[entry.campaign] = (campaignTotalProfits[entry.campaign] || 0) + profit;

        let [entry_day, entry_month] = entry.date.split("/").map(Number);

        entries.value++;

        if (entry.cashed_out) {
          totalProfits.value += +profit;
          totalLosses.value += profit < 0 ? profit : 0;
          totalCurrentMonthProfit.value += entry_month == actualMonth.getMonth() + 1 ? +profit : 0;

          dashcard_totalProfits += +profit;
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

    const createTotalElement = (entries, containerId) => {
      const container = document.getElementById(containerId);
      container.innerHTML = "";
      entries.forEach(([name, profit]) => {
        const color = profit > 0 ? "var(--green)" : "var(--red)";
        const element = document.createElement("div");
        element.setAttribute(
          "class",
          `${containerId.substring(0, containerId.length - 6)} filter listContainerElement`
        );
        element.innerHTML = `
          <span class="label">${name ? name : "Other"}</span>
          <span class="profits" style="background-color: ${color}">$${profit.toFixed(0)}</span>
        `;
        container.append(element);

        element.addEventListener("click", function () {
          document.querySelectorAll(".pageContent").forEach((page) => {
            page.style.display = "none";
          });

          currentFilterElement = element;

          document.querySelector(".pageContent.table").style.display = "flex";

          document.querySelectorAll(".listContainerElement").forEach((filter) => {
            if (filter.children[0].innerHTML == currentFilterElement) {
              filter.classList.add("selected");
            }
          });

          totalView = "true";
          updateList();
          updateMonthLists();
        });
      });
    };

    const sortedCasinoEntries = Object.entries(casinoTotalProfits).sort((a, b) => b[1] - a[1]);
    const sortedCampaignEntries = Object.entries(campaignTotalProfits).sort((a, b) => b[1] - a[1]);

    createTotalElement(sortedCasinoEntries, "casinoTotals");
    createTotalElement(sortedCampaignEntries, "campaignTotals");

    dashBoardTotalBarchart.data.datasets[0].data = totalBarchartList;
    dashBoardTotalBarchart.data.labels = months;
    document.querySelector(".currentMonthProfit .value").textContent = "$" + totalCurrentMonthProfit.value.toFixed(0);
    document.querySelector(".currentMonthProfit .value_span").textContent = months[actualMonth.getMonth()];
    document.querySelector(".totalProfit .value").textContent = "$" + totalProfits.value.toFixed(0);
    document.querySelector(".totalLoss .value").textContent = "$" + totalLosses.value.toFixed(0);
    document.querySelector(".totalWin .value").textContent = "$" + (totalLosses.value * -1 + totalProfits.value).toFixed(0);
    document.querySelector(".totalPending .value").textContent = "$" + pendings.value.toFixed(0);
    document.querySelector(".entryCount .value").textContent = entries.value + "/$" + (totalProfits.value/entries.value).toFixed(0);

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

  if (category == undefined) {
    category = monthBarChartToggle.className;
  }

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

    if (win) {
      outcome > 0 ? cashed_out && (wins += +outcome) : (losses += +outcome);
    }
    outcome > 0 ? positives++ : "";
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

  let sortedLabels = sortedData.map((entry) => entry[0]);
  let sortedChartData = sortedData.map((entry) => entry[1]);

  sortedChartData.forEach((val, index, arr) => {
    if (val < 0) {
      arr[index] = val * -1;
      barColors.push("rgb(231, 76, 60)");
    } else {
      barColors.push("rgb(46, 204, 113)");
    }
  });

  monthBarProfits.data.labels = sortedLabels;
  monthBarProfits.data.datasets[0].data = sortedChartData;

  document.querySelector(".monthBarChart").style.height = `${sortedLabels.length * 2.5}vh`;

  monthBarProfits.data.datasets[0].backgroundColor = barColors;

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
  monthBarProfits.update();
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
    container.removeEventListener("click", editEntry);

    document.querySelectorAll(".entryContainer").forEach((container) => {
      container.classList.remove("selected");
      container.classList.add("blur");
    });

    container.classList.remove("blur");
    container.classList.add("selected");

    let checkBox = container.querySelector(".checkBox");
    let spans = container.querySelectorAll("span");

    container.children[3].innerHTML = container.children[3].value;

    if (container.children[4].innerHTML == "Pending") {
      container.children[4].innerHTML = "Pending";
    } else {
      container.children[4].innerHTML = container.children[4].value;
    }

    document.getElementById("actionButtons").children[0].style.display = "none";
    document.getElementById("actionButtons").children[1].style.display = "none";
    document.getElementById("actionButtons").children[2].style.display = "none";
    document.getElementById("actionButtons").children[3].style.display = "block";

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
        cashed_out: checkBox.classList.contains("checked") ? true : false,
      };

      // Reference the specific entry using its unique key
      const entryRef = ref(db, `Entries/${year}/${months[currentMonth]}/${key}`);

      set(entryRef, content)
        .then(() => {
          document.getElementById("actionButtons").children[0].style.display = "inline";
          document.getElementById("actionButtons").children[1].style.display = "inline";
          document.getElementById("actionButtons").children[2].style.display = "inline";
          document.getElementById("actionButtons").children[3].style.display = "none";
          document.querySelectorAll(".entryContainer").forEach((container) => {
            container.classList.remove("selected");
            container.classList.remove("blur");
            container.classList.remove("editable");
          });
          spans.forEach((span) => {
            span.contentEditable = false;
          });
          activeEdit = false;
          editBtn.classList.toggle("active");
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
  const casinos = await getMisc("Casinos");
  const campaigns = await getMisc("Campaigns");

  try {
    let entries = [];

    if (!totalView) {
      const data = await fetchMonthEntries(year, months[currentMonth]);
      if (data) {
        entries = Object.values(data);
      }
    } else {
      // Fetch data for all months in the year
      for (let i = 0; i < 12; i++) {
        const data = await fetchMonthEntries(year, months[i]);
        entries.push(...data);
      }
    }

    casinoContainerList.innerHTML = "";

    casinos.forEach((casino) => {
      let casinoContainer = document.createElement("div");
      casinoContainer.setAttribute("class", "casino filter listContainerElement");

      let casinoCount = 0;
      entries.forEach((entry) => {
        if (casino == entry.casino) {
          casinoCount++;
        }
      });

      casinoContainer.innerHTML = `<span class="label">${casino}</span><span class="profits">${casinoCount}</span>`;

      if (casinoCount > 0) casinoContainerList.append(casinoContainer);
    });
  } catch (error) {
    console.error("Error updating list", error);
  }

  try {
    let entries = [];

    if (!totalView) {
      const data = await fetchMonthEntries(year, months[currentMonth]);
      if (data) {
        entries = Object.values(data);
      }
    } else {
      // Fetch data for all months in the year
      for (let i = 0; i < 12; i++) {
        const data = await fetchMonthEntries(year, months[i]);
        entries.push(...data);
      }
    }

    campaignContainerList.innerHTML = "";

    campaigns.forEach((campaign) => {
      let campaignContainer = document.createElement("div");
      campaignContainer.setAttribute("class", "campaign filter listContainerElement");

      let campaignCount = 0;
      entries.forEach((entry) => {
        if (campaign == entry.campaign) {
          campaignCount++;
        }
      });

      campaignContainer.innerHTML = `<span class="label">${campaign}</span><span class="profits">${campaignCount}</span>`;

      if (campaignCount > 0) campaignContainerList.append(campaignContainer);
    });
  } catch (error) {
    console.error("Error updating list", error);
  }

  isAscending = false;
  sortEntries(document.querySelector("#casinoList div"), "listedTotals");
  sortEntries(document.querySelector("#campaignList div"), "listedTotals");

  let elements = document.querySelectorAll("#table_list_totals .table.section.list .listedTotals div");

  document.querySelectorAll("#table_list_totals .listContainerElement").forEach((element) => {
    if (currentFilterElement) {
      if (element.querySelector(".label").innerHTML == currentFilterElement.querySelector(".label").innerHTML) {
        element.classList.add("selected");
      } else {
        currentFilterElement = null;
      }
    }
  });

  elements.forEach((el) => {
    el.onclick = function () {
      //resets list, shows every entry
      document.querySelectorAll(".entryContainer").forEach((entry) => {
        entry.style.display = "flex";
      });

      if (this.classList.contains("selected")) {
        this.classList.remove("selected");
        currentFilterElement = null;
      } else {
        document.querySelectorAll("#table_list_totals .table.section.list .listedTotals div").forEach((e) => {
          e.classList.remove("selected");
        });
        this.classList.add("selected");
        currentFilterElement = this;
      }
      filterEntries(currentFilterElement);
      updateList();
    };
  });
}

function filterEntries(currentFilterElement) {
  let entries = document.querySelectorAll(".entryContainer");

  if (currentFilterElement) {
    entries.forEach((entry) => {
      let filterCategory =
        currentFilterElement.classList[0] == "casino" ? entry.children[1].innerHTML : entry.children[2].innerHTML;
      if (filterCategory !== currentFilterElement.querySelector(".label").innerHTML) {
        entry.style.display = "none";
      } else {
        entry.classList.toggle("filter");
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
    Dato: getSortingFunction(0, parseDate),
    Indsats: getSortingFunction(3, parseProfit),
    Udbetaling: getSortingFunction(4, parseProfit),
    Profit: getSortingFunction(5, parseProfit),
    Casino: stringSort(1),
    Kampagne: stringSort(2),
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
        min:0,
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
        currentFilter = null;
        totalView = false;
        //document.getElementById("prevMonth").classList.remove("hidden");
        //document.getElementById("nextMonth").classList.remove("hidden");

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

window.addEventListener("resize", function () {
  dashBoardTotalBarchart.update();
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

let monthBarProfits = new Chart("month_barchart", {
  type: "bar",
  data: {
    labels: [],
    datasets: [
      {
        data: [],
        borderRadius: 5,
        borderSkipped: false,
        backgroundColor: [],
      },
    ],
  },
  options: {
    indexAxis: "y",
    maintainAspectRatio: false,
    scales: {
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
      x: {
        display: false,
        border: {
          display: false,
        },
        grid: {
          display: false,
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
  },
});

let month_linechart = new Chart("month_linechart", {
  type: "line",
  data: {
    labels: [], // Keep it empty as needed
    datasets: [
      {
        data: [], // Your data will go here
        borderColor: "rgba(46, 204, 113, 1)", // Line color
        borderWidth: 4, // Line thickness
        fill: false, // No fill under the line
        tension: 0.2, // Smooth curve for the line
        pointRadius: 0, // No dots on the line
        pointHoverRadius: 0, // No hover effect on points
        borderCapStyle: 'round',
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
        max: 9000,
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
          label: function (tooltipItem) {
            let value = tooltipItem.raw;
            return "$" + value; // Display value with a $ prefix
          },
        },
      },
    },
  },
});

updateDashboard();
changeMonth();
