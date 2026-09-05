BEGIN;

-- วิธีใช้:
-- 1) เพิ่มโจทย์แม่ใน template_rows
-- 2) เพิ่มชุดค่า math + answer ใน variant_rows โดยใช้ template_code เดียวกัน
-- 3) รันไฟล์นี้ซ้ำได้ เพราะใช้ ON CONFLICT เพื่อ update ข้อมูลเดิม

WITH template_rows (
  code,
  topic_code,
  level_id,
  prompt_template_th
) AS (
  VALUES
    (
      'whole_number_add_subtract_l1_001',
      'whole_number_add_subtract',
      1,
      'ฟ้ามีลูกอม {math1} ชิ้น แล้วได้เพิ่มอีก {math2} ชิ้น ฟ้ามีลูกอมทั้งหมดกี่ชิ้น'
    ),
    (
      'fractions_add_subtract_l2_001',
      'fractions_add_subtract',
      2,
      'นิดกินขนมไป {math1}/{math3} ถาด และกินเพิ่มอีก {math2}/{math3} ถาด รวมกินไปกี่ส่วนของถาด'
    ),
    (
      'rectangle_area_perimeter_l4_001',
      'rectangle_area_perimeter',
      4,
      'ห้องเรียนกว้าง {math1} เมตร ยาว {math2} เมตร ต้องการปูกระเบื้องรูปสี่เหลี่ยมจัตุรัสที่มีด้านยาวด้านละ {math3} เซนติเมตร ให้เต็มพื้นที่ จะต้องใช้กระเบื้องทั้งหมดกี่แผ่น'
    )
)
INSERT INTO problem_templates (
  code,
  topic_id,
  level_id,
  prompt_template_th
)
SELECT
  tr.code,
  t.id,
  tr.level_id,
  tr.prompt_template_th
FROM template_rows tr
JOIN topics t ON t.code = tr.topic_code
JOIN levels l ON l.id = tr.level_id
ON CONFLICT (code) DO UPDATE SET
  topic_id = EXCLUDED.topic_id,
  level_id = EXCLUDED.level_id,
  prompt_template_th = EXCLUDED.prompt_template_th,
  is_active = TRUE;

WITH variant_rows (
  template_code,
  variant_no,
  variant_values
) AS (
  VALUES
    (
      'whole_number_add_subtract_l1_001',
      1,
      '{"math1":"20","math2":"17","answer":"37"}'::jsonb
    ),
    (
      'whole_number_add_subtract_l1_001',
      2,
      '{"math1":"27","math2":"20","answer":"47"}'::jsonb
    ),
    (
      'whole_number_add_subtract_l1_001',
      3,
      '{"math1":"34","math2":"18","answer":"52"}'::jsonb
    ),
    (
      'fractions_add_subtract_l2_001',
      1,
      '{"math1":"1","math2":"2","math3":"8","answer":"3/8"}'::jsonb
    ),
    (
      'fractions_add_subtract_l2_001',
      2,
      '{"math1":"3","math2":"2","math3":"10","answer":"5/10"}'::jsonb
    ),
    (
      'fractions_add_subtract_l2_001',
      3,
      '{"math1":"2","math2":"3","math3":"12","answer":"5/12"}'::jsonb
    ),
    (
      'rectangle_area_perimeter_l4_001',
      1,
      '{"math1":"10.50","math2":"15.75","math3":"25","answer":"2646"}'::jsonb
    ),
    (
      'rectangle_area_perimeter_l4_001',
      2,
      '{"math1":"8.00","math2":"12.00","math3":"20","answer":"2400"}'::jsonb
    ),
    (
      'rectangle_area_perimeter_l4_001',
      3,
      '{"math1":"9.00","math2":"13.50","math3":"30","answer":"1350"}'::jsonb
    )
)
INSERT INTO problem_variants (
  problem_template_id,
  variant_no,
  variant_values
)
SELECT
  pt.id,
  vr.variant_no,
  vr.variant_values
FROM variant_rows vr
JOIN problem_templates pt ON pt.code = vr.template_code
ON CONFLICT (problem_template_id, variant_no) DO UPDATE SET
  variant_values = EXCLUDED.variant_values,
  is_active = TRUE;

COMMIT;
