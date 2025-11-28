// === TELEGRAM MINI APP INTEGRATION ===
let telegramUser = null;
let isTelegramApp = false;

// Проверяем, запущено ли приложение в Telegram
function checkTelegramApp() {
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            isTelegramApp = true;
            return true;
        }
    } catch (e) {
    }
    return false;
}

// Получаем данные пользователя из Telegram
function getTelegramUser() {
    if (!isTelegramApp) return null;
    
    try {
        const webApp = window.Telegram.WebApp;
        if (webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
            telegramUser = webApp.initDataUnsafe.user;
            return telegramUser;
        }
    } catch (e) {
        console.error('Error getting Telegram user data:', e);
    }
    return null;
}

// Адаптируем UI под Telegram Mini App
function adaptUIForTelegram() {
    if (!isTelegramApp) return;
    
    
    // Добавляем класс для CSS стилей
    document.body.classList.add('telegram-mini-app');
    
    // Получаем размеры экрана
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Определяем отступы для Telegram Mini App в зависимости от размера экрана
    let telegramTopOffset = 0;
    
    if (screenWidth <= 360) {
        // Очень маленькие экраны (старые телефоны)
        telegramTopOffset = 75; // Увеличен с 60 до 75
    } else if (screenWidth <= 480) {
        // Маленькие экраны
        telegramTopOffset = 85; // Увеличен с 70 до 85
    } else if (screenWidth <= 768) {
        // Планшеты в портретной ориентации
        telegramTopOffset = 95; // Увеличен с 80 до 95
    } else {
        // Десктоп или планшет в альбомной ориентации
        telegramTopOffset = 0;
    }
    
    // Применяем стили к панелям (как fallback, если CSS не сработает)
    const infoPanel = document.getElementById('info-panel');
    const sideBar = document.querySelector('.side-bar');
    const newsCorner = document.querySelector('.news-corner');
    const appHeader = document.querySelector('.app-header');
    const resetDataBtn = document.getElementById('reset-data');
    const addMoneyBtn = document.getElementById('add-money-test');
    
    if (infoPanel) {
        infoPanel.style.top = `${5 + telegramTopOffset}px`;
    }
    
    if (sideBar) {
        sideBar.style.marginTop = `${80 + telegramTopOffset}px`;
        // Для Telegram Mini App позиционируем правую панель по центру справа
        sideBar.style.right = '8px';
        sideBar.style.left = 'auto';
    }
    
    if (newsCorner) {
        newsCorner.style.top = `${10 + telegramTopOffset}px`;
    }
    
    if (appHeader) {
        appHeader.style.height = `${96 + telegramTopOffset}px`;
        appHeader.style.paddingTop = `${12 + telegramTopOffset}px`;
    }
    
    // Обновляем позиционирование кнопок разработки
    if (resetDataBtn) {
        resetDataBtn.style.top = `${5 + telegramTopOffset}px`;

    }
    
    if (addMoneyBtn) {
        addMoneyBtn.style.top = `${35 + telegramTopOffset}px`;

    }
    
    // Обновляем CSS переменную для header
    document.documentElement.style.setProperty('--header-h', `${96 + telegramTopOffset}px`);
    
    // Обновляем margin для canvas
    const canvas = document.getElementById('three-canvas');
    if (canvas) {
        canvas.style.marginTop = `${96 + telegramTopOffset}px`;
    }
    
    // Обновляем адаптивные стили для правой панели
    updateResponsiveStyles(telegramTopOffset);
    
    // Обновляем панель здания для Telegram Mini App
    updateBuildingPanelForTelegram(telegramTopOffset);
    
    // Обновляем динамические панели зданий для Telegram Mini App
    updateDynamicBuildingPanelsForTelegram(telegramTopOffset);
    
    // Включаем глубокую прокрутку для Telegram Mini App
    enableDeepScrollForTelegram();
    
    // Исправляем позиционирование индикаторов зданий для Telegram Mini App
    fixBuildingIndicatorsForTelegram(telegramTopOffset);
    

}

// Обновляем адаптивные стили для правой панели
function updateResponsiveStyles(telegramOffset) {
    const sideBar = document.querySelector('.side-bar');
    if (!sideBar) return;
    
    const screenWidth = window.innerWidth;
    let baseMargin = 80;
    
    if (screenWidth <= 360) {
        baseMargin = 60;
    } else if (screenWidth <= 480) {
        baseMargin = 70;
    } else if (screenWidth <= 768) {
        baseMargin = 80;
    }
    
    sideBar.style.marginTop = `${baseMargin + telegramOffset}px`;
    // Для Telegram Mini App позиционируем правую панель по центру справа
    sideBar.style.right = '8px';
    sideBar.style.left = 'auto';
}

// Обновляем панель здания для Telegram Mini App
function updateBuildingPanelForTelegram(telegramOffset) {
    const buildingPanel = document.getElementById('building-info-panel');
    if (!buildingPanel) return;
    
    const screenWidth = window.innerWidth;
    let baseBottom = 60; // Базовый отступ снизу
    
    if (screenWidth <= 360) {
        baseBottom = 40;
    } else if (screenWidth <= 480) {
        baseBottom = 45;
    } else if (screenWidth <= 768) {
        baseBottom = 60;
    }
    
    // Добавляем отступ для Telegram Mini App
    const newBottom = baseBottom + telegramOffset;
    buildingPanel.style.bottom = `${newBottom}px`;
    

}

// Обновляем динамические панели зданий для Telegram Mini App
function updateDynamicBuildingPanelsForTelegram(telegramOffset) {
    const screenWidth = window.innerWidth;
    let maxHeight = '75vh'; // Базовая высота
    
    if (screenWidth <= 360) {
        maxHeight = '45vh'; // Еще больше уменьшаем для маленьких экранов в Telegram
    } else if (screenWidth <= 480) {
        maxHeight = '50vh';
    } else if (screenWidth <= 768) {
        maxHeight = '55vh';
    } else {
        maxHeight = '60vh';
    }
    
    // Обновляем все динамические панели зданий
    const buildingPanelContainers = document.querySelectorAll('.building-panel-container');
    buildingPanelContainers.forEach(container => {
        container.style.maxHeight = maxHeight;
        // Минимальный padding снизу для прокрутки без лишнего пустого пространства
        container.style.paddingBottom = '20px';

    });
}

// Функция для глубокой прокрутки в Telegram Mini App
function enableDeepScrollForTelegram() {
    if (!isTelegramApp) return;
    

    
    // Добавляем стили для лучшей прокрутки
    const style = document.createElement('style');
    style.textContent = `
        .telegram-mini-app .building-panel-container {
            scroll-behavior: smooth !important;
            -webkit-overflow-scrolling: touch !important;
            overscroll-behavior: contain !important;
        }
        
        .telegram-mini-app .building-panel-container::-webkit-scrollbar {
            width: 12px !important;
        }
        
        .telegram-mini-app .building-panel-container::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.1) !important;
            border-radius: 6px !important;
        }
        
        .telegram-mini-app .building-panel-container::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.4) !important;
            border-radius: 6px !important;
            border: 2px solid rgba(0,0,0,0.1) !important;
        }
        
        .telegram-mini-app .building-panel-container::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.6) !important;
        }
        
        /* Минимальный отступ снизу для контента */
        .telegram-mini-app .building-panel-container > div {
            padding-bottom: 30px !important;
        }
    `;
    document.head.appendChild(style);
    
    // Принудительно обновляем все панели
    setTimeout(() => {
        updateDynamicBuildingPanelsForTelegram(70);
    }, 100);
}

// Исправляем позиционирование индикаторов зданий для Telegram Mini App
function fixBuildingIndicatorsForTelegram(telegramOffset) {
    if (!isTelegramApp) return;
    

    
    // Получаем все индикаторы прибыли
    const indicators = document.querySelectorAll('.profit-indicator');
    
    indicators.forEach(indicator => {
        // Принудительно устанавливаем position: fixed
        indicator.style.position = 'fixed';
        
        // Получаем текущие координаты
        const rect = indicator.getBoundingClientRect();
        
        // Корректируем позицию с учетом Telegram offset
        const currentTop = rect.top;
        const currentLeft = rect.left;
        
        // Применяем корректировку только если индикатор находится в верхней части экрана
        if (currentTop < 100) { // Если индикатор в верхней части
            indicator.style.top = `${currentTop + telegramOffset}px`;

        }
    });
}

// Обновляем профиль с данными из Telegram
function updateProfileWithTelegram() {
    if (!telegramUser) return;
    
    // Обновляем аватарку
    const avatarImg = document.getElementById('profile-avatar-img');
    const avatarFallback = document.getElementById('profile-avatar-fallback');
    
    if (avatarImg && telegramUser.photo_url) {
        avatarImg.src = telegramUser.photo_url;
        avatarImg.style.display = 'block';
        avatarFallback.style.display = 'none';
    }
    
    // Обновляем ник
    const nickname = document.getElementById('profile-nickname');
    if (nickname && telegramUser.username) {
        nickname.textContent = `@${telegramUser.username}`;
    } else if (nickname && telegramUser.first_name) {
        nickname.textContent = telegramUser.first_name;
        if (telegramUser.last_name) {
            nickname.textContent += ` ${telegramUser.last_name}`;
        }
    }
}

// Обработчик ошибки загрузки аватарки
function handleAvatarError() {
    const avatarImg = document.getElementById('profile-avatar-img');
    const avatarFallback = document.getElementById('profile-avatar-fallback');
    
    if (avatarImg && avatarFallback) {
        avatarImg.style.display = 'none';
        avatarFallback.style.display = 'flex';
    }
}

// Основные переменные
let scene, camera, renderer;
let raycaster, pointer = new THREE.Vector2();

// Функция для простого всплывающего уведомления
function showToast(message, duration = 2000) {
    // Создаем элемент уведомления
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4caf50;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    toast.textContent = message;
    
    // Добавляем в DOM
    document.body.appendChild(toast);
    
    // Показываем
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // Скрываем через duration
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, duration);
}

// Данные для заданий
const socialTasks = [
    {
        title: 'Исследовать TG miniAP',
        description: 'Изучите возможности Telegram Mini App',
        reward: '10k',
        progress: 1,
        target: 1
    },
    {
        title: 'Присоединиться к Pismakov Path',
        description: 'Станьте частью сообщества разработчиков',
        reward: '100k',
        progress: 0,
        target: 1
    },
    {
        title: 'Присоединиться к BOOKE Path',
        description: 'Присоединитесь к официальному пути BOOKE',
        reward: '100k',
        progress: 0,
        target: 1
    }
];

const bookeTasks = [
    {
        title: 'Подписаться на BOOKE',
        description: 'Подпишитесь на официальный канал BOOKE',
        reward: '50k',
        progress: 0,
        target: 1
    },
    {
        title: 'Поделиться достижением',
        description: 'Поделитесь своим прогрессом в социальных сетях',
        reward: '25k',
        progress: 0,
        target: 1
    }
];

// Старые круги завода полностью удалены - используются новые индикаторы прибыли (profit-indicator)

// === ПЕРЕМЕННЫЕ ПЛАТФОРМ УДАЛЕНЫ ===
// Переменные платформ больше не нужны, так как используется новое главное меню с PNG

// GLOBAL ORDERS ARRAY (delivery)
let orders=[];

// Данные инвентаря удалены - панель инвентаря больше не используется

// Функция renderInventoryItems удалена - панель инвентаря больше не используется

// Функция setActiveInventoryTab удалена - панель инвентаря больше не используется

// Функции openInventory и closeInventory удалены - панель инвентаря больше не используется



// Инициализация сцены
// Флаг для отслеживания инициализации сцены
let sceneInitialized = false;

function init() {
    // Предотвращаем повторную инициализацию сцены
    if (sceneInitialized) {

        return;
    }
    // Создаем сцену
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd0d0d0);

    // Настраиваем камеру
    const aspect = window.innerWidth / window.innerHeight;
    const orthoSize = 8; // увеличиваем для лучшего обзора
    camera = new THREE.OrthographicCamera(
        -orthoSize * aspect,
        orthoSize * aspect,
        orthoSize,
        -orthoSize,
        0.1,
        1000
    );
    // Камера под углом 45 градусов к плоскости платформ
    camera.position.set(10, 10, 0);
    camera.lookAt(0, 0, 0); // смотрим в центр

    // Создаем рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.zIndex = '5'; // Canvas под сеткой, но над другими элементами
    document.body.appendChild(renderer.domElement);

    // Отключаем управление камерой для фиксированного вида
    // cameraControllerInit();
    
    // Добавляем освещение
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(10, 20, 10);
    scene.add(dir);

    // === ПЛАТФОРМЫ КАРТЫ УДАЛЕНЫ ===
    // Платформы больше не создаются, так как используется новое главное меню с PNG

    // === ФУНКЦИИ АНИМАЦИИ ПЛАТФОРМ УДАЛЕНЫ ===
    // Анимации платформ больше не нужны, так как используется новое главное меню с PNG

    // расширяем фрустум под карту
    function adjustFrustum(){
        const a = window.innerWidth / window.innerHeight;
        const view=12; // увеличиваем для лучшего обзора
        camera.top = view;
        camera.bottom = -view;
        camera.left = -view * a;
        camera.right = view * a;
        camera.updateProjectionMatrix();
    }
    adjustFrustum();

    // === ФУНКЦИИ РАБОТЫ С ПЛАТФОРМАМИ УДАЛЕНЫ ===
    // Функции highlightPlatform и showAllPlatforms больше не нужны
    
    // === RAYCASTER И ОБРАБОТЧИК КЛИКОВ УДАЛЕНЫ ===
    // Raycaster больше не нужен, так как используется новое главное меню с PNG

    // Обработчик изменения размера окна
    window.addEventListener('resize', onWindowResize, false);

    // После добавления объектов – центрируем камеру
    // fitCameraToScene();
    
    // Инициализируем Telegram Mini App
    checkTelegramApp();
    if (isTelegramApp) {
        getTelegramUser();
        updateProfileWithTelegram();
        adaptUIForTelegram();
    }
    
    sceneInitialized = true;

}

// === CAMERA CONTROLLER (drag + zoom) ===
let isDragging = false, lastPos = { x: 0, y: 0 };
let zoom = 5, minZoom = 1, maxZoom = 5;

function cameraControllerInit() {
    // Отключаем управление камерой для фиксированного вида как на макете
    // window.addEventListener('pointerdown', (e) => { isDragging = true; lastPos.x = e.clientX; lastPos.y = e.clientY; });
    // window.addEventListener('pointermove', (e) => {
    //     if (!isDragging) return;
    //     const dx = (e.clientX - lastPos.x) * 0.08; // чувствительность *5
    //     const dy = (e.clientY - lastPos.y) * 0.1;
    //     lastPos.x = e.clientX;
    //     lastPos.y = e.clientY;

    //     // направления камеры в мировой системе
    //     const right = new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion).setY(0).normalize();
    //     const forward = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).setY(0).normalize();

    //     camera.position.addScaledVector(right, -dx);
    //     camera.position.addScaledVector(forward, dy);
    //     camera.updateMatrixWorld();
    //     clampCamera();
    // });
    // window.addEventListener('pointerup', () => { isDragging = false; });

    // window.addEventListener('wheel', (e) => {
    //     zoom += e.deltaY * 0.001;
    //     zoom = THREE.MathUtils.clamp(zoom, minZoom, maxZoom);
    //     camera.zoom = 5 / zoom;
    //     camera.updateProjectionMatrix();
    // }, { passive: true });
}

function clampCamera() { /* ограничения временно отключены */ }

// === CLICK HANDLING ===
function isAnyPanelOpen() {
    const panels = [
        'shop-panel',
        'characters-panel', 
        'city-panel',
        'tasks-panel',
        'profile-panel',
        'friends-panel',

        'game-tasks-panel',
        'statistics-panel',
        'settings-panel',
        'building-panel'
    ];
    
    return panels.some(panelId => {
        const panel = document.getElementById(panelId);
        return panel && panel.style.display !== 'none';
    });
}

// === ОБРАБОТЧИК КЛИКОВ ПО ПЛАТФОРМАМ УДАЛЕН ===
// Клики по платформам больше не обрабатываются, так как используется новое главное меню с PNG

// === PANEL LOGIC ===
const panel = document.getElementById('upgrade-panel');
const closeBtn = document.getElementById('panel-close');
closeBtn.addEventListener('click', () => {
    panel.style.display = 'none';
    // Анимация платформ больше не нужна
});

// позиционируем панель по центру через CSS
panel.style.left = '50%';
panel.style.top = '50%';
panel.style.transform = 'translate(-50%, -50%)';

function openUpgradePanel() {
    panel.style.display = 'block';
}

// Обработчик изменения размера окна
// Флаг для отслеживания изменения размера окна
let resizeInProgress = false;

function onWindowResize() {
    // Предотвращаем множественные вызовы изменения размера
    if (resizeInProgress) {
        return;
    }
    resizeInProgress = true;
    const aspect = window.innerWidth / window.innerHeight;
    const orthoSize = 1;
    camera.left = -orthoSize * aspect;
    camera.right = orthoSize * aspect;
    camera.top = orthoSize;
    camera.bottom = -orthoSize;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    adjustFrustum(); // обновляем фрустум при ресайзе
    
    // Адаптируем UI для Telegram при изменении размера
    if (isTelegramApp) {
        adaptUIForTelegram();
    }
    
    // Позиционируем круги после изменения размера окна
    setTimeout(initializeCirclePositions, 100);
    
    // Сбрасываем флаг изменения размера
    setTimeout(() => {
        resizeInProgress = false;
    }, 100);
}

// === INCOME & UPGRADE LOGIC ===
let upgradesCount = parseInt(localStorage.getItem('upCnt')||'0');
let intermediateBalance = parseFloat(localStorage.getItem('interBal')||'0');
const costBase = 100;
const rateGrowth = 1.15;
const productionBase = 19.87;

// HTML элементы для круга
const incomeProgress = document.createElement('div');
incomeProgress.id = 'income-progress';
incomeProgress.style.cssText = 'position:absolute;width:70px;height:70px;border-radius:50%;background:conic-gradient(#4caf50 0deg, transparent 0deg);pointer-events:none;z-index:1;visibility:hidden;';
document.body.appendChild(incomeProgress);

// внутренний круг, чтобы оставалась только обводка
const incomeInner=document.createElement('div');
incomeInner.style.cssText='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;border-radius:50%;background:#2b2b2b;pointer-events:none;';
incomeProgress.appendChild(incomeInner);

const incomeBank = document.createElement('div');
incomeBank.id = 'income-bank';
incomeBank.style.cssText = 'position:absolute;width:70px;height:70px;border-radius:50%;background:#8d0000;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;z-index:1;cursor:pointer;';
document.body.appendChild(incomeBank);

// Функция для начального позиционирования кругов
function initializeCirclePositions() {
    // Позиционируем кружки над библиотекой (центрируем по центру здания)
    const cube = scene.getObjectByName('library');
    if(cube){
        // позиция центра куба
        const centerWorld = cube.position.clone();
        centerWorld.project(camera);
        const sx = ( centerWorld.x * 0.5 + 0.5) * window.innerWidth;
        const sy = ( -centerWorld.y * 0.5 + 0.5) * window.innerHeight;
        // Центрируем круг (ширина 70px => радиус 35px)
        incomeProgress.style.left = (sx-35)+'px';
        incomeProgress.style.top  = (sy-85)+'px'; // над центром здания
        incomeBank.style.left = (sx-35)+'px';
        incomeBank.style.top  = (sy-160)+'px'; // ещё выше над прогрессом
    }

    // Старые круги завода удалены - используются новые индикаторы прибыли (profit-indicator)
    // Позиционирование завода теперь управляется через updateProfitIndicatorsPositions() в main-menu.js

    // Позиционируем кружок над хранилищем (центрируем по центру здания)
    const storObj = scene.getObjectByName('storage');
    if(storObj && storageProgressDiv && storageProgressDiv.style.display!=='none'){
        // позиция центра хранилища
        const center3=storObj.position.clone();
        center3.project(camera);
        const sx3=(center3.x*0.5+0.5)*window.innerWidth;
        const sy3=(-center3.y*0.5+0.5)*window.innerHeight;
        // Центрируем круг (ширина 70px => радиус 35px)
        storageProgressDiv.style.left=(sx3-35)+'px';
        storageProgressDiv.style.top =(sy3-85)+'px'; // над центром хранилища
    }
}

// === STORAGE SALE PROGRESS CIRCLE ===
const storageProgressDiv=document.createElement('div');
storageProgressDiv.id='storage-sale-progress';
storageProgressDiv.style.cssText='position:absolute;width:70px;height:70px;border-radius:50%;background:conic-gradient(#4caf50 0deg, transparent 0deg);display:none;pointer-events:none;z-index:1;visibility:hidden;';
document.body.appendChild(storageProgressDiv);
const storageInner=document.createElement('div');
storageInner.style.cssText='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;border-radius:50%;background:#2b2b2b;pointer-events:none;';
storageProgressDiv.appendChild(storageInner);

incomeBank.addEventListener('click', () => {
    const newBal = getBalance()+intermediateBalance;
    setBalance(newBal);
    intermediateBalance = 0;
    window.intermediateBalance = 0; // обновляем глобальную переменную
    incomeBank.textContent = formatNumber(intermediateBalance);
    refreshUpgradeCost();
});

function formatNumber(value){
    const units=['','K','M','B','T'];
    const alphabetStart='a'.charCodeAt(0);
    if(value<0) return '-'+formatNumber(Math.abs(value));
    if(value<1) return value.toFixed(2);
    if(value<1000) return Math.floor(value).toString();

    const n=Math.floor(Math.log(value)/Math.log(1000));
    const m=value/Math.pow(1000,n);

    let unit='';
    if(n<units.length){
        unit=units[n];
    }else{
        const unitInt=n-units.length;
        const first=Math.floor(unitInt/26);
        const second=unitInt%26;
        unit=String.fromCharCode(alphabetStart+first)+String.fromCharCode(alphabetStart+second);
    }
    return (Math.floor(m*100)/100).toFixed(2).replace(/\.00$/,'').replace(/(\.\d)0$/,'$1')+unit;
}

function getIncomePerSecond(){
    if(upgradesCount===0) return 0;
    return productionBase * Math.pow(1.05, upgradesCount);
}

function getNextUpgradeCost(){
    return costBase * Math.pow(rateGrowth, upgradesCount);
}

// Прогресс анимация
let progress = 0;
setInterval(()=>{
    progress += 1;
    if(progress>=60){
        progress = 0;
        // начисляем доход
        const inc = getIncomePerSecond();
        intermediateBalance += inc;
        window.intermediateBalance = intermediateBalance; // обновляем глобальную переменную
        incomeBank.textContent = formatNumber(intermediateBalance);
    }
},1000/60);

function updateProgressVisual(){
    // всегда показываем; при 0-уровне просто не заполняем ободок
    incomeProgress.style.visibility='visible';
    const deg = upgradesCount===0 ? 0 : progress * 6; // 60fps => 360deg
    incomeProgress.style.background = `conic-gradient(#4caf50 ${deg}deg, transparent ${deg}deg)`;
}

// BALANCE helpers + persistence
function getBalance(){return parseFloat(localStorage.getItem('balance')||'100');}
function setBalance(v){
    localStorage.setItem('balance',v);
    const moneyAmount = document.getElementById('money-amount');
    const bcValue = document.getElementById('bc-value');
    if(moneyAmount) {
        moneyAmount.textContent=formatNumber(v);
        moneyAmount.dataset.val=v;
    }
    if(bcValue) {
        bcValue.textContent=formatNumber(v);
    }

    // Обновляем статистику если панель открыта
    if(window.refreshStatistics) {
        window.refreshStatistics();
    }
    
    // Проверяем выполнение заданий связанных с деньгами
    if(window.onMoneyEarned) {
        window.onMoneyEarned(v);
    }
}

// init balance from storage
setBalance(getBalance());

// Switch x1 / MAX
const switchWrapper = document.createElement('div');
switchWrapper.style.cssText='display:flex;gap:2px;margin-top:6px;';
panel.querySelector('#panel-content').appendChild(switchWrapper);

const btnX1 = document.createElement('button');
btnX1.textContent='x1';
btnX1.style.cssText='flex:1;background:#1976d2;border:none;color:#fff;border-radius:6px 0 0 6px;height:32px;cursor:pointer;font-weight:bold;';
const btnMax = document.createElement('button');
btnMax.textContent='MAX';
btnMax.style.cssText='flex:1;background:#000;border:none;color:#fff;border-radius:0 16px 16px 0;height:32px;cursor:pointer;font-weight:bold;';
switchWrapper.append(btnX1,btnMax);

let isMaxMode=false;
function updateSwitch(){
    if(isMaxMode){
        btnX1.style.background='#000';
        btnX1.style.opacity=0.4;
        btnMax.style.background='#1976d2';
        btnMax.style.opacity=1;
    }else{
        btnX1.style.background='#1976d2';
        btnX1.style.opacity=1;
        btnMax.style.background='#000';
        btnMax.style.opacity=0.4;
    }
}
btnX1.onclick=()=>{isMaxMode=false;updateSwitch();refreshUpgradeCost();};
btnMax.onclick=()=>{isMaxMode=true;updateSwitch();refreshUpgradeCost();};
updateSwitch();

// Upgrade button logic
const upgradeBtn = document.getElementById('upgrade-btn');
const levelLabel=document.getElementById('building-level');
const incomeLabel=document.getElementById('building-income');

function updateLevelAndIncome(){
    levelLabel.textContent=upgradesCount;
    incomeLabel.textContent=formatNumber(getIncomePerSecond());
}
updateLevelAndIncome();

function calcMaxAffordableCost(){
    let balance=getBalance();
    let tempUp=upgradesCount;
    let total=0;
    while(true){
        const c= costBase*Math.pow(rateGrowth,tempUp);
        if(balance>=c){total+=c;balance-=c;tempUp++;}
        else break;
    }
    return total>0?total:getNextUpgradeCost();
}

function refreshUpgradeCost(){
    const cost=isMaxMode?calcMaxAffordableCost():getNextUpgradeCost();
    upgradeBtn.querySelector('#upgrade-cost').textContent=formatNumber(cost);
    const afford=getBalance()>=cost;
    upgradeBtn.disabled=!afford;
    upgradeBtn.style.opacity=afford?1:0.5;
}

upgradeBtn.addEventListener('click',()=>{
    const startLvl=upgradesCount;
    let balance=getBalance();
    if(isMaxMode){
        while(balance>=getNextUpgradeCost()){
            const c=getNextUpgradeCost();
            balance-=c;
            upgradesCount++;
        }
    }else{
        const cost=getNextUpgradeCost();
        if(balance>=cost){
            balance-=cost;
            upgradesCount++;
        }
    }
    if(upgradesCount>startLvl){
        setBalance(balance);
        refreshUpgradeCost();
        updateLevelAndIncome();
        // XP суммой от (startLvl+1) до upgradesCount
        const n=upgradesCount-startLvl;
        const sumXP=(startLvl+1+upgradesCount)*n/2;
        addXP(sumXP);
        
        // Обновляем статистику если панель открыта
        if(window.refreshStatistics) {
            window.refreshStatistics();
        }
    }
});

// LOAD saved upgradesCount
refreshUpgradeCost();
updateLevelAndIncome();

// save on change
function saveProgress(){localStorage.setItem('upCnt',upgradesCount);localStorage.setItem('interBal',intermediateBalance);}

setInterval(saveProgress,1000);

// RESET BUTTON
safeAddEventListener('reset-data', 'click', () => {
    localStorage.clear();
    location.reload();
});

// TEST MONEY BUTTON
function addTestMoney() {
    // Используем глобальные функции из main-menu.js
    if (window.getPlayerMoney && window.setPlayerMoney) {
        const currentMoney = window.getPlayerMoney();
        const newMoney = currentMoney + 200000; // +200к
        window.setPlayerMoney(newMoney);
        

        
        // Показываем уведомление если есть функция
        if (window.showNotification) {
            window.showNotification('💰 +200к добавлено!', 'success');
        }
    } else {
        // Fallback: используем localStorage напрямую
        const currentMoney = parseInt(localStorage.getItem('balance')) || 100000;
        const newMoney = currentMoney + 200000;
        localStorage.setItem('balance', newMoney.toString());
        

        
        // Обновляем отображение денег на экране
        const moneyElement = document.getElementById('money-amount');
        if (moneyElement) {
            moneyElement.textContent = newMoney.toLocaleString();
        }
    }
}

// === ANIMATE ===
// Флаг для отслеживания состояния анимации
let animationRunning = false;

function animate() {
    // Предотвращаем повторный запуск анимации
    if (animationRunning) {
        return;
    }
    animationRunning = true;
    
    requestAnimationFrame(animate);
    updateProgressVisual();

    // Проверяем, открыты ли панели магазина, персонажей, города, заданий, профиля, друзей, настроек, статистики или телефона (используем глобальные переменные или DOM)
    const isShopOpen = window.isShopPanelOpen || (document.getElementById('shop-panel') && document.getElementById('shop-panel').style.display !== 'none');
    const isCharactersOpen = window.isCharactersPanelOpen || (document.getElementById('characters-panel') && document.getElementById('characters-panel').style.display !== 'none');
    const isCityOpen = window.isCityPanelOpen || (document.getElementById('city-panel') && document.getElementById('city-panel').style.display !== 'none');
    const isTasksOpen = (document.getElementById('tasks-panel') && document.getElementById('tasks-panel').style.display !== 'none');
    const isGameTasksOpen = (document.getElementById('game-tasks-panel') && document.getElementById('game-tasks-panel').style.display !== 'none');
    const isProfileOpen = window.isProfilePanelOpen || (document.getElementById('profile-panel') && document.getElementById('profile-panel').style.display !== 'none');
    const isFriendsOpen = window.isFriendsPanelOpen || (document.getElementById('friends-panel') && document.getElementById('friends-panel').style.display !== 'none');
    const isSettingsOpen = window.isSettingsPanelOpen || (document.getElementById('settings-panel') && document.getElementById('settings-panel').style.display !== 'none');
    const isStatisticsOpen = window.isStatisticsPanelOpen || (document.getElementById('statistics-panel') && document.getElementById('statistics-panel').style.display !== 'none');
    const isPhoneOpen = window.isPhonePanelOpen || (document.getElementById('phone-panel') && document.getElementById('phone-panel').style.display !== 'none');
    
    // Если любая из панелей открыта, скрываем индикаторы прибыли
    if ((isShopOpen || isCharactersOpen || isCityOpen || isTasksOpen || isGameTasksOpen || isProfileOpen || isFriendsOpen || isSettingsOpen || isStatisticsOpen || isPhoneOpen) && window.hideProfitIndicators) {
        window.hideProfitIndicators();
        // Принудительно очищаем все индикаторы прибыли
        if (window.clearAllProfitIndicators) {
            window.clearAllProfitIndicators();
        }
    }

    // позиционируем кружки над кубом (центрируем по центру здания)
    const cube = scene.getObjectByName('library');
    if(cube){
        // позиция центра куба
        const centerWorld = cube.position.clone();
        centerWorld.project(camera);
        const sx = ( centerWorld.x * 0.5 + 0.5) * window.innerWidth;
        const sy = ( -centerWorld.y * 0.5 + 0.5) * window.innerHeight;
        // Центрируем круг (ширина 70px => радиус 35px)
        incomeProgress.style.left = (sx-35)+'px';
        incomeProgress.style.top  = (sy-85)+'px'; // над центром здания
        incomeBank.style.left = (sx-35)+'px';
        incomeBank.style.top  = (sy-160)+'px'; // ещё выше над прогрессом
    }

    // позиционируем кружок над хранилищем (центрируем по центру здания)
    const storObj = scene.getObjectByName('storage');
    if(storObj && storageProgressDiv && storageProgressDiv.style.display!=='none'){
        // позиция центра хранилища
        const center3=storObj.position.clone();
        center3.project(camera);
        const sx3=(center3.x*0.5+0.5)*window.innerWidth;
        const sy3=(-center3.y*0.5+0.5)*window.innerHeight;
        // Центрируем круг (ширина 70px => радиус 35px)
        storageProgressDiv.style.left=(sx3-35)+'px';
        storageProgressDiv.style.top =(sy3-85)+'px'; // над центром хранилища
        if(selling){
            const elapsed=Date.now()-saleStartTime;
            let deg=0;
            if(saleDelayMs>0){deg=Math.min(360,(elapsed/saleDelayMs)*360);} 
            storageProgressDiv.style.background=`conic-gradient(#4caf50 ${deg}deg, transparent ${deg}deg)`;
        }
    }

    renderer.render(scene, camera);
    
    // Сбрасываем флаг анимации для следующего кадра
    animationRunning = false;
}

// Центрирует ортографическую камеру так, чтобы вся сцена влезла в кадр
function fitCameraToScene() {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Ставим камеру по диагонали сверху (45°) и чуть выше
    const offset = maxDim * 1.2;
    // заменяем авто-подгон: фиксированная камера сверху
    camera.position.set(0,20,0);
    camera.lookAt(0,0,0);

    // Автоподбор zoom для ортокамеры
    const aspect = window.innerWidth / window.innerHeight;
    const frustumHeight = maxDim * 1.5;
    const frustumWidth = frustumHeight * aspect;

    camera.top = frustumHeight / 2;
    camera.bottom = -frustumHeight / 2;
    camera.left = -frustumWidth / 2;
    camera.right = frustumWidth / 2;
    camera.updateProjectionMatrix();
}

// Старые круги завода полностью удалены - используются новые индикаторы прибыли (profit-indicator)
// Запуск игры откладываем до нажатия "Начать"
function startGame(){
    try{
        init();
        if(!animationRunning){
            animate();
        }
        // Позиционируем круги сразу после запуска игры
        setTimeout(initializeCirclePositions, 200);
        
        // Предзагружаем изображения панели города при запуске игры
        try {
            preloadCharacterImages();
        } catch (error) {
            console.error('Error during city panel images preloading:', error);
        }
    }catch(e){
        console.error('Error starting game:', e);
    }
}

if (window.GameLoader && typeof window.GameLoader === 'object') {
    window.GameLoader.onStart = () => startGame();
} else {
    // Fallback: если лоадера нет, запускаем сразу
    startGame();
}

// ������������� ������� ��� �������� ����
renderTasks();
// credits plus click demo
safeAddEventListener('credits-plus', 'click', () => {
    alert('Открыть магазин кредитов');
}); 

// Удаляем старый обработчик кнопки магазина (дублирует новый)
safeAddEventListener('shop-close', 'click', () => {
    hidePanelWithAnimation('shop-panel', () => {
        // Сбрасываем активное состояние в главном меню
        if (window.mainMenu && typeof window.mainMenu.resetActiveSection === 'function') {
            window.mainMenu.resetActiveSection();
        }
    });
}); 

// credits helpers
function getCredits(){return parseInt(localStorage.getItem('credits')||'0');}
function setCredits(v){
    localStorage.setItem('credits',v);
    const creditsAmount = document.getElementById('credits-amount');
    const rbcValue = document.getElementById('rbc-value');
    if(creditsAmount) {
        creditsAmount.textContent=v;
    }
    if(rbcValue) {
        rbcValue.textContent=v;
    }
}

// init credits display
setCredits(getCredits());

// === CRATES LOGIC ===
const crates={
    free :{cost:0,   lvlReq:4, money:[50,120],  credits:[0,0]},
    gold :{cost:30,  lvlReq:0, money:[400,800], credits:[2,5]},
    mystic:{cost:150,lvlReq:0, money:[1500,3000],credits:[8,15]},
    legendary:{cost:500,lvlReq:0, money:[5000,10000],credits:[25,50]},
    divine:{cost:1000,lvlReq:0, money:[15000,30000],credits:[75,150]}
};

function randRange(arr){const [min,max]=arr;return Math.floor(Math.random()*(max-min+1))+min;}

function openCrate(type){
    const cfg=crates[type];
    if(!cfg) return;
    if(cfg.lvlReq>0 && upgradesCount<cfg.lvlReq){alert(`Требуется уровень ${cfg.lvlReq}`);return;}
    if(cfg.cost>0 && getCredits()<cfg.cost){alert('Недостаточно RBC');return;}

    // списываем стоимость
    if(cfg.cost>0){setCredits(getCredits()-cfg.cost);}

    const moneyReward=randRange(cfg.money);
    const creditReward=randRange(cfg.credits);

    setBalance(getBalance()+moneyReward);
    if(creditReward>0) setCredits(getCredits()+creditReward);
    // award XP
    addXP(10);

    // Показываем новую панель наград
    showRewardPanel('safes', {
        money: moneyReward,
        credits: creditReward,
        xp: 10
    });
}

function showPurchaseNotification(title, rewards, itemType = 'safes') {
    const overlay = document.getElementById('crate-overlay');
    
    // Определяем иконку в зависимости от типа товара
    let iconSrc = 'assets/svg/money-icon.svg';
    let bgColor = '#2d6a4f';
    let borderColor = '#1b4332';
    
    switch(itemType) {
        case 'safes':
            iconSrc = 'assets/svg/safes/safe-common.svg';
            bgColor = '#424242';
            borderColor = '#2d2d2d';
            break;
        case 'coins':
            iconSrc = 'assets/svg/chests/chest-1.svg';
            bgColor = '#b8860b';
            borderColor = '#8b6914';
            break;
        case 'sets':
            iconSrc = 'assets/svg/characters/character-1.svg';
            bgColor = '#8e24aa';
            borderColor = '#6a1b9a';
            break;
        default:
            iconSrc = 'assets/svg/money-icon.svg';
            bgColor = '#2d6a4f';
            borderColor = '#1b4332';
    }
    
    // Создаем HTML для наград
    let rewardsHTML = '';
    if (rewards.money) {
        rewardsHTML += `<div style="display:flex;align-items:center;gap:8px;margin:8px 0;padding:8px 12px;background:rgba(255,255,255,0.1);border-radius:8px;border:1px solid rgba(255,255,255,0.2);">
            <div style="width:24px;height:24px;background:#ccc;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#666;">PNG</div>
            <span style="font-size:18px;font-weight:600;color:#fff;">+${formatNumber(rewards.money)}$</span>
        </div>`;
    }
    if (rewards.credits) {
        rewardsHTML += `<div style="display:flex;align-items:center;gap:8px;margin:8px 0;padding:8px 12px;background:rgba(255,255,255,0.1);border-radius:8px;border:1px solid rgba(255,255,255,0.2);">
            <div style="width:24px;height:24px;background:#ccc;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#666;">PNG</div>
            <span style="font-size:18px;font-weight:600;color:#fff;">+${rewards.credits}</span>
        </div>`;
    }
    if (rewards.xp) {
        rewardsHTML += `<div style="display:flex;align-items:center;gap:8px;margin:8px 0;padding:8px 12px;background:rgba(255,255,255,0.1);border-radius:8px;border:1px solid rgba(255,255,255,0.2);">
            <div style="width:24px;height:24px;background:#ccc;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#666;">PNG</div>
            <span style="font-size:18px;font-weight:600;color:#fff;">+${rewards.xp} XP</span>
        </div>`;
    }
    
    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, ${bgColor} 0%, ${borderColor} 100%);
            padding: 24px 28px;
            border-radius: 16px;
            text-align: center;
            animation: purchasePop 0.5s ease-out;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.1);
            max-width: 320px;
            width: 90%;
            position: relative;
            overflow: hidden;
        ">
            <!-- Декоративные элементы -->
            <div style="position:absolute;top:-20px;right:-20px;width:60px;height:60px;background:rgba(255,255,255,0.1);border-radius:50%;"></div>
            <div style="position:absolute;bottom:-30px;left:-30px;width:80px;height:80px;background:rgba(255,255,255,0.05);border-radius:50%;"></div>
            
            <!-- Иконка -->
            <div style="width:64px;height:64px;background:#ccc;border-radius:12px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#666;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
                PNG-image
            </div>
            
            <!-- Заголовок -->
            <h3 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,0.3);">
                ${title}
            </h3>
            
            <!-- Награды -->
            <div style="margin-bottom:24px;">
                ${rewardsHTML}
            </div>
            
            <!-- Кнопка -->
            <button id="purchase-ok" style="
                background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
                border: none;
                border-radius: 12px;
                color: #fff;
                font-size: 16px;
                font-weight: 600;
                padding: 12px 32px;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px rgba(76,175,80,0.3);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            " onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(76,175,80,0.4)'" 
               onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 12px rgba(76,175,80,0.3)'">
                Отлично!
            </button>
        </div>
    `;
    
    overlay.style.display = 'flex';
    overlay.querySelector('#purchase-ok').onclick = () => {
        overlay.style.display = 'none';
    };
}

// Обновляем функцию showCrateOverlay для использования новой системы (обратная совместимость)
function showCrateOverlay(money, credits) {
    showPurchaseNotification('Сейф открыт!', {
        money: money,
        credits: credits,
        xp: 10
    }, 'safes');
}

// Добавляем CSS анимацию для нового уведомления
const stylePurchasePop = document.createElement('style');
stylePurchasePop.textContent = `
@keyframes purchasePop {
    0% {
        transform: scale(0.3) rotate(-10deg);
        opacity: 0;
    }
    50% {
        transform: scale(1.05) rotate(2deg);
    }
    100% {
        transform: scale(1) rotate(0deg);
        opacity: 1;
    }
}
`;
document.head.appendChild(stylePurchasePop);

// Удаляем старый обработчик кнопки города (дублирует новый)
safeAddEventListener('city-close', 'click', () => {
    hidePanelWithAnimation('city-panel', () => {
    setActiveNavButton(0); // сбрасываем активное состояние
    });
});

// Удаляем старый обработчик кнопки персонажей (дублирует новый)
safeAddEventListener('chars-close', 'click', () => {
    hidePanelWithAnimation('characters-panel', () => {
    setActiveNavButton(0); // сбрасываем активное состояние
    });
});

function updateCityButtons(){
    const factoryBuilt=localStorage.getItem('factoryBuilt')==='1';
    const factoryBtn = document.getElementById('btn-build-factory');
    if(factoryBtn) {
        factoryBtn.disabled=factoryBuilt;
        factoryBtn.textContent=factoryBuilt?'Построено':'Построить -35k';
    }
    
    const libraryBuilt=localStorage.getItem('libraryBuilt')==='1';
    const libraryBtn = document.getElementById('btn-build-library');
    if(libraryBtn) {
        libraryBtn.disabled=libraryBuilt;
        libraryBtn.textContent=libraryBuilt?'Построено':'Построить -135k';
    }
    
    const statueBuilt=localStorage.getItem('statueBuilt')==='1';
    const statueBtn = document.getElementById('btn-build-statue');
    if(statueBtn) {
        statueBtn.disabled=statueBuilt;
        statueBtn.textContent=statueBuilt?'Построено':'Построить -500k';
    }
}

// Функция рендеринга панели города
function renderCity() {
    let container = document.querySelector('.city-content-container');
    if (!container) {
        console.error('City content container not found');
        // Попробуем найти через альтернативный селектор
        container = document.getElementById('city-content')?.querySelector('.city-content-container');
        if (!container) {
            console.error('City content container not found (alternative search)');
            return;
        }
    }
    
    container.innerHTML = '';
    
    // Устанавливаем стиль для контейнера с карточками в вертикальном формате
    container.style.cssText = 'width:95%;display:flex;flex-direction:column;gap:12px;margin-right:auto;margin-top:-8px;';
    
    // Функция для форматирования чисел
    const formatNumber = window.formatNumber || ((num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return Math.round(num).toString();
    });
    
    // Функция для отображения звезд
    const starsHTML = (r) => {
        let s = '';
        for(let i = 1; i <= 5; i++) {
            s += i <= r ? '★' : '☆';
        }
        return `<span style="color:#ffeb3b;font-size:9px;">${s}</span>`;
    };
    
    // Получаем данные зданий из localStorage
    const buildingsData = JSON.parse(localStorage.getItem('buildingsData') || '{}');
    
    // Список зданий для панели города (только 4 основных здания)
    const buildings = [
        {
            name: 'Завод',
            image: 'assets/svg/city-panel/factory.svg',
            key: 'factory',
            defaultCost: 20000,
            defaultIncomePerHour: 3000,
            defaultStars: 3
        },
        {
            name: 'Библиотека',
            image: 'assets/svg/city-panel/library.svg',
            key: 'library',
            defaultCost: 0,
            defaultIncomePerHour: 2000,
            defaultStars: 2
        },
        {
            name: 'Почта',
            image: 'assets/svg/city-panel/mail.svg',
            key: 'storage',
            defaultCost: 15000,
            defaultIncomePerHour: 3000,
            defaultStars: 3
        },
        {
            name: 'Типография',
            image: 'assets/svg/city-panel/print.svg',
            key: 'print',
            defaultCost: 25000,
            defaultIncomePerHour: 5000,
            defaultStars: 4
        }
    ];
    
    buildings.forEach(building => {
        // Получаем данные здания из localStorage или используем значения по умолчанию
        const buildingData = buildingsData[building.key] || {};
        
        // Проверяем, построено ли здание (новая и старая система для совместимости)
        let isOwned = buildingData.isOwned;
        
        // Библиотека построена изначально - всегда доступна
        if (building.key === 'library') {
            isOwned = true;
        } else {
            // Проверка старой системы для совместимости
            if (!isOwned && building.key === 'factory') {
                isOwned = localStorage.getItem('factoryBuilt') === '1';
            } else if (!isOwned && building.key === 'storage') {
                isOwned = localStorage.getItem('statueBuilt') === '1';
            }
        }
        
        const cost = buildingData.purchaseCost || building.defaultCost;
        const incomePerHour = buildingData.income || building.defaultIncomePerHour;
        const incomePerMin = Math.round(incomePerHour / 60);
        
        // Синхронизируем звезды с уровнем здания (level от 1 до 5)
        const buildingLevel = buildingData.level || 1;
        const stars = buildingLevel; // rarity = level
        
        const card = document.createElement('div');
        card.className = 'building-card';
        card.setAttribute('data-building', building.name.toLowerCase());
        card.style.cssText = 'background:rgba(255,255,255,0.05);border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:8px;border:1px solid rgba(255,255,255,0.1);width:100%;';
        
        // Проверяем баланс игрока
        const currentBalance = getBalance();
        const hasEnoughMoney = currentBalance >= cost;
        
        // Определяем текст кнопки и стиль
        const buttonText = isOwned ? 'Построено' : 'Построить';
        const buttonDisabled = isOwned;
        
        // Цвет кнопки зависит от состояния: построено, недостаточно денег, или можно строить
        let buttonBackground;
        if (isOwned) {
            buttonBackground = 'rgba(0,0,0,0.3)';
        } else if (!hasEnoughMoney) {
            buttonBackground = 'rgba(100,100,100,0.6)'; // Серый при недостатке денег
        } else {
            buttonBackground = 'rgba(0,0,0,0.8)';
        }
        
        const buttonCursor = (isOwned || !hasEnoughMoney) ? 'not-allowed' : 'pointer';
        const buttonOpacity = (isOwned || !hasEnoughMoney) ? 0.6 : 1;
        
        card.innerHTML = `
            <div style="display:flex;align-items:flex-start;gap:16px;">
                <img src="${building.image}" alt="${building.name}" style="width:95px;height:95px;object-fit:contain;flex-shrink:0;margin-top:20px;" onerror="this.style.display='none';">
                <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
                    <div style="font-size:14px;color:#fff;font-weight:700;margin-bottom:2px;">${building.name}</div>
                    <div style="display:flex;flex-direction:column;gap:0;">
                        <!-- Стоимость -->
                        <div style="display:flex;align-items:center;gap:4px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                            <span style="font-size:10px;color:rgba(255,255,255,0.6);min-width:55px;">Стоимость:</span>
                            <img src="assets/svg/money-icon.svg" alt="Cost" style="width:10px;height:10px;">
                            <span style="font-size:10px;color:rgba(255,255,255,0.8);">${formatNumber(cost)}</span>
                        </div>
                        <!-- Прибыль в минуту -->
                        <div style="display:flex;align-items:center;gap:4px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                            <span style="font-size:10px;color:rgba(255,255,255,0.6);min-width:55px;">Прибыль:</span>
                            <img src="assets/svg/clock-icon.svg" alt="Income" style="width:10px;height:10px;">
                            <span style="font-size:10px;color:rgba(255,255,255,0.8);">${formatNumber(incomePerMin)}/мин</span>
                        </div>
                        <!-- Улучшение (звезды) -->
                        <div style="display:flex;align-items:center;gap:4px;padding:4px 0;">
                            <span style="font-size:10px;color:rgba(255,255,255,0.6);min-width:55px;">Улучшение:</span>
                            ${starsHTML(stars)}
                        </div>
                    </div>
                    <!-- Кнопка построить/построено - смещена левее, шире и более круглая -->
                    <button 
                        class="city-building-button" 
                        data-building-key="${building.key}"
                        style="align-self:flex-start;margin-left:20px;background:${buttonBackground};border:none;border-radius:20px;padding:5px 14px;color:#fff;font-size:11px;font-weight:600;cursor:${buttonCursor};transition:all 0.2s ease;opacity:${buttonOpacity};display:inline-flex;align-items:center;justify-content:center;gap:3px;white-space:nowrap;min-width:160px;max-width:calc(100% - 0px);"
                        ${(buttonDisabled || !hasEnoughMoney) ? 'disabled' : ''}
                        onclick="purchaseBuildingFromCity('${building.key}', '${building.name}', ${cost})"
                    >
                        ${isOwned ? '✓ Построено' : 'Построить'}
                        ${!isOwned ? `<img src="assets/svg/money-icon.svg" alt="Cost" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"> ${formatNumber(cost)}` : ''}
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Делаем функцию глобально доступной
window.renderCity = renderCity;

// Функция покупки здания из панели города
window.purchaseBuildingFromCity = function(buildingKey, buildingName, cost) {
    // Проверяем баланс
    const currentBalance = getBalance();
    if (currentBalance < cost) {
        alert('Недостаточно денег');
        return;
    }
    
    // Получаем данные зданий
    const buildingsData = JSON.parse(localStorage.getItem('buildingsData') || '{}');
    const buildingData = buildingsData[buildingKey] || {};
    
    // Библиотека построена изначально - нельзя покупать
    if (buildingKey === 'library') {
        alert('Библиотека уже построена!');
        return;
    }
    
    // Проверяем, не построено ли уже
    let isOwned = buildingData.isOwned;
    
    // Проверка старой системы для совместимости
    if (!isOwned && buildingKey === 'factory') {
        isOwned = localStorage.getItem('factoryBuilt') === '1';
    } else if (!isOwned && buildingKey === 'storage') {
        isOwned = localStorage.getItem('statueBuilt') === '1';
    }
    
    if (isOwned) {
        alert('Здание уже построено');
        return;
    }
    
    // Вызываем соответствующие функции покупки из main-menu.js
    if (buildingKey === 'factory' && window.buyFactory) {
        window.buyFactory();
    } else if (buildingKey === 'print' && window.buyPrint) {
        window.buyPrint();
    } else if (buildingKey === 'storage' && window.buyStorage) {
        window.buyStorage();
    } else {
        // Общая логика покупки для других зданий
        setBalance(currentBalance - cost);
        
        // Обновляем buildingsData
        if (!buildingsData[buildingKey]) {
            buildingsData[buildingKey] = {};
        }
        buildingsData[buildingKey].isOwned = true;
        buildingsData[buildingKey].purchaseCost = cost;
        buildingsData[buildingKey].lastCollectTime = Date.now();
        buildingsData[buildingKey].accumulatedProfit = 0;
        localStorage.setItem('buildingsData', JSON.stringify(buildingsData));
        
        // Обновляем старую систему для совместимости
        if (buildingKey === 'factory') {
            localStorage.setItem('factoryBuilt', '1');
            if (typeof createFactory === 'function') {
                createFactory();
            }
        } else if (buildingKey === 'storage') {
            localStorage.setItem('statueBuilt', '1');
        }
        
        alert(`${buildingName} построено!`);
    }
    
    // Обновляем панель города
    if (typeof renderCity === 'function') {
        renderCity();
    }
    
    // Обновляем кнопки города (старая система)
    if (typeof updateCityButtons === 'function') {
        updateCityButtons();
    }
    
    // Синхронизируем с интерактивной картой
    if (typeof window.updateBuildingZones === 'function') {
        window.updateBuildingZones();
    }
    if (typeof window.notifyMapBuildingPurchased === 'function') {
        window.notifyMapBuildingPurchased(buildingKey);
    }
    
    // Закрываем панель города после покупки
    if (typeof window.hidePanelWithAnimation === 'function') {
        window.hidePanelWithAnimation('city-panel');
    }
};

// Функция для безопасного добавления обработчиков событий
function safeAddEventListener(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        // Проверяем, не добавлен ли уже обработчик
        if (!element.hasAttribute('data-handler-added')) {
            element.addEventListener(event, handler);
            element.setAttribute('data-handler-added', 'true');

        } else {

        }
    } else {
        console.warn(`❌ Element ${elementId} not found for event handler`);
    }
}

// build factory
safeAddEventListener('btn-build-factory', 'click', () => {
    if(localStorage.getItem('factoryBuilt')==='1')return;
    const cost=35000;
    if(getBalance()<cost){alert('Недостаточно денег');return;}
    setBalance(getBalance()-cost);
    localStorage.setItem('factoryBuilt','1');
    createFactory();
    updateCityButtons();
});

// build library
safeAddEventListener('btn-build-library', 'click', () => {
    if(localStorage.getItem('libraryBuilt')==='1')return;
    const cost=135000;
    if(getBalance()<cost){alert('Недостаточно денег');return;}
    setBalance(getBalance()-cost);
    localStorage.setItem('libraryBuilt','1');
    alert('Библиотека построена!');
    updateCityButtons();
});

// build statue (звезды)
const STAR_KEY='stars';
function getStars(){return parseInt(localStorage.getItem(STAR_KEY)||'0');}
function setStars(v){localStorage.setItem(STAR_KEY,v);} // пока без UI
safeAddEventListener('btn-build-statue', 'click', () => {
    const cost=500000;
    if(localStorage.getItem('statueBuilt')==='1')return;
    if(getBalance()<cost){alert('Недостаточно денег');return;}
    setBalance(getBalance()-cost);
    localStorage.setItem('statueBuilt','1');
    alert('Статуя построена!');
    updateCityButtons();
});

// === FACTORY BUILDING ===
let factoryObj=null;
let factoryProgress=0;
// Старые круги завода полностью удалены - используются новые индикаторы прибыли (profit-indicator)

let factoryIntermediate=0;
let factoryUpgrades=0; // future
const factoryProductionBase=19.87; // то же
const factoryCostBase=100;
const factoryRateGrowth=1.15;

// storage load
factoryUpgrades=parseInt(localStorage.getItem('f_upCnt')||'0');
factoryIntermediate=parseFloat(localStorage.getItem('f_interBal')||'0');
// Обновление старых кругов завода удалено - используется profit-indicator

function getFactoryIncomePerSecond(){
    if(factoryUpgrades===0) return 0;
    return factoryProductionBase * Math.pow(1.05, factoryUpgrades);
}

function factoryGetNextUpgradeCost(){return factoryCostBase*Math.pow(factoryRateGrowth,factoryUpgrades);}

// PANEL logic
const fPanel=document.getElementById('factory-upgrade-panel');
const fClose=document.getElementById('factory-panel-close');
if(fClose && fPanel) {
    fClose.onclick=()=>fPanel.style.display='none';
}

const fUpgradeBtn=document.getElementById('factory-upgrade-btn');
const fLevelLbl=document.getElementById('factory-level');
const fIncomeLbl=document.getElementById('factory-income');

function fUpdateLevelIncome(){fLevelLbl.textContent=factoryUpgrades;fIncomeLbl.textContent=formatNumber(getFactoryIncomePerSecond());}

// добавляем переключатель x1 / MAX
const fSwitchWrapper=document.createElement('div');
fSwitchWrapper.style.cssText='display:flex;gap:2px;margin-top:6px;';
const factoryPanelContent = document.getElementById('factory-panel-content');
if(factoryPanelContent) {
    factoryPanelContent.appendChild(fSwitchWrapper);
}

const fBtnX1=document.createElement('button');
fBtnX1.textContent='x1';
fBtnX1.style.cssText='flex:1;background:#1976d2;border:none;color:#fff;border-radius:6px 0 0 6px;height:32px;cursor:pointer;font-weight:bold;';
const fBtnMax=document.createElement('button');
fBtnMax.textContent='MAX';
fBtnMax.style.cssText='flex:1;background:#000;border:none;color:#fff;border-radius:0 16px 16px 0;height:32px;cursor:pointer;font-weight:bold;';
fSwitchWrapper.append(fBtnX1,fBtnMax);

let fIsMaxMode=false;
function fUpdateSwitch(){
    if(fIsMaxMode){
        fBtnX1.style.background='#000';
        fBtnX1.style.opacity=0.4;
        fBtnMax.style.background='#1976d2';
        fBtnMax.style.opacity=1;
    }else{
        fBtnX1.style.background='#1976d2';
        fBtnX1.style.opacity=1;
        fBtnMax.style.background='#000';
        fBtnMax.style.opacity=0.4;
    }
}
fBtnX1.onclick=()=>{fIsMaxMode=false;fUpdateSwitch();fRefreshCost();};
fBtnMax.onclick=()=>{fIsMaxMode=true;fUpdateSwitch();fRefreshCost();};
fUpdateSwitch();

// функция для рассчёта стоимости при MAX
function fCalcMaxAffordableCost(){
    let balance=getBalance();
    let temp=factoryUpgrades;
    let total=0;
    while(true){
        const c=factoryCostBase*Math.pow(factoryRateGrowth,temp);
        if(balance>=c){total+=c;balance-=c;temp++;}
        else break;
    }
    return total>0?total:factoryGetNextUpgradeCost();
}

function fRefreshCost(){const c=fIsMaxMode?fCalcMaxAffordableCost():factoryGetNextUpgradeCost();fUpgradeBtn.querySelector('span').textContent=formatNumber(c);const afford=getBalance()>=c;fUpgradeBtn.disabled=!afford;fUpgradeBtn.style.opacity=afford?1:0.5;}
fUpdateLevelIncome();fRefreshCost();

fUpgradeBtn.onclick=()=>{
    const start=factoryUpgrades;
    let bal=getBalance();
    if(fIsMaxMode){
        while(bal>=factoryGetNextUpgradeCost()){
            const c=factoryGetNextUpgradeCost();
            bal-=c;
            factoryUpgrades++;
        }
    }else{
        const cost=factoryGetNextUpgradeCost();
        if(bal>=cost){bal-=cost;factoryUpgrades++;}
    }
    if(factoryUpgrades>start){
        setBalance(bal);
        fUpdateLevelIncome();
        fRefreshCost();
        saveFactory();
        const n=factoryUpgrades-start;
        const sumXP=(start+1+factoryUpgrades)*n/2;
        addXP(sumXP);
        
        // Обновляем статистику если панель открыта
        if(window.refreshStatistics) {
            window.refreshStatistics();
        }
    }
};

function saveFactory(){localStorage.setItem('f_upCnt',factoryUpgrades);localStorage.setItem('f_interBal',factoryIntermediate);} // called periodically

function createFactory(){
    if(factoryObj) return;
    const geo=new THREE.BoxGeometry(2,2,2);
    const mat=new THREE.MeshLambertMaterial({color:0xffdd55});
    factoryObj=new THREE.Mesh(geo,mat);
    factoryObj.name='factory';
    factoryObj.scale.set(3,3,3);
    factoryObj.position.set(18,3,0); // поднят на половину высоты
    scene.add(factoryObj);

    // Старые круги завода полностью удалены - используются новые индикаторы прибыли (profit-indicator)
    // Позиционирование завода управляется через updateProfitIndicatorsPositions() в main-menu.js

    // click handler
    window.addEventListener('pointerdown',(e)=>{
        // Блокируем клики если открыта любая панель
        if (isAnyPanelOpen()) return;
        
        pointer.x=(e.clientX/window.innerWidth)*2-1;
        pointer.y=-(e.clientY/window.innerHeight)*2+1;
        raycaster.setFromCamera(pointer,camera);
        const ints=raycaster.intersectObjects([factoryObj],true);
        if(ints.length>0){fPanel.style.display='block';fRefreshCost();fUpdateLevelIncome();}
    });

    // Старые круги завода полностью удалены - используются новые индикаторы прибыли (profit-indicator)
}

// recreate if built earlier
if(localStorage.getItem('factoryBuilt')==='1'){
    createFactory();
    // Позиционируем круги после создания завода
    setTimeout(initializeCirclePositions, 100);
}

// income loop extension
setInterval(()=>{
    // factory progress (3s cycle => 180 steps)
    if(factoryObj){
        factoryProgress+=1;
        if(factoryProgress>=180){
            factoryProgress=0;
            const inc=getFactoryIncomePerSecond()*3;
            factoryIntermediate+=inc;
            window.factoryIntermediate = factoryIntermediate; // обновляем глобальную переменную
            // Обновление старых кругов завода удалено - используется profit-indicator
        }
        // Обновление прогресса старых кругов завода удалено - используется profit-indicator
    }
},1000/60);

// Сбор денег завода теперь через profit-indicator (обработчик в main-menu.js)

// === OFFLINE INCOME — удалено ===

// save factory progress periodically
setInterval(saveFactory,1000); 

// referrals helpers
function getRefs(){return parseInt(localStorage.getItem('refs')||'0');}
function setRefs(v){
    localStorage.setItem('refs',v);
    const refValue = document.getElementById('ref-value');
    if(refValue) {
        refValue.textContent=v+'/5';
    }
}
// init stat values
const bcValue = document.getElementById('bc-value');
const rbcValue = document.getElementById('rbc-value');
const refValue = document.getElementById('ref-value');

if(bcValue) bcValue.textContent=formatNumber(getBalance());
if(rbcValue) rbcValue.textContent=getCredits();
if(refValue) refValue.textContent=getRefs()+'/5';

// === PHONE PANEL ===
const phonePanel=document.getElementById('phone-panel');
if(phonePanel){
    const phoneHome=document.getElementById('phone-home');
    const bookeioScreen=document.getElementById('bookeio-app');
    const deliveryScreen=document.getElementById('delivery-app');
    const messagesScreen=document.getElementById('messages-app');

    function showHome(){
        phoneHome.style.display='flex';
        bookeioScreen.style.display='none';
        deliveryScreen.style.display='none';
        messagesScreen.style.display='none';
    }
    function openScreen(scr){
        phoneHome.style.display='none';
        bookeioScreen.style.display='none';
        deliveryScreen.style.display='none';
        scr.style.display='flex';
    }

    // открытие/закрытие телефона
    function toggleCircles(show){
        const list=[incomeProgress,incomeBank,storageProgressDiv]; // Старые круги завода удалены
        list.forEach(el=>{el.style.visibility=show?'visible':'hidden';});
    }

    safeAddEventListener('btn-phone', 'click', () => {
        showPanelWithAnimation('phone-panel');
        showHome();
        toggleCircles(false);
        setActiveSideButton('btn-phone');
    });
    safeAddEventListener('phone-close', 'click', () => {
        hidePanelWithAnimation('phone-panel', () => {
            toggleCircles(true);
            clearActiveSideButton();
            // Восстанавливаем индикаторы прибыли
            if (window.updateProfitIndicators) {
                setTimeout(() => {
                    window.updateProfitIndicators();
                }, 100);
            }
        });
    });
    document.querySelectorAll('.phone-back').forEach(btn=>btn.addEventListener('click',()=>{showHome();}));
    safeAddEventListener('app-bookeio', 'click', () => openScreen(bookeioScreen));
    safeAddEventListener('app-delivery', 'click', () => {refreshDeliveryList();openScreen(deliveryScreen);});
    safeAddEventListener('app-messages', 'click', () => {renderMessages();openScreen(messagesScreen);messagesArr.forEach(m=>m.read=true);saveMessages();updateDots();});

    // данные заказов и цены
    const BOOK_COST=50;
    const MAG_COST=10;
    const SELL_MULT=2;
    orders=JSON.parse(localStorage.getItem('orders')||'[]');
    function saveOrders(){localStorage.setItem('orders',JSON.stringify(orders));}

    // слайдеры и отображение стоимости
    const bookSlider=document.getElementById('book-slider');
    const magSlider=document.getElementById('mag-slider');
    const bookCostLabel=document.getElementById('book-cost');
    const magCostLabel=document.getElementById('mag-cost');
    const bookQtyLabel=document.getElementById('book-qty');
    const magQtyLabel=document.getElementById('mag-qty');
    function updateCostLabels(){
        bookCostLabel.textContent = formatNumber(bookSlider.value*BOOK_COST)+'$';
        magCostLabel.textContent = formatNumber(magSlider.value*MAG_COST)+'$';
        bookQtyLabel.textContent = bookSlider.value;
        magQtyLabel.textContent  = magSlider.value;
    }
    if(bookSlider){bookSlider.addEventListener('input',updateCostLabels);} 
    if(magSlider){magSlider.addEventListener('input',updateCostLabels);}
    updateCostLabels();

    // отдельные заказы
    const orderBookBtn=document.getElementById('btn-order-book');
    const orderMagBtn=document.getElementById('btn-order-mag');
    if(orderBookBtn){orderBookBtn.addEventListener('click',()=>{
        const qty=parseInt(bookSlider.value);
        if(qty<=0){alert('Выберите количество');return;}
        const cost=qty*BOOK_COST;
        if(getBalance()<cost){alert('Недостаточно BC');return;}
        setBalance(getBalance()-cost);
        bookSlider.value=0;updateCostLabels();
        alert('Заказ оформлен!');
        const qtyCopy=qty;
        setTimeout(()=>{
            orders.push({type:'books',qty:qtyCopy,cost:cost});
            saveOrders();
            pushNotification('DELIVERY',`Книги (${qtyCopy}) доставлены на почту`,'assets/icons/delivery.svg');
            updateDots();
            refreshDeliveryList();
        },15000);
    });}
    if(orderMagBtn){orderMagBtn.addEventListener('click',()=>{
        const qty=parseInt(magSlider.value);
        if(qty<=0){alert('Выберите количество');return;}
        const cost=qty*MAG_COST;
        if(getBalance()<cost){alert('Недостаточно BC');return;}
        setBalance(getBalance()-cost);
        magSlider.value=0;updateCostLabels();
        alert('Заказ оформлен!');
        const qtyCopy=qty;
        setTimeout(()=>{
            orders.push({type:'magazines',qty:qtyCopy,cost:cost});
            saveOrders();
            pushNotification('DELIVERY',`Журналы (${qtyCopy}) доставлены на почту`,'assets/icons/delivery.svg');
            updateDots();
            refreshDeliveryList();
        },15000);
    });}

    function refreshDeliveryList(){
        const cont=document.getElementById('orders-container');
        cont.innerHTML='';
        if(orders.length===0){cont.innerHTML='<p style="text-align:center;width:100%;opacity:.6">Нет заказов</p>';return;}
        orders.forEach(o=>{
            const div=document.createElement('div');
            div.className='order-item';
            div.innerHTML=`<span>${o.type==='books'?'Книги':'Журналы'} ×${o.qty}</span><span>${formatNumber(o.cost)}$</span>`;
            cont.appendChild(div);
        });
    }

    // удалён старый обработчик "забрать всё" (моментальная продажа). Новый обработчик определён ниже.
} 

// === NOTIFICATION & MESSAGES ===
let messagesArr=JSON.parse(localStorage.getItem('messages')||'[]');
function saveMessages(){localStorage.setItem('messages',JSON.stringify(messagesArr));}
function hasUnread(){return messagesArr.some(m=>!m.read);} 
function updateDots(){
   const show=hasUnread();
   document.getElementById('phone-dot').style.display=show?'block':'none';
   document.getElementById('msg-dot').style.display=show?'block':'none';
}
function pushNotification(app,text,icon){
   const msg={app,text,time:Date.now(),read:false,icon};
   messagesArr.push(msg);saveMessages();updateDots();
}
function formatTimeHHMM(t){const d=new Date(t);return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});}
function renderMessages(){
   const cont=document.getElementById('messages-container');if(!cont) return;
   cont.innerHTML='';
   messagesArr.slice().reverse().forEach(m=>{
      const item=document.createElement('div');item.style.cssText='display:flex;align-items:center;gap:6px;background:#6d6d6d;border-radius:8px;padding:6px;margin-bottom:6px;font-size:12px;';
      item.innerHTML=`<img src="${m.icon||'assets/icons/delivery.svg'}" style="width:24px;height:24px;"> <div style="flex:1;">${m.text}</div><span style="opacity:.6;">${formatTimeHHMM(m.time)}</span>`;
      cont.appendChild(item);
   });
}
// статус-бар время
setInterval(()=>{
    const t=new Date();
    const phoneStatus = document.getElementById('phone-status');
    if(phoneStatus) {
        phoneStatus.textContent=t.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    }
},1000*30);
// open Messages app (обработчик добавлен внутри phonePanel блока)
// initialize dots
updateDots(); 

// === PLAYER LEVEL SYSTEM ===
const XP_BASE=20;
let playerLevel=parseInt(localStorage.getItem('playerLevel')||'1');
let playerXP=parseInt(localStorage.getItem('playerXP')||'0');
function xpForLevel(lvl){
    if(lvl<=1) return 0;
    if(lvl===2) return XP_BASE;
    const mult=Math.pow(1.25,lvl-2);
    return Math.round(XP_BASE*mult);
}
function saveXP(){localStorage.setItem('playerLevel',playerLevel);localStorage.setItem('playerXP',playerXP);} 
function updateProfileUI(){
    // Используем единую функцию синхронизации
    syncLevelAndXP();
    
    // Обновляем статистику если панель открыта
    if(window.refreshStatistics) {
        window.refreshStatistics();
    }
}

// Функция для синхронизации уровня и ХП между профилем и статистикой
function syncLevelAndXP() {
    // Получаем данные игрока
    const currentPlayerLevel = parseInt(localStorage.getItem('playerLevel') || '1');
    const currentPlayerXP = parseInt(localStorage.getItem('playerXP') || '0');
    
    // Функция для расчета XP для следующего уровня
    const XP_BASE = 20;
    function xpForLevel(lvl) {
        if (lvl <= 1) return 0;
        if (lvl === 2) return XP_BASE;
        const mult = Math.pow(1.25, lvl - 2);
        return Math.round(XP_BASE * mult);
    }
    
    // Рассчитываем XP для текущего и следующего уровня
    const currentLevelXP = xpForLevel(currentPlayerLevel);
    const nextLevelXP = xpForLevel(currentPlayerLevel + 1);
    const xpInCurrentLevel = currentPlayerXP - currentLevelXP;
    const xpToNextLevel = nextLevelXP - currentPlayerXP;
    
    // Рассчитываем прогресс (процент заполнения текущего уровня)
    const progressPercent = nextLevelXP > currentLevelXP ? 
        ((currentPlayerXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 : 0;
    
    // === ОБНОВЛЕНИЕ ПРОФИЛЯ ===
    // Обновляем номер уровня в круге профиля
    const profileLevelNumber = document.querySelector('.profile-level-number');
    if (profileLevelNumber) {
        profileLevelNumber.textContent = currentPlayerLevel;
    }
    
    // Обновляем текст уровня в профиле
    const profileLevelText = document.querySelector('.profile-level-text');
    if (profileLevelText) {
        profileLevelText.textContent = `Уровень ${currentPlayerLevel}`;
    }
    
    // Обновляем прогресс-бар XP в профиле
    const profileXpProgressBar = document.querySelector('.profile-xp-progress-bar');
    if (profileXpProgressBar) {
        profileXpProgressBar.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
    }
    
    // Обновляем текст XP в прогресс баре
    const profileXpText = document.querySelector('.profile-xp-text');
    if (profileXpText) {
        profileXpText.textContent = `${currentPlayerXP} XP`;
    }
    
    // Обновляем информацию об XP в профиле
    const profileCurrentXp = document.querySelector('.profile-current-xp');
    if (profileCurrentXp) {
        profileCurrentXp.textContent = xpInCurrentLevel;
    }
    
    const profileNextLevelXp = document.querySelector('.profile-next-level-xp');
    if (profileNextLevelXp) {
        profileNextLevelXp.textContent = nextLevelXP - currentLevelXP;
    }
    
    const profileXpToNext = document.querySelector('.profile-xp-to-next');
    if (profileXpToNext) {
        profileXpToNext.textContent = xpToNextLevel;
    }
    
    const profileXpToNextBottom = document.querySelector('.profile-xp-to-next-bottom');
    if (profileXpToNextBottom) {
        profileXpToNextBottom.textContent = xpToNextLevel;
    }
    
    // === ОБНОВЛЕНИЕ СТАТИСТИКИ ===
    // Обновляем отображение уровня в статистике
    const statsLevelProgress = document.querySelector('#statistics-panel .level-progress');
    if (statsLevelProgress) {
        const statsLevelNumber = statsLevelProgress.querySelector('.level-number');
        if (statsLevelNumber) {
            statsLevelNumber.textContent = currentPlayerLevel;
        }
    }
    
    const statsLevelText = document.querySelector('#statistics-panel .level-text');
    if (statsLevelText) {
        statsLevelText.textContent = `Уровень ${currentPlayerLevel}`;
    }
    
    // Обновляем прогресс-бар XP в статистике
    const statsXpProgressBar = document.querySelector('#statistics-panel .xp-progress-bar');
    if (statsXpProgressBar) {
        statsXpProgressBar.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
    }
    
    // Обновляем информацию об XP в статистике
    const statsCurrentXp = document.querySelector('#statistics-panel .current-xp');
    if (statsCurrentXp) {
        statsCurrentXp.textContent = xpInCurrentLevel;
    }
    
    const statsNextLevelXp = document.querySelector('#statistics-panel .next-level-xp');
    if (statsNextLevelXp) {
        statsNextLevelXp.textContent = nextLevelXP - currentLevelXP;
    }
    
    const statsXpToNext = document.querySelector('#statistics-panel .xp-to-next');
    if (statsXpToNext) {
        statsXpToNext.textContent = xpToNextLevel;
    }
}

function addXP(amount){
    let gained=0;
    playerXP+=amount;
    const startLvl=playerLevel;
    while(playerXP>=xpForLevel(playerLevel+1)){
        playerXP-=xpForLevel(playerLevel+1);
        playerLevel++;gained++;
    }
    saveXP();
    syncLevelAndXP(); // Используем единую функцию синхронизации
    if(gained>0) enqueueLevelAnimations(startLvl,gained);
    
    // Обновляем статистику если панель открыта
    if(window.refreshStatistics) {
        window.refreshStatistics();
    }
}

// Удаляем старый обработчик кнопки профиля (дублирует новый)
const profileClose=document.getElementById('profile-close');
if(profileClose){profileClose.addEventListener('click',()=>{hidePanelWithAnimation('profile-panel');});}
// === award XP on upgrades ===
// library upgrade: in upgradeBtn click after each upgrade increment
// modify inside existing handler
// ... existing code ... 

const overlay=document.getElementById('levelup-overlay');
const badge=document.getElementById('levelup-badge');
let levelQueue=[];let levelPlaying=false;
function enqueueLevelAnimations(startLevel,gained){
    for(let i=1;i<=gained;i++) levelQueue.push(startLevel+i);
    if(!levelPlaying) playNext();
}

function playNext(){
    if(levelQueue.length===0){levelPlaying=false;overlay.style.display='none';return;}
    levelPlaying=true;
    const lvl=levelQueue.shift();
    badge.textContent=lvl-1; // показываем текущий
    overlay.style.display='flex';
    badge.className='lvl-slide-in';
}

badge.addEventListener('animationend',e=>{
    if(e.animationName==='slideIn'){
        // смена текста и shake
        badge.textContent=parseInt(badge.textContent)+1;
        badge.className='lvl-shake';
    }else if(e.animationName==='shake'){
        badge.className='lvl-slide-out';
    }else if(e.animationName==='slideOut'){
        playNext();
    }
});

// inject css
const st=document.createElement('style');st.textContent=`
#levelup-overlay{background:rgba(0,0,0,.6);} 
.lvl-slide-in{animation:slideIn .8s forwards;}
.lvl-shake{animation:shake .3s forwards;}
.lvl-slide-out{animation:slideOut .8s forwards;}
@keyframes slideIn{0%{transform:translateX(-150%) scale(1);}100%{transform:translateX(0) scale(1);} }
@keyframes shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-4px);}40%{transform:translateX(4px);}60%{transform:translateX(-3px);}80%{transform:translateX(3px);} }
@keyframes slideOut{0%{transform:translateX(0);}100%{transform:translateX(150%);} }
`;document.head.appendChild(st); 

// === STORAGE SYSTEM ===
const STORAGE_BASE_CAP=1000;
let storageUpgrades=parseInt(localStorage.getItem('stor_up')||'0');
let storageCapacity=STORAGE_BASE_CAP+storageUpgrades*500; // +500 за ап
let storedBooks=parseInt(localStorage.getItem('stor_books')||'0');
let storedMags =parseInt(localStorage.getItem('stor_mags') ||'0');

// Делаем переменные хранилища доступными глобально для новой системы доставки
window.storedBooks = storedBooks;
window.storedMags = storedMags;
function saveStorage(){
    localStorage.setItem('stor_up',storageUpgrades);
    localStorage.setItem('stor_books',storedBooks);
    localStorage.setItem('stor_mags',storedMags);
    // Убираем сохранение saleQueue - теперь используется новая система доставки
    // localStorage.setItem('stor_queue',JSON.stringify(saleQueue));
}

// Делаем функцию saveStorage доступной глобально
window.saveStorage = saveStorage; 
function updateStorageUI(rootElement = document){
    const total=storedBooks+storedMags;
    const pct=Math.min(100,total/storageCapacity*100);
    
    // Эти элементы для старой панели, которые могут не быть в rootElement
    // Предполагаем, что они всегда глобальные или обрабатываются отдельно если существуют
    const globalBar=document.getElementById('storage-progress-bar');
    const globalTxt=document.getElementById('storage-progress-text');
    const globalAmt=document.getElementById('storage-amount');
    
    if(globalBar){
        globalBar.style.width=pct+'%';
        const hue=120-(pct*1.2);
        globalBar.style.background=`hsl(${hue},80%,45%)`;
    }
    if(globalTxt){
        const hue=120-(pct*1.2);
        globalTxt.textContent=Math.round(pct)+'%';
        globalTxt.style.color=`hsl(${hue},80%,55%)`;
    }
    if(globalAmt){
        globalAmt.textContent=`${total}/${storageCapacity}`;
    }
    
    // Эти элементы в карточке хранилища, которые могут быть в основном документе или в конкретной панели
    const cardPct=rootElement.querySelector('#storage-card-percent'); // Используем querySelector на rootElement
    const cardAmt=rootElement.querySelector('#storage-card-amt'); // Используем querySelector на rootElement
    
    if(cardPct){
        cardPct.textContent=Math.round(pct)+'%';
    }
    if(cardAmt){
        cardAmt.textContent=`${total} / ${storageCapacity}`;
    }
}

// Делаем функцию updateStorageUI доступной глобально
window.updateStorageUI = updateStorageUI; 
function canStore(q){return storedBooks+storedMags+q<=storageCapacity;} 

// === СТАРАЯ СИСТЕМА ПРОДАЖИ ОТКЛЮЧЕНА ===
// let saleQueue=JSON.parse(localStorage.getItem('stor_queue')||'[]');let selling=false;let saleTimer=null;
// let saleStartTime=0, saleDelayMs=0; // для круга прогресса
// function scheduleSale(){if(selling||saleQueue.length===0) return; selling=true; const delay=500+Math.random()*1500; saleStartTime=Date.now(); saleDelayMs=delay; storageProgressDiv.style.visibility='visible'; saleTimer=setTimeout(processSale,delay);} 
// function processSale(){if(saleQueue.length===0){selling=false;storageProgressDiv.style.visibility='hidden';return;} const order=saleQueue[0]; order.qty--; const defective=Math.random()<0.1; const priceMultiplier=defective?(0.5+Math.random()*0.5):2; const revenue=order.unitCost*priceMultiplier; setBalance(getBalance()+revenue); order.revenue+=revenue; if(defective) order.defective++; if(order.type==='books') storedBooks--; else storedMags--; updateStorageUI(); if(order.qty===0){ // order complete
//     pushNotification('STORAGE',`${order.type==='books'?'Книги':'Журналы'} партия (${order.originalQty}) продана за ${formatNumber(Math.round(order.revenue))}$, брак: ${order.defective}`,'assets/icons/delivery.svg');
//     saleQueue.shift();
//  }
//  saveStorage(); selling=false; if(saleQueue.length>0){scheduleSale();}else{storageProgressDiv.style.visibility='hidden';}}

function addToStorage(type,qty,unitCost){
    if(!canStore(qty)) return false; 
    if(type==='books') {
        storedBooks+=qty; 
        // Обновляем глобальную переменную
        window.storedBooks = storedBooks;
        // Проверяем, была ли напечатана первая книга
        if (storedBooks === qty && window.onBookPrinted) {
            window.onBookPrinted();
        }
    } else {
        storedMags+=qty; 
        // Обновляем глобальную переменную
        window.storedMags = storedMags;
    }
    // Убираем добавление в saleQueue - теперь используется новая система доставки
    // saleQueue.push({type,qty,originalQty:qty,unitCost,revenue:0,defective:0}); 
    saveStorage();
    updateStorageUI(); 
    // Убираем автоматический запуск продажи
    // scheduleSale(); 
    return true;
}

// Делаем функцию addToStorage доступной глобально
window.addToStorage = addToStorage;

// открытие/закрытие панели хранилища
const storagePanel=document.getElementById('storage-upgrade-panel');
if(storagePanel){document.getElementById('storage-panel-close').onclick=()=>storagePanel.style.display='none';}
// город строит хранилище
const btnStorageBuild=document.getElementById('btn-build-storage');
if(btnStorageBuild){btnStorageBuild.addEventListener('click',()=>{if(localStorage.getItem('storageBuilt')==='1')return;const cost=1000;if(getBalance()<cost){alert('Недостаточно денег');return;}setBalance(getBalance()-cost);localStorage.setItem('storageBuilt','1');btnStorageBuild.disabled=true;btnStorageBuild.textContent='Построено';createStorage();});}
function createStorage(){
    if(scene.getObjectByName('storage')) return;
    const geo=new THREE.BoxGeometry(2,2,2);
    const mat=new THREE.MeshLambertMaterial({color:0x9c27b0});
    const stor=new THREE.Mesh(geo,mat);
    stor.name='storage';
    stor.scale.set(3,3,3);
    stor.position.set(-18,3,0);
    scene.add(stor);

    // show storage progress circle
    storageProgressDiv.style.display='flex';
    storageProgressDiv.style.visibility='visible';

    // click handler open panel
    window.addEventListener('pointerdown',(e)=>{
        // Блокируем клики если открыта любая панель
        if (isAnyPanelOpen()) return;
        
        pointer.x=(e.clientX/window.innerWidth)*2-1;
        pointer.y=-(e.clientY/window.innerHeight)*2+1;
        raycaster.setFromCamera(pointer,camera);
        const ints=raycaster.intersectObjects([stor],true);
        if(ints.length>0){storagePanel.style.display='block';updateStorageUI();updateStorageUpgradeCost();}
    });
    
    // Позиционируем круги после создания хранилища
    setTimeout(initializeCirclePositions, 100);
}
// recreate storage if built earlier
if(localStorage.getItem('storageBuilt')==='1') {
    createStorage();
    // Позиционируем круги после создания хранилища
    setTimeout(initializeCirclePositions, 100);
}

// DELIVERY UI modifications
const collectSelBtn=document.getElementById('btn-collect-selected');if(collectSelBtn){collectSelBtn.addEventListener('click',collectSelected);} 
function refreshDeliveryList(){const cont=document.getElementById('orders-container');if(!cont) return;cont.innerHTML='';if(orders.length===0){cont.innerHTML='<p style="text-align:center;width:100%;opacity:.6">Нет заказов</p>';return;}orders.forEach((o,idx)=>{const div=document.createElement('div');div.className='order-item';div.innerHTML=`<span>${o.type==='books'?'Книги':'Журналы'} ×${o.qty}</span><span>${formatNumber(o.cost)}$</span>`;cont.appendChild(div);});}
function collectSelected(){const checkboxes=[...document.querySelectorAll('#orders-container input[type=checkbox]')];const selIdxs=checkboxes.filter(ch=>ch.checked).map(ch=>parseInt(ch.dataset.idx));if(selIdxs.length===0){alert('Ничего не выбрано');return;} let totalQty=0;selIdxs.forEach(i=>{totalQty+=orders[i].qty;});if(!canStore(totalQty)){alert('Недостаточно места в хранилище');return;} // добавить партии
const newOrders=[];orders.forEach((o,i)=>{if(selIdxs.includes(i)){const unit=o.cost/o.qty;addToStorage(o.type,o.qty,unit);}else newOrders.push(o);});orders=newOrders;saveOrders();refreshDeliveryList();}
// переопределяем collect-all
const collectAllBtn=document.getElementById('btn-collect-all');if(collectAllBtn){collectAllBtn.onclick=()=>{let total=0;orders.forEach(o=>total+=o.qty);if(!canStore(total)){alert('Недостаточно места в хранилище');return;}orders.forEach(o=>{const unit=o.cost/o.qty;addToStorage(o.type,o.qty,unit);});orders=[];saveOrders();refreshDeliveryList();};} 

const STORAGE_BASE_COST=1000;const STORAGE_RATE=1.25;const STORAGE_INC=500;
function storageNextCost(){return Math.round(STORAGE_BASE_COST*Math.pow(STORAGE_RATE,storageUpgrades));}
function updateStorageUpgradeCost(){
    const c=storageNextCost();
    const costElement = document.getElementById('storage-upgrade-cost');
    const btnElement = document.getElementById('storage-upgrade-btn');
    
    if(costElement) {
        costElement.textContent=formatNumber(c);
    }
    
    const afford=getBalance()>=c;
    if(btnElement) {
        btnElement.disabled=!afford;
        btnElement.style.opacity=afford?1:0.5;
    }
}
function upgradeStorage(){const cost=storageNextCost();if(getBalance()<cost){alert('Недостаточно денег');return;}setBalance(getBalance()-cost);storageUpgrades++;storageCapacity=STORAGE_BASE_CAP+storageUpgrades*STORAGE_INC;saveStorage();updateStorageUI();updateStorageUpgradeCost();addXP(storageUpgrades);

    // Обновляем статистику если панель открыта
    if(window.refreshStatistics) {
        window.refreshStatistics();
    }
}
// attach btn
const storUpBtn=document.getElementById('storage-upgrade-btn');if(storUpBtn){storUpBtn.onclick=upgradeStorage;updateStorageUpgradeCost();}
// open panel when item clicked
const cityItemStorage=document.getElementById('item-storage');if(cityItemStorage){cityItemStorage.addEventListener('click',()=>{if(localStorage.getItem('storageBuilt')==='1'){storagePanel.style.display='block';updateStorageUI();updateStorageUpgradeCost();}});} 

// === СТАРАЯ СИСТЕМА ПРОДАЖИ ОТКЛЮЧЕНА ===
// watchdog: каждые 2 секунды проверяем, запущена ли продажа
// setInterval(()=>{if(!selling && saleQueue.length>0) scheduleSale();},2000); 

// === ОФФЛАЙН-ПРОДАЖА ХРАНИЛИЩА ОТКЛЮЧЕНА ===
// function simulateOfflineStorageSales(ms){
//    let remaining=ms;
//    while(remaining>0 && saleQueue.length>0){
//        const delay=500+Math.random()*1500;
//        if(remaining<delay) break;
//        remaining-=delay;
//        const order=saleQueue[0];
//        order.qty--; 
//        const defective=Math.random()<0.1;
//        const priceMultiplier=defective?(0.5+Math.random()*0.5):2;
//        const revenue=order.unitCost*priceMultiplier;
//        setBalance(getBalance()+revenue);
//        order.revenue+=revenue;
//        if(defective) order.defective++;
//        if(order.type==='books') storedBooks--; else storedMags--;
//        if(order.qty===0){
//            pushNotification('STORAGE',`${order.type==='books'?'Книги':'Журналы'} партия (${order.originalQty}) продана за ${formatNumber(Math.round(order.revenue))}$, брак: ${order.defective}`,'assets/icons/delivery.svg');
//            saleQueue.shift();
//        }
//    }
//    saveStorage();
//    updateStorageUI();
// }
// function handleOfflineStorageSales(){
//    const saved=localStorage.getItem(LAST_ONLINE_KEY);
//    if(!saved) return;
//    const last=parseInt(saved);
//    if(isNaN(last)) return;
//    const diffMs=Date.now()-last;
//    if(diffMs<500) return;
//    simulateOfflineStorageSales(diffMs);
//    if(saleQueue.length>0) scheduleSale();
// }
// handleOfflineStorageSales(); 

// === CHARACTERS DATA ===
const employees=[
 {name:'Блуми',  level:parseInt(localStorage.getItem('employee_bloomi_level')||'1'), skill:'Бегущая почта',     rarity:1, img:'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRkY5ODAwIi8+Cjx0ZXh0IHg9IjMwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QjwvdGV4dD4KPC9zdmc+'},
 {name:'Реджи', level:parseInt(localStorage.getItem('employee_reggi_level')||'1'), skill:'Калькулятор',       rarity:1, img:'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRkY1NzIyIi8+Cjx0ZXh0IHg9IjMwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UjwvdGV4dD4KPC9zdmc+'},
 {name:'Спайки', level:parseInt(localStorage.getItem('employee_spikes_level')||'1'), skill:'Логистика',        rarity:3, img:'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRkY1NzIyIi8+Cjx0ZXh0IHg9IjMwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UzwvdGV4dD4KPC9zdmc+'},
 {name:'Гринни',  level:parseInt(localStorage.getItem('employee_grinni_level')||'1'), skill:'Лояльность',        rarity:3, img:'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjNENBRjUwIi8+Cjx0ZXh0IHg9IjMwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RzwvdGV4dD4KPC9zdmc+'},
 {name:'Перпи',  level:parseInt(localStorage.getItem('employee_perpi_level')||'1'), skill:'Мастер-фломастер',  rarity:5, img:'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjOUMyN0IwIi8+Cjx0ZXh0IHg9IjMwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UDwvdGV4dD4KPC9zdmc+'},
];

// Цвета для сотрудников
const EMP_COLORS = {
    default: '#4caf50',
    assigned: '#2196f3',
    unassigned: '#9e9e9e'
};

// Назначения сотрудников
let assignments = JSON.parse(localStorage.getItem('emp_map') || '{}');

// Функция для создания фона круга
function circleBG(building, deg, color) {
    return `conic-gradient(${color} 0deg, ${color} ${deg}deg, transparent ${deg}deg)`;
}

// Функция для открытия панели назначения сотрудников
function openAssignOverlay(building) {
    const overlay = document.getElementById('assign-overlay');
    const grid = document.getElementById('assign-grid');
    grid.innerHTML = '';
    
    // Добавляем кнопку закрытия
    const closeButton = document.createElement('button');
    closeButton.style.cssText = 'position:absolute;top:8px;right:8px;background:none;border:none;color:#fff;font-size:24px;cursor:pointer;z-index:10;';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        overlay.style.display = 'none';
    };
    grid.appendChild(closeButton);
    
    // Проверяем, есть ли уже назначенный сотрудник
    const currentEmployee = assignments[building];
    
    // Добавляем кнопку "Снять работника" если есть назначенный сотрудник
    if (currentEmployee) {
        const removeButton = document.createElement('button');
        removeButton.style.cssText = 'grid-column:1/-1;background:#f44336;border:none;border-radius:8px;color:#fff;padding:10px;font-size:14px;font-weight:bold;cursor:pointer;margin-bottom:8px;';
        removeButton.textContent = 'Снять работника';
        removeButton.onclick = () => {
            delete assignments[building];
            localStorage.setItem('emp_map', JSON.stringify(assignments));
            overlay.style.display = 'none';
            if (window.updateInfoPanel) {
                window.updateInfoPanel(building);
            }
        };
        grid.appendChild(removeButton);
    }
    
    // Создаем сетку 2x2 для сотрудников
    employees.forEach(emp => {
        const isAssigned = assignments[building] === emp.name;
        const div = document.createElement('div');
        div.style.cssText = 'background:#2b2b2b;border-radius:8px;padding:12px;display:flex;flex-direction:column;align-items:center;gap:8px;position:relative;';
        
        // Создаем иконку с первой буквой имени
        const iconDiv = document.createElement('div');
        iconDiv.style.cssText = 'width:50px;height:50px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:#fff;';
        
        // Цвета для разных сотрудников
        const colors = {
            'Блуми': '#ff9800', // оранжевый
            'Перпи': '#9c27b0', // фиолетовый
            'Реджи': '#f44336', // красный
            'Гринни': '#4caf50',  // зеленый
            'Спайки': '#2196f3'  // синий
        };
        
        iconDiv.style.background = colors[emp.name] || '#666';
        iconDiv.textContent = emp.name.charAt(0);
        
        // Добавляем тег "УСТАНОВЛЕН" если сотрудник назначен
        if (isAssigned) {
            const assignedTag = document.createElement('div');
            assignedTag.style.cssText = 'position:absolute;top:4px;right:4px;background:#4caf50;color:#fff;font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;transform:rotate(15deg);';
            assignedTag.textContent = 'УСТАНОВЛЕН';
            div.appendChild(assignedTag);
        }
        
        // Имя сотрудника
        const nameDiv = document.createElement('div');
        nameDiv.style.cssText = 'color:#fff;font-size:14px;font-weight:bold;text-align:center;';
        nameDiv.textContent = emp.name;
        
        // Добавляем элементы в карточку
        div.appendChild(iconDiv);
        div.appendChild(nameDiv);
        
        // Делаем карточку кликабельной только если сотрудник не назначен
        if (!isAssigned) {
            div.style.cursor = 'pointer';
            div.onclick = () => {
                assignments[building] = emp.name;
                localStorage.setItem('emp_map', JSON.stringify(assignments));
                overlay.style.display = 'none';
                if (window.updateInfoPanel) {
                    window.updateInfoPanel(building);
                }
            };
        } else {
            // Если сотрудник назначен, делаем карточку полупрозрачной
            div.style.opacity = '0.6';
        }
        
        grid.appendChild(div);
    });
    
    overlay.style.display = 'flex';
}

// Функция для назначения сотрудника
function assignEmployee(building, empName) {
    if (assignments[building] === empName) {
        // Снимаем сотрудника
        delete assignments[building];
    } else {
        // Назначаем сотрудника
        assignments[building] = empName;
        
        // Проверяем, был ли нанят Реджи
        if (empName === 'Реджи' && window.onReggiHired) {
            window.onReggiHired();
        }
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('emp_map', JSON.stringify(assignments));
    
    // Закрываем панель
    document.getElementById('assign-overlay').style.display = 'none';
    
    // Обновляем панель здания
    if (window.updateInfoPanel) {
        window.updateInfoPanel(building);
    }
}

// Функция для получения сотрудника по зданию
function getEmpByBuilding(building) {
    const empName = assignments[building];
    return employees.find(emp => emp.name === empName);
}

// Функция для сохранения назначений
function saveAssignments() {
    localStorage.setItem('emp_map', JSON.stringify(assignments));
}

// Делаем функции глобально доступными
window.openAssignOverlay = openAssignOverlay;
window.assignEmployee = assignEmployee;
window.getEmpByBuilding = getEmpByBuilding;
window.saveAssignments = saveAssignments;
window.getNextUpgradeCost = getNextUpgradeCost;
window.factoryGetNextUpgradeCost = factoryGetNextUpgradeCost;
window.getIncomePerSecond = getIncomePerSecond;
window.getFactoryIncomePerSecond = getFactoryIncomePerSecond;
window.formatNumber = formatNumber;

// Функции обновления панелей
window.updatePanelIncomeDisplay = function() {
    const building = document.getElementById('building-info-panel').dataset.building;
    if (building && window.updateHourlyIncomeInPanel) {
        window.updateHourlyIncomeInPanel();
    }
};

window.updateCollectButtonAmounts = function() {
    const building = document.getElementById('building-info-panel').dataset.building;
    if (building) {
        let bank = 0;
        if (building === 'library') {
            bank = intermediateBalance;
        } else if (building === 'factory') {
            bank = factoryIntermediate;
        }
        
        const btn = document.querySelector('#btn-collect-hour span:last-child');
        if (btn) {
            btn.textContent = window.formatNumber(bank);
        }
    }
};

window.updatePanelProgressBars = function() {
    const building = document.getElementById('building-info-panel').dataset.building;
    if (building) {
        let bank = 0, perSec = 0;
        if (building === 'library') {
            bank = intermediateBalance;
            perSec = window.getIncomePerSecond ? window.getIncomePerSecond() : 0;
        } else if (building === 'factory') {
            bank = factoryIntermediate;
            perSec = window.getFactoryIncomePerSecond ? window.getFactoryIncomePerSecond() : 0;
        }
        
        const percent = perSec > 0 ? Math.min(100, (bank / (perSec * 3600)) * 100) : 0;
        const progressBar = document.querySelector('.progress-bar .fill');
        if (progressBar) {
            progressBar.style.width = percent + '%';
        }
    }
};

window.updateHourlyIncomeInPanel = function() {
    const building = document.getElementById('building-info-panel').dataset.building;
    if (building) {
        let perSec = 0;
        if (building === 'library') {
            perSec = window.getIncomePerSecond ? window.getIncomePerSecond() : 0;
        } else if (building === 'factory') {
            perSec = window.getFactoryIncomePerSecond ? window.getFactoryIncomePerSecond() : 0;
        }
        
        const hourlyIncome = perSec * 3600;
        const display = document.getElementById('hourly-income-display');
        if (display) {
            display.textContent = `Доход в час: ${window.formatNumber(hourlyIncome)}`;
        }
    }
};

window.updateUpgradeCostInPanel = function() {
    const building = document.getElementById('building-info-panel').dataset.building;
    if (building) {
        let cost = 0;
        if (building === 'library') {
            cost = window.getNextUpgradeCost ? window.getNextUpgradeCost() : 0;
        } else if (building === 'factory') {
            cost = window.factoryGetNextUpgradeCost ? window.factoryGetNextUpgradeCost() : 0;
        }
        
        const costDisplay = document.getElementById('upgrade-cost-display');
        if (costDisplay) {
            costDisplay.textContent = window.formatNumber(cost);
        }
    }
};

window.updateLevelInPanel = function() {
    const building = document.getElementById('building-info-panel').dataset.building;
    if (building) {
        let level = 0;
        if (building === 'library') {
            level = upgradesCount;
        } else if (building === 'factory') {
            level = factoryUpgrades;
        }
        
        const levelDisplay = document.getElementById('info-level');
        if (levelDisplay) {
            levelDisplay.textContent = level;
        }
    }
};

// Функции для прямого сбора денег и улучшения
window.collectLibraryMoney = function() {
    if (intermediateBalance > 0) {
        setBalance(getBalance() + intermediateBalance);
        intermediateBalance = 0;
        window.intermediateBalance = 0; // обновляем глобальную переменную
        incomeBank.textContent = formatNumber(intermediateBalance);
        refreshUpgradeCost();
        return true;
    }
    return false;
};

window.collectFactoryMoney = function() {
    if (factoryIntermediate > 0) {
        setBalance(getBalance() + factoryIntermediate);
        factoryIntermediate = 0;
        // Обновление текста старых кругов удалено - используется profit-indicator
        return true;
    }
    return false;
};

window.upgradeLibraryDirectly = function() {
    const cost = getNextUpgradeCost();
    if (getBalance() >= cost) {
        setBalance(getBalance() - cost);
        upgradesCount++;
        saveProgress();
        return true;
    }
    return false;
};

window.upgradeFactoryDirectly = function() {
    const cost = factoryGetNextUpgradeCost();
    if (getBalance() >= cost) {
        setBalance(getBalance() - cost);
        factoryUpgrades++;
        saveFactory();
        return true;
    }
    return false;
};

window.upgradeStorageDirectly = function() {
    const cost = storageNextCost();
    if (getBalance() >= cost) {
        setBalance(getBalance() - cost);
        storageUpgrades++;
        storageCapacity = STORAGE_BASE_CAP + storageUpgrades * STORAGE_INC;
        saveStorage();
        updateStorageUI();
        updateStorageUpgradeCost();
        addXP(storageUpgrades);
        return true;
    }
    return false;
};

function starsHTML(r){let s='';for(let i=1;i<=5;i++){s+=i<=r?'★':'☆';}return `<span style="color:#ffeb3b;font-size:12px">${s}</span>`;}

function renderCharacters(filter = 'all'){
    const container = document.getElementById('characters-content');
    if (!container) {
        console.error('Characters content container not found');
        return;
    }
    
    // Находим или создаем контейнер для содержимого
    let contentContainer = container.querySelector('.characters-content-container');
    if (!contentContainer) {
        contentContainer = document.createElement('div');
        contentContainer.className = 'characters-content-container';
        contentContainer.style.cssText = 'width:100%;';
        container.appendChild(contentContainer);
    }
    
    contentContainer.innerHTML = '';
    
    if(filter === 'available') {
        // Показываем только доступных персонажей (Блуми, Реджи и Гринни)
        const availableCharacters = [
            {name: 'Блуми', image: 'assets/svg/characters-panel/bloomi.svg'},
            {name: 'Реджи', image: 'assets/svg/characters-panel/redgi.svg'},
            {name: 'Гринни', image: 'assets/svg/characters-panel/grinni.svg'}
        ];
        
        availableCharacters.forEach(char => {
            const item = document.createElement('div');
            item.style.cssText='display:flex;flex-direction:column;align-items:center;margin-bottom:10px;width:100%;';
            
            item.innerHTML = `
                <img src="${char.image}" alt="${char.name}" style="width:100%;height:auto;max-height:400px;object-fit:contain;" onerror="this.style.display='none'">
            `;
            
            contentContainer.appendChild(item);
        });
        return;
    }
    
    // Список персонажей для панели
    const characters = [
        {name: 'Блуми', image: 'assets/svg/characters-panel/bloomi.svg'},
        {name: 'Реджи', image: 'assets/svg/characters-panel/redgi.svg'},
        {name: 'Гринни', image: 'assets/svg/characters-panel/grinni.svg'},
        {name: 'Пурпе', image: 'assets/svg/characters-panel/purpe.svg'},
        {name: 'Пинки', image: 'assets/svg/characters-panel/pinky.svg'},
        {name: 'Секрет', image: 'assets/svg/characters-panel/seecret.svg'}
    ];
    
    characters.forEach(char => {
        const item = document.createElement('div');
        item.style.cssText='display:flex;flex-direction:column;align-items:center;margin-bottom:10px;width:100%;';
        
        item.innerHTML = `
            <img src="${char.image}" alt="${char.name}" style="width:100%;height:auto;max-height:400px;object-fit:contain;" onerror="this.style.display='none'">
        `;
        
        contentContainer.appendChild(item);
    });
}

// Tab switching for characters
function switchCharacterTab(filter) {
    // Убираем активный класс со всех кнопок
    document.querySelectorAll('.char-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'rgba(255,255,255,0.1)';
        btn.style.color = 'rgba(255,255,255,0.7)';
        btn.style.boxShadow = 'none';
        btn.style.border = '1px solid rgba(255,255,255,0.2)';
    });
    
    // Активируем нужную кнопку
    if (filter === 'available') {
        const availableBtn = document.getElementById('char-tab-available');
        if (availableBtn) {
            availableBtn.classList.add('active');
            availableBtn.style.background = 'linear-gradient(135deg, #2196f3, #1976d2)';
            availableBtn.style.color = 'white';
            availableBtn.style.boxShadow = '0 2px 8px rgba(33,150,243,0.3)';
            availableBtn.style.border = 'none';
        }
    } else if (filter === 'all') {
        const allBtn = document.getElementById('char-tab-all');
        if (allBtn) {
            allBtn.classList.add('active');
            allBtn.style.background = 'linear-gradient(135deg, #2196f3, #1976d2)';
            allBtn.style.color = 'white';
            allBtn.style.boxShadow = '0 2px 8px rgba(33,150,243,0.3)';
            allBtn.style.border = 'none';
        }
    }
    
    // Показываем персонажей мгновенно
    renderCharacters(filter);
}

// Делаем функцию глобально доступной
window.switchCharacterTab = switchCharacterTab;

// Делаем переменные глобально доступными
window.upgradesCount = upgradesCount;
window.factoryUpgrades = factoryUpgrades;
window.intermediateBalance = intermediateBalance;
window.factoryIntermediate = factoryIntermediate;

// Удаляем старый обработчик кнопки заданий (дублирует новый)
safeAddEventListener('tasks-back', 'click', () => {
    hidePanelWithAnimation('tasks-panel', () => {
    setActiveNavButton(0); // сбрасываем активное состояние
    });
});

// Tab switching
safeAddEventListener('tab-social', 'click', () => {
    document.querySelectorAll('.task-tab').forEach(tab=>{
        tab.style.background='none';
        tab.classList.remove('active');
    });
    const tabSocial = document.getElementById('tab-social');
    if(tabSocial) {
        tabSocial.style.background='#2d2d2d';
        tabSocial.classList.add('active');
    }
    renderTasks('social');
});

safeAddEventListener('tab-booke', 'click', () => {
    document.querySelectorAll('.task-tab').forEach(tab=>{
        tab.style.background='none';
        tab.classList.remove('active');
    });
    const tabBooke = document.getElementById('tab-booke');
    if(tabBooke) {
        tabBooke.style.background='#2d2d2d';
        tabBooke.classList.add('active');
    }
    renderTasks('booke');
});

function renderTasks(category='social'){
    const container = document.getElementById('tasks-list');
    container.innerHTML = '';
    
    const tasks = category === 'social' ? socialTasks : bookeTasks;
    
    tasks.forEach(task => {
        const taskDiv = document.createElement('div');
        taskDiv.style.cssText = 'background:#5a5a5a;border-radius:16px;padding:16px;margin-bottom:8px;color:#fff;';
        
        taskDiv.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <h4 style="margin:0;font-size:16px;font-weight:700;color:#fff;">${task.title}</h4>
                <span style="background:#2d2d2d;color:#fff;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600;">${task.reward}</span>
            </div>
            <p style="margin:0 0 12px;font-size:14px;color:#ccc;line-height:1.4;">${task.description}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12px;color:#ccc;">Прогресс: ${task.progress}/${task.target}</span>
                <button style="background:#2d2d2d;border:none;color:#fff;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;${task.progress >= task.target ? '' : 'opacity:0.5;cursor:not-allowed;'}">${task.progress >= task.target ? 'Получить' : 'В процессе'}</button>
            </div>
        `;
        
        container.appendChild(taskDiv);
    });
}

// // Create task button handler
// document.getElementById('create-task-btn').addEventListener('click',()=>{
//     alert('Функция создания заданий пока не реализована');
// }

// === NAVIGATION ACTIVE STATE MANAGEMENT ===
function setActiveNavButton(buttonIndex) {
    // Убираем активное состояние со всех кнопок
    document.querySelectorAll('#bottom-nav button').forEach((btn, index) => {
        btn.classList.remove('active');
        btn.style.color = '#666'; // серый цвет для неактивных
    });
    
    // Устанавливаем активное состояние для выбранной кнопки
    const activeButton = document.querySelector(`#bottom-nav button:nth-child(${buttonIndex})`);
    if (activeButton) {
        activeButton.classList.add('active');
        activeButton.style.color = '#fff'; // белый цвет для активной
    }
}

// === SIDE PANEL ACTIVE STATE MANAGEMENT ===
function setActiveSideButton(buttonId) {
    // Убираем активное состояние со всех кнопок боковой панели
    document.querySelectorAll('.side-btn').forEach((btn) => {
        btn.classList.remove('panel-active');
    });
    
    // Устанавливаем активное состояние для выбранной кнопки
    const activeButton = document.getElementById(buttonId);
    if (activeButton) {
        activeButton.classList.add('panel-active');
    }
}

function clearActiveSideButton() {
    // Убираем активное состояние со всех кнопок боковой панели
    document.querySelectorAll('.side-btn').forEach((btn) => {
        btn.classList.remove('panel-active');
    });
}

// === BOTTOM NAVIGATION HANDLERS ===
// Магазин (1-я кнопка)
document.querySelector('#bottom-nav button:nth-child(1)').addEventListener('click',()=>{
    if (isAnyPanelOpen()) return; // Блокируем если открыта любая панель
    setActiveNavButton(1);
    showPanelWithAnimation('shop-panel');
});

// Персонажи (2-я кнопка)
document.querySelector('#bottom-nav button:nth-child(2)').addEventListener('click',()=>{
    if (isAnyPanelOpen()) return; // Блокируем если открыта любая панель
    setActiveNavButton(2);
    // Обновляем содержимое сразу при открытии
    renderCharacters('all');
    showPanelWithAnimation('characters-panel');
});

// Город (3-я кнопка)
document.querySelector('#bottom-nav button:nth-child(3)').addEventListener('click',()=>{
    if (isAnyPanelOpen()) return; // Блокируем если открыта любая панель
    setActiveNavButton(3);
    updateCityButtons();
    renderCity();
    showPanelWithAnimation('city-panel');
});

// Задания (4-я кнопка) - обработчик перенесен в tasks-swap.js
// document.querySelector('#bottom-nav button:nth-child(4)').addEventListener('click',()=>{
//     if (isAnyPanelOpen()) return; // Блокируем если открыта любая панель
//     setActiveNavButton(4);
//     renderTasks();
//     showPanelWithAnimation('tasks-panel');
// });

// Профиль (5-я кнопка)
document.querySelector('#bottom-nav button:nth-child(5)').addEventListener('click',()=>{
    if (isAnyPanelOpen()) return; // Блокируем если открыта любая панель
    setActiveNavButton(5);
    showPanelWithAnimation('profile-panel');
});

// Удаляем дублирующий обработчик для кнопки профиля

// === PANEL CLOSE HANDLERS ===
// Закрытие панелей сбрасывает активное состояние
safeAddEventListener('shop-close', 'click', () => {
    hidePanelWithAnimation('shop-panel', () => {
    setActiveNavButton(0); // сбрасываем активное состояние
    });
});

safeAddEventListener('chars-close', 'click', () => {
    hidePanelWithAnimation('characters-panel', () => {
    setActiveNavButton(0); // сбрасываем активное состояние
    });
});

safeAddEventListener('city-close', 'click', () => {
    hidePanelWithAnimation('city-panel', () => {
    setActiveNavButton(0); // сбрасываем активное состояние
    });
});

safeAddEventListener('tasks-back', 'click', () => {
    hidePanelWithAnimation('tasks-panel', () => {
    setActiveNavButton(0); // сбрасываем активное состояние
    });
});

safeAddEventListener('profile-close', 'click', () => {
    hidePanelWithAnimation('profile-panel', () => {
    setActiveNavButton(0); // сбрасываем активное состояние
    });
});

// === INVENTORY SYSTEM REMOVED ===
// Все функции инвентаря были удалены, так как панель инвентаря больше не используется

// === NAVIGATION ACTIVE STATE MANAGEMENT ===

// === SHOP PANEL ===
// Обработчики для новой панели магазина
function initializeShop() {
    // Предотвращаем повторную инициализацию
    if (shopInitialized) {
        return;
    }
    
    try {
        // Инициализация карточек товаров в магазине
        initializeShopCards();
        
        // Инициализация сундуков
        initializeChests();
        
        // Инициализация сейфов
        initializeSafes();
        
        // Инициализация персонажей
        initializeCharacters();
        
    } catch (error) {
        console.error('Error in shop initialization:', error);
        // Не позволяем ошибке влиять на работу игры
    }
}

// Инициализация сундуков
function initializeChests() {
    // Устанавливаем начальный индекс
    window.currentChestIndex = 0;
    
    // Обновляем отображение сундука
    updateChestDisplay();
    
    // Добавляем обработчики событий для стрелок и кнопки покупки
    const leftArrow = document.getElementById('chest-left-arrow');
    const rightArrow = document.getElementById('chest-right-arrow');
    const buyBtn = document.getElementById('buy-chest-btn');
    
    if (leftArrow) {
        leftArrow.addEventListener('click', () => switchChest('prev'));
    }
    
    if (rightArrow) {
        rightArrow.addEventListener('click', () => switchChest('next'));
    }
    
    if (buyBtn) {
        buyBtn.addEventListener('click', buyChest);
    }
    

}

// Покупка сундука
function buyChest() {
    const items = getShopItems('coins');
    const currentIndex = window.currentChestIndex || 0;
    const item = items[currentIndex];
    
    if (!item) return;
    
    // Проверяем баланс в зависимости от типа валюты
    if (item.isRBC) {
        // Для RBC (Дипломат монет)
        if (getCredits() < item.cost) {
            alert('Недостаточно RBC!');
            return;
        }
        setCredits(getCredits() - item.cost);
        setCredits(getCredits() + item.coins);
        
        // Показываем панель наград
        showRewardPanel('chests', {
            credits: item.coins
        });
    } else {
        // Для обычных денег
        if (getBalance() < item.cost) {
            alert('Недостаточно денег!');
            return;
        }
        setBalance(getBalance() - item.cost);
        setCredits(getCredits() + item.coins);
        
        // Показываем панель наград
        showRewardPanel('chests', {
            credits: item.coins
        });
    }
    
    // Обновляем отображение баланса в магазине
    updateShopBalance();
    

}

// Обновление баланса в магазине
function updateShopBalance() {
    const shopCoins = document.getElementById('shop-coins');
    if (shopCoins) {
        shopCoins.textContent = getCredits();
    }
}

// Инициализация сейфов
function initializeSafes() {
    // Устанавливаем начальный индекс
    window.currentSafeIndex = 0;
    
    // Обновляем отображение сейфа
    updateSafeDisplay();
    
    // Добавляем обработчики событий для стрелок и кнопки покупки
    const leftArrow = document.getElementById('safe-left-arrow');
    const rightArrow = document.getElementById('safe-right-arrow');
    const buyBtn = document.getElementById('buy-safe-btn');
    
    if (leftArrow) {
        leftArrow.addEventListener('click', () => switchSafe('prev'));
    }
    
    if (rightArrow) {
        rightArrow.addEventListener('click', () => switchSafe('next'));
    }
    
    if (buyBtn) {
        buyBtn.addEventListener('click', buySafe);
    }
    

}

// Переключение между сейфами
function switchSafe(direction) {
    const items = getShopItems('safes');
    let newIndex = window.currentSafeIndex;
    
    if (direction === 'next') {
        newIndex = (newIndex + 1) % items.length;
    } else {
        newIndex = (newIndex - 1 + items.length) % items.length;
    }
    
    window.currentSafeIndex = newIndex;
    
    // Обновляем отображение без задержки
    updateSafeDisplay();
    

}

// Обновление отображения сейфа
function updateSafeDisplay() {
    const items = getShopItems('safes');
    const currentIndex = window.currentSafeIndex || 0;
    const item = items[currentIndex];
    
    if (!item) return;
    
    // Обновляем только картинку с плавным переходом
    const safeImage = document.getElementById('safe-image');
    if (safeImage) {
        // Проверяем, есть ли изображение в кеше
        const cachedImage = window.shopImagesCache && window.shopImagesCache[item.image];
        
        // Если изображение в кеше, используем его сразу (уже загружено)
        if (cachedImage && cachedImage.complete) {
            safeImage.src = item.image;
            safeImage.alt = item.name;
            safeImage.style.opacity = '1';
            safeImage.style.transform = 'scale(1)';
        } else {
            // Если нет в кеше, используем небольшую задержку для анимации
            safeImage.style.opacity = '0';
            safeImage.style.transform = 'scale(0.9)';
            
            // Используем requestAnimationFrame для мгновенного обновления
            requestAnimationFrame(() => {
                safeImage.src = item.image;
                safeImage.alt = item.name;
                safeImage.style.opacity = '1';
                safeImage.style.transform = 'scale(1)';
            });
        }
    }
}

// Покупка сейфа
function buySafe() {
    const items = getShopItems('safes');
    const currentIndex = window.currentSafeIndex || 0;
    const item = items[currentIndex];
    
    if (!item) return;
    
    // Проверяем баланс в зависимости от типа валюты
    if (item.isRBC) {
        // Для RBC (Гигантский сейф)
        if (getCredits() < item.cost) {
            alert('Недостаточно RBC!');
            return;
        }
        setCredits(getCredits() - item.cost);
        
        // Генерируем награды
        const moneyReward = randRange([15000, 30000]);
        const creditReward = randRange([75, 150]);
        
        // Добавляем награды
        setBalance(getBalance() + moneyReward);
        setCredits(getCredits() + creditReward);
        addXP(10);
        
        // Показываем панель наград
        showRewardPanel('safes', {
            money: moneyReward,
            credits: creditReward,
            xp: 10
        });
    } else {
        // Для обычных денег
        if (getBalance() < item.cost) {
            alert('Недостаточно денег!');
            return;
        }
        setBalance(getBalance() - item.cost);
        
        // Генерируем награды
        const moneyReward = randRange([15000, 30000]);
        const creditReward = randRange([75, 150]);
        
        // Добавляем награды
        setBalance(getBalance() + moneyReward);
        setCredits(getCredits() + creditReward);
        addXP(10);
        
        // Показываем панель наград
        showRewardPanel('safes', {
            money: moneyReward,
            credits: creditReward,
            xp: 10
        });
    }
    

}

// Инициализация персонажей
function initializeCharacters() {
    // Устанавливаем начальный индекс
    window.currentCharacterIndex = 0;
    
    // Обновляем отображение персонажа
    updateCharacterDisplay();
    
    // Добавляем обработчики событий для стрелок и кнопки покупки
    const leftArrow = document.getElementById('character-left-arrow');
    const rightArrow = document.getElementById('character-right-arrow');
    const buyBtn = document.getElementById('buy-character-btn');
    
    if (leftArrow) {
        leftArrow.addEventListener('click', () => switchCharacter('prev'));
    }
    
    if (rightArrow) {
        rightArrow.addEventListener('click', () => switchCharacter('next'));
    }
    
    if (buyBtn) {
        buyBtn.addEventListener('click', buyCharacter);
    }
    

}

// Переключение между персонажами
function switchCharacter(direction) {
    const items = getShopItems('sets');
    let newIndex = window.currentCharacterIndex;
    
    if (direction === 'next') {
        newIndex = (newIndex + 1) % items.length;
    } else {
        newIndex = (newIndex - 1 + items.length) % items.length;
    }
    
    window.currentCharacterIndex = newIndex;
    
    // Обновляем отображение без задержки
    updateCharacterDisplay();
    

}

// Обновление отображения персонажа
function updateCharacterDisplay() {
    const items = getShopItems('sets');
    const currentIndex = window.currentCharacterIndex || 0;
    const item = items[currentIndex];
    
    if (!item) return;
    
    // Обновляем только картинку с плавным переходом
    const characterImage = document.getElementById('character-image');
    if (characterImage) {
        // Проверяем, есть ли изображение в кеше
        const cachedImage = window.shopImagesCache && window.shopImagesCache[item.image];
        
        // Если изображение в кеше, используем его сразу (уже загружено)
        if (cachedImage && cachedImage.complete) {
            characterImage.src = item.image;
            characterImage.alt = item.name;
            characterImage.style.opacity = '1';
            characterImage.style.transform = 'scale(1)';
        } else {
            // Если нет в кеше, используем небольшую задержку для анимации
            characterImage.style.opacity = '0';
            characterImage.style.transform = 'scale(0.9)';
            
            // Используем requestAnimationFrame для мгновенного обновления
            requestAnimationFrame(() => {
                characterImage.src = item.image;
                characterImage.alt = item.name;
                characterImage.style.opacity = '1';
                characterImage.style.transform = 'scale(1)';
            });
        }
    }
}

// Покупка персонажа
function buyCharacter() {
    const items = getShopItems('sets');
    const currentIndex = window.currentCharacterIndex || 0;
    const item = items[currentIndex];
    
    if (!item) return;
    
    // Проверяем баланс денег
    if (getBalance() < item.cost) {
        alert('Недостаточно денег!');
        return;
    }
    
    // Списываем деньги
    setBalance(getBalance() - item.cost);
    
    // Даем награды в зависимости от редкости
    const baseReward = item.cost * (1 + item.rarity * 0.5);
    const rewards = Math.floor(baseReward + Math.random() * baseReward * 0.5);
    setBalance(getBalance() + rewards);
    
    alert(`Набор ${item.character} куплен! +${formatNumber(rewards)}$`);
    

}

// Переключение между сундуками
function switchChest(direction) {
    const items = getShopItems('coins');
    let newIndex = window.currentChestIndex;
    
    if (direction === 'next') {
        newIndex = (newIndex + 1) % items.length;
    } else {
        newIndex = (newIndex - 1 + items.length) % items.length;
    }
    
    window.currentChestIndex = newIndex;
    
    // Обновляем отображение без задержки
    updateChestDisplay();
    

}

// Обновление отображения сундука
function updateChestDisplay() {
    const items = getShopItems('coins');
    const currentIndex = window.currentChestIndex || 0;
    const item = items[currentIndex];
    
    if (!item) return;
    
    // Обновляем только картинку с плавным переходом
    const chestImage = document.getElementById('chest-image');
    if (chestImage) {
        // Проверяем, есть ли изображение в кеше
        const cachedImage = window.shopImagesCache && window.shopImagesCache[item.image];
        
        // Если изображение в кеше, используем его сразу (уже загружено)
        if (cachedImage && cachedImage.complete) {
            chestImage.src = item.image;
            chestImage.alt = item.name;
            chestImage.style.opacity = '1';
            chestImage.style.transform = 'scale(1)';
        } else {
            // Если нет в кеше, используем небольшую задержку для анимации
            chestImage.style.opacity = '0';
            chestImage.style.transform = 'scale(0.9)';
            
            // Используем requestAnimationFrame для мгновенного обновления
            requestAnimationFrame(() => {
                chestImage.src = item.image;
                chestImage.alt = item.name;
                chestImage.style.opacity = '1';
                chestImage.style.transform = 'scale(1)';
            });
        }
    }
}

// Функция покупки убрана - используется только переключение картинок

// Обработчики оставлены для совместимости, но не используются
// так как все элементы уже есть в SVG панели
function shopBuyHandler(event) {

}

function shopNavHandler(event) {

}

// Инициализация карточек товаров в магазине
function initializeShopCards() {
    // Функция оставлена для совместимости, но не создает карточки
    // так как все элементы уже есть в SVG панели
    // Изображения уже предзагружены при загрузке игры

}

// Функция навигации оставлена для совместимости
function navigateShopItem(section, currentIndex, direction) {

}

// Получение списка товаров для секции
function getShopItems(section) {
    switch(section) {
        case 'safes':
            return [
                { name: 'Простой сейф', cost: 30000, rarity: 1, type: 'simple', image: 'assets/svg/safes/safe-common.svg' },
                { name: 'Огромный сейф', cost: 300000, rarity: 2, type: 'huge', image: 'assets/svg/safes/safe-gold.svg' },
                { name: 'Гигантский сейф', cost: 300, rarity: 3, type: 'giant', image: 'assets/svg/safes/safe-mystic.svg', isRBC: true }
            ];
        case 'coins':
            return [
                { name: 'Чемоданчик монет', cost: 30000, rarity: 1, coins: 50, image: 'assets/svg/chests/chest-1.svg' },
                { name: 'Кейс монет', cost: 300000, rarity: 3, coins: 100, image: 'assets/svg/chests/chest-2.svg' },
                { name: 'Дипломат монет', cost: 300, rarity: 4, coins: 200, image: 'assets/svg/chests/chest-3.svg', isRBC: true }
            ];
        case 'sets':
            return [
                { name: 'Набор Гринни', cost: 500, rarity: 1, character: 'Гринни', image: 'assets/svg/characters/character-1.svg' },
                { name: 'Набор Рэджи', cost: 1000, rarity: 2, character: 'Рэджи', image: 'assets/svg/characters/character-2.svg' },
                { name: 'Набор Пёрпи', cost: 2000, rarity: 3, character: 'Пёрпи', image: 'assets/svg/characters/character-3.svg' }
            ];
        default:
            return [];
    }
}

// Обновление карточки товара оставлено для совместимости
function updateShopCard(section, index) {

}

// Получение текста редкости
function getRarityText(rarity) {
    switch(rarity) {
        case 1: return 'Обычные';
        case 2: return 'Редкие';
        case 3: return 'Уникальные';
        case 4: return 'Эпические';
        case 5: return 'Легендарные';
        default: return 'Обычные';
    }
}

function handleShopPurchase(itemType) {
    const [section, type] = itemType.split('-');
    const card = document.querySelector(`[data-section="${section}"]`);
    const index = parseInt(card?.getAttribute('data-index') || '0');
    const items = getShopItems(section);
    const item = items[index];
    
    if (!item) return;
    
    switch(section) {
        case 'safes':
            // Проверяем баланс RBC для платных сейфов
            if (item.cost > 0 && getCredits() < item.cost) {
                alert('Недостаточно RBC');
                return;
            }
            openCrate(item.type);
            break;
        case 'coins':
            if(getBalance() < item.cost) {
                alert('Недостаточно денег');
                return;
            }
            setBalance(getBalance() - item.cost);
            setCredits(getCredits() + item.coins);
            
            // Начисляем XP за покупку монет (зависит от редкости)
            const coinXP = item.rarity * 2; // 2 XP за каждую звезду редкости
            addXP(coinXP);
            
            // Показываем красивое уведомление о покупке монет
            showPurchaseNotification('Монеты получены!', {
                credits: item.coins,
                xp: coinXP
            }, 'coins');
            break;
        case 'sets':
            if(getBalance() < item.cost) {
                alert('Недостаточно денег');
                return;
            }
            setBalance(getBalance() - item.cost);
            // Даем награды в зависимости от редкости
            const baseReward = item.cost * (1 + item.rarity * 0.5);
            const rewards = Math.floor(baseReward + Math.random() * baseReward * 0.5);
            setBalance(getBalance() + rewards);
            
            // Начисляем XP за покупку набора (зависит от редкости)
            const setXP = item.rarity * 5; // 5 XP за каждую звезду редкости
            addXP(setXP);
            
            // Показываем красивое уведомление о покупке набора
            showPurchaseNotification(`${item.character} куплен!`, {
                money: rewards,
                xp: setXP
            }, 'sets');
            
            // Проверяем, был ли куплен диван (если это набор с диваном)
            if (item.character && item.character.toLowerCase().includes('диван') && window.onSofaBought) {
                window.onSofaBought();
            }
            break;
        default:

    }
}

// Функция для обновления уровней сотрудников
function updateEmployeeLevels() {
    // Обновляем массив employees с актуальными уровнями
    employees.forEach(emp => {
        const employeeKey = emp.name.toLowerCase().replace('ё', 'е');
        const level = parseInt(localStorage.getItem(`employee_${employeeKey}_level`) || '1');
        emp.level = level;
    });
    
    // Обновляем отображение в панели статистики
    if (window.employeeLevels && window.employeeLevels.updateAll) {
        window.employeeLevels.updateAll();
    }
}

// Функция для увеличения уровня сотрудника
function increaseEmployeeLevel(employeeName, amount = 1) {
    const employeeKey = employeeName.toLowerCase().replace('ё', 'е');
    const currentLevel = parseInt(localStorage.getItem(`employee_${employeeKey}_level`) || '1');
    const newLevel = currentLevel + amount;
    
    localStorage.setItem(`employee_${employeeKey}_level`, newLevel.toString());
    
    // Обновляем массив employees
    const employee = employees.find(emp => emp.name.toLowerCase().replace('ё', 'е') === employeeKey);
    if (employee) {
        employee.level = newLevel;
    }
    
    // Обновляем отображение
    updateEmployeeLevels();
    
    return newLevel;
}

// Экспортируем функции для использования в других файлах
window.updateEmployeeLevels = updateEmployeeLevels;
window.increaseEmployeeLevel = increaseEmployeeLevel;

// === USER ID SYSTEM ===

// Функция для генерации уникального ID пользователя
function generateUniqueUserId() {
    // Проверяем, есть ли уже сохраненный ID в localStorage
    let userId = localStorage.getItem('uniqueUserId');
    
    if (!userId) {
        // Генерируем новый уникальный ID
        // Используем timestamp + случайное число для уникальности
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        userId = timestamp + random;
        
        // Сохраняем в localStorage
        localStorage.setItem('uniqueUserId', userId);
    }
    
    return parseInt(userId);
}

let currentUserId = generateUniqueUserId(); // Уникальный ID пользователя





// === award XP on upgrades ===



// Функция копирования ID пользователя
function copyUserId() {
    (async () => {
        try {
            // Используем currentUserId напрямую
            await navigator.clipboard.writeText(currentUserId.toString());
            
            // Показываем простое всплывающее уведомление
            showToast('ID скопирован в буфер обмена!');
            
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = currentUserId.toString();
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            // Показываем простое всплывающее уведомление
            showToast('ID скопирован в буфер обмена!');
        }
    })();
}

// Флаг для отслеживания инициализации магазина
let shopInitialized = false;

// Делаем функции управления активным состоянием кнопок глобально доступными
window.setActiveSideButton = setActiveSideButton;
window.clearActiveSideButton = clearActiveSideButton;

// Делаем функции Telegram глобально доступными
window.handleAvatarError = handleAvatarError;

// === PANEL ANIMATION FUNCTIONS ===
function showPanelWithAnimation(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    
    // Скрываем индикаторы прибыли при открытии любой панели
    if (window.hideProfitIndicators) {
        window.hideProfitIndicators();
    }
    
    // Принудительно очищаем все индикаторы прибыли
    if (window.clearAllProfitIndicators) {
        window.clearAllProfitIndicators();
    }
    
    // Устанавливаем глобальные переменные для отслеживания состояния панелей
    if (panelId === 'shop-panel') {
        window.isShopPanelOpen = true;
    }
    if (panelId === 'characters-panel') {
        window.isCharactersPanelOpen = true;
    }
    if (panelId === 'city-panel') {
        window.isCityPanelOpen = true;
        // Рендерим карточки зданий при открытии панели
        setTimeout(() => {
            renderCity();
        }, 100);
    }
    if (panelId === 'profile-panel') {
        window.isProfilePanelOpen = true;
        // Обновляем данные профиля при открытии
        setTimeout(() => {
            syncLevelAndXP();
            // Обновляем данные из Telegram если доступны
            if (isTelegramApp) {
                updateProfileWithTelegram();
            }
        }, 100);
    }
    if (panelId === 'friends-panel') {
        window.isFriendsPanelOpen = true;
    }
    if (panelId === 'phone-panel') {
        window.isPhonePanelOpen = true;
    }
    
    // Показываем панель
    panel.style.display = 'flex';
    
    // Добавляем классы для анимации
    panel.classList.add('slide-in');
    
    // Убираем классы анимации после завершения
    setTimeout(() => {
        panel.classList.remove('slide-in');
    }, 400);
}

function hidePanelWithAnimation(panelId, callback = null) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    
    // Добавляем класс для анимации закрытия
    panel.classList.add('slide-out');
    
    // Скрываем панель после завершения анимации
    setTimeout(() => {
        panel.style.display = 'none';
        panel.classList.remove('slide-out');
        
        // Сбрасываем глобальные переменные при закрытии панелей
        if (panelId === 'shop-panel') {
            window.isShopPanelOpen = false;
        }
        if (panelId === 'characters-panel') {
            window.isCharactersPanelOpen = false;
        }
        if (panelId === 'city-panel') {
            window.isCityPanelOpen = false;
        }
        if (panelId === 'profile-panel') {
            window.isProfilePanelOpen = false;
        }
        if (panelId === 'friends-panel') {
            window.isFriendsPanelOpen = false;
        }
        if (panelId === 'phone-panel') {
            window.isPhonePanelOpen = false;
        }
        
        // Показываем индикаторы прибыли после закрытия панели
        if (window.updateProfitIndicators) {
            setTimeout(() => {
                window.updateProfitIndicators();
            }, 100);
        }
        
        // Дополнительная проверка через 200ms для надежности
        setTimeout(() => {
            if (window.updateProfitIndicators) {
                window.updateProfitIndicators();
            }
        }, 200);
        
        if (callback) callback();
    }, 300);
}

// Делаем функции анимации панелей глобально доступными
window.showPanelWithAnimation = showPanelWithAnimation;
window.hidePanelWithAnimation = hidePanelWithAnimation;

// === ЯЧЕЙКА RBC В ЛЕВОЙ ПАНЕЛИ ===
// Обработчик для ячейки RBC - открывает магазин
safeAddEventListener('rbc-cell', 'click', () => {
    if (isAnyPanelOpen()) return; // Блокируем если открыта любая панель
    setActiveNavButton(1); // Активируем кнопку магазина в нижней навигации
    showPanelWithAnimation('shop-panel');
});

// Удаляем дублирующий обработчик для кнопки инвентаря

// Удаляем обработчики делегирования событий, которые могут срабатывать случайно

// Делаем функции глобально доступными
    // Функции инвентаря удалены

// Функция для открытия панели профиля
function openProfilePanel() {

    if (isAnyPanelOpen()) return;
    setActiveNavButton(5);
    showPanelWithAnimation('profile-panel');
    // Обновляем данные профиля
    setTimeout(() => {
        syncLevelAndXP();
        // Обновляем данные из Telegram если доступны
        if (isTelegramApp) {
            updateProfileWithTelegram();
        }
    }, 200);
}

// Делаем функцию глобально доступной
window.openProfilePanel = openProfilePanel;

// Универсальная функция для показа уведомлений о наградах
function showRewardNotification(title, rewards) {
    const overlay = document.getElementById('crate-overlay');
    
    // Создаем HTML для наград
    let rewardsHTML = '';
    if (rewards.money) {
        rewardsHTML += `<div style="display:flex;align-items:center;gap:8px;margin:8px 0;padding:8px 12px;background:rgba(255,255,255,0.1);border-radius:8px;border:1px solid rgba(255,255,255,0.2);">
            <div style="width:24px;height:24px;background:#ccc;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#666;">PNG</div>
            <span style="font-size:18px;font-weight:600;color:#fff;">+${formatNumber(rewards.money)}$</span>
        </div>`;
    }
    if (rewards.credits) {
        rewardsHTML += `<div style="display:flex;align-items:center;gap:8px;margin:8px 0;padding:8px 12px;background:rgba(255,255,255,0.1);border-radius:8px;border:1px solid rgba(255,255,255,0.2);">
            <div style="width:24px;height:24px;background:#ccc;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#666;">PNG</div>
            <span style="font-size:18px;font-weight:600;color:#fff;">+${rewards.credits}</span>
        </div>`;
    }
    if (rewards.xp) {
        rewardsHTML += `<div style="display:flex;align-items:center;gap:8px;margin:8px 0;padding:8px 12px;background:rgba(255,255,255,0.1);border-radius:8px;border:1px solid rgba(255,255,255,0.2);">
            <div style="width:24px;height:24px;background:#ccc;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#666;">PNG</div>
            <span style="font-size:18px;font-weight:600;color:#fff;">+${rewards.xp} XP</span>
        </div>`;
    }
    
    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%);
            padding: 24px 28px;
            border-radius: 16px;
            text-align: center;
            animation: purchasePop 0.5s ease-out;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.1);
            max-width: 320px;
            width: 90%;
            position: relative;
            overflow: hidden;
        ">
            <!-- Декоративные элементы -->
            <div style="position:absolute;top:-20px;right:-20px;width:60px;height:60px;background:rgba(255,255,255,0.1);border-radius:50%;"></div>
            <div style="position:absolute;bottom:-30px;left:-30px;width:80px;height:80px;background:rgba(255,255,255,0.05);border-radius:50%;"></div>
            
            <!-- Иконка -->
            <div style="width:64px;height:64px;background:#ccc;border-radius:12px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#666;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
                PNG-image
            </div>
            
            <!-- Заголовок -->
            <h3 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,0.3);">
                ${title}
            </h3>
            
            <!-- Награды -->
            <div style="margin-bottom:24px;">
                ${rewardsHTML}
            </div>
            
            <!-- Кнопка -->
            <button id="reward-ok" style="
                background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
                border: none;
                border-radius: 12px;
                color: #fff;
                font-size: 16px;
                font-weight: 600;
                padding: 12px 32px;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px rgba(76,175,80,0.3);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            " onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(76,175,80,0.4)'" 
               onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 12px rgba(76,175,80,0.3)'">
                Отлично!
            </button>
        </div>
    `;
    
    overlay.style.display = 'flex';
    overlay.querySelector('#reward-ok').onclick = () => {
        overlay.style.display = 'none';
    };
}

// Делаем функцию глобально доступной
window.showRewardNotification = showRewardNotification;
window.showPurchaseNotification = showPurchaseNotification;

// Функция показа панели наград для сейфов и сундуков
function showRewardPanel(itemType, rewards) {
    const panel = document.getElementById('reward-panel');
    const itemImage = document.getElementById('reward-item-image');
    const title = document.getElementById('reward-title');
    const rewardItems = document.getElementById('reward-items');
    
    // Устанавливаем изображение в зависимости от типа
    if (itemType === 'safes') {
        itemImage.src = 'assets/svg/rewards/safe-opened.svg';
        title.textContent = 'Сейф открыт!';
    } else if (itemType === 'chests') {
        itemImage.src = 'assets/svg/rewards/chest-opened.svg';
        title.textContent = 'Сундук открыт!';
    }
    
    // Создаем HTML для наград
    let rewardsHTML = '';
    
    if (rewards.money) {
        rewardsHTML += `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(255,255,255,0.05);border-radius:8px;border:1px solid rgba(255,255,255,0.1);">
                <img src="assets/svg/money-icon.svg" alt="Деньги" style="width:24px;height:24px;">
                <span style="font-size:16px;font-weight:600;color:#fff;">+${formatNumber(rewards.money)}</span>
            </div>
        `;
    }
    
    if (rewards.credits) {
        rewardsHTML += `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(255,255,255,0.05);border-radius:8px;border:1px solid rgba(255,255,255,0.1);">
                <img src="assets/svg/rbc-icon.svg" alt="RBC" style="width:24px;height:24px;">
                <span style="font-size:16px;font-weight:600;color:#fff;">+${rewards.credits}</span>
            </div>
        `;
    }
    
    if (rewards.xp) {
        rewardsHTML += `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(255,255,255,0.05);border-radius:8px;border:1px solid rgba(255,255,255,0.1);">
                <img src="assets/svg/clock-icon.svg" alt="XP" style="width:24px;height:24px;">
                <span style="font-size:16px;font-weight:600;color:#fff;">+${rewards.xp} XP</span>
            </div>
        `;
    }
    
    if (rewards.coins) {
        rewardsHTML += `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(255,255,255,0.05);border-radius:8px;border:1px solid rgba(255,255,255,0.1);">
                <img src="assets/svg/money-icon.svg" alt="Монеты" style="width:24px;height:24px;">
                <span style="font-size:16px;font-weight:600;color:#fff;">+${rewards.coins}</span>
            </div>
        `;
    }
    
    rewardItems.innerHTML = rewardsHTML;
    
    // Показываем панель с анимацией
    panel.style.display = 'flex';
    
    // Запускаем анимацию появления
    setTimeout(() => {
        const panelContent = document.getElementById('reward-panel-content');
        if (panelContent) {
            panelContent.style.transform = 'scale(1)';
            panelContent.style.opacity = '1';
        }
    }, 10);
    
    // Добавляем обработчики событий
    const closeBtn = document.getElementById('reward-close');
    const okBtn = document.getElementById('reward-ok-btn');
    
    const closePanel = () => {
        const panelContent = document.getElementById('reward-panel-content');
        if (panelContent) {
            panelContent.style.transform = 'scale(0.8)';
            panelContent.style.opacity = '0';
        }
        
        setTimeout(() => {
            panel.style.display = 'none';
        }, 400);
    };
    
    if (closeBtn) {
        closeBtn.onclick = closePanel;
    }
    
    if (okBtn) {
        okBtn.onclick = closePanel;
    }
    
    // Закрытие по клику вне панели
    panel.onclick = (e) => {
        if (e.target === panel) {
            closePanel();
        }
    };
}

// Делаем функцию глобально доступной
window.showRewardPanel = showRewardPanel;

// Экспортируем функцию в глобальную область для использования в statistics.js
window.syncLevelAndXP = syncLevelAndXP;

// Функция для инициализации синхронизации
function initializeSync() {
    syncLevelAndXP();
    
    // Добавляем периодическое обновление каждые 2 секунды
    setInterval(() => {
        const statisticsPanel = document.getElementById('statistics-panel');
        if (statisticsPanel && statisticsPanel.style.display === 'flex') {
            syncLevelAndXP();
        }
    }, 2000);
}

// Предварительная загрузка всех изображений товаров
// Кеш для предзагруженных изображений магазина
window.shopImagesCache = {};

function preloadShopImages() {
    return new Promise((resolve) => {
        const allItems = [
            ...getShopItems('safes'),
            ...getShopItems('coins'),
            ...getShopItems('sets')
        ];
        
        if (allItems.length === 0) {
            resolve();
            return;
        }
        
        let loadedCount = 0;
        const totalImages = allItems.filter(item => item.image).length;
        
        if (totalImages === 0) {
            resolve();
            return;
        }
        
        allItems.forEach(item => {
            if (item.image) {
                // Проверяем, не загружено ли уже это изображение
                if (window.shopImagesCache[item.image]) {
                    loadedCount++;
                    if (loadedCount === totalImages) {
                        resolve();
                    }
                    return;
                }
                
                const img = new Image();
                img.onload = () => {
                    // Сохраняем загруженное изображение в кеше
                    window.shopImagesCache[item.image] = img;
                    loadedCount++;
                    if (loadedCount === totalImages) {
                        resolve();
                    }
                };
                img.onerror = () => {
                    // Даже при ошибке считаем загруженным, чтобы не блокировать
                    loadedCount++;
                    if (loadedCount === totalImages) {
                        resolve();
                    }
                };
                img.src = item.image;
            }
        });
    });
}

// Предварительная загрузка всех SVG персонажей и сотрудников
function preloadCharacterImages() {
    const characterImages = [
        // Персонажи для панели персонажей
        'assets/svg/characters-panel/bloomi.svg',
        'assets/svg/characters-panel/redgi.svg',
        'assets/svg/characters-panel/grinni.svg',
        'assets/svg/characters-panel/purpe.svg',
        'assets/svg/characters-panel/pinky.svg',
        'assets/svg/characters-panel/seecret.svg',
        // Сотрудники для зданий
        'assets/svg/employees/blumy-hired.svg',
        'assets/svg/employees/grinni-hired.svg',
        'assets/svg/employees/purpe-hired.svg',
        'assets/svg/employees/redjy-hired.svg',
        'assets/svg/employees/not-hired.svg',
        // SVG зданий для панели города - предзагрузка при запуске игры
        'assets/svg/city-panel/factory.svg',
        'assets/svg/city-panel/library.svg',
        'assets/svg/city-panel/mail.svg',
        'assets/svg/city-panel/print.svg'
    ];
    
    characterImages.forEach(imagePath => {
        const img = new Image();
        img.src = imagePath;
        // Добавляем обработчик для отслеживания загрузки
        img.onload = () => {

        };
        img.onerror = () => {
            console.warn(`⚠️ Failed to load character/employee image: ${imagePath}`);
        };
    });
    

}

// Флаг для отслеживания инициализации игры
let gameInitialized = false;

// Единый обработчик DOMContentLoaded для всех инициализаций
document.addEventListener('DOMContentLoaded', () => {
    // Предотвращаем повторную инициализацию
    if (gameInitialized) {

        return;
    }
    

    
    try {
        // Инициализируем User ID в профиле и настройках
        const profileUserId = document.getElementById('profile-user-id');
        if (profileUserId) {
            profileUserId.textContent = `ID ${currentUserId}`;
        }
        
        const settingsUserId = document.getElementById('settings-userid');
        if (settingsUserId) {
            settingsUserId.textContent = currentUserId;
        }
        
        // Делаем currentUserId глобально доступным
        window.currentUserId = currentUserId;
        
        // Инициализируем системы в правильном порядке
        initializeSync();
        
        // Предварительно загружаем изображения персонажей и сотрудников
        try {
            preloadCharacterImages();
        } catch (error) {
            console.error('Error during character/employee images preloading:', error);
        }
        
        // Предварительно загружаем изображения магазина и ждем их загрузки
        // перед инициализацией магазина
        preloadShopImages().then(() => {
            // Инициализируем магазин после загрузки всех изображений
            if (!shopInitialized) {
                try {
                    initializeShop();
                    shopInitialized = true;
                } catch (error) {
                    console.error('Error during shop initialization:', error);
                }
            }
        }).catch((error) => {
            console.error('Error during shop images preloading:', error);
            // Инициализируем магазин даже при ошибке загрузки
            if (!shopInitialized) {
                try {
                    initializeShop();
                    shopInitialized = true;
                } catch (initError) {
                    console.error('Error during shop initialization:', initError);
                }
            }
        });
        
        // Добавляем дополнительную защиту от повторной инициализации
        Object.defineProperty(window, 'gameInitialized', {
            value: true,
            writable: false,
            configurable: false
        });
        
        gameInitialized = true;

        
        // Адаптируем UI для Telegram после полной инициализации
        if (isTelegramApp) {
            setTimeout(() => {
                adaptUIForTelegram();
            }, 100);
        }
    } catch (error) {
        console.error('Error during game initialization:', error);
        // Не позволяем ошибке инициализации влиять на работу игры
    }
});
