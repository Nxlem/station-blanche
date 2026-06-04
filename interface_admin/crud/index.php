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
            <a href="../index.php" class="btn"><b>⬅ Menu Principal</b></a><br>
            <h1>Interface d'administration</h1>
            <p>Gestion des Utilisateurs</p>
        </header>

        <section class="controls">
            <button id="btnLoadUsers">Charger Utilisateurs</button>
            <button id="btnAddUser">Ajouter Utilisateur</button>
            <button id="btnExportUsers">Exporter Utilisateurs</button>
            <div style="margin-top: 15px;">
                <label for="csvImport" style="font-weight: 500;">Importer depuis CSV:</label>
                <input type="file" id="csvImport" accept=".csv" style="margin-top: 5px;">
                <button id="btnImportCSV" style="background-color: #3498db; margin-top: 5px;">Importer</button>
            </div>
        </section>

        <section class="form-section" id="userFormSection" style="display: none;">
            <h2 id="formTitle">Ajouter Utilisateur</h2>
            <form id="userForm">
                <input type="hidden" id="userId">
                <label for="role">Rôle:</label>
                <input type="text" id="role" required>
                <label for="mdp">Mot de passe:</label>
                <input type="password" id="mdp" required>
                <label for="pin">PIN:</label>
                <input type="text" id="pin">
                <label for="nom">Nom:</label>
                <input type="text" id="nom" required>
                <label for="prenom">Prénom:</label>
                <input type="text" id="prenom" required>
                <label for="email">Email:</label>
                <input type="email" id="email" required>
                <button type="submit">Sauvegarder</button>
                <button type="button" id="btnCancel">Annuler</button>
            </form>
        </section>

        <section class="results">
            <h2>Utilisateurs</h2>
            <table id="usersTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Rôle</th>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </section>
    </div>

    <script>
        const CURRENT_ADMIN_ID = <?= isset($_SESSION['id_user']) ? intval($_SESSION['id_user']) : 0 ?>;
    </script>
    <script src="script.js"></script>
</body>
</html>
