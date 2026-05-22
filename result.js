const STORAGE_KEY = "student-credit-modules";
const SETTINGS_KEY = "student-credit-settings";
const PASS_MARK = 50;

const averageMarkElement = document.getElementById("resultAverageMark");
const passRateElement = document.getElementById("resultPassRate");
const completionElement = document.getElementById("resultCompletion");
const requiredCreditsElement = document.getElementById("resultRequiredCredits");

const pieElement = document.getElementById("creditPie");
const pieCenterPercentElement = document.getElementById("pieCenterPercent");
const piePassedCreditsElement = document.getElementById("piePassedCredits");
const piePassedPercentElement = document.getElementById("piePassedPercent");
const pieFailedCreditsElement = document.getElementById("pieFailedCredits");
const pieFailedPercentElement = document.getElementById("pieFailedPercent");

const markBarsElement = document.getElementById("markBars");
const barsEmptyElement = document.getElementById("barsEmpty");
const resultsTableBody = document.getElementById("resultsTableBody");
const moduleCountElement = document.getElementById("resultsModuleCount");
const resultsYearElement = document.getElementById("resultsYear");

let modules = [];
let requiredCredits = 120;

function loadModules() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    modules = [];
    return;
  }

  try {
    const parsed = JSON.parse(stored);
    modules = Array.isArray(parsed)
      ? parsed
          .map((moduleItem) => ({
            id: String(moduleItem.id || ""),
            name: String(moduleItem.name || "").trim(),
            credits: Number(moduleItem.credits),
            mark: Number(moduleItem.mark),
            semester: String(moduleItem.semester || "").trim(),
          }))
          .filter(
            (moduleItem) =>
              moduleItem.name &&
              moduleItem.semester &&
              Number.isFinite(moduleItem.credits) &&
              moduleItem.credits > 0 &&
              Number.isFinite(moduleItem.mark) &&
              moduleItem.mark >= 0 &&
              moduleItem.mark <= 100
          )
      : [];
  } catch (error) {
    modules = [];
  }
}

function loadSettings() {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    requiredCredits = 120;
    return;
  }

  try {
    const parsed = JSON.parse(stored);
    const value = Number(parsed.requiredCredits);
    requiredCredits = value > 0 ? value : 120;
  } catch (error) {
    requiredCredits = 120;
  }
}

function calculateStats() {
  const totalCredits = modules.reduce(
    (sum, moduleItem) => sum + moduleItem.credits,
    0
  );
  const passedCredits = modules
    .filter((moduleItem) => moduleItem.mark >= PASS_MARK)
    .reduce((sum, moduleItem) => sum + moduleItem.credits, 0);
  const failedCredits = totalCredits - passedCredits;

  const averageMark =
    modules.length > 0
      ? modules.reduce((sum, moduleItem) => sum + moduleItem.mark, 0) /
        modules.length
      : 0;

  const passRate = totalCredits > 0 ? (passedCredits / totalCredits) * 100 : 0;
  const completionPercent =
    requiredCredits > 0 ? (passedCredits / requiredCredits) * 100 : 0;

  return {
    totalCredits,
    passedCredits,
    failedCredits,
    averageMark,
    passRate,
    completionPercent,
  };
}

function updateSummary(stats) {
  averageMarkElement.textContent = `${stats.averageMark.toFixed(1)}%`;
  passRateElement.textContent = `${stats.passRate.toFixed(1)}%`;
  completionElement.textContent = `${stats.completionPercent.toFixed(1)}%`;
  requiredCreditsElement.textContent = String(requiredCredits);
}

function updatePieChart(stats) {
  const hasCredits = stats.totalCredits > 0;
  const passedPercent = hasCredits ? stats.passRate : 0;
  const failedPercent = hasCredits ? 100 - passedPercent : 0;
  const safePassedPercent = Math.max(0, Math.min(passedPercent, 100));

  pieElement.style.background = hasCredits
    ? `conic-gradient(var(--success) 0% ${safePassedPercent}%, #ffd8d4 ${safePassedPercent}% 100%)`
    : "conic-gradient(#e2e8f0 0% 100%)";
  pieCenterPercentElement.textContent = `${passedPercent.toFixed(1)}%`;

  piePassedCreditsElement.textContent = String(stats.passedCredits);
  piePassedPercentElement.textContent = `${passedPercent.toFixed(1)}%`;
  pieFailedCreditsElement.textContent = String(stats.failedCredits);
  pieFailedPercentElement.textContent = `${failedPercent.toFixed(1)}%`;
}

function createBar(moduleItem) {
  const row = document.createElement("div");
  row.className = "bar-row";

  const head = document.createElement("div");
  head.className = "bar-head";

  const moduleName = document.createElement("span");
  moduleName.textContent = moduleItem.name;

  const mark = document.createElement("span");
  mark.textContent = `${moduleItem.mark.toFixed(1)}%`;

  head.append(moduleName, mark);

  const track = document.createElement("div");
  track.className = "bar-track";

  const fill = document.createElement("div");
  fill.className = `bar-fill ${moduleItem.mark >= PASS_MARK ? "pass" : "fail"}`;
  fill.style.width = `${moduleItem.mark}%`;
  fill.setAttribute("aria-label", `${moduleItem.name} mark ${moduleItem.mark.toFixed(1)} percent`);

  track.appendChild(fill);
  row.append(head, track);
  return row;
}

function updateMarkGraph() {
  markBarsElement.innerHTML = "";
  if (modules.length === 0) {
    barsEmptyElement.style.display = "block";
    return;
  }

  const sortedModules = [...modules].sort((a, b) => b.mark - a.mark);
  sortedModules.forEach((moduleItem) => {
    markBarsElement.appendChild(createBar(moduleItem));
  });
  barsEmptyElement.style.display = "none";
}

function createTableRow(moduleItem) {
  const row = document.createElement("tr");

  const nameCell = document.createElement("td");
  nameCell.textContent = moduleItem.name;

  const creditsCell = document.createElement("td");
  creditsCell.textContent = String(moduleItem.credits);

  const markCell = document.createElement("td");
  markCell.textContent = `${moduleItem.mark.toFixed(1)}%`;

  const semesterCell = document.createElement("td");
  semesterCell.textContent = moduleItem.semester;

  const statusCell = document.createElement("td");
  const statusBadge = document.createElement("span");
  statusBadge.className = `result-badge ${moduleItem.mark >= PASS_MARK ? "pass" : "fail"}`;
  statusBadge.textContent = moduleItem.mark >= PASS_MARK ? "Passed" : "Failed";
  statusCell.appendChild(statusBadge);

  row.append(nameCell, creditsCell, markCell, semesterCell, statusCell);
  return row;
}

function updateResultsTable() {
  resultsTableBody.innerHTML = "";
  modules.forEach((moduleItem) => {
    resultsTableBody.appendChild(createTableRow(moduleItem));
  });
  moduleCountElement.textContent = `${modules.length} ${
    modules.length === 1 ? "module" : "modules"
  }`;
}

function initResultsPage() {
  resultsYearElement.textContent = new Date().getFullYear();
  loadModules();
  loadSettings();
  const stats = calculateStats();
  updateSummary(stats);
  updatePieChart(stats);
  updateMarkGraph();
  updateResultsTable();
}

initResultsPage();
