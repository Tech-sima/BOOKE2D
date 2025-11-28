// Обработка кликов по интерактивным зонам зданий в главном меню
(function() {
    'use strict';
    
    // Флаг для отслеживания инициализации главного меню
    let mainMenuInitialized = false;
    
    // Инициализация при загрузке DOM
    document.addEventListener('DOMContentLoaded', function() {
        // Предотвращаем повторную инициализацию
        if (mainMenuInitialized) {
            return;
        }
        
        initMainMenu();
        mainMenuInitialized = true;
    });
    
    function initMainMenu() {
        // Получаем изображение главного меню
        const mainMenuImage = document.getElementById('main-menu-image');
        if (mainMenuImage) {
            // Свайп функциональность отключена - карта зафиксирована
            initSwipeFunctionality(mainMenuImage);
        }
        
        // Получаем все интерактивные зоны
        const buildingZones = document.querySelectorAll('.building-zone');
        
        // Добавляем обработчики событий для каждой зоны (только если их еще нет)
        buildingZones.forEach(zone => {
            // Проверяем, есть ли уже обработчики
            if (!zone.hasAttribute('data-handlers-added')) {
                zone.addEventListener('click', handleBuildingClick);
                zone.addEventListener('touchstart', handleBuildingTouch, { passive: true });
                zone.setAttribute('data-handlers-added', 'true');
            }
        });
        
        // Обработчик для кнопки "Вся карта"
        const btnShowAll = document.getElementById('btn-show-all');
        if (btnShowAll && !btnShowAll.hasAttribute('data-handlers-added')) {
            btnShowAll.addEventListener('click', handleShowAllClick);
            btnShowAll.setAttribute('data-handlers-added', 'true');
        }
        
        // Обработчик для кнопки заданий
        const btnTasks = document.getElementById('btn-tasks');
        if (btnTasks && !btnTasks.hasAttribute('data-handlers-added')) {
            btnTasks.addEventListener('click', handleTasksClick);
            btnTasks.setAttribute('data-handlers-added', 'true');
        }
        
        // Обработчик для закрытия панели новостей
        const newsClose = document.getElementById('news-close');
        if (newsClose && !newsClose.hasAttribute('data-handlers-added')) {
            newsClose.addEventListener('click', () => {
                const currentTime = Date.now();
                if (currentTime - lastClickTime < CLICK_DELAY) {
                    return; // Игнорируем слишком частые клики
                }
                lastClickTime = currentTime;
                
                const newsPanel = document.getElementById('news-panel');
                if (newsPanel) {
                    newsPanel.style.display = 'none';
                }
            });
            newsClose.setAttribute('data-handlers-added', 'true');
        }
        

        
        // Инициализируем индикаторы прибыли
        updateProfitIndicators();
        
        // Показываем красный кружочек на заданиях при первом заходе
        showTasksNotification();
        
        // Запускаем периодическое обновление прибыли (редко, чтобы не пересоздавать индикаторы)
        setInterval(updateAllProfits, 30000);
        
        // Обработчик изменения размера окна для перепозиционирования индикаторов
        window.addEventListener('resize', () => {
            setTimeout(updateProfitIndicators, 100);
        });
    }
    // Делаем функцию глобальной для вызова из карты
    window.openBuildingPanel = openBuildingPanel;
    
    // Переменная для предотвращения двойного срабатывания
    let lastClickTime = 0;
    const CLICK_DELAY = 300; // миллисекунды
    
    // Переменные для анимации камеры
    let isAnimating = false;
    let currentZoomTarget = null;
    
    // Глобальные переменные для печати
    let printStartTime = null;
    let printTotalTime = 30; // 30 минут
    let printProgressInterval = null;
    let isPrinting = false; // Флаг активной печати
    let printCurrentTime = 0; // Текущее время печати в минутах
    let isExpedited = false; // Флаг использования ускорения
    
    // Глобальные переменные для сотрудников
    let hiredEmployees = JSON.parse(localStorage.getItem('hiredEmployees')) || {};
    let availableEmployees = ['grinni', 'purpe', 'redjy', 'blumy']; // Доступные сотрудники
    
    // Загружаем состояние печати при инициализации
    loadPrintState();
    
    function handleBuildingClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (window._mapState && (window._mapState.isDragging || window._mapState.dragMoved)) {
            return;
        }
        
        const currentTime = Date.now();
        if (currentTime - lastClickTime < CLICK_DELAY) {
            return; // Игнорируем слишком частые клики
        }
        lastClickTime = currentTime;
        
        const building = event.currentTarget.dataset.building;
        const buildingName = event.currentTarget.title;
        
        // Скрываем все индикаторы прибыли сразу при клике
        hideProfitIndicators();
        
        // Запускаем анимацию приближения к зданию
        zoomToBuilding(building, buildingName);
    }
    
    function handleBuildingTouch(event) {
        if (window._mapState && (window._mapState.isDragging || window._mapState.dragMoved)) {
            return;
        }
        // Предотвращаем двойное срабатывание на мобильных устройствах
        event.preventDefault();
        handleBuildingClick(event);
    }
    
    // === СИСТЕМА УПРАВЛЕНИЯ ЗДАНИЯМИ ===
    // Проверяем, было ли первое посещение библиотеки
    let libraryFirstVisit = localStorage.getItem('libraryFirstVisit') === 'true';
    // Проверяем, было ли первое посещение заданий
    let tasksFirstVisit = localStorage.getItem('tasksFirstVisit') === 'true';
    
    // Данные зданий (хранятся в localStorage)
    let buildingsData = JSON.parse(localStorage.getItem('buildingsData')) || {
        'print': { 
            level: 1, 
            income: 5000, 
            workers: 0, 
            maxWorkers: 3, 
            upgradeCost: 10000, 
            lastCollectTime: null, 
            accumulatedProfit: 0,
            isOwned: false,
            purchaseCost: 25000,
            name: 'Типография'
        },
        'factory': { 
            level: 1, 
            income: 3000, 
            workers: 0, 
            maxWorkers: 5, 
            upgradeCost: 5000, 
            lastCollectTime: null, 
            accumulatedProfit: 0,
            isOwned: false,
            purchaseCost: 20000,
            name: 'Завод'
        },
        'storage': { 
            level: 1, 
            income: 3000, 
            workers: 0, 
            maxWorkers: 2, 
            upgradeCost: 8000, 
            lastCollectTime: null, 
            accumulatedProfit: 0,
            isOwned: false,
            purchaseCost: 15000,
            name: 'Почта'
        },
        'library': { 
            level: 1, 
            income: 2000, 
            workers: 0, 
            maxWorkers: 4, 
            upgradeCost: 5000, 
            lastCollectTime: Date.now(), 
            accumulatedProfit: 0,
            isOwned: true,
            purchaseCost: 0,
            name: 'Библиотека'
        }
    };
    
    // Синхронизация со старой системой для завода
    if (localStorage.getItem('factoryBuilt') === '1' && !buildingsData.factory.isOwned) {
        buildingsData.factory.isOwned = true;
        buildingsData.factory.lastCollectTime = Date.now();
        buildingsData.factory.accumulatedProfit = 0;
        saveBuildingsData();
    }
    
    // Функция сохранения данных
    function saveBuildingsData() {
        localStorage.setItem('buildingsData', JSON.stringify(buildingsData));
        if (window.refreshStatistics) {
            window.refreshStatistics();
        }
    }
    
    // Функция сохранения данных о сотрудниках
    function saveHiredEmployees() {
        localStorage.setItem('hiredEmployees', JSON.stringify(hiredEmployees));
    }
    
    function fireEmployee(buildingType) {
        // Находим сотрудника, назначенного на это здание
        const employeeToFire = Object.keys(hiredEmployees).find(emp => hiredEmployees[emp] === buildingType);
        
        if (employeeToFire) {
            // Удаляем сотрудника из объекта hiredEmployees
            delete hiredEmployees[employeeToFire];
            
            // Сохраняем изменения
            saveHiredEmployees();
            
            // Обновляем карточку сотрудника
            updateEmployeeCard(buildingType);
            
            // Обновляем отображение панели здания
            updateBuildingPanelDisplay(buildingType);
            
            // Обновляем индикаторы сотрудников
            updateProfitIndicators();
        }
    }
    
    // Функция для обновления карточки сотрудника
    function updateEmployeeCard(buildingType) {
        const employeeCard = document.getElementById(`employee-card-${buildingType}`);
        
        if (employeeCard) {
            // Проверяем, есть ли назначенный сотрудник для этого здания
            const assignedEmployee = Object.keys(hiredEmployees).find(emp => hiredEmployees[emp] === buildingType);
            
            if (assignedEmployee) {
                // Если есть назначенный сотрудник, показываем карточку сотрудника
                const employeeNames = {
                    'grinni': 'Грини',
                    'purpe': 'Пёрпи',
                    'redjy': 'Реджи',
                    'blumy': 'Блуми'
                };
                const employeeImages = {
                    'grinni': 'assets/svg/hiring-forpanel/green.svg',
                    'purpe': 'assets/svg/hiring-forpanel/purpe.svg',
                    'redjy': 'assets/svg/hiring-forpanel/redjy.svg',
                    'blumy': 'assets/svg/hiring-forpanel/blumy.svg'
                };
                const employeeSkills = {
                    'grinni': 'Бухгалтер',
                    'purpe': 'Менеджер', 
                    'redjy': 'Калькулятор',
                    'blumy': 'Аналитик'
                };
                const employeeRarities = {
                    'grinni': 3,
                    'purpe': 4, 
                    'redjy': 4,
                    'blumy': 5
                };
                
                employeeCard.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%); border-radius: 12px; padding: 8px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); border: 1px solid rgba(255,255,255,0.2); flex: 1;">
                            <img src="${employeeImages[assignedEmployee]}" alt="${employeeNames[assignedEmployee]}" style="width: 80px; height: 80px; border-radius: 8px;">
                            <div style="flex: 1;">
                                <div style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 4px;">${employeeNames[assignedEmployee]}</div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                    <span style="font-size: 11px; color: rgba(255,255,255,0.8);">Уровень</span>
                                    <span style="font-size: 11px; color: #fff; font-weight: 400;">1</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                    <span style="font-size: 11px; color: rgba(255,255,255,0.8);">Навык</span>
                                    <span style="font-size: 11px; color: #fff; font-weight: 400;">${employeeSkills[assignedEmployee]}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 11px; color: rgba(255,255,255,0.8);">Редкость</span>
                                    <div style="display: flex; gap: 2px;">
                                        ${Array(5).fill().map((_, i) => 
                                            `<span style="color: ${i < employeeRarities[assignedEmployee] ? '#fff' : 'rgba(255,255,255,0.3)'}; font-size: 11px;">★</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onclick="fireEmployee('${buildingType}')" style="background: #3F2E4F; border: none; border-radius: 8px; padding: 12px 6px; color: #fff; font-size: 10px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(63, 46, 79, 0.3); transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; min-width: 30px; min-height: 100px; justify-content: center; writing-mode: vertical-lr; text-orientation: mixed;">
                            <span style="writing-mode: vertical-lr; text-orientation: mixed; font-size: 9px; letter-spacing: 1px;">Уволить</span>
                        </button>
                    </div>
                `;
            } else {
                // Если нет назначенного сотрудника, показываем кнопку "Назначить"
                employeeCard.innerHTML = `
                    <div style="border:2px dashed rgba(255,255,255,0.3);border-radius:12px;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60px;cursor:pointer;" onclick="openEmployeeMenu('${buildingType}')">
                        <button style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);border:none;color:#000;font-size:20px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">+</button>
                        <div style="color:rgba(255,255,255,0.8);font-size:12px;text-align:center;">Назначить сотрудника</div>
                    </div>
                `;
            }
        }
    }
    
    // Делаем функцию доступной глобально
    window.fireEmployee = fireEmployee;
    
    // Функция получения денег игрока (интеграция с основной игрой)
    function getPlayerMoney() {
        // Используем функцию из основной игры, если она доступна
        if (window.getBalance) {
            return window.getBalance();
        }
        return parseInt(localStorage.getItem('balance')) || 100000;
    }
    
    // Функция изменения денег игрока (интеграция с основной игрой)
    function setPlayerMoney(amount) {
        // Используем функцию из основной игры, если она доступна
        if (window.setBalance) {
            window.setBalance(amount);
        } else {
            localStorage.setItem('balance', amount.toString());
            // Обновляем отображение денег на экране
            const moneyElement = document.getElementById('money-amount');
            if (moneyElement) {
                moneyElement.textContent = amount.toLocaleString();
            }
        }
    }
    // Функция расчета накопленной прибыли
    function calculateAccumulatedProfit(buildingType) {
        const building = buildingsData[buildingType];
        if (!building || !building.isOwned) return 0;
        
        // Если lastCollectTime не установлен, прибыль не накапливается
        if (!building.lastCollectTime) return 0;
        
        const currentTime = Date.now();
        const timeDiff = currentTime - building.lastCollectTime;
        const hoursPassed = timeDiff / (1000 * 60 * 60); // часы
        
        // Базовый доход в час с учетом работников
        const hourlyIncome = building.income * (1 + building.workers * 0.2);
        
        // Накопленная прибыль
        const newProfit = building.accumulatedProfit + (hourlyIncome * hoursPassed);
        
        return Math.floor(newProfit);
    }
    
    // Функция обновления прибыли для всех зданий
    function updateAllProfits() {
        // Проверяем, открыты ли панели магазина, персонажей или города (используем глобальные переменные или DOM)
        const isShopOpen = window.isShopPanelOpen || (document.getElementById('shop-panel') && document.getElementById('shop-panel').style.display !== 'none');
        const isCharactersOpen = window.isCharactersPanelOpen || (document.getElementById('characters-panel') && document.getElementById('characters-panel').style.display !== 'none');
        const isCityOpen = window.isCityPanelOpen || (document.getElementById('city-panel') && document.getElementById('city-panel').style.display !== 'none');
        
        // Если магазин, панель персонажей или панель города открыты, не обновляем индикаторы прибыли
        if (isShopOpen || isCharactersOpen || isCityOpen) {
            return;
        }
        
        Object.keys(buildingsData).forEach(buildingType => {
            const building = buildingsData[buildingType];
            // Не накапливаем прибыль для некупленных зданий или если lastCollectTime не установлен
            if (!building || !building.isOwned || !building.lastCollectTime) return;
            
            const currentTime = Date.now();
            const timeDiff = currentTime - building.lastCollectTime;
            const hoursPassed = timeDiff / (1000 * 60 * 60);
            
            if (hoursPassed > 0) {
                const hourlyIncome = building.income * (1 + building.workers * 0.2);
                building.accumulatedProfit += hourlyIncome * hoursPassed;
                building.lastCollectTime = currentTime;
            }
        });
        
        saveBuildingsData();
        updateProfitIndicators();
    }
    // Функция создания и обновления индикаторов сотрудников
    function updateProfitIndicators() {
        // Если индикаторы подавлены (после свайпа) — ничего не делаем
        if (window._mapState && window._mapState.indicatorsSuppressed) {
            return;
        }
        
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
        
        // Если любая из панелей открыта, не показываем индикаторы сотрудников
        if (isShopOpen || isCharactersOpen || isCityOpen || isTasksOpen || isGameTasksOpen || isProfileOpen || isFriendsOpen || isSettingsOpen || isStatisticsOpen || isPhoneOpen) {
            return;
        }
        
        // Дополнительная проверка на панель здания
        const buildingPanel = document.getElementById('building-panel');
        if (buildingPanel && buildingPanel.classList.contains('show')) {
            return;
        }
        
        // Проверка на анимацию отдаления камеры
        const mainMenuImage = document.getElementById('main-menu-image');
        if (mainMenuImage && mainMenuImage.style.transition && mainMenuImage.style.transition.includes('transform')) {
            return;
        }
        
        // Удаляем все старые индикаторы
        document.querySelectorAll('.profit-indicator').forEach(indicator => {
            if (indicator && indicator.parentNode) {
                indicator.remove();
            }
        });
        // Сброс состояния анимации кругов, если ранее существовало
        if (!window._profitRingState) { window._profitRingState = {}; }
        window._profitRingState = {};
        const RING_DURATIONS_MS = { library: 1000, factory: 3000, storage: 3000, print: 2000 };
        const RING_COLORS = { library: '#27ae60', factory: '#2196f3', storage: '#ff9800', print: '#9c27b0' };
        
        // Получаем список всех зданий - сначала из pure-map, потом из building-zone как fallback
        const buildingTypes = ['library', 'factory', 'storage', 'print'];
        
        buildingTypes.forEach(buildingType => {
            const building = buildingsData[buildingType];
            
            // Проверяем, не существует ли уже индикатор для этого здания
            const existingIndicator = document.getElementById(`profit-${buildingType}`);
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            // Для некупленных зданий индикаторы и прогресс-круги не показываем
            if (!building || !building.isOwned) {
                return;
            }

            // Получаем позицию здания - сначала пробуем из pure-map, потом из building-zone
            let zoneRect = null;
            if (window.pureMap && typeof window.pureMap.getBuildingPosition === 'function') {
                // Используем координаты из pure-map
                const buildingPos = window.pureMap.getBuildingPosition(buildingType);
                if (buildingPos) {
                    zoneRect = {
                        left: buildingPos.x - buildingPos.width / 2,
                        top: buildingPos.y - buildingPos.height / 2,
                        right: buildingPos.x + buildingPos.width / 2,
                        bottom: buildingPos.y + buildingPos.height / 2,
                        width: buildingPos.width,
                        height: buildingPos.height
                    };
                }
            }
            
            // Fallback: ищем building-zone, если pure-map не доступен
            if (!zoneRect) {
                const zone = document.querySelector(`.building-zone[data-building="${buildingType}"]`);
                if (zone) {
                    zoneRect = zone.getBoundingClientRect();
                } else {
                    return; // Не можем определить позицию
                }
            }
            
            // Создаем индикатор сотрудников для всех зданий (купленных и некупленных)
            const indicator = document.createElement('div');
            indicator.className = 'profit-indicator';
            indicator.id = `profit-${buildingType}`;
            indicator.classList.add('show');
            
            // Обертка для круга
            const circleWrapper = document.createElement('div');
            circleWrapper.className = 'profit-indicator-wrapper';
            
            // Определяем какую иконку показывать в зависимости от нанятого сотрудника
            let employeeIcon = '';
            if (building.isOwned) {
                // Проверяем, есть ли назначенный сотрудник для этого здания
                const assignedEmployee = Object.keys(hiredEmployees).find(emp => hiredEmployees[emp] === buildingType);
                
                if (assignedEmployee) {
                    // Если есть назначенный сотрудник, показываем соответствующую иконку
                    switch(assignedEmployee) {
                        case 'redjy':
                            employeeIcon = '<img src="assets/svg/employees/redjy-hired.svg" style="width:44px;height:44px;filter:brightness(0.9);">';
                            break;
                        case 'grinni':
                            employeeIcon = '<img src="assets/svg/employees/grinni-hired.svg" style="width:44px;height:44px;filter:brightness(0.9);">';
                            break;
                        case 'purpe':
                            employeeIcon = '<img src="assets/svg/employees/purpe-hired.svg" style="width:44px;height:44px;filter:brightness(0.9);">';
                            break;
                        case 'blumy':
                            employeeIcon = '<img src="assets/svg/employees/blumy-hired.svg" style="width:44px;height:44px;filter:brightness(0.9);">';
                            break;
                        default:
                            // Если тип сотрудника не определен, показываем not-hired
                            employeeIcon = '<img src="assets/svg/employees/not-hired.svg" style="width:44px;height:44px;filter:brightness(0.9);">';
                    }
                } else {
                    // Если нет назначенного сотрудника, показываем not-hired
                    employeeIcon = '<img src="assets/svg/employees/not-hired.svg" style="width:44px;height:44px;filter:brightness(0.9);">';
                }
            } else {
                // Если здание не куплено, показываем not-hired
                employeeIcon = '<img src="assets/svg/employees/not-hired.svg" style="width:44px;height:44px;filter:brightness(0.9);">';
            }
            
            // Внутренние слои: прогресс-кольцо, внутренний затемнённый круг и аватар
            const progressLayer = document.createElement('div');
            progressLayer.className = 'pi-progress';
            const ringColor = RING_COLORS[buildingType] || '#ff6b9d';
            progressLayer.style.setProperty('--pi-color', ringColor);

            const innerLayer = document.createElement('div');
            innerLayer.className = 'pi-inner';

            const avatarLayer = document.createElement('div');
            avatarLayer.className = 'pi-avatar';
            avatarLayer.innerHTML = employeeIcon;

            circleWrapper.appendChild(progressLayer);
            circleWrapper.appendChild(innerLayer);
            circleWrapper.appendChild(avatarLayer);
            
            // Элемент для отображения накопленной прибыли
            const profitLabel = document.createElement('div');
            profitLabel.className = 'profit-amount-label';
            profitLabel.id = `profit-amount-${buildingType}`;
            profitLabel.innerHTML = '0 <img src="assets/svg/money-icon.svg" style="width:16px;height:16px;vertical-align:middle;margin-left:2px;" alt="money">';
            
            // Для завода меняем порядок: сначала метка прибыли (сверху), потом круг (снизу)
            if (buildingType === 'factory') {
                indicator.appendChild(profitLabel);
                indicator.appendChild(circleWrapper);
                // Меняем направление flex для завода, чтобы метка была выше круга
                indicator.style.display = 'flex';
                indicator.style.flexDirection = 'column-reverse';
                indicator.style.alignItems = 'center';
            } else {
                indicator.appendChild(circleWrapper);
                indicator.appendChild(profitLabel);
            }
            
            // Добавляем обработчик клика на круг для сбора прибыли
            circleWrapper.addEventListener('click', () => {
                const accumulatedProfit = calculateAccumulatedProfit(buildingType);
                if (accumulatedProfit > 0) {
                    const playerMoney = getPlayerMoney();
                    // Забираем накопленную прибыль
                    setPlayerMoney(playerMoney + accumulatedProfit);
                    
                    // Сбрасываем накопленную прибыль
                    building.accumulatedProfit = 0;
                    building.lastCollectTime = Date.now();
                    
                    // Сохраняем данные
                    saveBuildingsData();
                    
                    // Обновляем индикаторы
                    updateProfitIndicators();
                }
            });
            
            // Позиционируем индикатор по центру сверху здания (или снизу для factory)
            indicator.style.position = 'fixed';
            // Высота индикатора: круг (48px) + метка прибыли (~20px)
            const indicatorHeight = 48 + 20; // круг + метка
            // Центрируем по горизонтали: центр здания минус половина ширины индикатора, затем смещаем влево
            const indicatorWidth = 48; // ширина круга
            const centerX = zoneRect.left + (zoneRect.width / 2);
            let leftOffset = -50; // смещение влево от центра
            // Для почты (storage) смещаем на 5px правее
            if (buildingType === 'storage') {
                leftOffset += 5;
            }
            indicator.style.left = (centerX - indicatorWidth / 2 + leftOffset - 10) + 'px';
            
            // Для завода размещаем снизу здания, для остальных - сверху
            if (buildingType === 'factory') {
                // Размещаем под зданием
                const topOffset = 30; // отступ от низа здания (сдвинуто вниз на 10px)
                indicator.style.top = (zoneRect.bottom + topOffset) + 'px';
            } else {
                // Размещаем над зданием, но ниже (уменьшаем отступ от верха)
                const topOffset = 20; // отступ от верха здания (опускаем ниже)
                indicator.style.top = (zoneRect.top - indicatorHeight + topOffset) + 'px';
            }
            indicator.style.zIndex = '1000';
            
            document.body.appendChild(indicator);

            // Регистрируем состояние анимации для этого круга
            window._profitRingState[buildingType] = {
                el: indicator,
                progressEl: progressLayer,
                profitLabelEl: profitLabel,
                color: ringColor,
                duration: RING_DURATIONS_MS[buildingType] || 1000,
                start: performance.now()
            };
        });
        
        // Показываем индикаторы после обновления
        showProfitIndicators();
        // Запускаем rAF-петлю для анимации, если не запущена
        if (!window._profitRingRAF) {
            const animateRings = () => {
                const state = window._profitRingState || {};
                const now = performance.now();
                Object.keys(state).forEach(key => {
                    const s = state[key];
                    if (!s || !s.el || !document.body.contains(s.el)) return;
                    const elapsed = (now - s.start) % s.duration;
                    const ratio = s.duration > 0 ? (elapsed / s.duration) : 0;
                    const deg = Math.max(0, Math.min(360, ratio * 360));
                    // Единый переливающийся фиолетовый градиент
                    const c1 = '#D9523C';
                    const c2 = '#C875E6';
                    const c3 = '#D9523C';
                    const midDeg = Math.max(0, deg * 0.5);
                    // Перелив от #D9523C к #C875E6 и обратно к #D9523C в пределах заполненной дуги
                    s.progressEl.style.background = `conic-gradient(${c1} 0deg, ${c2} ${midDeg}deg, ${c3} ${deg}deg, transparent ${deg}deg)`;
                    
                    // Обновляем накопленную прибыль
                    if (s.profitLabelEl) {
                        const accumulatedProfit = calculateAccumulatedProfit(key);
                        let formattedProfit = '';
                        if (accumulatedProfit === 0) {
                            formattedProfit = '0';
                        } else if (accumulatedProfit >= 1000000) {
                            formattedProfit = (accumulatedProfit / 1000000).toFixed(1) + 'M';
                            // Убираем .0 в конце если есть
                            if (formattedProfit.endsWith('.0M')) {
                                formattedProfit = formattedProfit.replace('.0M', 'M');
                            }
                        } else if (accumulatedProfit >= 1000) {
                            formattedProfit = (accumulatedProfit / 1000).toFixed(1) + 'k';
                            // Убираем .0 в конце если есть
                            if (formattedProfit.endsWith('.0k')) {
                                formattedProfit = formattedProfit.replace('.0k', 'k');
                            }
                        } else {
                            formattedProfit = accumulatedProfit.toString();
                        }
                        s.profitLabelEl.innerHTML = formattedProfit + ' <img src="assets/svg/money-icon.svg" style="width:16px;height:16px;vertical-align:middle;margin-left:2px;" alt="money">';
                    }
                });
                window._profitRingRAF = requestAnimationFrame(animateRings);
            };
            window._profitRingRAF = requestAnimationFrame(animateRings);
        }
        
        // Исправляем позиционирование индикаторов для Telegram Mini App
        if (isTelegramApp && typeof fixBuildingIndicatorsForTelegram === 'function') {
            setTimeout(() => {
                fixBuildingIndicatorsForTelegram(70);
            }, 100);
        }
    }
    
    // === ФУНКЦИИ УПРАВЛЕНИЯ ИНДИКАТОРАМИ ===
    // Функция для быстрого обновления только позиций существующих индикаторов (без пересоздания)
    function updateProfitIndicatorsPositions() {
        // Если индикаторы подавлены — ничего не делаем
        if (window._mapState && window._mapState.indicatorsSuppressed) {
            return;
        }
        
        // Получаем все существующие индикаторы
        const indicators = document.querySelectorAll('.profit-indicator');
        if (indicators.length === 0) return;
        
        // Обновляем позиции для каждого существующего индикатора
        indicators.forEach(indicator => {
            // Извлекаем тип здания из ID индикатора (например, "profit-library" -> "library")
            const indicatorId = indicator.id;
            if (!indicatorId || !indicatorId.startsWith('profit-')) return;
            
            const buildingType = indicatorId.replace('profit-', '');
            
            // Получаем позицию здания
            let zoneRect = null;
            if (window.pureMap && typeof window.pureMap.getBuildingPosition === 'function') {
                const buildingPos = window.pureMap.getBuildingPosition(buildingType);
                if (buildingPos) {
                    zoneRect = {
                        left: buildingPos.x - buildingPos.width / 2,
                        top: buildingPos.y - buildingPos.height / 2,
                        right: buildingPos.x + buildingPos.width / 2,
                        bottom: buildingPos.y + buildingPos.height / 2,
                        width: buildingPos.width,
                        height: buildingPos.height
                    };
                }
            }
            
            // Fallback: ищем building-zone, если pure-map не доступен
            if (!zoneRect) {
                const zone = document.querySelector(`.building-zone[data-building="${buildingType}"]`);
                if (zone) {
                    zoneRect = zone.getBoundingClientRect();
                } else {
                    return; // Не можем определить позицию
                }
            }
            
            // Мгновенно обновляем позицию без анимации
            indicator.style.transition = 'none';
            // Высота индикатора: круг (48px) + метка прибыли (~20px)
            const indicatorHeight = 48 + 20; // круг + метка
            // Центрируем по горизонтали: центр здания минус половина ширины индикатора, затем смещаем влево
            const indicatorWidth = 48; // ширина круга
            const centerX = zoneRect.left + (zoneRect.width / 2);
            let leftOffset = -50; // смещение влево от центра
            // Для почты (storage) смещаем на 5px правее
            if (buildingType === 'storage') {
                leftOffset += 5;
            }
            indicator.style.left = (centerX - indicatorWidth / 2 + leftOffset - 10) + 'px';
            
            // Для завода размещаем снизу здания, для остальных - сверху
            if (buildingType === 'factory') {
                // Размещаем под зданием
                const topOffset = 30; // отступ от низа здания (сдвинуто вниз на 10px)
                indicator.style.top = (zoneRect.bottom + topOffset) + 'px';
            } else {
                // Размещаем над зданием, но ниже (уменьшаем отступ от верха)
                const topOffset = 20; // отступ от верха здания (опускаем ниже)
                indicator.style.top = (zoneRect.top - indicatorHeight + topOffset) + 'px';
            }
            // Убираем right, так как теперь используем left
            indicator.style.right = 'auto';
        });
    }
    
    function hideProfitIndicators() {
        const indicators = document.querySelectorAll('.profit-indicator');
        indicators.forEach(indicator => {
            indicator.style.opacity = '0';
            indicator.style.transform = 'scale(0.8)';
            indicator.style.transition = 'all 0.2s ease';
        });
    }
    
    function showProfitIndicators() {
        if (window._mapState && window._mapState.indicatorsSuppressed) {
            return;
        }
        const indicators = document.querySelectorAll('.profit-indicator');
        indicators.forEach(indicator => {
            indicator.style.opacity = '1';
            indicator.style.transform = 'scale(1)';
            indicator.style.transition = 'all 0.3s ease';
        });
    }
    
    // Функция для принудительной очистки всех индикаторов сотрудников
    function clearAllProfitIndicators() {
        const indicators = document.querySelectorAll('.profit-indicator');
        indicators.forEach(indicator => {
            if (indicator && indicator.parentNode) {
                indicator.remove();
            }
        });
    }
    
    // === ФУНКЦИИ УВЕДОМЛЕНИЙ ===
    function showTasksNotification() {
        if (!tasksFirstVisit) {
            const tasksDot = document.getElementById('tasks-dot');
            if (tasksDot) {
                tasksDot.style.display = 'block';
            }
        } else {
            // Скрываем кружочек, если уже посещали
            const tasksDot = document.getElementById('tasks-dot');
            if (tasksDot) {
                tasksDot.style.display = 'none';
            }
        }
    }
    
    function handleTasksClick(event) {
        event.preventDefault();
        
        const currentTime = Date.now();
        if (currentTime - lastClickTime < CLICK_DELAY) {
            return; // Игнорируем слишком частые клики
        }
        lastClickTime = currentTime;
        
        // Если это первое посещение, убираем красный кружочек
        if (!tasksFirstVisit) {
            tasksFirstVisit = true;
            localStorage.setItem('tasksFirstVisit', 'true');
            
            const tasksDot = document.getElementById('tasks-dot');
            if (tasksDot) {
                tasksDot.style.display = 'none';
            }
        }
        
        // Здесь можно добавить логику открытия панели заданий
        // Например:
        // if (window.showPanelWithAnimation) {
        //     window.showPanelWithAnimation('tasks-panel');
        // }
    }
    
    // === ФУНКЦИИ АНИМАЦИИ КАМЕРЫ ===
    function zoomToBuilding(building, buildingName) {
        if (isAnimating) return;
        
        isAnimating = true;
        currentZoomTarget = building;
        
        // Проверяем, есть ли изображение главного меню
        const mainMenuImage = document.getElementById('main-menu-image');
        if (!mainMenuImage) {
            // Если нет изображения, открываем панель напрямую
            setTimeout(() => {
                openBuildingPanel(building, buildingName);
                isAnimating = false;
            }, 100);
            return;
        }
        
        // Получаем координаты здания
        const buildingZone = document.querySelector(`[data-building="${building}"]`);
        if (!buildingZone) {
            console.error(`❌ Зона здания ${building} не найдена`);
            isAnimating = false;
            return;
        }
        
        try {
            const rect = buildingZone.getBoundingClientRect();
            const imageRect = mainMenuImage.getBoundingClientRect();
            
            // Вычисляем центр здания относительно изображения
            const centerX = (rect.left + rect.width / 2 - imageRect.left) / imageRect.width;
            const centerY = (rect.top + rect.height / 2 - imageRect.top) / imageRect.height;
            
            // Анимация приближения с защитой от выхода карты за края
            const scale = 1.2;
            const rawTX = (0.5 - centerX) * 50; // в процентах ширины
            const rawTY = (0.5 - centerY) * 50; // в процентах высоты
            // Максимально допустимый сдвиг при порядке scale→translate:
            // s * |t|% * W <= (s - 1) * W / 2  => |t|% <= 50 * (s - 1) / s
            const safeShift = 50 * (scale - 1) / scale;
            const maxShift = safeShift - 0.7; // дополнительный запас 0.7%
            function clamp(v, a) { return v < -a ? -a : (v > a ? a : v); }
            // Для завода и типографии жёстче ограничиваем, чтобы гарантированно не было видно «за картой»
            const isEdgeSensitive = (building === 'factory' || building === 'print');
            const tx = isEdgeSensitive ? clamp(rawTX, maxShift) : clamp(rawTX, safeShift);
            const ty = isEdgeSensitive ? clamp(rawTY, maxShift) : clamp(rawTY, safeShift);
            mainMenuImage.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            mainMenuImage.style.transform = `scale(${scale}) translate(${tx}%, ${ty}%)`;
            
            // Открываем панель здания после анимации
            setTimeout(() => {
                openBuildingPanel(building, buildingName);
                isAnimating = false;
            }, 800);
        } catch (error) {
            console.error('❌ Ошибка при анимации камеры:', error);
            // В случае ошибки открываем панель напрямую
            setTimeout(() => {
                openBuildingPanel(building, buildingName);
                isAnimating = false;
            }, 100);
        }
    }
    
    function resetCamera() {
        const mainMenuImage = document.getElementById('main-menu-image');
        if (mainMenuImage) {
            try {
                mainMenuImage.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                mainMenuImage.style.transform = 'scale(1) translate(0%, 0%)';
                
                setTimeout(() => {
                    mainMenuImage.style.transition = '';
                    currentZoomTarget = null;
                    
                    // Показываем индикаторы сотрудников только после полного завершения анимации отдаления
                    setTimeout(() => {
                        updateProfitIndicators();
                    }, 100);
                }, 600);
            } catch (error) {
                console.error('❌ Ошибка при сбросе камеры:', error);
                currentZoomTarget = null;
                setTimeout(() => {
                    updateProfitIndicators();
                }, 100);
            }
        } else {
            // Если нет изображения, просто сбрасываем состояние
            currentZoomTarget = null;
            setTimeout(() => {
                updateProfitIndicators();
            }, 100);
        }
    }
    // === ФУНКЦИИ ПАНЕЛЕЙ ЗДАНИЙ ===
    function openBuildingPanel(building, buildingName) {
        // Закрываем предыдущую панель, если есть
        closeBuildingPanel();
        
        // Если это первое посещение библиотеки, устанавливаем флаг
        if (building === 'library' && !libraryFirstVisit) {
            libraryFirstVisit = true;
            localStorage.setItem('libraryFirstVisit', 'true');
            
            // Сразу обновляем индикаторы, чтобы убрать восклицательный знак
            setTimeout(() => {
                updateProfitIndicators();
            }, 100);
        }
        
        // Создаем новую панель
        const panel = createBuildingPanel(building, buildingName);
        document.body.appendChild(panel);
        
        // Обновляем динамические панели для Telegram Mini App
        if (isTelegramApp) {
            updateDynamicBuildingPanelsForTelegram(70); // Используем стандартный offset для Telegram
            enableDeepScrollForTelegram(); // Включаем глубокую прокрутку
        }
        
        // Анимация появления с минимальной задержкой
        setTimeout(() => {
            panel.classList.add('show');
        }, 1);
        
        // Закрытие по клику вне панели
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                closeBuildingPanel();
            }
        });
    }
    function createBuildingPanel(building, buildingName) {
        const panel = document.createElement('div');
        panel.className = 'building-panel';
        panel.id = 'building-panel';
        
        // Иконки для каждого здания
        const buildingIcons = {
            'print': '🖨️',
            'factory': '🏭',
            'storage': '📮',
            'library': '📚'
        };
        
        const icon = buildingIcons[building] || '🏢';
        const buildingData = buildingsData[building];
        const playerMoney = getPlayerMoney();
        
        // Специальная панель для библиотеки - неоново-розовая карточка с SVG
        if (building === 'library') {
            const buildingData = buildingsData[building] || { level: 1, income: 20000 };
            const dailyIncome = buildingData.income || 20000;
            
            panel.innerHTML = `
                <div style="position:fixed;inset:0;z-index:1500;justify-content:center;align-items:center;font-family:'Segoe UI',Arial,sans-serif;display:flex;">
                    <style>
                        .building-panel-container::-webkit-scrollbar {
                            width: 8px;
                        }
                        .building-panel-container::-webkit-scrollbar-track {
                            background: rgba(255,255,255,0.1);
                            border-radius: 4px;
                        }
                        .building-panel-container::-webkit-scrollbar-thumb {
                            background: rgba(255,255,255,0.3);
                            border-radius: 4px;
                        }
                        .building-panel-container::-webkit-scrollbar-thumb:hover {
                            background: rgba(255,255,255,0.5);
                        }
                    </style>
                    <!-- Контейнер для панели с чисто черным фоном как у нижнего меню -->
                    <div class="building-panel-container" style="width:90%;max-width:380px;max-height:75vh;overflow-y:auto;position:relative;display:flex;flex-direction:column;align-items:center;background:linear-gradient(135deg,rgba(0,0,0,0.95) 0%,rgba(20,20,20,0.95) 100%);border-radius:16px;padding:16px;backdrop-filter:blur(25px);border:2px solid rgba(255,255,255,0.1);box-shadow:0 25px 50px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.05);">
                        <div style="width:100%;background:none;border-radius:16px;padding:0;color:#fff;position:relative;">
                            <!-- Кнопка закрытия -->
                            <button class="building-panel-close" style="position:absolute;top:-2px;right:2px;background:rgba(255,255,255,0.1);border:none;color:white;font-size:16px;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:all 0.2s ease;z-index:10;" onmouseover="this.style.background='rgba(255,255,255,0.2)';this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(255,255,255,0.1)';this.style.transform='scale(1)'">✕</button>
                            
                            <!-- Неоново-розовая карточка библиотеки -->
                            <div style="background:linear-gradient(135deg,#ff6b9d 0%,#c44569 50%,#8b5cf6 100%);border-radius:15px;padding:0;margin:0 0 15px 0;border:1px solid rgba(255,255,255,0.2);box-shadow:0 8px 32px rgba(255,107,157,0.3);position:relative;overflow:hidden;display:flex;align-items:center;height:90px;">
                                <!-- Левая часть с SVG здания -->
                                <div style="position:absolute;left:-20px;top:50%;transform:translateY(-50%);width:108px;height:108px;display:flex;align-items:center;justify-content:center;">
                                    <img src="assets/svg/library-panel/libinf.svg" alt="Library Info" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));" onerror="this.style.display='none'">
                                </div>
                                
                                <!-- Правая часть с текстом -->
                                <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-start;height:60px;margin-left:70px;padding:16px;padding-top:8px;">
                                    <!-- Уровень -->
                                    <div class="building-level" style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:2px;">
                                        Ур. ${buildingData.level || 1}
                                    </div>
                                    
                                    <!-- Название -->
                                    <div style="font-size:16px;font-weight:700;color:white;margin-bottom:4px;text-shadow:0 2px 4px rgba(0,0,0,0.3);">
                                        Библиотека
                                    </div>
                                    
                                    <!-- Ежедневный доход -->
                                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                                        <span style="font-size:10px;color:rgba(255,255,255,0.9);">Ежедн. доход:</span>
                                    </div>
                                    <div style="display:flex;align-items:center;gap:6px;">
                                        <img src="assets/svg/money-icon.svg" alt="Money" style="width:13px;height:13px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
                                        <span class="building-income" style="font-size:13px;font-weight:700;color:white;">${(buildingData.income/1000).toFixed(0)}k</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Карточка сотрудника -->
                            <div id="employee-card-${building}" style="margin-bottom:15px;">
                                ${(() => {
                                    // Проверяем, есть ли уже назначенный сотрудник для этого здания
                                    const assignedEmployee = Object.keys(hiredEmployees).find(emp => hiredEmployees[emp] === building);
                                    if (assignedEmployee) {
                                        const employeeNames = {
                                            'grinni': 'Грини',
                                            'purpe': 'Пёрпи',
                                            'redjy': 'Реджи',
                                            'blumy': 'Блуми'
                                        };
                                        const employeeImages = {
                                            'grinni': 'assets/svg/hiring-forpanel/green.svg',
                                            'purpe': 'assets/svg/hiring-forpanel/purpe.svg',
                                            'redjy': 'assets/svg/hiring-forpanel/redjy.svg',
                                            'blumy': 'assets/svg/hiring-forpanel/blumy.svg'
                                        };
                                        const employeeSkills = {
                                            'grinni': 'Бухгалтер',
                                            'purpe': 'Менеджер', 
                                            'redjy': 'Калькулятор',
                                            'blumy': 'Аналитик'
                                        };
                                        const employeeRarities = {
                                            'grinni': 3,
                                            'purpe': 4, 
                                            'redjy': 4,
                                            'blumy': 5
                                        };
                                        return `
                                            <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                                                <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%); border-radius: 12px; padding: 8px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); border: 1px solid rgba(255,255,255,0.2); flex: 1;">
                                                    <img src="${employeeImages[assignedEmployee]}" alt="${employeeNames[assignedEmployee]}" style="width: 80px; height: 80px; border-radius: 8px;">
                                                    <div style="flex: 1;">
                                                        <div style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 4px;">${employeeNames[assignedEmployee]}</div>
                                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                                            <span style="font-size: 11px; color: rgba(255,255,255,0.8);">Уровень</span>
                                                            <span style="font-size: 11px; color: #fff; font-weight: 400;">1</span>
                                                        </div>
                                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                                            <span style="font-size: 11px; color: rgba(255,255,255,0.8);">Навык</span>
                                                            <span style="font-size: 11px; color: #fff; font-weight: 400;">${employeeSkills[assignedEmployee]}</span>
                                                        </div>
                                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                                            <span style="font-size: 11px; color: rgba(255,255,255,0.8);">Редкость</span>
                                                            <div style="display: flex; gap: 2px;">
                                                                ${Array(5).fill().map((_, i) => 
                                                                    `<span style="color: ${i < employeeRarities[assignedEmployee] ? '#fff' : 'rgba(255,255,255,0.3)'}; font-size: 11px;">★</span>`
                                                                ).join('')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onclick="fireEmployee('${building}')" style="background: #3F2E4F; border: none; border-radius: 8px; padding: 12px 6px; color: #fff; font-size: 10px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(63, 46, 79, 0.3); transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; min-width: 30px; min-height: 100px; justify-content: center; writing-mode: vertical-lr; text-orientation: mixed;">
                                                    <span style="writing-mode: vertical-lr; text-orientation: mixed; font-size: 9px; letter-spacing: 1px;">Уволить</span>
                                                </button>
                                            </div>
                                        `;
                                    } else {
                                        return `
                                            <div style="border:2px dashed rgba(255,255,255,0.3);border-radius:12px;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60px;cursor:pointer;" onclick="openEmployeeMenu('${building}')">
                                    <button style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);border:none;color:#000;font-size:20px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">+</button>
                                    <div style="color:rgba(255,255,255,0.8);font-size:12px;text-align:center;">Назначить сотрудника</div>
                                </div>
                                        `;
                                    }
                                })()}
                            </div>
                            
                            <!-- Карточка улучшения -->
                            <div style="background:rgba(255,255,255,0.05);border-radius:15px;padding:16px;margin-bottom:15px;border:1px solid rgba(255,255,255,0.1);">
                                <!-- Заголовок -->
                                <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:16px;">Улучшение</div>
                                
                                <!-- Детали улучшения -->
                                <div style="margin-bottom:16px;">
                                    <!-- Ежедневный доход -->
                                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                                        <span style="font-size:12px;color:rgba(255,255,255,0.8);">Ежедневный доход</span>
                                        <span id="daily-income-display" style="font-size:12px;color:#fff;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;"><span style="color:rgba(255,255,255,0.6);">${(buildingData.income/1000).toFixed(0)}k</span> > <span style="color:#fff;">${(buildingData.income * 1.25 / 1000).toFixed(0)}k</span></span>
                                    </div>
                                    
                                    <!-- Коммунальные расходы -->
                                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                                        <span style="font-size:12px;color:rgba(255,255,255,0.8);">Коммунальные расходы</span>
                                        <span id="utility-costs-display" style="font-size:12px;color:#fff;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;"><span style="color:rgba(255,255,255,0.6);">25k</span> > <span style="color:#fff;">10k</span></span>
                                    </div>
                                    
                                    <!-- Время улучшения -->
                                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
                                        <span style="font-size:12px;color:rgba(255,255,255,0.8);">Время улучшения</span>
                                        <span id="upgrade-time-display" style="font-size:12px;color:#fff;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;"><span style="color:#fff;">1 час</span></span>
                                    </div>
                                </div>
                                
                                <!-- Кнопка улучшения -->
                                <button id="upgrade-btn" style="width:100%;background:${playerMoney >= buildingData.upgradeCost ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.3)'};border:none;border-radius:20px;padding:8px 16px;color:#fff;font-size:14px;font-weight:700;cursor:${playerMoney >= buildingData.upgradeCost ? 'pointer' : 'not-allowed'};display:flex;align-items:center;justify-content:space-between;transition:all 0.3s ease;font-family:'Segoe UI',Arial,sans-serif;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.3);" onclick="${playerMoney >= buildingData.upgradeCost ? 'upgradeLibrary()' : ''}">
                                    <span style="font-size:14px;font-weight:700;color:#fff;">Улучшить</span>
                                    <div style="background:${playerMoney >= buildingData.upgradeCost ? '#000' : 'rgba(255,255,255,0.15)'};border-radius:16px;padding:4px 8px;display:flex;align-items:center;gap:4px;border:${playerMoney >= buildingData.upgradeCost ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.2)'};margin-right:-4px;">
                                        <img src="assets/svg/money-icon.svg" alt="Cost" style="width:14px;height:14px;filter:brightness(1.2);">
                                        <span style="font-size:12px;color:#fff;font-weight:700;" id="library-upgrade-cost">${(buildingData.upgradeCost/1000).toFixed(0)}k</span>
                                    </div>
                                </button>
                            </div>
                            
                            <!-- Дополнительное пространство для прокрутки -->
                            <div style="height:40px;width:100%;"></div>
                        </div>
                    </div>
                </div>
            `;
            
            // Обработчик закрытия
            const closeBtn = panel.querySelector('.building-panel-close');
            closeBtn.addEventListener('click', closeBuildingPanel);
            
            // Обновляем отображение при открытии панели
            updateBuildingPanelDisplay('library');
            
            // Запускаем периодическое обновление отображения
            const updateInterval = setInterval(() => {
                if (document.body.contains(panel)) {
                    // Обновляем данные здания перед отображением
                    updateAllProfits();
                    updateBuildingPanelDisplay('library');
                } else {
                    clearInterval(updateInterval);
                }
            }, 1000);
            
            return panel;
        }
        
        // Специальная панель для типографии - неоново-розовая карточка с SVG
        if (building === 'print') {
            const buildingData = buildingsData[building] || { level: 1, income: 5000, isOwned: false, purchaseCost: 25000 };
            
            // Если типография не куплена, показываем панель покупки
            if (!buildingData.isOwned) {
                const canAfford = playerMoney >= buildingData.purchaseCost;
                
                panel.innerHTML = `
                    <div style="position:fixed;inset:0;z-index:1500;justify-content:center;align-items:center;font-family:'Segoe UI',Arial,sans-serif;display:flex;">
                        <style>
                            .building-panel-container::-webkit-scrollbar {
                                width: 8px;
                            }
                            .building-panel-container::-webkit-scrollbar-track {
                                background: rgba(255,255,255,0.1);
                                border-radius: 4px;
                            }
                            .building-panel-container::-webkit-scrollbar-thumb {
                                background: rgba(255,255,255,0.3);
                                border-radius: 4px;
                            }
                            .building-panel-container::-webkit-scrollbar-thumb:hover {
                                background: rgba(255,255,255,0.5);
                            }
                        </style>
                        <!-- Контейнер для панели с чисто черным фоном как у нижнего меню -->
                        <div class="building-panel-container" style="width:90%;max-width:380px;max-height:70vh;overflow-y:auto;position:relative;display:flex;flex-direction:column;align-items:center;background:linear-gradient(135deg,rgba(0,0,0,0.95) 0%,rgba(20,20,20,0.95) 100%);border-radius:16px;padding:16px;backdrop-filter:blur(25px);border:2px solid rgba(255,255,255,0.1);box-shadow:0 25px 50px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.05);">
                            <div style="width:100%;background:none;border-radius:16px;padding:0;color:#fff;position:relative;">
                                <!-- Кнопка закрытия -->
                                <button class="building-panel-close" style="position:absolute;top:-2px;right:2px;background:rgba(255,255,255,0.1);border:none;color:white;font-size:16px;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:all 0.2s ease;z-index:10;" onmouseover="this.style.background='rgba(255,255,255,0.2)';this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(255,255,255,0.1)';this.style.transform='scale(1)'">✕</button>
                                
                                <!-- Неоново-розовая карточка типографии -->
                                <div style="background:linear-gradient(135deg,#ff6b9d 0%,#c44569 50%,#8b5cf6 100%);border-radius:15px;padding:0;margin:0 0 15px 0;border:1px solid rgba(255,255,255,0.2);box-shadow:0 8px 32px rgba(255,107,157,0.3);position:relative;overflow:hidden;display:flex;align-items:center;height:90px;">
                                    <!-- Левая часть с SVG здания -->
                                    <div style="position:absolute;left:-20px;top:50%;transform:translateY(-50%);width:108px;height:108px;display:flex;align-items:center;justify-content:center;">
                                        <img src="assets/svg/typography-panel/Image (1).svg" alt="Typography Info" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));" onerror="this.style.display='none'">
                                    </div>
                                    
                                    <!-- Правая часть с текстом -->
                                    <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-start;height:60px;margin-left:70px;padding:16px;padding-top:8px;">
                                        <!-- Уровень -->
                                        <div class="building-level" style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:2px;">
                                            Ур. 1
                                        </div>
                                        
                                        <!-- Название -->
                                        <div style="font-size:16px;font-weight:700;color:white;margin-bottom:4px;text-shadow:0 2px 4px rgba(0,0,0,0.3);">
                                            Типография
                                        </div>
                                        
                                        <!-- Ежедневный доход -->
                                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                                            <span style="font-size:10px;color:rgba(255,255,255,0.9);">Ежедн. доход:</span>
                                        </div>
                                        <div style="display:flex;align-items:center;gap:6px;">
                                            <img src="assets/svg/money-icon.svg" alt="Money" style="width:13px;height:13px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
                                            <span class="building-income" style="font-size:13px;font-weight:700;color:white;">${(buildingData.income/1000).toFixed(0)}k</span>
                                        </div>
                                    </div>
                                </div>
                                <!-- Карточка информации о покупке -->
                                <div style="background:rgba(255,255,255,0.05);border-radius:15px;padding:16px;margin-bottom:15px;border:1px solid rgba(255,255,255,0.1);">
                                    <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:16px;">Информация о здании</div>
                                    
                                    <!-- Детали здания -->
                                    <div style="margin-bottom:16px;">
                                        <!-- Базовый доход -->
                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                                            <span style="font-size:12px;color:rgba(255,255,255,0.8);">Базовый доход</span>
                                            <span style="font-size:12px;color:#fff;font-weight:600;">+${(buildingData.income/1000).toFixed(1)}k/час</span>
                                        </div>
                                        
                                        <!-- Максимум работников -->
                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                                            <span style="font-size:12px;color:rgba(255,255,255,0.8);">Максимум работников</span>
                                            <span style="font-size:12px;color:#fff;font-weight:600;">3</span>
                                        </div>
                                        
                                        <!-- Ваш баланс -->
                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
                                            <span style="font-size:12px;color:rgba(255,255,255,0.8);">Ваш баланс</span>
                                            <div style="display:flex;align-items:center;gap:4px;">
                                                <img src="assets/svg/money-icon.svg" alt="Money" style="width:12px;height:12px;filter:brightness(0.8);">
                                                <span style="font-size:12px;color:${canAfford ? '#4ade80' : '#ef4444'};font-weight:600;">${(playerMoney/1000).toFixed(1)}k</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Кнопка покупки -->
                                    <button id="buy-print-btn" style="width:100%;background:${canAfford ? '#000000' : '#666666'};border:none;border-radius:25px;padding:10px 20px;color:#fff;font-size:14px;font-weight:600;cursor:${canAfford ? 'pointer' : 'not-allowed'};display:flex;align-items:center;justify-content:space-between;transition:all 0.2s ease;">
                                        <span>Купить</span>
                                        <div style="background:rgba(255,255,255,0.2);border-radius:15px;padding:4px 8px;display:flex;align-items:center;gap:4px;">
                                            <img src="assets/svg/money-icon.svg" alt="Cost" style="width:10px;height:10px;">
                                            <span style="font-size:10px;color:#fff;font-weight:600;">25k</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Обработчик закрытия
                const closeBtn = panel.querySelector('.building-panel-close');
                closeBtn.addEventListener('click', closeBuildingPanel);
                
                // Обработчик покупки
                if (canAfford) {
                    const buyBtn = panel.querySelector('#buy-print-btn');
                    buyBtn.addEventListener('click', () => {
                        buyPrint();
                    });
                }
                
                return panel;
            }
            // Если типография уже куплена, показываем обычную панель управления
            const printDailyIncome = buildingData.income || 5000;
            panel.innerHTML = `
                <div style="position:fixed;inset:0;z-index:1500;justify-content:center;align-items:center;font-family:'Segoe UI',Arial,sans-serif;display:flex;">
                    <style>
                        .building-panel-container::-webkit-scrollbar {
                            width: 8px;
                        }
                        .building-panel-container::-webkit-scrollbar-track {
                            background: rgba(255,255,255,0.1);
                            border-radius: 4px;
                        }
                        .building-panel-container::-webkit-scrollbar-thumb {
                            background: rgba(255,255,255,0.3);
                            border-radius: 4px;
                        }
                        .building-panel-container::-webkit-scrollbar-thumb:hover {
                            background: rgba(255,255,255,0.5);
                        }
                    </style>
                    <!-- Контейнер для панели с чисто черным фоном как у нижнего меню -->
                    <div class="building-panel-container" style="width:90%;max-width:420px;max-height:70vh;overflow-y:auto;position:relative;display:flex;flex-direction:column;align-items:center;background:linear-gradient(135deg,rgba(0,0,0,0.95) 0%,rgba(20,20,20,0.95) 100%);border-radius:20px;padding:16px;backdrop-filter:blur(25px);border:2px solid rgba(255,255,255,0.1);box-shadow:0 25px 50px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.05);">
                        <div style="width:100%;background:none;border-radius:16px;padding:0;color:#fff;position:relative;">
                            <!-- Кнопка закрытия -->
                            <button class="building-panel-close" style="position:absolute;top:-2px;right:2px;background:rgba(255,255,255,0.1);border:none;color:white;font-size:16px;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:all 0.2s ease;z-index:10;" onmouseover="this.style.background='rgba(255,255,255,0.2)';this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(255,255,255,0.1)';this.style.transform='scale(1)'">✕</button>
                            
                            <!-- Неоново-розовая карточка типографии -->
                            <div style="background:linear-gradient(135deg,#ff6b9d 0%,#c44569 50%,#8b5cf6 100%);border-radius:15px;padding:0;margin:0 0 15px 0;border:1px solid rgba(255,255,255,0.2);box-shadow:0 8px 32px rgba(255,107,157,0.3);position:relative;overflow:hidden;display:flex;align-items:center;height:90px;">
                                <!-- Левая часть с SVG здания -->
                                <div style="position:absolute;left:-20px;top:50%;transform:translateY(-50%);width:108px;height:108px;display:flex;align-items:center;justify-content:center;">
                                    <img src="assets/svg/typography-panel/Image (1).svg" alt="Typography Info" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));" onerror="this.style.display='none'">
                                </div>
                                
                                <!-- Правая часть с текстом -->
                                <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-start;height:60px;margin-left:70px;padding:16px;padding-top:8px;">
                                    <!-- Уровень -->
                                    <div class="building-level" style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:2px;">
                                        Ур. ${buildingData.level || 1}
                                    </div>
                                    
                                    <!-- Название -->
                                    <div style="font-size:16px;font-weight:700;color:white;margin-bottom:4px;text-shadow:0 2px 4px rgba(0,0,0,0.3);">
                                        Типография
                                    </div>
                                    
                                    <!-- Ежедневный доход -->
                                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                                        <span style="font-size:10px;color:rgba(255,255,255,0.9);">Ежедн. доход:</span>
                                    </div>
                                    <div style="display:flex;align-items:center;gap:6px;">
                                        <img src="assets/svg/money-icon.svg" alt="Money" style="width:13px;height:13px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
                                        <span class="building-income" style="font-size:13px;font-weight:700;color:white;">${(buildingData.income/1000).toFixed(0)}k</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Карточка сотрудника -->
                            <div id="employee-card-${building}" style="margin-bottom:15px;">
                                ${(() => {
                                    // Проверяем, есть ли уже назначенный сотрудник для этого здания
                                    const assignedEmployee = Object.keys(hiredEmployees).find(emp => hiredEmployees[emp] === building);
                                    if (assignedEmployee) {
                                        const employeeNames = {
                                            'grinni': 'Грини',
                                            'purpe': 'Пёрпи',
                                            'redjy': 'Реджи',
                                            'blumy': 'Блуми'
                                        };
                                        const employeeImages = {
                                            'grinni': 'assets/svg/hiring-forpanel/green.svg',
                                            'purpe': 'assets/svg/hiring-forpanel/purpe.svg',
                                            'redjy': 'assets/svg/hiring-forpanel/redjy.svg',
                                            'blumy': 'assets/svg/hiring-forpanel/blumy.svg'
                                        };
                                        const employeeSkills = {
                                            'grinni': 'Бухгалтер',
                                            'purpe': 'Менеджер', 
                                            'redjy': 'Калькулятор',
                                            'blumy': 'Аналитик'
                                        };
                                        const employeeRarities = {
                                            'grinni': 3,
                                            'purpe': 4, 
                                            'redjy': 4,
                                            'blumy': 5
                                        };
                                        return `
                                            <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                                                <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%); border-radius: 12px; padding: 8px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); border: 1px solid rgba(255,255,255,0.2); flex: 1;">
                                                    <img src="${employeeImages[assignedEmployee]}" alt="${employeeNames[assignedEmployee]}" style="width: 80px; height: 80px; border-radius: 8px;">
                                                    <div style="flex: 1;">
                                                        <div style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 4px;">${employeeNames[assignedEmployee]}</div>
                                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                                            <span style="font-size: 11px; color: rgba(255,255,255,0.8);">Уровень</span>
                                                            <span style="font-size: 11px; color: #fff; font-weight: 400;">1</span>
                                                        </div>
                                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                                            <span style="font-size: 11px; color: rgba(255,255,255,0.8);">Навык</span>
                                                            <span style="font-size: 11px; color: #fff; font-weight: 400;">${employeeSkills[assignedEmployee]}</span>
                                                        </div>
                                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                                            <span style="font-size: 11px; color: rgba(255,255,255,0.8);">Редкость</span>
                                                            <div style="display: flex; gap: 2px;">
                                                                ${Array(5).fill().map((_, i) => 
                                                                    `<span style="color: ${i < employeeRarities[assignedEmployee] ? '#fff' : 'rgba(255,255,255,0.3)'}; font-size: 11px;">★</span>`
                                                                ).join('')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onclick="fireEmployee('${building}')" style="background: #3F2E4F; border: none; border-radius: 8px; padding: 12px 6px; color: #fff; font-size: 10px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(63, 46, 79, 0.3); transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; min-width: 30px; min-height: 100px; justify-content: center; writing-mode: vertical-lr; text-orientation: mixed;">
                                                    <span style="writing-mode: vertical-lr; text-orientation: mixed; font-size: 9px; letter-spacing: 1px;">Уволить</span>
                                                </button>
                                            </div>
                                        `;
                                    } else {
                                        return `
                                            <div style="border:2px dashed rgba(255,255,255,0.3);border-radius:12px;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60px;cursor:pointer;" onclick="openEmployeeMenu('${building}')">
                                    <button style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);border:none;color:#000;font-size:20px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">+</button>
                                    <div style="color:rgba(255,255,255,0.8);font-size:12px;text-align:center;">Назначить сотрудника</div>
                                </div>
                                        `;
                                    }
                                })()}
                            </div>
                            <!-- Карточка печати -->
                            <div style="margin-bottom:15px;">
                                ${(() => {
                                    // Проверяем, есть ли активная печать
                                    if (isPrinting && printStartTime) {
                                        // Вычисляем текущий прогресс
                                        const elapsedMinutes = Math.floor((Date.now() - printStartTime) / 60000);
                                        const currentTime = Math.min(elapsedMinutes, printTotalTime);
                                        const progress = (currentTime / printTotalTime) * 100;
                                        const remainingTime = printTotalTime - currentTime;
                                        
                                        return `
                                            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;border:1px solid rgba(255,255,255,0.1);">
                                                <!-- Заголовок прогресса -->
                                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                                                    <span style="font-size:12px;color:rgba(255,255,255,0.8);">Прогресс печати</span>
                                                    <span style="font-size:12px;color:#fff;font-weight:600;">${remainingTime > 0 ? remainingTime + ' мин.' : 'Завершено'}</span>
                                                </div>
                                                
                                                <!-- Прогресс бар -->
                                                <div style="background:rgba(255,255,255,0.1);border-radius:8px;height:12px;position:relative;overflow:hidden;margin-bottom:8px;">
                                                    <div id="typography-print-progress" style="background:linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);height:100%;border-radius:8px;transition:width 0.3s ease;width:${Math.min(progress, 100)}%;"></div>
                                                </div>
                                                
                                                <!-- Временные метки -->
                                                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                                                    <span style="font-size:10px;color:rgba(255,255,255,0.5);">0 мин.</span>
                                                    <span style="font-size:10px;color:rgba(255,255,255,0.5);">${printTotalTime} мин.</span>
                                                </div>
                                                
                                                <!-- Кнопка просмотра деталей -->
                                                <button onclick="openPrintPanel()" style="width:100%;background:rgba(255,255,255,0.1);border:none;border-radius:8px;padding:8px;color:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                                                    Подробнее
                                                </button>
                                            </div>
                                        `;
                                    } else {
                                        // Если печать не активна, показываем кнопку запуска
                                        return `
                                            <div style="border:2px dashed rgba(255,255,255,0.3);border-radius:12px;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60px;cursor:pointer;" onclick="openPrintPanel()">
                                                <button style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);border:none;color:#000;font-size:20px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">+</button>
                                                <div style="color:rgba(255,255,255,0.8);font-size:12px;text-align:center;">Запустить</div>
                                            </div>
                                        `;
                                    }
                                })()}
                            </div>
                            
                            <!-- Карточка улучшения -->
                            <div style="background:rgba(255,255,255,0.05);border-radius:15px;padding:16px;margin-bottom:15px;border:1px solid rgba(255,255,255,0.1);">
                                <!-- Заголовок -->
                                <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:16px;">Улучшение</div>
                                
                                <!-- Детали улучшения -->
                                <div style="margin-bottom:16px;">
                                    <!-- Ежедневный доход -->
                                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                                        <span style="font-size:12px;color:rgba(255,255,255,0.8);">Ежедневный доход</span>
                                        <span id="daily-income-display" style="font-size:12px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">${(buildingData.income/1000).toFixed(0)}k > ${(buildingData.income * 1.25 / 1000).toFixed(0)}k</span>
                                    </div>
                                    
                                    <!-- Коммунальные расходы -->
                                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                                        <span style="font-size:12px;color:rgba(255,255,255,0.8);">Коммунальные расходы</span>
                                        <span id="utility-costs-display" style="font-size:12px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">-</span>
                                    </div>
                                    
                                    <!-- Время улучшения -->
                                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
                                        <span style="font-size:12px;color:rgba(255,255,255,0.8);">Время улучшения</span>
                                        <span id="upgrade-time-display" style="font-size:12px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">Мгновенно</span>
                                    </div>
                                </div>
                                
                                <!-- Кнопка улучшения -->
                                <button id="upgrade-btn" style="width:100%;background:${playerMoney >= buildingData.upgradeCost ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.3)'};border:none;border-radius:20px;padding:8px 16px;color:#fff;font-size:14px;font-weight:700;cursor:${playerMoney >= buildingData.upgradeCost ? 'pointer' : 'not-allowed'};display:flex;align-items:center;justify-content:space-between;transition:all 0.3s ease;font-family:'Segoe UI',Arial,sans-serif;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.3);" onclick="${playerMoney >= buildingData.upgradeCost ? 'upgradePrint()' : ''}">
                                    <span style="font-size:14px;font-weight:700;color:#fff;">Улучшить</span>
                                    <div style="background:${playerMoney >= buildingData.upgradeCost ? '#000' : 'rgba(255,255,255,0.15)'};border-radius:16px;padding:4px 8px;display:flex;align-items:center;gap:4px;border:${playerMoney >= buildingData.upgradeCost ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.2)'};margin-right:-4px;">
                                        <img src="assets/svg/money-icon.svg" alt="Cost" style="width:14px;height:14px;filter:brightness(1.2);">
                                        <span style="font-size:12px;color:#fff;font-weight:700;" id="print-upgrade-cost">${(buildingData.upgradeCost/1000).toFixed(0)}k</span>
                                    </div>
                                </button>
                            </div>
                            
                            <!-- Дополнительное пространство для прокрутки -->
                            <div style="height:40px;width:100%;"></div>
                        </div>
                    </div>
                </div>
            `;
            
            // Обработчик закрытия
            const closeBtn = panel.querySelector('.building-panel-close');
            closeBtn.addEventListener('click', closeBuildingPanel);
            
            // Обновляем отображение при открытии панели
            updateBuildingPanelDisplay('print');
            
            // Запускаем периодическое обновление отображения
            const updateInterval = setInterval(() => {
                if (document.body.contains(panel)) {
                    // Обновляем данные здания перед отображением
                    updateAllProfits();
                    updateBuildingPanelDisplay('print');
                    
                    // Дополнительно обновляем прогресс печати, если он активен
                    if (isPrinting && printStartTime) {
                        updateTypographyPrintProgress();
                    }
                } else {
                    clearInterval(updateInterval);
                }
            }, 1000);
            
            return panel;
        }
        // Специальная панель для завода - неоново-розовая карточка с SVG
        if (building === 'factory') {
            const buildingData = buildingsData[building] || { level: 1, income: 30000, isOwned: false, purchaseCost: 20000 };
            
            // Если завод не куплен, показываем панель покупки
            if (!buildingData.isOwned) {
                const canAfford = playerMoney >= buildingData.purchaseCost;
                
                panel.innerHTML = `
                    <div style="position:fixed;inset:0;z-index:1500;justify-content:center;align-items:center;font-family:'Segoe UI',Arial,sans-serif;display:flex;">
                        <style>
                            .building-panel-container::-webkit-scrollbar {
                                width: 8px;
                            }
                            .building-panel-container::-webkit-scrollbar-track {
                                background: rgba(255,255,255,0.1);
                                border-radius: 4px;
                            }
                            .building-panel-container::-webkit-scrollbar-thumb {
                                background: rgba(255,255,255,0.3);
                                border-radius: 4px;
                            }
                            .building-panel-container::-webkit-scrollbar-thumb:hover {
                                background: rgba(255,255,255,0.5);
                            }
                        </style>
                        <!-- Контейнер для панели с чисто черным фоном как у нижнего меню -->
                        <div class="building-panel-container" style="width:90%;max-width:420px;max-height:70vh;overflow-y:auto;position:relative;display:flex;flex-direction:column;align-items:center;background:linear-gradient(135deg,rgba(0,0,0,0.95) 0%,rgba(20,20,20,0.95) 100%);border-radius:20px;padding:16px;backdrop-filter:blur(25px);border:2px solid rgba(255,255,255,0.1);box-shadow:0 25px 50px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.05);">
                            <div style="width:100%;background:none;border-radius:16px;padding:0;color:#fff;position:relative;">
                                <!-- Кнопка закрытия -->
                                <button class="building-panel-close" style="position:absolute;top:-2px;right:2px;background:rgba(255,255,255,0.1);border:none;color:white;font-size:16px;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:all 0.2s ease;z-index:10;" onmouseover="this.style.background='rgba(255,255,255,0.2)';this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(255,255,255,0.1)';this.style.transform='scale(1)'">✕</button>
                                
                                <!-- Неоново-розовая карточка завода -->
                                <div style="background:linear-gradient(135deg,#ff6b9d 0%,#c44569 50%,#8b5cf6 100%);border-radius:15px;padding:0;margin:0 0 15px 0;border:1px solid rgba(255,255,255,0.2);box-shadow:0 8px 32px rgba(255,107,157,0.3);position:relative;overflow:hidden;display:flex;align-items:center;height:90px;">
                                    <!-- Левая часть с SVG здания -->
                                    <div style="position:absolute;left:-20px;top:50%;transform:translateY(-50%);width:108px;height:108px;display:flex;align-items:center;justify-content:center;">
                                        <img src="assets/svg/factory-panel/facinf.svg" alt="Factory Info" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));" onerror="this.style.display='none'">
                                    </div>
                                    
                                    <!-- Правая часть с текстом -->
                                    <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-start;height:60px;margin-left:70px;padding:16px;padding-top:8px;">
                                        <!-- Уровень -->
                                        <div class="building-level" style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:2px;">
                                            Ур. 1
                                        </div>
                                        
                                        <!-- Название -->
                                        <div style="font-size:16px;font-weight:700;color:white;margin-bottom:4px;text-shadow:0 2px 4px rgba(0,0,0,0.3);">
                                            Завод
                                        </div>
                                        
                                        <!-- Ежедневный доход -->
                                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                                            <span style="font-size:10px;color:rgba(255,255,255,0.9);">Ежедн. доход:</span>
                                        </div>
                                        <div style="display:flex;align-items:center;gap:6px;">
                                            <img src="assets/svg/money-icon.svg" alt="Money" style="width:13px;height:13px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
                                            <span class="building-income" style="font-size:13px;font-weight:700;color:white;">${(buildingData.income/1000).toFixed(0)}k</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Карточка информации о покупке -->
                                <div style="background:rgba(255,255,255,0.05);border-radius:15px;padding:16px;margin-bottom:15px;border:1px solid rgba(255,255,255,0.1);">
                                    <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:16px;">Информация о здании</div>
                                    
                                    <!-- Детали здания -->
                                    <div style="margin-bottom:16px;">
                                        <!-- Базовый доход -->
                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                                            <span style="font-size:12px;color:rgba(255,255,255,0.8);">Базовый доход</span>
                                            <span style="font-size:12px;color:#fff;font-weight:600;">+${(buildingData.income/1000).toFixed(1)}k/час</span>
                                        </div>
                                        
                                        <!-- Максимум работников -->
                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                                            <span style="font-size:12px;color:rgba(255,255,255,0.8);">Максимум работников</span>
                                            <span style="font-size:12px;color:#fff;font-weight:600;">3</span>
                                        </div>
                                        
                                        <!-- Ваш баланс -->
                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
                                            <span style="font-size:12px;color:rgba(255,255,255,0.8);">Ваш баланс</span>
                                            <div style="display:flex;align-items:center;gap:4px;">
                                                <img src="assets/svg/money-icon.svg" alt="Money" style="width:12px;height:12px;filter:brightness(0.8);">
                                                <span style="font-size:12px;color:${canAfford ? '#4ade80' : '#ef4444'};font-weight:600;">${(playerMoney/1000).toFixed(1)}k</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Кнопка покупки -->
                                    <button id="buy-factory-btn" style="width:100%;background:${canAfford ? '#000000' : '#666666'};border:none;border-radius:25px;padding:10px 20px;color:#fff;font-size:14px;font-weight:600;cursor:${canAfford ? 'pointer' : 'not-allowed'};display:flex;align-items:center;justify-content:space-between;transition:all 0.2s ease;">
                                        <span>Купить</span>
                                        <div style="background:rgba(255,255,255,0.2);border-radius:15px;padding:4px 8px;display:flex;align-items:center;gap:4px;">
                                            <img src="assets/svg/money-icon.svg" alt="Cost" style="width:10px;height:10px;">
                                            <span style="font-size:10px;color:#fff;font-weight:600;">20k</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Обработчик закрытия
                const closeBtn = panel.querySelector('.building-panel-close');
                closeBtn.addEventListener('click', closeBuildingPanel);
                
                // Обработчик покупки
                if (canAfford) {
                    const buyBtn = panel.querySelector('#buy-factory-btn');
                    buyBtn.addEventListener('click', () => {
                        buyFactory();
                    });
                }
                
                return panel;
            }
            // Если завод уже куплен, показываем обычную панель управления
            const factoryDailyIncome = buildingData.income || 30000;
            panel.innerHTML = `
                <div style="position:fixed;inset:0;z-index:1500;justify-content:center;align-items:center;font-family:'Segoe UI',Arial,sans-serif;display:flex;">
                    <style>
                        .building-panel-container::-webkit-scrollbar {
                            width: 8px;
                        }
                        .building-panel-container::-webkit-scrollbar-track {
                            background: rgba(255,255,255,0.1);
                            border-radius: 4px;
                        }
                        .building-panel-container::-webkit-scrollbar-thumb {
                            background: rgba(255,255,255,0.3);
                            border-radius: 4px;
                        }
                        .building-panel-container::-webkit-scrollbar-thumb:hover {
                            background: rgba(255,255,255,0.5);
                        }
                    </style>
                    <!-- Контейнер для панели с чисто черным фоном как у нижнего меню -->
                    <div class="building-panel-container" style="width:90%;max-width:420px;max-height:70vh;overflow-y:auto;position:relative;display:flex;flex-direction:column;align-items:center;background:linear-gradient(135deg,rgba(0,0,0,0.95) 0%,rgba(20,20,20,0.95) 100%);border-radius:20px;padding:16px;backdrop-filter:blur(25px);border:2px solid rgba(255,255,255,0.1);box-shadow:0 25px 50px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.05);">
                        <div style="width:100%;background:none;border-radius:16px;padding:0;color:#fff;position:relative;">
                            <!-- Кнопка закрытия -->
                            <button class="building-panel-close" style="position:absolute;top:-2px;right:2px;background:rgba(255,255,255,0.1);border:none;color:white;font-size:16px;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:all 0.2s ease;z-index:10;" onmouseover="this.style.background='rgba(255,255,255,0.2)';this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(255,255,255,0.1)';this.style.transform='scale(1)'">✕</button>
                            
                            <!-- Неоново-розовая карточка завода -->
                            <div style="background:linear-gradient(135deg,#ff6b9d 0%,#c44569 50%,#8b5cf6 100%);border-radius:15px;padding:0;margin:0 0 15px 0;border:1px solid rgba(255,255,255,0.2);box-shadow:0 8px 32px rgba(255,107,157,0.3);position:relative;overflow:hidden;display:flex;align-items:center;height:90px;">
                                <!-- Левая часть с SVG здания -->
                                <div style="position:absolute;left:-20px;top:50%;transform:translateY(-50%);width:108px;height:108px;display:flex;align-items:center;justify-content:center;">
                                    <img src="assets/svg/factory-panel/facinf.svg" alt="Factory Info" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));" onerror="this.style.display='none'">
                                </div>
                                
                                <!-- Правая часть с текстом -->
                                <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-start;height:60px;margin-left:70px;padding:16px;padding-top:8px;">
                                    <!-- Уровень -->
                                    <div class="building-level" style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:2px;">
                                        Ур. ${buildingData.level || 1}
                                    </div>
                                    
                                    <!-- Название -->
                                    <div style="font-size:16px;font-weight:700;color:white;margin-bottom:4px;text-shadow:0 2px 4px rgba(0,0,0,0.3);">
                                        Завод
                                    </div>
                                    
                                    <!-- Ежедневный доход -->
                                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                                        <span style="font-size:10px;color:rgba(255,255,255,0.9);">Ежедн. доход:</span>
                                    </div>
                                    <div style="display:flex;align-items:center;gap:6px;">
                                        <img src="assets/svg/money-icon.svg" alt="Money" style="width:13px;height:13px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
                                        <span class="building-income" style="font-size:13px;font-weight:700;color:white;">${(buildingData.income/1000).toFixed(0)}k</span>
                                    </div>
                                </div>
                            </div>
                            <!-- Карточка сотрудника -->
                            <div id="employee-card-${building}" style="margin-bottom:15px;">
                                ${(() => {
                                    // Проверяем, есть ли уже назначенный сотрудник для этого здания
                                    const assignedEmployee = Object.keys(hiredEmployees).find(emp => hiredEmployees[emp] === building);
                                    if (assignedEmployee) {
                                        const employeeNames = {
                                            'grinni': 'Грини',
                                            'purpe': 'Пёрпи',
                                            'redjy': 'Реджи',
                                            'blumy': 'Блуми'
                                        };
                                        const employeeImages = {
                                            'grinni': 'assets/svg/hiring-forpanel/green.svg',
                                            'purpe': 'assets/svg/hiring-forpanel/purpe.svg',
                                            'redjy': 'assets/svg/hiring-forpanel/redjy.svg',
                                            'blumy': 'assets/svg/hiring-forpanel/blumy.svg'
                                        };
                                        const employeeSkills = {
                                            'grinni': 'Бухгалтер',
                                            'purpe': 'Менеджер', 
                                            'redjy': 'Калькулятор',
                                            'blumy': 'Аналитик'
                                        };
                                        const employeeRarities = {
                                            'grinni': 3,
                                            'purpe': 4, 
                                            'redjy': 4,
                                            'blumy': 5
                                        };
                                        return `
                                            <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                                                <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%); border-radius: 12px; padding: 8px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); border: 1px solid rgba(255,255,255,0.2); flex: 1;">
                                                    <img src="${employeeImages[assignedEmployee]}" alt="${employeeNames[assignedEmployee]}" style="width: 80px; height: 80px; border-radius: 8px;">
                                                    <div style="flex: 1;">
                                                        <div style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 4px;">${employeeNames[assignedEmployee]}</div>
                                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                                            <span style="font-size: 11px; color: rgba(255,255,255,0.8);">Уровень</span>
                                                            <span style="font-size: 11px; color: #fff; font-weight: 400;">1</span>
                                                        </div>
                                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                                            <span style="font-size: 11px; color: rgba(255,255,255,0.8);">Навык</span>
                                                            <span style="font-size: 11px; color: #fff; font-weight: 400;">${employeeSkills[assignedEmployee]}</span>
                                                        </div>
                                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                                            <span style="font-size: 11px; color: rgba(255,255,255,0.8);">Редкость</span>
                                                            <div style="display: flex; gap: 2px;">
                                                                ${Array(5).fill().map((_, i) => 
                                                                    `<span style="color: ${i < employeeRarities[assignedEmployee] ? '#fff' : 'rgba(255,255,255,0.3)'}; font-size: 11px;">★</span>`
                                                                ).join('')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onclick="fireEmployee('${building}')" style="background: #3F2E4F; border: none; border-radius: 8px; padding: 12px 6px; color: #fff; font-size: 10px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(63, 46, 79, 0.3); transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; min-width: 30px; min-height: 100px; justify-content: center; writing-mode: vertical-lr; text-orientation: mixed;">
                                                    <span style="writing-mode: vertical-lr; text-orientation: mixed; font-size: 9px; letter-spacing: 1px;">Уволить</span>
                                                </button>
                                            </div>
                                        `;
                                    } else {
                                        return `
                                            <div style="border:2px dashed rgba(255,255,255,0.3);border-radius:12px;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60px;cursor:pointer;" onclick="openEmployeeMenu('${building}')">
                                    <button style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);border:none;color:#000;font-size:20px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">+</button>
                                    <div style="color:rgba(255,255,255,0.8);font-size:12px;text-align:center;">Назначить сотрудника</div>
                                </div>
                                        `;
                                    }
                                })()}
                            </div>
                            
                            <!-- Карточка улучшения -->
                            <div style="background:rgba(255,255,255,0.05);border-radius:15px;padding:16px;margin-bottom:15px;border:1px solid rgba(255,255,255,0.1);">
                                <!-- Заголовок -->
                                <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:16px;">Улучшение</div>
                                
                                <!-- Детали улучшения -->
                                <div style="margin-bottom:16px;">
                                    <!-- Ежедневный доход -->
                                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                                        <span style="font-size:12px;color:rgba(255,255,255,0.8);">Ежедневный доход</span>
                                        <span id="daily-income-display" style="font-size:12px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">${(buildingData.income/1000).toFixed(0)}k > ${(buildingData.income * 1.25 / 1000).toFixed(0)}k</span>
                                    </div>
                                    
                                    <!-- Коммунальные расходы -->
                                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                                        <span style="font-size:12px;color:rgba(255,255,255,0.8);">Коммунальные расходы</span>
                                        <span id="utility-costs-display" style="font-size:12px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">-</span>
                                    </div>
                                    
                                    <!-- Время улучшения -->
                                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
                                        <span style="font-size:12px;color:rgba(255,255,255,0.8);">Время улучшения</span>
                                        <span id="upgrade-time-display" style="font-size:12px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">Мгновенно</span>
                                    </div>
                                </div>
                                
                                <!-- Кнопка улучшения -->
                                <button id="upgrade-btn" style="width:100%;background:${playerMoney >= buildingData.upgradeCost ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.3)'};border:none;border-radius:20px;padding:8px 16px;color:#fff;font-size:14px;font-weight:700;cursor:${playerMoney >= buildingData.upgradeCost ? 'pointer' : 'not-allowed'};display:flex;align-items:center;justify-content:space-between;transition:all 0.3s ease;font-family:'Segoe UI',Arial,sans-serif;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.3);" onclick="${playerMoney >= buildingData.upgradeCost ? 'upgradeFactory()' : ''}">
                                    <span style="font-size:14px;font-weight:700;color:#fff;">Улучшить</span>
                                    <div style="background:${playerMoney >= buildingData.upgradeCost ? '#000' : 'rgba(255,255,255,0.15)'};border-radius:16px;padding:4px 8px;display:flex;align-items:center;gap:4px;border:${playerMoney >= buildingData.upgradeCost ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.2)'};margin-right:-4px;">
                                        <img src="assets/svg/money-icon.svg" alt="Cost" style="width:14px;height:14px;filter:brightness(1.2);">
                                        <span style="font-size:12px;color:#fff;font-weight:700;" id="factory-upgrade-cost">${(buildingData.upgradeCost/1000).toFixed(0)}k</span>
                                    </div>
                                </button>
                            </div>
                            
                            <!-- Дополнительное пространство для прокрутки -->
                            <div style="height:40px;width:100%;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Обработчик закрытия
            const closeBtn = panel.querySelector('.building-panel-close');
            closeBtn.addEventListener('click', closeBuildingPanel);
            
            // Обновляем отображение при открытии панели
            updateBuildingPanelDisplay('factory');
            
            // Запускаем периодическое обновление отображения
            const updateInterval = setInterval(() => {
                if (document.body.contains(panel)) {
                    // Обновляем данные здания перед отображением
                    updateAllProfits();
                    updateBuildingPanelDisplay('factory');
                } else {
                    clearInterval(updateInterval);
                }
            }, 1000);
            
            return panel;
        }
        // Специальная панель для почты - неоново-розовая карточка с SVG
        if (building === 'storage') {
            const buildingData = buildingsData[building] || { level: 1, income: 3000, isOwned: false, purchaseCost: 15000 };
            
            // Если почта не куплена, показываем панель покупки
            if (!buildingData.isOwned) {
                const canAfford = playerMoney >= buildingData.purchaseCost;
                
                panel.innerHTML = `
                    <div style="position:fixed;inset:0;z-index:1500;justify-content:center;align-items:center;font-family:'Segoe UI',Arial,sans-serif;display:flex;">
                        <style>
                            .building-panel-container::-webkit-scrollbar {
                                width: 8px;
                            }
                            .building-panel-container::-webkit-scrollbar-track {
                                background: rgba(255,255,255,0.1);
                                border-radius: 4px;
                            }
                            .building-panel-container::-webkit-scrollbar-thumb {
                                background: rgba(255,255,255,0.3);
                                border-radius: 4px;
                            }
                            .building-panel-container::-webkit-scrollbar-thumb:hover {
                                background: rgba(255,255,255,0.5);
                            }
                        </style>
                        <!-- Контейнер для панели с чисто черным фоном как у нижнего меню -->
                        <div class="building-panel-container" style="width:90%;max-width:420px;max-height:70vh;overflow-y:auto;position:relative;display:flex;flex-direction:column;align-items:center;background:linear-gradient(135deg,rgba(0,0,0,0.95) 0%,rgba(20,20,20,0.95) 100%);border-radius:20px;padding:16px;backdrop-filter:blur(25px);border:2px solid rgba(255,255,255,0.1);box-shadow:0 25px 50px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.05);">
                            <div style="width:100%;background:none;border-radius:16px;padding:0;color:#fff;position:relative;">
                                <!-- Кнопка закрытия -->
                                <button class="building-panel-close" style="position:absolute;top:-2px;right:2px;background:rgba(255,255,255,0.1);border:none;color:white;font-size:16px;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:all 0.2s ease;z-index:10;" onmouseover="this.style.background='rgba(255,255,255,0.2)';this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(255,255,255,0.1)';this.style.transform='scale(1)'">✕</button>
                                
                                <!-- Неоново-розовая карточка почты -->
                                <div style="background:linear-gradient(135deg,#ff6b9d 0%,#c44569 50%,#8b5cf6 100%);border-radius:15px;padding:0;margin:0 0 15px 0;border:1px solid rgba(255,255,255,0.2);box-shadow:0 8px 32px rgba(255,107,157,0.3);position:relative;overflow:hidden;display:flex;align-items:center;height:90px;">
                                    <!-- Левая часть с SVG здания -->
                                    <div style="position:absolute;left:-20px;top:50%;transform:translateY(-50%);width:108px;height:108px;display:flex;align-items:center;justify-content:center;">
                                        <img src="assets/svg/mail-panel/Image.svg" alt="Mail Info" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));" onerror="this.style.display='none'">
                                    </div>
                                    
                                    <!-- Правая часть с текстом -->
                                    <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-start;height:60px;margin-left:70px;padding:16px;padding-top:8px;">
                                        <!-- Уровень -->
                                        <div class="building-level" style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:2px;">
                                            Ур. 1
                                        </div>
                                        
                                        <!-- Название -->
                                        <div style="font-size:16px;font-weight:700;color:white;margin-bottom:4px;text-shadow:0 2px 4px rgba(0,0,0,0.3);">
                                            Почта
                                        </div>
                                        
                                        <!-- Ежедневный доход -->
                                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                                            <span style="font-size:10px;color:rgba(255,255,255,0.9);">Ежедн. доход:</span>
                                        </div>
                                        <div style="display:flex;align-items:center;gap:6px;">
                                            <img src="assets/svg/money-icon.svg" alt="Money" style="width:13px;height:13px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
                                            <span class="building-income" style="font-size:13px;font-weight:700;color:white;">${(buildingData.income/1000).toFixed(0)}k</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Карточка информации о покупке -->
                                <div style="background:rgba(255,255,255,0.05);border-radius:15px;padding:16px;margin-bottom:15px;border:1px solid rgba(255,255,255,0.1);">
                                    <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:16px;">Информация о здании</div>
                                    
                                    <!-- Детали здания -->
                                    <div style="margin-bottom:16px;">
                                        <!-- Базовый доход -->
                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                                            <span style="font-size:12px;color:rgba(255,255,255,0.8);">Базовый доход</span>
                                            <span style="font-size:12px;color:#fff;font-weight:600;">+${(buildingData.income/1000).toFixed(1)}k/час</span>
                                        </div>
                                        
                                        <!-- Максимум работников -->
                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                                            <span style="font-size:12px;color:rgba(255,255,255,0.8);">Максимум работников</span>
                                            <span style="font-size:12px;color:#fff;font-weight:600;">2</span>
                                        </div>
                                        
                                        <!-- Ваш баланс -->
                                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
                                            <span style="font-size:12px;color:rgba(255,255,255,0.8);">Ваш баланс</span>
                                            <div style="display:flex;align-items:center;gap:4px;">
                                                <img src="assets/svg/money-icon.svg" alt="Money" style="width:12px;height:12px;filter:brightness(0.8);">
                                                <span style="font-size:12px;color:${canAfford ? '#4ade80' : '#ef4444'};font-weight:600;">${(playerMoney/1000).toFixed(1)}k</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Кнопка покупки -->
                                    <button id="buy-storage-btn" style="width:100%;background:${canAfford ? '#000000' : '#666666'};border:none;border-radius:25px;padding:10px 20px;color:#fff;font-size:14px;font-weight:600;cursor:${canAfford ? 'pointer' : 'not-allowed'};display:flex;align-items:center;justify-content:space-between;transition:all 0.2s ease;">
                                        <span>Купить</span>
                                        <div style="background:rgba(255,255,255,0.2);border-radius:15px;padding:4px 8px;display:flex;align-items:center;gap:4px;">
                                            <img src="assets/svg/money-icon.svg" alt="Cost" style="width:10px;height:10px;">
                                            <span style="font-size:10px;color:#fff;font-weight:600;">15k</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Обработчик закрытия
                const closeBtn = panel.querySelector('.building-panel-close');
                closeBtn.addEventListener('click', closeBuildingPanel);
                
                // Обработчик покупки
                if (canAfford) {
                    const buyBtn = panel.querySelector('#buy-storage-btn');
                    buyBtn.addEventListener('click', () => {
                        buyStorage();
                    });
                }
                
                return panel;
            }
            // Если почта уже куплена, показываем обычную панель управления
            const storageDailyIncome = buildingData.income || 3000;
            panel.innerHTML = `
                <div style="position:fixed;inset:0;z-index:1500;justify-content:center;align-items:center;font-family:'Segoe UI',Arial,sans-serif;display:flex;">
                    <style>
                        .building-panel-container::-webkit-scrollbar {
                            width: 8px;
                        }
                        .building-panel-container::-webkit-scrollbar-track {
                            background: rgba(255,255,255,0.1);
                            border-radius: 4px;
                        }
                        .building-panel-container::-webkit-scrollbar-thumb {
                            background: rgba(255,255,255,0.3);
                            border-radius: 4px;
                        }
                        .building-panel-container::-webkit-scrollbar-thumb:hover {
                            background: rgba(255,255,255,0.5);
                        }
                    </style>
                    <!-- Контейнер для панели с чисто черным фоном как у нижнего меню -->
                    <div class="building-panel-container" style="width:90%;max-width:420px;max-height:70vh;overflow-y:auto;position:relative;display:flex;flex-direction:column;align-items:center;background:linear-gradient(135deg,rgba(0,0,0,0.95) 0%,rgba(20,20,20,0.95) 100%);border-radius:20px;padding:16px;backdrop-filter:blur(25px);border:2px solid rgba(255,255,255,0.1);box-shadow:0 25px 50px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.05);">
                        <div style="width:100%;background:none;border-radius:16px;padding:0;color:#fff;position:relative;">
                            <!-- Кнопка закрытия -->
                            <button class="building-panel-close" style="position:absolute;top:-2px;right:2px;background:rgba(255,255,255,0.1);border:none;color:white;font-size:16px;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:all 0.2s ease;z-index:10;" onmouseover="this.style.background='rgba(255,255,255,0.2)';this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(255,255,255,0.1)';this.style.transform='scale(1)'">✕</button>
                            
                            <!-- Неоново-розовая карточка почты -->
                            <div style="background:linear-gradient(135deg,#ff6b9d 0%,#c44569 50%,#8b5cf6 100%);border-radius:15px;padding:0;margin:0 0 15px 0;border:1px solid rgba(255,255,255,0.2);box-shadow:0 8px 32px rgba(255,107,157,0.3);position:relative;overflow:hidden;display:flex;align-items:center;height:90px;">
                                <!-- Левая часть с SVG здания -->
                                <div style="position:absolute;left:-20px;top:50%;transform:translateY(-50%);width:108px;height:108px;display:flex;align-items:center;justify-content:center;">
                                    <img src="assets/svg/mail-panel/Image.svg" alt="Mail Info" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));" onerror="this.style.display='none'">
                                </div>
                                
                                <!-- Правая часть с текстом -->
                                <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-start;height:60px;margin-left:70px;padding:16px;padding-top:8px;">
                                    <!-- Уровень -->
                                    <div class="building-level" style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:2px;">
                                        Ур. ${buildingData.level || 1}
                                    </div>
                                    
                                    <!-- Название -->
                                    <div style="font-size:16px;font-weight:700;color:white;margin-bottom:4px;text-shadow:0 2px 4px rgba(0,0,0,0.3);">
                                        Почта
                                    </div>
                                    
                                    <!-- Ежедневный доход -->
                                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                                        <span style="font-size:10px;color:rgba(255,255,255,0.9);">Ежедн. доход:</span>
                                    </div>
                                    <div style="display:flex;align-items:center;gap:6px;">
                                        <img src="assets/svg/money-icon.svg" alt="Money" style="width:13px;height:13px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
                                        <span class="building-income" style="font-size:13px;font-weight:700;color:white;">${(buildingData.income/1000).toFixed(0)}k</span>
                                    </div>
                                </div>
                            </div>
                            <!-- Карточка сотрудника -->
                            <div id="employee-card-${building}" style="margin-bottom:15px;">
                                ${(() => {
                                    // Проверяем, есть ли уже назначенный сотрудник для этого здания
                                    const assignedEmployee = Object.keys(hiredEmployees).find(emp => hiredEmployees[emp] === building);
                                    if (assignedEmployee) {
                                        const employeeNames = {
                                            'grinni': 'Грини',
                                            'purpe': 'Пёрпи',
                                            'redjy': 'Реджи',
                                            'blumy': 'Блуми'
                                        };
                                        const employeeImages = {
                                            'grinni': 'assets/svg/hiring-forpanel/green.svg',
                                            'purpe': 'assets/svg/hiring-forpanel/purpe.svg',
                                            'redjy': 'assets/svg/hiring-forpanel/redjy.svg',
                                            'blumy': 'assets/svg/hiring-forpanel/blumy.svg'
                                        };
                                        const employeeSkills = {
                                            'grinni': 'Бухгалтер',
                                            'purpe': 'Менеджер', 
                                            'redjy': 'Калькулятор',
                                            'blumy': 'Аналитик'
                                        };
                                        const employeeRarities = {
                                            'grinni': 3,
                                            'purpe': 4, 
                                            'redjy': 4,
                                            'blumy': 5
                                        };
                                        return `
                                            <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                                                <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%); border-radius: 12px; padding: 8px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); border: 1px solid rgba(255,255,255,0.2); flex: 1;">
                                                    <img src="${employeeImages[assignedEmployee]}" alt="${employeeNames[assignedEmployee]}" style="width: 80px; height: 80px; border-radius: 8px;">
                                                    <div style="flex: 1;">
                                                        <div style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 4px;">${employeeNames[assignedEmployee]}</div>
                                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                                            <span style="font-size: 11px; color: rgba(255,255,255,0.8);">Уровень</span>
                                                            <span style="font-size: 11px; color: #fff; font-weight: 400;">1</span>
                                                        </div>
                                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                                            <span style="font-size: 11px; color: rgba(255,255,255,0.8);">Навык</span>
                                                            <span style="font-size: 11px; color: #fff; font-weight: 400;">${employeeSkills[assignedEmployee]}</span>
                                                        </div>
                                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                                            <span style="font-size: 11px; color: rgba(255,255,255,0.8);">Редкость</span>
                                                            <div style="display: flex; gap: 2px;">
                                                                ${Array(5).fill().map((_, i) => 
                                                                    `<span style="color: ${i < employeeRarities[assignedEmployee] ? '#fff' : 'rgba(255,255,255,0.3)'}; font-size: 11px;">★</span>`
                                                                ).join('')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onclick="fireEmployee('${building}')" style="background: #3F2E4F; border: none; border-radius: 8px; padding: 12px 6px; color: #fff; font-size: 10px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(63, 46, 79, 0.3); transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; min-width: 30px; min-height: 100px; justify-content: center; writing-mode: vertical-lr; text-orientation: mixed;">
                                                    <span style="writing-mode: vertical-lr; text-orientation: mixed; font-size: 9px; letter-spacing: 1px;">Уволить</span>
                                                </button>
                                            </div>
                                        `;
                                    } else {
                                        return `
                                            <div style="border:2px dashed rgba(255,255,255,0.3);border-radius:12px;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60px;cursor:pointer;" onclick="openEmployeeMenu('${building}')">
                                    <button style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);border:none;color:#000;font-size:20px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">+</button>
                                    <div style="color:rgba(255,255,255,0.8);font-size:12px;text-align:center;">Назначить сотрудника</div>
                                </div>
                                        `;
                                    }
                                })()}
                            </div>
                            
                            <!-- Кнопки хранилища и доставки -->
                            <div style="margin-bottom:15px;display:flex;gap:15px;">
                                <!-- Кнопка доставки -->
                                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:12px;border:1px solid rgba(255,255,255,0.15);cursor:pointer;transition:all 0.3s ease;flex:1;position:relative;min-height:80px;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'" onclick="openDeliveryMenu()">
                                    <div style="position:relative;height:100%;">
                                        <!-- Название -->
                                        <div style="font-size:12px;color:#fff;margin-bottom:8px;font-weight:500;">Доставка</div>
                                        
                                        <!-- Область с пунктирной границей -->
                                        <div style="border:2px dashed rgba(255,255,255,0.3);border-radius:8px;padding:8px;background:rgba(255,255,255,0.05);display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:50px;">
                                            <!-- Круглая кнопка с плюсом -->
                                            <div style="width:24px;height:24px;border-radius:50%;background:#ccc;display:flex;align-items:center;justify-content:center;margin-bottom:4px;">
                                                <span style="color:#000;font-size:16px;font-weight:bold;">+</span>
                                            </div>
                                            <!-- Текст "Отправить" -->
                                            <div style="font-size:10px;color:#fff;text-align:center;">Отправить</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Кнопка хранилища -->
                                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:12px;border:1px solid rgba(255,255,255,0.15);cursor:pointer;transition:all 0.3s ease;flex:1;position:relative;min-height:80px;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                                    <div style="position:relative;height:100%;">
                                        <!-- 3D иконка сейфа (фон) -->
                                        <div style="position:absolute;top:0;right:-20px;display:flex;align-items:center;justify-content:flex-end;z-index:1;">
                                            <img src="assets/svg/mail-panel/safe.svg" alt="Хранилище" style="width:112px;height:112px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));opacity:0.4;">
                                        </div>
                                        
                                        <!-- Текст поверх иконки -->
                                        <div style="position:relative;z-index:2;">
                                            <!-- Название -->
                                            <div style="font-size:13px;color:#fff;margin-bottom:8px;font-weight:500;">Хранилище</div>
                                            
                                            <!-- Процент -->
                                            <div id="storage-card-percent" style="font-size:20px;color:#ff6b9d;font-weight:700;margin-bottom:4px;">100%</div>
                                            
                                            <!-- Значение -->
                                            <div id="storage-card-amt" style="font-size:12px;color:#fff;margin-bottom:8px;">900 / 900</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Карточка улучшения -->
                            <div style="background:rgba(255,255,255,0.05);border-radius:15px;padding:16px;margin-bottom:15px;border:1px solid rgba(255,255,255,0.1);">
                                <!-- Заголовок -->
                                <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:16px;">Улучшение</div>
                                
                                <!-- Детали улучшения -->
                                <div style="margin-bottom:16px;">
                                    <!-- Ежедневный доход -->
                                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                                        <span style="font-size:12px;color:rgba(255,255,255,0.8);">Ежедневный доход</span>
                                        <span id="daily-income-display" style="font-size:12px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">${(buildingData.income/1000).toFixed(0)}k > ${(buildingData.income * 1.25 / 1000).toFixed(0)}k</span>
                                    </div>
                                    
                                    <!-- Коммунальные расходы -->
                                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                                        <span style="font-size:12px;color:rgba(255,255,255,0.8);">Коммунальные расходы</span>
                                        <span id="utility-costs-display" style="font-size:12px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">-</span>
                                    </div>
                                    
                                    <!-- Время улучшения -->
                                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
                                        <span style="font-size:12px;color:rgba(255,255,255,0.8);">Время улучшения</span>
                                        <span id="upgrade-time-display" style="font-size:12px;font-weight:600;font-family:'Segoe UI',Arial,sans-serif;">Мгновенно</span>
                                    </div>
                                </div>
                                
                                <!-- Кнопка улучшения -->
                                <button id="upgrade-btn" style="width:100%;background:${playerMoney >= buildingData.upgradeCost ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.3)'};border:none;border-radius:20px;padding:8px 16px;color:#fff;font-size:14px;font-weight:700;cursor:${playerMoney >= buildingData.upgradeCost ? 'pointer' : 'not-allowed'};display:flex;align-items:center;justify-content:space-between;transition:all 0.3s ease;font-family:'Segoe UI',Arial,sans-serif;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.3);" onclick="${playerMoney >= buildingData.upgradeCost ? 'upgradeStorage()' : ''}">
                                    <span style="font-size:14px;font-weight:700;color:#fff;">Улучшить</span>
                                    <div style="background:${playerMoney >= buildingData.upgradeCost ? '#000' : 'rgba(255,255,255,0.15)'};border-radius:16px;padding:4px 8px;display:flex;align-items:center;gap:4px;border:${playerMoney >= buildingData.upgradeCost ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.2)'};margin-right:-4px;">
                                        <img src="assets/svg/money-icon.svg" alt="Cost" style="width:14px;height:14px;filter:brightness(1.2);">
                                        <span style="font-size:12px;color:#fff;font-weight:700;" id="storage-upgrade-cost">${(buildingData.upgradeCost/1000).toFixed(0)}k</span>
                                    </div>
                                </button>
                            </div>
                            
                            <!-- Дополнительное пространство для прокрутки -->
                            <div style="height:40px;width:100%;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            // Обработчик закрытия
            const closeBtn = panel.querySelector('.building-panel-close');
            closeBtn.addEventListener('click', closeBuildingPanel);
            
            // Обновляем отображение при открытии панели
            updateBuildingPanelDisplay('storage');
            
            // Обновляем UI хранилища при открытии панели
            if (window.updateStorageUI) {
                window.updateStorageUI(panel); // Передаем элемент панели
            }
            
            // Запускаем периодическое обновление отображения
            const updateInterval = setInterval(() => {
                if (document.body.contains(panel)) {
                    // Обновляем данные здания перед отображением
                    updateAllProfits();
                    updateBuildingPanelDisplay('storage');
                    
                    // Обновляем UI хранилища
                    if (window.updateStorageUI) {
                        window.updateStorageUI(panel); // Передаем элемент панели
                    }
                } else {
                    clearInterval(updateInterval);
                }
            }, 1000);
            
            return panel;
        }
        
        // Если здание не куплено, показываем панель покупки
        if (!buildingData.isOwned) {
            const purchaseCostFormatted = (buildingData.purchaseCost / 1000) + 'k';
            const canAfford = playerMoney >= buildingData.purchaseCost;
            
            panel.innerHTML = `
                <div class="building-panel-header">
                    <div class="building-panel-title">
                        <span class="building-icon">${icon}</span>
                        <h2>${buildingData.name}</h2>
                    </div>
                    <button class="building-panel-close">✕</button>
                </div>
                
                <div class="building-panel-section">
                    <h3>📊 Информация о здании</h3>
                    <div class="building-panel-info">
                        <div class="building-panel-info-row">
                            <span>💰 Базовый доход:</span>
                            <span class="building-panel-info-value">+${(buildingData.income/1000).toFixed(1)}k/час</span>
                        </div>
                        <div class="building-panel-info-row">
                            <span>👷 Максимум работников:</span>
                            <span class="building-panel-info-value">${buildingData.maxWorkers}</span>
                        </div>
                        <div class="building-panel-info-row">
                            <span>💳 Ваш баланс:</span>
                            <span class="building-panel-info-value ${canAfford ? 'success' : 'error'}">${(playerMoney/1000).toFixed(1)}k 💰</span>
                        </div>
                    </div>
                </div>
                
                <div class="building-panel-section">
                    <h3>🎯 Действия</h3>
                    <div class="building-panel-actions">
                        <button class="building-panel-btn buy ${canAfford ? 'enabled' : 'disabled'}" 
                                data-building="${building}" 
                                data-cost="${buildingData.purchaseCost}"
                                ${!canAfford ? 'disabled' : ''}>
                            <span class="btn-icon">🛒</span>
                            <span class="btn-text">Купить за ${purchaseCostFormatted}</span>
                            ${!canAfford ? '<span class="btn-hint">Недостаточно средств</span>' : ''}
                        </button>
                    </div>
                </div>
            `;
            
            // Обработчики событий для панели покупки
            const closeBtn = panel.querySelector('.building-panel-close');
            closeBtn.addEventListener('click', closeBuildingPanel);
            
            const buyBtn = panel.querySelector('.building-panel-btn.buy');
            if (canAfford) {
                buyBtn.addEventListener('click', () => {
                    handleBuyBuilding(building, buildingData.name);
                });
            }
            
            return panel;
        }
        
        // Если здание куплено, показываем обычную панель управления
        const canUpgrade = playerMoney >= buildingData.upgradeCost;
        const canHire = buildingData.workers < buildingData.maxWorkers && playerMoney >= 5000;
        
        // Форматируем стоимость улучшения для отображения
        const upgradeCostFormatted = (buildingData.upgradeCost / 1000) + 'k';
        
        panel.innerHTML = `
            <div class="building-panel-header">
                <div class="building-panel-title">
                    <span class="building-icon">${icon}</span>
                    <h2>${buildingData.name}</h2>
                </div>
                <button class="building-panel-close">✕</button>
            </div>
            
            <div class="building-panel-section">
                <h3>📊 Статистика</h3>
                <div class="building-panel-info">
                    <div class="building-panel-info-row">
                        <span>🏆 Уровень:</span>
                        <span class="building-panel-info-value">${buildingData.level}</span>
                    </div>
                    <div class="building-panel-info-row">
                        <span>👷 Работники:</span>
                        <span class="building-panel-info-value">${buildingData.workers}/${buildingData.maxWorkers}</span>
                    </div>
                </div>
            </div>
            
            <div class="building-panel-section">
                <h3>🎯 Управление</h3>
                <div class="building-panel-actions">
                    <button class="building-panel-btn upgrade ${canUpgrade ? 'enabled' : 'disabled'}" 
                            data-building="${building}" 
                            data-cost="${buildingData.upgradeCost}"
                            ${!canUpgrade ? 'disabled' : ''}>
                        <span class="btn-icon">🏗️</span>
                        <span class="btn-text">Улучшить (${upgradeCostFormatted})</span>
                        ${!canUpgrade ? '<span class="btn-hint">Недостаточно средств</span>' : ''}
                    </button>
                    
                                            <button class="building-panel-btn worker ${canHire ? 'enabled' : 'disabled'}" 
                                data-building="${building}" 
                                data-workers="${buildingData.workers}" 
                                data-max="${buildingData.maxWorkers}"
                                ${!canHire ? 'disabled' : ''}>
                            <span class="btn-icon">👷</span>
                            <span class="btn-text">Нанять (${buildingData.workers < buildingData.maxWorkers ? '5k' : 'Макс'})</span>
                            ${!canHire ? '<span class="btn-hint">' + (buildingData.workers >= buildingData.maxWorkers ? 'Достигнут максимум' : 'Недостаточно средств') + '</span>' : ''}
                        </button>
                </div>
            </div>
            <!-- Карточка сотрудника -->
            <div class="building-panel-section">
                <div id="employee-card-${building}" style="margin-bottom:15px;">
                    ${(() => {
                        // Проверяем, есть ли уже назначенный сотрудник для этого здания
                        const assignedEmployee = Object.keys(hiredEmployees).find(emp => hiredEmployees[emp] === building);
                        if (assignedEmployee) {
                            const employeeNames = {
                                'grinni': 'Грини',
                                'purpe': 'Пёрпи',
                                'redjy': 'Реджи',
                                'blumy': 'Блуми'
                            };
                            const employeeImages = {
                                'grinni': 'assets/svg/hiring-forpanel/green.svg',
                                'purpe': 'assets/svg/hiring-forpanel/purpe.svg',
                                'redjy': 'assets/svg/hiring-forpanel/redjy.svg',
                                'blumy': 'assets/svg/hiring-forpanel/blumy.svg'
                            };
                            return `
                                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 12px;">
                                    <img src="${employeeImages[assignedEmployee]}" alt="${employeeNames[assignedEmployee]}" style="width: 50px; height: 50px; border-radius: 8px;">
                                    <div style="flex: 1;">
                                        <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 4px;">${employeeNames[assignedEmployee]}</div>
                                        <div style="font-size: 12px; color: rgba(255,255,255,0.7);">Назначен</div>
                                    </div>
                                </div>
                            `;
                        } else {
                            return `
                                <div style="border:2px dashed rgba(255,255,255,0.3);border-radius:12px;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60px;cursor:pointer;" onclick="openEmployeeMenu('${building}')">
                                    <button style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.2);border:none;color:#000;font-size:20px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">+</button>
                                    <div style="color:rgba(255,255,255,0.8);font-size:12px;text-align:center;">Назначить сотрудника</div>
                                </div>
                            `;
                        }
                    })()}
                </div>
            </div>
        `;
        
        // Обработчики событий
        const closeBtn = panel.querySelector('.building-panel-close');
        closeBtn.addEventListener('click', closeBuildingPanel);
        
        // Обработчики для кнопок действий
        const upgradeBtn = panel.querySelector('.building-panel-btn.upgrade');
        const workerBtn = panel.querySelector('.building-panel-btn.worker');
        
        if (upgradeBtn && canUpgrade) {
            upgradeBtn.addEventListener('click', () => {
                handleUpgrade(building, buildingData.name);
            });
        }
        
        if (workerBtn && canHire) {
            workerBtn.addEventListener('click', () => {
                handleHireWorker(building, buildingData.name);
            });
        }
        
        return panel;
    }
    // === ФУНКЦИИ ОБРАБОТКИ ДЕЙСТВИЙ ===
    // Функция покупки здания
    function handleBuyBuilding(buildingType, buildingName) {
        const building = buildingsData[buildingType];
        const playerMoney = getPlayerMoney();
        
        if (playerMoney >= building.purchaseCost) {
            // Покупаем здание
            building.isOwned = true;
            building.lastCollectTime = Date.now();
            building.accumulatedProfit = 0;
            
            // Списываем деньги
            setPlayerMoney(playerMoney - building.purchaseCost);
            
            // Сохраняем данные
            saveBuildingsData();
            
            // Обновляем индикаторы
            updateProfitIndicators();
            
            // Обновляем панель
            closeBuildingPanel();
            openBuildingPanel(buildingType, buildingName);
            
            showNotification(`🎉 Поздравляем! Вы купили ${buildingName}!`, 'success');
            
            // Показываем дополнительную информацию
            setTimeout(() => {
                showNotification(`💰 ${buildingName} теперь приносит +${(building.income/1000).toFixed(1)}k в час!`, 'info');
            }, 2000);
        } else {
            const needed = building.purchaseCost - playerMoney;
            const neededFormatted = (needed / 1000).toFixed(1) + 'k';
            showNotification(`❌ Недостаточно денег! Нужно еще ${neededFormatted}`, 'error');
        }
    }
    
    function handleUpgrade(buildingType, buildingName) {
        const building = buildingsData[buildingType];
        const playerMoney = getPlayerMoney();
        
        if (playerMoney >= building.upgradeCost) {
            // Улучшаем здание
            building.level++;
            building.income = Math.floor(building.income * 1.5); // Увеличиваем доход на 50%
            building.upgradeCost = Math.floor(building.upgradeCost * 1.8); // Увеличиваем стоимость улучшения
            building.maxWorkers = Math.min(building.maxWorkers + 1, 10); // Увеличиваем максимум работников
            
            // Списываем деньги
            setPlayerMoney(playerMoney - building.upgradeCost);
            
            // Сохраняем данные
            saveBuildingsData();
            
            // Обновляем индикаторы
            updateProfitIndicators();
            
            // Обновляем панель
            closeBuildingPanel();
            openBuildingPanel(buildingType, buildingName);
            
            showNotification(`🏗️ ${buildingName} улучшена до уровня ${building.level}!`, 'success');
            
            // Показываем информацию о новом доходе
            setTimeout(() => {
                showNotification(`💰 Новый доход: +${(building.income/1000).toFixed(1)}k/час`, 'info');
            }, 2000);
        } else {
            const needed = building.upgradeCost - playerMoney;
            const neededFormatted = (needed / 1000).toFixed(1) + 'k';
            showNotification(`❌ Недостаточно денег для улучшения! Нужно еще ${neededFormatted}`, 'error');
        }
    }
    
    function handleIncome(buildingType, buildingName) {
        const building = buildingsData[buildingType];
        const accumulatedProfit = calculateAccumulatedProfit(buildingType);
        const playerMoney = getPlayerMoney();
        
        if (accumulatedProfit > 0) {
            // Забираем накопленную прибыль
            setPlayerMoney(playerMoney + accumulatedProfit);
            
            // Сбрасываем накопленную прибыль
            building.accumulatedProfit = 0;
            building.lastCollectTime = Date.now();
            
            saveBuildingsData();
            updateProfitIndicators();
            
            showNotification(`💰 Получен доход: +${(accumulatedProfit/1000).toFixed(1)}k`, 'success');
        } else {
            showNotification('❌ Нет накопленной прибыли для сбора!', 'error');
        }
    }
    function handleHireWorker(buildingType, buildingName) {
        const building = buildingsData[buildingType];
        const playerMoney = getPlayerMoney();
        const workerCost = 5000;
        
        if (building.workers < building.maxWorkers && playerMoney >= workerCost) {
            building.workers++;
            setPlayerMoney(playerMoney - workerCost);
            saveBuildingsData();
            
            // Обновляем индикаторы
            updateProfitIndicators();
            
            // Обновляем панель
            closeBuildingPanel();
            openBuildingPanel(buildingType, buildingName);
            
            showNotification(`👷 Нанят работник в ${buildingName}!`, 'success');
            
            // Показываем информацию о бонусе к доходу
            setTimeout(() => {
                const bonus = building.workers * 20;
                showNotification(`📈 Бонус к доходу: +${bonus}%`, 'info');
            }, 2000);
        } else if (building.workers >= building.maxWorkers) {
            showNotification('❌ Достигнут максимум работников!', 'error');
        } else {
            const needed = workerCost - playerMoney;
            const neededFormatted = (needed / 1000).toFixed(1) + 'k';
            showNotification(`❌ Недостаточно денег для найма! Нужно еще ${neededFormatted}`, 'error');
        }
    }
    
    // === УЛУЧШЕННАЯ СИСТЕМА УВЕДОМЛЕНИЙ ===
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        
        // Определяем стили в зависимости от типа уведомления
        let backgroundColor, icon, animation;
        switch(type) {
            case 'success':
                backgroundColor = '#4caf50';
                icon = '✅';
                animation = 'slideInRight';
                break;
            case 'error':
                backgroundColor = '#f44336';
                icon = '❌';
                animation = 'shake';
                break;
            case 'info':
                backgroundColor = '#2196f3';
                icon = 'ℹ️';
                animation = 'slideInRight';
                break;
            case 'warning':
                backgroundColor = '#ff9800';
                icon = '⚠️';
                animation = 'slideInRight';
                break;
            default:
                backgroundColor = '#4caf50';
                icon = '✅';
                animation = 'slideInRight';
        }
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            max-width: 300px;
            word-wrap: break-word;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">${icon}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Автоматическое удаление
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }, 4000);
    }
    
    function closeBuildingPanel() {
        const panel = document.getElementById('building-panel');
        if (panel) {
            panel.classList.remove('show');
            setTimeout(() => {
                if (panel.parentNode) {
                    panel.parentNode.removeChild(panel);
                }
                // Запускаем анимацию возврата камеры после закрытия панели
                resetCamera();
            }, 300);
        }
    }
    
    // === ФУНКЦИИ НАВЕДЕНИЯ УДАЛЕНЫ ===
    // Анимации при наведении убраны
    
    // === ФУНКЦИИ СВАЙПА ===
    function initSwipeFunctionality(imageElement) {
        // Глобальные флаги для подавления кликов при перетаскивании
        if (!window._mapState) window._mapState = {};
        window._mapState.isDragging = false;
        window._mapState.dragMoved = false;

        const container = document.getElementById('map-container');
        if (!container) return;

        // Делаем контейнер интерактивным для pointer событий (переопределяем CSS pointer-events:none)
        container.style.pointerEvents = 'auto';
        container.style.touchAction = 'none';

        // Создаем панель для панорамирования, чтобы двигать и изображение, и зоны вместе
        let panLayer = document.getElementById('map-pan-layer');
        if (!panLayer) {
            panLayer = document.createElement('div');
            panLayer.id = 'map-pan-layer';
            panLayer.style.position = 'absolute';
            panLayer.style.left = '0';
            panLayer.style.top = '0';
            panLayer.style.width = '100%';
            panLayer.style.height = '100%';
            panLayer.style.willChange = 'transform';
            panLayer.style.transformOrigin = 'center center';
            panLayer.style.touchAction = 'none';
            container.appendChild(panLayer);

            // Перемещаем изображение и зоны внутрь слоя
            const zones = Array.from(container.querySelectorAll('.building-zone'));
            if (imageElement.parentElement === container) panLayer.appendChild(imageElement);
            zones.forEach(z => {
                if (z.parentElement === container) panLayer.appendChild(z);
                // Делаем зоны прозрачными, но кликабельными
                try { z.style.background = 'transparent'; z.style.opacity = '0'; z.style.border = 'none'; z.style.outline = 'none'; } catch (_) {}
            });
        }

        // Состояние панорамирования
        const baseScale = 3.5; // фиксированное приближение карты - баланс заполнения и прокрутки
        let targetX = 0, targetY = 0; // желаемая позиция
        let currentX = 0, currentY = 0; // текущая позиция (для сглаживания)
        let startPX = 0, startPY = 0; // стартовые координаты указателя
        let pointerActive = false;
        let movedTotal = 0;
        let programScrollInProgress = false; // флаг программной анимации к краю

        // Параметры
        const sensitivity = 0.85; // ещё ниже чувствительность для мягкого контроля
        const damping = 0.08; // медленнее для более плавного скольжения
        const dragThreshold = 6; // пикселей для распознавания перетаскивания

        let bounds = { maxX: 0, maxY: 0 };
        const overscroll = 0; // запрещаем выход за края карты

        function computeBounds() {
            try {
                const cw = container.clientWidth;
                const ch = container.clientHeight;
                // Размер изображения в пикселях (натуральный)
                const iw0 = imageElement.naturalWidth || cw;
                const ih0 = imageElement.naturalHeight || ch;
                // Масштаб для object-fit: contain внутри контейнера
                const fitScale = Math.min(cw / iw0, ch / ih0) || 1;
                // Итоговый визуальный размер с учётом базового зума слоя
                const iw = iw0 * fitScale * baseScale;
                const ih = ih0 * fitScale * baseScale;
                // Разрешённое смещение — половина переполнения по каждой оси
                bounds.maxX = Math.max(0, (iw - cw) / 2);
                bounds.maxY = Math.max(0, (ih - ch) / 2);
            } catch (_) {
                bounds.maxX = 0; bounds.maxY = 0;
            }
        }

        function clamp(v, min, max) { return v < min ? min : (v > max ? max : v); }

        function applyTransform() {
            panLayer.style.transform = `translate(${currentX}px, ${currentY}px) scale(${baseScale})`;
        }

        // Гарантированная первичная расстановка индикаторов в нужных местах
        function initIndicatorsPosition() {
            computeBounds();
            currentX = targetX = currentX || 0;
            currentY = targetY = currentY || 0;
            applyTransform();
            try {
                updateProfitIndicators();
                showProfitIndicators();
            } catch (_) {}
            // На следующий кадр повторим, когда браузер учтёт трансформации
            requestAnimationFrame(() => {
                try {
                    updateProfitIndicators();
                    showProfitIndicators();
                } catch (_) {}
            });
        }

        // Если картинка уже загружена — позиционируем сразу, иначе — после load
        if (imageElement && (imageElement.complete || imageElement.naturalWidth)) {
            initIndicatorsPosition();
        } else if (imageElement) {
            imageElement.addEventListener('load', initIndicatorsPosition, { once: true });
        }

        // Создаем левую стрелку для быстрого перехода к левому краю карты
        let leftArrow = document.getElementById('map-left-arrow');
        if (!leftArrow) {
            leftArrow = document.createElement('button');
            leftArrow.id = 'map-left-arrow';
            leftArrow.setAttribute('aria-label', 'Показать левую часть карты');
            leftArrow.style.position = 'absolute';
            leftArrow.style.left = '8px';
            leftArrow.style.top = '50%';
            leftArrow.style.transform = 'translateY(-50%)';
            leftArrow.style.width = '40px';
            leftArrow.style.height = '40px';
            leftArrow.style.borderRadius = '20px';
            leftArrow.style.border = 'none';
            leftArrow.style.background = 'rgba(0,0,0,0.4)';
            leftArrow.style.backdropFilter = 'blur(4px)';
            leftArrow.style.display = 'flex';
            leftArrow.style.alignItems = 'center';
            leftArrow.style.justifyContent = 'center';
            leftArrow.style.cursor = 'pointer';
            leftArrow.style.zIndex = '1200';
            leftArrow.style.padding = '0';
            leftArrow.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
            leftArrow.innerHTML = '<img src="assets/icons/arrow-small-left.svg" alt="←" style="width:20px;height:20px;opacity:0.9;">';
            container.appendChild(leftArrow);

            // Функция смены направления стрелки
            function setArrowDirection(dir){
                const src = dir === 'right' ? 'assets/icons/arrow-small-right.svg' : 'assets/icons/arrow-small-left.svg';
                leftArrow.innerHTML = `<img src="${src}" alt="${dir==='right'?'→':'←'}" style="width:20px;height:20px;opacity:0.9;">`;
            }

            // По клику — плавно пролистываем к левому краю
            leftArrow.addEventListener('click', () => {
                computeBounds();
                window._mapState = window._mapState || {};
                // Не скрываем индикаторы при программной прокрутке, просто обновляем их позицию на каждом кадре
                try { updateProfitIndicators(); showProfitIndicators(); } catch (_) {}
                // Кнопки возврата больше нет

                // Цель: левый край. В этой системе координат используем положительное смещение
                const leftEdgeX = bounds.maxX;
                const epsilon = 2; // порог близости
                const isAtLeft = Math.abs(currentX - leftEdgeX) < epsilon || Math.abs(targetX - leftEdgeX) < epsilon;
                // Тоггл: если уже слева — вернуть к центру, иначе — к левому краю
                targetX = isAtLeft ? 0 : leftEdgeX;
                programScrollInProgress = true;
                setArrowDirection(isAtLeft ? 'left' : 'right');
            });

            // Экспортируем метод на элемент для использования из других мест
            leftArrow._setDirection = setArrowDirection;
        }

        function updateIndicatorsPosition() {
            if (!window._profitRingState) return;
            try {
                Object.keys(window._profitRingState).forEach(buildingType => {
                    const state = window._profitRingState[buildingType];
                    if (!state || !state.el) return;
                    const zone = document.querySelector(`[data-building="${buildingType}"]`);
                    if (!zone) return;
                    const zoneRect = zone.getBoundingClientRect();
                    state.el.style.position = 'fixed';
                    state.el.style.top = (zoneRect.top + 5) + 'px';
                    state.el.style.right = (window.innerWidth - zoneRect.right + 5) + 'px';
                });
            } catch (_) {}
        }

        function animate() {
            if (!panLayer) return;
            // Плавное приближение к целевому положению
            const nx = currentX + (targetX - currentX) * damping;
            const ny = currentY + (targetY - currentY) * damping;
            // Только если сдвиг заметен — обновляем DOM
            if (Math.abs(nx - currentX) > 0.1 || Math.abs(ny - currentY) > 0.1) {
                currentX = nx;
                currentY = ny;
                applyTransform();
                // Мгновенно обновляем только позиции индикаторов (без пересоздания, без мигания)
                try { 
                    if(typeof window.updateProfitIndicatorsPositions === 'function'){
                        window.updateProfitIndicatorsPositions();
                    }
                } catch (_) {}
                // Во время перетаскивания индикаторы не двигаем
            } else {
                currentX = targetX;
                currentY = targetY;
                applyTransform();
                // Если завершили программную прокрутку — показываем индикаторы
                if (programScrollInProgress) {
                    programScrollInProgress = false;
                    try { updateProfitIndicators(); showProfitIndicators(); } catch (_) {}
                }
            }
            // Обновляем направление стрелки по текущему положению
            try {
                computeBounds();
                const leftEdgeX = bounds.maxX;
                const epsilon = 2;
                const isAtLeftNow = Math.abs(currentX - leftEdgeX) < epsilon;
                if (leftArrow && leftArrow._setDirection) {
                    leftArrow._setDirection(isAtLeftNow ? 'right' : 'left');
                }
            } catch (_) {}

            requestAnimationFrame(animate);
        }

        function onPointerDown(e) {
             // Не перехватываем, если открыта панель здания или идет анимация приближения
             if (isAnimating || document.getElementById('building-info-panel')?.style.display === 'block') {
                 return;
             }
             computeBounds();
             pointerActive = true;
             window._mapState.isDragging = true;
             window._mapState.dragMoved = false;
             movedTotal = 0;
             startPX = e.clientX;
             startPY = e.clientY;
             try { container.setPointerCapture(e.pointerId); } catch (_) {}
            imageElement.style.cursor = 'grabbing';
        }
        
        function onPointerMove(e) {
            if (!pointerActive) return;
             e.preventDefault();
             const dxRaw = (e.clientX - startPX);
             const dyRaw = (e.clientY - startPY);
             const dx = dxRaw * sensitivity;
             const dy = dyRaw * sensitivity;
             startPX = e.clientX;
             startPY = e.clientY;
             // Пока тянем — разрешаем небольшой выход за пределы (overscroll)
             targetX = clamp(targetX + dx, -bounds.maxX - overscroll, bounds.maxX + overscroll);
             targetY = clamp(targetY + dy, -bounds.maxY - overscroll, bounds.maxY + overscroll);
             movedTotal += Math.abs(dxRaw) + Math.abs(dyRaw);
            if (!window._mapState.dragMoved && movedTotal > dragThreshold) {
                // Первый реальный свайп: просто отмечаем drag, индикаторы не скрываем
                window._mapState.dragMoved = true;
                try { updateProfitIndicators(); showProfitIndicators(); } catch (_) {}
                // Кнопки возврата больше нет
            }
         }

        function onPointerUp(e) {
             if (!pointerActive) return;
             pointerActive = false;
             imageElement.style.cursor = 'grab';
             // Если движение было малым — не считаем это свайпом
             if (movedTotal <= dragThreshold) {
                 window._mapState.dragMoved = false;
             }
             // Сразу убираем флаг перетаскивания, чтобы клики по зданиям проходили
             window._mapState.isDragging = false;
            // Кружки остаются и постоянно репозиционируются
         }

        // Инициализация
            imageElement.style.cursor = 'grab';
        animate();
        // Кнопка "Назад к карте" удалена вместе с логикой

        // Слушатели Pointer Events
        container.addEventListener('pointerdown', onPointerDown, { passive: true });
        container.addEventListener('pointermove', onPointerMove, { passive: false });
        container.addEventListener('pointerup', onPointerUp, { passive: true });
        container.addEventListener('pointercancel', onPointerUp, { passive: true });

        // Пересчет границ при изменении окна
        window.addEventListener('resize', () => {
            computeBounds();
            // пересчёт позиций кружков после изменения размеров
            try { updateProfitIndicators(); showProfitIndicators(); } catch (_) {}
            // Обновим направление стрелки
            try {
                const leftEdgeX = bounds.maxX;
                const epsilon = 2;
                const isAtLeftNow = Math.abs(currentX - leftEdgeX) < epsilon;
                if (leftArrow && leftArrow._setDirection) {
                    leftArrow._setDirection(isAtLeftNow ? 'right' : 'left');
                }
            } catch (_) {}
        }, { passive: true });
    }
    
    function handleShowAllClick(event) {
        event.preventDefault();
        
        const currentTime = Date.now();
        if (currentTime - lastClickTime < CLICK_DELAY) {
            return; // Игнорируем слишком частые клики
        }
        lastClickTime = currentTime;
        
        // Вызываем функцию закрытия карты (если она существует)
        if (window.closeMap) {
            window.closeMap();
        } else {
            console.warn('⚠️ Функция closeMap не найдена');
        }
    }
    
    
    

    
    // === ФУНКЦИИ ПОДСКАЗОК УДАЛЕНЫ ===
    // Подсказки убраны
    
    
    // Функция обработки ошибок загрузки изображения
    window.handleImageError = function(img) {
        console.warn('⚠️ Ошибка загрузки изображения главного меню');
        
        // Создаем fallback изображение
        img.style.background = 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)';
        img.style.display = 'flex';
        img.style.alignItems = 'center';
        img.style.justifyContent = 'center';
        img.style.color = 'white';
        img.style.fontSize = '18px';
        img.style.fontWeight = '600';
        img.style.textAlign = 'center';
        img.style.padding = '20px';
        img.style.boxSizing = 'border-box';
        img.alt = 'Главное меню - изображение недоступно';
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMmQ2YTRmIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+R2xhdm5vZSBtZW51PC90ZXh0Pgo8L3N2Zz4K';
    };
    

    

    
    // Экспортируем функции для использования в других модулях
    window.mainMenu = {
        init: initMainMenu,
        handleBuildingClick: handleBuildingClick
    };
    // Делаем функции управления индикаторами глобально доступными
    window.hideProfitIndicators = hideProfitIndicators;
    window.showProfitIndicators = showProfitIndicators;
    window.clearAllProfitIndicators = clearAllProfitIndicators;
    window.updateProfitIndicators = updateProfitIndicators;
    window.updateProfitIndicatorsPositions = updateProfitIndicatorsPositions;
    // Функция открытия меню сотрудников
    window.openEmployeeMenu = function(buildingType) {
        // Проверяем, есть ли уже назначенный сотрудник для этого здания
        const assignedEmployee = Object.keys(hiredEmployees).find(emp => hiredEmployees[emp] === buildingType);
        if (assignedEmployee) {
            if (window.showNotification) {
                const employeeNames = {
                    'grinni': 'Грини',
                    'purpe': 'Пёрпи',
                    'redjy': 'Реджи',
                    'blumy': 'Блуми'
                };
                window.showNotification(`Сотрудник ${employeeNames[assignedEmployee]} уже назначен к этому зданию`, 'info');
            }
            return;
        }
        
        // Сохраняем информацию о текущем здании для восстановления панели
        const currentBuildingPanel = document.getElementById('building-panel');
        const buildingNames = {
            'library': 'Библиотека',
            'print': 'Типография',
            'factory': 'Завод',
            'storage': 'Склад'
        };
        
        // Плавно закрываем панель здания
        if (currentBuildingPanel) {
            currentBuildingPanel.classList.remove('show');
            setTimeout(() => {
                if (currentBuildingPanel.parentNode) {
                    currentBuildingPanel.parentNode.removeChild(currentBuildingPanel);
                }
            }, 300);
        }
        
        // Создаем панель найма сотрудников
        const hiringPanel = document.createElement('div');
        hiringPanel.id = 'hiring-panel';
        hiringPanel.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            inset: 0;
            z-index: 2000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Segoe UI', Arial, sans-serif;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        // Получаем доступных сотрудников (не нанятых)
        const available = availableEmployees.filter(emp => !hiredEmployees[emp]);
        
        hiringPanel.innerHTML = `
            <div class="hiring-panel-container" style="width: 90%; max-width: 380px; background: linear-gradient(135deg, rgba(20,20,20,0.95) 0%, rgba(40,40,40,0.95) 100%); border-radius: 16px; padding: 18px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 15px 35px rgba(0,0,0,0.4); transform: scale(0.9); transition: transform 0.3s ease;">
                <!-- Заголовок -->
                <div style="margin-bottom: 14px; text-align: center;">
                    <div style="font-size: 17px; font-weight: 800; color: #fff; margin-bottom: 5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); letter-spacing: 0.5px;">НАЙМ СОТРУДНИКА</div>
                    <div style="font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 500;">Выберите сотрудника для назначения</div>
                </div>
                
                <!-- Список доступных сотрудников с вертикальной прокруткой -->
                <div style="max-height: 300px; overflow-y: auto; margin-bottom: 16px; padding-right: 6px;" class="employee-scroll-container">
                    <style>
                        .employee-scroll-container::-webkit-scrollbar {
                            width: 8px;
                        }
                        .employee-scroll-container::-webkit-scrollbar-track {
                            background: rgba(255,255,255,0.1);
                            border-radius: 4px;
                        }
                        .employee-scroll-container::-webkit-scrollbar-thumb {
                            background: rgba(255,255,255,0.3);
                            border-radius: 4px;
                        }
                        .employee-scroll-container::-webkit-scrollbar-thumb:hover {
                            background: rgba(255,255,255,0.5);
                        }
                    </style>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${available.map(employee => {
                            const employeeNames = {
                                'grinni': 'Грини',
                                'purpe': 'Пёрпи', 
                                'redjy': 'Реджи',
                                'blumy': 'Блуми'
                            };
                            const employeeImages = {
                                'grinni': 'assets/svg/hiring-forpanel/green.svg',
                                'purpe': 'assets/svg/hiring-forpanel/purpe.svg',
                                'redjy': 'assets/svg/hiring-forpanel/redjy.svg',
                                'blumy': 'assets/svg/hiring-forpanel/blumy.svg'
                            };
                            const employeeSkills = {
                                'grinni': 'Книга',
                                'purpe': 'Наушники',
                                'redjy': 'Калькулятор',
                                'blumy': 'Коробка'
                            };
                            
                            // Цвета для разных персонажей (для фона карточки)
                            const employeeColors = {
                                'grinni': 'rgba(76, 175, 80, 0.1)',
                                'purpe': 'rgba(156, 39, 176, 0.1)',
                                'redjy': 'rgba(244, 67, 54, 0.1)',
                                'blumy': 'rgba(33, 150, 243, 0.1)'
                            };
                            
                            return `
                                <div class="employee-card" data-employee="${employee}" style="background: ${employeeColors[employee]}; border-radius: 14px; padding: 14px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 12px; min-height: 85px; opacity: 0; transform: translateY(20px);">
                                    <!-- Изображение персонажа -->
                                    <div style="flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 75px; height: 75px; padding: 3px;">
                                        <img src="${employeeImages[employee]}" alt="${employeeNames[employee]}" style="max-width: 100%; max-height: 100%; width: auto; height: auto; border-radius: 8px; object-fit: contain;">
                                    </div>
                                    
                                    <!-- Информация о персонаже -->
                                    <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                                        <div style="font-size: 14px; font-weight: 700; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${employeeNames[employee]}</div>
                                        
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span style="font-size: 9px; color: rgba(255,255,255,0.6); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Уровень</span>
                                            <span style="font-size: 10px; color: #fff; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">1</span>
                                        </div>
                                        
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span style="font-size: 9px; color: rgba(255,255,255,0.6); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Навык</span>
                                            <span style="font-size: 10px; color: #fff; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${employeeSkills[employee]}</span>
                                        </div>
                                        
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span style="font-size: 9px; color: rgba(255,255,255,0.6); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Редкость</span>
                                            <span style="font-size: 10px; color: #fff; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">Базовая</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                ${available.length === 0 ? `
                    <div style="text-align: center; padding: 14px; color: rgba(255,255,255,0.7); font-size: 12px;">
                        Все сотрудники уже наняты
                    </div>
                ` : ''}
                
                <!-- Кнопка закрытия -->
                <button id="close-hiring-panel" style="position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.1); border: none; color: white; font-size: 16px; cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.2s ease;">✕</button>
            </div>
        `;
        
        document.body.appendChild(hiringPanel);
        
        // Анимация появления панели найма
        setTimeout(() => {
            hiringPanel.style.opacity = '1';
            const container = hiringPanel.querySelector('.hiring-panel-container');
            container.style.transform = 'scale(1)';
            
            // Анимация появления карточек
            const cards = hiringPanel.querySelectorAll('.employee-card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.transition = 'all 0.4s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100 + index * 100);
            });
        }, 10);
        
        // Функция закрытия панели найма с анимацией
        function closeHiringPanel() {
            hiringPanel.style.opacity = '0';
            const container = hiringPanel.querySelector('.hiring-panel-container');
            container.style.transform = 'scale(0.9)';
            
            setTimeout(() => {
                if (hiringPanel.parentNode) {
                    hiringPanel.parentNode.removeChild(hiringPanel);
                }
                
                // Плавно открываем панель здания с обновленными данными
                setTimeout(() => {
                    openBuildingPanel(buildingType, buildingNames[buildingType]);
                }, 100);
            }, 300);
        }
        
        // Обработчики событий
        const closeBtn = hiringPanel.querySelector('#close-hiring-panel');
        const employeeCards = hiringPanel.querySelectorAll('.employee-card');
        
        // Эффекты для кнопки закрытия
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(255,255,255,0.2)';
            closeBtn.style.transform = 'scale(1.1)';
            closeBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(255,255,255,0.1)';
            closeBtn.style.transform = 'scale(1)';
            closeBtn.style.boxShadow = 'none';
        });
        
        closeBtn.addEventListener('click', closeHiringPanel);
        
        // Закрытие по клику вне панели
        hiringPanel.addEventListener('click', (e) => {
            if (e.target === hiringPanel || e.target.classList.contains('hiring-panel-container')) {
                closeHiringPanel();
            }
        });
        // Обработка выбора сотрудника
        employeeCards.forEach(card => {
            card.addEventListener('click', () => {
                const employee = card.dataset.employee;
                hireEmployee(employee, buildingType);
                closeHiringPanel();
            });
            
            // Эффекты при наведении
            card.addEventListener('mouseenter', () => {
                const employee = card.dataset.employee;
                const employeeColors = {
                    'grinni': 'rgba(76, 175, 80, 0.2)',
                    'purpe': 'rgba(156, 39, 176, 0.2)',
                    'redjy': 'rgba(244, 67, 54, 0.2)',
                    'blumy': 'rgba(33, 150, 243, 0.2)'
                };
                card.style.background = employeeColors[employee] || 'rgba(255,255,255,0.1)';
                card.style.transform = 'scale(1.02) translateY(-2px)';
                card.style.border = '1px solid rgba(255,255,255,0.3)';
                card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.2)';
            });
            
            card.addEventListener('mouseleave', () => {
                const employee = card.dataset.employee;
                const employeeColors = {
                    'grinni': 'rgba(76, 175, 80, 0.1)',
                    'purpe': 'rgba(156, 39, 176, 0.1)',
                    'redjy': 'rgba(244, 67, 54, 0.1)',
                    'blumy': 'rgba(33, 150, 243, 0.1)'
                };
                card.style.background = employeeColors[employee] || 'rgba(255,255,255,0.05)';
                card.style.transform = 'scale(1) translateY(0)';
                card.style.border = '1px solid rgba(255,255,255,0.1)';
                card.style.boxShadow = 'none';
            });
        });
    };
    
    // Переменные для системы дохода
    let incomeStartTime = Date.now();
    let accumulatedIncome = 0;
    let incomePerHour = 1600; // 1.6k в час
    let maxAccumulation = 1000000; // 1kk лимит
    
    // Функция сбора дохода с конкретного здания
    window.collectBuildingIncome = function(buildingType) {
        const building = buildingsData[buildingType];
        if (!building || !building.isOwned) return;
        
        const accumulatedProfit = calculateAccumulatedProfit(buildingType);
        
        if (accumulatedProfit > 0) {
            // Добавляем деньги к балансу игрока
            if (window.setPlayerMoney && window.getPlayerMoney) {
                const currentMoney = window.getPlayerMoney();
                window.setPlayerMoney(currentMoney + accumulatedProfit);
            }
            
            // Сбрасываем накопленную прибыль
            building.accumulatedProfit = 0;
            building.lastCollectTime = Date.now();
            
            // Сохраняем данные
            saveBuildingsData();
            
            // Обновляем индикаторы
            updateProfitIndicators();
            
            // Обновляем отображение в панели, если она открыта
            updateBuildingPanelDisplay(buildingType);
            
            // Показываем уведомление
            if (window.showNotification) {
                window.showNotification(`💰 Собрано: ${(accumulatedProfit/1000).toFixed(1)}k`, 'success');
            }
        }
    };
    
    // Функция сбора дохода (для обратной совместимости)
    window.collectIncome = function() {
        const currentTime = Date.now();
        const timePassed = (currentTime - incomeStartTime) / 1000; // в секундах
        const incomeEarned = Math.min((incomePerHour / 3600) * timePassed, maxAccumulation - accumulatedIncome);
        
        if (incomeEarned > 0) {
            accumulatedIncome += incomeEarned;
            incomeStartTime = currentTime;
            
            // Обновляем отображение
            updateIncomeDisplay();
            
            // Добавляем деньги к балансу игрока
            if (window.setPlayerMoney && window.getPlayerMoney) {
                const currentMoney = window.getPlayerMoney();
                window.setPlayerMoney(currentMoney + incomeEarned);
            }
        }
    };
    
    // Функция обновления отображения дохода
    function updateIncomeDisplay() {
        const currentTime = Date.now();
        const timePassed = (currentTime - incomeStartTime) / 1000; // в секундах
        const currentIncome = Math.min((incomePerHour / 3600) * timePassed, maxAccumulation - accumulatedIncome);
        const totalIncome = accumulatedIncome + currentIncome;
        
        // Обновляем прогресс бар (максимум 1 час)
        const progressPercent = Math.min((timePassed / 3600) * 100, 100);
        const progressBar = document.getElementById('income-progress');
        if (progressBar) {
            progressBar.style.width = progressPercent + '%';
        }
        
        // Обновляем накопленный доход
        const accumulatedElement = document.getElementById('accumulated-income');
        if (accumulatedElement) {
            accumulatedElement.textContent = totalIncome.toFixed(0);
        }
        
        // Обновляем доход в час
        const incomePerHourElement = document.getElementById('income-per-hour');
        if (incomePerHourElement) {
            incomePerHourElement.textContent = (incomePerHour / 1000).toFixed(1) + 'k';
        }
    }
    
    // Функция обновления отображения в панелях зданий
    function updateBuildingPanelDisplay(buildingType) {
        const building = buildingsData[buildingType];
        if (!building || !building.isOwned) return;
        
        // Используем calculateAccumulatedProfit для получения актуальной прибыли
        const accumulatedProfit = calculateAccumulatedProfit(buildingType);
        
        // Обновляем накопленный доход в панели
        const accumulatedElement = document.getElementById(`accumulated-income-${buildingType}`);
        if (accumulatedElement) {
            accumulatedElement.textContent = Math.floor(accumulatedProfit).toFixed(0);
        }
        
        // Обновляем доход в час в панели
        const incomePerHourElement = document.getElementById(`income-per-hour-${buildingType}`);
        if (incomePerHourElement) {
            incomePerHourElement.textContent = (building.income / 1000).toFixed(1) + 'k';
        }
        
        // Обновляем прогресс бар
        const progressBar = document.getElementById(`income-progress-${buildingType}`);
        if (progressBar) {
            const maxAccumulation = 1000000; // 1kk лимит
            const progressPercent = Math.min((accumulatedProfit / maxAccumulation) * 100, 100);
            progressBar.style.width = progressPercent + '%';
        }
        
        // Обновляем прогресс бар для всех зданий (общий прогресс бар)
        const generalProgressBar = document.getElementById('income-progress');
        if (generalProgressBar) {
            const maxAccumulation = 1000000; // 1kk лимит
            const progressPercent = Math.min((accumulatedProfit / maxAccumulation) * 100, 100);
            generalProgressBar.style.width = progressPercent + '%';
        }
        
        // Специальная обработка для типографии - обновление прогресса печати
        if (buildingType === 'print') {
            updateTypographyPrintProgress();
        }
        
        // Обновляем стиль кнопки улучшения только если панель открыта
        if (document.getElementById('upgrade-btn')) {
            updateUpgradeButtonStyle(buildingType);
        }
        
        // Обновляем стоимость улучшения на кнопке
        updateUpgradeCostDisplay(buildingType);
        
        // Обновляем отображение деталей улучшения
        updateUpgradeDetailsDisplay(buildingType);
        
        // Обновляем стиль кнопки сбора в зависимости от наличия накоплений
        updateCollectButtonStyle(buildingType, accumulatedProfit);
        
        // Обновляем верхнюю карточку
        updateTopCardDisplay(buildingType);
        
        // Обновляем карточку сотрудника
        updateEmployeeCard(buildingType);
    }
    // Функция обновления прогресса печати в панели типографии
    function updateTypographyPrintProgress() {
        const progressBar = document.getElementById('typography-print-progress');
        
        if (progressBar && isPrinting && printStartTime) {
            // Вычисляем текущий прогресс
            const elapsedMinutes = Math.floor((Date.now() - printStartTime) / 60000);
            const currentTime = Math.min(elapsedMinutes, printTotalTime);
            const progress = (currentTime / printTotalTime) * 100;
            const remainingTime = printTotalTime - currentTime;
            
            // Обновляем прогресс бар
            progressBar.style.width = Math.min(progress, 100) + '%';
            
            // Находим и обновляем оставшееся время
            const progressContainer = progressBar.closest('div[style*="background:rgba(255,255,255,0.05)"]');
            if (progressContainer) {
                const remainingTimeElement = progressContainer.querySelector('span[style*="font-weight:600"]');
                if (remainingTimeElement) {
                    remainingTimeElement.textContent = remainingTime > 0 ? remainingTime + ' мин.' : 'Завершено';
                }
            }
            
            // Если печать завершена, сбрасываем флаги
            if (remainingTime <= 0) {
                isPrinting = false;
                printStartTime = null;
                isExpedited = false;
                
                // Добавляем напечатанные книги и журналы в хранилище
                if (window.addToStorage) {
                    // Добавляем 100 книг
                    window.addToStorage('books', 100, 150); // 150 - стоимость за единицу
                    // Добавляем 100 журналов
                    window.addToStorage('magazines', 100, 100); // 100 - стоимость за единицу
                }
                
                // Сохраняем состояние печати
                savePrintState();
                
                // Показываем уведомление о завершении
                if (window.showNotification) {
                    window.showNotification('✅ Печать завершена! 100 книг и 100 журналов добавлены в хранилище', 'success');
                }
                
                // Перезагружаем панель типографии
                setTimeout(() => {
                    if (document.querySelector('.building-panel-container')) {
                        openBuildingPanel('print');
                    }
                }, 1000);
            }
        }
    }
    
    // Функция обновления стиля кнопки сбора
    function updateCollectButtonStyle(buildingType, accumulatedProfit) {
        const collectButton = document.getElementById('collect-income-btn');
        if (!collectButton) return;
        
        // Если есть накопления, делаем кнопку черной, иначе серой
        if (accumulatedProfit > 0) {
            collectButton.style.background = 'rgba(0,0,0,0.8)';
            collectButton.style.color = '#fff';
            collectButton.style.cursor = 'pointer';
            collectButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
        } else {
            collectButton.style.background = 'rgba(0,0,0,0.3)';
            collectButton.style.color = '#fff';
            collectButton.style.cursor = 'not-allowed';
            collectButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        }
    }
    // Функция обновления стоимости улучшения на кнопке
    function updateUpgradeCostDisplay(buildingType) {
        const building = buildingsData[buildingType];
        if (!building || !building.isOwned) return;
        
        const costElement = document.getElementById(`${buildingType}-upgrade-cost`);
        if (costElement) {
            if (building.level < 5) {
                costElement.textContent = (building.upgradeCost / 1000).toFixed(0) + 'k';
            } else {
                costElement.textContent = 'Макс';
            }
        }
    }
    // Функция обновления отображения деталей улучшения
    function updateUpgradeDetailsDisplay(buildingType) {
        const building = buildingsData[buildingType];
        if (!building || !building.isOwned) return;
        
        // Обновляем ежедневный доход
        const dailyIncomeElement = document.getElementById('daily-income-display');
        if (dailyIncomeElement && building.level < 5) {
            const currentIncome = building.income;
            const nextIncome = Math.floor(building.income * 1.25);
            dailyIncomeElement.innerHTML = `<span style="color:rgba(255,255,255,0.6);">${(currentIncome/1000).toFixed(0)}k</span> > <span style="color:#fff;">${(nextIncome/1000).toFixed(0)}k</span>`;
        }
        
        // Обновляем коммунальные расходы
        const utilityCostsElement = document.getElementById('utility-costs-display');
        if (utilityCostsElement) {
            utilityCostsElement.innerHTML = `<span style="color:rgba(255,255,255,0.6);">25k</span> > <span style="color:#fff;">10k</span>`;
        }
        
        // Обновляем время улучшения
        const upgradeTimeElement = document.getElementById('upgrade-time-display');
        if (upgradeTimeElement) {
            upgradeTimeElement.innerHTML = `<span style="color:#fff;">1 час</span>`;
        }
        
        // Обновляем стоимость улучшения на кнопке для всех зданий
        const costElement = document.getElementById(`${buildingType}-upgrade-cost`);
        if (costElement) {
            if (building.level < 5) {
                costElement.textContent = (building.upgradeCost / 1000).toFixed(0) + 'k';
            } else {
                costElement.textContent = 'Макс';
            }
        }
    }
    
    // Функция обновления верхней карточки
    function updateTopCardDisplay(buildingType) {
        const building = buildingsData[buildingType];
        if (!building || !building.isOwned) return;
        
        // Находим элементы в верхней карточке
        const levelElement = document.querySelector('.building-level');
        const incomeElement = document.querySelector('.building-income');
        
        if (levelElement) {
            levelElement.textContent = `Ур. ${building.level}`;
        }
        
        if (incomeElement) {
            incomeElement.textContent = `${(building.income * 24 / 1000).toFixed(0)}k`;
        }
    }
    
    // Функция обновления стиля кнопки улучшения
    function updateUpgradeButtonStyle(buildingType) {
        const building = buildingsData[buildingType];
        if (!building || !building.isOwned) return;
        
        const upgradeBtn = document.getElementById('upgrade-btn');
        if (!upgradeBtn) return;
        // Проверяем, что здание не достигло максимального уровня
        if (building.level >= 5) return;
        
        const playerMoney = getPlayerMoney();
        const canAfford = playerMoney >= building.upgradeCost;
        const canUpgrade = building.level < 5;
        
        // Находим span элемент внутри кнопки
        const spanElement = upgradeBtn.querySelector('span');
        
        if (canAfford && canUpgrade) {
            upgradeBtn.style.background = 'rgba(0,0,0,0.8)';
            upgradeBtn.style.cursor = 'pointer';
            upgradeBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
            upgradeBtn.onclick = buildingType === 'library' ? upgradeLibrary : 
                                 buildingType === 'factory' ? upgradeFactory :
                                 buildingType === 'print' ? upgradePrint : 
                                 buildingType === 'storage' ? upgradeStorage : upgradeFactory;
            if (spanElement) {
                spanElement.textContent = 'Улучшить';
            }
            
            // Обновляем стоимость улучшения
            const costElement = document.getElementById(`${buildingType}-upgrade-cost`);
            if (costElement) {
                costElement.textContent = (building.upgradeCost / 1000).toFixed(0) + 'k';
            }
            
            // Обновляем стиль контейнера с ценой для доступного улучшения
            updateCostContainerStyle(upgradeBtn, true);
        } else if (!canUpgrade) {
            upgradeBtn.style.background = 'rgba(107,114,128,0.3)';
            upgradeBtn.style.cursor = 'not-allowed';
            upgradeBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
            upgradeBtn.onclick = null;
            if (spanElement) {
                spanElement.textContent = 'Максимальный уровень';
            }
            
            // Обновляем стиль контейнера с ценой для максимального уровня
            updateCostContainerStyle(upgradeBtn, false);
            
            // Обновляем стоимость на "Макс"
            const costElement = document.getElementById(`${buildingType}-upgrade-cost`);
            if (costElement) {
                costElement.textContent = 'Макс';
            }
        } else {
            upgradeBtn.style.background = 'rgba(0,0,0,0.3)';
            upgradeBtn.style.cursor = 'not-allowed';
            upgradeBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
            upgradeBtn.onclick = null;
            if (spanElement) {
                spanElement.textContent = 'Недостаточно средств';
            }
            
            // Обновляем стоимость улучшения
            const costElement = document.getElementById(`${buildingType}-upgrade-cost`);
            if (costElement) {
                costElement.textContent = (building.upgradeCost / 1000).toFixed(0) + 'k';
            }
            
            // Обновляем стиль контейнера с ценой для недоступного улучшения
            updateCostContainerStyle(upgradeBtn, false);
        }
    }
    
    // Функция обновления стиля контейнера с ценой
    function updateCostContainerStyle(upgradeBtn, isAffordable) {
        const costContainer = upgradeBtn.querySelector('div[style*="background:rgba(255,255,255,0.15)"]');
        if (costContainer) {
            if (isAffordable) {
                // Стиль для доступного улучшения - черный фон с золотой рамкой
                costContainer.style.background = '#000';
                costContainer.style.border = '2px solid #D4AF37';
                costContainer.style.borderRadius = '8px';
                costContainer.style.padding = '4px 8px';
                
                // Обновляем цвет текста на белый
                const costText = costContainer.querySelector('span[style*="font-weight:700"]');
                if (costText) {
                    costText.style.color = '#fff';
                }
                
                // Обновляем стиль иконки денег
                const moneyIcon = costContainer.querySelector('img[src*="money-icon.svg"]');
                if (moneyIcon) {
                    moneyIcon.style.filter = 'brightness(1.2)';
                }
            } else {
                // Стиль для недоступного улучшения - серый фон
                costContainer.style.background = 'rgba(255,255,255,0.15)';
                costContainer.style.border = '1px solid rgba(255,255,255,0.2)';
                costContainer.style.borderRadius = '16px';
                costContainer.style.padding = '4px 8px';
                
                // Обновляем цвет текста на серый
                const costText = costContainer.querySelector('span[style*="font-weight:700"]');
                if (costText) {
                    costText.style.color = 'rgba(255,255,255,0.5)';
                }
                
                // Обновляем стиль иконки денег
                const moneyIcon = costContainer.querySelector('img[src*="money-icon.svg"]');
                if (moneyIcon) {
                    moneyIcon.style.filter = 'brightness(0.7)';
                }
            }
        }
    }
    
    // Запускаем обновление каждую секунду
    setInterval(updateIncomeDisplay, 1000);
    
    // Запускаем обновление прибыли всех зданий каждые 10 секунд
    setInterval(updateAllProfits, 10000);
    
    // Запускаем обновление прогресса печати в типографии каждые 5 секунд
    setInterval(() => {
        if (isPrinting && printStartTime) {
            updateTypographyPrintProgress();
        }
    }, 5000);
    
    // Функция улучшения библиотеки
    window.upgradeLibrary = function() {
        const building = buildingsData.library;
        const upgradeCost = building.upgradeCost;
        
        // Проверяем, есть ли достаточно денег
        if (window.getPlayerMoney && window.setPlayerMoney) {
            const currentMoney = window.getPlayerMoney();
            
            if (currentMoney >= upgradeCost && building.level < 5) {
                // Списываем деньги
                window.setPlayerMoney(currentMoney - upgradeCost);
                
                // Улучшаем здание
                building.level++;
                building.income = Math.floor(building.income * 1.25); // Увеличиваем на 25%
                
                // Рассчитываем стоимость следующего улучшения
                if (building.level < 5) {
                    building.upgradeCost = Math.floor(building.upgradeCost * 1.5); // Увеличиваем стоимость на 50%
                } else {
                    building.upgradeCost = 0; // Максимальный уровень
                }
                
                // Сохраняем данные
                saveBuildingsData();
                
                // Обновляем индикаторы
                updateProfitIndicators();
                
                // Обновляем отображение в панели
                updateBuildingPanelDisplay('library');
                
                // Обновляем панель города для синхронизации звезд
                if (window.renderCity) {
                    window.renderCity();
                }
                
                // Показываем уведомление
                if (window.showNotification) {
                    window.showNotification(`🏗️ Библиотека улучшена до уровня ${building.level}!`, 'success');
                }
            } else if (building.level >= 5) {
                if (window.showNotification) {
                    window.showNotification('❌ Библиотека уже максимального уровня!', 'error');
                }
            } else {
                if (window.showNotification) {
                    window.showNotification('❌ Недостаточно денег!', 'error');
                }
            }
        }
    };
    // Функция улучшения завода
    window.upgradeFactory = function() {
        const building = buildingsData.factory;
        const upgradeCost = building.upgradeCost;
        
        // Проверяем, есть ли достаточно денег
        if (window.getPlayerMoney && window.setPlayerMoney) {
            const currentMoney = window.getPlayerMoney();
            
            if (currentMoney >= upgradeCost && building.level < 5) {
                // Списываем деньги
                window.setPlayerMoney(currentMoney - upgradeCost);
                
                // Улучшаем здание
                building.level++;
                building.income = Math.floor(building.income * 1.25); // Увеличиваем на 25%
                
                // Рассчитываем стоимость следующего улучшения
                if (building.level < 5) {
                    building.upgradeCost = Math.floor(building.upgradeCost * 1.5); // Увеличиваем стоимость на 50%
                } else {
                    building.upgradeCost = 0; // Максимальный уровень
                }
                
                // Сохраняем данные
                saveBuildingsData();
                
                // Обновляем индикаторы
                updateProfitIndicators();
                
                // Обновляем отображение в панели
                updateBuildingPanelDisplay('factory');
                
                // Обновляем панель города для синхронизации звезд
                if (window.renderCity) {
                    window.renderCity();
                }
                
                // Показываем уведомление
                if (window.showNotification) {
                    window.showNotification(`🏭 Завод улучшен до уровня ${building.level}!`, 'success');
                }
            } else if (building.level >= 5) {
                if (window.showNotification) {
                    window.showNotification('❌ Завод уже максимального уровня!', 'error');
                }
            } else {
                if (window.showNotification) {
                    window.showNotification('❌ Недостаточно денег!', 'error');
                }
            }
        }
    };
    
    // Функция покупки завода
    window.buyFactory = function() {
        const purchaseCost = buildingsData.factory.purchaseCost;
        
        // Проверяем, есть ли достаточно денег
        if (window.getPlayerMoney && window.setPlayerMoney) {
            const currentMoney = window.getPlayerMoney();
            
            if (currentMoney >= purchaseCost) {
                // Списываем деньги
                window.setPlayerMoney(currentMoney - purchaseCost);
                
                // Отмечаем завод как купленный в локальных данных
                buildingsData.factory.isOwned = true;
                // Устанавливаем время начала накопления прибыли
                buildingsData.factory.lastCollectTime = Date.now();
                buildingsData.factory.accumulatedProfit = 0;
                
                // Сохраняем изменения в localStorage
                saveBuildingsData();
                
                // Обновляем индикаторы прибыли
                updateProfitIndicators();
                
                // Обновляем панель города
                if (window.renderCity) {
                    window.renderCity();
                }
                
                // Показываем уведомление
                if (window.showNotification) {
                    window.showNotification('🏭 Завод куплен!', 'success');
                }
                
                // Закрываем панель
                closeBuildingPanel();
                
                // Обновляем отображение на карте (если есть такая функция)
                if (window.updateBuildingDisplay) {
                    window.updateBuildingDisplay('factory');
                }
            } else {
                if (window.showNotification) {
                    window.showNotification('❌ Недостаточно денег!', 'error');
                }
            }
        }
    };
    
    // Функция покупки типографии
    window.buyPrint = function() {
        const purchaseCost = buildingsData.print.purchaseCost;
        
        // Проверяем, есть ли достаточно денег
        if (window.getPlayerMoney && window.setPlayerMoney) {
            const currentMoney = window.getPlayerMoney();
            
            if (currentMoney >= purchaseCost) {
                // Списываем деньги
                window.setPlayerMoney(currentMoney - purchaseCost);
                
                // Отмечаем типографию как купленную в локальных данных
                buildingsData.print.isOwned = true;
                // Устанавливаем время начала накопления прибыли
                buildingsData.print.lastCollectTime = Date.now();
                buildingsData.print.accumulatedProfit = 0;
                
                // Сохраняем изменения в localStorage
                saveBuildingsData();
                
                // Обновляем индикаторы прибыли
                updateProfitIndicators();
                
                // Обновляем панель города
                if (window.renderCity) {
                    window.renderCity();
                }
                
                // Показываем уведомление
                if (window.showNotification) {
                    window.showNotification('🖨️ Типография куплена!', 'success');
                }
                
                // Закрываем панель
                closeBuildingPanel();
                
                // Обновляем отображение на карте (если есть такая функция)
                if (window.updateBuildingDisplay) {
                    window.updateBuildingDisplay('print');
                }
            } else {
                if (window.showNotification) {
                    window.showNotification('❌ Недостаточно денег!', 'error');
                }
            }
        }
    };
    
    // Функция улучшения типографии
    window.upgradePrint = function() {
        const building = buildingsData.print;
        const upgradeCost = building.upgradeCost;
        
        // Проверяем, есть ли достаточно денег
        if (window.getPlayerMoney && window.setPlayerMoney) {
            const currentMoney = window.getPlayerMoney();
            
            if (currentMoney >= upgradeCost && building.level < 5) {
                // Списываем деньги
                window.setPlayerMoney(currentMoney - upgradeCost);
                
                // Улучшаем здание
                building.level++;
                building.income = Math.floor(building.income * 1.25); // Увеличиваем на 25%
                
                // Рассчитываем стоимость следующего улучшения
                if (building.level < 5) {
                    building.upgradeCost = Math.floor(building.upgradeCost * 1.5); // Увеличиваем стоимость на 50%
                } else {
                    building.upgradeCost = 0; // Максимальный уровень
                }
                
                // Сохраняем данные
                saveBuildingsData();
                
                // Обновляем индикаторы
                updateProfitIndicators();
                
                // Обновляем отображение в панели
                updateBuildingPanelDisplay('print');
                
                // Обновляем панель города для синхронизации звезд
                if (window.renderCity) {
                    window.renderCity();
                }
                
                // Показываем уведомление
                if (window.showNotification) {
                    window.showNotification(`🖨️ Типография улучшена до уровня ${building.level}!`, 'success');
                }
            } else if (building.level >= 5) {
                if (window.showNotification) {
                    window.showNotification('❌ Типография уже максимального уровня!', 'error');
                }
            } else {
                if (window.showNotification) {
                    window.showNotification('❌ Недостаточно денег!', 'error');
                }
            }
        }
    };
    // Функция открытия панели печати
    window.openPrintPanel = function() {
        // Проверяем, есть ли активная печать
        if (isPrinting && printStartTime) {
            // Если печать активна, закрываем панель типографии и показываем панель с текущим прогрессом
            closeBuildingPanel();
            showPrintProgressPanel(null);
            return;
        }
        
        // Закрываем панель типографии
        closeBuildingPanel();
        
        // Создаем панель печати
        const printPanel = document.createElement('div');
        printPanel.id = 'print-panel';
        printPanel.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 2000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        // Первая панель - информация о печати
        printPanel.innerHTML = `
            <div class="print-panel-container" style="width: 90%; max-width: 400px; background: linear-gradient(135deg, rgba(20,20,20,0.95) 0%, rgba(40,40,40,0.95) 100%); border-radius: 20px; padding: 24px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px rgba(0,0,0,0.6);">
                <!-- Заголовок -->
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 6px;">Печать</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.4;">Напечатайте книгу, чтобы использовать ее в дальнейшем</div>
                </div>
                
                <!-- Информационная карточка -->
                <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 12px; color: rgba(255,255,255,0.7);">Ожидаемое время печати</span>
                        <span style="font-size: 12px; color: #fff; font-weight: 600;">30 мин.</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 11px; color: rgba(255,255,255,0.7); line-height: 1.2;">Стоимость печати</span>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <img src="assets/svg/money-icon.svg" alt="Money" style="width: 12px; height: 12px;">
                            <span style="font-size: 12px; color: #fff; font-weight: 600;">15 000</span>
                        </div>
                    </div>
                </div>
                
                <!-- Кнопка печати -->
                <button id="start-print-btn" style="width: 100%; background: #fff; border: none; border-radius: 25px; padding: 8px 12px; color: #000; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(255,255,255,0.2);">
                    <span>Напечатать</span>
                    <div style="background: rgba(0,0,0,0.1); border-radius: 6px; padding: 4px 8px; display: flex; align-items: center; gap: 4px;">
                        <img src="assets/svg/money-icon.svg" alt="Money" style="width: 12px; height: 12px;">
                        <span style="font-size: 12px; color: #000; font-weight: 600;">15 000</span>
                    </div>
                </button>
                
                <!-- Кнопка закрытия -->
                <button id="close-print-panel" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.1); border: none; color: white; font-size: 16px; cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px;">✕</button>
            </div>
        `;
        
        document.body.appendChild(printPanel);
        
        // Обработчики событий
        const closeBtn = printPanel.querySelector('#close-print-panel');
        const startPrintBtn = printPanel.querySelector('#start-print-btn');
        
        // Проверяем наличие денег для кнопки "Напечатать"
        const playerMoney = window.getPlayerMoney();
        const printCost = 15000;
        
        if (playerMoney >= printCost) {
            // Если денег достаточно, кнопка активна
            startPrintBtn.style.background = '#fff';
            startPrintBtn.style.cursor = 'pointer';
            startPrintBtn.style.opacity = '1';
        } else {
            // Если денег недостаточно, кнопка неактивна
            startPrintBtn.style.background = 'rgba(255,255,255,0.3)';
            startPrintBtn.style.cursor = 'not-allowed';
            startPrintBtn.style.opacity = '0.5';
        }
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(printPanel);
            // Открываем панель типографии снова
            setTimeout(() => {
                openBuildingPanel('print');
            }, 100);
        });
        
        startPrintBtn.addEventListener('click', () => {
            if (playerMoney >= printCost) {
                startPrintProcess(printPanel);
            } else {
                // Показываем уведомление о недостатке денег
                if (window.showNotification) {
                    window.showNotification('❌ Недостаточно денег для печати!', 'error');
                }
            }
        });
        
        // Закрытие по клику вне панели
        printPanel.addEventListener('click', (e) => {
            // Проверяем, что клик был именно на контейнер панели, а не на его содержимое
            if (e.target === printPanel || e.target.classList.contains('print-panel-container')) {
                document.body.removeChild(printPanel);
                // Открываем панель типографии снова
                setTimeout(() => {
                    openBuildingPanel('print');
                }, 100);
            }
        });
    };
    
    // Функция запуска процесса печати
    function startPrintProcess(printPanel) {
        const printCost = 15000;
        const playerMoney = window.getPlayerMoney();
        
        if (playerMoney >= printCost) {
            // Списываем деньги
            window.setPlayerMoney(playerMoney - printCost);
            
            // Устанавливаем флаг печати и время начала
            isPrinting = true;
            printStartTime = Date.now();
            printTotalTime = 30; // Устанавливаем стандартное время печати (30 минут)
            isExpedited = false; // Сбрасываем флаг ускорения
            
            // Сохраняем состояние печати в localStorage
            savePrintState();
            
            // Показываем панель прогресса
            showPrintProgressPanel(printPanel);
            
            // Показываем уведомление
            if (window.showNotification) {
                window.showNotification('🖨️ Печать началась!', 'success');
            }
        } else {
            // Показываем уведомление о недостатке денег
            if (window.showNotification) {
                window.showNotification('❌ Недостаточно денег для печати!', 'error');
            }
        }
    }
    // Функция показа панели прогресса печати
    function showPrintProgressPanel(printPanel) {
        // Если панель не передана, создаем новую
        if (!printPanel) {
            printPanel = document.createElement('div');
            printPanel.id = 'print-panel';
            printPanel.style.cssText = `
                position: fixed;
                inset: 0;
                z-index: 2000;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: 'Segoe UI', Arial, sans-serif;
            `;
            document.body.appendChild(printPanel);
        }
        
        // Вычисляем текущий прогресс на основе времени начала
        let currentTime = 0;
        if (isPrinting && printStartTime) {
            const elapsedMinutes = Math.floor((Date.now() - printStartTime) / 60000);
            currentTime = Math.min(elapsedMinutes, printTotalTime);
        }
        
        printPanel.innerHTML = `
            <div class="print-panel-container" style="width: 90%; max-width: 400px; background: linear-gradient(135deg, rgba(20,20,20,0.95) 0%, rgba(40,40,40,0.95) 100%); border-radius: 20px; padding: 24px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px rgba(0,0,0,0.6);">
                <!-- Заголовок -->
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 6px;">Печать</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.4;">Напечатайте книгу, чтобы использовать ее в дальнейшем</div>
                </div>
                
                <!-- Время печати -->
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 10px;">Время печати</div>
                    <div style="background: rgba(255,255,255,0.1); border-radius: 8px; height: 12px; position: relative; overflow: hidden;">
                        <div id="print-progress-bar" style="background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%); height: 100%; border-radius: 8px; transition: width 0.3s ease; width: ${(currentTime / printTotalTime) * 100}%;"></div>
                        <div id="print-progress-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 12px; font-weight: 600; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${printTotalTime - currentTime} мин.</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 6px;">
                        <span style="font-size: 10px; color: rgba(255,255,255,0.5);">0 мин.</span>
                        <span style="font-size: 10px; color: rgba(255,255,255,0.5);">${printTotalTime} мин.</span>
                    </div>
                </div>
                
                <!-- Информационная карточка -->
                <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 12px; color: rgba(255,255,255,0.7);">Оставшееся время печати</span>
                        <span id="remaining-time" style="font-size: 12px; color: #fff; font-weight: 600;">${printTotalTime - currentTime} мин.</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 11px; color: rgba(255,255,255,0.7); line-height: 1.2;">Стоимость ускорения</span>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <img src="assets/svg/money-icon.svg" alt="Money" style="width: 12px; height: 12px;">
                            <span style="font-size: 12px; color: #fff; font-weight: 600;">3 000</span>
                        </div>
                    </div>
                    
                    <!-- Кнопка ускорения -->
                    <button id="expedite-btn" style="width: 100%; background: #fff; border: none; border-radius: 25px; padding: 8px 12px; color: #000; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(255,255,255,0.2); ${isExpedited ? 'display: none;' : ''}">
                        <span>Ускорить</span>
                        <div style="background: rgba(0,0,0,0.1); border-radius: 6px; padding: 4px 8px; display: flex; align-items: center; gap: 4px;">
                            <img src="assets/svg/money-icon.svg" alt="Money" style="width: 12px; height: 12px;">
                            <span style="font-size: 12px; color: #000; font-weight: 600;">3 000</span>
                        </div>
                    </button>
                </div>
                
                <!-- Кнопка закрытия -->
                <button id="close-print-panel" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.1); border: none; color: white; font-size: 16px; cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px;">✕</button>
            </div>
        `;
        
        // Обработчики событий для панели прогресса
        const closeBtn = printPanel.querySelector('#close-print-panel');
        const expediteBtn = printPanel.querySelector('#expedite-btn');
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(printPanel);
            // Открываем панель типографии снова
            setTimeout(() => {
                openBuildingPanel('print');
            }, 100);
        });
        
        expediteBtn.addEventListener('click', () => {
            expeditePrint(printPanel);
        });
        
        // Закрытие по клику вне панели
        printPanel.addEventListener('click', (e) => {
            // Проверяем, что клик был именно на контейнер панели, а не на его содержимое
            if (e.target === printPanel || e.target.classList.contains('print-panel-container')) {
                document.body.removeChild(printPanel);
                // Открываем панель типографии снова
                setTimeout(() => {
                    openBuildingPanel('print');
                }, 100);
            }
        });
        
        // Запускаем прогресс печати
        startPrintProgress(printPanel, printTotalTime);
    }
    
    // Функция запуска прогресса печати
    function startPrintProgress(printPanel, totalTime) {
        const progressBar = printPanel.querySelector('#print-progress-bar');
        const progressText = printPanel.querySelector('#print-progress-text');
        const remainingTime = printPanel.querySelector('#remaining-time');
        
        // Очищаем предыдущий интервал, если он существует
        if (printProgressInterval) {
            clearInterval(printProgressInterval);
        }
        
        printProgressInterval = setInterval(() => {
            if (!isPrinting || !printStartTime) {
                clearInterval(printProgressInterval);
                return;
            }
            
            const elapsedMinutes = Math.floor((Date.now() - printStartTime) / 60000);
            const currentTime = Math.min(elapsedMinutes, totalTime);
            const progress = (currentTime / totalTime) * 100;
            
            // Обновляем прогресс бар
            if (progressBar) {
                progressBar.style.width = Math.min(progress, 100) + '%';
            }
            
            // Обновляем текст прогресса
            if (progressText) {
                const remaining = totalTime - currentTime;
                if (remaining <= 0) {
                    progressText.textContent = 'Завершено';
                } else {
                    progressText.textContent = `${remaining} мин.`;
                }
            }
            
            // Обновляем оставшееся время
            if (remainingTime) {
                const remaining = totalTime - currentTime;
                if (remaining <= 0) {
                    remainingTime.textContent = 'Завершено';
                    clearInterval(printProgressInterval);
                    
                    // Сбрасываем флаг печати
                    isPrinting = false;
                    printStartTime = null;
                    isExpedited = false; // Сбрасываем флаг ускорения
                    
                    // Добавляем напечатанные книги и журналы в хранилище
                    if (window.addToStorage) {
                        // Добавляем 100 книг
                        window.addToStorage('books', 100, 150); // 150 - стоимость за единицу
                        // Добавляем 100 журналов
                        window.addToStorage('magazines', 100, 100); // 100 - стоимость за единицу
                    }
                    
                    // Сохраняем состояние печати
                    savePrintState();
                    
                    // Показываем уведомление о завершении
                    if (window.showNotification) {
                        window.showNotification('✅ Печать завершена! 100 книг и 100 журналов добавлены в хранилище', 'success');
                    }
                    
                    // Закрываем панель через 2 секунды и открываем панель типографии
                    setTimeout(() => {
                        if (document.body.contains(printPanel)) {
                            document.body.removeChild(printPanel);
                            setTimeout(() => {
                                openBuildingPanel('print');
                            }, 100);
                        }
                    }, 2000);
                } else {
                    remainingTime.textContent = `${remaining} мин.`;
                }
            }
        }, 1000); // Обновляем каждую секунду для более плавного прогресса
    }
    
    // Функция сохранения состояния печати
    function savePrintState() {
        const printState = {
            isPrinting: isPrinting,
            printStartTime: printStartTime,
            printTotalTime: printTotalTime,
            isExpedited: isExpedited
        };
        localStorage.setItem('printState', JSON.stringify(printState));
    }
    // Функция сброса состояния печати
    function resetPrintState() {
        isPrinting = false;
        printStartTime = null;
        isExpedited = false;
        if (printProgressInterval) {
            clearInterval(printProgressInterval);
            printProgressInterval = null;
        }
        savePrintState();
    }
    
    // Функция загрузки состояния печати
    function loadPrintState() {
        const savedState = localStorage.getItem('printState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                isPrinting = state.isPrinting || false;
                printStartTime = state.printStartTime || null;
                printTotalTime = state.printTotalTime || 30;
                isExpedited = state.isExpedited || false;
                
                // Проверяем, не завершилась ли печать
                if (isPrinting && printStartTime) {
                    const elapsedMinutes = Math.floor((Date.now() - printStartTime) / 60000);
                    if (elapsedMinutes >= printTotalTime) {
                        // Печать завершена
                        isPrinting = false;
                        printStartTime = null;
                        isExpedited = false;
                        savePrintState();
                    }
                }
            } catch (error) {
                console.error('Ошибка загрузки состояния печати:', error);
                // Сбрасываем состояние при ошибке
                isPrinting = false;
                printStartTime = null;
                isExpedited = false;
            }
        }
    }
    
    // Функция ускорения печати
    function expeditePrint(printPanel) {
        const expediteCost = 3000; // Стоимость ускорения
        const playerMoney = window.getPlayerMoney();
        
        if (playerMoney >= expediteCost) {
            // Списываем деньги
            window.setPlayerMoney(playerMoney - expediteCost);
            
            // Показываем уведомление
            if (window.showNotification) {
                window.showNotification('⚡ Печать ускорена!', 'success');
            }
            
            // Устанавливаем время начала на 27 минут назад (остается 3 минуты)
            printStartTime = Date.now() - (27 * 60 * 1000);
            printTotalTime = 3; // Устанавливаем новое время печати (3 минуты)
            isExpedited = true; // Устанавливаем флаг ускорения
            
            // Сохраняем состояние печати
            savePrintState();
            
            // Очищаем предыдущий интервал прогресса
            if (printProgressInterval) {
                clearInterval(printProgressInterval);
            }
            
            // Перезапускаем прогресс с новыми параметрами
            startPrintProgress(printPanel, printTotalTime);
        } else {
            // Показываем уведомление о недостатке денег
            if (window.showNotification) {
                window.showNotification('❌ Недостаточно денег для ускорения!', 'error');
            }
        }
    }
    // Функция открытия панели выбора сотрудников
    window.openEmployeeHiringPanel = function(buildingType) {
        // Создаем панель выбора сотрудников
        const hiringPanel = document.createElement('div');
        hiringPanel.id = 'employee-hiring-panel';
        hiringPanel.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 2000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        // Получаем доступных сотрудников (не нанятых)
        const available = availableEmployees.filter(emp => !hiredEmployees[emp]);
        
        hiringPanel.innerHTML = `
            <div class="hiring-panel-container" style="width: 90%; max-width: 400px; background: linear-gradient(135deg, rgba(20,20,20,0.95) 0%, rgba(40,40,40,0.95) 100%); border-radius: 20px; padding: 24px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px rgba(0,0,0,0.6);">
                <!-- Заголовок -->
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 8px;">Найм сотрудника</div>
                    <div style="font-size: 14px; color: rgba(255,255,255,0.7);">Выберите сотрудника для назначения</div>
                </div>
                
                <!-- Список доступных сотрудников -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                    ${available.map(employee => {
                        const employeeNames = {
                            'grinni': 'Грини',
                            'purpe': 'Пёрпи', 
                            'redjy': 'Реджи',
                            'blumy': 'Блуми'
                        };
                        const employeeImages = {
                            'grinni': 'assets/svg/hiring-forpanel/green.svg',
                            'purpe': 'assets/svg/hiring-forpanel/purpe.svg',
                            'redjy': 'assets/svg/hiring-forpanel/redjy.svg',
                            'blumy': 'assets/svg/hiring-forpanel/blumy.svg'
                        };
                        
                        return `
                            <div class="employee-card" data-employee="${employee}" style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; align-items: center; text-align: center;">
                                <img src="${employeeImages[employee]}" alt="${employeeNames[employee]}" style="width: 60px; height: 60px; margin-bottom: 8px; border-radius: 8px;">
                                <div style="font-size: 14px; font-weight: 600; color: #fff;">${employeeNames[employee]}</div>
                                <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 4px;">Доступен</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                ${available.length === 0 ? `
                    <div style="text-align: center; padding: 14px; color: rgba(255,255,255,0.7); font-size: 12px;">
                        Все сотрудники уже наняты
                    </div>
                ` : ''}
                
                <!-- Кнопка закрытия -->
                <button id="close-hiring-panel" style="position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.1); border: none; color: white; font-size: 16px; cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.2s ease;">✕</button>
            </div>
        `;
        
        document.body.appendChild(hiringPanel);
        
        // Обработчики событий
        const closeBtn = hiringPanel.querySelector('#close-hiring-panel');
        const employeeCards = hiringPanel.querySelectorAll('.employee-card');
        
        // Эффекты для кнопки закрытия
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(255,255,255,0.2)';
            closeBtn.style.transform = 'scale(1.1)';
            closeBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(255,255,255,0.1)';
            closeBtn.style.transform = 'scale(1)';
            closeBtn.style.boxShadow = 'none';
        });
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(hiringPanel);
        });
        
        // Закрытие по клику вне панели
        hiringPanel.addEventListener('click', (e) => {
            if (e.target === hiringPanel || e.target.classList.contains('hiring-panel-container')) {
                document.body.removeChild(hiringPanel);
            }
        });
        
        // Обработка выбора сотрудника
        employeeCards.forEach(card => {
            card.addEventListener('click', () => {
                const employee = card.dataset.employee;
                hireEmployee(employee, buildingType);
                document.body.removeChild(hiringPanel);
            });
            
            // Эффекты при наведении
            card.addEventListener('mouseenter', () => {
                card.style.background = 'rgba(255,255,255,0.1)';
                card.style.transform = 'scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.background = 'rgba(255,255,255,0.05)';
                card.style.transform = 'scale(1)';
            });
        });
    };
    // Функция найма сотрудника
    function hireEmployee(employee, buildingType) {
        // Назначаем сотрудника к зданию
        hiredEmployees[employee] = buildingType;
        saveHiredEmployees();
        
        // Обновляем отображение карточки сотрудника в панели здания
        updateEmployeeCard(buildingType);
        
        // Обновляем индикаторы сотрудников
        updateProfitIndicators();
        
        // Показываем уведомление
        if (window.showNotification) {
            const employeeNames = {
                'grinni': 'Грини',
                'purpe': 'Пёрпи', 
                'redjy': 'Реджи',
                'blumy': 'Блуми'
            };
            window.showNotification(`✅ ${employeeNames[employee]} назначен к зданию!`, 'success');
        }
    }
    

    
    // Функция покупки почты
    window.buyStorage = function() {
        const purchaseCost = buildingsData.storage.purchaseCost;
        
        // Проверяем, есть ли достаточно денег
        if (window.getPlayerMoney && window.setPlayerMoney) {
            const currentMoney = window.getPlayerMoney();
            
            if (currentMoney >= purchaseCost) {
                // Списываем деньги
                window.setPlayerMoney(currentMoney - purchaseCost);
                
                // Отмечаем почту как купленную в локальных данных
                buildingsData.storage.isOwned = true;
                // Устанавливаем время начала накопления прибыли
                buildingsData.storage.lastCollectTime = Date.now();
                buildingsData.storage.accumulatedProfit = 0;
                
                // Сохраняем изменения в localStorage
                saveBuildingsData();
                
                // Обновляем индикаторы прибыли
                updateProfitIndicators();
                
                // Обновляем панель города
                if (window.renderCity) {
                    window.renderCity();
                }
                
                // Показываем уведомление
                if (window.showNotification) {
                    window.showNotification('📮 Почта куплена!', 'success');
                }
                
                // Закрываем панель
                closeBuildingPanel();
                
                // Обновляем отображение на карте (если есть такая функция)
                if (window.updateBuildingDisplay) {
                    window.updateBuildingDisplay('storage');
                }
            } else {
                if (window.showNotification) {
                    window.showNotification('❌ Недостаточно денег!', 'error');
                }
            }
        }
    };
    
    // Функция улучшения почты
    window.upgradeStorage = function() {
        const building = buildingsData.storage;
        const upgradeCost = building.upgradeCost;
        
        // Проверяем, есть ли достаточно денег
        if (window.getPlayerMoney && window.setPlayerMoney) {
            const currentMoney = window.getPlayerMoney();
            
            if (currentMoney >= upgradeCost && building.level < 5) {
                // Списываем деньги
                window.setPlayerMoney(currentMoney - upgradeCost);
                
                // Улучшаем здание
                building.level++;
                building.income = Math.floor(building.income * 1.25); // Увеличиваем на 25%
                
                // Рассчитываем стоимость следующего улучшения
                if (building.level < 5) {
                    building.upgradeCost = Math.floor(building.upgradeCost * 1.5); // Увеличиваем стоимость на 50%
                } else {
                    building.upgradeCost = 0; // Максимальный уровень
                }
                
                // Сохраняем данные
                saveBuildingsData();
                
                // Обновляем индикаторы
                updateProfitIndicators();
                
                // Обновляем отображение в панели
                updateBuildingPanelDisplay('storage');
                
                // Обновляем панель города для синхронизации звезд
                if (window.renderCity) {
                    window.renderCity();
                }
                
                // Показываем уведомление
                if (window.showNotification) {
                    window.showNotification(`📮 Почта улучшена до уровня ${building.level}!`, 'success');
                }
            } else if (building.level >= 5) {
                if (window.showNotification) {
                    window.showNotification('❌ Почта уже максимального уровня!', 'error');
                }
            } else {
                if (window.showNotification) {
                    window.showNotification('❌ Недостаточно денег!', 'error');
                }
            }
        }
    };
    
    // Экспортируем функции управления деньгами в глобальную область видимости
    window.getPlayerMoney = getPlayerMoney;
    window.setPlayerMoney = setPlayerMoney;
    
    // === НОВАЯ СИСТЕМА ДОСТАВКИ ===
    
    // Глобальные переменные для системы доставки
    let deliveryQueue = JSON.parse(localStorage.getItem('delivery_queue') || '[]');
    let activeDelivery = null;
    let deliveryTimer = null;
    
    // Сохранение очереди доставки
    function saveDeliveryQueue() {
        localStorage.setItem('delivery_queue', JSON.stringify(deliveryQueue));
    }
    
    // Функция открытия меню доставки
    window.openDeliveryMenu = function() {
        // Проверяем, есть ли активная доставка
        if (activeDelivery) {
            // Если есть активная доставка, показываем панель прогресса
            showDeliveryProgressPanel();
            return;
        }
        
        // Получаем текущие данные хранилища
        const currentBooks = window.storedBooks || 0;
        const currentMags = window.storedMags || 0;
        
        if (currentBooks === 0 && currentMags === 0) {
            if (window.showNotification) {
                window.showNotification('❌ В хранилище нет книг и журналов для отправки!', 'error');
            }
            return;
        }
        
        // Закрываем панель почты
        closeBuildingPanel();
        
        // Создаем панель выбора количества (первый этап)
        const deliverySelectionPanel = document.createElement('div');
        deliverySelectionPanel.id = 'delivery-selection-panel';
        deliverySelectionPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2000;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        deliverySelectionPanel.innerHTML = `
                            <div style="width: 260px; background: linear-gradient(135deg, rgba(20,20,20,0.95) 0%, rgba(40,40,40,0.95) 100%); border-radius: 20px; padding: 16px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 15px 30px rgba(0,0,0,0.6); position: relative;">
                <!-- Кнопка закрытия -->
                <button onclick="closeDeliveryPanel()" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.6);
                    font-size: 16px;
                    cursor: pointer;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                    font-weight: bold;
                " onmouseover="this.style.color='#fff';this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='rgba(255,255,255,0.6)';this.style.background='none'">×</button>
                
                <!-- Заголовок -->
                <div style="margin-bottom: 12px;">
                    <div style="font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 3px;">Доставка в библиотеку</div>
                    <div style="font-size: 10px; color: rgba(255,255,255,0.6); line-height: 1.2;">Выберите количество товаров для отправки</div>
                </div>
                
                <!-- Секция книг -->
                <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 8px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <img src="assets/svg/mail-panel/books.svg" alt="Книги" style="width: 36px; height: 36px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                        <div>
                            <div style="font-size: 12px; font-weight: 600; color: #fff;">Книги</div>
                            <div style="font-size: 9px; color: rgba(255,255,255,0.7);">Доступно: ${currentBooks} | Цена: 100 за шт.</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="range" id="books-delivery-slider" min="0" max="${currentBooks}" value="0" style="flex: 1; height: 5px; border-radius: 3px; background: rgba(255,255,255,0.2); outline: none; -webkit-appearance: none;" oninput="updateDeliveryDisplay()">
                        <div style="display: flex; flex-direction: column; align-items: center; min-width: 45px;">
                            <span id="books-delivery-qty" style="font-size: 13px; font-weight: 700; color: #ff6b9d;">0</span>
                            <span id="books-delivery-cost" style="font-size: 8px; color: rgba(255,255,255,0.7);">0$</span>
                        </div>
                    </div>
                </div>
                
                <!-- Секция журналов -->
                <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 8px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <img src="assets/svg/mail-panel/magazins.svg" alt="Журналы" style="width: 36px; height: 36px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                        <div>
                            <div style="font-size: 12px; font-weight: 600; color: #fff;">Журналы</div>
                            <div style="font-size: 9px; color: rgba(255,255,255,0.7);">Доступно: ${currentMags} | Цена: 200 за шт.</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="range" id="mags-delivery-slider" min="0" max="${currentMags}" value="0" style="flex: 1; height: 5px; border-radius: 3px; background: rgba(255,255,255,0.2); outline: none; -webkit-appearance: none;" oninput="updateDeliveryDisplay()">
                        <div style="display: flex; flex-direction: column; align-items: center; min-width: 45px;">
                            <span id="mags-delivery-qty" style="font-size: 13px; font-weight: 700; color: #ff6b9d;">0</span>
                            <span id="mags-delivery-cost" style="font-size: 8px; color: rgba(255,255,255,0.7);">0$</span>
                        </div>
                    </div>
                </div>
                
                <!-- Итоговая информация -->
                <div style="background: linear-gradient(135deg, #ff6b9d 0%, #c44569 50%, #8b5cf6 100%); border-radius: 10px; padding: 8px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 12px; font-weight: 600; color: white;">Ожидаемая прибыль:</span>
                        <span id="total-delivery-cost" style="font-size: 15px; font-weight: 700; color: white;">0$</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 10px; color: rgba(255,255,255,0.9);">Время доставки:</span>
                        <span style="font-size: 10px; color: rgba(255,255,255,0.9);">30 минут</span>
                    </div>
                </div>
                
                <!-- Кнопка доставки -->
                <button id="start-delivery-btn" style="
                    width: 100%;
                    background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
                    border: none;
                    border-radius: 12px;
                    padding: 8px;
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(255,107,157,0.3);
                " onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(255,107,157,0.4)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 12px rgba(255,107,157,0.3)'" onclick="startDelivery()">
                    Доставить
                </button>
            </div>
        `;
        
        document.body.appendChild(deliverySelectionPanel);
        
        // Обработчики событий
        deliverySelectionPanel.addEventListener('click', (e) => {
            if (e.target === deliverySelectionPanel) {
                closeDeliveryPanel();
            }
        });
        
        // Инициализация отображения
        updateDeliveryDisplay();
    };
    // Функция показа панели прогресса доставки
    function showDeliveryProgressPanel() {
        if (!activeDelivery) return;
        
        // Закрываем панель почты если она открыта
        closeBuildingPanel();
        
        // Закрываем панель выбора если она открыта
        const selectionPanel = document.getElementById('delivery-selection-panel');
        if (selectionPanel) {
            selectionPanel.remove();
        }
        
        // Закрываем существующую панель прогресса если она есть
        const existingProgressPanel = document.getElementById('delivery-progress-panel');
        if (existingProgressPanel) {
            existingProgressPanel.remove();
        }
        
        const deliveryProgressPanel = document.createElement('div');
        deliveryProgressPanel.id = 'delivery-progress-panel';
        deliveryProgressPanel.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 2000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        const elapsedTime = Date.now() - activeDelivery.startTime;
        const progress = Math.min((elapsedTime / activeDelivery.duration) * 100, 100);
        const remainingTime = Math.max(0, Math.ceil((activeDelivery.duration - elapsedTime) / 60000));
        
        deliveryProgressPanel.innerHTML = `
            <div style="width: 90%; max-width: 400px; background: linear-gradient(135deg, rgba(20,20,20,0.95) 0%, rgba(40,40,40,0.95) 100%); border-radius: 20px; padding: 24px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px rgba(0,0,0,0.6); position: relative;">
                <!-- Кнопка закрытия -->
                <button onclick="closeDeliveryPanel()" style="
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.6);
                    font-size: 20px;
                    cursor: pointer;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                    font-weight: bold;
                " onmouseover="this.style.color='#fff';this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='rgba(255,255,255,0.6)';this.style.background='none'">×</button>
                
                <!-- Заголовок -->
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 6px;">Доставка</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.4;">Доставка товаров в библиотеку</div>
                </div>
                
                <!-- Время доставки -->
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 10px;">Время доставки</div>
                    <div style="background: rgba(255,255,255,0.1); border-radius: 8px; height: 12px; position: relative; overflow: hidden;">
                        <div id="delivery-progress-bar" style="background: linear-gradient(90deg, #ff6b9d 0%, #c44569 100%); height: 100%; border-radius: 8px; transition: width 0.3s ease; width: ${progress}%;"></div>
                        <div id="delivery-progress-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 12px; font-weight: 600; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${remainingTime} мин.</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 6px;">
                        <span style="font-size: 10px; color: rgba(255,255,255,0.5);">0 мин.</span>
                        <span style="font-size: 10px; color: rgba(255,255,255,0.5);">${activeDelivery.isExpedited ? '3' : '30'} мин.</span>
                    </div>
                </div>
                <!-- Информационная карточка -->
                <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 12px; color: rgba(255,255,255,0.7);">Оставшееся время доставки</span>
                        <span id="delivery-remaining-time" style="font-size: 12px; color: #fff; font-weight: 600;">
                            ${remainingTime} мин.
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 12px; color: rgba(255,255,255,0.7);">Книги:</span>
                        <span style="font-size: 12px; color: #fff; font-weight: 600;">${activeDelivery.books} шт.</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 12px; color: rgba(255,255,255,0.7);">Журналы:</span>
                        <span style="font-size: 12px; color: #fff; font-weight: 600;">${activeDelivery.magazines} шт.</span>
                    </div>
                </div>
                
                <!-- Кнопка ускорения (только если не ускорена) -->
                ${!activeDelivery.isExpedited ? `
                    <button id="expedite-delivery-btn" style="
                        width: 100%;
                        background: #000000;
                        border: none;
                        border-radius: 25px;
                        padding: 12px;
                        color: white;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    " onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(0,0,0,0.4)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)'" onclick="expediteDelivery()">
                        Ускорить
                    </button>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(deliveryProgressPanel);
        
        // Обработчики событий
        deliveryProgressPanel.addEventListener('click', (e) => {
            if (e.target === deliveryProgressPanel) {
                closeDeliveryPanel();
            }
        });
        
        // Запускаем обновление прогресса
        startDeliveryProgressUpdate(deliveryProgressPanel);
    }
    
    // Функция обновления прогресса доставки
    function startDeliveryProgressUpdate(progressPanel) {
        const progressInterval = setInterval(() => {
            if (!activeDelivery || !document.body.contains(progressPanel)) {
                clearInterval(progressInterval);
                return;
            }
            
            const elapsedTime = Date.now() - activeDelivery.startTime;
            const progress = Math.min((elapsedTime / activeDelivery.duration) * 100, 100);
            const remainingTime = Math.max(0, Math.ceil((activeDelivery.duration - elapsedTime) / 60000));
            
            // Обновляем прогресс бар
            const progressBar = progressPanel.querySelector('#delivery-progress-bar');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            
            // Обновляем текст прогресса
            const progressText = progressPanel.querySelector('#delivery-progress-text');
            if (progressText) {
                if (remainingTime <= 0) {
                    progressText.textContent = 'Завершено';
                } else {
                    progressText.textContent = `${remainingTime} мин.`;
                }
            }
            
            // Обновляем оставшееся время
            const remainingTimeElement = progressPanel.querySelector('#delivery-remaining-time');
            if (remainingTimeElement) {
                if (remainingTime <= 0) {
                    remainingTimeElement.textContent = 'Завершено';
                    clearInterval(progressInterval);
                    
                    // Закрываем панель через 2 секунды
                    setTimeout(() => {
                        if (document.body.contains(progressPanel)) {
                            closeDeliveryPanel();
                        }
                    }, 2000);
                } else {
                    remainingTimeElement.textContent = `${remainingTime} мин.`;
                }
            }
            
            // Проверяем завершение доставки
            if (remainingTime <= 0) {
                clearInterval(progressInterval);
            }
        }, 1000);
    }
    
    // Функция закрытия панели доставки и открытия панели почты
    function closeDeliveryPanel() {
        // Закрываем все панели доставки
        const selectionPanel = document.getElementById('delivery-selection-panel');
        if (selectionPanel) {
            selectionPanel.remove();
        }
        
        const progressPanel = document.getElementById('delivery-progress-panel');
        if (progressPanel) {
            progressPanel.remove();
        }
        
        // Открываем панель почты
        setTimeout(() => {
            openBuildingPanel('storage');
        }, 100);
    }
    
    // Функция обновления отображения в меню доставки
    window.updateDeliveryDisplay = function() {
        const booksSlider = document.getElementById('books-delivery-slider');
        const magsSlider = document.getElementById('mags-delivery-slider');
        
        if (!booksSlider || !magsSlider) return;
        
        const booksQty = parseInt(booksSlider.value) || 0;
        const magsQty = parseInt(magsSlider.value) || 0;
        
        const booksCost = booksQty * 100;
        const magsCost = magsQty * 200;
        const totalCost = booksCost + magsCost;
        
        // Обновляем отображение
        document.getElementById('books-delivery-qty').textContent = booksQty;
        document.getElementById('books-delivery-cost').textContent = booksCost + '$';
        document.getElementById('mags-delivery-qty').textContent = magsQty;
        document.getElementById('mags-delivery-cost').textContent = magsCost + '$';
        document.getElementById('total-delivery-cost').textContent = totalCost + '$';
        
        // Активируем/деактивируем кнопку доставки
        const startBtn = document.getElementById('start-delivery-btn');
        
        if (totalCost > 0) {
            startBtn.disabled = false;
            startBtn.style.opacity = '1';
            startBtn.style.cursor = 'pointer';
        } else {
            startBtn.disabled = true;
            startBtn.style.opacity = '0.5';
            startBtn.style.cursor = 'not-allowed';
        }
    };
    // Функция начала доставки
    window.startDelivery = function() {
        const booksSlider = document.getElementById('books-delivery-slider');
        const magsSlider = document.getElementById('mags-delivery-slider');
        
        if (!booksSlider || !magsSlider) return;
        
        const booksQty = parseInt(booksSlider.value) || 0;
        const magsQty = parseInt(magsSlider.value) || 0;
        
        if (booksQty === 0 && magsQty === 0) {
            if (window.showNotification) {
                window.showNotification('❌ Выберите количество для отправки!', 'error');
            }
            return;
        }
        
        // Проверяем, есть ли достаточно товаров в хранилище
        const currentBooks = window.storedBooks || 0;
        const currentMags = window.storedMags || 0;
        
        if (booksQty > currentBooks || magsQty > currentMags) {
            if (window.showNotification) {
                window.showNotification('❌ Недостаточно товаров в хранилище!', 'error');
            }
            return;
        }
        
        // Создаем заказ доставки
        const deliveryOrder = {
            id: Date.now(),
            books: booksQty,
            magazines: magsQty,
            totalCost: booksQty * 100 + magsQty * 200,
            startTime: Date.now(),
            duration: 30 * 60 * 1000, // 30 минут в миллисекундах
            isExpedited: false
        };
        
        // Убираем товары из хранилища
        if (window.storedBooks !== undefined) {
            window.storedBooks -= booksQty;
            // Обновляем глобальную переменную в main.js
            if (typeof storedBooks !== 'undefined') {
                storedBooks = window.storedBooks;
            }
        }
        if (window.storedMags !== undefined) {
            window.storedMags -= magsQty;
            // Обновляем глобальную переменную в main.js
            if (typeof storedMags !== 'undefined') {
                storedMags = window.storedMags;
            }
        }
        
        // Сохраняем хранилище
        if (window.saveStorage) window.saveStorage();
        
        // Обновляем UI хранилища
        if (window.updateStorageUI) window.updateStorageUI();
        
        // Добавляем в очередь доставки
        deliveryQueue.push(deliveryOrder);
        saveDeliveryQueue();
        
        // Устанавливаем как активную доставку
        activeDelivery = deliveryOrder;
        
        // Запускаем таймер
        startDeliveryTimer(deliveryOrder);
        
        // Закрываем панель выбора и открываем панель прогресса
        const selectionPanel = document.getElementById('delivery-selection-panel');
        if (selectionPanel) {
            selectionPanel.remove();
        }
        
        // Показываем панель прогресса
        showDeliveryProgressPanel();
        
        // Показываем уведомление
        if (window.showNotification) {
            window.showNotification('📦 Доставка начата! Время: 30 минут', 'success');
        }
    };
    
    // Функция ускорения активной доставки
    window.expediteDelivery = function() {
        if (!activeDelivery) {
            if (window.showNotification) {
                window.showNotification('❌ Нет активной доставки для ускорения!', 'error');
            }
            return;
        }
        
        // Устанавливаем время начала на 27 минут назад (остается 3 минуты)
        activeDelivery.startTime = Date.now() - (27 * 60 * 1000);
        activeDelivery.duration = 3 * 60 * 1000; // 3 минуты
        activeDelivery.isExpedited = true;
        
        // Сохраняем состояние доставки
        saveDeliveryQueue();
        
        // Перезапускаем таймер с новыми параметрами
        if (deliveryTimer) {
            clearInterval(deliveryTimer);
        }
        startDeliveryTimer(activeDelivery);
        
        // Обновляем панель прогресса
        const progressPanel = document.getElementById('delivery-progress-panel');
        if (progressPanel) {
            progressPanel.remove();
        }
        showDeliveryProgressPanel();
        
        // Показываем уведомление
        if (window.showNotification) {
            window.showNotification('⚡ Доставка ускорена!', 'success');
        }
    };
    
    // Функция запуска таймера доставки
    function startDeliveryTimer(deliveryOrder) {
        const endTime = deliveryOrder.startTime + deliveryOrder.duration;
        
        deliveryTimer = setInterval(() => {
            const currentTime = Date.now();
            const remainingTime = endTime - currentTime;
            
            if (remainingTime <= 0) {
                // Доставка завершена
                completeDelivery(deliveryOrder);
                clearInterval(deliveryTimer);
                deliveryTimer = null;
            }
        }, 1000);
    }
    
    // Функция завершения доставки
    function completeDelivery(deliveryOrder) {
        // Добавляем деньги игроку
        if (window.setPlayerMoney && window.getPlayerMoney) {
            const currentMoney = window.getPlayerMoney();
            window.setPlayerMoney(currentMoney + deliveryOrder.totalCost);
        }
        
        // Убираем из очереди
        const index = deliveryQueue.findIndex(order => order.id === deliveryOrder.id);
        if (index > -1) {
            deliveryQueue.splice(index, 1);
            saveDeliveryQueue();
        }
        
        // Сбрасываем активную доставку
        if (activeDelivery && activeDelivery.id === deliveryOrder.id) {
            activeDelivery = null;
        }
        
        // Закрываем панель прогресса доставки
        const progressPanel = document.getElementById('delivery-progress-panel');
        if (progressPanel) {
            progressPanel.remove();
        }
        
        // Показываем уведомление
        if (window.showNotification) {
            const timeText = deliveryOrder.isExpedited ? '3 минуты' : '30 минут';
            window.showNotification(`✅ Доставка завершена! Получено: ${deliveryOrder.totalCost}$`, 'success');
        }
        
        // Отправляем уведомление на телефон
        if (window.pushNotification) {
            const timeText = deliveryOrder.isExpedited ? '3 минуты' : '30 минут';
            const booksText = deliveryOrder.books > 0 ? `${deliveryOrder.books} книг` : '';
            const magazinesText = deliveryOrder.magazines > 0 ? `${deliveryOrder.magazines} журналов` : '';
            const itemsText = [booksText, magazinesText].filter(text => text).join(', ');
            window.pushNotification('DELIVERY', `Доставка завершена! Продано: ${itemsText}. Доход: ${deliveryOrder.totalCost}$`, 'assets/icons/delivery.svg');
        }
        
        // Открываем панель почты
        setTimeout(() => {
            openBuildingPanel('storage');
        }, 100);
    }
    // Функция проверки активных доставок при загрузке
    function checkActiveDeliveries() {
        if (deliveryQueue.length > 0) {
            const now = Date.now();
            const completedDeliveries = [];
            
            deliveryQueue.forEach(order => {
                const endTime = order.startTime + order.duration;
                if (now >= endTime) {
                    completedDeliveries.push(order);
                }
            });
            
            // Завершаем просроченные доставки
            completedDeliveries.forEach(order => {
                completeDelivery(order);
            });
            
            // Если есть активные доставки, запускаем таймер для первой
            if (deliveryQueue.length > 0 && !activeDelivery) {
                activeDelivery = deliveryQueue[0];
                startDeliveryTimer(activeDelivery);
            }
        }
    }
    
    // Запускаем проверку при загрузке
    checkActiveDeliveries();
    
    // Делаем функции глобальными
    window.showDeliveryProgressPanel = showDeliveryProgressPanel;
    window.closeDeliveryPanel = closeDeliveryPanel;
})();