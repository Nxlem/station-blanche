const API_BASE = '/api';
const PAGE_SIZE = 100;
const output = document.getElementById('output');
const outputMessage = document.querySelector('#output .output-message');
const tableWrapper = document.getElementById('tableWrapper');
const pagination = document.getElementById('pagination');
const currentLogTypeLabel = document.getElementById('currentLogTypeLabel');
const fieldSelect = document.getElementById('fieldSelect');
const fieldValue = document.getElementById('fieldValue');
const btnSearchFilter = document.getElementById('btnSearchFilter');
const btnResetFilter = document.getElementById('btnResetFilter');

const LOG_TYPES = {
    usb: { endpoint: '/usb', title: 'USB' },
    fichiers: { endpoint: '/file', title: 'Fichier' },
    scans: { endpoint: '/scan', title: 'Scan' },
    user: { endpoint: '/user', title: 'Utilisateur' },
    acces: { endpoint: '/acces', title: 'Accès' },
    action_admin: { endpoint: '/action_admin', title: 'Actions Admin' }
};

const schemaOrder = {
    usb: ['id_usb', 'nom', 'filesystem', 'taille', 'date_insertion'],
    fichiers: ['id_fichier', 'id_scan', 'nom', 'chemin', 'taille', 'statut'],
    scans: ['id_scan', 'id_usb', 'date_scan', 'nb_fichier', 'etat_scan', 'infecte', 'duree'],
    user: ['id_user', 'role', 'nom', 'prenom', 'email', 'date_creation'],
    acces: ['id_access', 'id_user', 'methode_auth', 'resultat', 'porte', 'date_acces'],
    action_admin: ['id_action', 'id_user', 'action', 'date_action', 'detail']
};

let currentLogType = null;
let currentLogData = null;
let currentViewRows = [];
let currentViewKey = '';
let currentViewTitle = '';
let currentPage = 1;
let currentFilter = {};

//Fonction pour afficher le statut du chargement des logs
function setStatus(message) {
    currentLogTypeLabel.textContent = message;
}

//Fonction pour afficher un message dans la zone de résultat
function setOutputMessage(message) {
    if (outputMessage) {
        outputMessage.textContent = message;
    }
}

//Fonction pour récupérer les champs disponibles selon le type de log
function getFieldsForType(type) {
    return schemaOrder[type] || [];
}

//Fonction pour remplir la liste des champs de recherche
function populateFieldSelect(type) {
    const fields = getFieldsForType(type);
    if (fields.length === 0) {
        fieldSelect.innerHTML = '<option value="">Aucun champ disponible</option>';
        return;
    }
    fieldSelect.innerHTML = '<option value="">-- Choisir un champ --</option>' + fields.map(field => `<option value="${field}">${field}</option>`).join('\n');
}

//Fonction pour activer ou désactiver les filtres de recherche
function setFilterControls(enabled) {
    fieldSelect.disabled = !enabled;
    fieldValue.disabled = !enabled;
    btnSearchFilter.disabled = !enabled;
    btnResetFilter.disabled = !enabled;
    const btnExportCSV = document.getElementById('btnExportCSV');
    if (btnExportCSV) {
        btnExportCSV.disabled = !enabled;
    }
}

//Fonction pour normaliser les données reçues depuis l'API
function normalizeData(data) {
    if (Array.isArray(data)) {
        return { key: currentLogType || 'result', rows: data };
    }
    if (data && typeof data === 'object') {
        const key = Object.keys(data)[0] || currentLogType || 'result';
        const rows = Array.isArray(data[key]) ? data[key] : [];
        return { key, rows };
    }
    return { key: currentLogType || 'result', rows: [] };
}

//Fonction pour sécuriser le texte avant l'affichage HTML
function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, char => {
        const replacements = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return replacements[char] || char;
    });
}

//Fonction pour afficher proprement une cellule du tableau
function renderCell(field, value) {
    // Navigation links removed - now displays plain text only
    return value === null || value === undefined ? '' : escapeHtml(String(value));
}

//Fonction pour afficher la pagination du tableau
function renderPagination(totalRows, page) {
    const pageCount = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
    if (pageCount <= 1) {
        pagination.classList.add('hidden');
        return;
    }

    let html = `<div class="pagination-info">Page ${page} sur ${pageCount}</div><div class="pagination-buttons">`;
    if (page > 1) {
        html += `<button class="page-btn" data-page="${page - 1}">← Précédent</button>`;
    }
    if (page < pageCount) {
        html += `<button class="page-btn" data-page="${page + 1}">Suivant →</button>`;
    }
    html += '</div>';

    pagination.innerHTML = html;
    pagination.classList.remove('hidden');
}

//Fonction pour afficher les logs dans un tableau HTML
function renderTable(title, data, page = 1) {
    const normalized = normalizeData(data);
    const key = normalized.key;
    const rows = normalized.rows;
    const columns = getFieldsForType(currentLogType) || (rows[0] ? Object.keys(rows[0]) : []);
    const totalRows = rows.length;
    const startIndex = (page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(startIndex, startIndex + PAGE_SIZE);

    currentViewRows = rows;
    currentViewKey = key;
    currentViewTitle = title;
    currentPage = page;

    setOutputMessage(`${title} — ${totalRows} enregistrement(s)`);
    if (output) {
        output.classList.remove('hidden');
    }
    tableWrapper.classList.remove('hidden');

    if (totalRows === 0) {
        tableWrapper.innerHTML = '<div class="empty-state">Aucun enregistrement trouvé.</div>';
        pagination.classList.add('hidden');
        return;
    }

    const headerHtml = columns.map(col => `<th>${escapeHtml(col)}</th>`).join('');
    const rowsHtml = pageRows.map(row => `<tr>${columns.map(col => `<td>${renderCell(col, row[col])}</td>`).join('')}</tr>`).join('');
    tableWrapper.innerHTML = `
        <div class="table-header">Affichage ${startIndex + 1} à ${Math.min(totalRows, startIndex + PAGE_SIZE)} sur ${totalRows}</div>
        <div class="table-scroll">
            <table class="output-table">
                <thead><tr>${headerHtml}</tr></thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
    `;

    renderPagination(totalRows, page);
}

//Fonction pour ajouter un message dans la console de la page
function logMessage(message) {
    setStatus(message);
    setOutputMessage(message);
    if (output) {
        output.classList.remove('hidden');
    }
    if (tableWrapper) {
        tableWrapper.innerHTML = '';
        tableWrapper.classList.add('hidden');
    }
    if (pagination) {
        pagination.classList.add('hidden');
    }
}

//Fonction pour filtrer les lignes selon un champ et une valeur
function filterRowsByField(data, field, value) {
    const normalized = normalizeData(data);
    const key = normalized.key;
    const rows = normalized.rows;
    if (!field || !value) {
        return { [key]: rows };
    }

    const searchValue = String(value).trim().toLowerCase();
    const isIdField = /^id(_|$)|_id$/i.test(field);
    const filtered = rows.filter(row => {
        const cell = row[field];
        if (cell === null || cell === undefined) {
            return false;
        }
        const cellValue = String(cell).trim().toLowerCase();
        return isIdField ? cellValue === searchValue : cellValue.includes(searchValue);
    });

    return { [key]: filtered };
}

//Fonction pour stocker les logs chargés et les afficher
function logData(title, data) {
    if (typeof data === 'object') {
        renderTable(title, data, 1);
    } else {
        setOutputMessage(String(data));
        if (tableWrapper) {
            tableWrapper.innerHTML = '';
        }
        if (pagination) {
            pagination.classList.add('hidden');
        }
    }
}

//Fonction pour récupérer des logs depuis un endpoint de l'API
async function fetchLogs(endpoint, title) {
    try {
        logMessage(`Récupération de ${title}...`);
        const response = await fetch(endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`);
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(`Réponse non JSON (${response.status})`);
        }
        if (!response.ok) {
            throw new Error(data.error || response.statusText || `HTTP ${response.status}`);
        }
        return data;
    } catch (error) {
        logMessage(`Erreur chargement : ${error.message}`);
        return null;
    }
}

//Fonction pour charger les logs selon le type sélectionné
async function loadLogs(type, filter) {
    const config = LOG_TYPES[type];
    if (!config) {
        logMessage(`Type de log inconnu : ${type}`);
        return;
    }

    setStatus('Chargement en cours...');
    setFilterControls(false);
    const data = await fetchLogs(config.endpoint, config.title);
    if (!data) {
        setStatus('Erreur de chargement : aucun log chargé.');
        return;
    }

    currentLogType = type;
    currentLogData = data;
    setStatus(`Chargé : ${config.title}`);
    populateFieldSelect(type);
    setFilterControls(true);

    if (filter && filter.field && filter.value) {
        currentFilter = { field: filter.field, value: filter.value };
        const filtered = filterRowsByField(data, filter.field, filter.value);
        setStatus(`Chargé : ${config.title} (filtré)`);
        logData(`${config.title} (filtré)`, filtered);
    } else {
        currentFilter = {};
        logData(config.title, data);
    }
}

//Fonction pour réinitialiser la recherche et les filtres
function resetSearch() {
    fieldValue.value = '';
    if (!currentLogData) {
        logMessage('Aucun log chargé.');
        return;
    }
    currentFilter = {};
    logData(LOG_TYPES[currentLogType].title, currentLogData);
}

//Fonction pour appliquer la recherche sur les logs affichés
function applySearch() {
    if (!currentLogData) {
        logMessage('Chargez d’abord un type de log avant de filtrer.');
        return;
    }
    const field = fieldSelect.value;
    const value = fieldValue.value.trim();
    if (!field) {
        logMessage('Veuillez choisir un champ pour filtrer.');
        return;
    }
    if (!value) {
        logMessage('Veuillez saisir une valeur de filtre.');
        return;
    }
    currentFilter = { field, value };
    const filtered = filterRowsByField(currentLogData, field, value);
    logData(`${LOG_TYPES[currentLogType].title} (filtré)`, filtered);
}

//Fonction pour gérer les clics sur les boutons de pagination
function handlePaginationClick(event) {
    const button = event.target.closest('.page-btn');
    if (!button) {
        return;
    }
    const page = Number(button.dataset.page);
    if (!Number.isInteger(page) || page < 1) {
        return;
    }
    renderTable(currentViewTitle, { [currentViewKey]: currentViewRows }, page);
}

//Fonction pour exporter les logs actuellement affichés en CSV
function exportToCSV() {
    if (!currentViewRows || currentViewRows.length === 0) {
        alert('Aucune donnée à exporter.');
        return;
    }

    const formData = new FormData();
    formData.append('type', currentLogType);
    formData.append('data', JSON.stringify(currentViewRows));

    fetch('../export_csv.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error('Erreur export');
        return response.blob();
    })
    .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${currentLogType || 'export'}_${new Date().toISOString().slice(0,19).replace(/[:T]/g, '_')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    })
    .catch(error => {
        alert('Erreur lors de l\'export: ' + error.message);
    });
}


const btnLoadUsb = document.getElementById('btnLoadUsb');
if (btnLoadUsb) btnLoadUsb.addEventListener('click', () => loadLogs('usb'));
const btnLoadFile = document.getElementById('btnLoadFile');
if (btnLoadFile) btnLoadFile.addEventListener('click', () => loadLogs('fichiers'));
const btnLoadScan = document.getElementById('btnLoadScan');
if (btnLoadScan) btnLoadScan.addEventListener('click', () => loadLogs('scans'));
const btnLoadUser = document.getElementById('btnLoadUser');
if (btnLoadUser) btnLoadUser.addEventListener('click', () => loadLogs('user'));
const btnLoadAcces = document.getElementById('btnLoadAcces');
if (btnLoadAcces) btnLoadAcces.addEventListener('click', () => loadLogs('acces'));
const btnLoadActionAdmin = document.getElementById('btnLoadActionAdmin');
if (btnLoadActionAdmin) btnLoadActionAdmin.addEventListener('click', () => loadLogs('action_admin'));
if (btnSearchFilter) btnSearchFilter.addEventListener('click', applySearch);
if (btnResetFilter) btnResetFilter.addEventListener('click', resetSearch);
if (pagination) pagination.addEventListener('click', handlePaginationClick);

// Ajouter le bouton d'export
const btnExportCSV = document.getElementById('btnExportCSV');
if (btnExportCSV) {
    btnExportCSV.addEventListener('click', exportToCSV);
    btnExportCSV.disabled = true;
}

setStatus('Aucun log chargé.');
fieldSelect.innerHTML = '<option value="">Choisir un log d\'abord</option>';
setFilterControls(false);
