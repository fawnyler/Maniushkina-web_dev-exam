/* eslint-disable no-use-before-define */
/* eslint-disable max-len */

var api = "9a72792b-0604-4317-9b40-4a5a92344ac9";
var routeList = document.getElementById("route-list");
var paginationList = document.getElementById("pagination-list");
var routesOnPage = 5;
var currentPage = 1;
var selectedRoute = [];
var max_len = 110;

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
        selectButton.addEventListener("click", () => {
            selectedRoute = route.id; //обновление выбранный маршрут
            renderRoute(routes); //перерисовка таблицы
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
    console.log("Entering searchRoutes"); 

    //получение выбранную достопримечательность
    var selectedAttraction = document.getElementById("attractionSelect").value;
    
    //получение введенного названия маршрута
    var routeName = document.getElementById("routeName").value.trim();

    if (selectedAttraction === "Не выбрано" && routeName === "") {
        //если не выбрано и название маршрута не введено, отобразить все маршруты
        console.log("Displaying all routes"); 
        renderRoute(routesData);
    } else {
        //применить фильтры по достопримечательности и названию маршрута
        console.log("Displaying filtered routes"); 
        var filteredRoutes = routesData.filter(route => 
            (selectedAttraction === "Не выбрано" || route.mainObject === selectedAttraction) &&
            (routeName === "" || route.name.toLowerCase().includes(routeName.toLowerCase()))
        );
        renderRoute(filteredRoutes);
    }
}

//обработчик события для кнопки "поиск маршрутов"
document.getElementById("searchButton").addEventListener("click", function() {
    searchRoutes(data); //передача данных в searchRoutes
});

function resetFilter() {
    //сброс выбранной достопримечательности
    document.getElementById("attractionSelect").selectedIndex = 0;

    //сброс выбранногг маршрута и текущей страницы
    selectedRoute = null;
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
    //получение выбранную достопримечательность
    var selectedAttraction = document.getElementById("attractionSelect").value;

    //фильтр по названию и достопримечательности
    var filteredRoutes = data.filter(route => 
        (selectedAttraction === "Не выбрано" || route.mainObject === selectedAttraction) &&
        (routeName === "" || route.name.toLowerCase().includes(routeName.toLowerCase()))
    );
    renderRoute(filteredRoutes);
}

function tooltipShow() {
    var tooltips = document.querySelectorAll(".tt");
    tooltips.forEach((tooltip) => new bootstrap.Tooltip(tooltip));
}

window.addEventListener('load', async () => {
    tooltipShow();
    await getRoute(api);
    renderPagination(data.length, data); // количество маршрутов и данные
});
