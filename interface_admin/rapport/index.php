<?php require_once("../auth.php"); ?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapports de scan</title>
    <link rel="icon" type="image/png" href="../img/logo.png">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <a href="../index.php" class="btn"><b>⬅ Menu Principal</b></a><br>
            <h1>Rapports de scan</h1>
            <p>Visualisation et téléchargement des rapports de scan</p>
        </header>

        <section class="controls">
            <input id="filterInput" type="text" placeholder="Filtrer par nom..." style="padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; width: 250px;" />
            <button id="refreshBtn">Rafraîchir</button>
        </section>

        <section class="reports-view">
            <aside class="list">
                <ul id="reportsList"></ul>
            </aside>

            <section class="viewer">
                <div id="reportMeta" class="meta">Sélectionnez un rapport pour le visualiser.</div>
                <div class="viewer-actions">
                    <button id="downloadBtn" style="display: none;">⬇ Télécharger</button>
                </div>
                <pre id="reportContent" class="content"></pre>
            </section>
        </section>
    </div>

    <script src="script.js"></script>
</body>
</html>
