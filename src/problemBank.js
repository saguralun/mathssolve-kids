(function (root, factory) {
  root.ProblemBank = factory(root);
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var categories =
    root.MasterData && Array.isArray(root.MasterData.problemSubjects)
      ? root.MasterData.problemSubjects
      : [
          { id: "addition", label: "การบวก", short: "+" },
          { id: "subtraction", label: "การลบ", short: "-" },
          { id: "multiplication", label: "การคูณ", short: "x" },
          { id: "division", label: "การหาร", short: "/" },
          { id: "fraction", label: "เศษส่วน", short: "1/2" },
          { id: "comparison", label: "การเปรียบเทียบ", short: "< >" },
          { id: "proportion", label: "บัญญัติไตรยางศ์", short: ":" }
        ];

  var names = ["นิด", "ต้น", "ฟ้า", "เมฆ", "แพรว", "ภูมิ", "มายด์", "นนท์"];
  var snacks = ["คุกกี้", "ลูกอม", "ขนมปัง", "ส้ม", "สติกเกอร์", "ดินสอสี"];
  var fractionItems = ["เค้ก", "พิซซ่า", "แตงโม", "ช็อกโกแลตแท่ง"];

  function generate(category, level) {
    var selected = category || "addition";
    var difficulty = level || "normal";

    if (selected === "addition") {
      return additionProblem(difficulty);
    }
    if (selected === "subtraction") {
      return subtractionProblem(difficulty);
    }
    if (selected === "multiplication") {
      return multiplicationProblem(difficulty);
    }
    if (selected === "division") {
      return divisionProblem(difficulty);
    }
    if (selected === "mixed_arithmetic") {
      return mixedArithmeticProblem(difficulty);
    }
    if (selected === "fraction") {
      return fractionProblem(difficulty);
    }
    if (selected === "comparison" || selected === "compare") {
      return compareProblem(difficulty);
    }
    if (selected === "money") {
      return moneyProblem(difficulty);
    }
    if (selected === "time_math") {
      return timeProblem(difficulty);
    }
    if (selected === "measurement_unit") {
      return measurementProblem(difficulty);
    }
    return proportionProblem(difficulty);
  }

  function additionProblem(level) {
    var first = randomInt(level === "easy" ? 6 : 12, level === "challenge" ? 75 : 38);
    var second = randomInt(level === "easy" ? 3 : 8, level === "challenge" ? 58 : 29);
    var name = pick(names);
    var item = pick(snacks);

    return {
      category: "addition",
      categoryLabel: "บวก",
      title: "รวมทั้งหมด",
      prompt: name + "มี" + item + " " + first + " ชิ้น แล้วได้เพิ่มอีก " + second + " ชิ้น " + name + "มี" + item + "ทั้งหมดกี่ชิ้น",
      expression: first + " + " + second,
      mode: "fraction",
      answerKind: "number",
      hint: "เอาจำนวนที่มีอยู่แล้ว บวกกับจำนวนที่ได้เพิ่ม",
      visual: { type: "bar", rows: [{ label: "มีอยู่", value: first }, { label: "เพิ่ม", value: second }] }
    };
  }

  function subtractionProblem(level) {
    var start = randomInt(level === "easy" ? 12 : 24, level === "challenge" ? 120 : 68);
    var used = randomInt(level === "easy" ? 2 : 8, Math.max(3, start - 5));
    var name = pick(names);
    var item = pick(snacks);

    return {
      category: "subtraction",
      categoryLabel: "ลบ",
      title: "เหลือเท่าไร",
      prompt: name + "มี" + item + " " + start + " ชิ้น แบ่งให้เพื่อนไป " + used + " ชิ้น " + name + "เหลือ" + item + "กี่ชิ้น",
      expression: start + " - " + used,
      mode: "fraction",
      answerKind: "number",
      hint: "เอาจำนวนทั้งหมด ลบจำนวนที่แบ่งออกไป",
      visual: { type: "bar", rows: [{ label: "ทั้งหมด", value: start }, { label: "แบ่งออก", value: used }] }
    };
  }

  function multiplicationProblem(level) {
    var groups = randomInt(level === "easy" ? 2 : 3, level === "challenge" ? 12 : 8);
    var each = randomInt(level === "easy" ? 2 : 4, level === "challenge" ? 15 : 9);
    var item = pick(snacks);

    return {
      category: "multiplication",
      categoryLabel: "คูณ",
      title: "ของเป็นกลุ่ม",
      prompt: "มีถุง " + groups + " ถุง แต่ละถุงมี" + item + " " + each + " ชิ้น รวมแล้วมี" + item + "กี่ชิ้น",
      expression: groups + " * " + each,
      mode: "fraction",
      answerKind: "number",
      hint: "มีจำนวนเท่ากันหลายกลุ่ม ใช้การคูณได้เลย",
      visual: { type: "groups", groups: groups, each: each }
    };
  }

  function divisionProblem(level) {
    var people = randomInt(level === "easy" ? 2 : 3, level === "challenge" ? 12 : 8);
    var each = randomInt(level === "easy" ? 2 : 4, level === "challenge" ? 13 : 9);
    var total = people * each;
    var item = pick(snacks);

    return {
      category: "division",
      categoryLabel: "หาร",
      title: "แบ่งเท่า ๆ กัน",
      prompt: "มี" + item + " " + total + " ชิ้น แบ่งให้เด็ก " + people + " คนเท่า ๆ กัน เด็กแต่ละคนได้กี่ชิ้น",
      expression: total + " / " + people,
      mode: "fraction",
      answerKind: "number",
      hint: "แบ่งทั้งหมดออกเป็นจำนวนคนเท่า ๆ กัน",
      visual: { type: "groups", groups: people, each: each }
    };
  }

  function mixedArithmeticProblem(level) {
    var bought = randomInt(level === "easy" ? 2 : 3, level === "challenge" ? 14 : 8);
    var each = randomInt(level === "easy" ? 3 : 5, level === "challenge" ? 18 : 12);
    var shared = randomInt(level === "easy" ? 2 : 4, level === "challenge" ? 25 : 14);
    var item = pick(snacks);

    return {
      category: "mixed_arithmetic",
      categoryLabel: "โจทย์ผสม",
      title: "คิดหลายขั้น",
      prompt: "มี" + item + " " + bought + " ถุง ถุงละ " + each + " ชิ้น แล้วแบ่งให้เพื่อนไป " + shared + " ชิ้น เหลือ" + item + "กี่ชิ้น",
      expression: "(" + bought + " * " + each + ") - " + shared,
      mode: "arithmetic",
      answerKind: "number",
      hint: "หาจำนวนทั้งหมดก่อน แล้วลบจำนวนที่แบ่งออกไป",
      visual: { type: "groups", groups: bought, each: each, remove: shared }
    };
  }

  function fractionProblem(level) {
    var denominator = pick(level === "challenge" ? [5, 6, 8, 10, 12] : [3, 4, 6, 8]);
    var first = randomInt(1, denominator - 1);
    var second = randomInt(1, denominator - 1);
    var operator = level === "easy" ? "+" : pick(["+", "-", "*", "/"]);

    if (operator === "-" && first < second) {
      var swap = first;
      first = second;
      second = swap;
    }

    var left = first + "/" + denominator;
    var rightDenominator = operator === "+" || operator === "-" ? pick([denominator, denominator * 2]) : denominator;
    var rightNumerator = Math.min(second, rightDenominator - 1);
    var right = rightNumerator + "/" + rightDenominator;
    var item = pick(fractionItems);
    var actionText = "กินเพิ่มอีก";
    var questionText = "รวมที่กินไปคิดเป็นเท่าไรของหนึ่งถาด";

    if (operator === "-") {
      actionText = "เหลืออยู่";
      questionText = "ส่วนที่กินไปกับส่วนที่เหลืออยู่ต่างกันเท่าไรของหนึ่งถาด";
    } else if (operator === "*") {
      actionText = "แบ่งออกมา";
      questionText = "คิดเป็นเท่าไรของหนึ่งถาด";
    } else if (operator === "/") {
      actionText = "แบ่งเป็นส่วนละ";
      questionText = "แบ่งได้กี่ส่วน";
    }

    return {
      category: "fraction",
      categoryLabel: "เศษส่วน",
      title: "ชิ้นส่วนของทั้งหมด",
      prompt: "เด็ก ๆ มี" + item + " " + left + " ถาด แล้ว" + actionText + " " + right + " ถาด " + questionText,
      expression: left + " " + operator + " " + right,
      mode: "fraction",
      answerKind: "number",
      hint: operator === "+" || operator === "-" ? "ทำส่วนให้เท่ากันก่อน แล้วค่อยคิดตัวเศษ" : "คำนวณเศษส่วนตามเครื่องหมายในโจทย์",
      visual: { type: "fractions", values: [left, right], labels: ["ส่วนแรก", "ส่วนที่สอง"] }
    };
  }

  function compareProblem(level) {
    var firstDenominator = pick(level === "challenge" ? [5, 6, 8, 9, 10, 12] : [3, 4, 5, 6, 8]);
    var secondDenominator = pick(level === "challenge" ? [5, 6, 7, 8, 10, 12] : [3, 4, 5, 6, 8]);
    var firstNumerator = randomInt(1, firstDenominator - 1);
    var secondNumerator = randomInt(1, secondDenominator - 1);
    var left = firstNumerator + "/" + firstDenominator;
    var right = secondNumerator + "/" + secondDenominator;

    return {
      category: "comparison",
      categoryLabel: "การเปรียบเทียบ",
      title: "ใครได้มากกว่า",
      prompt: "ฟ้าได้พิซซ่า " + left + " ถาด ต้นได้พิซซ่า " + right + " ถาด ใครได้มากกว่ากัน หรือได้เท่ากัน",
      expression: left + " เทียบ " + right,
      mode: "compare",
      answerKind: "compare",
      hint: "คูณไขว้ หรือทำส่วนให้เท่ากันก่อนเทียบ",
      visual: { type: "fractions", values: [left, right], labels: ["ฟ้า", "ต้น"] },
      leftName: "ฟ้า",
      rightName: "ต้น"
    };
  }

  function moneyProblem(level) {
    var amount = randomInt(level === "easy" ? 2 : 3, level === "challenge" ? 12 : 8);
    var priceEach = randomInt(level === "easy" ? 5 : 8, level === "challenge" ? 45 : 25);
    var paid = amount * priceEach + pick(level === "easy" ? [5, 10, 20] : [10, 20, 50, 100]);
    var item = pick(["ดินสอ", "สมุด", "ยางลบ", "ไม้บรรทัด"]);

    return {
      category: "money",
      categoryLabel: "เงิน",
      title: "ซื้อของ",
      prompt: item + "ราคาอันละ " + priceEach + " บาท ซื้อ " + amount + " อัน จ่ายเงินไป " + paid + " บาท จะได้เงินทอนกี่บาท",
      expression: paid + " - (" + priceEach + " * " + amount + ")",
      mode: "arithmetic",
      answerKind: "number",
      hint: "หาราคารวมก่อน แล้วเอาเงินที่จ่ายลบราคารวม",
      visual: { type: "money", amount: amount, priceEach: priceEach, paid: paid }
    };
  }

  function timeProblem(level) {
    var startHour = randomInt(7, level === "challenge" ? 18 : 15);
    var startMinute = pick([0, 10, 15, 20, 30, 45]);
    var duration = randomInt(level === "easy" ? 15 : 25, level === "challenge" ? 180 : 95);
    var totalMinutes = startHour * 60 + startMinute + duration;
    var endHour = Math.floor(totalMinutes / 60);
    var endMinute = totalMinutes % 60;

    return {
      category: "time_math",
      categoryLabel: "เวลา",
      title: "เวลาที่ใช้",
      prompt: "เริ่มอ่านหนังสือเวลา " + formatTime(startHour, startMinute) + " และอ่านเสร็จเวลา " + formatTime(endHour, endMinute) + " ใช้เวลาอ่านทั้งหมดกี่นาที",
      expression: formatTime(endHour, endMinute) + " - " + formatTime(startHour, startMinute),
      mode: "arithmetic",
      answerKind: "number",
      hint: "นับเวลาจากเวลาเริ่มจนถึงเวลาสิ้นสุด",
      visual: { type: "timeline", start: formatTime(startHour, startMinute), end: formatTime(endHour, endMinute) }
    };
  }

  function measurementProblem(level) {
    var meters = randomInt(level === "easy" ? 1 : 2, level === "challenge" ? 15 : 8);
    var centimeters = randomInt(level === "easy" ? 5 : 20, level === "challenge" ? 180 : 95);

    return {
      category: "measurement_unit",
      categoryLabel: "การวัด / แปลงหน่วย",
      title: "แปลงหน่วย",
      prompt: "เชือกยาว " + meters + " เมตร กับอีก " + centimeters + " เซนติเมตร รวมแล้วยาวกี่เซนติเมตร",
      expression: "(" + meters + " * 100) + " + centimeters,
      mode: "arithmetic",
      answerKind: "number",
      hint: "แปลงเมตรเป็นเซนติเมตรก่อน แล้วค่อยบวก",
      visual: { type: "measure", meters: meters, centimeters: centimeters, unit: "เซนติเมตร" }
    };
  }

  function proportionProblem(level) {
    var amount = randomInt(level === "easy" ? 2 : 3, level === "challenge" ? 12 : 8);
    var priceEach = randomInt(level === "easy" ? 4 : 6, level === "challenge" ? 25 : 15);
    var target = randomInt(amount + 1, level === "challenge" ? 20 : 12);
    var price = amount * priceEach;
    var item = pick(["ดินสอ", "สมุด", "ยางลบ", "ไม้บรรทัด"]);

    return {
      category: "proportion",
      categoryLabel: "บัญญัติไตรยางค์",
      title: "เทียบอัตราส่วน",
      prompt: item + " " + amount + " ชิ้น ราคา " + price + " บาท ถ้าซื้อ " + target + " ชิ้น ต้องจ่ายกี่บาท",
      expression: amount + " : " + price + " = " + target + " : ?",
      mode: "proportion",
      answerKind: "number",
      hint: "ตั้งสัดส่วนของจำนวนชิ้นกับราคา แล้วคูณไขว้",
      visual: { type: "ratio", rows: [{ left: amount + " ชิ้น", right: price + " บาท" }, { left: target + " ชิ้น", right: "?" }] }
    };
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function formatTime(hour, minute) {
    return String(hour) + ":" + (minute < 10 ? "0" + minute : String(minute));
  }

  return {
    categories: categories,
    generate: generate
  };
});
