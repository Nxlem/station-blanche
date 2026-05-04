<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once 'bdd.php';

function log_action_admin($user_id, $action, $detail) {
    if (!$user_id || !$action) {
        return false;
    }

    if (!openBDD()) {
        return false;
    }

    global $bdd;

    try {
        $stmt = $bdd->prepare("INSERT INTO action_admin (id_user, action, date_action, detail) VALUES (?, ?, NOW(), ?)");
        $stmt->execute([$user_id, $action, $detail]);
        return true;
    } catch (Exception $e) {
        $log_file = __DIR__ . "/log/log.txt";
        $timestamp = date('Y-m-d H:i:s');
        $log_entry = "[$timestamp] Utilisateur: $user_id | Action: $action | Description: $detail | DB_ERROR: " . $e->getMessage() . "\n";
        @file_put_contents($log_file, $log_entry, FILE_APPEND);
        return false;
    }
}

if (realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'])) {
    header('Content-Type: application/json; charset=utf-8');

    $adminId = isset($_SESSION['id_user']) ? intval($_SESSION['id_user']) : 0;
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);

    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['error' => 'Données JSON requises']);
        exit;
    }

    $action = trim($payload['action'] ?? '');
    $detail = trim($payload['detail'] ?? '');

    if (!$action) {
        http_response_code(400);
        echo json_encode(['error' => 'Le champ action est requis']);
        exit;
    }

    if (!$adminId && isset($payload['admin_id'])) {
        $adminId = intval($payload['admin_id']);
    }

    if (!$adminId) {
        http_response_code(403);
        echo json_encode(['error' => 'Admin non authentifié']);
        exit;
    }

    try {
        if (log_action_admin($adminId, $action, $detail)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Impossible d\'enregistrer l\'action admin']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur base de données: ' . $e->getMessage()]);
    }
}
