const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// محاكاة قاعدة بيانات لـ 50 صفحة أو رابط
let pages = Array.from({ length: 50 }, (_, index) => ({
    id: index + 1,
    name: `صفحة رقم ${index + 1} - تيك توك / فايسبوك`,
    url: `https://example.com/page-${index + 1}`,
    likes: Math.floor(Math.random() * 500) + 50,
    views: Math.floor(Math.random() * 5000) + 500,
    status: "جاهز للتفاعل"
}));

// عرض لوحة التحكم
app.get('/', (req, res) => {
    res.render('index', { pages });
});

// محاكاة إرسال طلب زيادة التفاعل
app.post('/boost', (req, res) => {
    const { pageId, serviceType } = req.body;
    const page = pages.find(p => p.id == pageId);

    if (page) {
        // محاكاة التأخير الزمني (Queue Simulation)
        setTimeout(() => {
            if (serviceType === 'likes') page.likes += 100;
            if (serviceType === 'views') page.views += 1000;
            page.status = "تم التفاعل بنجاح ✅";
        }, 1500);

        res.json({ success: true, message: `تمت إضافة الطلب للصفحة ${page.id} بنجاح!` });
    } else {
        res.status(404).json({ success: false, message: "الصفحة غير موجودة!" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[+] Server running on port ${PORT}`);
});
