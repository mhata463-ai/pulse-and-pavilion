# واجهة المزامنة مع نظام المتكامل
كل طلب: POST مع ترويسة `Authorization: Bearer <SYNC_API_KEY>` و JSON.
رمز المستشفى: H1 / H2 / H3.

- /api/public/sync/vitals   {hospital, day, revenue, returns, surgeries, emergency, beds, attendance, electricity}
- /api/public/sync/cashbox  {hospital, day, cash, wallets, cheques, insurance, deferred, pledges}
- /api/public/sync/returns  {hospital, items:[{external_ref, kind, amount, quantity, reason}]}
- /api/public/sync/expenses {hospital, items:[{external_ref, period: daily|monthly|yearly, category, item, amount, invoice_no, spent_on, details}]}
- /api/public/sync/attendance {hospital, items:[{employee_code, employee_name, job_title, day, shift: day|night, check_in, check_out, status: present|late|absent|leave, late_minutes}]}
