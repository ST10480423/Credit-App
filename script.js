const STORAGE_KEY = "student-credit-modules";
const SETTINGS_KEY = "student-credit-settings";
const PASS_MARK = 50;

const moduleForm = document.getElementById("moduleForm");
const nameInput = document.getElementById("moduleName");
const creditsInput = document.getElementById("moduleCredits");
const markInput = document.getElementById("moduleMark");
const semesterInput = document.getElementById("moduleSemester");
const requiredCreditsInput = document.getElementById("requiredCredits");
const errorElement = document.getElementById("formError");

const totalCreditsElement = document.getElementById("totalCredits");
const passedCreditsElement = document.getElementById("passedCredits");
const failedCreditsElement = document.getElementById("failedCredits");
const averageMarkElement = document.getElementById("averageMark");

const completionPercentElement = document.getElementById("completionPercent");
const completionBarElement = document.getElementById("completionBar");
const passRateElement = document.getElementById("passRate");
const passRateBarElement = document.getElementById("passRateBar");
const academicStatusElement = document.getElementById("academicStatus");
const moduleCountElement = document.getElementById("moduleCount");

const moduleTableBody = document.getElementById("moduleTableBody");
const emptyStateElement = document.getElementById("emptyState");
const currentYearElement = document.getElementById("currentYear");

let modules = [];

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
            id: String(moduleItem.id || getModuleId()),
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

function saveModules() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
}

function loadSettings() {
  const defaultRequiredCredits = 120;
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    requiredCreditsInput.value = defaultRequiredCredits;
    return;
  }

  try {
    const parsed = JSON.parse(stored);
    const value = Number(parsed.requiredCredits);
    requiredCreditsInput.value = value > 0 ? value : defaultRequiredCredits;
  } catch (error) {
    requiredCreditsInput.value = defaultRequiredCredits;
  }
}

function saveSettings() {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({ requiredCredits: getRequiredCredits() })
  );
}

function getRequiredCredits() {
  const value = Number(requiredCreditsInput.value);
  if (value > 0) return value;
  return 120;
}

function validateForm() {
  const name = nameInput.value.trim();
  const credits = Number(creditsInput.value);
  const mark = Number(markInput.value);
  const semester = semesterInput.value.trim();

  if (!name || !semester || !creditsInput.value || !markInput.value) {
    return "Please complete all module fields.";
  }

  if (!Number.isFinite(credits) || credits <= 0) {
    return "Credits must be a positive number.";
  }

  if (!Number.isFinite(mark) || mark < 0 || mark > 100) {
    return "Mark must be a number between 0 and 100.";
  }

  return "";
}

function calculateStats() {
  const totalCredits = modules.reduce(
    (sum, moduleItem) => sum + Number(moduleItem.credits),
    0
  );

  const passedCredits = modules
    .filter((moduleItem) => Number(moduleItem.mark) >= PASS_MARK)
    .reduce((sum, moduleItem) => sum + Number(moduleItem.credits), 0);

  const failedCredits = totalCredits - passedCredits;

  const averageMark =
    modules.length > 0
      ? modules.reduce((sum, moduleItem) => sum + Number(moduleItem.mark), 0) /
        modules.length
      : 0;

  const requiredCredits = getRequiredCredits();
  const completionPercent =
    requiredCredits > 0 ? (passedCredits / requiredCredits) * 100 : 0;
  const passRate =
    totalCredits > 0 ? (passedCredits / totalCredits) * 100 : 0;

  return {
    totalCredits,
    passedCredits,
    failedCredits,
    averageMark,
    completionPercent,
    passRate,
    requiredCredits,
  };
}

function getAcademicStatus(completionPercent, averageMark, totalCredits) {
  if (totalCredits === 0) return "No modules added yet.";
  if (completionPercent >= 100) return "Outstanding: required credits achieved.";
  if (averageMark >= 75) return "Excellent progress: keep the momentum.";
  if (averageMark >= 60) return "Good progress: you are on track.";
  if (averageMark >= PASS_MARK) return "Steady progress: focus on weaker modules.";
  return "At risk: support is needed to improve marks.";
}

function updateDashboard(stats) {
  totalCreditsElement.textContent = String(stats.totalCredits);
  passedCreditsElement.textContent = String(stats.passedCredits);
  failedCreditsElement.textContent = String(stats.failedCredits);
  averageMarkElement.textContent = `${stats.averageMark.toFixed(1)}%`;
}

function updateProgress(stats) {
  const safeCompletion = Math.max(0, Math.min(stats.completionPercent, 100));
  const safePassRate = Math.max(0, Math.min(stats.passRate, 100));

  completionPercentElement.textContent = `${stats.completionPercent.toFixed(1)}%`;
  completionBarElement.style.width = `${safeCompletion}%`;

  passRateElement.textContent = `${stats.passRate.toFixed(1)}%`;
  passRateBarElement.style.width = `${safePassRate}%`;

  academicStatusElement.textContent = getAcademicStatus(
    stats.completionPercent,
    stats.averageMark,
    stats.totalCredits
  );
}

function createModuleRow(moduleItem) {
  const row = document.createElement("tr");
  const moduleCell = document.createElement("td");
  moduleCell.textContent = moduleItem.name;

  const creditsCell = document.createElement("td");
  creditsCell.textContent = String(Number(moduleItem.credits));

  const markCell = document.createElement("td");
  markCell.textContent = `${Number(moduleItem.mark).toFixed(1)}%`;

  const semesterCell = document.createElement("td");
  semesterCell.textContent = moduleItem.semester;

  const actionCell = document.createElement("td");
  const deleteButton = document.createElement("button");
  deleteButton.className = "btn btn-delete";
  deleteButton.type = "button";
  deleteButton.dataset.id = moduleItem.id;
  deleteButton.textContent = "Delete";
  actionCell.appendChild(deleteButton);

  row.append(moduleCell, creditsCell, markCell, semesterCell, actionCell);
  return row;
}

function updateModuleList() {
  moduleTableBody.innerHTML = "";
  modules.forEach((moduleItem) => {
    moduleTableBody.appendChild(createModuleRow(moduleItem));
  });

  moduleCountElement.textContent = `${modules.length} ${
    modules.length === 1 ? "module" : "modules"
  }`;

  emptyStateElement.style.display = modules.length === 0 ? "block" : "none";
}

function updateUI() {
  const stats = calculateStats();
  updateDashboard(stats);
  updateProgress(stats);
  updateModuleList();
}

function resetForm() {
  moduleForm.reset();
  errorElement.textContent = "";
  nameInput.focus();
}

function addModule(event) {
  event.preventDefault();
  const validationMessage = validateForm();
  if (validationMessage) {
    errorElement.textContent = validationMessage;
    return;
  }

  const newModule = {
    id: getModuleId(),
    name: nameInput.value.trim(),
    credits: Number(creditsInput.value),
    mark: Number(markInput.value),
    semester: semesterInput.value.trim(),
  };

  modules.push(newModule);
  saveModules();
  updateUI();
  resetForm();
}

function deleteModuleById(moduleId) {
  modules = modules.filter((moduleItem) => moduleItem.id !== moduleId);
  saveModules();
  updateUI();
}

function handleTableClick(event) {
  const button = event.target.closest("[data-id]");
  if (!button) return;
  deleteModuleById(button.dataset.id);
}

function handleRequiredCreditsInput() {
  const value = Number(requiredCreditsInput.value);
  if (Number.isFinite(value) && value > 0) {
    saveSettings();
  }
  updateUI();
}

function normalizeRequiredCredits() {
  const value = Number(requiredCreditsInput.value);
  if (!Number.isFinite(value) || value <= 0) {
    requiredCreditsInput.value = 120;
  }
  saveSettings();
  updateUI();
}

function getModuleId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

function setupEventListeners() {
  moduleForm.addEventListener("submit", addModule);
  moduleTableBody.addEventListener("click", handleTableClick);
  requiredCreditsInput.addEventListener("input", handleRequiredCreditsInput);
  requiredCreditsInput.addEventListener("blur", normalizeRequiredCredits);

  [nameInput, creditsInput, markInput, semesterInput].forEach((input) => {
    input.addEventListener("input", () => {
      errorElement.textContent = "";
    });
  });
}

function initApp() {
  currentYearElement.textContent = new Date().getFullYear();
  loadModules();
  loadSettings();
  setupEventListeners();
  updateUI();
}

initApp();
