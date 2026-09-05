# Master Data

เอกสารนี้สรุป master data ชุดใหม่แบบเรียบง่าย ใช้คู่กับ:

```text
db/001_create_tables.sql
db/002_insert_master_data.sql
```

ตอนนี้เหลือ master ที่ต้องดูแลจริงแค่ 2 อย่าง:

```text
topics = เรื่องที่เด็กเลือก
levels = ระดับความยาก 1-5
```

## Levels

| id | code | ชื่อ | ความหมาย |
| --- | --- | --- | --- |
| 1 | L1 | ง่ายมาก | ตัวเลขเล็ก ขั้นตอนเดียว เหมาะกับการเริ่มทำความเข้าใจเรื่องนี้ |
| 2 | L2 | ง่าย | อ่านโจทย์แล้วเลือกวิธีทำได้ค่อนข้างตรงไปตรงมา |
| 3 | L3 | ปานกลาง | มีข้อมูลมากขึ้น อาจต้องคิดสองขั้นตอนหรือระวังหน่วย |
| 4 | L4 | ยาก | หลายขั้นตอน ต้องจัดข้อมูลก่อนคำนวณหรือมีเงื่อนไขมากขึ้น |
| 5 | L5 | ท้าทาย | โจทย์ประยุกต์หรือโจทย์วัดความเข้าใจลึกของเรื่องนั้น |

## Topics

`grade_hint` เป็นแค่คำอธิบายให้คนเลือกเข้าใจง่าย ไม่ได้ใช้เป็นเงื่อนไขบังคับ

| code | ชื่อเรื่อง | เหมาะกับ |
| --- | --- | --- |
| large_numbers_place_value | จำนวนนับขนาดใหญ่ | ป.4 |
| whole_number_add_subtract | บวก ลบ จำนวนนับ | ป.4 |
| whole_number_multiply_divide | คูณ หาร จำนวนนับ | ป.4 |
| mixed_operations_whole_number | บวก ลบ คูณ หารระคน | ป.4 |
| time_duration_schedule | เวลาและระยะเวลา | ป.4 |
| fractions_basic | เศษส่วนพื้นฐาน | ป.4 |
| fractions_compare_order | เปรียบเทียบและเรียงลำดับเศษส่วน | ป.4-ม.1 |
| fractions_add_subtract | บวก ลบ เศษส่วน | ป.4-ม.1 |
| fractions_multiply_divide | คูณ หาร เศษส่วน | ป.5-ม.1 |
| mixed_fraction_operations | เศษส่วนระคน | ป.5-ป.6 |
| decimals_basic | ทศนิยมพื้นฐาน | ป.4-ม.1 |
| decimals_add_subtract | บวก ลบ ทศนิยม | ป.4-ม.1 |
| decimals_multiply_divide | คูณ หาร ทศนิยม | ป.5-ม.1 |
| fraction_decimal_conversion | เศษส่วนและทศนิยม | ป.5-ม.1 |
| angle_basics | มุม เส้นตรง รังสี | ป.4, ม.1 |
| rectangle_area_perimeter | สี่เหลี่ยมมุมฉาก พื้นที่ รอบรูป | ป.4 |
| data_tables_bar_charts | ตารางและแผนภูมิแท่ง | ป.4-ป.5 |
| line_graphs_basic | กราฟเส้นเบื้องต้น | ป.5, ม.1 |
| rule_of_three | บัญญัติไตรยางศ์ | ป.5 |
| percent_basic | ร้อยละพื้นฐาน | ป.5-ม.1 |
| percent_commerce | ร้อยละในการซื้อขาย | ป.5-ป.6 |
| parallel_perpendicular_lines | เส้นตั้งฉากและเส้นขนาน | ป.5, ม.1 |
| quadrilateral_properties | สมบัติของรูปสี่เหลี่ยม | ป.5, ม.1 |
| quadrilateral_polygon_area | พื้นที่รูปสี่เหลี่ยมและรูปหลายเหลี่ยม | ป.5-ป.6 |
| volume_capacity | ปริมาตรและความจุ | ป.5-ป.6 |
| factors_gcd_lcm | ตัวประกอบ ห.ร.ม. และ ค.ร.น. | ป.6 |
| ratio_proportion_scale | อัตราส่วน สัดส่วน และมาตราส่วน | ป.6-ม.1 |
| patterns_sequences | แบบรูปของจำนวน | ป.6 |
| triangles | รูปสามเหลี่ยม | ป.6, ม.1 |
| circles | วงกลม | ป.6 |
| solid_geometry | รูปเรขาคณิตสามมิติ | ป.5-ม.1 |
| integers | จำนวนเต็ม | ม.1 |
| exponents_scientific_notation | เลขยกกำลังและสัญกรณ์วิทยาศาสตร์ | ม.1 |
| linear_equations_one_variable | สมการเชิงเส้นตัวแปรเดียว | ม.1 |
| linear_relations_graphs | กราฟและความสัมพันธ์เชิงเส้น | ม.1 |
| statistics_intro | สถิติเบื้องต้น | ป.6, ม.1 |

## ความสัมพันธ์

```text
topics
  -> problem_templates
    -> problem_variants

levels
  -> problem_templates
```

เด็กเลือก `topic` และ `level` จากนั้นระบบสุ่ม `problem_variants` ที่อยู่ใต้ `problem_templates` ตามเงื่อนไขนั้น
