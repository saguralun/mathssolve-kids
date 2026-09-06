const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const rootDir = __dirname;
loadEnvFile(path.join(rootDir, ".env"));

const port = Number(process.env.PORT || 5174);
const psqlPath = findPsqlPath();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, "http://127.0.0.1");

    if (request.method === "GET" && request.url === "/api/db/health") {
      sendJson(response, 200, {
        ok: Boolean(psqlPath),
        psqlPath,
        message: psqlPath ? "psql พร้อมใช้งาน" : "หา psql.exe ไม่เจอ"
      });
      return;
    }

    if (request.method === "GET" && request.url === "/api/db/defaults") {
      const connection = normalizeConnection();
      sendJson(response, 200, {
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.user,
        hasPassword: Boolean(connection.password)
      });
      return;
    }

    if (request.method === "POST" && request.url === "/api/db/tables") {
      await handleTables(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/db/table") {
      await handleTableRows(request, response);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/problems/options") {
      await handleProblemOptions(request, response);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/practice/problems") {
      await handlePracticeProblems(request, response);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/problems/next-code") {
      await handleProblemNextCode(request, response, requestUrl);
      return;
    }

    if (request.method === "POST" && request.url === "/api/problems/import") {
      await handleProblemImport(request, response);
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }

    serveStatic(request, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Unexpected server error" });
  }
});

server.listen(port, () => {
  console.log(`MathsSolve dev server: http://127.0.0.1:${port}/`);
  console.log(`Table viewer: http://127.0.0.1:${port}/tables.html`);
  console.log(`Problem importer: http://127.0.0.1:${port}/import-problems.html`);
  console.log(psqlPath ? `psql: ${psqlPath}` : "psql: not found");
});

async function handleTables(request, response) {
  const connection = normalizeConnection();
  const sql = `
    WITH user_tables AS (
      SELECT
        c.oid,
        n.nspname AS schema_name,
        c.relname AS table_name,
        COALESCE(s.n_live_tup, 0)::bigint AS estimated_rows
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
      WHERE c.relkind = 'r'
        AND n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND n.nspname NOT LIKE 'pg_toast%'
    ),
    table_columns AS (
      SELECT
        table_schema,
        table_name,
        json_agg(
          json_build_object(
            'name', column_name,
            'type', data_type,
            'nullable', is_nullable = 'YES'
          )
          ORDER BY ordinal_position
        ) AS columns
      FROM information_schema.columns
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      GROUP BY table_schema, table_name
    )
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'schema', t.schema_name,
          'name', t.table_name,
          'estimatedRows', t.estimated_rows,
          'columns', COALESCE(c.columns, '[]'::json)
        )
        ORDER BY t.schema_name, t.table_name
      ),
      '[]'::json
    )::text
    FROM user_tables t
    LEFT JOIN table_columns c
      ON c.table_schema = t.schema_name
     AND c.table_name = t.table_name;
  `;

  const tables = JSON.parse(await runPsql(connection, sql));
  sendJson(response, 200, { tables });
}

async function handleTableRows(request, response) {
  const body = await readJsonBody(request);
  const connection = normalizeConnection();
  const schemaName = String(body.schema || "public");
  const tableName = String(body.table || "");
  const limit = clampInteger(body.limit, 1, 500, 100);
  const offset = clampInteger(body.offset, 0, 1000000, 0);

  if (!tableName) {
    sendJson(response, 400, { error: "ต้องระบุชื่อตาราง" });
    return;
  }

  const relation = `${quoteIdentifier(schemaName)}.${quoteIdentifier(tableName)}`;
  const sql = `
    WITH table_rows AS (
      SELECT COALESCE(json_agg(row_to_json(source_rows)), '[]'::json) AS rows
      FROM (
        SELECT *
        FROM ${relation}
        LIMIT ${limit}
        OFFSET ${offset}
      ) source_rows
    ),
    table_count AS (
      SELECT COUNT(*)::bigint AS row_count
      FROM ${relation}
    ),
    table_columns AS (
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'name', column_name,
            'type', data_type,
            'nullable', is_nullable = 'YES'
          )
          ORDER BY ordinal_position
        ),
        '[]'::json
      ) AS columns
      FROM information_schema.columns
      WHERE table_schema = ${sqlString(schemaName)}
        AND table_name = ${sqlString(tableName)}
    )
    SELECT json_build_object(
      'schema', ${sqlString(schemaName)},
      'name', ${sqlString(tableName)},
      'limit', ${limit},
      'offset', ${offset},
      'rowCount', (SELECT row_count FROM table_count),
      'columns', (SELECT columns FROM table_columns),
      'rows', (SELECT rows FROM table_rows)
    )::text;
  `;

  const table = JSON.parse(await runPsql(connection, sql));
  sendJson(response, 200, { table });
}

async function handleProblemOptions(request, response) {
  const connection = normalizeConnection();
  const sql = `
    SELECT json_build_object(
      'topics',
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', id,
              'code', code,
              'nameTh', name_th,
              'descriptionTh', description_th,
              'gradeHint', grade_hint,
              'sortOrder', sort_order
            )
            ORDER BY sort_order, id
          )
          FROM topics
          WHERE is_active = TRUE
        ),
        '[]'::json
      ),
      'levels',
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', id,
              'code', code,
              'nameTh', name_th,
              'descriptionTh', description_th,
              'sortOrder', sort_order
            )
            ORDER BY sort_order, id
          )
          FROM levels
          WHERE is_active = TRUE
        ),
        '[]'::json
      ),
      'sources',
      COALESCE(
        (
          SELECT json_agg(DISTINCT source_name ORDER BY source_name)
          FROM problem_templates
          WHERE source_name IS NOT NULL AND source_name <> ''
        ),
        '[]'::json
      ),
      'hints',
      COALESCE(
        (
          SELECT json_agg(
            json_build_object('id', id, 'code', code, 'hintText', hint_text)
            ORDER BY sort_order, id
          )
          FROM problem_hints
          WHERE is_active = TRUE
        ),
        '[]'::json
      )
    )::text;
  `;

  const options = JSON.parse(await runPsql(connection, sql));
  sendJson(response, 200, options);
}

async function handlePracticeProblems(request, response) {
  const connection = normalizeConnection();
  const sql = `
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'templateId', pt.id,
          'code', pt.code,
          'topicCode', t.code,
          'topicName', t.name_th,
          'levelId', pt.level_id,
          'promptTemplateTh', pt.prompt_template_th,
          'answerDecimalPlaces', pt.answer_decimal_places,
          'hintText', ph.hint_text,
          'variants', (
            SELECT COALESCE(json_agg(json_build_object('variantNo', pv.variant_no, 'variantValues', pv.variant_values)), '[]'::json)
            FROM problem_variants pv
            WHERE pv.problem_template_id = pt.id
              AND pv.is_active = TRUE
          )
        )
        ORDER BY t.sort_order, pt.level_id, pt.code
      ),
      '[]'::json
    )::text
    FROM problem_templates pt
    JOIN topics t ON t.id = pt.topic_id
    LEFT JOIN problem_hints ph ON ph.id = pt.hint_id AND ph.is_active = TRUE
    WHERE pt.is_active = TRUE
      AND t.is_active = TRUE;
  `;

  const templates = JSON.parse(await runPsql(connection, sql));
  sendJson(response, 200, { templates });
}

async function handleProblemNextCode(request, response, requestUrl) {
  const connection = normalizeConnection();
  const topicCode = normalizeCodePart(requestUrl.searchParams.get("topicCode") || "");
  const levelId = clampInteger(requestUrl.searchParams.get("levelId"), 1, 5, 0);

  if (!topicCode || !levelId) {
    sendJson(response, 400, { error: "ต้องเลือกเรื่องและระดับความยากก่อน" });
    return;
  }

  const prefix = buildProblemCodePrefix(topicCode, levelId);
  const pattern = `^${prefix}([0-9]+)$`;
  const sql = `
    SELECT json_build_object(
      'code',
      ${sqlString(prefix)} ||
        lpad(
          (
            COALESCE(
              MAX((substring(code FROM ${sqlString(pattern)}))::integer),
              0
            ) + 1
          )::text,
          3,
          '0'
        )
    )::text
    FROM problem_templates;
  `;

  const result = JSON.parse(await runPsql(connection, sql));
  sendJson(response, 200, result);
}

async function handleProblemImport(request, response) {
  const body = await readJsonBody(request);
  const connection = normalizeConnection();
  const problem = normalizeProblemPayload(body);
  const sql = buildProblemImportSql(problem);
  const result = JSON.parse(await runPsql(connection, sql));

  if (!result || result.templateCount !== 1) {
    sendJson(response, 400, {
      error: "ไม่พบ topic หรือ level ที่เลือกไว้ ลองรัน db/001_create_tables.sql และ db/002_insert_master_data.sql ก่อน"
    });
    return;
  }

  sendJson(response, 200, {
    templateCode: result.templateCode,
    variantCount: result.variantCount
  });
}

function normalizeProblemPayload(body) {
  const templateInput = body.template || {};
  const template = {
    code: requiredText(templateInput.code, "รหัสโจทย์แม่"),
    topicCode: requiredText(templateInput.topicCode, "เรื่อง"),
    levelId: clampInteger(templateInput.levelId, 1, 5, 0),
    promptTemplateTh: requiredText(templateInput.promptTemplateTh, "โจทย์แม่"),
    // Optional free-text tag (TEDET, สสวท, ชื่อโรงเรียน, ...) — a problem with
    // no known exam source just stays untagged (source_name NULL).
    sourceName: optionalText(templateInput.sourceName),
    // 0 = whole-number answer (unchanged default). 1-4 shifts the decimal
    // point that many places in from the right of the 5-digit answer sheet.
    answerDecimalPlaces: clampInteger(templateInput.answerDecimalPlaces, 0, 4, 0),
    // At most one problem_hints row (e.g. "กำหนดให้ π ≈ 22/7") auto-appended
    // to the prompt at render time — never typed into promptTemplateTh.
    hintId: clampInteger(templateInput.hintId, 1, 32767, 0) || null
  };

  if (!template.levelId) {
    throw new Error("ระดับความยากต้องอยู่ระหว่าง 1-5");
  }

  if (!Array.isArray(body.variants)) {
    throw new Error("ต้องมีชุดตัวเลขอย่างน้อย 1 ชุด");
  }

  const variants = body.variants.map(normalizeVariantPayload).filter(Boolean);

  if (!variants.length) {
    throw new Error("ต้องมีชุดตัวเลขอย่างน้อย 1 ชุด");
  }

  if (variants.length > 5) {
    throw new Error("โจทย์แม่หนึ่งข้อควรมีชุดตัวเลขไม่เกิน 5 ชุด");
  }

  const usedVariantNumbers = new Set();
  variants.forEach((variant) => {
    if (usedVariantNumbers.has(variant.variantNo)) {
      throw new Error(`ชุดตัวเลขเลขที่ ${variant.variantNo} ซ้ำกัน`);
    }
    usedVariantNumbers.add(variant.variantNo);
  });

  return { template, variants };
}

function normalizeVariantPayload(input, index) {
  if (!input || input.isActive === false) {
    return null;
  }

  const variantNo = clampInteger(input.variantNo || index + 1, 1, 5, 0);

  if (!variantNo) {
    throw new Error("เลขชุดตัวเลขต้องอยู่ระหว่าง 1-5");
  }

  return {
    variantNo,
    variantValues: normalizeVariantValues(input.variantValues, variantNo)
  };
}

function normalizeVariantValues(value, variantNo) {
  let variantValues = value;

  if (typeof variantValues === "string") {
    variantValues = variantValues.trim() ? JSON.parse(variantValues) : {};
  }

  if (!variantValues || typeof variantValues !== "object" || Array.isArray(variantValues)) {
    throw new Error(`ค่าชุดที่ ${variantNo} ต้องเป็น JSON object`);
  }

  if (!Object.prototype.hasOwnProperty.call(variantValues, "answer")) {
    throw new Error(`ค่าชุดที่ ${variantNo} ต้องมี answer`);
  }

  return Object.fromEntries(
    Object.entries(variantValues).map(([key, entryValue]) => [
      key,
      entryValue === null || typeof entryValue === "undefined" ? "" : String(entryValue)
    ])
  );
}

function buildProblemImportSql(problem) {
  const template = problem.template;
  const variantRows = problem.variants
    .map((variant) => {
      return `(
        ${variant.variantNo}::smallint,
        ${sqlJson(variant.variantValues)}
      )`;
    })
    .join(",\n      ");

  return `
    BEGIN;

    WITH incoming_template AS (
      SELECT
        ${sqlString(template.code)}::text AS code,
        ${sqlString(template.topicCode)}::text AS topic_code,
        ${template.levelId}::smallint AS level_id,
        ${sqlString(template.promptTemplateTh)}::text AS prompt_template_th,
        ${template.sourceName ? `${sqlString(template.sourceName)}::text` : "NULL::text"} AS source_name,
        ${template.answerDecimalPlaces}::smallint AS answer_decimal_places,
        ${template.hintId ? `${template.hintId}::smallint` : "NULL::smallint"} AS hint_id
    ),
    upsert_template AS (
      INSERT INTO problem_templates (
        code,
        topic_id,
        level_id,
        prompt_template_th,
        source_name,
        answer_decimal_places,
        hint_id
      )
      SELECT
        it.code,
        t.id,
        l.id,
        it.prompt_template_th,
        it.source_name,
        it.answer_decimal_places,
        it.hint_id
      FROM incoming_template it
      JOIN topics t ON t.code = it.topic_code
      JOIN levels l ON l.id = it.level_id
      ON CONFLICT (code) DO UPDATE SET
        topic_id = EXCLUDED.topic_id,
        level_id = EXCLUDED.level_id,
        prompt_template_th = EXCLUDED.prompt_template_th,
        source_name = EXCLUDED.source_name,
        answer_decimal_places = EXCLUDED.answer_decimal_places,
        hint_id = EXCLUDED.hint_id,
        is_active = TRUE
      RETURNING id, code
    ),
    incoming_variants (
      variant_no,
      variant_values
    ) AS (
      VALUES
      ${variantRows}
    ),
    upsert_variants AS (
      INSERT INTO problem_variants (
        problem_template_id,
        variant_no,
        variant_values
      )
      SELECT
        ut.id,
        iv.variant_no,
        iv.variant_values
      FROM incoming_variants iv
      CROSS JOIN upsert_template ut
      ON CONFLICT (problem_template_id, variant_no) DO UPDATE SET
        variant_values = EXCLUDED.variant_values,
        is_active = TRUE
      RETURNING id
    )
    SELECT json_build_object(
      'templateId', (SELECT id FROM upsert_template),
      'templateCode', ${sqlString(template.code)},
      'templateCount', (SELECT COUNT(*) FROM upsert_template),
      'variantCount', (SELECT COUNT(*) FROM upsert_variants)
    )::text;

    COMMIT;
  `;
}

function runPsql(connection, sql) {
  if (!psqlPath) {
    return Promise.reject(new Error("หา psql.exe ไม่เจอในเครื่องนี้"));
  }

  const args = [
    "-h",
    connection.host,
    "-p",
    String(connection.port),
    "-U",
    connection.user,
    "-d",
    connection.database,
    "-X",
    "-q",
    "-w",
    "-v",
    "ON_ERROR_STOP=1",
    "-t",
    "-A",
    "-f",
    "-"
  ];

  const env = {
    ...process.env,
    PGCLIENTENCODING: "UTF8"
  };

  if (connection.password) {
    env.PGPASSWORD = connection.password;
  }

  return new Promise((resolve, reject) => {
    // SQL is fed over stdin (via "-f -") instead of as a "-c" command-line
    // argument. Windows rewrites non-ASCII command-line arguments through the
    // system codepage before the child process sees them, which corrupts
    // Thai text (e.g. "invalid byte sequence for encoding UTF8"). Writing to
    // stdin as a UTF-8 buffer bypasses that conversion entirely.
    const child = execFile(psqlPath, args, { env, timeout: 15000, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        const detail = String(stderr || error.message || "").trim();
        reject(new Error(detail || "เชื่อมต่อ PostgreSQL ไม่สำเร็จ"));
        return;
      }

      resolve(String(stdout || "").trim() || "null");
    });

    child.stdin.end(Buffer.from(sql, "utf8"));
  });
}

function normalizeConnection() {
  return {
    host: String(process.env.PGHOST || "127.0.0.1"),
    port: clampInteger(process.env.PGPORT, 1, 65535, 5432),
    database: String(process.env.PGDATABASE || "MathSolve"),
    user: String(process.env.PGUSER || "postgres"),
    password: String(process.env.PGPASSWORD || "")
  };
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
      return;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  });
}

function findPsqlPath() {
  const candidates = [
    process.env.PSQL_PATH,
    "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\18\\pgAdmin 4\\runtime\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\17\\pgAdmin 4\\runtime\\psql.exe",
    "psql"
  ].filter(Boolean);

  return candidates.find((candidate) => {
    if (candidate === "psql") {
      return true;
    }
    return fs.existsSync(candidate);
  });
}

function serveStatic(request, response) {
  const parsedUrl = new URL(request.url, "http://127.0.0.1");
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(rootDir, `.${requestedPath}`);

  if (!filePath.startsWith(rootDir)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendText(response, 404, "Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
      "Cache-Control": "no-store"
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    fs.createReadStream(filePath).pipe(response);
  });
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";

    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        request.destroy();
        reject(new Error("Request body ใหญ่เกินไป"));
      }
    });

    request.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("JSON body ไม่ถูกต้อง"));
      }
    });

    request.on("error", reject);
  });
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(data));
}

function sendText(response, status, text) {
  response.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(text);
}

function buildProblemCodePrefix(topicCode, levelId) {
  return `${normalizeCodePart(topicCode)}_l${levelId}_`;
}

function normalizeCodePart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlJson(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function requiredText(value, label) {
  const text = optionalText(value);

  if (!text) {
    throw new Error(`ต้องกรอก${label}`);
  }

  return text;
}

function optionalText(value) {
  if (value === null || typeof value === "undefined") {
    return "";
  }

  return String(value).trim();
}

function clampInteger(value, min, max, fallback) {
  const number = Math.floor(Number(value));

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, number));
}
