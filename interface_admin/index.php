<?php require_once("auth.php"); ?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interface Admin</title>
    <link rel="icon" type="image/png" href="img/logo.png">
    <link rel="stylesheet" href="styles.css">
</head>

<body>
    <div class="container">
        <header>
            <h1>Interface d'administration</h1>
        </header>

        <section class="controls">
            <div>
                <h2>Actions disponibles</h2>
                <?php
                    $role = isset($_SESSION['role']) ? strtolower($_SESSION['role']) : '';

                    // Super-admin: tous
                    if ($role === 'super-admin') {
                        echo '<a href="log/index.php" class="btn"><b>Visualiser les logs</b></a>';
                        echo '<a href="crud/index.php" class="btn"><b>C.R.U.D</b></a>';
                        echo '<a href="quarantaine/index.php" class="btn"><b>Gestion Quarantaine</b></a>';
                        echo '<a href="rapport/index.php" class="btn"><b>Export de rapport</b></a>';
                    }
                    // Admin: log + crud + rapport
                    else if ($role === 'admin') {
                        echo '<a href="log/index.php" class="btn"><b>Visualiser les logs</b></a>';
                        echo '<a href="crud/index.php" class="btn"><b>C.R.U.D</b></a>';
                        echo '<a href="rapport/index.php" class="btn"><b>Export de rapport</b></a>';
                    }
                    // Auditeur: log + rapport
                    else if ($role === 'auditeur') {
                        echo '<a href="log/index.php" class="btn"><b>Visualiser les logs</b></a>';
                        echo '<a href="rapport/index.php" class="btn"><b>Export de rapport</b></a>';
                    }
                    // Employe or others: aucun accès aux modules
                    else {
                        echo '<p>Aucun module disponible pour votre rôle.</p>';
                    }

                    echo '<a href="logout.php" class="btn" style="margin-left: 10px; background-color:#eb5757;"><b>Déconnexion</b></a>';
                ?>
            </div>
        
        </section>
    </div>
</body>
</html>
