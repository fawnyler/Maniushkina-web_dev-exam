/* eslint-disable no-use-before-define */
/* eslint-disable max-len */


var api = "9a72792b-0604-4317-9b40-4a5a92344ac9";
var routeList = document.getElementById("route-list");
var paginationList = document.getElementById("pagination-list");
var routesOnPage = 3;
var currentPage = 1;
var selectedRoute = null;
var max_len = 110;

function logJSON(jsonObject) {
    var jsonString = JSON.stringify(jsonObject, null, 2);
    console.log(jsonString);
}

async function getRoute(api) {
    var Url = new URL(
        `http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/routes`,
    );
    Url.searchParams.append("api_key", api);

    try {
        var response = await fetch(Url);
        if (!response.ok) {
            throw new Error(`Ошибка при запросе данных: ${response.status}`);
        }

        var data = await response.json();
        console.log("Received data:", data); // Добавим логирование полученных данных
        renderRoute(data);
    } catch (error) {
        console.error("Ошибка при выполнении запроса:", error.message);
    }
}

async function renderRoute(routes) {
    var dataTableBody = document.getElementById("data-container");
    dataTableBody.innerHTML = ''; // Очищаем тело таблицы перед добавлением новых данных

    // Создание таблицы с классами Bootstrap
    var table = document.createElement("table");
    table.classList.add("table", "table-striped"); // Bootstrap классы

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
        selectButton.classList.add("btn", "btn-custom-green"); // Bootstrap классы для кнопки
        selectButton.textContent = "Выбрать";
        selectButton.addEventListener("click", () => {
            selectedRoute = route.id; // Обновляем выбранный маршрут
            renderRoute(routes); // Перерисовываем таблицу
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

    renderPagination(routes.length, routes); // Добавьте вызов renderPagination
}

function renderPagination(totalRoutes, routes) {
    paginationList.innerHTML = ''; // Очищаем контейнер пагинации перед добавлением новых данных

    var totalPages = Math.ceil(totalRoutes / routesOnPage);

    for (let i = 1; i <= totalPages; i++) {
        var paginationItem = document.createElement("li");
        paginationItem.classList.add("page-item");
        
        var paginationLink = document.createElement("a");
        paginationLink.classList.add("page-link");
        paginationLink.textContent = i;
        paginationLink.addEventListener("click", async () => {
            currentPage = i; // Обновляем текущую страницу
            await getRoute(api); // Перезагружаем данные для новой страницы
        });

        if (currentPage === i) {
            paginationItem.classList.add("active");
        }

        paginationItem.appendChild(paginationLink);
        paginationList.appendChild(paginationItem);
    }
}


function tooltipInit() {
    var tooltips = document.querySelectorAll(".tt");
    tooltips.forEach(t => new bootstrap.Tooltip(t));
}

window.addEventListener('load', async () => {
    tooltipInit();
    await getRoute(api);
    renderPagination(routeList.childElementCount, currentPage);
});
