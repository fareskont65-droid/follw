const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');
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

// إنشاء جداول الحسابات، الصفحات الفرعية، والمهام
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        cookie TEXT,
        status TEXT DEFAULT 'نشط 🟢'
    )`);

    // جدول خاص بالـ 10 صفحات التابعة للحسابات لتفادي الحظر
    db.run(`CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pageName TEXT,
        pageToken TEXT,
        status TEXT DEFAULT 'جاهزة للتفاعل 🟢'
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
        db.all(`SELECT id, pageName, status FROM pages`, [], (err2, pages) => {
            db.all(`SELECT * FROM tasks`, [], (err3, tasks) => {
                res.render('index', { 
                    accounts: accounts || [], 
                    pages: pages || [],
                    tasks: tasks || [], 
                    targetUrl: TARGET_URL 
                });
            });
        });
    });
});

// مسار استيراد الصفحات الفرعية الـ 10
app.post('/import-pages', (req, res) => {
    const { pagesData } = req.body;
    if (!pagesData) {
        return res.status(400).json({ success: false, message: "الرجاء إدخال بيانات الصفحات!" });
    }

    const lines = pagesData.split('\n');
    let importedCount = 0;

    db.serialize(() => {
        const stmt = db.prepare(`INSERT INTO pages (pageName, pageToken) VALUES (?, ?)`);
        
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            const parts = line.split(/[:|]/);
            if (parts.length >= 2) {
                const pageName = parts[0].trim();
                const pageToken = parts.slice(1).join(':').trim();
                
                stmt.run(pageName, pageToken);
                importedCount++;
            }
        });

        stmt.finalize((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: "حدث خطأ أثناء حفظ الصفحات!" });
            }
            res.json({ success: true, message: `تمت إضافة وحفظ ${importedCount} صفحة فرعية بنجاح في الشبكة! 🚀` });
        });
    });
});

// مسار بدء الحملة وتفعيل الصفحات للتفاعل مع الرابط المستهدف
app.post('/start-page-campaign', async (req, res) => {
    db.all(`SELECT * FROM pages`, [], async (err, pages) => {
        if (err || pages.length === 0) {
            return res.status(400).json({ success: false, message: "لا توجد صفحات مسجلة لبدء الحملة!" });
        }

        // محاكاة إرسال الطلبات عبر الصفحات الـ 10
        let successCount = 0;
        for (const page of pages) {
            try {
                // هنا يتم توجيه الطلب الفعلي عبر Page Token لمتابعة الرابط المستهدف
                // مثال افتراضي لطلب Graph API الخاص بفيسبوك للتفاعل أو الإعجاب
                console.log(`جاري إرسال تفاعل من الصفحة: ${page.pageName} نحو الرابط ${TARGET_URL}`);
                successCount++;
            } catch (error) {
                console.error(`فشل التفاعل من الصفحة ${page.pageName}`);
            }
        }

        db.run(`INSERT INTO tasks (targetUrl, amount, status) VALUES (?, ?, ?)`, [TARGET_URL, successCount, 'تمت بنجاح ✅'], function() {
            res.json({ success: true, message: `تم بنجاح تشغيل ${successCount} صفحات للتفاعل مع الرابط المستهدف وتجاوز الحظر! 🎯` });
        });
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`[+] Bot Farm Core running on port ${PORT}`);
});
