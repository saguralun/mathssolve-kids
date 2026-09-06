(function () {
  "use strict";

  var connectionNotice = document.getElementById("connectionNotice");
  var importForm = document.getElementById("problemImportForm");
  var addPartButton = document.getElementById("addPartButton");
  var addVariantSetButton = document.getElementById("addVariantSetButton");
  var bulkPasteInput = document.getElementById("bulkPasteInput");
  var bulkPasteButton = document.getElementById("bulkPasteButton");
  var templatePasteInput = document.getElementById("templatePasteInput");
  var templatePasteButton = document.getElementById("templatePasteButton");
  var resetFormButton = document.getElementById("resetFormButton");
  var submitButton = document.getElementById("submitButton");
  var resultMessage = document.getElementById("resultMessage");
  var sqlPreview = document.getElementById("sqlPreview");
  var topicDetail = document.getElementById("topicDetail");
  var partsList = document.getElementById("partsList");
  var variableTableHead = document.getElementById("variableTableHead");
  var variableTableBody = document.getElementById("variableTableBody");
  var variantTabs = document.getElementById("variantTabs");
  var generatedList = document.getElementById("generatedList");
  var promptTemplatePreview = document.getElementById("promptTemplatePreview");
  var currentPromptPreview = document.getElementById("currentPromptPreview");

  var fields = {
    topic: document.getElementById("topicSelect"),
    level: document.getElementById("levelSelect"),
    code: document.getElementById("templateCodeInput"),
    source: document.getElementById("sourceInput"),
    answerDecimalPlaces: document.getElementById("answerDecimalPlacesInput"),
    hint: document.getElementById("hintSelect")
  };
  var sourceOptions = document.getElementById("sourceOptions");

  var fallbackTopics = [
    {
      code: "whole_number_add_subtract",
      nameTh: "บวก ลบ จำนวนนับ",
      descriptionTh: "โจทย์ปัญหาการบวกและการลบจำนวนนับ",
      gradeHint: "ป.4"
    },
    {
      code: "whole_number_multiply_divide",
      nameTh: "คูณ หาร จำนวนนับ",
      descriptionTh: "โจทย์ปัญหาการคูณและการหารจำนวนนับ",
      gradeHint: "ป.4"
    },
    {
      code: "fractions_add_subtract",
      nameTh: "บวก ลบ เศษส่วน",
      descriptionTh: "โจทย์ปัญหาการบวกและการลบเศษส่วน",
      gradeHint: "ป.4-ม.1"
    },
    {
      code: "fractions_multiply_divide",
      nameTh: "คูณ หาร เศษส่วน",
      descriptionTh: "โจทย์ปัญหาการคูณและการหารเศษส่วน",
      gradeHint: "ป.5-ม.1"
    },
    {
      code: "decimals_add_subtract",
      nameTh: "บวก ลบ ทศนิยม",
      descriptionTh: "โจทย์ปัญหาทศนิยมขั้นพื้นฐาน",
      gradeHint: "ป.4-ม.1"
    },
    {
      code: "rectangle_area_perimeter",
      nameTh: "สี่เหลี่ยมมุมฉาก พื้นที่ รอบรูป",
      descriptionTh: "พื้นที่ ความยาวรอบรูป และโจทย์ปัญหารูปสี่เหลี่ยมมุมฉาก",
      gradeHint: "ป.4"
    },
    {
      code: "rule_of_three",
      nameTh: "บัญญัติไตรยางศ์",
      descriptionTh: "ความสัมพันธ์ของปริมาณสองสิ่งและการเทียบค่า",
      gradeHint: "ป.5"
    },
    {
      code: "percent_basic",
      nameTh: "ร้อยละพื้นฐาน",
      descriptionTh: "ร้อยละของจำนวนและโจทย์ปัญหา",
      gradeHint: "ป.5-ม.1"
    },
    {
      code: "ratio_proportion_scale",
      nameTh: "อัตราส่วน สัดส่วน และมาตราส่วน",
      descriptionTh: "อัตราส่วนที่เท่ากัน สัดส่วน และมาตราส่วน",
      gradeHint: "ป.6-ม.1"
    },
    {
      code: "integers",
      nameTh: "จำนวนเต็ม",
      descriptionTh: "การบวก ลบ คูณ หารจำนวนเต็ม",
      gradeHint: "ม.1"
    }
  ];

  var fallbackLevels = [
    { id: 1, nameTh: "ง่ายมาก", descriptionTh: "ตัวเลขเล็ก ขั้นตอนเดียว" },
    { id: 2, nameTh: "ง่าย", descriptionTh: "เลือกวิธีทำได้ตรงไปตรงมา" },
    { id: 3, nameTh: "ปานกลาง", descriptionTh: "มีข้อมูลมากขึ้นหรือคิดสองขั้น" },
    { id: 4, nameTh: "ยาก", descriptionTh: "หลายขั้นตอนหรือมีเงื่อนไขมากขึ้น" },
    { id: 5, nameTh: "ท้าทาย", descriptionTh: "โจทย์ประยุกต์หรือวัดความเข้าใจลึก" }
  ];

  var defaultVariantCount = 3;
  var maxVariantCount = 5;
  var topics = fallbackTopics.slice();
  var levels = fallbackLevels.slice();
  var sources = [];
  var hints = [];
  var state = createBlankState();
  var refreshTimer = 0;
  var codeRequestId = 0;

  populateOptions(topics, levels);
  populateSources(sources);
  populateHints(hints);
  renderAll();
  bindEvents();
  loadOptions();

  function createBlankState() {
    return {
      activeSet: 0,
      activeVariantCount: defaultVariantCount,
      parts: createBlankParts(3),
      answer: {
        values: createBlankValues()
      }
    };
  }

  function createBlankParts(count) {
    var parts = [];

    for (var index = 0; index < count; index += 1) {
      parts.push({
        text: "",
        values: createBlankValues()
      });
    }

    return parts;
  }

  function bindEvents() {
    fields.topic.addEventListener("change", function () {
      updateTopicDetail();
      refreshTemplateCode();
      scheduleRefresh();
    });

    fields.level.addEventListener("change", function () {
      refreshTemplateCode();
      scheduleRefresh();
    });

    importForm.addEventListener("input", function (event) {
      if (!event.target.closest("#partsList") && !event.target.closest("#variableTableBody")) {
        scheduleRefresh();
      }
    });

    partsList.addEventListener("input", handlePartInput);
    partsList.addEventListener("click", handlePartClick);
    variableTableBody.addEventListener("input", handleVariableInput);
    variantTabs.addEventListener("click", handleVariantTabClick);

    addPartButton.addEventListener("click", function () {
      state.parts.push({
        text: "",
        values: createBlankValues()
      });
      renderParts();
      renderVariableTable();
      refreshGeneratedOutput();
      setResult("เพิ่ม part ใหม่แล้ว", "");
    });

    addVariantSetButton.addEventListener("click", function () {
      addVariantSet();
    });

    bulkPasteButton.addEventListener("click", handleBulkPaste);
    templatePasteButton.addEventListener("click", handleTemplatePaste);

    resetFormButton.addEventListener("click", function () {
      resetForm();
      setResult("ล้างฟอร์มแล้ว เริ่มด้วย part ว่าง 3 แถว", "");
    });

    importForm.addEventListener("submit", function (event) {
      event.preventDefault();
      importProblem();
    });
  }

  function resetForm() {
    state = createBlankState();
    templatePasteInput.value = "";
    bulkPasteInput.value = "";
    fields.source.value = "";
    fields.answerDecimalPlaces.value = "0";
    fields.hint.value = "";
    fields.topic.value = "";
    fields.level.value = "";
    updateTopicDetail();
    refreshTemplateCode();
    renderAll();
  }

  async function loadOptions() {
    try {
      var data = await getJson("/api/problems/options");

      if (Array.isArray(data.topics) && data.topics.length) {
        topics = data.topics;
      }

      if (Array.isArray(data.levels) && data.levels.length) {
        levels = data.levels;
      }

      if (Array.isArray(data.sources)) {
        sources = data.sources;
        populateSources(sources);
      }

      if (Array.isArray(data.hints)) {
        hints = data.hints;
        populateHints(hints);
      }

      populateOptions(topics, levels);
      setNotice("อ่าน topic และ level จาก PostgreSQL แล้ว", "success");
    } catch (error) {
      populateOptions(topics, levels);
      setNotice(
        friendlyError(error.message) + " ตอนนี้ใช้ตัวเลือกตัวอย่างบนหน้าไปก่อน",
        "warning"
      );
    }
  }

  function populateOptions(nextTopics, nextLevels) {
    // Keep whatever the user already picked; otherwise leave it BLANK rather
    // than silently defaulting to the first topic/level. A silent default
    // looks identical to a deliberate choice, so a rushed import can go in
    // under the wrong topic/level without anyone noticing (happened once
    // already) — a blank selection instead trips the "ต้องกรอกเรื่อง" /
    // "ระดับความยากต้องอยู่ระหว่าง 1-5" required-field check on submit.
    var selectedTopic = fields.topic.value || "";
    var selectedLevel = fields.level.value || "";

    fields.topic.innerHTML = "";
    fields.topic.appendChild(placeholderOption("-- เลือกเรื่อง --"));
    nextTopics.forEach(function (topic) {
      var option = document.createElement("option");
      option.value = topic.code;
      option.textContent = topic.nameTh + (topic.gradeHint ? " (" + topic.gradeHint + ")" : "");
      fields.topic.appendChild(option);
    });

    fields.level.innerHTML = "";
    fields.level.appendChild(placeholderOption("-- เลือกระดับความยาก --"));
    nextLevels.forEach(function (level) {
      var option = document.createElement("option");
      option.value = String(level.id);
      option.textContent = "Level " + level.id + " - " + level.nameTh;
      fields.level.appendChild(option);
    });

    fields.topic.value = selectedTopic;
    fields.level.value = selectedLevel;

    updateTopicDetail();
    refreshTemplateCode();
    refreshGeneratedOutput();
  }

  // nextSources is a plain list of distinct source_name strings already used
  // in problem_templates (server-side DISTINCT) — this is just an
  // autocomplete hint, not a fixed list: the field stays free text, so
  // typing anything not in here still works fine.
  function populateSources(nextSources) {
    sourceOptions.innerHTML = "";
    nextSources.forEach(function (name) {
      var option = document.createElement("option");
      option.value = name;
      sourceOptions.appendChild(option);
    });
  }

  function populateHints(nextHints) {
    var selectedHint = fields.hint.value || "";

    fields.hint.innerHTML = "";
    fields.hint.appendChild(placeholderOption("-- ไม่ระบุ --"));
    nextHints.forEach(function (hint) {
      var option = document.createElement("option");
      option.value = String(hint.id);
      option.textContent = hint.hintText;
      fields.hint.appendChild(option);
    });

    fields.hint.value = selectedHint;
  }

  function findHintById(id) {
    return (
      hints.find(function (hint) {
        return hint.id === id;
      }) || null
    );
  }

  function placeholderOption(label) {
    var option = document.createElement("option");
    option.value = "";
    option.textContent = label;
    return option;
  }

  function renderAll() {
    renderParts();
    renderVariantTabs();
    renderVariableTable();
    updateTopicDetail();
    refreshGeneratedOutput();
  }

  function renderParts() {
    partsList.innerHTML = "";

    state.parts.forEach(function (part, index) {
      var row = document.createElement("article");
      var indexNode = document.createElement("div");
      var textLabel = document.createElement("label");
      var textLabelTitle = document.createElement("span");
      var textInput = document.createElement("textarea");
      var valueLabel = document.createElement("label");
      var valueLabelTitle = document.createElement("span");
      var valueInput = document.createElement("input");
      var actions = document.createElement("div");
      var removeButton = document.createElement("button");

      row.className = "part-row";
      row.dataset.index = String(index);

      indexNode.className = "part-index";
      indexNode.innerHTML =
        "part " + (index + 1) + '<br /><span class="part-token">' + tokenForPart(index) + "</span>";

      textLabelTitle.textContent = "โจทย์ part " + (index + 1);
      textInput.rows = 2;
      textInput.dataset.field = "text";
      textInput.value = part.text;
      textLabel.appendChild(textLabelTitle);
      textLabel.appendChild(textInput);

      valueLabelTitle.textContent = "ค่า " + tokenForPart(index);
      valueInput.dataset.field = "value";
      valueInput.value = part.values[0] || "";
      valueInput.placeholder = "-";
      valueLabel.appendChild(valueLabelTitle);
      valueLabel.appendChild(valueInput);

      actions.className = "part-actions";
      removeButton.className = "icon-button";
      removeButton.type = "button";
      removeButton.dataset.action = "remove-part";
      removeButton.title = "ลบ part นี้";
      removeButton.textContent = "-";
      removeButton.disabled = state.parts.length <= 1;
      actions.appendChild(removeButton);

      row.appendChild(indexNode);
      row.appendChild(textLabel);
      row.appendChild(valueLabel);
      row.appendChild(actions);
      partsList.appendChild(row);
    });
  }

  function renderVariantTabs() {
    variantTabs.innerHTML = "";

    for (var index = 0; index < state.activeVariantCount; index += 1) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "variant-tab" + (index === state.activeSet ? " active" : "");
      button.dataset.set = String(index);
      button.textContent = "ชุด " + (index + 1);
      button.setAttribute("aria-pressed", String(index === state.activeSet));
      variantTabs.appendChild(button);
    }

    addVariantSetButton.disabled = state.activeVariantCount >= maxVariantCount;
  }

  function renderVariableTable() {
    var headerRow = document.createElement("tr");

    variableTableHead.innerHTML = "";
    variableTableBody.innerHTML = "";

    ["ตัวแปร"].forEach(function (label) {
      var th = document.createElement("th");
      th.textContent = label;
      headerRow.appendChild(th);
    });

    for (var setIndex = 0; setIndex < state.activeVariantCount; setIndex += 1) {
      var setTh = document.createElement("th");
      setTh.textContent = "ชุด " + (setIndex + 1);
      headerRow.appendChild(setTh);
    }

    variableTableHead.appendChild(headerRow);

    state.parts.forEach(function (part, partIndex) {
      variableTableBody.appendChild(createVariableRow(part, partIndex));
    });

    variableTableBody.appendChild(createAnswerRow());
  }

  function createVariableRow(part, partIndex) {
    var row = document.createElement("tr");
    var nameCell = document.createElement("td");

    nameCell.className = "variable-name";
    nameCell.textContent = tokenForPart(partIndex);
    row.appendChild(nameCell);

    for (var setIndex = 0; setIndex < state.activeVariantCount; setIndex += 1) {
      var valueCell = document.createElement("td");
      var input = document.createElement("input");
      input.dataset.kind = "math";
      input.dataset.index = String(partIndex);
      input.dataset.set = String(setIndex);
      input.value = part.values[setIndex] || "";
      input.placeholder = "-";
      valueCell.appendChild(input);
      row.appendChild(valueCell);
    }

    return row;
  }

  function createAnswerRow() {
    var row = document.createElement("tr");
    var nameCell = document.createElement("td");

    nameCell.className = "variable-name answer-name";
    nameCell.textContent = "Answer";
    row.appendChild(nameCell);

    for (var setIndex = 0; setIndex < state.activeVariantCount; setIndex += 1) {
      var valueCell = document.createElement("td");
      var input = document.createElement("input");
      input.dataset.kind = "answer";
      input.dataset.set = String(setIndex);
      input.value = state.answer.values[setIndex] || "";
      input.placeholder = "ans" + (setIndex + 1);
      valueCell.appendChild(input);
      row.appendChild(valueCell);
    }

    return row;
  }

  function handlePartInput(event) {
    var row = event.target.closest(".part-row");
    var index = row ? Number(row.dataset.index) : -1;

    if (!state.parts[index]) {
      return;
    }

    if (event.target.dataset.field === "text") {
      state.parts[index].text = event.target.value;
    }

    if (event.target.dataset.field === "value") {
      state.parts[index].values[0] = event.target.value;
      syncVariableInput(index, 0, event.target.value);
    }

    scheduleRefresh();
  }

  function handlePartClick(event) {
    var button = event.target.closest("[data-action='remove-part']");
    var row = event.target.closest(".part-row");
    var index = row ? Number(row.dataset.index) : -1;

    if (!button || !state.parts[index] || state.parts.length <= 1) {
      return;
    }

    state.parts.splice(index, 1);
    renderParts();
    renderVariableTable();
    refreshGeneratedOutput();
  }

  function handleVariableInput(event) {
    var kind = event.target.dataset.kind;
    var setIndex = Number(event.target.dataset.set);

    if (kind === "math") {
      var partIndex = Number(event.target.dataset.index);
      if (state.parts[partIndex]) {
        state.parts[partIndex].values[setIndex] = event.target.value;
        if (setIndex === 0) {
          syncPartInput(partIndex, event.target.value);
        }
      }
    }

    if (kind === "answer") {
      state.answer.values[setIndex] = event.target.value;
    }

    scheduleRefresh();
  }

  function handleVariantTabClick(event) {
    var button = event.target.closest(".variant-tab");

    if (!button) {
      return;
    }

    state.activeSet = Number(button.dataset.set);
    renderVariantTabs();
    refreshGeneratedOutput();
  }

  function addVariantSet() {
    if (state.activeVariantCount >= maxVariantCount) {
      return;
    }

    var nextSet = state.activeVariantCount;
    state.activeVariantCount += 1;
    state.activeSet = nextSet;

    renderVariantTabs();
    renderVariableTable();
    refreshGeneratedOutput();
    setResult("เพิ่มช่องชุดตัวเลขใหม่แล้ว", "");
  }

  function handleTemplatePaste() {
    var parts;

    try {
      parts = parseTemplateText(templatePasteInput.value);
    } catch (error) {
      setResult(error.message, "error");
      return;
    }

    state.parts = parts;
    state.answer = { values: createBlankValues() };
    state.activeVariantCount = defaultVariantCount;
    state.activeSet = 0;
    renderAll();
    setResult(
      "แบ่ง part จากโจทย์แม่ที่วางแล้ว " + parts.length + " ส่วน — พิมพ์เองหรือวาง JSON เติมชุดตัวเลขต่อได้เลย",
      "success"
    );
  }

  // Splits a full template string on {math1}, {math2}, ... tokens into the
  // same part shape the manual "ตัวต่อโจทย์" builder uses: text-before-token
  // per variable part, plus one extra trailing part (no variable) for any
  // text left after the last token — e.g. "...มีค่าเท่ากับเท่าไร".
  function parseTemplateText(text) {
    var raw = String(text || "");

    if (!raw.trim()) {
      throw new Error("วางข้อความโจทย์แม่ก่อน");
    }

    var tokenPattern = /\{math\d+\}/g;
    var segments = raw.split(tokenPattern);
    var tokenCount = segments.length - 1;

    if (tokenCount === 0) {
      return [{ text: raw, values: createBlankValues() }];
    }

    var parts = [];
    for (var index = 0; index < tokenCount; index += 1) {
      parts.push({ text: segments[index], values: createBlankValues() });
    }

    var trailingText = segments[tokenCount];
    if (trailingText && trailingText.trim() !== "") {
      parts.push({ text: trailingText, values: createBlankValues() });
    }

    return parts;
  }

  function handleBulkPaste() {
    var objects;

    try {
      objects = parseBulkPasteText(bulkPasteInput.value);
    } catch (error) {
      setResult(error.message, "error");
      return;
    }

    applyBulkPasteVariants(objects);
    renderAll();
    setResult(
      "เติมค่าอัตโนมัติจาก " + objects.length + " variant แล้ว — อย่าลืมกรอกข้อความ part (ประโยคโจทย์) ให้ครบด้วย",
      "success"
    );
  }

  // Accepts one or more lines like: variant 1: {"math1":"3:5",...} — the
  // "variant N:" label is optional, only the {...} JSON object matters. Uses
  // a flat-object regex (no nested braces) since variant_values are always
  // string key/value pairs.
  function parseBulkPasteText(text) {
    var matches = String(text || "").match(/\{[^{}]*\}/g) || [];

    if (!matches.length) {
      throw new Error("หาไม่เจอ JSON object ({...}) ในข้อความที่วาง");
    }

    if (matches.length > maxVariantCount) {
      throw new Error("วางได้สูงสุด " + maxVariantCount + " ชุด (เจอ " + matches.length + " ชุด)");
    }

    return matches.map(function (chunk, index) {
      try {
        var parsed = JSON.parse(chunk);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("ไม่ใช่ JSON object");
        }
        return parsed;
      } catch (error) {
        throw new Error("อ่าน JSON ชุดที่ " + (index + 1) + " ไม่สำเร็จ: " + error.message);
      }
    });
  }

  function applyBulkPasteVariants(objects) {
    var count = objects.length;
    var mathKeys = [];

    objects.forEach(function (obj) {
      Object.keys(obj).forEach(function (key) {
        if (key !== "answer" && mathKeys.indexOf(key) === -1) {
          mathKeys.push(key);
        }
      });
    });

    mathKeys.sort(function (a, b) {
      var aNumber = Number(String(a).replace(/[^0-9]/g, ""));
      var bNumber = Number(String(b).replace(/[^0-9]/g, ""));

      if (Number.isFinite(aNumber) && Number.isFinite(bNumber) && aNumber !== bNumber) {
        return aNumber - bNumber;
      }
      return 0;
    });

    // Keep any sentence text already typed into existing parts, matched by
    // position, so pasting new numbers doesn't wipe out the wording.
    var previousTexts = state.parts.map(function (part) {
      return part.text;
    });

    var newParts = mathKeys.map(function (key, index) {
      return {
        text: previousTexts[index] || "",
        values: createBlankValues()
      };
    });

    // Anything after the last variable part (e.g. a trailing "มีค่าเท่ากับ
    // เท่าไร" part with no variable, from "แบ่ง part อัตโนมัติ") has no
    // matching key in the pasted JSON — carry it over as-is instead of
    // dropping it, so pasting values after pasting the template text doesn't
    // eat the end of the sentence.
    for (var index = mathKeys.length; index < state.parts.length; index += 1) {
      newParts.push({ text: state.parts[index].text, values: createBlankValues() });
    }

    state.parts = newParts;
    state.answer = { values: createBlankValues() };
    state.activeVariantCount = Math.max(1, count);
    state.activeSet = 0;

    objects.forEach(function (obj, setIndex) {
      mathKeys.forEach(function (key, partIndex) {
        state.parts[partIndex].values[setIndex] =
          obj[key] === undefined || obj[key] === null ? "" : String(obj[key]);
      });
      state.answer.values[setIndex] =
        obj.answer === undefined || obj.answer === null ? "" : String(obj.answer);
    });
  }

  function refreshGeneratedOutput() {
    var templateText = buildPromptTemplate();
    var decimalPlaces = Number(fields.answerDecimalPlaces.value) || 0;
    var promptText =
      buildPromptForSet(state.activeSet) + allHintsPreviewText(decimalPlaces, Number(fields.hint.value) || null);

    promptTemplatePreview.value = templateText;
    currentPromptPreview.value = promptText;

    try {
      var payload = collectPayload();
      renderGeneratedList(payload);
      sqlPreview.textContent = buildReadableSql(payload);
    } catch (error) {
      generatedList.innerHTML = "";
      generatedList.appendChild(createEmptyPreview(error.message));
      sqlPreview.textContent = "-- " + error.message;
    }
  }

  function renderGeneratedList(payload) {
    generatedList.innerHTML = "";
    var decimalPlaces = payload.template.answerDecimalPlaces;
    var hintId = payload.template.hintId;

    payload.variants.forEach(function (variant) {
      var item = document.createElement("article");
      var badge = document.createElement("div");
      var question = document.createElement("div");
      var answer = document.createElement("div");

      item.className = "generated-item";
      badge.className = "generated-badge";
      badge.textContent = "ชุด " + variant.variantNo;
      question.className = "generated-question";
      question.textContent = buildPromptForSet(variant.variantNo - 1) + allHintsPreviewText(decimalPlaces, hintId);
      answer.className = "generated-answer";
      answer.textContent = "ตอบ " + variant.variantValues.answer;

      item.appendChild(badge);
      item.appendChild(question);
      item.appendChild(answer);
      generatedList.appendChild(item);
    });
  }

  function createEmptyPreview(message) {
    var item = document.createElement("article");
    var question = document.createElement("div");

    item.className = "generated-item";
    question.className = "generated-question";
    question.textContent = message;
    item.appendChild(question);

    return item;
  }

  async function importProblem() {
    var payload;

    try {
      payload = collectPayload();
    } catch (error) {
      setResult(error.message, "error");
      refreshGeneratedOutput();
      return;
    }

    submitButton.disabled = true;
    setResult("กำลัง import เข้า PostgreSQL...", "");

    try {
      var result = await postJson("/api/problems/import", payload);
      resetForm();
      setResult(
        "import แล้ว: " + result.templateCode + " พร้อมชุดตัวเลข " + result.variantCount +
          " ชุด — ล้างฟอร์มให้แล้ว กันกด import ซ้ำ",
        "success"
      );
    } catch (error) {
      setResult(friendlyError(error.message), "error");
    } finally {
      submitButton.disabled = false;
    }
  }

  function collectPayload() {
    var templateText = required(buildPromptTemplate(), "โจทย์แม่");
    var template = {
      code: required(fields.code.value, "รหัสโจทย์แม่"),
      topicCode: required(fields.topic.value, "เรื่อง"),
      levelId: Number(required(fields.level.value, "ระดับความยาก")),
      promptTemplateTh: templateText,
      sourceName: fields.source.value.trim(),
      answerDecimalPlaces: Number(fields.answerDecimalPlaces.value) || 0,
      hintId: fields.hint.value ? Number(fields.hint.value) : null
    };

    var variants = [];

    for (var setIndex = 0; setIndex < state.activeVariantCount; setIndex += 1) {
      required(buildPromptForSet(setIndex), "โจทย์จริงชุดที่ " + (setIndex + 1));
      required(state.answer.values[setIndex], "Answer ชุดที่ " + (setIndex + 1));

      variants.push({
        variantNo: setIndex + 1,
        variantValues: buildVariantValuesForSet(setIndex)
      });
    }

    return {
      template: template,
      variants: variants
    };
  }

  function buildPromptTemplate() {
    return state.parts
      .map(function (part, index) {
        var text = part.text || "";
        return text + (partHasVariable(part) ? "{" + tokenForPart(index) + "}" : "");
      })
      .join("")
      .trim();
  }

  // Mirrors the practice screen's auto-appended hint (src/app.js) so what
  // you see in this preview matches what the child actually sees — the
  // hint is never typed into the prompt text itself.
  function decimalHintText(decimalPlaces) {
    var places = Number(decimalPlaces) || 0;
    if (!places) {
      return "";
    }
    return " (ตอบเป็นทศนิยม " + places + " ตำแหน่ง)";
  }

  function allHintsPreviewText(decimalPlaces, hintId) {
    var hint = hintId ? findHintById(hintId) : null;
    var hintText = hint ? " (" + hint.hintText + ")" : "";
    return hintText + decimalHintText(decimalPlaces);
  }

  function buildPromptForSet(setIndex) {
    return state.parts
      .map(function (part) {
        var text = part.text || "";
        return text + (partHasVariable(part) ? String(part.values[setIndex] || "") : "");
      })
      .join("")
      .trim();
  }

  function buildVariantValuesForSet(setIndex) {
    var values = {};

    state.parts.forEach(function (part, index) {
      if (!partHasVariable(part)) {
        return;
      }

      values[tokenForPart(index)] = String(part.values[setIndex] || "").trim();
    });

    values.answer = String(state.answer.values[setIndex] || "").trim();
    return values;
  }

  function partHasVariable(part) {
    return part.values.some(function (value) {
      return String(value || "").trim() !== "";
    });
  }

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refreshGeneratedOutput, 120);
  }

  async function refreshTemplateCode() {
    var requestId = codeRequestId + 1;
    codeRequestId = requestId;

    if (!fields.topic.value || !fields.level.value) {
      fields.code.value = "";
      refreshGeneratedOutput();
      return;
    }

    var fallbackCode = buildFallbackTemplateCode();

    fields.code.value = fallbackCode;
    refreshGeneratedOutput();

    try {
      var result = await getJson(
        "/api/problems/next-code?topicCode=" +
          encodeURIComponent(fields.topic.value) +
          "&levelId=" +
          encodeURIComponent(fields.level.value)
      );

      if (requestId !== codeRequestId) {
        return;
      }

      fields.code.value = result.code || fallbackCode;
      refreshGeneratedOutput();
    } catch (error) {
      if (requestId === codeRequestId) {
        fields.code.value = fallbackCode;
        refreshGeneratedOutput();
      }
    }
  }

  function buildFallbackTemplateCode() {
    var topicCode = String(fields.topic.value || "topic")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    var levelId = String(fields.level.value || "1").replace(/[^0-9]/g, "") || "1";

    return topicCode + "_l" + levelId + "_001";
  }

  function buildReadableSql(payload) {
    var template = payload.template;
    var variantRows = payload.variants
      .map(function (variant) {
        return [
          "    (",
          "      " + sqlString(template.code) + ",",
          "      " + variant.variantNo + ",",
          "      " + sqlJson(variant.variantValues),
          "    )"
        ].join("\n");
      })
      .join(",\n");

    return [
      "BEGIN;",
      "",
      "WITH template_rows (",
      "  code,",
      "  topic_code,",
      "  level_id,",
      "  prompt_template_th,",
      "  source_name",
      ") AS (",
      "  VALUES",
      "    (",
      "      " + sqlString(template.code) + ",",
      "      " + sqlString(template.topicCode) + ",",
      "      " + template.levelId + ",",
      "      " + sqlString(template.promptTemplateTh) + ",",
      "      " + (template.sourceName ? sqlString(template.sourceName) : "NULL"),
      "    )",
      ")",
      "INSERT INTO problem_templates (",
      "  code, topic_id, level_id, prompt_template_th, source_name",
      ")",
      "SELECT",
      "  tr.code, t.id, tr.level_id, tr.prompt_template_th, tr.source_name",
      "FROM template_rows tr",
      "JOIN topics t ON t.code = tr.topic_code",
      "JOIN levels l ON l.id = tr.level_id",
      "ON CONFLICT (code) DO UPDATE SET",
      "  topic_id = EXCLUDED.topic_id,",
      "  level_id = EXCLUDED.level_id,",
      "  prompt_template_th = EXCLUDED.prompt_template_th,",
      "  source_name = EXCLUDED.source_name,",
      "  is_active = TRUE;",
      "",
      "WITH variant_rows (",
      "  template_code,",
      "  variant_no,",
      "  variant_values",
      ") AS (",
      "  VALUES",
      variantRows,
      ")",
      "INSERT INTO problem_variants (",
      "  problem_template_id, variant_no, variant_values",
      ")",
      "SELECT",
      "  pt.id, vr.variant_no, vr.variant_values",
      "FROM variant_rows vr",
      "JOIN problem_templates pt ON pt.code = vr.template_code",
      "ON CONFLICT (problem_template_id, variant_no) DO UPDATE SET",
      "  variant_values = EXCLUDED.variant_values,",
      "  is_active = TRUE;",
      "",
      "COMMIT;"
    ].join("\n");
  }

  function updateTopicDetail() {
    var topic = topics.find(function (item) {
      return item.code === fields.topic.value;
    });

    if (!topic) {
      topicDetail.textContent = "เลือกเรื่องเพื่อจัดกลุ่มโจทย์";
      return;
    }

    topicDetail.textContent =
      topic.descriptionTh + (topic.gradeHint ? " · ระดับชั้นโดยประมาณ " + topic.gradeHint : "");
  }

  function syncVariableInput(partIndex, setIndex, value) {
    var input = variableTableBody.querySelector(
      'input[data-kind="math"][data-index="' + partIndex + '"][data-set="' + setIndex + '"]'
    );

    if (input && input.value !== value) {
      input.value = value;
    }
  }

  function syncPartInput(partIndex, value) {
    var input = partsList.querySelector(
      '.part-row[data-index="' + partIndex + '"] input[data-field="value"]'
    );

    if (input && input.value !== value) {
      input.value = value;
    }
  }

  function tokenForPart(index) {
    return "math" + (index + 1);
  }

  function createBlankValues() {
    var values = [];

    for (var index = 0; index < maxVariantCount; index += 1) {
      values.push("");
    }

    return values;
  }

  function required(value, label) {
    var text = String(value || "").trim();

    if (!text) {
      throw new Error("ต้องกรอก" + label);
    }

    return text;
  }

  async function getJson(url) {
    var response = await fetch(url);
    return parseJsonResponse(response);
  }

  async function postJson(url, body) {
    var response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    return parseJsonResponse(response);
  }

  async function parseJsonResponse(response) {
    var data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  function sqlString(value) {
    return "'" + String(value || "").replace(/'/g, "''") + "'";
  }

  function sqlJson(value) {
    return sqlString(JSON.stringify(value)) + "::jsonb";
  }

  function setNotice(message, type) {
    connectionNotice.className = "notice " + (type || "info");
    connectionNotice.textContent = message;
  }

  function setResult(message, type) {
    resultMessage.className = "result-message" + (type ? " " + type : "");
    resultMessage.textContent = message;
  }

  function friendlyError(message) {
    if (!message) {
      return "เกิดข้อผิดพลาด";
    }

    if (
      message.indexOf('relation "topics" does not exist') !== -1 ||
      message.indexOf('relation "problem_templates" does not exist') !== -1
    ) {
      return "ยังไม่พบ table ชุดใหม่ ให้รัน db/001_create_tables.sql และ db/002_insert_master_data.sql ก่อน";
    }

    if (message.indexOf("no password supplied") !== -1) {
      return "PostgreSQL ต้องใช้ password ให้ใส่ไว้ใน .env หรือเปิดผ่าน server ที่ตั้งค่าไว้";
    }

    if (message.indexOf("Failed to fetch") !== -1) {
      return "ต้องเปิดหน้านี้ผ่าน npm run dev เพื่อให้ import เข้า PostgreSQL ได้";
    }

    return message;
  }
})();
