document.addEventListener("DOMContentLoaded", async function () {
    const categories = ["dev", "multimedia", "utilitaires"];
    const container = document.getElementById("app-list");
    const categoryList = document.getElementById("category-list");
    const searchInput = document.getElementById("search");
    const themeToggle = document.getElementById("theme-toggle");

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
                document.getElementById(`category-${category}`).style.display = "block";
            });
            categoryList.appendChild(categoryItem);

            // Création de la section de la catégorie
            const section = document.createElement("div");
            section.className = "category animate__animated animate__fadeIn";
            section.id = `category-${category}`;
            section.innerHTML = `<h2>${data.title}</h2><ul>` +
                data.apps.map(app => `<li class="app-item"><strong>${app.name}</strong> - ${app.description}</li>`).join("") +
                `</ul>`;
            section.style.display = "none";
            container.appendChild(section);
        } catch (error) {
            console.error(error);
        }
    }

    // Afficher la première catégorie par défaut
    document.querySelector(".category").style.display = "block";

    // Filtrage des applications
    searchInput.addEventListener("input", function () {
        const searchValue = searchInput.value.toLowerCase();
        document.querySelectorAll(".app-item").forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(searchValue) ? "block" : "none";
        });
    });
});