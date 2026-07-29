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
        console.log('متصل بقاعدة البيانات الفعالة ✅');
    }
});

// إنشاء جداول الحسابات والمهام
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

const TARGET_URL = "https://www.facebook.com/profile.php?id=61590146324460";

// لوحة التحكم الرئيسية
app.get('/', (req, res) => {
    db.all(`SELECT id, username, status FROM accounts`, [], (err, accounts) => {
        db.all(`SELECT * FROM tasks`, [], (err2, tasks) => {
            res.render('index', { 
                accounts: accounts || [], 
                tasks: tasks || [], 
                targetUrl: TARGET_URL 
            });
        });
    });
});

// مسار الاستيراد الجماعي للحسابات (Bulk Import)
app.post('/import-bulk', (req, res) => {
    const { bulkData } = req.body; // نستقبل النص الذي يحتوي على الحسابات
    if (!bulkData) {
        return res.status(400).json({ success: false, message: "الرجاء إدخال بيانات الحسابات!" });
    }

    // تقسيم النص إلى أسطر (كل سطر يمثل حساباً)
    const lines = bulkData.split('\n');
    let importedCount = 0;

    db.serialize(() => {
        const stmt = db.prepare(`INSERT INTO accounts (username, cookie) VALUES (?, ?)`);
        
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            // نفترض أن الصيغة تكون هكذا: username|cookie أو username:cookie
            const parts = line.split(/[:|]/);
            if (parts.length >= 2) {
                const username = parts[0].trim();
                const cookie = parts.slice(1).join(':').trim(); // دمج باقي الأجزاء لتكون الكوكيز
                
                stmt.run(username, cookie);
                importedCount++;
            }
        });

        stmt.finalize((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: "حدث خطأ أثناء الحفظ الجماعي في قاعدة البيانات!" });
            }
            res.json({ success: true, message: `تم استيراد وحفظ ${importedCount} حساباً بنجاح في الشبكة! 🚀` });
        });
    });
});

// مسار بدء حملة المتابعين للرابط المستهدف
app.post('/start-campaign', (req, res) => {
    db.run(`INSERT INTO tasks (targetUrl, amount) VALUES (?, ?)`, [TARGET_URL, 100], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: "فشل بدء الحملة!" });
        }
        res.json({ success: true, message: "تمت جدولة الحملة بنجاح لتنفيذها عبر شبكة الحسابات المستوردة!" });
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`[+] Bot Farm Core running on port ${PORT}`);
});
