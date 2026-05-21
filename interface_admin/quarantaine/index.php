<?php 
require_once("../auth.php");
require_once("../bdd.php");
require_once("../log_action_admin.php");

$user_id = $_SESSION['id_user'] ?? 0;
$quarantaine_path = "/home/station-blanche/quarantaine";

// Récupérer la liste des fichiers dans le dossier quarantaine
$quarantaine_files = [];
if (is_dir($quarantaine_path)) {
    $files = scandir($quarantaine_path);
    foreach ($files as $file) {
        if ($file !== "." && $file !== "..") {
            $file_path = $quarantaine_path . "/" . $file;
            $quarantaine_files[] = [
                'name' => $file,
                'path' => $file_path,
                'size' => filesize($file_path),
                'date' => filemtime($file_path),
                'is_file' => is_file($file_path),
                'is_dir' => is_dir($file_path)
            ];
        }
    }
}

// Traiter les actions (via AJAX)
$response = ['success' => false, 'message' => ''];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $target = $_POST['target'] ?? '';
    
    if ($action && $target) {
        $target_path = realpath($quarantaine_path . "/" . basename($target));
        
        // Vérifier que le chemin est bien dans la quarantaine
        if ($target_path && strpos($target_path, realpath($quarantaine_path)) === 0) {
            if ($action === 'restore') {
                // Retirer de la quarantaine (déplacer vers un dossier accessible)
                $restore_dir = "/home/station-blanche/sortie_quarantaine";
                $restore_path = $restore_dir . "/" . basename($target);

                // S'assurer que le dossier de destination existe (ne pas dépendre du retour de mkdir si il existe déjà)
                if (!is_dir($restore_dir)) {
                    if (!@mkdir($restore_dir, 0755, true)) {
                        $response['message'] = "Impossible de créer le dossier de destination";
                        error_log("[quarantine] Cannot create restore dir: $restore_dir");
                    }
                }

                // Tenter le déplacement
                if (empty($response['message'])) {
                    if (rename($target_path, $restore_path)) {
                        $response['success'] = true;
                        $response['message'] = "Fichier restauré avec succès";

                        // Log l'action
                        log_action_admin($user_id, "Restaurer quarantaine", "Fichier restauré: " . basename($target));
                    } else {
                        $response['message'] = "Erreur lors du déplacement du fichier (vérifier permissions et ownership)";
                        error_log("[quarantine] Failed to rename $target_path to $restore_path");
                    }
                }
            } elseif ($action === 'delete') {
                // Supprimer le fichier
                if (is_file($target_path)) {
                    if (@unlink($target_path)) {
                        $response['success'] = true;
                        $response['message'] = "Fichier supprimé";
                        
                        // Log l'action
                        log_action_admin($user_id, "Supprimer quarantaine", "Fichier supprimé: " . basename($target));
                    }
                } elseif (is_dir($target_path)) {
                    if (@rmdir($target_path)) {
                        $response['success'] = true;
                        $response['message'] = "Dossier supprimé";
                        
                        // Log l'action
                        log_action_admin($user_id, "Supprimer quarantaine", "Dossier supprimé: " . basename($target));
                    }
                }
            }
        }
    }
    
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion de la Quarantaine</title>
    <link rel="icon" type="image/png" href="../img/logo.png">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
            <a href="../index.php" class="btn btn-back">← Menu Principal</a></br>
            <h1>Gestion de la Quarantaine</h1>


        <section class="quarantine-section">
            <h2>Fichiers en quarantaine (<?php echo count($quarantaine_files); ?>)</h2>
            
            <?php if (empty($quarantaine_files)): ?>
                <div class="empty-state">
                    <p>Aucun fichier en quarantaine</p>
                </div>
            <?php else: ?>
                <div class="files-container">
                    <table class="files-table">
                        <thead>
                            <tr>
                                <th>Nom du fichier</th>
                                <th>Type</th>
                                <th>Taille</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($quarantaine_files as $file): ?>
                                <tr class="file-row" data-file="<?php echo htmlspecialchars($file['name']); ?>">
                                    <td class="file-name">
                                        <?php echo htmlspecialchars($file['name']); ?>
                                    </td>
                                    <td class="file-type">
                                        <?php echo $file['is_dir'] ? 'Dossier' : 'Fichier'; ?>
                                    </td>
                                    <td class="file-size">
                                        <?php echo format_size($file['size']); ?>
                                    </td>
                                    <td class="file-date">
                                        <?php echo date('d/m/Y H:i', $file['date']); ?>
                                    </td>
                                    <td class="file-actions">
                                        <button class="btn-action btn-restore" onclick="handleAction('restore', '<?php echo htmlspecialchars($file['name']); ?>')">
                                            Restaurer
                                        </button>
                                        <button class="btn-action btn-delete" onclick="handleAction('delete', '<?php echo htmlspecialchars($file['name']); ?>')">
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </section>
    </div>

    <div id="notification" class="notification"></div>

    <script src="script.js"></script>
</body>
</html>

<?php
function format_size($bytes) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= (1 << (10 * $pow));
    
    return round($bytes, 2) . ' ' . $units[$pow];
}
?>
