document.addEventListener("DOMContentLoaded", async function () {
    const categories = ["dev", "multimedia", "utilitaires"];
    const container = document.getElementById("app-list");
    const categoryList = document.getElementById("category-list");
    const searchInput = document.getElementById("search");
    const themeToggle = document.getElementById("theme-toggle");
    const allAppsContainer = document.createElement("div");
    allAppsContainer.id = "all-apps";
    allAppsContainer.innerHTML = "<h2>Toutes les applications</h2><ul id='all-apps-list'></ul>";
    container.appendChild(allAppsContainer);
    
    let allApps = [];
    let sections = {}; // Stocke les sections pour basculer facilement

    // Mode sombre/clair
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
    });

    for (let category of categories) {
        try {
            const response = await fetch(`data/${category}.json`);
            if (!response.ok) throw new Error(`Impossible de charger ${category}.json`);
            const data = await response.json();

            // Création d'une entrée dans le menu de navigation
            const categoryItem = document.createElement("li");
            categoryItem.textContent = data.title;
            categoryItem.addEventListener("click", () => {
                document.querySelectorAll(".category").forEach(el => el.style.display = "none");
                sections[category].style.display = "block";
            });
            categoryList.appendChild(categoryItem);

            // Création de la section de la catégorie
            const section = document.createElement("div");
            section.className = "category animate__animated animate__fadeIn";
            section.id = `category-${category}`;
            section.innerHTML = `<h2>${data.title}</h2><ul>` +
                data.apps.map(app => `<li class="app-item" data-name="${app.name.toLowerCase()}"><strong>${app.name}</strong> - ${app.description}</li>`).join("") +
                `</ul>`;
            section.style.display = "none";
            container.appendChild(section);
            sections[category] = section;

            // Ajout des applications dans la liste globale
            allApps = allApps.concat(data.apps);
        } catch (error) {
            console.error(error);
        }
    }

    // Afficher la première catégorie par défaut
    if (Object.keys(sections).length > 0) {
        sections[categories[0]].style.display = "block";
    }

    // Ajout de toutes les applications triées alphabétiquement
    allApps.sort((a, b) => a.name.localeCompare(b.name));
    const allAppsList = document.getElementById("all-apps-list");
    allAppsList.innerHTML = allApps.map(app => `<li class="app-item" data-name="${app.name.toLowerCase()}"><strong>${app.name}</strong> - ${app.description}</li>`).join("");

    // Filtrage des applications
    searchInput.addEventListener("input", function () {
        const searchValue = searchInput.value.toLowerCase();
        document.querySelectorAll(".app-item").forEach(item => {
            item.style.display = item.dataset.name.includes(searchValue) ? "block" : "none";
        });
    });
});
