# PostgreSQL Data Model

โครงตอนนี้ตั้งใจให้คนลงโจทย์ทำงานง่ายที่สุดก่อน มี 4 table หลัก:

```text
topics
levels
problem_templates
problem_variants
```

ไม่มี `master_skills`, `master_units`, `master_answer_types`, `master_problem_statuses`, `master_problem_sources`, `master_variable_types` แล้ว เพราะพวกนั้นทำให้ตอนลงโจทย์ต้องเลือกหลายช่องเกินไป

## แนวคิดหลัก

`topics` คือเรื่องที่เด็กเลือก เช่น เศษส่วน ทศนิยม ร้อยละ สมการ

`levels` คือความยาก 1-5 ใช้ร่วมกันทุกเรื่อง

`problem_templates` คือโจทย์แม่ 1 ข้อ เก็บเป็น pattern ที่มีตัวแปรได้ เช่น:

```text
ห้องเรียนกว้าง {math1} เมตร ยาว {math2} เมตร ต้องการปูกระเบื้องรูปสี่เหลี่ยมจัตุรัสที่มีด้านยาวด้านละ {math3} เซนติเมตร ให้เต็มพื้นที่ จะต้องใช้กระเบื้องทั้งหมดกี่แผ่น
```

`problem_variants` คือชุดค่าของโจทย์แม่นั้น เก็บ `math1`, `math2`, `math3` และ `answer` รวมกันใน object เดียว โดยโจทย์แม่หนึ่งข้อเก็บได้สูงสุด 5 ชุด เช่น:

```json
{
  "math1": "10.50",
  "math2": "15.75",
  "math3": "25",
  "answer": "2646"
}
```

ค่าทั้งหมดใน `variant_values` เก็บเป็น string เพื่อไม่ให้ `10.50` กลายเป็น `10.5` ตอนนำไปแสดงในโจทย์

## โครง Table

### `topics`

เก็บเรื่องหลักของโจทย์

| column | ใช้ทำอะไร |
| --- | --- |
| `code` | รหัสเรื่อง เช่น `fractions_add_subtract` |
| `name_th` | ชื่อที่แสดง เช่น `บวก ลบ เศษส่วน` |
| `description_th` | คำอธิบายสั้น ๆ |
| `grade_hint` | ข้อความบอกระดับชั้นคร่าว ๆ เช่น `ป.4-ม.1` |
| `sort_order` | ลำดับการแสดงผล |
| `is_active` | เปิด/ปิดการใช้งาน |

### `levels`

เก็บระดับความยาก 1-5

| level | ความหมาย |
| --- | --- |
| `1` | ง่ายมาก ตัวเลขเล็ก ขั้นตอนเดียว |
| `2` | ง่าย อ่านโจทย์แล้วเลือกวิธีทำได้ตรงไปตรงมา |
| `3` | ปานกลาง มีข้อมูลมากขึ้น อาจต้องคิดสองขั้น |
| `4` | ยาก หลายขั้นตอน ต้องจัดข้อมูลก่อนคำนวณ |
| `5` | ท้าทาย โจทย์ประยุกต์หรือวัดความเข้าใจลึก |

### `problem_templates`

เก็บโจทย์แม่

| column | ใช้ทำอะไร |
| --- | --- |
| `code` | รหัสโจทย์แม่ auto จากเรื่องและ level เช่น `rectangle_area_perimeter_l4_001` |
| `topic_id` | เรื่องของโจทย์ |
| `level_id` | ระดับความยาก 1-5 |
| `prompt_template_th` | ข้อความโจทย์แม่ มี `{math1}`, `{math2}` ได้ |
| `solution_th` | เว้นว่างไว้ก่อนสำหรับหน้า solution ในอนาคต หน้า import โจทย์จะไม่ส่งหรือ update ค่านี้ |
| `is_active` | เปิด/ปิดการใช้งาน |

### `problem_variants`

เก็บชุดค่าของโจทย์แม่

| column | ใช้ทำอะไร |
| --- | --- |
| `problem_template_id` | อ้างกลับไปหาโจทย์แม่ |
| `variant_no` | ชุดที่ 1-5 |
| `variant_values` | JSON object ที่รวม `math1`, `math2`, ... และ `answer` |
| `is_active` | เปิด/ปิดการใช้งาน |

ตัวอย่าง `variant_values`:

```json
{
  "math1": "10.50",
  "math2": "15.75",
  "math3": "25",
  "answer": "2646"
}
```

## วิธี Import โจทย์

หน้า import อยู่ที่:

```text
http://127.0.0.1:5174/import-problems.html
```

หน้านี้ให้กรอกโจทย์แม่ 1 ข้อ และชุดตัวเลขเริ่มต้น 3 ชุด เพิ่มได้สูงสุด 5 ชุด โดยใช้ `template_code` ผูกข้อมูลเข้าหากัน

`template_code` เป็น auto จากเรื่องและระดับความยาก เช่น:

```text
rectangle_area_perimeter_l4_001
rectangle_area_perimeter_l4_002
fractions_add_subtract_l2_001
```

รูปแบบบนหน้า import คือ:

```text
โจทย์ part 1 + math1
โจทย์ part 2 + math2
โจทย์ part 3 + math3
...
```

ถ้า `math` แถวนั้นมีค่า ระบบจะสร้าง placeholder ใน `prompt_template_th` เช่น `{math1}` แล้วนำค่าของแต่ละชุดไปสร้าง `problem_variants.variant_values`

โซนตัวแปรจะมีแถว `math1`, `math2`, `math3` และ `Answer` โดยปุ่มเพิ่มชุดตัวเลขจะเพิ่ม column ให้ทุกตัวแปรพร้อมกัน สูงสุด 5 ชุด

หน้า import จะไม่แนบ `solution` เด็ดขาด เฉลย/วิธีทำจะทำในหน้าอื่นภายหลัง

ใช้ไฟล์นี้เป็นต้นแบบ:

```text
db/003_import_problem_examples.sql
```

## Query หลัก

ดึง topic ไปแสดงหน้าเลือกโจทย์:

```sql
SELECT code, name_th, description_th, grade_hint
FROM topics
WHERE is_active = TRUE
ORDER BY sort_order;
```

สุ่มโจทย์จากเรื่องและ level:

```sql
SELECT
  pv.id AS problem_id,
  t.name_th AS topic_name,
  l.name_th AS level_name,
  pt.prompt_template_th,
  pv.variant_values
FROM problem_templates pt
JOIN problem_variants pv ON pv.problem_template_id = pt.id
JOIN topics t ON t.id = pt.topic_id
JOIN levels l ON l.id = pt.level_id
WHERE t.code = 'rectangle_area_perimeter'
  AND l.id = 4
  AND pt.is_active = TRUE
  AND pv.is_active = TRUE
ORDER BY random()
LIMIT 10;
```

เวลาแสดงโจทย์ ให้เอา `prompt_template_th` ไปแทนค่าจาก `variant_values` เช่น `{math1}` -> `"10.50"` ส่วนคำตอบอ่านจาก `variant_values.answer`
