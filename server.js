const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// إعداد قاعدة البيانات المحلية SQLite
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('خطأ في فتح قاعدة البيانات ❌', err.message);
    } else {
        console.log('متصل بقاعدة البيانات المحلية بنجاح ✅');
    }
});

// إنشاء جداول الحسابات (Accounts) والمهام (Tasks) إذا لم تكن موجودة
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        cookie TEXT,
        status TEXT DEFAULT 'نشط 🟢'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        targetUrl TEXT,
        amount INTEGER,
        status TEXT DEFAULT 'قيد الانتظار ⏳'
    )`);
});

// الرابط المستهدف الأساسي المحفوظ في الذاكرة
const TARGET_URL = "https://www.facebook.com/profile.php?id=61590146324460";

// لوحة التحكم الرئيسية تعرض الحسابات المخزنة وحالة النظام
app.get('/', (req, res) => {
    db.all(`SELECT * FROM accounts`, [], (err, accounts) => {
        db.all(`SELECT * FROM tasks`, [], (err2, tasks) => {
            res.render('index', { 
                accounts: accounts || [], 
                tasks: tasks || [], 
                targetUrl: TARGET_URL 
            });
        });
    });
});

// مسار لإضافة حساب فايسبوك جديد (مع الـ Cookie الخاصة به)
app.post('/add-account', (req, res) => {
    const { username, cookie } = req.body;
    if (!username || !cookie) {
        return res.status(400).json({ success: false, message: "اسم المستخدم وملف تعريف الارتباط (Cookie) مطلوبان!" });
    }

    db.run(`INSERT INTO accounts (username, cookie) VALUES (?, ?)`, [username, cookie], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: "فشل حفظ الحساب في قاعدة البيانات!" });
        }
        res.json({ success: true, message: `تمت إضافة الحساب ${username} بنجاح وقبوله في النظام!` });
    });
});

// مسار لإرسال حملة متابعين جديدة للرابط المستهدف باستخدام الحسابات المخزنة
app.post('/start-campaign', (req, res) => {
    const { amount } = req.body;
    
    // إضافة المهمة إلى جدول المهام
    db.run(`INSERT INTO tasks (targetUrl, amount) VALUES (?, ?)`, [TARGET_URL, amount || 100], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: "فشل بدء الحملة!" });
        }
        res.json({ success: true, message: "تمت جدولة حملة المتابعين بنجاح لتنفيذها عبر الحسابات المسجلة!" });
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`[+] Bot Farm Core running on port ${PORT}`);
});
