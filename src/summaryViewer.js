(function () {
  "use strict";

  var summaryCards = document.getElementById("summaryCards");
  var summaryMessage = document.getElementById("summaryMessage");
  var summaryTableFrame = document.getElementById("summaryTableFrame");
  var summaryTable = document.getElementById("summaryTable");
  var refreshSummaryButton = document.getElementById("refreshSummaryButton");

  refreshSummaryButton.addEventListener("click", loadSummary);
  loadSummary();

  async function loadSummary() {
    setMessage("กำลังโหลดข้อมูลจาก PostgreSQL...", false);
    summaryTableFrame.hidden = true;

    try {
      var response = await fetch("/api/problems/summary");
      var data = await response.json().catch(function () {
        return {};
      });

      if (!response.ok) {
        throw new Error(data.error || "โหลดข้อมูลไม่สำเร็จ");
      }

      render(data);
    } catch (error) {
      setMessage(friendlyError(error.message), true);
    }
  }

  function render(data) {
    var topics = Array.isArray(data.topics) ? data.topics : [];
    var levels = Array.isArray(data.levels) ? data.levels : [];
    var counts = Array.isArray(data.counts) ? data.counts : [];

    // countsByTopicLevel["<topicId>:<levelId>"] = { templateCount, variantCount }
    var countsByKey = {};
    counts.forEach(function (row) {
      countsByKey[row.topicId + ":" + row.levelId] = row;
    });

    renderCards(topics, levels, counts);
    renderTable(topics, levels, countsByKey);

    setMessage("", false);
    summaryTableFrame.hidden = false;
  }

  function renderCards(topics, levels, counts) {
    var topicsWithData = new Set(
      counts.map(function (row) {
        return row.topicId;
      })
    );
    var totalTemplates = counts.reduce(function (sum, row) {
      return sum + Number(row.templateCount || 0);
    }, 0);

    summaryCards.innerHTML = "";
    summaryCards.appendChild(card("โจทย์แม่ทั้งหมด", formatNumber(totalTemplates)));
    summaryCards.appendChild(
      card("เรื่องที่มีโจทย์แล้ว", formatNumber(topicsWithData.size) + " / " + formatNumber(topics.length))
    );
  }

  function card(label, displayValue) {
    var el = document.createElement("article");
    var labelNode = document.createElement("span");
    var valueNode = document.createElement("strong");

    el.className = "summary-card";
    labelNode.textContent = label;
    valueNode.textContent = displayValue;
    el.appendChild(labelNode);
    el.appendChild(valueNode);

    return el;
  }

  function renderTable(topics, levels, countsByKey) {
    var thead = document.createElement("thead");
    var tbody = document.createElement("tbody");
    var tfoot = document.createElement("tfoot");
    var headerRow = document.createElement("tr");
    var levelTotals = levels.map(function () {
      return 0;
    });
    var grandTotal = 0;

    summaryTable.innerHTML = "";

    headerRow.appendChild(th("เรื่อง"));
    levels.forEach(function (level) {
      headerRow.appendChild(th("Lv " + level.id));
    });
    headerRow.appendChild(th("รวม"));
    thead.appendChild(headerRow);

    topics.forEach(function (topic) {
      var row = document.createElement("tr");
      var nameCell = document.createElement("td");
      var topicTotal = 0;

      nameCell.className = "topic-name";
      nameCell.textContent = topic.nameTh;
      if (topic.gradeHint) {
        var gradeSpan = document.createElement("span");
        gradeSpan.className = "topic-grade";
        gradeSpan.textContent = topic.gradeHint;
        nameCell.appendChild(gradeSpan);
      }
      row.appendChild(nameCell);

      levels.forEach(function (level, levelIndex) {
        var entry = countsByKey[topic.id + ":" + level.id];
        var templateCount = entry ? Number(entry.templateCount || 0) : 0;

        topicTotal += templateCount;
        levelTotals[levelIndex] += templateCount;

        row.appendChild(countCell(templateCount));
      });

      var totalCell = document.createElement("td");
      totalCell.className = "total-cell";
      totalCell.textContent = formatNumber(topicTotal);
      row.appendChild(totalCell);

      if (topicTotal === 0) {
        row.className = "topic-empty";
      }

      grandTotal += topicTotal;
      tbody.appendChild(row);
    });

    var footRow = document.createElement("tr");
    var footLabel = document.createElement("td");
    footLabel.className = "topic-name";
    footLabel.textContent = "รวมทั้งหมด";
    footRow.appendChild(footLabel);

    levelTotals.forEach(function (total) {
      var cell = document.createElement("td");
      cell.textContent = formatNumber(total);
      footRow.appendChild(cell);
    });

    var footTotalCell = document.createElement("td");
    footTotalCell.className = "total-cell";
    footTotalCell.textContent = formatNumber(grandTotal);
    footRow.appendChild(footTotalCell);
    tfoot.appendChild(footRow);

    summaryTable.appendChild(thead);
    summaryTable.appendChild(tbody);
    summaryTable.appendChild(tfoot);
  }

  function th(label) {
    var cell = document.createElement("th");
    cell.textContent = label;
    return cell;
  }

  function countCell(count) {
    var cell = document.createElement("td");
    var pill = document.createElement("span");

    pill.className = "count-pill " + (count > 0 ? "has-data" : "zero");
    pill.textContent = count > 0 ? String(count) : "-";
    cell.appendChild(pill);

    return cell;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("th-TH");
  }

  function setMessage(message, isError) {
    if (!message) {
      summaryMessage.hidden = true;
      return;
    }
    summaryMessage.hidden = false;
    summaryMessage.classList.toggle("error", Boolean(isError));
    summaryMessage.textContent = message;
  }

  function friendlyError(message) {
    if (!message) {
      return "เกิดข้อผิดพลาด";
    }
    if (message.indexOf("Failed to fetch") !== -1) {
      return "โหลดข้อมูลไม่สำเร็จ ตรวจว่า npm run dev ยังเปิดอยู่";
    }
    return message;
  }
})();
