<?php
session_start();

// Redirection si pas connecté
if (!isset($_SESSION['login'])) {
    header('Location: /interface_admin/connexion.php');
    exit();
}

// Si id_user n'est pas défini mais login oui, récupérer id_user depuis l'API
if (isset($_SESSION['login']) && !isset($_SESSION['id_user'])) {
    $api_url = "http://192.168.2.113:5000/user";
    $context = stream_context_create([
        "http" => [
            "method" => "GET",
            "header" => "Content-Type: application/json\r\n"
        ]
    ]);
    $response = file_get_contents($api_url, false, $context);
    if ($response !== false) {
        $data = json_decode($response, true);
        if (isset($data['user'])) {
            foreach ($data['user'] as $user) {
                if ($user['email'] == $_SESSION['login']) {
                    $_SESSION['id_user'] = $user['id_user'];
                    $_SESSION['user_email'] = $user['email'];
                    if (!isset($_SESSION['role'])) {
                        $_SESSION['role'] = isset($user['role']) ? strtolower($user['role']) : '';
                    }
                    break;
                }
            }
        }
    }
}

// Timeout de session après 30 minutes d'inactivité
$timeout = 30 * 60;
if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity']) > $timeout) {
    session_unset();
    session_destroy();
    header('Location: /interface_admin/connexion.php');
    exit();
}

$_SESSION['last_activity'] = time();

// Contrôle d'accès par module — bloque automatiquement l'accès selon le rôle
// - super-admin : tous
// - admin : log, crud, rapport
// - auditeur : log, rapport
// - employe : aucun

$module_roles = [
    'quarantaine' => ['super-admin'],
    'crud' => ['super-admin', 'admin'],
    'log' => ['super-admin', 'admin', 'auditeur'],
    'rapport' => ['super-admin', 'admin', 'auditeur'],
];

$script = $_SERVER['SCRIPT_NAME'] ?? '';
if (preg_match('#/interface_admin/([^/]+)/#', $script, $m)) {
    $module = strtolower($m[1]);
    if (isset($module_roles[$module])) {
        $role = isset($_SESSION['role']) ? strtolower($_SESSION['role']) : '';
        // Super-admin toujours autorisé, sinon on vérifie le rôle
        if (!in_array($role, $module_roles[$module], true)) {
            header('Location: /interface_admin/forbidden.php');
            exit();
        }
    }
}
?>
