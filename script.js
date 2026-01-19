// Bookmark Manager
let bookmarkData = { folders: [], bookmarks: [] };
let currentFolder = null;
let allBookmarks = [];
let searchQuery = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App initializing...');
    initThemeToggle();
    initSearch();
    await loadBookmarks();
    console.log('Rendering folder tree...');
    renderFolderTree();
    console.log('Showing initial folder...');
    showFolder(null);
    console.log('App initialized!');
});

// Load and parse bookmarks.html
async function loadBookmarks() {
    try {
        console.log('Loading bookmarks.html...');
        const response = await fetch('bookmarks.html');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        console.log('Bookmarks file loaded, size:', html.length);

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        console.log('Document parsed');

        bookmarkData = parseBookmarkTree(doc);
        console.log('Bookmarks parsed:', {
            folders: bookmarkData.folders.length,
            bookmarks: allBookmarks.length
        });
    } catch (error) {
        console.error('Error loading bookmarks:', error);
        alert('Erreur lors du chargement des marque-pages: ' + error.message);
    }
}

// Parse the bookmark HTML structure - Simple approach
function parseBookmarkTree(doc) {
    const folders = [];
    const bookmarks = [];

    // Find all DT elements in the document
    const allDTs = doc.querySelectorAll('DT');
    console.log(`Found ${allDTs.length} DT elements total`);

    // Build a path map based on nesting level
    const pathStack = [];

    for (const dt of allDTs) {
        const h3 = dt.querySelector('H3');
        const a = dt.querySelector('A');

        // Calculate nesting level by counting parent DL elements
        let level = 0;
        let parent = dt.parentElement;
        while (parent) {
            if (parent.tagName === 'DL') level++;
            parent = parent.parentElement;
        }

        // Adjust path stack to current level
        pathStack.length = Math.max(0, level - 1);

        if (h3) {
            // It's a folder
            const folderName = h3.textContent.trim();
            pathStack.push(folderName);
            const folderPath = [...pathStack];

            folders.push({
                name: folderName,
                path: folderPath,
                pathString: folderPath.join(' > ')
            });

            console.log(`Folder [level ${level}]:`, folderPath.join(' > '));
        } else if (a) {
            // It's a bookmark
            const url = a.getAttribute('HREF');
            const title = a.textContent.trim();
            const icon = a.getAttribute('ICON');
            const iconUri = a.getAttribute('ICON_URI');

            if (url && title) {
                const bookmark = {
                    title,
                    url,
                    icon,
                    iconUri,
                    folder: pathStack.join(' > ') || 'Root',
                    folderPath: [...pathStack]
                };

                bookmarks.push(bookmark);
                allBookmarks.push(bookmark);
            }
        }
    }

    return { folders, bookmarks };
}

// Render folder tree in sidebar
function renderFolderTree() {
    const folderTree = document.getElementById('folder-tree');
    folderTree.innerHTML = '';

    // Add "All Bookmarks" option
    const allItem = createFolderItem('Tous les marque-pages', null, '📚');
    folderTree.appendChild(allItem);

    // Build folder hierarchy
    const rootFolders = bookmarkData.folders.filter(f => f.path.length === 1);
    rootFolders.forEach(folder => {
        folderTree.appendChild(createFolderTreeItem(folder));
    });
}

// Create folder tree item with children
function createFolderTreeItem(folder, level = 0) {
    const container = document.createElement('div');

    const item = createFolderItem(folder.name, folder.pathString, '📁', level);
    container.appendChild(item);

    // Find child folders
    const childFolders = bookmarkData.folders.filter(f =>
        f.path.length === folder.path.length + 1 &&
        f.pathString.startsWith(folder.pathString)
    );

    if (childFolders.length > 0) {
        item.classList.add('has-children');
        const childContainer = document.createElement('div');
        childContainer.className = 'folder-children';

        childFolders.forEach(child => {
            childContainer.appendChild(createFolderTreeItem(child, level + 1));
        });

        container.appendChild(childContainer);

        // Toggle children on click
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            item.classList.toggle('expanded');
            childContainer.classList.toggle('show');
            showFolder(folder.pathString);
        });
    } else {
        item.addEventListener('click', () => {
            showFolder(folder.pathString);
        });
    }

    return container;
}

// Create folder item element
function createFolderItem(name, pathString, icon, level = 0) {
    const item = document.createElement('div');
    item.className = 'folder-item';
    item.style.paddingLeft = `${level * 1.2 + 0.8}rem`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'icon';
    iconSpan.textContent = icon;

    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;

    item.appendChild(iconSpan);
    item.appendChild(nameSpan);

    if (pathString === null) {
        item.addEventListener('click', () => showFolder(null));
    }

    return item;
}

// Show bookmarks for a specific folder
function showFolder(folderPath) {
    currentFolder = folderPath;

    // Update active state in sidebar
    document.querySelectorAll('.folder-item').forEach(item => {
        item.classList.remove('active');
    });
    event?.target?.closest('.folder-item')?.classList.add('active');

    // Update breadcrumb
    updateBreadcrumb(folderPath);

    // Filter and display bookmarks
    displayBookmarks();
}

// Update breadcrumb navigation
function updateBreadcrumb(folderPath) {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = '';

    const home = document.createElement('span');
    home.className = 'breadcrumb-item';
    home.textContent = 'Accueil';
    home.addEventListener('click', () => showFolder(null));
    breadcrumb.appendChild(home);

    if (folderPath) {
        const parts = folderPath.split(' > ');
        parts.forEach((part, index) => {
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.textContent = '/';
            breadcrumb.appendChild(separator);

            const item = document.createElement('span');
            item.className = 'breadcrumb-item';
            item.textContent = part;
            const path = parts.slice(0, index + 1).join(' > ');
            item.addEventListener('click', () => showFolder(path));
            breadcrumb.appendChild(item);
        });
    }
}

// Display bookmarks based on current folder and search
function displayBookmarks() {
    const grid = document.getElementById('bookmarks-grid');
    const emptyState = document.getElementById('empty-state');
    grid.innerHTML = '';

    let filtered = allBookmarks;

    // Filter by folder
    if (currentFolder) {
        filtered = filtered.filter(b => b.folder === currentFolder);
    } else if (!searchQuery) {
        // On home page without search, show only bookmarks without folder
        filtered = filtered.filter(b => !b.folder || b.folder === 'Root');
    }

    // Filter by search query
    if (searchQuery) {
        filtered = filtered.filter(b =>
            b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.url.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    // Show subfolders if in a folder
    if (currentFolder) {
        const subfolders = bookmarkData.folders.filter(f => {
            const currentParts = currentFolder.split(' > ');
            return f.path.length === currentParts.length + 1 &&
                   f.pathString.startsWith(currentFolder);
        });

        subfolders.forEach(folder => {
            grid.appendChild(createFolderCard(folder));
        });
    } else if (!searchQuery) {
        // Show top-level folders on home
        const rootFolders = bookmarkData.folders.filter(f => f.path.length === 1);
        rootFolders.forEach(folder => {
            grid.appendChild(createFolderCard(folder));
        });
    }

    // Display bookmarks
    filtered.forEach(bookmark => {
        grid.appendChild(createBookmarkCard(bookmark));
    });

    // Show empty state if needed
    if (grid.children.length === 0) {
        emptyState.style.display = 'flex';
        grid.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        grid.style.display = 'grid';
    }
}

// Create folder card
function createFolderCard(folder) {
    const card = document.createElement('div');
    card.className = 'folder-card';

    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = '📁';

    const name = document.createElement('span');
    name.className = 'folder-name';
    name.textContent = folder.name;

    card.appendChild(icon);
    card.appendChild(name);

    card.addEventListener('click', () => {
        showFolder(folder.pathString);
    });

    return card;
}

// Get favicon URL for a bookmark
function getFaviconUrl(bookmark) {
    try {
        const url = new URL(bookmark.url);
        // Use Google's favicon service which retrieves the actual favicon from the site
        return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
    } catch {
        return null;
    }
}

// Create bookmark card
function createBookmarkCard(bookmark) {
    const card = document.createElement('div');
    card.className = 'bookmark-card';

    const icon = document.createElement('div');
    icon.className = 'bookmark-icon';

    // Try to load favicon using Google's service
    const faviconUrl = getFaviconUrl(bookmark);
    if (faviconUrl) {
        const img = document.createElement('img');
        img.src = faviconUrl;
        img.onerror = () => {
            icon.innerHTML = '🔖';
            icon.classList.add('default');
        };
        icon.appendChild(img);
    } else {
        icon.innerHTML = '🔖';
        icon.classList.add('default');
    }

    const info = document.createElement('div');
    info.className = 'bookmark-info';

    const title = document.createElement('div');
    title.className = 'bookmark-title';
    title.textContent = bookmark.title;

    const url = document.createElement('div');
    url.className = 'bookmark-url';
    try {
        const urlObj = new URL(bookmark.url);
        url.textContent = urlObj.hostname;
    } catch {
        url.textContent = bookmark.url;
    }

    info.appendChild(title);
    info.appendChild(url);

    card.appendChild(icon);
    card.appendChild(info);

    card.addEventListener('click', () => {
        window.open(bookmark.url, '_blank');
    });

    return card;
}

// Initialize theme toggle
function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');

    if (!toggle) {
        console.error('Theme toggle button not found!');
        return;
    }

    // Nettoyer l'ancienne classe dark-mode si présente
    document.body.classList.remove('dark-mode');

    // Restaurer le thème sauvegardé
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }

    toggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

// Initialize search
function initSearch() {
    const searchInput = document.getElementById('search');

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        displayBookmarks();
    });
}
