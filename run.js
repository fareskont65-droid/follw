const fetch = require('node-fetch'); // تأكد أن حزمة node-fetch مثبتة في package.json

async function startCampaign() {
    // الرابط المستهدف للحملة (مثال: بروفيسيدك)
    const targetUrl = 'https://www.facebook.com/profile.php?id=61590146324460';
    
    // ضع هنا الـ 10 صفحات والـ Tokens الخاصة بكل صفحة
    const pages = [
        { name: 'Page 1', token: 'ضع_توكن_الصفحة_الأولى_هنا' },
        { name: 'Page 2', token: 'ضع_توكن_الصفحة_الثانية_هنا' },
        { name: 'Page 3', token: 'ضع_توكن_الصفحة_الثالثة_هنا' },
        { name: 'Page 4', token: 'ضع_توكن_الصفحة_الرابعة_هنا' },
        { name: 'Page 5', token: 'ضع_توكن_الصفحة_الخامسة_هنا' },
        { name: 'Page 6', token: 'ضع_توكن_الصفحة_السادسة_هنا' },
        { name: 'Page 7', token: 'ضع_توكن_الصفحة_السابعة_هنا' },
        { name: 'Page 8', token: 'ضع_توكن_الصفحة الثامنة_هنا' },
        { name: 'Page 9', token: 'ضع_توكن_الصفحة_التاسعة_هنا' },
        { name: 'Page 10', token: 'ضع_توكن_الصفحة_العاشرة_هنا' }
    ];

    console.log('🚀 جاري بدء الحملة وتجاوز الحظر عبر الصفحات الفرعية...');

    for (const page of pages) {
        if (!page.token.startsWith('EAAG')) {
            console.log(`⚠️ تخطي الصفحة ${page.name} لعدم توفر Token صحيح.`);
            continue;
        }

        try {
            console.log(`📤 يتم إرسال التفاعل الآن بواسطة: ${page.name}`);
            
            // رابط طلب الـ API الخاص بفيسبوك لإرسال التفاعل أو المتابعة
            const apiEndpoint = `https://graph.facebook.com/v19.0/me/subscribed_apps?access_token=${page.token}`;
            
            // تنفيذ الطلب
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target: targetUrl })
            });

            const result = await response.json();
            console.log(`✅ تم بنجاح عبر ${page.name}:`, result);

        } catch (error) {
            console.error(`❌ خطأ في الصفحة ${page.name}:`, error.message);
        }
        
        // فاصل زمني بسيط بين كل صفحة لتفادي الحظر
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('🎉 اكتملت عملية الحملة بالكامل!');
}

startCampaign();
