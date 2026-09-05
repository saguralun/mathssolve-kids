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
      { level: 1, label: "ง่ายมาก", description: "ตัวเลขเล็ก ขั้นตอนเดียว" },
      { level: 2, label: "ง่าย", description: "อ่านแล้วคำนวณได้ทันที" },
      { level: 3, label: "เริ่มคิด", description: "มีตัวเลขสองหลักหรือทดเล็กน้อย" },
      { level: 4, label: "ปานกลางต้น", description: "ต้องเลือกวิธีทำให้ถูก" },
      { level: 5, label: "ปานกลาง", description: "โจทย์ข้อความทั่วไป ข้อมูลมากขึ้น" },
      { level: 6, label: "หลายขั้นตอน", description: "ต้องคำนวณต่อเนื่องสองขั้นขึ้นไป" },
      { level: 7, label: "ประยุกต์", description: "มีเศษส่วน อัตราส่วน หรือการเทียบ" },
      { level: 8, label: "ยาก", description: "ต้องจัดข้อมูลก่อนคิด" },
      { level: 9, label: "ยากมาก", description: "มีหลายเงื่อนไข" },
      { level: 10, label: "ท้าทาย", description: "เหมาะกับเด็กที่คล่องแล้ว" }
    ],
    problemCountOptions: [5, 10, 15, 20]
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
