// Простая карта на чистом HTML/CSS/JS с панорамированием/зумом и появлением зданий
(function(){
    var BASE_WIDTH = 4818;
    var BASE_HEIGHT = 3213;
    var buildingsConfig = {
        library: { // Библиотека
            img: 'building-templates/interactive-map/Buildings (8).png', x: 2411, y: 1500, w: 695, h: 1089
        },
        storage: { // Почта
            img: 'building-templates/interactive-map/Buildings (9).png', x: 2094, y: 1924, w: 590, h: 926
        },
        print: { // Типография
            img: 'building-templates/interactive-map/Buildings (11).png', x: 689, y: 1085, w: 614, h: 961
        },
        factory: { // Завод
            img: 'building-templates/interactive-map/Buildings (10).png', x: 515, y: -425, w: 817, h: 1310
        }
    };

    var stage = document.getElementById('pure-map-stage');
    var content = document.getElementById('pure-map-content');
    var bg = document.getElementById('pure-map-bg');
    var buildingsRoot = document.getElementById('pure-map-buildings');
    if(!stage || !content || !bg || !buildingsRoot){ return; }
    
    // КРИТИЧЕСКИ ВАЖНО: настраиваем стили для мобильных устройств
    // Убеждаемся, что карта всегда видна и не скрывается
    stage.style.position = 'absolute';
    stage.style.inset = '0';
    stage.style.overflow = 'hidden';
    stage.style.zIndex = '1';
    stage.style.background = 'transparent';
    stage.style.pointerEvents = 'auto';
    stage.style.touchAction = 'none'; // Отключаем нативный скролл/зум
    stage.style.webkitTapHighlightColor = 'transparent';
    stage.style.webkitTouchCallout = 'none';
    stage.style.userSelect = 'none';
    
    // Убеждаемся, что content всегда виден
    content.style.position = 'absolute';
    content.style.left = '0';
    content.style.top = '0';
    content.style.transformOrigin = '0 0';
    content.style.willChange = 'transform';
    content.style.backfaceVisibility = 'hidden';
    content.style.opacity = '1';
    content.style.visibility = 'visible';
    content.style.display = 'block';
    
    // Создаём отдельный контейнер для статичных кругов (вне transform)
    var circlesContainer = document.createElement('div');
    circlesContainer.id = 'pure-map-circles';
    circlesContainer.style.position = 'absolute';
    circlesContainer.style.left = '0';
    circlesContainer.style.top = '0';
    circlesContainer.style.width = '100%';
    circlesContainer.style.height = '100%';
    circlesContainer.style.pointerEvents = 'none';
    circlesContainer.style.zIndex = '3';
    circlesContainer.style.overflow = 'hidden'; // Скрываем круги за пределами viewport
    stage.appendChild(circlesContainer);
    
    // Оптимизация производительности для плавного свайпа (уже настроено выше)

    // Панорамирование/зум - объявляем state раньше, чтобы использовать в функциях
    var state = { scale: 0.18, minScale: 0.12, maxScale: 3, x: 0, y: 0, dragging: false, lastX: 0, lastY: 0, vx: 0, vy: 0 };
    
    // Начальный масштаб карты (устанавливается при fitToStage)
    var initialScale = null;
    
    // Состояние для пинч-зума
    var pinchState = { active: false, initialDistance: 0, initialScale: 0 };
    
    // Оптимизация производительности: батчинг обновлений
    var updateScheduled = false;
    var pendingUpdate = false;
    var rafId = null;
    var isDragging = false;

    // Устанавливаем базовые размеры подложки
    bg.style.width = BASE_WIDTH + 'px';
    bg.style.height = BASE_HEIGHT + 'px';

    // Создаём узлы зданий
    var buildingNodes = {};
    Object.keys(buildingsConfig).forEach(function(key){
        var cfg = buildingsConfig[key];
        var el = document.createElement('img');
        el.src = cfg.img;
        el.alt = key;
        el.style.position = 'absolute';
        el.style.left = cfg.x + 'px';
        el.style.top = cfg.y + 'px';
        el.style.width = cfg.w + 'px';
        el.style.height = cfg.h + 'px';
        el.style.pointerEvents = 'auto';
        el.style.userSelect = 'none';
        el.style.webkitUserDrag = 'none';
        buildingsRoot.appendChild(el);
        buildingNodes[key] = el;
    });

    function readBuildingsState(){
        try{ return JSON.parse(localStorage.getItem('buildingsData')||'{}'); }catch(e){ return {}; }
    }

    function applyVisibility(){
        var data = readBuildingsState();
        Object.keys(buildingNodes).forEach(function(key){
            if(key === 'library'){
                setOwnedUI('library');
                return;
            }
            var owned = !!(data[key] && data[key].isOwned === true);
            if(owned){
                setOwnedUI(key);
            }else{
                buildingNodes[key].style.display = 'none';
                if(circleNodes[key]) circleNodes[key].style.display = 'none';
                buildingNodes[key].onclick = null;
            }
        });
    }

    // Круговые индикаторы для купленных зданий (статичные, вне transform)
    var circleNodes = {};
    var CIRCLE_SIZE = 90; // Размер круга
    var CIRCLE_OFFSET = 10; // Отступ от края здания
    
    // Функция для обновления позиций кругов на основе текущего состояния карты
    function updateCirclesPositions(){
        var sw = stage.clientWidth;
        var sh = stage.clientHeight;
        
        Object.keys(circleNodes).forEach(function(key){
            var circle = circleNodes[key];
            if(!circle || !circle.parentNode || circle.style.display === 'none') return;
            
            // КРИТИЧЕСКИ ВАЖНО: проверяем, что круг в правильном контейнере
            // Проверяем только если не во время драга (для производительности)
            if(!isDragging && circle.parentNode !== circlesContainer){
                // Принудительно перемещаем круг в правильный контейнер
                var oldParent = circle.parentNode;
                if(oldParent){
                    oldParent.removeChild(circle);
                }
                circlesContainer.appendChild(circle);
            }
            
            var cfg = buildingsConfig[key];
            if(!cfg) return;
            
            // Вычисляем позицию круга на карте (правый верхний угол здания)
            var circleX = cfg.x + cfg.w - CIRCLE_SIZE - CIRCLE_OFFSET - 10;
            var circleY = cfg.y + CIRCLE_OFFSET;
            
            // Применяем трансформацию карты к координатам
            var screenX = state.x + circleX * state.scale;
            var screenY = state.y + circleY * state.scale;
            
            // Проверяем, находится ли круг в видимой области (viewport)
            var circleSize = CIRCLE_SIZE;
            var actualX = screenX - 45; // Учитываем сдвиг влево
            var isVisible = !(actualX + circleSize < 0 || 
                             actualX > sw || 
                             screenY + circleSize < 0 || 
                             screenY > sh);
            
            // Устанавливаем позицию относительно stage (viewport)
            circle.style.left = actualX + 'px';
            circle.style.top = screenY + 'px';
            circle.style.width = CIRCLE_SIZE + 'px';
            circle.style.height = CIRCLE_SIZE + 'px';
            circle.style.visibility = isVisible ? 'visible' : 'hidden';
        });
    }
    
    function ensureCircle(key){
        // Если круг уже существует, проверяем, что он в правильном контейнере
        if(circleNodes[key]){
            var existingCircle = circleNodes[key];
            // Если круг не в circlesContainer, перемещаем его
            if(existingCircle.parentNode && existingCircle.parentNode !== circlesContainer){
                existingCircle.parentNode.removeChild(existingCircle);
                circlesContainer.appendChild(existingCircle);
            }
            return existingCircle;
        }
        var cfg = buildingsConfig[key];
        if(!cfg) return null;
        var circle = document.createElement('div');
        circle.style.position = 'absolute';
        circle.style.width = CIRCLE_SIZE + 'px';
        circle.style.height = CIRCLE_SIZE + 'px';
        circle.style.borderRadius = '50%';
        circle.style.background = 'radial-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.0))';
        circle.style.pointerEvents = 'none';
        circle.style.filter = 'blur(0.2px)';
        circle.style.zIndex = '1';
        circle.style.display = '';
        // Оптимизация для плавного обновления
        circle.style.willChange = 'left, top'; // Используем left/top, а не transform
        circle.style.backfaceVisibility = 'hidden';
        // Добавляем в контейнер статичных кругов, а не в buildingsRoot
        // ВАЖНО: все круги должны быть в circlesContainer, чтобы быть статичными
        if(circle.parentNode && circle.parentNode !== circlesContainer){
            // Если круг уже где-то есть, перемещаем его в правильный контейнер
            circle.parentNode.removeChild(circle);
        }
        circlesContainer.appendChild(circle);
        circleNodes[key] = circle;
        // Обновляем позицию сразу после создания (синхронно, чтобы круг сразу был виден)
        // Используем прямое обновление, а не через requestAnimationFrame
        var circleX = cfg.x + cfg.w - CIRCLE_SIZE - CIRCLE_OFFSET - 10;
        var circleY = cfg.y + CIRCLE_OFFSET;
        var screenX = state.x + circleX * state.scale;
        var screenY = state.y + circleY * state.scale;
        var sw = stage.clientWidth;
        var sh = stage.clientHeight;
        var circleSize = CIRCLE_SIZE;
        var actualX = screenX - 45; // Учитываем сдвиг влево
        var isVisible = !(actualX + circleSize < 0 || 
                         actualX > sw || 
                         screenY + circleSize < 0 || 
                         screenY > sh);
        circle.style.left = actualX + 'px';
        circle.style.top = screenY + 'px';
        circle.style.visibility = isVisible ? 'visible' : 'hidden';
        return circle;
    }

    function setOwnedUI(key){
        if(buildingNodes[key]){
            buildingNodes[key].style.display = '';
            var circle = ensureCircle(key);
            if(circle){
                // КРИТИЧЕСКИ ВАЖНО: проверяем, что круг в правильном контейнере
                // Если круг находится в buildingsRoot (внутри transform), он будет двигаться вместе с картой
                if(circle.parentNode !== circlesContainer){
                    // Принудительно перемещаем круг в правильный контейнер
                    var oldParent = circle.parentNode;
                    if(oldParent){
                        oldParent.removeChild(circle);
                    }
                    circlesContainer.appendChild(circle);
                }
                
                circle.style.display = '';
                // Обновляем позицию круга после отображения (синхронно)
                var cfg = buildingsConfig[key];
                if(cfg){
                    var circleX = cfg.x + cfg.w - CIRCLE_SIZE - CIRCLE_OFFSET - 10;
                    var circleY = cfg.y + CIRCLE_OFFSET;
                    var screenX = state.x + circleX * state.scale;
                    var screenY = state.y + circleY * state.scale;
                    var sw = stage.clientWidth;
                    var sh = stage.clientHeight;
                    var circleSize = CIRCLE_SIZE;
                    var actualX = screenX - 45; // Учитываем сдвиг влево
                    var isVisible = !(actualX + circleSize < 0 || 
                                     actualX > sw || 
                                     screenY + circleSize < 0 || 
                                     screenY > sh);
                    circle.style.left = actualX + 'px';
                    circle.style.top = screenY + 'px';
                    circle.style.visibility = isVisible ? 'visible' : 'hidden';
                }
            }
            // Клик по зданию открывает соответствующую панель
            buildingNodes[key].style.cursor = 'pointer';
            buildingNodes[key].style.zIndex = '2';
            buildingNodes[key].setAttribute('role','button');
            buildingNodes[key].onclick = function(){
                try{
                    var names = {factory:'Завод', storage:'Почта', print:'Типография', library:'Библиотека'};
                    if(typeof window.openBuildingPanel === 'function'){
                        window.openBuildingPanel(key, names[key]||'');
                        return;
                    }
                }catch(e){}
            };
        }
    }

    // Функция для получения экранных координат здания
    function getBuildingScreenPosition(key){
        // Используем реальный DOM элемент круга, если он существует (теперь статичный)
        if(circleNodes[key] && circleNodes[key].parentNode){
            var circleRect = circleNodes[key].getBoundingClientRect();
            return { 
                x: circleRect.left + circleRect.width / 2, 
                y: circleRect.top + circleRect.height / 2, 
                width: circleRect.width, 
                height: circleRect.height 
            };
        }
        // Fallback: вычисляем координаты вручную (правый верхний угол здания)
        var cfg = buildingsConfig[key];
        if(!cfg) return null;
        var stageRect = stage.getBoundingClientRect();
        // Правый верхний угол здания (как в ensureCircle)
        var circleSize = CIRCLE_SIZE;
        var offset = CIRCLE_OFFSET;
        var buildingRightX = cfg.x + cfg.w - circleSize - offset - 10;
        var buildingTopY = cfg.y + offset;
        // Применяем трансформацию карты: координаты относительно stage
        var screenX = stageRect.left + state.x + (buildingRightX + circleSize / 2) * state.scale;
        var screenY = stageRect.top + state.y + (buildingTopY + circleSize / 2) * state.scale;
        return { x: screenX, y: screenY, width: circleSize * state.scale, height: circleSize * state.scale };
    }

    // Экспортируем API для мгновенного показа после покупки
    window.pureMap = {
        showBuilding: function(key){ setOwnedUI(key); },
        getBuildingPosition: getBuildingScreenPosition,
        getBuildingsConfig: function(){ return buildingsConfig; },
        getState: function(){ return state; },
        getStage: function(){ return stage; }
    };

    function clampPan(){
        var sw = stage.clientWidth, sh = stage.clientHeight;
        var mapW = BASE_WIDTH * state.scale, mapH = BASE_HEIGHT * state.scale;
        var minX = Math.min(0, sw - mapW), maxX = Math.max(0, sw - mapW) + 0; // если карта меньше экрана — центрируем
        var minY = Math.min(0, sh - mapH), maxY = Math.max(0, sh - mapH) + 0;
        if(mapW <= sw){ state.x = (sw - mapW) * 0.5; } else { state.x = Math.min(0, Math.max(minX, state.x)); }
        if(mapH <= sh){ state.y = (sh - mapH) * 0.5; } else { state.y = Math.min(0, Math.max(minY, state.y)); }
    }
    function applyTransform(){
        clampPan();
        // Применяем трансформацию синхронно для мгновенного обновления карты
        // Используем translate3d для аппаратного ускорения
        // КРИТИЧЕСКИ ВАЖНО: убеждаемся, что карта всегда видна
        content.style.transform = 'translate3d('+state.x+'px,'+state.y+'px,0) scale('+state.scale+')';
        content.style.opacity = '1';
        content.style.visibility = 'visible';
        content.style.display = 'block';
        
        // Батчинг обновлений кругов для улучшения производительности
        // Обновляем круги через requestAnimationFrame, чтобы не блокировать основной поток
        pendingUpdate = true;
        if(!updateScheduled){
            updateScheduled = true;
            requestAnimationFrame(function(){
                updateScheduled = false;
                if(pendingUpdate){
                    pendingUpdate = false;
                    // Обновляем позиции статичных кругов
                    updateCirclesPositions();
                    // Обновляем индикаторы прибыли
                    if(typeof window.updateProfitIndicatorsPositions === 'function'){
                        window.updateProfitIndicatorsPositions();
                    }
                }
            });
        }
    }
    
    // Оптимизированная функция для быстрого обновления только карты (без кругов)
    function applyTransformFast(){
        clampPan();
        // КРИТИЧЕСКИ ВАЖНО: гарантируем видимость карты при каждом обновлении
        content.style.transform = 'translate3d('+state.x+'px,'+state.y+'px,0) scale('+state.scale+')';
        content.style.opacity = '1';
        content.style.visibility = 'visible';
        content.style.display = 'block';
    }

    function fitToStage(){
        var sw = stage.clientWidth;
        var sh = stage.clientHeight;
        var sx = sw / BASE_WIDTH;
        var sy = sh / BASE_HEIGHT;
        // Используем cover, чтобы карта заполняла экран по меньшей стороне без полос
        var s = Math.max(sx, sy);
        state.scale = Math.max(state.minScale, Math.min(state.maxScale, s));
        // Сохраняем начальный масштаб (нельзя отдалить больше этого значения)
        if(initialScale === null){
            initialScale = state.scale;
        }
        // Центрирование
        state.x = (sw - BASE_WIDTH*state.scale) * 0.5;
        state.y = (sh - BASE_HEIGHT*state.scale) * 0.5;
        applyTransform();
    }

    // Функция для вычисления расстояния между двумя точками
    function getDistance(x1, y1, x2, y2){
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    }
    
    // Функция для вычисления центра между двумя точками
    function getCenter(x1, y1, x2, y2){
        return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    }
    
    // Хранилище активных указателей для пинч-жеста
    var activePointers = {};
    
    // Drag и пинч-зум
    stage.addEventListener('pointerdown', function(e){
        activePointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        
        // Если два указателя активны, начинаем пинч-зум
        var pointerIds = Object.keys(activePointers);
        if(pointerIds.length === 2){
            pinchState.active = true;
            state.dragging = false;
            var p1 = activePointers[pointerIds[0]];
            var p2 = activePointers[pointerIds[1]];
            pinchState.initialDistance = getDistance(p1.x, p1.y, p2.x, p2.y);
            pinchState.initialScale = state.scale;
            
            // Вычисляем центр пинча
            var center = getCenter(p1.x, p1.y, p2.x, p2.y);
            var rect = stage.getBoundingClientRect();
            pinchState.centerX = center.x - rect.left;
            pinchState.centerY = center.y - rect.top;
        } else {
            state.dragging = true;
            isDragging = true;
            state.lastX = e.clientX;
            state.lastY = e.clientY;
            state.vx = 0;
            state.vy = 0;
        }
        stage.setPointerCapture(e.pointerId);
    });
    
    // Функция для плавного обновления через requestAnimationFrame
    function scheduleUpdate(){
        // Отменяем предыдущий запрос, если он еще не выполнен, чтобы избежать накопления обновлений
        if(rafId !== null){
            cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(function(){
            rafId = null;
            applyTransform();
        });
    }
    
    stage.addEventListener('pointermove', function(e){
        activePointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        
        var pointerIds = Object.keys(activePointers);
        
        // Обработка пинч-зума
        if(pinchState.active && pointerIds.length === 2){
            var p1 = activePointers[pointerIds[0]];
            var p2 = activePointers[pointerIds[1]];
            var currentDistance = getDistance(p1.x, p1.y, p2.x, p2.y);
            
            // Вычисляем новый масштаб с ограничением
            var scaleFactor = currentDistance / pinchState.initialDistance;
            var newScale = pinchState.initialScale * scaleFactor;
            // Ограничиваем минимальным масштабом (начальным) и максимальным
            var minAllowedScale = initialScale !== null ? initialScale : state.minScale;
            newScale = Math.max(minAllowedScale, Math.min(state.maxScale, newScale));
            
            // Применяем зум напрямую без сглаживания для устранения лагов
            state.scale = newScale;
            
            // Вычисляем точку на карте под центром пинча
            var mapX = (pinchState.centerX - state.x) / state.scale;
            var mapY = (pinchState.centerY - state.y) / state.scale;
            
            // Применяем зум с прямой установкой позиции
            state.x = pinchState.centerX - mapX * state.scale;
            state.y = pinchState.centerY - mapY * state.scale;
            
            // Используем быстрое обновление для плавности
            applyTransformFast();
            scheduleUpdate();
            return;
        }
        
        // Обычное перетаскивание (улучшенная плавность)
        if(!state.dragging) return;
        // Улучшенная чувствительность для более плавного движения
        var sensitivity = 1.3; // немного увеличена для лучшей отзывчивости
        var dx = (e.clientX - state.lastX) * sensitivity;
        var dy = (e.clientY - state.lastY) * sensitivity;
        state.lastX = e.clientX;
        state.lastY = e.clientY;
        state.x += dx;
        state.y += dy;
        state.vx = 0;
        state.vy = 0;
        
        // Используем быстрое обновление для плавности свайпа
        applyTransformFast();
        scheduleUpdate();
    });
    
    stage.addEventListener('pointerup', function(e){
        delete activePointers[e.pointerId];
        if(Object.keys(activePointers).length < 2){
            pinchState.active = false;
        }
        if(Object.keys(activePointers).length === 0){
            state.dragging = false;
            isDragging = false;
            // Обновляем круги после окончания драга
            if(rafId !== null){
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            applyTransform();
        }
    });
    
    stage.addEventListener('pointercancel', function(e){
        delete activePointers[e.pointerId];
        if(Object.keys(activePointers).length < 2){
            pinchState.active = false;
        }
        if(Object.keys(activePointers).length === 0){
            state.dragging = false;
            isDragging = false;
            // Обновляем круги после окончания драга
            if(rafId !== null){
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            applyTransform();
        }
    });
    
    // Отключаем нативный скролл/зум браузера для корректного свайпа
    try{ stage.style.touchAction = 'none'; }catch(e){}
    
    // КРИТИЧЕСКИ ВАЖНО: защита от скрытия карты на мобильных устройствах
    var ensureMapVisible = function(){
        if(content && (content.style.opacity !== '1' || content.style.visibility !== 'visible' || content.style.display === 'none')){
            content.style.opacity = '1';
            content.style.visibility = 'visible';
            content.style.display = 'block';
        }
        if(stage && (stage.style.opacity !== '1' || stage.style.visibility !== 'visible' || stage.style.display === 'none')){
            stage.style.opacity = '1';
            stage.style.visibility = 'visible';
            stage.style.display = 'block';
        }
    };
    
    // Периодически проверяем, что карта видна (только на мобильных устройствах)
    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
        setInterval(ensureMapVisible, 200);
        // Также проверяем при каждом touch событии
        stage.addEventListener('touchstart', ensureMapVisible, { passive: true });
        stage.addEventListener('touchmove', ensureMapVisible, { passive: true });
    }

    // Зум колесиком мыши для ПК (можно приближать и отдалять, но не меньше начального масштаба)
    stage.addEventListener('wheel', function(e){
        e.preventDefault();
        if(state.dragging) return; // Не зумим во время перетаскивания
        
        var delta = e.deltaY;
        var zoomFactor = 0.08; // Уменьшена скорость зума для более плавного эффекта
        var zoomSensitivity = delta > 0 ? 1 - zoomFactor : 1 + zoomFactor; // Отдаление или приближение
        
        // Получаем позицию мыши относительно stage
        var rect = stage.getBoundingClientRect();
        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;
        
        // Вычисляем точку на карте под курсором до зума
        var mapX = (mouseX - state.x) / state.scale;
        var mapY = (mouseY - state.y) / state.scale;
        
        // Применяем зум с плавной интерполяцией
        var targetScale = state.scale * zoomSensitivity;
        // Ограничиваем минимальным масштабом (начальным) и максимальным
        var minAllowedScale = initialScale !== null ? initialScale : state.minScale;
        targetScale = Math.max(minAllowedScale, Math.min(state.maxScale, targetScale));
        
        // Если уже на границе, не делаем ничего
        if(targetScale === state.scale) return;
        
        // Применяем зум напрямую без сглаживания для устранения лагов
        state.scale = targetScale;
        
        // Вычисляем новую позицию, чтобы точка под курсором осталась на месте
        state.x = mouseX - mapX * state.scale;
        state.y = mouseY - mapY * state.scale;
        
        // Используем быстрое обновление для плавности зума
        applyTransformFast();
        scheduleUpdate();
    }, { passive: false });

    // Убрана кнопка быстрого свайпа

    function focusToKey(key){
        var cfg = buildingsConfig[key];
        if(!cfg) return;
        var sw = stage.clientWidth, sh = stage.clientHeight;
        // Фиксированный масштаб под объект (~35% * 3 = ~105% меньшей стороны экрана)
        var targetSize = Math.min(sw, sh) * (0.35 * 3);
        var scaleX = targetSize / cfg.w;
        var scaleY = targetSize / cfg.h;
        var targetScale = Math.max(state.minScale, Math.min(state.maxScale, Math.min(scaleX, scaleY)));
        var objCx = cfg.x + cfg.w/2;
        var objCy = cfg.y + cfg.h/2;
        state.scale = targetScale;
        state.x = (sw/2) - objCx * targetScale;
        state.y = (sh/2) - objCy * targetScale;
        applyTransform();
    }

    // Экспорт фиксированных зумов
    window.pureMap.focusTo = function(key){ focusToKey(key); };
    window.zoomToLibrary = function(){ focusToKey('library'); };
    window.zoomToStorage = function(){ focusToKey('storage'); };

    // Функция для проверки и исправления всех кругов
    function fixAllCircles(){
        Object.keys(circleNodes).forEach(function(key){
            var circle = circleNodes[key];
            if(!circle) return;
            // Принудительно перемещаем все круги в правильный контейнер
            if(circle.parentNode !== circlesContainer){
                var oldParent = circle.parentNode;
                if(oldParent){
                    oldParent.removeChild(circle);
                }
                circlesContainer.appendChild(circle);
            }
        });
        // Обновляем позиции после исправления
        updateCirclesPositions();
    }
    
    window.addEventListener('resize', fitToStage);
    fitToStage();
    applyVisibility();
    // Библиотека — видна и кликабельна изначально
    setOwnedUI('library');
    // Исправляем все круги после инициализации
    setTimeout(fixAllCircles, 100);
    
    // КРИТИЧЕСКИ ВАЖНО: финальная проверка видимости карты после инициализации
    setTimeout(function(){
        ensureMapVisible();
        // Убеждаемся, что карта видна
        if(content){
            content.style.opacity = '1';
            content.style.visibility = 'visible';
            content.style.display = 'block';
        }
        if(stage){
            stage.style.opacity = '1';
            stage.style.visibility = 'visible';
            stage.style.display = 'block';
        }
    }, 200);
})();


