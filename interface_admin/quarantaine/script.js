//Fonction pour restaurer ou supprimer un fichier en quarantaine
function handleAction(action, filename) {
    const confirmMessage = action === 'delete'
        ? `Êtes-vous sûr de vouloir SUPPRIMER "${filename}" ? Cette action est irréversible.`
        : `Êtes-vous sûr de vouloir RESTAURER "${filename}" ?`;

    if (!confirm(confirmMessage)) {
        return;
    }

    // Trouver le bouton initiateur de manière sûre (ne pas dépendre de `event` global)
    let btn = null;
    try {
        if (typeof event !== 'undefined' && event && event.target && event.target.tagName === 'BUTTON') {
            btn = event.target;
        }
    } catch (e) {
        btn = null;
    }
    if (!btn) {
        btn = document.querySelector(`[data-file="${filename}"] .btn-${action}`);
    }
    if (btn) btn.disabled = true;

    const formData = new FormData();
    formData.append('action', action);
    formData.append('target', filename);

    fetch(window.location.href, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');

            // Supprimer la ligne du tableau après 1 seconde
            setTimeout(() => {
                const row = document.querySelector(`[data-file="${filename}"]`);
                if (row) {
                    row.style.opacity = '0';
                    row.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => {
                        row.remove();

                        // Si le tableau est vide, recharger la page
                        const rows = document.querySelectorAll('.file-row');
                        if (rows.length === 0) {
                            setTimeout(() => location.reload(), 500);
                        }
                    }, 300);
                }
            }, 500);
        } else {
            showNotification(data.message, 'error');
            if (btn) btn.disabled = false;
        }
    })
    .catch(error => {
        showNotification('Erreur lors de l\'opération', 'error');
        if (btn) btn.disabled = false;
        console.error('Error:', error);
    });
}

//Fonction pour afficher une notification à l'utilisateur
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification notification-' + type + ' show';
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
