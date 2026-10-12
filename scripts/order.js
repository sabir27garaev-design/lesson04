// Переменные, нужные для работы функционала

// элементы формы расчета
const fromInput = document.getElementById('from');
const toInput = document.getElementById('to');
const calcButton = document.getElementById('calc');
const submitButton = document.getElementById('submit');

// элементы в расчетах
const distanceValue = document.getElementById('distanceValue');
const durationValue = document.getElementById('durationValue');
const rateValue = document.getElementById('rateValue');
const totalValue = document.getElementById('totalValue');

// элементы формы заявки
const orderForm = document.getElementById('orderForm');
const nameInput = document.getElementById('customerName');
const phoneInput = document.getElementById('customerPhone');
const commentInput = document.getElementById('comment');
const orderSuccessBlock = document.getElementById('orderSuccess');
const orderIdValue = document.getElementById('orderId');

// Элементы карточек размеров
const sizes = document.querySelectorAll('.main-size-card');
// Элементы карточек скоростей
const speeds = document.querySelectorAll('.main-speed-card');

// Переменные для карты, маршрута и расчетов
let map;
let mapRoute;
let calculation;

// Ставка за км для расчета стоимости в зависимости от размера посылки
const RATES = { xs: 9, s: 13, m: 20, l: 27, xl: 35, max: 70 };
// Минимальные тарифы стоимости в зависимости от размера посылки
const MIN_BY_SIZE = { xs: 149, s: 199, m: 249, l: 349, xl: 499, max: 999 };

// Запускаем стартовый функционал работы карт
ymaps.ready(() => {
// Создаем карту с центром в Москве.
map = new ymaps.Map('map', {
center: [55.751244, 37.618423],
zoom: 5,
controls: ['zoomControl']
});

// Подключаем подсказки адресов к полям от яндекса
new ymaps.SuggestView('from');
new ymaps.SuggestView('to');

// Логика выбора размера посылки и скорости доставки
[sizes, speeds].forEach(group => {
group.forEach(element => {
element.addEventListener('click', () => {
group.forEach((c) => c.classList.toggle('is-active', c.dataset.value === element.dataset.value));
renderInfo();
})
});
});

// Дизейблим кнопку Рассчитать если одного или двух значений нет
[fromInput, toInput].forEach((input) => {
input.addEventListener('change', () => {
calcButton.disabled = !(fromInput.value && toInput.value);
renderInfo();
});
});

});


// Основной расчет: строим маршрут и считаем стоимость.
calcButton.addEventListener('click', () => {
// Удаляем старый маршрут с карты.
if (mapRoute) {
map.geoObjects.remove(mapRoute);
mapRoute = null;
}

// Создаем новый маршрут по введенным точкам.
mapRoute = new ymaps.multiRouter.MultiRoute({ referencePoints: [fromInput.value, toInput.value] }, { boundsAutoApply: false });

// Добавляем новый маршрут на карту.
map.geoObjects.add(mapRoute);

// Успешно получили маршрут — берём дистанцию и время.
mapRoute.model.events.add('requestsuccess', () => {
try {
// Берем активный маршрут (основной).
const activeRoute = mapRoute.getActiveRoute();
if (!activeRoute) {
return failedCalculation();
}

// Извлекаем расстояние и длительность.
const km = activeRoute.properties.get('distance').value / 1000;
// Считаем цену: тариф * км, округляем вверх.
const size = document.querySelector('.main-size-card.is-active').dataset.value;
// Применяем минимальный порог.
let total = Math.max(MIN_BY_SIZE[size], Math.ceil(km * RATES[size]));
// Просчитываем длительность доставки
let duration = Math.min(30, 1 + Math.ceil(km / 80));
// Увеличиваем на 15% и сокращаем время на 30%
const speed = document.querySelector('.main-speed-card.is-active').dataset.value;
if (speed === 'fast') {
total = Math.ceil(total * 1.15);
duration = Math.ceil(duration - (duration * 0.30));
}

calculation = {
from: fromInput.value,
to: toInput.value,
size: size,
distance: km.toFixed(1),
duration: duration,
rate: RATES[size],
total: total,
speed: speed
};

// Выводим результат на экран.
renderInfo({
distanceText: `${calculation.distance} км`,
durationText: `${calculation.duration} дн.`,
rateText: `${calculation.rate} ₽/км`,
totalText: calculation.total
});

submitButton.disabled = false;
} catch (err) {
failedCalculation();
}
});

// Ошибка запроса маршрута.
mapRoute.model.events.add('requestfail', failedCalculation);

});

// Dывод значений просчета в форму
function renderInfo(info = null) {
// Заполняем значения в UI (или сбрасываем на "—").
distanceValue.textContent = info ? info['distanceText'] : '—';
durationValue.textContent = info ? info['durationText'] : '—';
rateValue.textContent = info ? info['rateText'] : '—';
totalValue.textContent = info ? info['totalText'] : '—';
}

// Dывод ошибки и сброс подсчетов в случае возникновения ошибки
function failedCalculation() {
calculation = null;
renderInfo();
alert('Не удалось построить маршрут. Проверьте адреса и выбранные параметры.');
submitButton.disabled = true;
}

// Отправка заявки (демо без реального бэкенда).
submitButton.addEventListener('click', async () => {
// Без расчета заявку отправлять нельзя.
if (!calculation) {
alert('Сначала рассчитайте стоимость, чтобы оформить заявку.');
return;
}

// Считываем данные клиента.
const name = nameInput.value.trim();
const phone = phoneInput.value.trim();
const comment = commentInput.value.trim();

// Простая валидация.
if (!name) {
alert('Введите имя');
return;
}
if (!phone) {
alert('Введите корректный телефон (минимум 10 цифр)');
return;
}

// Формируем демо-payload и имитируем отправку.
const payload = {
id: Math.floor(Math.random() * (100000 - 10000 + 1)) + 10000,
customer: { name, phone, comment },
createdAt: new Date().toISOString()
};
console.log('Заказ: ' + payload.id, payload);
orderId.textContent = payload.id;

// Переключаем UI на экран успеха.
orderForm.style.display = 'none';
orderSuccess.classList.add('is-visible');
});