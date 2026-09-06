(function () {
  "use strict";

  var masterData = window.MasterData || {};
  var gradeLevels = masterData.gradeLevels || [];
  var difficultyLevels = masterData.difficultyLevels || [];
  var problemSubjects = masterData.problemSubjects || window.ProblemBank.categories;
  var dbTopics = [];
  var dbDeckByTopic = {};
  var problemCountOptions = masterData.problemCountOptions || [5, 10, 15, 20];
  var totalProblems = 10;
  var visibleProgressCount = 5;
  var selectedCategory = "addition";
  var selectedGradeCode = "P2";
  var selectedLearningLevel = 3;
  var currentProblemIndex = 0;
  var problems = [];
  var answersByProblem = [];
  var submittedByProblem = [];
  var elapsedSecondsByProblem = [];
  var problemSetKey = "mathssolve.kids.problemSet.v1";
  var practiceConfigKey = "mathssolve.kids.practiceConfig.v1";
  var scratchKey = "mathssolve.kids.scratch.image";
  var activeTool = "pen";
  var isDrawing = false;
  var lastPoint = null;
  var saveTimer = null;
  var answerDigits = defaultAnswerDigits();
  var decimalPointNode = null;
  var problemTimer = null;
  var problemTimerStartedAt = 0;
  var problemElapsedSeconds = 0;
  var fitTextFrame = null;
  var scratchReady = false;

  var setupScreen = document.getElementById("setupScreen");
  var practiceScreen = document.getElementById("practiceScreen");
  var setupForm = document.getElementById("setupForm");
  var categoryOptions = document.getElementById("categoryOptions");
  var gradeSelect = document.getElementById("gradeSelect");
  var learningLevelInput = document.getElementById("learningLevelInput");
  var learningLevelValue = document.getElementById("learningLevelValue");
  var levelDescription = document.getElementById("levelDescription");
  var countOptions = document.getElementById("countOptions");
  var setupSummary = document.getElementById("setupSummary");
  var problemNumber = document.getElementById("problemNumber");
  var problemText = document.getElementById("problemText");
  var questionProgress = document.getElementById("questionProgress");
  var timerDisplay = document.getElementById("timerDisplay");
  var timerText = timerDisplay ? timerDisplay.querySelector("span") : null;
  var answerDisplay = document.getElementById("answerDisplay");
  var answerBubbleGrid = document.getElementById("answerBubbleGrid");
  var submitStatus = document.getElementById("submitStatus");
  var scratchCanvas = document.getElementById("scratchCanvas");
  var scratchContext = scratchCanvas.getContext("2d");
  var penToolButton = document.getElementById("penToolButton");
  var eraserToolButton = document.getElementById("eraserToolButton");
  var penSizeInput = document.getElementById("penSizeInput");
  var prevProblemButton = document.getElementById("prevProblemButton");
  var nextProblemButton = document.getElementById("nextProblemButton");
  var submitAnswerButton = document.getElementById("submitAnswerButton");
  var clearScratchButton = document.getElementById("clearScratchButton");
  var backToSetupButton = document.getElementById("backToSetupButton");

  bindSetupEvents();
  renderAnswerSheet();
  bootstrap();

  // Waits for the DB-backed topics to load before the setup screen renders
  // and restores the saved config — otherwise a previously-selected DB
  // topic would fail its "does this category still exist" check (dbTopics
  // is still empty at that point) and silently reset to "addition".
  async function bootstrap() {
    await loadDbTopics();
    renderSetupControls();
    restorePracticeConfig();
    updateSetupControls();
    openInitialScreen();
  }

  function renderSetupControls() {
    categoryOptions.innerHTML = "";
    allCategories().forEach(function (category) {
      var button = document.createElement("button");
      var symbol = document.createElement("span");
      var label = document.createElement("span");

      button.type = "button";
      button.className = "category-choice";
      button.dataset.category = category.id;
      button.setAttribute("aria-pressed", "false");

      symbol.className = "category-symbol";
      symbol.textContent = category.short;

      label.className = "category-label";
      label.textContent = category.label;

      button.appendChild(symbol);
      button.appendChild(label);
      button.addEventListener("click", function () {
        selectedCategory = category.id;
        updateSetupControls();
      });

      categoryOptions.appendChild(button);
    });

    gradeSelect.innerHTML = "";
    gradeLevels.forEach(function (grade) {
      var option = document.createElement("option");
      option.value = grade.code;
      option.textContent = grade.label;
      gradeSelect.appendChild(option);
    });

    countOptions.innerHTML = "";
    problemCountOptions.forEach(function (count) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "count-choice";
      button.dataset.count = String(count);
      button.textContent = count + " ข้อ";
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", function () {
        totalProblems = count;
        updateSetupControls();
      });
      countOptions.appendChild(button);
    });
  }

  function bindSetupEvents() {
    setupForm.addEventListener("submit", function (event) {
      event.preventDefault();
      startNewPracticeSession();
    });

    gradeSelect.addEventListener("change", function () {
      selectedGradeCode = gradeSelect.value;
      updateSetupControls();
    });

    learningLevelInput.addEventListener("input", function () {
      selectedLearningLevel = normalizeLearningLevel(learningLevelInput.value);
      updateSetupControls();
    });

    clearScratchButton.addEventListener("click", function () {
      clearScratch();
      localStorage.removeItem(scratchKey);
    });

    submitAnswerButton.addEventListener("click", submitAnswer);

    prevProblemButton.addEventListener("click", function () {
      navigateToUnsubmittedProblem(-1);
    });

    nextProblemButton.addEventListener("click", function () {
      navigateToUnsubmittedProblem(1);
    });

    backToSetupButton.addEventListener("click", function () {
      showSetupScreen();
      history.pushState(null, "", window.location.pathname + window.location.search);
    });

    penToolButton.addEventListener("click", function () {
      setTool("pen");
    });

    eraserToolButton.addEventListener("click", function () {
      setTool("eraser");
    });

    window.addEventListener("hashchange", openInitialScreen);
    window.addEventListener("beforeunload", stopProblemTimer);
  }

  function openInitialScreen() {
    if (window.location.hash === "#practice" && restoreProblemSet()) {
      showPracticeScreen();
      return;
    }

    showSetupScreen();
  }

  function showSetupScreen() {
    stopProblemTimer();
    setupScreen.hidden = false;
    practiceScreen.classList.add("is-hidden");
    practiceScreen.setAttribute("aria-hidden", "true");
    setupScreen.removeAttribute("aria-hidden");
    updateSetupControls();
  }

  function showPracticeScreen() {
    setupScreen.hidden = true;
    setupScreen.setAttribute("aria-hidden", "true");
    practiceScreen.classList.remove("is-hidden");
    practiceScreen.removeAttribute("aria-hidden");
    setupScratchPadOnce();

    window.requestAnimationFrame(function () {
      resizeScratchCanvas();
      showProblem(currentProblemIndex);
    });
  }

  function startNewPracticeSession() {
    selectedGradeCode = gradeSelect.value;
    selectedLearningLevel = normalizeLearningLevel(learningLevelInput.value);
    savePracticeConfig();
    createProblemSet();
    clearScratch();
    localStorage.removeItem(scratchKey);
    history.pushState(null, "", "#practice");
    showPracticeScreen();
  }

  function updateSetupControls() {
    selectedCategory = normalizeCategory(selectedCategory);
    selectedGradeCode = normalizeGradeCode(selectedGradeCode);
    selectedLearningLevel = normalizeLearningLevel(selectedLearningLevel);
    totalProblems = normalizeProblemCount(totalProblems);

    Array.prototype.forEach.call(categoryOptions.children, function (button) {
      var isSelected = button.dataset.category === selectedCategory;
      button.classList.toggle("selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });

    gradeSelect.value = selectedGradeCode;
    learningLevelInput.value = String(selectedLearningLevel);
    learningLevelValue.textContent = String(selectedLearningLevel);
    levelDescription.textContent = selectedDifficultyDescription();
    learningLevelInput.setAttribute(
      "aria-valuetext",
      "ความยากระดับ " + selectedLearningLevel + " " + selectedDifficultyDescription()
    );

    Array.prototype.forEach.call(countOptions.children, function (button) {
      var isSelected = Number(button.dataset.count) === totalProblems;
      button.classList.toggle("selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });

    setupSummary.textContent =
      selectedCategoryLabel() +
      " • " +
      selectedGradeLabel() +
      " • ความยาก " +
      selectedLearningLevel +
      " " +
      selectedDifficultyLabel() +
      " • " +
      totalProblems +
      " ข้อ";

    savePracticeConfig();
  }

  function restorePracticeConfig() {
    try {
      var config = JSON.parse(localStorage.getItem(practiceConfigKey) || "null");

      if (!config) {
        return;
      }

      selectedCategory = normalizeCategory(config.category);
      selectedGradeCode = normalizeGradeCode(config.gradeCode);
      selectedLearningLevel = normalizeLearningLevel(config.learningLevel);
      totalProblems = normalizeProblemCount(config.problemCount);
    } catch (error) {
      localStorage.removeItem(practiceConfigKey);
    }
  }

  function savePracticeConfig() {
    localStorage.setItem(
      practiceConfigKey,
      JSON.stringify(currentPracticeConfig())
    );
  }

  function currentPracticeConfig() {
    return {
      category: selectedCategory,
      categoryLabel: selectedCategoryLabel(),
      gradeCode: selectedGradeCode,
      gradeLabel: selectedGradeLabel(),
      learningLevel: selectedLearningLevel,
      difficultyLevel: selectedLearningLevel,
      difficultyLabel: selectedDifficultyLabel(),
      generatorLevel: generatorLevelForLearningLevel(selectedLearningLevel),
      problemCount: totalProblems
    };
  }

  function selectedCategoryLabel() {
    var category = allCategories().find(function (item) {
      return item.id === selectedCategory;
    });
    return category ? category.label : "บวก";
  }

  function selectedDifficultyLabel() {
    var difficulty = difficultyLevels[selectedLearningLevel - 1];
    return difficulty ? difficulty.label : "เริ่มคิด";
  }

  function selectedDifficultyDescription() {
    var difficulty = difficultyLevels[selectedLearningLevel - 1];
    return difficulty ? difficulty.description : "มีตัวเลขสองหลักหรือทดเล็กน้อย";
  }

  function selectedGradeLabel() {
    var grade = gradeLevels.find(function (item) {
      return item.code === selectedGradeCode;
    });
    return grade ? grade.short : "ป.2";
  }

  function normalizeCategory(categoryId) {
    var exists = allCategories().some(function (category) {
      return category.id === categoryId;
    });
    return exists ? categoryId : "addition";
  }

  function allCategories() {
    return problemSubjects.concat(dbTopics);
  }

  function normalizeGradeCode(gradeCode) {
    var exists = gradeLevels.some(function (grade) {
      return grade.code === gradeCode;
    });
    return exists ? gradeCode : "P2";
  }

  function normalizeLearningLevel(level) {
    var number = Math.round(Number(level));
    if (!Number.isFinite(number)) {
      return 3;
    }
    return Math.max(1, Math.min(5, number));
  }

  function normalizeProblemCount(count) {
    var number = Math.round(Number(count));
    return problemCountOptions.indexOf(number) === -1 ? 10 : number;
  }

  function generatorLevelForLearningLevel(level) {
    if (level <= 2) {
      return "easy";
    }
    if (level >= 4) {
      return "challenge";
    }
    return "normal";
  }

  function setupProblemSet() {
    if (!restoreProblemSet()) {
      createProblemSet();
    }
  }

  function createProblemSet() {
    dbDeckByTopic = {};
    currentProblemIndex = 0;
    problems = [];
    answersByProblem = [];
    submittedByProblem = [];
    elapsedSecondsByProblem = [];

    for (var index = 0; index < totalProblems; index += 1) {
      problems.push(generateOneProblem(pickGenerationCategory()));
      answersByProblem.push(defaultAnswerDigits());
      submittedByProblem.push(false);
      elapsedSecondsByProblem.push(0);
    }

    saveProblemSet();
  }

  // In "random" mode, roll a fresh real category per problem instead of
  // generating every problem in the set from the same one — that way a
  // random set actually mixes topics question to question. The pool covers
  // both the built-in generator categories and any topics imported into
  // PostgreSQL (dbTopics).
  function pickGenerationCategory() {
    if (selectedCategory === "random_db") {
      if (!dbTopics.length) {
        return "addition";
      }
      return dbTopics[Math.floor(Math.random() * dbTopics.length)].id;
    }

    if (selectedCategory !== "random") {
      return selectedCategory;
    }

    var realCategories = allCategories().filter(function (category) {
      return category.id !== "random" && category.id !== "random_db";
    });

    if (!realCategories.length) {
      return "addition";
    }

    return realCategories[Math.floor(Math.random() * realCategories.length)].id;
  }

  function generateOneProblem(categoryId) {
    var dbTopic = findDbTopic(categoryId);

    if (dbTopic) {
      return generateDbProblem(dbTopic);
    }

    return window.ProblemBank.generate(categoryId, generatorLevelForLearningLevel(selectedLearningLevel));
  }

  function findDbTopic(categoryId) {
    return (
      dbTopics.find(function (topic) {
        return topic.id === categoryId;
      }) || null
    );
  }

  // Draws the next (template, variant) pair from this topic's shuffled deck
  // for the current session instead of rolling independently every time —
  // independent rolls can repeat the same pair while others never show up
  // at all. The deck holds every template x variant combo once, so a set
  // the same size as (or smaller than) the deck never repeats a single one;
  // only once the deck runs out does it reshuffle and start a new lap.
  function generateDbProblem(dbTopic) {
    var deck = dbDeckByTopic[dbTopic.id];

    if (!deck || !deck.length) {
      deck = shuffleArray(buildDbComboDeck(dbTopic));
      dbDeckByTopic[dbTopic.id] = deck;
    }

    var combo = deck.pop();
    var variantValues = (combo.variant && combo.variant.variantValues) || {};

    return {
      category: dbTopic.id,
      categoryLabel: dbTopic.label,
      title: dbTopic.label,
      prompt: renderDbPromptTemplate(combo.template.promptTemplateTh, variantValues),
      expression: "",
      mode: "fraction",
      answerKind: "number",
      answer: variantValues.answer,
      answerDecimalPlaces: Number(combo.template.answerDecimalPlaces) || 0,
      appendedHint: combo.template.hintText || "",
      hint: "",
      visual: null
    };
  }

  // Picks templates matching the current 1-5 difficulty (they map 1:1 onto
  // the levels table) when any exist for this topic, otherwise falls back
  // to every level so a topic with only one imported level still works at
  // every difficulty setting. Every variant of every matching template
  // becomes one card in the deck.
  function buildDbComboDeck(dbTopic) {
    var matchingLevel = dbTopic.templates.filter(function (template) {
      return template.levelId === selectedLearningLevel;
    });
    var pool = matchingLevel.length ? matchingLevel : dbTopic.templates;
    var combos = [];

    pool.forEach(function (template) {
      var variants = Array.isArray(template.variants) ? template.variants : [];
      variants.forEach(function (variant) {
        combos.push({ template: template, variant: variant });
      });
    });

    return combos;
  }

  function shuffleArray(list) {
    for (var index = list.length - 1; index > 0; index -= 1) {
      var swapIndex = Math.floor(Math.random() * (index + 1));
      var temp = list[index];
      list[index] = list[swapIndex];
      list[swapIndex] = temp;
    }
    return list;
  }

  function renderDbPromptTemplate(template, variantValues) {
    return String(template || "").replace(/\{(\w+)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(variantValues, key) ? String(variantValues[key]) : match;
    });
  }

  async function loadDbTopics() {
    try {
      var response = await fetch("/api/practice/problems");

      if (!response.ok) {
        return;
      }

      var data = await response.json();
      var templates = Array.isArray(data.templates) ? data.templates : [];
      var byTopic = {};

      templates.forEach(function (template) {
        if (!byTopic[template.topicCode]) {
          byTopic[template.topicCode] = {
            id: template.topicCode,
            label: template.topicName,
            short: "📥",
            isDbTopic: true,
            templates: []
          };
        }
        byTopic[template.topicCode].templates.push(template);
      });

      dbTopics = Object.keys(byTopic).map(function (code) {
        return byTopic[code];
      });
    } catch (error) {
      dbTopics = [];
    }
  }

  function showProblem(index) {
    if (!problems.length) {
      setupProblemSet();
    }

    currentProblemIndex = Math.max(0, Math.min(totalProblems - 1, index));
    answerDigits = answersByProblem[currentProblemIndex].slice();

    var currentProblem = problems[currentProblemIndex];
    var decimalPlaces = currentAnswerDecimalPlaces();

    problemNumber.textContent = "ข้อที่ " + (currentProblemIndex + 1);
    problemText.textContent = currentProblem.prompt + appendedHintText(currentProblem) + decimalHintText(decimalPlaces);
    submitStatus.textContent = submittedByProblem[currentProblemIndex]
      ? "ส่งคำตอบ " + formatAnswerDigits(answerDigits, decimalPlaces) + " แล้ว"
      : "";

    positionDecimalPoint(decimalPlaces);
    updateAnswerSheet();
    renderProgress();
    updateProblemNavigation();
    saveProblemSet();
    scheduleProblemTextFit();
    startProblemTimer();
  }

  function selectProblem(index) {
    if (index === currentProblemIndex || index < 0 || index >= totalProblems) {
      return;
    }

    stopProblemTimer();
    showProblem(index);
  }

  function renderProgress() {
    questionProgress.innerHTML = "";

    getVisibleProgressIndexes().forEach(function (index) {
      if (index === null) {
        appendProgressSpacer();
        return;
      }

      var button = document.createElement("button");
      var isCurrent = index === currentProblemIndex;
      var isDone = submittedByProblem[index];
      var distance = Math.abs(index - currentProblemIndex);

      button.type = "button";
      button.className =
        "progress-dot" +
        (isCurrent ? " current" : "") +
        (isDone ? " done" : "") +
        (distance > 1 ? " far" : "");
      button.dataset.problemIndex = String(index);
      button.textContent = String(index + 1);
      button.setAttribute("aria-label", progressLabel(index, isDone));
      button.setAttribute("aria-pressed", String(isCurrent));
      if (isCurrent) {
        button.setAttribute("aria-current", "step");
      }
      button.addEventListener("click", function (event) {
        selectProblem(Number(event.currentTarget.dataset.problemIndex));
      });

      questionProgress.appendChild(button);
    });
  }

  function getVisibleProgressIndexes() {
    var visibleCount = Math.min(visibleProgressCount, totalProblems);
    var before = Math.floor(visibleCount / 2);
    var after = visibleCount - before - 1;
    var indexes = [];

    for (var offset = -before; offset <= after; offset += 1) {
      var index = currentProblemIndex + offset;
      indexes.push(index >= 0 && index < totalProblems ? index : null);
    }

    return indexes;
  }

  function appendProgressSpacer() {
    var spacer = document.createElement("span");
    spacer.className = "progress-spacer";
    spacer.setAttribute("aria-hidden", "true");
    questionProgress.appendChild(spacer);
  }

  function navigateToUnsubmittedProblem(direction) {
    var targetIndex = findUnsubmittedProblem(direction);

    if (targetIndex === -1) {
      return;
    }

    selectProblem(targetIndex);
  }

  function findUnsubmittedProblem(direction) {
    var step = direction < 0 ? -1 : 1;

    for (
      var index = currentProblemIndex + step;
      index >= 0 && index < totalProblems;
      index += step
    ) {
      if (!submittedByProblem[index]) {
        return index;
      }
    }

    return -1;
  }

  function updateProblemNavigation() {
    var previousIndex = findUnsubmittedProblem(-1);
    var nextIndex = findUnsubmittedProblem(1);

    prevProblemButton.disabled = previousIndex === -1;
    nextProblemButton.disabled = nextIndex === -1;
    setNavigationButtonLabel(prevProblemButton, previousIndex, "ก่อนหน้า");
    setNavigationButtonLabel(nextProblemButton, nextIndex, "ถัดไป");
  }

  function setNavigationButtonLabel(button, targetIndex, directionText) {
    var label =
      targetIndex === -1
        ? "ไม่มีข้อ" + directionText + "ที่ยังไม่ได้ส่ง"
        : "ไปข้อที่ " + (targetIndex + 1) + " ที่ยังไม่ได้ส่ง";

    button.setAttribute("aria-label", label);
    button.title = label;
  }

  function progressLabel(index, isDone) {
    return "ข้อที่ " + (index + 1) + (isDone ? " ส่งคำตอบแล้ว" : " ยังไม่ได้ส่งคำตอบ");
  }

  function restoreProblemSet() {
    try {
      var saved = JSON.parse(localStorage.getItem(problemSetKey) || "null");
      var savedCount = saved && Array.isArray(saved.problems) ? saved.problems.length : 0;

      if (!saved || !savedCount) {
        return false;
      }

      if (saved.config) {
        selectedCategory = normalizeCategory(saved.config.category);
        selectedGradeCode = normalizeGradeCode(saved.config.gradeCode);
        selectedLearningLevel = normalizeLearningLevel(saved.config.learningLevel);
        totalProblems = normalizeProblemCount(saved.config.problemCount || savedCount);
      } else {
        totalProblems = normalizeProblemCount(savedCount);
      }

      if (savedCount !== totalProblems) {
        return false;
      }

      problems = saved.problems.map(function (problem) {
        if (problem && typeof problem.prompt === "string") {
          return problem;
        }
        return generateOneProblem(pickGenerationCategory());
      });
      answersByProblem = normalizeAnswers(saved.answers);
      submittedByProblem = normalizeBooleanList(saved.submitted);
      elapsedSecondsByProblem = normalizeElapsedList(saved.elapsedSeconds);
      currentProblemIndex =
        Number.isInteger(saved.currentProblemIndex) &&
        saved.currentProblemIndex >= 0 &&
        saved.currentProblemIndex < totalProblems
          ? saved.currentProblemIndex
          : 0;

      updateSetupControls();
      return true;
    } catch (error) {
      return false;
    }
  }

  function saveProblemSet() {
    localStorage.setItem(
      problemSetKey,
      JSON.stringify({
        currentProblemIndex: currentProblemIndex,
        config: currentPracticeConfig(),
        problems: problems,
        answers: answersByProblem,
        submitted: submittedByProblem,
        elapsedSeconds: elapsedSecondsByProblem
      })
    );
  }

  function normalizeAnswers(savedAnswers) {
    var normalized = [];

    for (var index = 0; index < totalProblems; index += 1) {
      normalized.push(normalizeAnswerDigits(savedAnswers && savedAnswers[index]));
    }

    return normalized;
  }

  function normalizeAnswerDigits(digits) {
    if (!Array.isArray(digits) || digits.length !== 5) {
      return defaultAnswerDigits();
    }

    return digits.map(function (digit) {
      return /^\d$/.test(String(digit)) ? String(digit) : "0";
    });
  }

  function normalizeBooleanList(values) {
    var normalized = [];

    for (var index = 0; index < totalProblems; index += 1) {
      normalized.push(Boolean(values && values[index]));
    }

    return normalized;
  }

  function normalizeElapsedList(values) {
    var normalized = [];

    for (var index = 0; index < totalProblems; index += 1) {
      var seconds = Number(values && values[index]);
      normalized.push(Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0);
    }

    return normalized;
  }

  function renderAnswerSheet() {
    answerDisplay.innerHTML = "";
    answerBubbleGrid.innerHTML = "";

    for (var column = 0; column < 5; column += 1) {
      var slot = document.createElement("span");
      slot.className = "answer-slot";
      slot.dataset.column = String(column);
      slot.textContent = "0";
      answerDisplay.appendChild(slot);
    }

    decimalPointNode = document.createElement("span");
    decimalPointNode.className = "answer-decimal-point";
    decimalPointNode.textContent = ".";
    decimalPointNode.setAttribute("aria-hidden", "true");

    for (var digit = 0; digit <= 9; digit += 1) {
      for (var answerColumn = 0; answerColumn < 5; answerColumn += 1) {
        var bubble = document.createElement("button");
        bubble.type = "button";
        bubble.className = "answer-bubble";
        bubble.dataset.column = String(answerColumn);
        bubble.dataset.digit = String(digit);
        bubble.textContent = String(digit);
        bubble.setAttribute("aria-label", "เลือกเลข " + digit + " หลักที่ " + (answerColumn + 1));
        bubble.addEventListener("click", selectAnswerDigit);
        answerBubbleGrid.appendChild(bubble);
      }
    }
  }

  // Moves the "." marker in front of the answer-display slot where the
  // decimal part starts (e.g. decimalPlaces 1 -> before the 5th slot),
  // or removes it entirely for a whole-number answer. Called once per
  // problem shown, since decimalPlaces can differ question to question
  // (e.g. in a random-mixed set).
  function positionDecimalPoint(decimalPlaces) {
    if (decimalPointNode.parentNode) {
      decimalPointNode.parentNode.removeChild(decimalPointNode);
    }

    if (!decimalPlaces) {
      return;
    }

    var slots = answerDisplay.querySelectorAll(".answer-slot");
    var beforeSlot = slots[slots.length - decimalPlaces];
    answerDisplay.insertBefore(decimalPointNode, beforeSlot || null);
  }

  function selectAnswerDigit(event) {
    var button = event.currentTarget;
    var column = Number(button.dataset.column);
    var digit = button.dataset.digit;
    var wasSubmitted = submittedByProblem[currentProblemIndex];

    answerDigits[column] = digit;
    answersByProblem[currentProblemIndex] = answerDigits.slice();
    submittedByProblem[currentProblemIndex] = false;
    updateAnswerSheet();
    renderProgress();
    updateProblemNavigation();
    saveProblemSet();
    submitStatus.textContent = "";

    if (wasSubmitted) {
      startProblemTimer();
    }
  }

  function updateAnswerSheet() {
    // Iterate .answer-slot specifically, not answerDisplay.children — the
    // decimal-point marker also lives in answerDisplay once a decimal-answer
    // problem positions it, and it isn't one of the 5 digit slots.
    Array.prototype.forEach.call(answerDisplay.querySelectorAll(".answer-slot"), function (slot, index) {
      slot.textContent = answerDigits[index];
      slot.classList.toggle("filled", answerDigits[index] !== "");
    });

    Array.prototype.forEach.call(answerBubbleGrid.children, function (bubble) {
      var column = Number(bubble.dataset.column);
      bubble.classList.toggle("selected", answerDigits[column] === bubble.dataset.digit);
      bubble.setAttribute("aria-pressed", String(answerDigits[column] === bubble.dataset.digit));
    });
  }

  function defaultAnswerDigits() {
    return ["0", "0", "0", "0", "0"];
  }

  // 0 for every built-in-generated problem (always whole-number answers);
  // DB-sourced problems carry whatever answer_decimal_places the template
  // was imported with.
  function currentAnswerDecimalPlaces() {
    var problem = problems[currentProblemIndex];
    var places = Math.floor(Number(problem && problem.answerDecimalPlaces));
    return Number.isFinite(places) ? Math.max(0, Math.min(4, places)) : 0;
  }

  // Appended to the prompt automatically so importing a decimal-answer
  // problem never requires typing the instruction into the question text
  // itself — it always matches whatever answer_decimal_places says.
  function decimalHintText(decimalPlaces) {
    if (!decimalPlaces) {
      return "";
    }
    return " (ตอบเป็นทศนิยม " + decimalPlaces + " ตำแหน่ง)";
  }

  // Same idea as decimalHintText, for a template's optional problem_hints
  // row (e.g. "กำหนดให้ π ≈ 22/7") — auto-appended, never typed into the
  // prompt itself. Built-in ProblemBank problems never carry one.
  function appendedHintText(problem) {
    var hintText = problem && problem.appendedHint;
    return hintText ? " (" + hintText + ")" : "";
  }

  // Inserts "." into the 5-digit answer string at the right spot, e.g.
  // digits ["0","0","0","0","1"] with decimalPlaces 1 -> "0000.1".
  function formatAnswerDigits(digits, decimalPlaces) {
    var joined = digits.join("");
    if (!decimalPlaces) {
      return joined;
    }
    var splitAt = joined.length - decimalPlaces;
    return joined.slice(0, splitAt) + "." + joined.slice(splitAt);
  }

  function submitAnswer() {
    var answer = formatAnswerDigits(answerDigits, currentAnswerDecimalPlaces());
    var nextUnsubmittedProblem = -1;

    stopProblemTimer();
    answersByProblem[currentProblemIndex] = answerDigits.slice();
    submittedByProblem[currentProblemIndex] = true;
    nextUnsubmittedProblem = findUnsubmittedProblem(1);
    clearScratch();
    localStorage.removeItem(scratchKey);

    if (nextUnsubmittedProblem !== -1) {
      showProblem(nextUnsubmittedProblem);
      return;
    }

    renderProgress();
    updateProblemNavigation();
    saveProblemSet();
    submitStatus.textContent = "ส่งคำตอบ " + answer + " แล้ว";
  }

  function setupScratchPadOnce() {
    if (scratchReady) {
      return;
    }

    scratchReady = true;
    setupScratchPad();
  }

  function setupScratchPad() {
    resizeScratchCanvas();
    restoreScratch();
    setTool("pen");

    scratchCanvas.addEventListener("pointerdown", startDrawing);
    scratchCanvas.addEventListener("pointermove", draw);
    scratchCanvas.addEventListener("pointerup", stopDrawing);
    scratchCanvas.addEventListener("pointercancel", stopDrawing);
    scratchCanvas.addEventListener("pointerleave", stopDrawing);
    window.addEventListener("resize", handleResize);
  }

  function setTool(tool) {
    activeTool = tool;
    penToolButton.classList.toggle("active", tool === "pen");
    eraserToolButton.classList.toggle("active", tool === "eraser");
    penToolButton.setAttribute("aria-pressed", String(tool === "pen"));
    eraserToolButton.setAttribute("aria-pressed", String(tool === "eraser"));
    scratchCanvas.classList.toggle("eraser-active", tool === "eraser");
  }

  function startDrawing(event) {
    event.preventDefault();
    isDrawing = true;
    lastPoint = getCanvasPoint(event);
    scratchCanvas.setPointerCapture(event.pointerId);
    drawPoint(lastPoint, event);
  }

  function draw(event) {
    if (!isDrawing || !lastPoint) {
      return;
    }

    event.preventDefault();
    var point = getCanvasPoint(event);
    drawLine(lastPoint, point, event);
    lastPoint = point;
  }

  function stopDrawing(event) {
    if (!isDrawing) {
      return;
    }

    isDrawing = false;
    lastPoint = null;
    if (event && scratchCanvas.hasPointerCapture(event.pointerId)) {
      scratchCanvas.releasePointerCapture(event.pointerId);
    }
    scheduleScratchSave();
  }

  function drawPoint(point, event) {
    scratchContext.save();
    applyDrawingStyle(event);
    scratchContext.beginPath();
    scratchContext.arc(point.x, point.y, currentLineWidth(event) / 2, 0, Math.PI * 2);
    scratchContext.fill();
    scratchContext.restore();
  }

  function drawLine(from, to, event) {
    scratchContext.save();
    applyDrawingStyle(event);
    scratchContext.beginPath();
    scratchContext.moveTo(from.x, from.y);
    scratchContext.lineTo(to.x, to.y);
    scratchContext.stroke();
    scratchContext.restore();
  }

  function applyDrawingStyle(event) {
    scratchContext.lineWidth = currentLineWidth(event);
    scratchContext.lineCap = "round";
    scratchContext.lineJoin = "round";
    scratchContext.strokeStyle = activeTool === "eraser" ? "rgba(0,0,0,1)" : "#172033";
    scratchContext.fillStyle = scratchContext.strokeStyle;
    scratchContext.globalCompositeOperation = activeTool === "eraser" ? "destination-out" : "source-over";
  }

  function currentLineWidth(event) {
    var base = Number(penSizeInput.value);
    var pressure = event && event.pointerType === "pen" && event.pressure > 0 ? event.pressure : 0.7;
    var size = activeTool === "eraser" ? base * 2.4 : base;
    return Math.max(2, size * pressure);
  }

  function getCanvasPoint(event) {
    var rect = scratchCanvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (scratchCanvas.width / rect.width),
      y: (event.clientY - rect.top) * (scratchCanvas.height / rect.height)
    };
  }

  function handleResize() {
    resizeScratchCanvas();
    scheduleProblemTextFit();
  }

  function startProblemTimer() {
    window.clearInterval(problemTimer);
    problemTimer = null;
    problemElapsedSeconds = Number(elapsedSecondsByProblem[currentProblemIndex]) || 0;
    updateTimerDisplay();

    if (submittedByProblem[currentProblemIndex]) {
      return;
    }

    problemTimerStartedAt = Date.now() - problemElapsedSeconds * 1000;
    problemTimer = window.setInterval(function () {
      syncProblemTimer();
    }, 1000);
  }

  function stopProblemTimer() {
    if (!problemTimer) {
      return;
    }

    syncProblemTimer();
    window.clearInterval(problemTimer);
    problemTimer = null;
    saveProblemSet();
  }

  function syncProblemTimer() {
    if (problemTimer) {
      problemElapsedSeconds = Math.floor((Date.now() - problemTimerStartedAt) / 1000);
    }
    elapsedSecondsByProblem[currentProblemIndex] = problemElapsedSeconds;
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    var minutes = Math.floor(problemElapsedSeconds / 60);
    var seconds = problemElapsedSeconds % 60;
    var label = padTime(minutes) + ":" + padTime(seconds);

    if (timerText) {
      timerText.textContent = label;
    }
    if (timerDisplay) {
      timerDisplay.setAttribute("aria-label", "ใช้เวลา " + minutes + " นาที " + seconds + " วินาที");
    }
  }

  function padTime(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function scheduleProblemTextFit() {
    window.cancelAnimationFrame(fitTextFrame);
    fitTextFrame = window.requestAnimationFrame(fitProblemText);
  }

  function fitProblemText() {
    var size = Number(window.getComputedStyle(problemText).fontSize.replace("px", ""));
    var minSize = 14;

    problemText.style.fontSize = "";
    size = Number(window.getComputedStyle(problemText).fontSize.replace("px", ""));

    while (size > minSize && isProblemTextOverflowing()) {
      size -= 1;
      problemText.style.fontSize = size + "px";
    }
  }

  function isProblemTextOverflowing() {
    return problemText.scrollHeight > problemText.clientHeight || problemText.scrollWidth > problemText.clientWidth;
  }

  function resizeScratchCanvas() {
    var rect = scratchCanvas.getBoundingClientRect();
    var width = Math.max(320, Math.round(rect.width));
    var height = Math.max(320, Math.round(rect.height));
    var previous = document.createElement("canvas");

    previous.width = scratchCanvas.width || width;
    previous.height = scratchCanvas.height || height;
    if (scratchCanvas.width && scratchCanvas.height) {
      previous.getContext("2d").drawImage(scratchCanvas, 0, 0);
    }

    scratchCanvas.width = width;
    scratchCanvas.height = height;
    scratchContext.lineCap = "round";
    scratchContext.lineJoin = "round";

    if (previous.width && previous.height) {
      scratchContext.drawImage(previous, 0, 0, previous.width, previous.height, 0, 0, width, height);
    }
  }

  function clearScratch() {
    scratchContext.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
  }

  function restoreScratch() {
    var saved = localStorage.getItem(scratchKey);
    if (!saved) {
      return;
    }

    var image = new Image();
    image.onload = function () {
      scratchContext.drawImage(image, 0, 0, scratchCanvas.width, scratchCanvas.height);
    };
    image.src = saved;
  }

  function scheduleScratchSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(function () {
      try {
        localStorage.setItem(scratchKey, scratchCanvas.toDataURL("image/png"));
      } catch (error) {
        localStorage.removeItem(scratchKey);
      }
    }, 250);
  }
})();
