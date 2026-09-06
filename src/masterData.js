(function (root) {
  "use strict";

  root.MasterData = {
    problemSubjects: [
      {
        id: "addition",
        label: "การบวก",
        short: "+",
        description: "รวมทั้งหมด ได้เพิ่ม หรือเอาหลายจำนวนมารวมกัน"
      },
      {
        id: "subtraction",
        label: "การลบ",
        short: "-",
        description: "เหลือเท่าไร ใช้ไป หายไป หรือต่างกันเท่าไร"
      },
      {
        id: "multiplication",
        label: "การคูณ",
        short: "x",
        description: "ของเป็นกลุ่ม กลุ่มละเท่า ๆ กัน หรือเพิ่มซ้ำ"
      },
      {
        id: "division",
        label: "การหาร",
        short: "/",
        description: "แบ่งเท่า ๆ กัน แบ่งเป็นกลุ่ม หรือหารมีเศษ"
      },
      {
        id: "mixed_arithmetic",
        label: "โจทย์ผสม",
        short: "+-",
        description: "บวก ลบ คูณ หารมากกว่าหนึ่งขั้นตอน"
      },
      {
        id: "fraction",
        label: "เศษส่วน",
        short: "1/2",
        description: "บวก ลบ คูณ หาร และหาเศษส่วนของจำนวน"
      },
      {
        id: "comparison",
        label: "การเปรียบเทียบ",
        short: "< >",
        description: "มากกว่า น้อยกว่า เท่ากับ หรือเรียงลำดับ"
      },
      {
        id: "proportion",
        label: "บัญญัติไตรยางศ์",
        short: ":",
        description: "อัตราส่วน สัดส่วน และราคาต่อหน่วย"
      },
      {
        id: "money",
        label: "เงิน",
        short: "บาท",
        description: "รวมราคา ซื้อขาย เงินทอน และงบประมาณ"
      },
      {
        id: "time_math",
        label: "เวลา",
        short: "นาที",
        description: "เริ่มเวลา สิ้นสุดเวลา และเวลาที่ใช้"
      },
      {
        id: "measurement_unit",
        label: "การวัด / แปลงหน่วย",
        short: "ซม.",
        description: "ความยาว น้ำหนัก ปริมาตร และการแปลงหน่วย"
      },
      {
        id: "random",
        label: "สุ่มทุกเรื่อง",
        short: "🎲",
        description: "สุ่มเรื่องใหม่ทุกข้อจากทุกเรื่องที่มี ทั้งเรื่องเดิมและเรื่องที่ import เข้า PostgreSQL"
      },
      {
        id: "random_db",
        label: "สุ่มเฉพาะที่เพิ่มเอง",
        short: "📥",
        description: "สุ่มเฉพาะโจทย์ที่ import เข้า PostgreSQL เอง ไม่ปนโจทย์เดิมของระบบ"
      }
    ],
    gradeLevels: [
      { code: "KG3", label: "อนุบาล 3", short: "อ.3" },
      { code: "P1", label: "ประถมศึกษาปีที่ 1", short: "ป.1" },
      { code: "P2", label: "ประถมศึกษาปีที่ 2", short: "ป.2" },
      { code: "P3", label: "ประถมศึกษาปีที่ 3", short: "ป.3" },
      { code: "P4", label: "ประถมศึกษาปีที่ 4", short: "ป.4" },
      { code: "P5", label: "ประถมศึกษาปีที่ 5", short: "ป.5" },
      { code: "P6", label: "ประถมศึกษาปีที่ 6", short: "ป.6" },
      { code: "M1", label: "มัธยมศึกษาปีที่ 1", short: "ม.1" }
    ],
    difficultyLevels: [
      { level: 1, label: "ง่ายมาก", description: "ตัวเลขเล็ก ขั้นตอนเดียว เหมาะกับการเริ่มทำความเข้าใจเรื่องนี้" },
      { level: 2, label: "ง่าย", description: "อ่านโจทย์แล้วเลือกวิธีทำได้ค่อนข้างตรงไปตรงมา" },
      { level: 3, label: "ปานกลาง", description: "มีข้อมูลมากขึ้น อาจต้องคิดสองขั้นตอนหรือระวังหน่วย" },
      { level: 4, label: "ยาก", description: "หลายขั้นตอน ต้องจัดข้อมูลก่อนคำนวณหรือมีเงื่อนไขมากขึ้น" },
      { level: 5, label: "ท้าทาย", description: "โจทย์ประยุกต์หรือโจทย์วัดความเข้าใจลึกของเรื่องนั้น" }
    ],
    problemCountOptions: [5, 10, 15, 20]
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
