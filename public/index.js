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
let currentMonthSpan = document.getElementById("currentMonthSpan");
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
let sideBar = document.getElementById("sidebar");
let showSidebar = localStorage.getItem("showSidebar") === "true";
let sideBarButton = document.querySelector(".collapse_sidebar_button");
showSidebar ? sideBar.classList.remove("small") : sideBar.classList.add("small");
sideBarButton.style.transform = showSidebar ? "rotate(0deg)" : "rotate(180deg)";
let year = 2024;
let currentFilter = null;
let isAscending = true;
let totalView = false;
let activeRemove = false;
let activeEdit = false;
let activeAdd = false;

window.addEventListener("resize", function () {
  showSidebar && this.window.innerWidth < 1000 ? (this.document.getElementById("app").style.minWidth = "1030px") : "";
});

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

currentMonthSpan.onclick = () => {
  totalView = !totalView;
  document.getElementById("prevMonth").classList.toggle("hidden");
  document.getElementById("nextMonth").classList.toggle("hidden");

  currentMonthSpan.innerHTML = totalView ? "Total" : months[currentMonth];
  updateList();
  updateAddLists();
};

sideBarButton.addEventListener("click", () => {
  showSidebar = !showSidebar;
  localStorage.setItem("showSidebar", showSidebar);

  let nav = document.querySelectorAll(".nav");

  window.innerWidth < 1070 ? (!showSidebar ? (document.getElementById("app").style.minWidth = "925px") : "") : "";

  if (showSidebar) {
    sideBar.classList.remove("small");
    sideBarButton.style.transform = "rotate(0deg)";

    nav.forEach((nav) => {
      nav.querySelector("span").style.display = "flex";
    });
  } else {
    sideBar.classList.add("small");
    sideBarButton.style.transform = "rotate(180deg)";

    nav.forEach((nav) => {
      nav.querySelector("span").style.display = "none";
    });
  }
});

document.querySelectorAll(".listHeaders span").forEach((sort) => {
  sort.addEventListener("click", () => {
    sortEntries(entriesList, sort.innerHTML);
    isAscending = !isAscending;
  });
});

document.getElementById("prevMonth").onclick = () => {
  changeMonth("prev");
};

document.getElementById("nextMonth").onclick = () => {
  changeMonth("next");
};

document.querySelector("#casinoList .header").onclick = () => {
  sortEntries(document.querySelector("#casinoList div"), "addList");
  isAscending = !isAscending;
};

document.querySelector("#campaignList .header").onclick = () => {
  sortEntries(document.querySelector("#campaignList div"), "addList");
  isAscending = !isAscending;
};

document.querySelector(".pageContent." + currentPageContent).style.display = "flex";

document.querySelectorAll(".nav").forEach((button) => {
  let content = button.getAttribute("name");
  button.addEventListener("click", function () {
    document.querySelectorAll(".pageContent").forEach((page) => {
      page.style.display = "none";
    });
    document.querySelector(".pageContent." + content).style.display = "flex";
    localStorage.setItem("currentPageContent", content);
    resetInputs();

    if (button.getAttribute("name") == "dashboard") {
      updateDashboard(document.querySelector(".card.active").classList[1]);
    }
  });
});

openInputs.onclick = () => {
  activeAdd = !activeAdd;
  openInputs.classList.toggle("active");
  inputsContainer.classList.toggle("hidden");
  document.querySelector(".table.content").classList.toggle("blur");
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
  currentMonthSpan.innerHTML = months[currentMonth];
  updateList();
  updateAddLists();

  let actualMonth = new Date();
  openInputs.style.display = actualMonth.getMonth() !== currentMonth ? "none" : "inline";
}

document.getElementById("inputsContainerButton").onclick = () => {
  if (bet_input.value) {
    addEntry();
  } else {
    resetInputs();
  }
};

document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", function () {
    document.querySelectorAll(".card").forEach((othercard) => {
      othercard.classList.remove("active");
    });

    card.classList.toggle("active");
    updateDashboard(card.classList[1]);
  });
});

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
      document.querySelector(".table.content").classList.toggle("blur");
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
  document.querySelector(".table.content").classList.remove("blur");
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

  entryContainer.innerHTML = `
    <span style="width: 80px">${entry.date}</span>
    <span style="flex: 1">${entry.casino}</span>
    <span style="flex: 1; min-width: 115px">${entry.campaign ? entry.campaign : "N/A"}</span>
    <span style="width: 80px">$${bet.toFixed(2)}</span>
    <span style="width: 80px;">${entry.win ? "$" + win.toFixed(2) : "Pending"}</span>
    <span style="width: 80px; margin-right: 40px; background-color: ${color}; color: white;">${
    entry.win ? "$" + profit.toFixed(2) : "Pending"
  }</span>
    <div class="checkBox ${entry.cashed_out ? "checked" : ""}"><i class="fa-solid fa-sack-dollar"></i></div>
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
  for (let i = 0; i < 20; i++) {
    let offline_element = document.createElement("div");
    offline_element.setAttribute("class", "offline_element");
    //entriesList.appendChild(offline_element);
  }

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
      // Fetch data for all months in the year
      for (let i = 0; i < 12; i++) {
        const data = await fetchMonthEntries(year, months[i]);
        if (data) {
          entries.push(...data); // Flatten and add data to entries
        }
      }
    }

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
  if (currentFilter) {
    let category = document.querySelector(".addList .selected").classList[0].slice(0, -9)
    filterEntries(category);
  }
  updateMonthCharts();
}

function checkCash(checkBox, key) {
  let entryContainer = checkBox.parentNode;
  entryContainer.classList.toggle("pending");
  checkBox.classList.toggle("checked");
  let profit = entryContainer.children[5].value;

  entryContainer.children[5].style.backgroundColor = checkBox.classList.contains("checked")
    ? profit > 0
      ? "var(--green)"
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

async function updateDashboard(category) {
  // Get elements you want to blur
  const canvasElement = document.querySelector(".dashboard.section canvas");
  const cardAmount = document.querySelectorAll(".info .value");
  const cardSpan = document.querySelectorAll(".info .value_span");

  // Create values for cards and elements
  const totalProfits = { value: 0 };
  const totalBets = { value: 0 };
  const totalLosses = { value: 0 };
  const totalPayouts = { value: 0 };
  const pendings = { value: 0 };
  const totalBarchartList = [];
  const casinos = await getMisc("Casinos");
  const campaigns = await getMisc("Campaigns");
  const casinoTotalProfits = Object.fromEntries(casinos.map((casino) => [casino, 0]));
  const campaignTotalProfits = Object.fromEntries(campaigns.map((campaign) => [campaign, 0]));

  // Apply blur effect to the canvas and profit elements
  canvasElement.style.filter = "blur(2px)";

  // Apply 'offline'-effect
  cardAmount.forEach((element) => (element.style.backgroundColor = "var(--lightgray)"));
  cardAmount.forEach((element) => (element.innerHTML = ""));
  cardSpan.forEach((element) => (element.style.backgroundColor = "var(--lightgray)"));
  cardSpan.forEach((element) => (element.style.color = "transparent"));

  for (let i = 0; i < 20; i++) {
    let offline_element = document.createElement("div");
    offline_element.setAttribute("class", "offline_element");
    document.getElementById("campaignTotals").appendChild(offline_element);
  }

  for (let i = 0; i < 20; i++) {
    let offline_element = document.createElement("div");
    offline_element.setAttribute("class", "offline_element");
    document.getElementById("casinoTotals").appendChild(offline_element);
  }

  const updateProfits = (data) => {
    let monthProfits = 0;
    let monthWins = 0;
    let monthLosses = 0;
    let monthBets = 0;
    let monthPayouts = 0;
    let monthPending = 0;
    let barData = 0;

    if (data) {
      data.forEach((entry) => {
        const profit = entry.win - entry.bet;
        casinoTotalProfits[entry.casino] = (casinoTotalProfits[entry.casino] || 0) + profit;
        campaignTotalProfits[entry.campaign] = (campaignTotalProfits[entry.campaign] || 0) + profit;

        if (entry.cashed_out) {
          totalBets.value += +entry.bet;
          totalProfits.value += +profit;
          totalLosses.value += profit < 0 ? profit : 0;
          totalPayouts.value += +entry.win;

          monthProfits += +profit;
          monthWins += profit > 0 ? profit : 0;
          monthLosses += profit < 0 ? profit * -1 : 0;
          monthBets += +entry.bet;
          monthPayouts += +entry.win;
        } else {
          pendings.value += +entry.bet;

          monthBets += +entry.bet;
          monthPending += +entry.bet;
        }

        switch (category) {
          case "totalProfit":
            barData = monthProfits;
            break;
          case "totalWin":
            barData = monthWins;
            break;
          case "totalLoss":
            barData = monthLosses;
            break;
          case "totalBet":
            barData = monthBets;
            break;
          case "totalPayout":
            barData = monthPayouts;
            break;
          case "totalPending":
            barData = monthPending;
            break;
        }
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
        element.setAttribute("class", "listContainerElement");
        element.innerHTML = `
          <span class="label" style="flex: 1">${name ? name : "Other"}</span>
          <span class="profits" style="background-color: ${color}">$${profit.toFixed(0)}</span>
        `;
        container.append(element);

        element.addEventListener("click", function () {
          document.querySelectorAll(".pageContent").forEach((page) => {
            page.style.display = "none";
          });

          currentFilter = element.querySelector(".label").innerHTML;

          document.querySelector(".pageContent.table").style.display = "flex";

          document.querySelectorAll(".addListContainer").forEach((filter) => {
            if (filter.children[0].innerHTML == currentFilter) {
              filter.classList.add("selected")
            }
          })

          totalView = "true";
          updateList();
          updateAddLists();

          currentMonthSpan.innerHTML = "Total";
          document.getElementById("prevMonth").classList.toggle("hidden");
          document.getElementById("nextMonth").classList.toggle("hidden");
        });
      });
    };

    const sortedCasinoEntries = Object.entries(casinoTotalProfits).sort((a, b) => b[1] - a[1]);
    const sortedCampaignEntries = Object.entries(campaignTotalProfits).sort((a, b) => b[1] - a[1]);

    createTotalElement(sortedCasinoEntries, "casinoTotals");
    createTotalElement(sortedCampaignEntries, "campaignTotals");

    dashBoardTotalBarchart.data.datasets[0].data = totalBarchartList;
    dashBoardTotalBarchart.data.labels = months;
    dashBoardTotalBarchart.data.datasets[0].backgroundColor =
      category === "totalLoss"
        ? "rgb(231, 76, 60)"
        : category === "totalPending"
        ? "rgb(241, 196, 15)"
        : "rgb(46, 204, 113)";
    document.querySelector(".totalProfit .value").textContent = "$" + totalProfits.value.toFixed(0);
    document.querySelector(".totalLoss .value").textContent = "$" + totalLosses.value.toFixed(0);
    document.querySelector(".totalWin .value").textContent =
      "$" + (totalLosses.value * -1 + totalProfits.value).toFixed(0);
    document.querySelector(".totalBet .value").textContent = "$" + totalBets.value.toFixed(0);
    document.querySelector(".totalPayout .value").textContent = "$" + totalPayouts.value.toFixed(0);
    document.querySelector(".totalPending .value").textContent = "$" + pendings.value.toFixed(0);

    dashBoardTotalBarchart.update();
  } catch (error) {
    console.error("Error fetching data", error);
  } finally {
    // Remove blur effect from canvas and profit elements
    canvasElement.style.filter = "";
    cardAmount.forEach((element) => (element.style.backgroundColor = ""));
    cardSpan.forEach((element) => (element.style.backgroundColor = ""));
    cardSpan.forEach((element) => (element.style.color = "var(--darkestgray)"));
  }
}

function updateMonthCharts(category) {
  let wins = 0;
  let losses = 0;
  let positives = 0;
  let negatives = 0;
  let monthTotalProfit = 0;
  let monthBarCategory = [];
  let monthBarData = {};
  let barColors = [];

  const canvasElement = document.querySelector(".dashboard.section canvas");
  canvasElement.style.filter = "blur(2px)";

  if (category == undefined) {
    category = monthBarChartToggle.className;
  }

  let entries = currentFilter
    ? document.querySelectorAll(".entryContainer.filter")
    : document.querySelectorAll(".entryContainer");
  entries.forEach((entry) => {
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

    outcome > 0 ? (wins += +outcome) : win ? (losses += +outcome) : (losses += 0);
    outcome > 0 ? positives++ : "";
    outcome < 0 ? negatives++ : "";

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
  document.querySelector(".doughnut.sub.ratio").innerHTML = `${positives}/${negatives}`;

  let sortedData = Object.entries(monthBarData).sort((a, b) => b[1] - a[1]);

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
    monthDoughnutProfit.data.datasets[0].data = [wins, losses];
    monthDoughnutProfit.data.datasets[0].backgroundColor = ["rgb(46, 204, 113)", "rgb(231, 76, 60)"];
  }

  monthDoughnutProfit.update();
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

async function updateAddLists() {
  let casinoContainerList = document.querySelector(".addCasinosList");
  let campaignContainerList = document.querySelector(".addCampaignsList");
  const casinos = await getMisc("Casinos");
  const campaigns = await getMisc("Campaigns");

  for (let i = 0; i < 10; i++) {
    let offline_element = document.createElement("div");
    offline_element.setAttribute("class", "offline_element");
    //casinoContainerList.appendChild(offline_element);
  }

  for (let i = 0; i < 10; i++) {
    let offline_element = document.createElement("div");
    offline_element.setAttribute("class", "offline_element");
    //campaignContainerList.appendChild(offline_element);
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

    casinoContainerList.innerHTML = "";

    casinos.forEach((casino) => {
      let casinoContainer = document.createElement("div");
      casinoContainer.setAttribute("class", "casinoContainer addListContainer");

      let casinoCount = 0;
      entries.forEach((entry) => {
        if (casino == entry.casino) {
          casinoCount++;
        }
      });

      casinoContainer.innerHTML = `<span>${casino}</span><span>${casinoCount}</span>`;

      casinoContainerList.append(casinoContainer);
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
      campaignContainer.setAttribute("class", "campaignContainer addListContainer");

      let campaignCount = 0;
      entries.forEach((entry) => {
        if (campaign == entry.campaign) {
          campaignCount++;
        }
      });

      campaignContainer.innerHTML = `<span>${campaign}</span><span>${campaignCount}</span>`;

      campaignContainerList.append(campaignContainer);
    });
  } catch (error) {
    console.error("Error updating list", error);
  }

  let elements = document.querySelectorAll(".addContainer .addList div");

  document.querySelectorAll(".addListContainer").forEach((filterContainerSpan) => {
    if (filterContainerSpan.children[0].innerHTML == currentFilter) {
      filterContainerSpan.classList.add("selected");
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
        currentFilter = null;
      } else {
        document.querySelectorAll(".addContainer .addList div").forEach((e) => {
          e.classList.remove("selected");
        });
        this.classList.add("selected");
        currentFilter = this.children[0].innerHTML;
      }
      filterEntries(this.classList[0].slice(0, -9));
      updateList();
    };
  });
}

function filterEntries(category) {
  let entries = document.querySelectorAll(".entryContainer");
  let filteredEntries = [];

  entries.forEach((entry) => {
    let filterType = category == "casino" ? entry.children[1].innerHTML : entry.children[2].innerHTML;
    if (currentFilter) {
      if (filterType !== currentFilter) {
        entry.style.display = "none";
      } else {
        entry.classList.toggle("filter");
        filteredEntries.push(entry);
      }
    }
  });
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
    addList: getSortingFunction(1, parseProfit),
  };

  if (sort in sortMapping) {
    entriesArray.sort(sortMapping[sort]);
  }

  entries.innerHTML = "";
  entriesArray.forEach((entry) => entries.appendChild(entry));
}

let dashBoardTotalBarchart = new Chart("chart_profits", {
  type: "bar",
  data: {
    labels: [],
    datasets: [
      {
        data: [],
        borderRadius: 10,
        borderSkipped: false,
        backgroundColor: [],
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
      },
      x: {
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
    onClick: (event) => {
      const points = dashBoardTotalBarchart.getElementsAtEventForMode(event, "nearest", { intersect: true }, false);

      if (points.length) {
        const firstPoint = points[0];
        const month = dashBoardTotalBarchart.data.labels[firstPoint.index];

        currentMonth = months.indexOf(month);
        localStorage.setItem("currentMonth", currentMonth);
        currentFilter = null;

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

let monthDoughnutProfit = new Chart("monthChart_doughnut_profits", {
  type: "doughnut",
  data: {
    labels: ["Wins", "Losses"],
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

let monthBarProfits = new Chart("monthChart_barchart", {
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

updateDashboard("totalProfit");
changeMonth();
