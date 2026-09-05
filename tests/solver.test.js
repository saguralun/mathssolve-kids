const assert = require("assert");
const MathsSolve = require("../src/solver");

function solve(input, mode) {
  return MathsSolve.solve(input, mode ? { mode } : undefined);
}

assert.strictEqual(solve("1/2 + 1/3").answer, "5/6");
assert.strictEqual(solve("3/4 - 1/8").answer, "5/8");
assert.strictEqual(solve("2/3 * 9/10").answer, "3/5");
assert.strictEqual(solve("3/5 / 9/10").answer, "2/3");
assert.strictEqual(solve("1 1/2 + 2 1/4").answer, "3 3/4");
assert.strictEqual(solve("2.5 + 1/4").answer, "2 3/4");
assert.strictEqual(solve("2/3 เทียบ 3/5", "compare").relation, ">");
assert.strictEqual(solve("2/4 = 1/2", "compare").answer, "จริง: 1/2 = 1/2");
assert.strictEqual(solve("3 : 24 = 7 : ?", "proportion").answer, "? = 56");
assert.strictEqual(solve("6 ฟอง ราคา 45 บาท ถ้าซื้อ 10 ฟอง ราคาเท่าไร", "proportion").answer, "? = 75");
assert.throws(() => solve("1/0"), /ตัวส่วนเป็น 0|หารด้วย 0/);

console.log("solver tests passed");
