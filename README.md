# MathsSolve Kids

เว็บแอปโจทย์ปัญหาคณิตสำหรับเด็ก รุ่นโครงร่างแรก

## หน้าจอปัจจุบัน

- โซนบนเป็นโจทย์ปัญหา แสดงเลขข้อและตัวโจทย์
- โซนล่างเป็นกระดาษทดพื้นขาวโล่ง ให้เด็กเขียนด้วยเมาส์ นิ้ว หรือ stylus/pencil
- ด้านในกระดาษทดฝั่งขวามีกระดาษฝนคำตอบ 5 หลัก ค่าเริ่มต้นเป็น `00000` และเครื่องมืออยู่เหนือช่องคำตอบ

## ฐานข้อมูล

- Schema PostgreSQL อยู่ที่ `db/001_create_tables.sql`
- Master data ของ `topics` และ `levels` อยู่ที่ `db/002_insert_master_data.sql`
- ตัวอย่างไฟล์ import โจทย์อยู่ที่ `db/003_import_problem_examples.sql`
- คำอธิบาย data model อยู่ที่ `docs/data-model.md`

## เปิดดู

ตอนนี้เปิด preview ได้ที่:

```bash
http://127.0.0.1:5173/
```

หรือเปิดไฟล์ `index.html` โดยตรงใน browser ก็ได้

ถ้าต้องการดู table ใน PostgreSQL ให้เปิด local dev server:

```bash
npm run dev
```

แล้วเข้า:

```bash
http://127.0.0.1:5174/tables.html
```

หน้า import โจทย์อยู่ที่:

```bash
http://127.0.0.1:5174/import-problems.html
```

## ทดสอบ

```bash
node tests/solver.test.js
```
