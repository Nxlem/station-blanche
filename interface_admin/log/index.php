<?php require_once("../auth.php"); ?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interface Admin</title>
    <link rel="icon" type="image/png" href="../img/logo.png">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <a href="../index.php" class="btn"><b>⬅ Menu Principal</b></a></br>
            <h1>Interface d'administration</h1>
            <p>Lecture de logs et import en base de données</p>
        </header>

        <section class="controls">
            <div>
                <h2>Logs disponibles</h2>
                <button id="btnLoadUsb">Charger USB</button>
                <button id="btnLoadFile">Charger Fichier</button>
                <button id="btnLoadScan">Charger Scan</button>
                <button id="btnLoadUser">Charger Utilisateur</button>
                <button id="btnLoadActionAdmin">Charger Actions Admin</button>
                <button id="btnLoadAcces">Charger Acces</button>
                <h2 style="padding-top : 20px;">Export de log en CSV</h2>
                <button id="btnExportCSV" disabled style="background-color: #27ae60;">Exporter CSV</button>
                
            </div>
            <div>
                <h2>Filtres</h2>
                <div id="currentLogTypeLabel" class="status">Aucun log chargé.</div>
                <label for="fieldSelect">Champ</label>
                <select id="fieldSelect" disabled>
                    <option value="">Choisir un log d'abord</option>
                </select>
                <label for="fieldValue">Valeur recherchée</label>
                <input id="fieldValue" type="text" placeholder="Recherche par champ" disabled>
                <button id="btnSearchFilter" disabled>Rechercher</button>
                <button id="btnResetFilter" type="button" disabled>Réinitialiser</button>
            </div>
        </section>

        <section class="results">
            <h2>Résultats</h2>
            <div id="output" class="output-container">
                <div class="output-message">Aucune action pour le moment.</div>
                <div id="tableWrapper" class="table-wrapper hidden"></div>
                <div id="pagination" class="pagination hidden"></div>
            </div>
        </section>

        <footer>
            <small>API REST : /file, /scan, /usb, /acces, /user</small>
        </footer>
    </div>

    <script src="script.js?v=5"></script>
</body>
</html>
