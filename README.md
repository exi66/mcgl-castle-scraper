# mcgl-castle-scraper
HTML-DOM скрапер и анализатор для ведения статистики по [крепостям](https://forum.minecraft-galaxy.ru/fortress/) для проекта [MCGL](https://minecraft-galaxy.ru/)  

## Использование
Для запуска необходимо установить все зависимости ноды командой `npm i`. Запустить сам парсер `node parser.js <PHPSESSID> <url> [pages] [year] [path]`, где `<>` = обязательный аргумент, `[]` = возможный. 
Аргументы:
 - `PHPSESSID` - куки php сессии на форуме, узнать можно открыв панель разработчика в браузере, открыть раздел **Applications** и найти в нем строку с ключом **PHPSESSID**, это и есть куки сессии. ![Пример](https://i.imgur.com/uYjRiNv.png) 
 - `url` - ссылка на логи конкретной крепости, например ссылка на крепость Team - `https://forum.minecraft-galaxy.ru/fortresshistory/1324`
 - `pages` - скольцо страниц логов будет перебирать скрипт, по умолчанию **3**, т.е. если не указывать то он дойдет до 3 страницы в лога а именной до [этой](https://forum.minecraft-galaxy.ru/fortresshistory/1324/2) 
 - `year` - будет брать логи только с этим годом, по умолчанию берет текущий год
 - `path` - место, куда скипт сохранит данные, по умолчанию в папку **result** в этом же каталоге 
 
Если вам нужно сохранить конкретную крепость, то можно использовать вспомогательный скрапер `node fortressbattlelog-scraper.js <PHPSESSID> <url> <path>`, аргументы аналогично, за исключением `url`, здесь это урезанная ссылка на кокретный лог, например `/fortressbattlelog/1644594005`.

Для визуализации статистики `node analyser.js <path>`.
