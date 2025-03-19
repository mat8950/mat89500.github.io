document.addEventListener("DOMContentLoaded", async function () {
    const categories = ["dev", "multimedia", "utilitaires"]; // Ajoute d'autres types ici
    const container = document.getElementById("app-list");

    for (let category of categories) {
        try {
            const response = await fetch(`data/${category}.json`);
            if (!response.ok) throw new Error(`Impossible de charger ${category}.json`);
            const data = await response.json();

            const section = document.createElement("div");
            section.className = "category";
            section.innerHTML = `<h2>${data.title}</h2><ul>` +
                data.apps.map(app => `<li><strong>${app.name}</strong> - ${app.description}</li>`).join("") +
                `</ul>`;
            
            container.appendChild(section);
        } catch (error) {
            console.error(error);
        }
    }
});
