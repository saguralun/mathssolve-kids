(function () {
  "use strict";

  var connectionNotice = document.getElementById("connectionNotice");
  var importForm = document.getElementById("problemImportForm");
  var addPartButton = document.getElementById("addPartButton");
  var addVariantSetButton = document.getElementById("addVariantSetButton");
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
    code: document.getElementById("templateCodeInput")
  };

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
  var state = createBlankState();
  var refreshTimer = 0;
  var codeRequestId = 0;

  populateOptions(topics, levels);
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

    resetFormButton.addEventListener("click", function () {
      state = createBlankState();
      refreshTemplateCode();
      renderAll();
      setResult("ล้างฟอร์มแล้ว เริ่มด้วย part ว่าง 3 แถว", "");
    });

    importForm.addEventListener("submit", function (event) {
      event.preventDefault();
      importProblem();
    });
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
    var selectedTopic = fields.topic.value || (nextTopics[0] ? nextTopics[0].code : "");
    var selectedLevel = fields.level.value || (nextLevels[0] ? String(nextLevels[0].id) : "1");

    fields.topic.innerHTML = "";
    nextTopics.forEach(function (topic) {
      var option = document.createElement("option");
      option.value = topic.code;
      option.textContent = topic.nameTh + (topic.gradeHint ? " (" + topic.gradeHint + ")" : "");
      fields.topic.appendChild(option);
    });

    fields.level.innerHTML = "";
    nextLevels.forEach(function (level) {
      var option = document.createElement("option");
      option.value = String(level.id);
      option.textContent = "Level " + level.id + " - " + level.nameTh;
      fields.level.appendChild(option);
    });

    fields.topic.value = selectedTopic;
    fields.level.value = selectedLevel;

    if (!fields.topic.value && nextTopics[0]) {
      fields.topic.value = nextTopics[0].code;
    }

    if (!fields.level.value && nextLevels[0]) {
      fields.level.value = String(nextLevels[0].id);
    }

    updateTopicDetail();
    refreshTemplateCode();
    refreshGeneratedOutput();
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

  function refreshGeneratedOutput() {
    var templateText = buildPromptTemplate();
    var promptText = buildPromptForSet(state.activeSet);

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

    payload.variants.forEach(function (variant) {
      var item = document.createElement("article");
      var badge = document.createElement("div");
      var question = document.createElement("div");
      var answer = document.createElement("div");

      item.className = "generated-item";
      badge.className = "generated-badge";
      badge.textContent = "ชุด " + variant.variantNo;
      question.className = "generated-question";
      question.textContent = buildPromptForSet(variant.variantNo - 1);
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
      setResult(
        "import แล้ว: " + result.templateCode + " พร้อมชุดตัวเลข " + result.variantCount + " ชุด",
        "success"
      );
      refreshGeneratedOutput();
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
      promptTemplateTh: templateText
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
    var fallbackCode = buildFallbackTemplateCode();

    codeRequestId = requestId;
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
      "  prompt_template_th",
      ") AS (",
      "  VALUES",
      "    (",
      "      " + sqlString(template.code) + ",",
      "      " + sqlString(template.topicCode) + ",",
      "      " + template.levelId + ",",
      "      " + sqlString(template.promptTemplateTh),
      "    )",
      ")",
      "INSERT INTO problem_templates (",
      "  code, topic_id, level_id, prompt_template_th",
      ")",
      "SELECT",
      "  tr.code, t.id, tr.level_id, tr.prompt_template_th",
      "FROM template_rows tr",
      "JOIN topics t ON t.code = tr.topic_code",
      "JOIN levels l ON l.id = tr.level_id",
      "ON CONFLICT (code) DO UPDATE SET",
      "  topic_id = EXCLUDED.topic_id,",
      "  level_id = EXCLUDED.level_id,",
      "  prompt_template_th = EXCLUDED.prompt_template_th,",
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
