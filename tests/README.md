# E2E Tests — SimpliLang

Playwright E2E tests with Allure reporting.

## Запуск тестів

```bash
# Всі тести (headless)
npm test

# Тести з браузером (для дебагу)
npm run test:headed

# Тести + автоматично надіслати результати до Allure на сервері
npm run test:report
```

## Надсилання результатів до Allure

Після запуску тестів папка `allure-results/` містить JSON-файли з результатами.

```bash
# Надіслати результати на сервер і згенерувати звіт
npm run allure:send
```

## Allure UI

Після деплою на сервер Allure доступний:
- **API:** http://192.168.77.9:5050
- **UI:** http://192.168.77.9:5252

Звіт конкретного проєкту:
http://192.168.77.9:5252/projects/easy-english/reports/latest/index.html

## Деплой Allure на сервер

Allure вже додано в `docker-compose.yml`. Достатньо:

```bash
docker compose pull allure allure-ui
docker compose up -d allure allure-ui
```

## Покриття тестами

| Модуль | Тести |
|---|---|
| Home Page | Завантаження, картки вправ, навігація, перемикач мови |
| Reading Recall (без авторизації) | Каталог, prompt логіну, Cancel |
| Reading Recall (з авторизацією) | Повний flow: каталог → читання → написання → результати, History |
| Vocabulary (без авторизації) | Prompt логіну, disabled кнопка Add |
| Vocabulary (з авторизацією) | Додавання слів, фільтри, перемикач виду, зміна статусу, видалення |
| Навігація | Всі маршрути, Header, Admin кнопка, Sign Out |
