/* eslint-disable no-use-before-define */
/* eslint-disable max-len */

var api = "9a72792b-0604-4317-9b40-4a5a92344ac9";
var routeList = document.getElementById("route-list");
var paginationList = document.getElementById("pagination-list");
var routesOnPage = 5;
var currentPage = 1;
var selectedRoute = null;
var max_len = 110;

var selectedRouteBeforeFilter = null;

var guidesPerPage = 3; 
var currentGuidesPage = 1; 

var logJSON = (jsonObject) => {
    var jsonString = JSON.stringify(jsonObject, null, 2);
    console.log(jsonString);
};

//объявление data для её видимости и доступности в любой части кода
var data;

//получение данных о маршрутах
async function getRoute(api) {
    //создание url для запроса 
    var Url = new URL("http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/routes");
    Url.searchParams.append("api_key", api);

    try {
        //отправка get запроса к серверу
        var response = await fetch(Url);

        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }

        //глобальная переменная для сохранения данных в формате json 
        data = await response.json();
        console.log("Полученные данные:", data);
        //вызов функции для отображения маршрутов на сайте
        renderRoute(data);
        
        //находим уникальные достопримечатнльности из полученных данных
        var mainObjects = [...new Set(data.map(route => route.mainObject))];

        var mainObjectSelect = document.getElementById("mainObjectSelect");

        //добавление строки "Не выбрано"
        var notSelectedOption = document.createElement("option");
        notSelectedOption.value = "Не выбрано";
        notSelectedOption.text = "Не выбрано";
        mainObjectSelect.add(notSelectedOption);

        //остальные достопримечательности
        mainObjects.forEach(mainObject => {
            var option = document.createElement("option");
            option.value = mainObject;
            option.text = mainObject;
            mainObjectSelect.add(option);
        });

        //вызов функции для отображения маршрутов на сайте
        renderRoute(data);

    } catch (error) {
        //если ошибка, выводим ссобщение в консоль отладки
        console.error("Ошибка во время запроса:", error.message);
        
        //создание элемента с сообщением об ошибке
        var errorMessage = document.createElement("p");
        errorMessage.textContent = "Произошла ошибка при загрузке данных. Пожалуйста, повторите попытку позже.";
        
        //нахождение контейнера для данных на сайте и его очищение
        var dataTableBody = document.getElementById("data-container");
        dataTableBody.innerHTML = "";
        //добавление сообщения об ошибке в контейнер
        dataTableBody.appendChild(errorMessage);
    }
}

//отображение маршрутов на сайте
async function renderRoute(routes) {
    var dataTableBody = document.getElementById("data-container");
    //очищение таблицы перед добавлением новых данных
    dataTableBody.innerHTML = ''; 

    //создание таблицы 
    var table = document.createElement("table");
    table.classList.add("table", "table-striped"); 

    //создание заголовков таблицы
    var tableHeader = document.createElement("thead");
    var headerRow = document.createElement("tr");
    var headerColumns = ["Название маршрута", "Описание", "Достопримечательности", ""];

    //добавление заголовков столбцов
    headerColumns.forEach(columnText => {
        var headerCell = document.createElement("th");
        headerCell.textContent = columnText;
        headerRow.appendChild(headerCell);
    });

    tableHeader.appendChild(headerRow);
    table.appendChild(tableHeader);

    //создание тела таблицы
    var tableBody = document.createElement("tbody");

    //вычисление начала и конца диапазона маршрутов, которыц нужно отобразить
    var start = (currentPage - 1) * routesOnPage;
    var end = start + routesOnPage;
    var routesToShow = routes.slice(start, end);    

    //перебор маршрутов для отображения каждого в таблице
    routesToShow.forEach((route) => {
        var row = document.createElement("tr");
        if (selectedRoute === route.id) {
            row.classList.add("table-success");
        }

        //создание ячейки таблицы с возможностью обрезать текст, если он слишком длинный
        var createCell = (textContent, maxLength) => {
            var cell = document.createElement("td");
            var content = (textContent.length > maxLength) ? `${textContent.substring(0, maxLength)}...` : textContent;

            cell.textContent = content;

            if (textContent.length > maxLength) {
                cell.setAttribute("title", textContent);
                cell.setAttribute("data-bs-toggle", "tooltip");
                cell.setAttribute("data-bs-placement", "bottom");
            }

            return cell;
        };

        var nameCell = createCell(route.name, max_len);
        var descriptionCell = createCell(route.description, max_len);
        var mainObjectCell = createCell(route.mainObject, max_len);

        var selectCell = document.createElement("td");
        var selectButton = document.createElement("button");
        selectButton.classList.add("btn", "btn-custom-green"); 
        selectButton.textContent = "Выбрать";

        //обработчик клика на кнопке "Выбрать" маршрута
        selectButton.addEventListener("click", async () => {
            selectedRoute = route.id;
            renderRoute(routes); //перерисовка таблицы, чтобы выделить выбранный маршрут
            await getGuides(selectedRoute); //загрузка данных о гидах после выбора маршрута
        });
        

        row.appendChild(nameCell);
        row.appendChild(descriptionCell);
        row.appendChild(mainObjectCell);
        selectCell.appendChild(selectButton);
        row.appendChild(selectCell);

        tableBody.appendChild(row);
    });

    //добавление тела таблицы к таблице
    table.appendChild(tableBody);
    //доабвление таблицы к элементу, где она будет отображаться на сайте
    dataTableBody.appendChild(table);

    //вызов функции отображения пагинации
    renderPagination(routes.length, routes); 
}

//функция для отображения пагинации
function renderPagination(totalRoutes, routes) {
    //вычисление общего кол-ва страниц
    var totalPages = Math.ceil(totalRoutes / routesOnPage);
    paginationList.innerHTML = "";

    //создание пагинации лоя каждой страницы
    for (let i = 1; i <= totalPages; i++) {
        //создание элемента списка для страницы
        var pageLink = document.createElement("li");
        pageLink.classList.add("page-item"); 

        //создание ссылки для перехода на страницу
        var link = document.createElement("a");
        link.classList.add("page-link"); 
        link.href = "#";
        link.textContent = i;

        //обработчик клика на ссылку
        link.addEventListener("click", (function (pageNumber) {
            return function (e) {
                e.preventDefault();
                currentPage = pageNumber; //текущая страница
                renderRoute(routes); //перерисовка таблица маршрутов для выбранной страницы
            };
        })(i));

        pageLink.appendChild(link);
        paginationList.appendChild(pageLink);
    }
}

//фильтр маршрутов на основе выбранной достопримечательности и названия маршрута
function searchRoutes(routesData) {
    //сохранение выбранного маршрута перед исользованием фильтров
    var selectedRouteBeforeFilter = selectedRoute;

    //получение выбранной достопримечательности
    var selectedAttraction = document.getElementById("mainObjectSelect").value;

    //получение введенного названия маршрута
    var routeName = document.getElementById("routeName").value.trim();

    if (selectedAttraction === "Не выбрано" && routeName === "") {
        //если  не выбрано и название маршрута не введено, отобразить все маршруты
        renderRoute(routesData);
    } else {
        //применение фильтров по достопримечательности и названию маршрута
        var filteredRoutes = routesData.filter(route =>
            (selectedAttraction === "Не выбрано" || route.mainObject === selectedAttraction) &&
            (routeName === "" || route.name.toLowerCase().includes(routeName.toLowerCase()))
        );

        //отображение и сохранение выбранного маршрута при использовании фильтров
        if (selectedRouteBeforeFilter) {
            selectedRoute = selectedRouteBeforeFilter;
        }

        renderRoute(filteredRoutes);
    }
}

//обработчик события для кнопки "поиск маршрутов"
document.getElementById("searchButton").addEventListener("click", function() {
    searchRoutes(data); //передача данных в searchRoutes
});

//сброс фильтров
function resetFilter() {
    //сохранение выбранного маршрута перед сбросом фильтров
    selectedRouteBeforeFilter = selectedRoute;

    //сброс выбранной достопримечательности
    document.getElementById("mainObjectSelect").selectedIndex = 0;

    //сброс выбранного маршрута и текущей страницы
    selectedRoute = selectedRouteBeforeFilter; //восстанавливаем значение selectedRoute
    currentPage = 1;

    //очищение поля ввода для названия маршрута
    document.getElementById("routeName").value = '';

    //перерисовка таблицы с полным списком маршрутов
    renderRoute(data);
}


//обработчик события для кнопки "сбросить фильтр"
var resetButton = document.getElementById("resetButton");
resetButton.addEventListener("click", resetFilter);

var routeNameInput = document.getElementById("routeName");
routeNameInput.addEventListener("input", function() {
    searchByName(this.value);
});

// поиск маршрутов по названию
function searchByName(routeName) {
    //получение выбранной достопримечательности
    var selectedAttraction = document.getElementById("mainObjectSelect").value;

    //фильтр по названию и достопримечательности
    var filteredRoutes = data.filter(route => 
        (selectedAttraction === "Не выбрано" || route.mainObject === selectedAttraction) &&
        (routeName === "" || route.name.toLowerCase().includes(routeName.toLowerCase()))
    );
    renderRoute(filteredRoutes);
}

//ЧАСТЬ С ГИДАМИ
var guidesPerPage = 3; 
var currentGuidesPage = 1; 

//получение данных о гидах
async function getGuides(routeId) {
    //проверка, если routeId равно null, тогда возвращаем пустой массив
    if (routeId === null) {
        renderGuides([]); 
        return;
    }
    //формирование URL для запроса данных о гидах для конкретного маршрута (по id)
    var guidesUrl = new URL(`http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/routes/${routeId}/guides`);
    guidesUrl.searchParams.append("api_key", api);

    try {
        //асинхрон запрос для получения данных о гидах
        var response = await fetch(guidesUrl);

        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }

        //получение данных о гидах 
        var guidesData = await response.json();
        console.log("Полученные данные о гидах:", guidesData);
        //отображение данных о гидах на странице 
        renderGuides(guidesData);

    } catch (error) {
        console.error("Ошибка во время запроса:", error.message);
    }
}

function renderGuidesTable(guides, start, end) {
    var guidesTableBody = document.getElementById("guides-container");
    guidesTableBody.innerHTML = '';

    if (guides.length === 0) {
        //если нет данных о гидах, выводим сообщение
        var noDataMessage = document.createElement("p");
        noDataMessage.textContent = "Нет данных для отображения.";
        guidesTableBody.appendChild(noDataMessage);
        return;
    }

    var table = document.createElement("table");
    table.classList.add("table", "table-striped");

    var tableHeader = document.createElement("thead");
    var headerRow = document.createElement("tr");
    var headerColumns = ["", "Язык", "ФИО", "Стоимость/час", "Опыт работы", ""];

    headerColumns.forEach(columnText => {
        //создание заголовков столбцов таблицы
        var headerCell = document.createElement("th");
        headerCell.textContent = columnText;
        headerRow.appendChild(headerCell);
    });

    tableHeader.appendChild(headerRow);
    table.appendChild(tableHeader);

    var tableBody = document.createElement("tbody");

    for (let i = start; i < end; i++) {
        if (i >= guides.length) {
            break;
        }

        var guide = guides[i];
        var row = document.createElement("tr");

        //проверяем, выбран ли данный гид, и добавляем класс table-success для выделения
        if (selectedGuide === guide.id) {
            row.classList.add("table-success");
        }

        var createCell = (textContent, isImage = false) => {
            var cell = document.createElement("td");

            if (isImage) {
                //если isImage равно true, создаем ячейку с изображением 
                var image = document.createElement("img");
                image.src = textContent;
                image.alt = "Аватар гида";
                image.style.maxWidth = "50px";
                cell.appendChild(image);
            } else {
                cell.textContent = textContent;
            }

            return cell;
        };

        var avatarCell = createCell("../EXAM/images/guide.png", true);
        var languageCell = createCell(guide.language);
        var nameCell = createCell(guide.name);

        //создание ячейку для стоимости с подписью "руб/час"
        var pricePerHourCell = document.createElement("td");
        var priceSpan = document.createElement("span");
        priceSpan.textContent = guide.pricePerHour + " руб/час";
        pricePerHourCell.appendChild(priceSpan);

        //создание ячейку для опыта работы с подписью "лет"
        var workExperienceCell = document.createElement("td");
        var experienceSpan = document.createElement("span");
        experienceSpan.textContent = guide.workExperience + " лет";
        workExperienceCell.appendChild(experienceSpan);

        row.appendChild(avatarCell);
        row.appendChild(languageCell);
        row.appendChild(nameCell);
        row.appendChild(pricePerHourCell);
        row.appendChild(workExperienceCell);

        var selectCell = document.createElement("td");
        var selectButton = document.createElement("button");
        selectButton.classList.add("btn", "btn-custom-green");
        selectButton.textContent = "Выбрать";

        //замыкание для сохранения правильного идентификатора гида
        selectButton.addEventListener("click", (function (selectedGuideId) {
            return function () {
                selectedGuide = selectedGuideId;
                renderGuidesTable(guides, start, end);
                console.log("Выбран гид:", guide);
            };
        })(guide.id));

        selectCell.appendChild(selectButton);
        row.appendChild(selectCell);

        tableBody.appendChild(row);
    }

    table.appendChild(tableBody);
    guidesTableBody.appendChild(table);
}


function renderGuides(guides) {
    //вычисление общее кол-во страниц для отображения данных о гидах
    var totalPages = Math.ceil(guides.length / guidesPerPage);
    //вызов функции отображения таблицы с гидами, передавая индексы начала и конца текущей страницы
    renderGuidesTable(guides, (currentGuidesPage - 1) * guidesPerPage, currentGuidesPage * guidesPerPage);
    //вызов функции отображения пагинации для гидов, передавая общее количество страниц
    renderGuidesPagination(totalPages);
}

function renderGuidesPagination(totalPages) {
    var paginationList = document.getElementById("guides-pagination-list");
    paginationList.innerHTML = '';

    //создание элементов пагинации для каждой страницы
    for (let i = 1; i <= totalPages; i++) {
        var pageLink = document.createElement("li");
        pageLink.classList.add("page-item");

        var link = document.createElement("a");
        link.classList.add("page-link");
        link.href = "#";
        link.textContent = i;

        //обработчик клика на страницу пагинации
        link.addEventListener("click", (function (pageNumber) {
            return function (e) {
                e.preventDefault();
                currentGuidesPage = pageNumber; //установка текущей страницы в соответствии с номером страницы, по которой кликнули
                fetchDataAndRender(); //запрашиваем и отображаем данные для выбранной страницы
            };
        })(i));

        pageLink.appendChild(link);
        paginationList.appendChild(pageLink);
    }
}

//функция формирования фильтров гидов после получения данных о гидах
async function fetchDataAndRender() {
    try {
        var guidesData = await getGuides(selectedRoute);
        if (guidesData !== undefined) {
            renderGuides(guidesData);
        } else {
            console.log("Данные о гидах не определены");
        }
    } catch (error) {
        console.error("Ошибка при получении данных о гидах:", error.message);
    }
}

fetchDataAndRender(); // Вызываем эту функцию

//отображение подсказов на странице
function tooltipShow() {
    var tooltips = document.querySelectorAll(".tt");
    tooltips.forEach((tooltip) => new bootstrap.Tooltip(tooltip));
}

window.addEventListener('load', async () => {
    tooltipShow();
    await getRoute(api);
    renderPagination(data.length, data); // количество маршрутов и данные
});
