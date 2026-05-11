const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
	const listEl = document.getElementById('reportsList');
	const contentEl = document.getElementById('reportContent');
	const metaEl = document.getElementById('reportMeta');
	const filterInput = document.getElementById('filterInput');
	const refreshBtn = document.getElementById('refreshBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    let reports = [];
    let currentReport = null;

    async function fetchReports() {
        listEl.innerHTML = '<li>Chargement...</li>';
        try {
            const res = await fetch(`${API_BASE}/reports`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur API');
            reports = data.reports || [];
            renderList();
        } catch (err) {
            listEl.innerHTML = `<li class="error">${err.message}</li>`;
        }
    }

    function renderList() {
        const filter = filterInput.value.trim().toLowerCase();
        listEl.innerHTML = '';
        if (reports.length === 0) {
            listEl.innerHTML = '<li>Aucun rapport trouvé.</li>';
            return;
        }

        reports.filter(r => r.name.toLowerCase().includes(filter)).forEach(r => {
            const li = document.createElement('li');
            li.className = 'report-item';
            li.innerHTML = `<div class="name">${r.name}</div><div class="meta">${formatSize(r.size)} • ${new Date(r.modified).toLocaleString()}</div>`;
            li.addEventListener('click', () => loadReport(r.name));
            listEl.appendChild(li);
        });
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
        return (bytes/(1024*1024)).toFixed(2) + ' MB';
    }

    async function loadReport(name) {
        contentEl.textContent = 'Chargement...';
        metaEl.textContent = `Chargement de ${name}...`;
        downloadBtn.style.display = 'none';
        currentReport = null;
        try {
            const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(name)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur API');
            metaEl.textContent = `Fichier: ${data.filename}`;
            contentEl.textContent = data.content;
            currentReport = { filename: data.filename, content: data.content };
            downloadBtn.style.display = 'inline-block';
        } catch (err) {
            metaEl.textContent = 'Erreur';
            contentEl.textContent = err.message;
        }
    }

    function downloadReport() {
        if (!currentReport) return;
        const blob = new Blob([currentReport.content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', currentReport.filename);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    filterInput.addEventListener('input', renderList);
    refreshBtn.addEventListener('click', fetchReports);
    downloadBtn.addEventListener('click', downloadReport);

    // initial load
    fetchReports();
});