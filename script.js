// Cherry blossom calculator logic with flower buttons & history toggle
const expressionEl = document.getElementById("expression");
const resultEl     = document.getElementById("result");
const btnContainer = document.getElementById("buttons");
const historyPanel = document.getElementById("history-panel");
const historyToggle = document.getElementById("history-toggle");
const historyListEl = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history");

let currentNum = "";
let previousNum = "";
let operator = null;
let history = [];

/* Inject SVG flower shapes */
function injectFlowerSVGs() {
  const svgs = document.querySelectorAll(".flower-svg");
  svgs.forEach(svg => {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const ns = "http://www.w3.org/2000/svg";
    const defs = document.createElementNS(ns, "defs");

    const gradients = [
      ["petalGradient","#ffe8f2","#ffd1e8"],
      ["operatorGradient","#ffe1d9","#ffd1e0"],
      ["functionGradient","#fff1f6","#ffe5ef"],
      ["equalGradient","#ff9fcf","#ff7fb0"],
    ];

    gradients.forEach(([id,c1,c2])=>{
      const g = document.createElementNS(ns,"linearGradient");
      g.id=id;
      g.setAttribute("x1","0%");
      g.setAttribute("y1","0%");
      g.setAttribute("x2","100%");
      g.setAttribute("y2","100%");
      const s1 = document.createElementNS(ns,"stop");
      const s2 = document.createElementNS(ns,"stop");
      s1.setAttribute("offset","0%");
      s1.setAttribute("stop-color",c1);
      s2.setAttribute("offset","100%");
      s2.setAttribute("stop-color",c2);
      g.appendChild(s1);
      g.appendChild(s2);
      defs.appendChild(g);
    });

    svg.appendChild(defs);

    const path = document.createElementNS(ns, "path");
    path.setAttribute(
      "d",
      "M50 28 C54 18, 70 18, 72 28 C82 30, 88 42, 80 50 C82 58, 76 70, 66 68 C58 76, 50 86, 50 86 C50 86, 42 76, 34 68 C24 70, 18 58, 20 50 C12 42, 18 30, 28 28 C30 18, 46 18, 50 28 Z"
    );
    path.setAttribute("fill","url(#petalGradient)");
    path.setAttribute("stroke","rgba(255,255,255,0.45)");
    path.setAttribute("stroke-width","1.2");
    svg.appendChild(path);
  });
}

function updateDisplay() {
  if (previousNum && operator && currentNum) {
    expressionEl.textContent = `${previousNum} ${operator} ${currentNum}`;
  } else if (previousNum && operator) {
    expressionEl.textContent = `${previousNum} ${operator}`;
  } else {
    expressionEl.textContent = "";
  }
  resultEl.textContent = currentNum || previousNum || "0";
}

/* Number input */
function appendNumber(v) {
  if (v === "." && currentNum.includes(".")) return;
  currentNum += v;
  updateDisplay();
}

/* Operator input */
function doOperator(op) {
  if (!currentNum && !previousNum) return;

  if (previousNum && !currentNum) {
    operator = op;
    updateDisplay();
    return;
  }

  if (previousNum && currentNum) compute();

  operator = op;
  previousNum = currentNum || previousNum;
  currentNum = "";
  updateDisplay();
}

/* NEW REAL % BEHAVIOR — KEEP % IN DISPLAY */

function applyPercentDisplay() {
  if (!currentNum) return;

  // Just append % (visually) — DO NOT convert
  if (!currentNum.endsWith("%")) {
    currentNum += "%";
  }

  updateDisplay();
}

function percentToValue(base, percentStr) {
  const raw = parseFloat(percentStr.replace("%", ""));
  return base * (raw / 100);
}

/* Compute */
function compute() {
  if (!previousNum || !currentNum || !operator) return;

  let a = parseFloat(previousNum);
  let b;

  // If percent is used: 40% turns into 0.4 * a
  if (currentNum.endsWith("%")) {
    b = percentToValue(a, currentNum);
  } else {
    b = parseFloat(currentNum);
  }

  if (Number.isNaN(a) || Number.isNaN(b)) return;

  if (operator === "/" && b === 0) {
    resultEl.textContent = "Error";
    previousNum = "";
    currentNum = "";
    operator = null;
    return;
  }

  let res;
  switch (operator) {
    case "+": res = a + b; break;
    case "-": res = a - b; break;
    case "*": res = a * b; break;
    case "/": res = a / b; break;
  }

  // Save full expression exactly as typed (with %)
  addHistoryEntry(`${previousNum} ${operator} ${currentNum}`, res);

  resultEl.textContent = res;
  previousNum = res.toString();
  currentNum = "";
  operator = null;
  updateDisplay();
}

/* History */
function addHistoryEntry(expression, result) {
  history.unshift({ expression, result });
  renderHistory();
}

function renderHistory() {
  historyListEl.innerHTML = "";
  history.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.textContent = `${item.expression} = ${item.result}`;
    div.addEventListener("click", () => {
      currentNum = item.result.toString();
      previousNum = "";
      operator = null;
      updateDisplay();
    });
    historyListEl.appendChild(div);
  });
}

/* Clear / Delete */
function clearAll() {
  currentNum = "";
  previousNum = "";
  operator = null;
  updateDisplay();
}

function deleteLast() {
  currentNum = currentNum.slice(0, -1);
  updateDisplay();
}

/* Events */
function wireEvents() {
  injectFlowerSVGs();

  document.querySelectorAll(".flower").forEach(btn => {
    const action = btn.dataset.action || null;
    const val = btn.dataset.value || null;

    btn.addEventListener("click", () => {
      if (action === "clear") clearAll();
      else if (action === "delete") deleteLast();
      else if (action === "=") compute();
      else if (["/","*","-","+"].includes(action)) doOperator(action);
      else if (val === "%") applyPercentDisplay();
      else if (val === ".") appendNumber(".");
      else if (val !== null) appendNumber(val);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key >= "0" && e.key <= "9") appendNumber(e.key);
    else if (e.key === ".") appendNumber(".");
    else if (["+", "-", "*", "/"].includes(e.key)) doOperator(e.key);
    else if (e.key === "Enter") compute();
    else if (e.key === "Backspace") deleteLast();
    else if (e.key.toLowerCase() === "c") clearAll();
    else if (e.key === "%") applyPercentDisplay();
  });

  historyToggle.addEventListener("click", () => {
    historyPanel.classList.toggle("hidden");
  });

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      history = [];
      renderHistory();
    });
  }
}

wireEvents();
updateDisplay();
renderHistory();
