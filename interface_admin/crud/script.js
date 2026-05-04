const API_BASE = '/api';
const usersTable = document.getElementById('usersTable').querySelector('tbody');
const userForm = document.getElementById('userForm');
const userFormSection = document.getElementById('userFormSection');
const formTitle = document.getElementById('formTitle');
const currentAdminId = typeof CURRENT_ADMIN_ID !== 'undefined' ? CURRENT_ADMIN_ID : 0;
let currentUsers = [];

async function logAdminAction(action, detail) {
    try {
        const response = await fetch(`${window.location.origin}/interface_admin/log_action_admin.php`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, detail, admin_id: currentAdminId })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Erreur log admin', response.status, text);
        } else {
            console.log('Action admin loggée:', action, detail);
        }
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'action admin:', error);
    }
}

//Fonction pour charger les utilisateurs depuis API et les afficher dans le tableau
async function loadUsers() {
    try {
        //Récupération des utilisateurs depuis l'API
        const response = await fetch(`${API_BASE}/user`);
        if (!response.ok) throw new Error('Erreur chargement');
        //Transformation de la réponse en JSON
        const data = await response.json();
        displayUsers(data.user);
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}
//Fonction pour afficher les utilisateurs dans le tableau HTML
function displayUsers(users) {
    currentUsers = Array.isArray(users) ? users : [];
    usersTable.innerHTML = '';
    //Création d'une ligne pour chaque utilisateur et ajout au tableau
    currentUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id_user}</td>
            <td>${user.role}</td>
            <td>${user.nom}</td>
            <td>${user.prenom}</td>
            <td>${user.email}</td>
            <td>
                <button onclick="editUser(${user.id_user})">Modifier</button>
                <button onclick="deleteUser(${user.id_user})">Supprimer</button>
            </td>
        `;
        usersTable.appendChild(row);
    });
}

function exportUsersCSV() {
    console.log('exportUsersCSV appelé');
    console.log('currentUsers:', currentUsers);
    
    if (!currentUsers || currentUsers.length === 0) {
        alert('Aucune donnée à exporter. Chargez d\'abord les utilisateurs.');
        return;
    }

    const formData = new FormData();
    formData.append('type', 'user');
    formData.append('data', JSON.stringify(currentUsers));

    console.log('Envoi de', currentUsers.length, 'utilisateurs');

    fetch('../export_csv.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('Réponse reçue:', response.status);
        if (!response.ok) throw new Error(`Erreur export: ${response.status}`);
        return response.blob();
    })
    .then(async blob => {
        console.log('Blob reçu:', blob.size, 'bytes');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `utilisateurs_${new Date().toISOString().slice(0,19).replace(/[:T]/g, '_')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Export terminé');
        await logAdminAction('Export utilisateurs', `Lignes exportées: ${currentUsers.length}`);
    })
    .catch(error => {
        console.error('Erreur export:', error);
        alert('Erreur lors de l\'export: ' + error.message);
    });
}

function parseCSVLine(line) {
    const values = [];
    let value = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                value += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(value);
            value = '';
        } else {
            value += char;
        }
    }

    values.push(value);
    return values;
}

function parseCSV(text) {
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        throw new Error('Le fichier CSV doit contenir au moins un en-tête et une ligne de données');
    }

    const headers = parseCSVLine(lines[0]).map(header => header.trim().replace(/^\uFEFF/, '').toLowerCase());
    const users = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0 || values.every(value => !value.trim())) {
            continue;
        }

        const rawUser = {};
        headers.forEach((header, index) => {
            if (header) {
                rawUser[header] = values[index] ? values[index].trim() : '';
            }
        });

        const normalizedUser = {};
        Object.keys(rawUser).forEach(key => {
            normalizedUser[key.toLowerCase()] = rawUser[key];
        });

        users.push(normalizedUser);
    }

    return users;
}

function buildImportUser(user) {
    return {
        role: user.role || '',
        mdp: user.mdp || user.pin || 'password123',
        pin: user.pin || '',
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || ''
    };
}

async function importUsersCSV() {
    console.log('importUsersCSV appelé');
    const fileInput = document.getElementById('csvImport');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Veuillez sélectionner un fichier CSV.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const csvText = e.target.result;
            const users = parseCSV(csvText);
            
            console.log('Utilisateurs parsés:', users.length);
            
            if (users.length === 0) {
                alert('Aucun utilisateur trouvé dans le fichier.');
                return;
            }

            const response = await fetch(`${API_BASE}/user/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Erreur import: ${response.status} - ${errorBody}`);
            }

            const result = await response.json();
            alert(`Import terminé: ${result.imported || 0} nouvel(le)(s), ${result.updated || 0} mis à jour, ${result.skipped || 0} ignoré(s)`);
            await logAdminAction('Import utilisateurs', `Importés: ${result.imported || 0}, mis à jour: ${result.updated || 0}, ignorés: ${result.skipped || 0}`);
            fileInput.value = '';
            loadUsers();
        } catch (error) {
            console.error('Erreur import CSV:', error);
            alert('Erreur lors de l\'import: ' + error.message);
        }
    };

    reader.readAsText(file);
}

function showForm(user = null) {
    userFormSection.style.display = 'block';
    if (user) {
        formTitle.textContent = 'Modifier Utilisateur';
        document.getElementById('userId').value = user.id_user;
        document.getElementById('role').value = user.role;
        document.getElementById('mdp').value = ''; // Ne pas pré-remplir le mdp
        document.getElementById('pin').value = user.pin;
        document.getElementById('nom').value = user.nom;
        document.getElementById('prenom').value = user.prenom;
        document.getElementById('email').value = user.email;
    } else {
        formTitle.textContent = 'Ajouter Utilisateur';
        userForm.reset();
        document.getElementById('userId').value = '';
    }
}

function hideForm() {
    userFormSection.style.display = 'none';
}

async function saveUser(event) {
    event.preventDefault();
    const userId = document.getElementById('userId').value;
    const userData = {
        role: document.getElementById('role').value,
        pin: document.getElementById('pin').value,
        nom: document.getElementById('nom').value,
        prenom: document.getElementById('prenom').value,
        email: document.getElementById('email').value
    };

    // Ajouter le mot de passe seulement s'il n'est pas vide
    const mdp = document.getElementById('mdp').value;
    if (mdp.trim()) {
        userData.mdp = mdp;
    }

    try {
        const method = userId ? 'PUT' : 'POST';
        const url = userId ? `${API_BASE}/user/${userId}` : `${API_BASE}/user`;
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error('Erreur sauvegarde');
        const result = await response.json();
        const mdpMessage = mdp.trim() ? ' (mot de passe mis à jour)' : ' (mot de passe inchangé)';
        alert(result.message + mdpMessage);
        await logAdminAction(userId ? 'Modification utilisateur' : 'Création utilisateur',
            `${userId ? `id=${userId}` : `id=${result.id}`} email=${userData.email}`);
        hideForm();
        loadUsers();
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

async function editUser(id) {
    try {
        const response = await fetch(`${API_BASE}/user`);
        const data = await response.json();
        const user = data.user.find(u => u.id_user == id);
        if (user) showForm(user);
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

async function deleteUser(id) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
        const response = await fetch(`${API_BASE}/user/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erreur suppression');
        const result = await response.json();
        alert(result.message);
        await logAdminAction('Suppression utilisateur', `id=${id}`);
        loadUsers();
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

document.getElementById('btnLoadUsers').addEventListener('click', loadUsers);
document.getElementById('btnAddUser').addEventListener('click', () => showForm());
const btnExportUsers = document.getElementById('btnExportUsers');
if (btnExportUsers) {
    console.log('Bouton export trouvé, attachement de l\'écouteur');
    btnExportUsers.addEventListener('click', exportUsersCSV);
} else {
    console.error('Bouton btnExportUsers NOT FOUND');
}
const btnImportCSV = document.getElementById('btnImportCSV');
if (btnImportCSV) {
    console.log('Bouton import trouvé, attachement de l\'écouteur');
    btnImportCSV.addEventListener('click', importUsersCSV);
} else {
    console.error('Bouton btnImportCSV NOT FOUND');
}
document.getElementById('btnCancel').addEventListener('click', hideForm);
userForm.addEventListener('submit', saveUser);

console.log('Script CRUD chargé');
(async () => { await loadUsers(); })();
