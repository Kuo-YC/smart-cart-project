// ==========================================
// 1. 全域設定與模擬資料
// ==========================================
const PRICES = { "可樂": 30, "洋芋片": 25, "蘋果": 20, "礦泉水": 10 };
let currentMode = 'add';
let cart = {}; 
let capturedPhotosCount = 0; // 已拍攝照片數量

// 判斷目前在哪一頁
const path = window.location.pathname;
const isLoginPage = path.includes('index.html');
const isDashboardPage = path.includes('dashboard.html');
const isCheckoutPage = path.includes('checkout.html');

// ==========================================
// 2. 頁面初始化邏輯
// ==========================================
window.onload = function() {
    if (isDashboardPage) {
        initDashboard();
        // 啟動模擬後端 (整合時請刪除這行)
        setInterval(simulateBackendUpdate, 3000);
    } 
    else if (isCheckoutPage) {
        initCheckout();
    }
    // login.html 不需要特別的 onload，功能綁在按鈕上
};

// ==========================================
// 3. 登入頁邏輯 (Login Page)
// ==========================================
function startCamera() {
    const video = document.getElementById('camera-preview');
    const captureBtn = document.getElementById('btn-capture');

    // 要求使用後鏡頭 (environment)，如果在電腦上會自動用 webcan
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            video.srcObject = stream;
            // 啟用拍照按鈕
            captureBtn.disabled = false;
            captureBtn.classList.add('active');
        })
        .catch(err => {
            alert("無法開啟鏡頭: " + err);
        });
}

function capturePhoto() {
    if (capturedPhotosCount >= 3) {
        alert("已經拍完 3 張照片囉！可以登入會員了。");
        return;
    }

    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('canvas');
    const gallery = document.getElementById('photo-gallery');
    const loginBtn = document.getElementById('btn-login');
    const captureBtn = document.getElementById('btn-capture');

    // 設定 canvas 大小與影片一致
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 畫出目前畫面
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 轉成圖片網址 (Base64)
    const dataURL = canvas.toDataURL('image/png');

    // 建立縮圖顯示在畫面上
    const img = document.createElement('img');
    img.src = dataURL;
    img.className = 'thumbnail';
    gallery.appendChild(img);

    // 更新計數
    capturedPhotosCount++;
    captureBtn.innerText = `拍照 (${capturedPhotosCount}/3)`;

    // 檢查是否完成 3 張
    if (capturedPhotosCount >= 3) {
        loginBtn.disabled = false; // 啟用登入按鈕
        loginBtn.innerText = "完成，進入購物";
        loginBtn.style.backgroundColor = "#28a745";
        loginBtn.style.color = "white";
        alert("拍攝完成！請點選「進入購物」。");
    }
}

function handleLogin() {
    const name = document.getElementById('input-name').value;
    const card = document.getElementById('input-card').value;

    if (!name || !card) {
        alert("請輸入姓名與信用卡號！");
        return;
    }

    // 儲存資料到 LocalStorage (讓其他網頁讀取)
    localStorage.setItem('userName', name);
    localStorage.setItem('userCard', card);
    // 這裡實際上也應該把照片傳給後端，但前端模擬先跳過
    
    // 跳轉到主畫面
    window.location.href = 'dashboard.html';
}

// ==========================================
// 4. 購物主畫面邏輯 (Dashboard)
// ==========================================
function initDashboard() {
    // 讀取登入者姓名
    const storedName = localStorage.getItem('userName');
    if (storedName) {
        document.getElementById('user-name').innerText = storedName;
    } else {
        alert("請先登入！");
        window.location.href = 'login.html';
    }
}

function toggleMode() {
    const modeBox = document.getElementById('mode-toggle');
    const modeText = document.getElementById('mode-text');

    if (currentMode === 'add') {
        currentMode = 'remove';
        modeBox.className = "mode-box mode-remove";
        modeText.innerText = "目前狀態：拿出購物車";
    } else {
        currentMode = 'add';
        modeBox.className = "mode-box mode-add";
        modeText.innerText = "目前狀態：放入購物車";
    }
    console.log("模式切換: " + currentMode);
}

function renderCart() {
    const tbody = document.getElementById('cart-list-body');
    const totalEl = document.getElementById('total-price');
    tbody.innerHTML = ''; 

    let total = 0;
    let hasItem = false;

    for (const [item, qty] of Object.entries(cart)) {
        if (qty > 0) {
            hasItem = true;
            const price = PRICES[item];
            const subtotal = price * qty;
            total += subtotal;

            tbody.innerHTML += `
                <tr>
                    <td>${item}</td>
                    <td>${qty}</td>
                    <td>$${price}</td>
                    <td>$${subtotal}</td>
                </tr>`;
        }
    }

    if (!hasItem) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">尚未放入商品...</td></tr>';
    }
    totalEl.innerText = total;
}

function goToCheckout() {
    const total = document.getElementById('total-price').innerText;
    if (total == "0") {
        alert("購物車是空的，不能結帳喔！");
        return;
    }
    localStorage.setItem('myCart', JSON.stringify(cart));
    localStorage.setItem('cartTotal', total);
    window.location.href = 'checkout.html';
}

// --- 模擬後端邏輯 (AI偵測) ---
function simulateBackendUpdate() {
    const items = Object.keys(PRICES);
    const randomItem = items[Math.floor(Math.random() * items.length)];

    if (currentMode === 'add') {
        if (!cart[randomItem]) cart[randomItem] = 0;
        cart[randomItem]++;
    } else {
        if (cart[randomItem] && cart[randomItem] > 0) {
            cart[randomItem]--;
            if (cart[randomItem] === 0) delete cart[randomItem];
        }
    }
    renderCart();
}

// ==========================================
// 5. 結帳頁邏輯 (Checkout)
// ==========================================
function initCheckout() {
    // 讀取資料
    const storedName = localStorage.getItem('userName');
    const storedCard = localStorage.getItem('userCard');
    const storedCart = localStorage.getItem('myCart');
    const storedTotal = localStorage.getItem('cartTotal');

    if (!storedCart) {
        window.location.href = 'dashboard.html';
        return;
    }

    // 填入個資
    document.getElementById('checkout-name').innerText = storedName || "訪客";
    
    // 處理卡號遮罩 (只留後4碼)
    if (storedCard && storedCard.length > 4) {
        const masked = "****-****-****-" + storedCard.slice(-4);
        document.getElementById('checkout-card').innerText = masked;
    } else {
        document.getElementById('checkout-card').innerText = storedCard;
    }

    // 填入總金額
    document.getElementById('checkout-total').innerText = storedTotal;

    // 填入表格
    const cartData = JSON.parse(storedCart);
    const tbody = document.getElementById('checkout-list-body');
    tbody.innerHTML = '';
    
    for (const [item, qty] of Object.entries(cartData)) {
        let price = PRICES[item] || 0;
        let subtotal = price * qty;
        tbody.innerHTML += `
            <tr>
                <td>${item}</td>
                <td>x ${qty}</td>
                <td>$${subtotal}</td>
            </tr>`;
    }
}

function confirmPayment() {
    alert("付款成功！系統將重置。");
    localStorage.clear(); 
    window.location.href = 'index.html';

}
