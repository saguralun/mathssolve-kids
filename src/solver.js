(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MathsSolve = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function Rational(numerator, denominator) {
    var n = toBigInt(numerator);
    var d = typeof denominator === "undefined" ? 1n : toBigInt(denominator);

    if (d === 0n) {
      throw new Error("ตัวส่วนเป็น 0 ไม่ได้");
    }
    if (d < 0n) {
      n = -n;
      d = -d;
    }

    var divisor = gcd(absBigInt(n), d);
    this.n = n / divisor;
    this.d = d / divisor;
  }

  Rational.fromDecimal = function (raw) {
    var text = String(raw).trim();
    var sign = 1n;

    if (text[0] === "-") {
      sign = -1n;
      text = text.slice(1);
    }

    if (text.indexOf(".") === -1) {
      return new Rational(sign * BigInt(text || "0"), 1n);
    }

    var parts = text.split(".");
    var whole = parts[0] || "0";
    var decimal = parts[1] || "0";
    var denominator = 10n ** BigInt(decimal.length);
    var numerator = BigInt(whole + decimal) * sign;
    return new Rational(numerator, denominator);
  };

  Rational.prototype.add = function (other) {
    return new Rational(this.n * other.d + other.n * this.d, this.d * other.d);
  };

  Rational.prototype.subtract = function (other) {
    return new Rational(this.n * other.d - other.n * this.d, this.d * other.d);
  };

  Rational.prototype.multiply = function (other) {
    return new Rational(this.n * other.n, this.d * other.d);
  };

  Rational.prototype.divide = function (other) {
    if (other.n === 0n) {
      throw new Error("หารด้วย 0 ไม่ได้");
    }
    return new Rational(this.n * other.d, this.d * other.n);
  };

  Rational.prototype.negate = function () {
    return new Rational(-this.n, this.d);
  };

  Rational.prototype.compare = function (other) {
    var left = this.n * other.d;
    var right = other.n * this.d;

    if (left < right) {
      return -1;
    }
    if (left > right) {
      return 1;
    }
    return 0;
  };

  Rational.prototype.isZero = function () {
    return this.n === 0n;
  };

  Rational.prototype.toFractionString = function () {
    if (this.d === 1n) {
      return this.n.toString();
    }
    return this.n.toString() + "/" + this.d.toString();
  };

  Rational.prototype.toMixedString = function () {
    if (this.d === 1n || this.n === 0n) {
      return this.n.toString();
    }

    var sign = this.n < 0n ? "-" : "";
    var positive = absBigInt(this.n);
    var whole = positive / this.d;
    var rest = positive % this.d;

    if (whole === 0n) {
      return sign + rest.toString() + "/" + this.d.toString();
    }
    if (rest === 0n) {
      return sign + whole.toString();
    }
    return sign + whole.toString() + " " + rest.toString() + "/" + this.d.toString();
  };

  Rational.prototype.toDecimalString = function (places) {
    var limit = places || 8;
    var sign = this.n < 0n ? "-" : "";
    var positive = absBigInt(this.n);
    var whole = positive / this.d;
    var rest = positive % this.d;

    if (rest === 0n) {
      return sign + whole.toString();
    }

    var digits = "";
    for (var index = 0; index < limit && rest !== 0n; index += 1) {
      rest *= 10n;
      digits += (rest / this.d).toString();
      rest %= this.d;
    }

    digits = digits.replace(/0+$/, "");
    return sign + whole.toString() + "." + digits + (rest === 0n ? "" : "...");
  };

  Rational.prototype.toAnswerString = function () {
    return this.toMixedString();
  };

  function solve(input, options) {
    var source = normalizeSource(input);
    var mode = options && options.mode ? options.mode : detectMode(source);

    if (!source) {
      throw new Error("ใส่โจทย์ก่อนนะ");
    }
    if (mode === "compare") {
      return solveComparison(source);
    }
    if (mode === "proportion") {
      return solveProportion(source);
    }
    return solveFractionExpression(source);
  }

  function solveFractionExpression(source) {
    var evaluation = evaluateExpression(source);
    var value = evaluation.value;
    var steps = ["แปลงจำนวนทั้งหมดให้อยู่ในรูปเศษส่วนก่อนคำนวณ"].concat(evaluation.steps);

    if (evaluation.steps.length === 0) {
      steps.push("ลดรูปเศษส่วนให้อยู่ในรูปอย่างต่ำ: " + value.toFractionString());
    }

    steps.push("คำตอบสุดท้าย: " + value.toAnswerString());

    return {
      kind: "เศษส่วน",
      answer: value.toAnswerString(),
      value: value,
      details: fractionDetails(value),
      steps: steps
    };
  }

  function solveComparison(source) {
    var parts = splitComparison(source);
    var leftEval = evaluateExpression(parts.left);
    var rightEval = evaluateExpression(parts.right);
    var left = leftEval.value;
    var right = rightEval.value;
    var compare = left.compare(right);
    var relation = compare < 0 ? "<" : compare > 0 ? ">" : "=";
    var statement = left.toAnswerString() + " " + relation + " " + right.toAnswerString();
    var answer = statement;
    var steps = leftEval.steps.concat(rightEval.steps);
    var crossLeft = left.n * right.d;
    var crossRight = right.n * left.d;

    if (parts.operator) {
      var expected = normalizeComparisonOperator(parts.operator);
      var isTrue = relationMatches(compare, expected);
      answer = (isTrue ? "จริง: " : "ไม่จริง: ") + left.toAnswerString() + " " + expected + " " + right.toAnswerString();

      if (!isTrue) {
        answer += " (ที่ถูกคือ " + statement + ")";
      }
    }

    steps.push(
      "คูณไขว้: " +
        left.n.toString() + " x " + right.d.toString() +
        " = " + crossLeft.toString() +
        " และ " +
        right.n.toString() + " x " + left.d.toString() +
        " = " + crossRight.toString()
    );
    steps.push("เปรียบเทียบผลคูณไขว้แล้วได้ " + statement);

    return {
      kind: "เทียบเศษส่วน",
      answer: answer,
      comparison: compare,
      relation: relation,
      details: [
        { label: "จำนวนซ้าย", value: left.toAnswerString() },
        { label: "จำนวนขวา", value: right.toAnswerString() },
        { label: "ความสัมพันธ์", value: statement }
      ],
      steps: steps
    };
  }

  function solveProportion(source) {
    var parsed = parseRatioProportion(source) || parseWordProportion(source);

    if (!parsed) {
      throw new Error("เขียนเป็น 3 : 45 = 7 : ? หรือใส่โจทย์ที่มีตัวเลข 3 จำนวนกับคำว่าเท่าไร");
    }

    var slots = parsed.slots;
    var missing = -1;
    var knownCount = 0;

    slots.forEach(function (slot, index) {
      if (slot === null) {
        missing = index;
      } else {
        knownCount += 1;
      }
    });

    if (knownCount !== 3 || missing === -1) {
      throw new Error("บัญญัติไตรยางค์ต้องมีค่าที่ทราบ 3 ค่า และค่าที่หายไป 1 ค่า");
    }

    var result = solveMissingProportion(slots, missing);
    var display = slots.map(function (slot) {
      return slot ? slot.toAnswerString() : "?";
    });
    var proportion = display[0] + " : " + display[1] + " = " + display[2] + " : " + display[3];

    return {
      kind: "บัญญัติไตรยางค์",
      answer: "? = " + result.toAnswerString(),
      value: result,
      details: fractionDetails(result),
      steps: [
        "ตั้งสัดส่วน: " + proportion,
        crossMultiplicationStep(slots),
        missingFormulaStep(slots, missing, result),
        "คำตอบสุดท้าย: " + result.toAnswerString()
      ]
    };
  }

  function solveMissingProportion(slots, missing) {
    var a = slots[0];
    var b = slots[1];
    var c = slots[2];
    var d = slots[3];

    if (missing === 0) {
      ensureNotZero(d, "ตัวหาร");
      return b.multiply(c).divide(d);
    }
    if (missing === 1) {
      ensureNotZero(c, "ตัวหาร");
      return a.multiply(d).divide(c);
    }
    if (missing === 2) {
      ensureNotZero(b, "ตัวหาร");
      return a.multiply(d).divide(b);
    }

    ensureNotZero(a, "ตัวหาร");
    return b.multiply(c).divide(a);
  }

  function crossMultiplicationStep(slots) {
    var names = slots.map(function (slot) {
      return slot ? slot.toAnswerString() : "?";
    });
    return "คูณไขว้: " + names[0] + " x " + names[3] + " = " + names[1] + " x " + names[2];
  }

  function missingFormulaStep(slots, missing, result) {
    var names = slots.map(function (slot) {
      return slot ? slot.toAnswerString() : "?";
    });

    if (missing === 0) {
      return "? = (" + names[1] + " x " + names[2] + ") / " + names[3] + " = " + result.toAnswerString();
    }
    if (missing === 1) {
      return "? = (" + names[0] + " x " + names[3] + ") / " + names[2] + " = " + result.toAnswerString();
    }
    if (missing === 2) {
      return "? = (" + names[0] + " x " + names[3] + ") / " + names[1] + " = " + result.toAnswerString();
    }
    return "? = (" + names[1] + " x " + names[2] + ") / " + names[0] + " = " + result.toAnswerString();
  }

  function evaluateExpression(source) {
    var prepared = replaceMixedNumbers(normalizeSource(source));
    var parser = new Parser(tokenize(prepared));
    var ast = parser.parseExpression();

    if (parser.peek().type !== "eof") {
      throw new Error("อ่านโจทย์ไม่จบตรง '" + parser.peek().value + "'");
    }

    var steps = [];
    var value = evaluateAst(ast, steps);

    return {
      value: value,
      steps: steps
    };
  }

  function evaluateAst(node, steps) {
    if (node.type === "number") {
      return node.value;
    }

    if (node.type === "unary") {
      var negated = evaluateAst(node.argument, steps).negate();
      steps.push("ใส่เครื่องหมายลบ: " + negated.toAnswerString());
      return negated;
    }

    var left = evaluateAst(node.left, steps);
    var right = evaluateAst(node.right, steps);
    var result;

    if (node.operator === "+") {
      result = left.add(right);
    } else if (node.operator === "-") {
      result = left.subtract(right);
    } else if (node.operator === "*") {
      result = left.multiply(right);
    } else if (node.operator === "/") {
      result = left.divide(right);
    } else {
      throw new Error("ยังไม่รองรับเครื่องหมาย " + node.operator);
    }

    describeOperation(left, node.operator, right, result).forEach(function (step) {
      steps.push(step);
    });
    return result;
  }

  function describeOperation(left, operator, right, result) {
    if (operator === "+" || operator === "-") {
      var common = lcm(left.d, right.d);
      var scaledLeftNumerator = left.n * (common / left.d);
      var scaledRightNumerator = right.n * (common / right.d);
      var sign = operator === "+" ? " + " : " - ";
      var combined = operator === "+"
        ? scaledLeftNumerator + scaledRightNumerator
        : scaledLeftNumerator - scaledRightNumerator;

      return [
        "ทำส่วนให้เท่ากัน: " +
          left.toFractionString() + " = " + scaledLeftNumerator.toString() + "/" + common.toString() +
          " และ " +
          right.toFractionString() + " = " + scaledRightNumerator.toString() + "/" + common.toString(),
        "รวมตัวเศษ: " +
          scaledLeftNumerator.toString() + "/" + common.toString() +
          sign +
          scaledRightNumerator.toString() + "/" + common.toString() +
          " = " +
          combined.toString() + "/" + common.toString() +
          simplifySuffix(new Rational(combined, common), result)
      ];
    }

    if (operator === "*") {
      var productNumerator = left.n * right.n;
      var productDenominator = left.d * right.d;
      return [
        "คูณตัวเศษและตัวส่วน: " +
          left.toFractionString() + " x " + right.toFractionString() +
          " = " +
          productNumerator.toString() + "/" + productDenominator.toString() +
          simplifySuffix(new Rational(productNumerator, productDenominator), result)
      ];
    }

    var reciprocal = new Rational(right.d, right.n);
    var divisionNumerator = left.n * right.d;
    var divisionDenominator = left.d * right.n;
    return [
      "เปลี่ยนหารเป็นคูณด้วยส่วนกลับ: " +
        left.toFractionString() + " / " + right.toFractionString() +
        " = " + left.toFractionString() + " x " + reciprocal.toFractionString(),
      "คูณแล้วลดรูป: " +
        divisionNumerator.toString() + "/" + divisionDenominator.toString() +
        simplifySuffix(new Rational(divisionNumerator, divisionDenominator), result)
    ];
  }

  function simplifySuffix(raw, result) {
    var rawText = raw.toFractionString();
    var resultText = result.toAnswerString();

    if (rawText === resultText || raw.toMixedString() === resultText) {
      return " = " + resultText;
    }
    return " = " + rawText + " = " + resultText;
  }

  function Parser(tokens) {
    this.tokens = tokens;
    this.index = 0;
  }

  Parser.prototype.peek = function () {
    return this.tokens[this.index] || { type: "eof", value: "" };
  };

  Parser.prototype.advance = function () {
    var token = this.peek();
    this.index += 1;
    return token;
  };

  Parser.prototype.match = function (type) {
    if (this.peek().type === type) {
      this.advance();
      return true;
    }
    return false;
  };

  Parser.prototype.expect = function (type) {
    if (!this.match(type)) {
      throw new Error("ต้องมี '" + type + "'");
    }
  };

  Parser.prototype.parseExpression = function () {
    var node = this.parseTerm();

    while (this.peek().type === "+" || this.peek().type === "-") {
      node = {
        type: "binary",
        operator: this.advance().type,
        left: node,
        right: this.parseTerm()
      };
    }
    return node;
  };

  Parser.prototype.parseTerm = function () {
    var node = this.parseUnary();

    while (this.peek().type === "*" || this.peek().type === "/") {
      node = {
        type: "binary",
        operator: this.advance().type,
        left: node,
        right: this.parseUnary()
      };
    }
    return node;
  };

  Parser.prototype.parseUnary = function () {
    if (this.match("+")) {
      return this.parseUnary();
    }
    if (this.match("-")) {
      return {
        type: "unary",
        argument: this.parseUnary()
      };
    }
    return this.parsePrimary();
  };

  Parser.prototype.parsePrimary = function () {
    var token = this.advance();

    if (token.type === "number") {
      return {
        type: "number",
        value: token.value
      };
    }

    if (token.type === "(") {
      var node = this.parseExpression();
      this.expect(")");
      return node;
    }

    throw new Error("เจอ '" + token.value + "' ในตำแหน่งที่ยังอ่านไม่ได้");
  };

  function tokenize(source) {
    var tokens = [];
    var index = 0;

    while (index < source.length) {
      var character = source[index];

      if (/\s/.test(character)) {
        index += 1;
        continue;
      }

      if (/[0-9.]/.test(character)) {
        var start = index;
        var dotCount = 0;

        while (index < source.length && /[0-9.]/.test(source[index])) {
          if (source[index] === ".") {
            dotCount += 1;
          }
          index += 1;
        }

        var raw = source.slice(start, index);
        if (dotCount > 1 || raw === ".") {
          throw new Error("รูปแบบตัวเลขไม่ถูกต้อง: " + raw);
        }

        if (source[index] === "/" && /[0-9.]/.test(source[index + 1] || "")) {
          index += 1;
          var denominatorStart = index;
          var denominatorDotCount = 0;

          while (index < source.length && /[0-9.]/.test(source[index])) {
            if (source[index] === ".") {
              denominatorDotCount += 1;
            }
            index += 1;
          }

          var denominatorRaw = source.slice(denominatorStart, index);
          if (denominatorDotCount > 1 || denominatorRaw === ".") {
            throw new Error("รูปแบบตัวเลขไม่ถูกต้อง: " + denominatorRaw);
          }

          tokens.push({
            type: "number",
            value: Rational.fromDecimal(raw).divide(Rational.fromDecimal(denominatorRaw)),
            valueText: raw + "/" + denominatorRaw
          });
          continue;
        }

        tokens.push({ type: "number", value: Rational.fromDecimal(raw), valueText: raw });
        continue;
      }

      if ("+-*/()".indexOf(character) >= 0) {
        tokens.push({ type: character, value: character });
        index += 1;
        continue;
      }

      throw new Error("ยังไม่รองรับตัวอักษร '" + character + "'");
    }

    tokens.push({ type: "eof", value: "" });
    return tokens;
  }

  function replaceMixedNumbers(source) {
    return source.replace(/(^|[^\d.)])(-?\d+)\s+(\d+)\s*\/\s*(\d+)(?=$|[^\d.])/g, function (_, prefix, whole, numerator, denominator) {
      var operator = whole[0] === "-" ? "-" : "+";
      return prefix + "(" + whole + operator + numerator + "/" + denominator + ")";
    });
  }

  function splitComparison(source) {
    var normalized = normalizeSource(source);
    var symbolMatch = normalized.match(/^(.+?)(<=|>=|==|=|<|>)(.+)$/);

    if (symbolMatch) {
      return {
        left: symbolMatch[1].trim(),
        operator: symbolMatch[2],
        right: symbolMatch[3].trim()
      };
    }

    var keywordParts = normalized.split(/\s*(?:เทียบกับ|เทียบ|compare|กับ)\s*/i).filter(Boolean);
    if (keywordParts.length === 2) {
      return {
        left: keywordParts[0],
        operator: "",
        right: keywordParts[1]
      };
    }

    throw new Error("เขียนเป็น 1/2 < 2/3 หรือ 1/2 เทียบ 2/3");
  }

  function parseRatioProportion(source) {
    var text = normalizeSource(source).replace(/->/g, ":").replace(/=>/g, ":").replace(/→/g, ":").replace(/[?？]/g, "?");
    var equalIndex = text.indexOf("=");

    if (equalIndex >= 0) {
      var left = splitRatioPair(text.slice(0, equalIndex));
      var right = splitRatioPair(text.slice(equalIndex + 1));

      if (left && right) {
        return {
          slots: [
            parseProportionSlot(left[0]),
            parseProportionSlot(left[1]),
            parseProportionSlot(right[0]),
            parseProportionSlot(right[1])
          ]
        };
      }
    }

    var chunks = text.split(/[,;\n]+/).map(function (chunk) {
      return chunk.trim();
    }).filter(Boolean);

    if (chunks.length === 2) {
      var first = splitRatioPair(chunks[0]);
      var second = splitRatioPair(chunks[1]);

      if (first && second) {
        return {
          slots: [
            parseProportionSlot(first[0]),
            parseProportionSlot(first[1]),
            parseProportionSlot(second[0]),
            parseProportionSlot(second[1])
          ]
        };
      }
    }

    return null;
  }

  function splitRatioPair(text) {
    var position = text.indexOf(":");

    if (position > -1) {
      return [text.slice(0, position).trim(), text.slice(position + 1).trim()];
    }
    return null;
  }

  function parseProportionSlot(text) {
    var trimmed = text.trim();

    if (trimmed === "?" || /^x$/i.test(trimmed)) {
      return null;
    }
    return evaluateExpression(trimmed).value;
  }

  function parseWordProportion(source) {
    var normalized = normalizeSource(source);

    if (!/[?？]|เท่าไร|เท่าไหร่|กี่/.test(normalized)) {
      return null;
    }

    var matches = normalized.match(/-?(?:\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|\d+(?:\.\d+)?)/g) || [];
    if (matches.length !== 3) {
      return null;
    }

    return {
      slots: matches.map(function (match) {
        return evaluateExpression(match).value;
      }).concat([null])
    };
  }

  function detectMode(source) {
    var normalized = normalizeSource(source);

    if (/[<>≤≥]|เทียบ/.test(source)) {
      return "compare";
    }
    if (/[?？]|เท่าไร|เท่าไหร่|กี่|:|->|=>|→/.test(source)) {
      return "proportion";
    }
    if (/=/.test(normalized)) {
      return "compare";
    }
    return "fraction";
  }

  function normalizeSource(input) {
    return String(input || "")
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/[−–—]/g, "-")
      .replace(/≤/g, "<=")
      .replace(/≥/g, ">=")
      .replace(/＝/g, "=")
      .trim();
  }

  function normalizeComparisonOperator(operator) {
    if (operator === "==") {
      return "=";
    }
    return operator;
  }

  function relationMatches(compare, operator) {
    if (operator === "<") {
      return compare < 0;
    }
    if (operator === ">") {
      return compare > 0;
    }
    if (operator === "<=") {
      return compare <= 0;
    }
    if (operator === ">=") {
      return compare >= 0;
    }
    return compare === 0;
  }

  function fractionDetails(value) {
    return [
      { label: "เศษส่วนอย่างต่ำ", value: value.toFractionString() },
      { label: "จำนวนคละ", value: value.toMixedString() },
      { label: "ทศนิยม", value: value.toDecimalString(8) }
    ];
  }

  function ensureNotZero(value, label) {
    if (value.isZero()) {
      throw new Error(label + "เป็น 0 ไม่ได้");
    }
  }

  function toBigInt(value) {
    if (typeof value === "bigint") {
      return value;
    }
    if (typeof value === "number") {
      if (!Number.isInteger(value)) {
        throw new Error("ต้องใช้จำนวนเต็มในการสร้างเศษส่วน");
      }
      return BigInt(value);
    }
    return BigInt(String(value));
  }

  function absBigInt(value) {
    return value < 0n ? -value : value;
  }

  function gcd(a, b) {
    var left = absBigInt(a);
    var right = absBigInt(b);

    while (right !== 0n) {
      var rest = left % right;
      left = right;
      right = rest;
    }
    return left || 1n;
  }

  function lcm(a, b) {
    return absBigInt(a * b) / gcd(a, b);
  }

  return {
    Rational: Rational,
    solve: solve,
    evaluateExpression: evaluateExpression
  };
});
