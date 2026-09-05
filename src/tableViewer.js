(function () {
  "use strict";

  var refreshTablesButton = document.getElementById("refreshTablesButton");
  var reloadTableButton = document.getElementById("reloadTableButton");
  var rowLimitSelect = document.getElementById("rowLimitSelect");
  var tableList = document.getElementById("tableList");
  var tableTitle = document.getElementById("tableTitle");
  var connectionStatus = document.getElementById("connectionStatus");
  var connectionSummaryText = document.getElementById("connectionSummaryText");
  var summaryStrip = document.getElementById("summaryStrip");
  var messagePanel = document.getElementById("messagePanel");
  var dataFrame = document.getElementById("dataFrame");
  var dataTable = document.getElementById("dataTable");

  var connection = {
    host: "127.0.0.1",
    port: "5433",
    database: "MathSolve",
    user: "postgres"
  };
  var tables = [];
  var activeTable = null;

  bindEvents();
  autoConnect();

  function bindEvents() {
    refreshTablesButton.addEventListener("click", loadTables);
    reloadTableButton.addEventListener("click", function () {
      if (activeTable) {
        loadTable(activeTable);
      }
    });
    rowLimitSelect.addEventListener("change", function () {
      if (activeTable) {
        loadTable(activeTable);
      }
    });
  }

  async function autoConnect() {
    setLoading("กำลังเชื่อมต่อ PostgreSQL จาก .env...");

    try {
      await checkHealth();
      await applyServerDefaults();
      await loadTables();
    } catch (error) {
      tableTitle.textContent = "เชื่อมต่อไม่สำเร็จ";
      showMessage(error.message, true);
    }
  }

  async function applyServerDefaults() {
    var defaults = await getJson("/api/db/defaults");

    connection = {
      host: defaults.host || connection.host,
      port: defaults.port || connection.port,
      database: defaults.database || connection.database,
      user: defaults.user || connection.user
    };

    renderConnectionSummary();
  }

  async function checkHealth() {
    var result = await getJson("/api/db/health");

    if (!result.ok) {
      throw new Error(result.message || "ยังต่อ PostgreSQL ไม่ได้");
    }
  }

  async function loadTables() {
    var previousTable = activeTable;

    setLoading("กำลังโหลดรายชื่อตาราง...");
    dataFrame.hidden = true;
    dataTable.innerHTML = "";

    try {
      var result = await postJson("/api/db/tables", {});

      tables = result.tables || [];
      renderTableList();
      renderConnectionSummary();
      connectionStatus.textContent = "เชื่อมต่อจาก .env แล้ว";

      if (!tables.length) {
        activeTable = null;
        tableTitle.textContent = "ยังไม่มีตาราง";
        summaryStrip.innerHTML = "";
        showMessage("ไม่พบ table ใน database นี้");
        return;
      }

      await loadTable(findSameTable(previousTable) || tables[0]);
    } catch (error) {
      tableTitle.textContent = "เชื่อมต่อไม่สำเร็จ";
      renderTableList();
      showMessage(error.message, true);
    }
  }

  function renderTableList() {
    tableList.innerHTML = "";

    tables.forEach(function (table) {
      var button = document.createElement("button");
      var name = document.createElement("span");
      var count = document.createElement("span");

      button.type = "button";
      button.className = "table-choice";
      button.dataset.schema = table.schema;
      button.dataset.table = table.name;

      name.textContent = table.schema + "." + table.name;
      count.className = "row-count";
      count.textContent = "~" + formatNumber(table.estimatedRows || 0);

      button.appendChild(name);
      button.appendChild(count);
      button.addEventListener("click", function () {
        loadTable(table);
      });

      tableList.appendChild(button);
    });

    updateActiveTableButton();
  }

  async function loadTable(table) {
    activeTable = table;
    updateActiveTableButton();
    setLoading("กำลังโหลด " + table.schema + "." + table.name + "...");
    tableTitle.textContent = table.schema + "." + table.name;

    try {
      var result = await postJson("/api/db/table", {
        schema: table.schema,
        table: table.name,
        limit: rowLimitSelect.value
      });

      renderSummary(result.table);
      renderRows(result.table.columns || [], result.table.rows || []);
      messagePanel.hidden = true;
      messagePanel.classList.remove("error");
      dataFrame.hidden = false;
    } catch (error) {
      showMessage(error.message, true);
    }
  }

  function findSameTable(table) {
    if (!table) {
      return null;
    }

    return (
      tables.find(function (item) {
        return item.schema === table.schema && item.name === table.name;
      }) || null
    );
  }

  function updateActiveTableButton() {
    Array.prototype.forEach.call(tableList.children, function (button) {
      var isActive =
        activeTable &&
        button.dataset.schema === activeTable.schema &&
        button.dataset.table === activeTable.name;

      button.classList.toggle("active", Boolean(isActive));
      button.setAttribute("aria-pressed", String(Boolean(isActive)));
    });
  }

  function renderConnectionSummary() {
    connectionSummaryText.textContent =
      connection.database + " @ " + connection.host + ":" + connection.port + " จาก .env";
  }

  function renderSummary(table) {
    summaryStrip.innerHTML = "";
    summaryStrip.appendChild(summaryCard("Rows", formatNumber(table.rowCount || 0)));
    summaryStrip.appendChild(summaryCard("Columns", formatNumber((table.columns || []).length)));
    summaryStrip.appendChild(summaryCard("Showing", formatNumber((table.rows || []).length)));
  }

  function summaryCard(label, value) {
    var card = document.createElement("article");
    var labelNode = document.createElement("span");
    var valueNode = document.createElement("strong");

    card.className = "summary-card";
    labelNode.textContent = label;
    valueNode.textContent = value;
    card.appendChild(labelNode);
    card.appendChild(valueNode);

    return card;
  }

  function renderRows(columns, rows) {
    dataTable.innerHTML = "";

    var thead = document.createElement("thead");
    var tbody = document.createElement("tbody");
    var headerRow = document.createElement("tr");

    columns.forEach(function (column) {
      var th = document.createElement("th");
      th.textContent = column.name;
      th.title = column.type;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);

    if (!rows.length) {
      var emptyRow = document.createElement("tr");
      var emptyCell = document.createElement("td");
      emptyCell.colSpan = Math.max(columns.length, 1);
      emptyCell.textContent = "ไม่มีข้อมูลในตารางนี้";
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    } else {
      rows.forEach(function (row) {
        var tr = document.createElement("tr");
        columns.forEach(function (column) {
          var td = document.createElement("td");
          var value = row[column.name];

          if (value === null || typeof value === "undefined") {
            td.className = "null-value";
            td.textContent = "NULL";
          } else if (typeof value === "object") {
            td.textContent = JSON.stringify(value);
          } else {
            td.textContent = String(value);
          }

          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }

    dataTable.appendChild(thead);
    dataTable.appendChild(tbody);
  }

  function setLoading(message) {
    messagePanel.hidden = false;
    messagePanel.classList.remove("error");
    messagePanel.textContent = message;
  }

  function showMessage(message, isError) {
    messagePanel.hidden = false;
    messagePanel.classList.toggle("error", Boolean(isError));
    messagePanel.textContent = friendlyError(message);
    dataFrame.hidden = true;
  }

  function friendlyError(message) {
    if (!message) {
      return "เกิดข้อผิดพลาด";
    }

    if (message.indexOf("no password supplied") !== -1) {
      return "PostgreSQL ต้องใช้ password ให้ใส่ไว้ใน .env แล้ว restart npm run dev";
    }

    if (message.indexOf("password authentication failed") !== -1) {
      return "password ใน .env ยังไม่ถูกต้อง ลองเช็ก PGUSER และ PGPASSWORD อีกครั้ง";
    }

    if (message.indexOf("database") !== -1 && message.indexOf("does not exist") !== -1) {
      return "ไม่พบ database นี้ ลองเช็ก PGDATABASE ใน .env ว่าเป็น MathSolve ตรงตัวหรือไม่";
    }

    if (message.indexOf("Failed to fetch") !== -1 || message.indexOf("Request failed") !== -1) {
      return "โหลดข้อมูลไม่สำเร็จ ลอง refresh หน้าอีกครั้ง หรือตรวจว่า npm run dev ยังเปิดอยู่";
    }

    return message;
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
      body: JSON.stringify(body || {})
    });

    return parseJsonResponse(response);
  }

  async function parseJsonResponse(response) {
    var data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      throw new Error(data.error || response.statusText || "Request failed");
    }

    return data;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("th-TH");
  }
})();
