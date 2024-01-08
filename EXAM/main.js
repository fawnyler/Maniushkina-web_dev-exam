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

var guidesPerPage = 3; // Максимальное количество записей на странице для гидов
var currentGuidesPage = 1; // Текущая страница

var logJSON = (jsonObject) => {
    var jsonString = JSON.stringify(jsonObject, null, 2);
    console.log(jsonString);
};

//объявление data в глобальной области видимости
var data;

async function getRoute(api) {
    var Url = new URL("http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/routes");
    Url.searchParams.append("api_key", api);

    try {
        var response = await fetch(Url);

        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }

        //глобальная переменная для сохранения данных
        data = await response.json();
        console.log("Полученные данные:", data);
        renderRoute(data);
        
        var attractions = [...new Set(data.map(route => route.mainObject))];

        //опции в select
        var attractionSelect = document.getElementById("attractionSelect");

        //добавление строки "Не выбрано"
        var notSelectedOption = document.createElement("option");
        notSelectedOption.value = "Не выбрано";
        notSelectedOption.text = "Не выбрано";
        attractionSelect.add(notSelectedOption);

        //остальные достопримечательности
        attractions.forEach(attraction => {
            var option = document.createElement("option");
            option.value = attraction;
            option.text = attraction;
            attractionSelect.add(option);
        });

        renderRoute(data);

    } catch (error) {
        console.error("Ошибка во время запроса:", error.message);
    }
}
async function renderRoute(routes) {
    var dataTableBody = document.getElementById("data-container");
    dataTableBody.innerHTML = ''; //очищение таблицы перед добавлением новых данных

    //создание таблицы 
    var table = document.createElement("table");
    table.classList.add("table", "table-striped"); 

    var tableHeader = document.createElement("thead");
    var headerRow = document.createElement("tr");
    var headerColumns = ["Название маршрута", "Описание", "Достопримечательности", ""];

    headerColumns.forEach(columnText => {
        var headerCell = document.createElement("th");
        headerCell.textContent = columnText;
        headerRow.appendChild(headerCell);
    });

    tableHeader.appendChild(headerRow);
    table.appendChild(tableHeader);

    var tableBody = document.createElement("tbody");

    var start = (currentPage - 1) * routesOnPage;
    var end = start + routesOnPage;
    var routesToShow = routes.slice(start, end);    

    routesToShow.forEach((route) => {
        var row = document.createElement("tr");
        if (selectedRoute === route.id) {
            row.classList.add("table-success");
        }

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
        // Обработчик клика на кнопке "Выбрать" маршрута
        selectButton.addEventListener("click", async () => {
            selectedRoute = route.id;
            renderRoute(routes); // Перерисовываем таблицу, чтобы выделить выбранный маршрут
            await getGuides(selectedRoute); // Загружаем данные о гидах после выбора маршрута
        });
        

        row.appendChild(nameCell);
        row.appendChild(descriptionCell);
        row.appendChild(mainObjectCell);
        selectCell.appendChild(selectButton);
        row.appendChild(selectCell);

        tableBody.appendChild(row);
    });

    table.appendChild(tableBody);
    dataTableBody.appendChild(table);

    renderPagination(routes.length, routes); 
}


function renderPagination(totalRoutes, routes) {
    var totalPages = Math.ceil(totalRoutes / routesOnPage);
    paginationList.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        var pageLink = document.createElement("li");
        pageLink.classList.add("page-item"); 

        var link = document.createElement("a");
        link.classList.add("page-link"); 
        link.href = "#";
        link.textContent = i;

        //функция-обертка для захвата текущего значения i
        link.addEventListener("click", (function (pageNumber) {
            return function (e) {
                e.preventDefault();
                currentPage = pageNumber;
                renderRoute(routes);
            };
        })(i));

        pageLink.appendChild(link);
        paginationList.appendChild(pageLink);
    }
}

//функция с передачей данных в качестве аргумента
function searchRoutes(routesData) {

    // Сохраняем выбранный маршрут перед применением фильтров
    var selectedRouteBeforeFilter = selectedRoute;

    // Получение выбранной достопримечательности
    var selectedAttraction = document.getElementById("attractionSelect").value;

    // Получение введенного названия маршрута
    var routeName = document.getElementById("routeName").value.trim();

    if (selectedAttraction === "Не выбрано" && routeName === "") {
        // Если не выбрано и название маршрута не введено, отобразить все маршруты
        renderRoute(routesData);
    } else {
        // Применить фильтры по достопримечательности и названию маршрута
        var filteredRoutes = routesData.filter(route =>
            (selectedAttraction === "Не выбрано" || route.mainObject === selectedAttraction) &&
            (routeName === "" || route.name.toLowerCase().includes(routeName.toLowerCase()))
        );

        // Если был выбран маршрут до применения фильтров, восстановите его
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

function resetFilter() {
    // Сохраните выбранный маршрут перед сбросом фильтров
    selectedRouteBeforeFilter = selectedRoute;

    // Сброс выбранной достопримечательности
    document.getElementById("attractionSelect").selectedIndex = 0;

    // Сброс выбранного маршрута и текущей страницы
    selectedRoute = selectedRouteBeforeFilter; // Восстанавливаем значение selectedRoute
    currentPage = 1;

    // Очистка поля ввода для названия маршрута
    document.getElementById("routeName").value = '';

    // Перерисовка таблицы с полным списком маршрутов
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
    //получение выбранную достопримечательность
    var selectedAttraction = document.getElementById("attractionSelect").value;

    //фильтр по названию и достопримечательности
    var filteredRoutes = data.filter(route => 
        (selectedAttraction === "Не выбрано" || route.mainObject === selectedAttraction) &&
        (routeName === "" || route.name.toLowerCase().includes(routeName.toLowerCase()))
    );
    renderRoute(filteredRoutes);
}



var guidesPerPage = 3; // Максимальное количество записей на странице для гидов
var currentGuidesPage = 1; // Текущая страница


async function getGuides(routeId) {
    // Проверяем, если routeId равно null, тогда просто возвращаем пустой массив
    if (routeId === null) {
        console.error("Route ID is null");
        renderGuides([]); // Рендерим пустой список гидов
        return;
    }

    var guidesUrl = new URL(`http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/routes/${routeId}/guides`);
    guidesUrl.searchParams.append("api_key", api);

    try {
        var response = await fetch(guidesUrl, {
            headers: {
                "Authorization": `Bearer ${api}`
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }

        var guidesData = await response.json();
        console.log("Полученные данные о гидах:", guidesData);
        renderGuides(guidesData);

    } catch (error) {
        console.error("Ошибка во время запроса:", error.message);
    }
}

function renderGuidesTable(guides, start, end) {
    var guidesTableBody = document.getElementById("guides-container");
    guidesTableBody.innerHTML = '';

    if (guides.length === 0) {
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

        // Проверяем, выбран ли данный гид, и добавляем класс "table-success" для выделения
        if (selectedGuide === guide.id) {
            row.classList.add("table-success");
        }

        var createCell = (textContent, isImage = false) => {
            var cell = document.createElement("td");

            if (isImage) {
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

        // Предполагается, что у каждого гида есть поле "avatar", содержащее URL аватара
        var avatarCell = createCell("../EXAM/images/guide.png", true);
        var languageCell = createCell(guide.language);
        var nameCell = createCell(guide.name);

        // Создаем ячейку для стоимости с подписью "руб/час"
        var pricePerHourCell = document.createElement("td");
        var priceSpan = document.createElement("span");
        priceSpan.textContent = guide.pricePerHour + " руб/час";
        pricePerHourCell.appendChild(priceSpan);

        // Создаем ячейку для опыта работы с подписью "лет"
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

        // Используем замыкание для сохранения правильного идентификатора гида
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
    var totalPages = Math.ceil(guides.length / guidesPerPage);
    renderGuidesTable(guides, (currentGuidesPage - 1) * guidesPerPage, currentGuidesPage * guidesPerPage);
    renderGuidesPagination(totalPages);
}

function renderGuidesPagination(totalPages) {
    var paginationList = document.getElementById("guides-pagination-list");
    paginationList.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        var pageLink = document.createElement("li");
        pageLink.classList.add("page-item");

        var link = document.createElement("a");
        link.classList.add("page-link");
        link.href = "#";
        link.textContent = i;

        link.addEventListener("click", (function (pageNumber) {
            return function (e) {
                e.preventDefault();
                currentGuidesPage = pageNumber;
                fetchDataAndRender();
            };
        })(i));

        pageLink.appendChild(link);
        paginationList.appendChild(pageLink);
    }
}

// Обработчик кнопки "Применить фильтры"
document.getElementById("applyGuidesFiltersButton").addEventListener("click", function () {
    applyGuidesFilters();
});

// Обработчик кнопки "Сбросить фильтр"
document.getElementById("resetGuidesFiltersButton").addEventListener("click", function () {
    resetGuidesFilters();
});

function applyGuidesFilters() {
    var languageFilter = document.getElementById("languageFilterForGuides").value;
    var minExperienceFilter = parseInt(document.getElementById("minExperienceFilterForGuides").value);
    var maxExperienceFilter = parseInt(document.getElementById("maxExperienceFilterForGuides").value);

    var filteredGuides = data.filter(function (guide) {
        // Проверяем фильтр по языку
        if (languageFilter !== "Не выбрано" && guide.language !== languageFilter) {
            return false;
        }

        // Проверяем фильтры по опыту работы
        if (!isNaN(minExperienceFilter) && guide.workExperience < minExperienceFilter) {
            return false;
        }
        if (!isNaN(maxExperienceFilter) && guide.workExperience > maxExperienceFilter) {
            return false;
        }

        return true;
    });

    renderGuides(filteredGuides);
}

function resetGuidesFilters() {
    document.getElementById("languageFilterForGuides").value = "Не выбрано";
    document.getElementById("minExperienceFilterForGuides").value = "";
    document.getElementById("maxExperienceFilterForGuides").value = "";

    renderGuides(data);
}


// Вызываем функцию формирования фильтров гидов после получения данных о гидах
async function fetchDataAndRender() {
    try {
        var guidesData = await getGuides(selectedRoute);
        renderGuides(guidesData);
    } catch (error) {
        console.error("Ошибка при получении данных о гидах:", error.message);
    }
}


fetchDataAndRender(); // Вызываем функцию

function tooltipShow() {
    var tooltips = document.querySelectorAll(".tt");
    tooltips.forEach((tooltip) => new bootstrap.Tooltip(tooltip));
}

window.addEventListener('load', async () => {
    tooltipShow();
    await getRoute(api);
    renderPagination(data.length, data); // количество маршрутов и данные
});

