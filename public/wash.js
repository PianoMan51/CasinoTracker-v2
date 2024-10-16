let washBets = document.querySelectorAll(".wash-bet-input");
let washProfits = document.querySelectorAll(".wash-profit");
let washWins = document.querySelectorAll(".wash-payout");
let washGreens = document.querySelectorAll(".wash-green");

let totalWin = document.getElementById("wash-totalWin");
let green = document.getElementById("wash-green");
let totalBet = document.getElementById("wash-totalbet");
let grossProfit = document.getElementById("wash-grossProfit");
let netProfit = document.getElementById("wash-netProfit");

function updateWash() {
  let totalBetAmount = 0;

  washBets.forEach((bet) => {
    totalBetAmount += bet.value ? Number(bet.value) : "";
  });

  totalBet.innerHTML = totalBetAmount;
  grossProfit.innerHTML = totalWin.value - totalBetAmount;
  netProfit.innerHTML = grossProfit.innerHTML - green.value;

  washProfits.forEach((profit, index) => {
    washBets[index].value ? (profit.innerHTML = ((washBets[index].value / totalBetAmount) * netProfit.innerHTML).toFixed(0)) : "";
  });

  washWins.forEach((win, index) => {
    washBets[index].value ? (win.innerHTML = Number(washBets[index].value) + Number(washGreens[index].innerHTML) + Number(washProfits[index].innerHTML)) : "";
  });

  document.getElementById("wash-percentageBonus").innerHTML = 
  totalWin.value ? ((document.querySelector(".wash-profit").innerHTML / document.querySelector(".wash-bet-input").value) * 100).toFixed(0) + "%": "";
}

function toggleGreen() {
  document.querySelectorAll(".wash-green").forEach((cell) => {
    cell.addEventListener("click", () => {
      if (green.value) {
        document.querySelectorAll(".wash-green").forEach((other) => {
          other.classList.remove("active");
          other.innerHTML = "";
        });

        cell.classList.toggle("active");
        cell.innerHTML = green.value;
        updateWash();
      }
    });
  });
}

toggleGreen();
