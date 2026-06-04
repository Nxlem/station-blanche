<?php
session_start();

//Script qui génère un fichier CSV à partir des données envoyées ou récupérées via l'API
// Récupérer les données via POST ou paramètres GET
$data = [];
$type = null;

//Endpoint local qui reçoit des données en POST pour les exporter en CSV
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['data'])) {
    // Import de données via POST (depuis JS côté client)
    $type = $_POST['type'] ?? null;
    $jsonData = $_POST['data'] ?? null;
    
    if ($jsonData) {
        $data = json_decode($jsonData, true);
        if (!is_array($data)) {
            $data = [];
        }
    }
} else {
    //Endpoint local qui récupère les données via l'API selon le type demandé
    // Mode hérité : récupération via API
    $type = $_GET['type'] ?? null;
    $field = $_GET['field'] ?? null;
    $value = $_GET['value'] ?? null;

    if (!$type) {
        http_response_code(400);
        die('Type de log requis');
    }

    // Récupérer les logs via l'API
    $api_base = 'http://192.168.2.113:5000';
    $endpoints = [
        'usb' => '/usb',
        'fichiers' => '/file',
        'scans' => '/scan',
        'user' => '/user',
        'acces' => '/acces'
    ];

    if (!isset($endpoints[$type])) {
        http_response_code(400);
        die('Type de log invalide');
    }

    $url = $api_base . $endpoints[$type];

    // Récupérer les données
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Content-Type: application/json\r\n'
        ]
    ]);
    $response = file_get_contents($url, false, $context);

    if ($response === false) {
        http_response_code(500);
        die('Erreur lors de la récupération des données');
    }

    $apiData = json_decode($response, true);

    if (!is_array($apiData)) {
        http_response_code(500);
        die('Données invalides reçues');
    }

    // Extraire les lignes selon le type
    $rows = [];
    if (isset($apiData[$type])) {
        $rows = $apiData[$type];
    } else if (isset($apiData['user'])) {
        $rows = $apiData['user'];
    } else if (isset($apiData[0])) {
        $rows = $apiData;
    }

    if (!is_array($rows)) {
        http_response_code(500);
        die('Format de données invalide');
    }

    // Appliquer le filtre si fourni
    if ($field && $value) {
        $filteredRows = [];
        $searchValue = strtolower(trim($value));
        foreach ($rows as $row) {
            if (is_array($row) && isset($row[$field])) {
                $cellValue = strtolower((string)$row[$field]);
                if (strpos($cellValue, $searchValue) !== false) {
                    $filteredRows[] = $row;
                }
            }
        }
        $rows = $filteredRows;
    }
    
    $data = $rows;
}

if (!$type) {
    http_response_code(400);
    die('Type requis');
}

if (empty($data)) {
    http_response_code(400);
    die('Aucune donnée à exporter');
}

// Récupérer les colonnes
$rows = is_array($data) ? $data : [];
if (empty($rows)) {
    http_response_code(400);
    die('Aucune données à exporter');
}

$firstRow = reset($rows);
if (!is_array($firstRow)) {
    http_response_code(400);
    die('Format de données invalide pour l\'export');
}

$columns = array_keys($firstRow);

// Générer le CSV
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="export_' . $type . '_' . date('Y-m-d_H-i-s') . '.csv"');

$output = fopen('php://output', 'w');

// Marque UTF-8 pour que le CSV s'ouvre correctement dans Excel
fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

// En-têtes
fputcsv($output, $columns);

// Lignes
foreach ($rows as $row) {
    $line = [];
    foreach ($columns as $col) {
        $line[] = isset($row[$col]) ? $row[$col] : '';
    }
    fputcsv($output, $line);
}

fclose($output);
?>
