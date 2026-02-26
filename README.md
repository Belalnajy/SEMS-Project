# نظام إدارة الامتحانات المدرسية (SEMS)

School Examination Management System — Full-stack Arabic RTL web application.

---

## 📋 متطلبات التشغيل

- **Node.js** v18+
- **PostgreSQL** v14+
- **npm** v9+

---

## 🚀 تشغيل المشروع محلياً

### 1. قاعدة البيانات

```bash
# إنشاء قاعدة البيانات
psql -U postgres -c "CREATE DATABASE sems_db;"
```

### 2. إعداد الخادم (Backend)

```bash
cd backend

# تعديل بيانات الاتصال
nano .env   # عدّل DB_USER و DB_PASSWORD

# تثبيت الحزم
npm install

# تشغيل الترحيلات
npx knex migrate:latest

# تشغيل البيانات الأولية
npx knex seed:run

# تشغيل الخادم
npm run dev
```

الخادم يعمل على http://localhost:5000
وثائق API: http://localhost:5000/api-docs

### 3. إعداد الواجهة (Frontend)

```bash
cd frontend

# تثبيت الحزم
npm install

# تشغيل خادم التطوير
npm run dev
```

الواجهة تعمل على http://localhost:5173

---

## 👤 حسابات تجريبية

| الدور  | البريد              | كلمة المرور |
| ------ | ------------------- | ----------- |
| المشرف | supervisor@sems.com | admin123    |
| المدير | manager@sems.com    | admin123    |

يمكنك إنشاء حساب طالب من صفحة التسجيل.

---

## 🏗 هيكل المشروع

```
SEMS/
├── backend/         # Express.js + Knex.js + PostgreSQL
│   ├── controllers/ # MVC Controllers
│   ├── services/    # Business logic
│   ├── middleware/   # Auth, RBAC, Validation, Error handling
│   ├── routes/      # RESTful API routes
│   ├── migrations/  # Database schema
│   ├── seeds/       # Initial data (Arabic)
│   └── swagger/     # API documentation
├── frontend/        # React + Vite (Arabic RTL)
│   └── src/
│       ├── pages/       # Role-based dashboards
│       ├── components/  # Shared UI components
│       ├── context/     # Auth state management
│       └── api/         # Axios HTTP client
└── README.md
```

---

## 🔐 الأدوار

| الدور  | الصلاحيات                                       |
| ------ | ----------------------------------------------- |
| المشرف | إدارة كاملة (طلاب، مواد، امتحانات، تقارير)      |
| المدير | عرض التقارير فقط                                |
| طالب   | أداء الامتحانات ومشاهدة النتائج                 |
| ضيف    | أداء الامتحانات بدون حساب (لا تحفظ في التقارير) |

---

## 📊 التقارير

- تصفية حسب **الشعبة** و**المادة**
- أداء عام مع رسوم بيانية
- أداء فردي للطلاب
- ترتيب الشعب
- **تصدير Excel** و **PDF** و **طباعة**
- استبعاد نتائج الضيف تلقائياً

---

## 🌐 النشر (Deployment)

### خادم Linux (VPS)

```bash
# 1. PostgreSQL
sudo apt install postgresql
sudo -u postgres createdb sems_db

# 2. Backend
cd backend
npm install --production
npx knex migrate:latest
npx knex seed:run

# استخدم PM2 لتشغيل مستمر
npm install -g pm2
pm2 start server.js --name sems-backend

# 3. Frontend
cd frontend
npm install
npm run build

# استخدم Nginx لتقديم الملفات
# انسخ مجلد dist/ إلى /var/www/sems/
```

### متغيرات البيئة الإنتاجية

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/sems_db
JWT_SECRET=your_production_secret
FRONTEND_URL=https://your-domain.com
```

---

## 📝 التقنيات المستخدمة

| التقنية       | الاستخدام               |
| ------------- | ----------------------- |
| Express.js    | خادم RESTful API        |
| PostgreSQL    | قاعدة بيانات علائقية    |
| Knex.js       | بناء استعلامات وترحيلات |
| React + Vite  | واجهة المستخدم          |
| JWT + bcrypt  | مصادقة وتشفير           |
| Recharts      | رسوم بيانية             |
| PDFKit        | تصدير PDF               |
| XLSX          | استيراد/تصدير Excel     |
| Framer Motion | حركات وانتقالات         |
