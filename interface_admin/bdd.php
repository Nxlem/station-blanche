<?php
    $bdd = null;
    $host = "localhost";
    $pwd = "252106";
    $base = "station_blanche";
    $user = "admin";

    //Fonction pour ouvrir la connexion à la base de données
    function openBDD() {
        global $bdd, $host, $pwd, $base, $user;
        try {
            $bdd = new PDO("mysql:host=$host;dbname=$base;charset=utf8",$user,$pwd,array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION));
        } catch (Exception $e) {
            $bdd = null;
        }
        return $bdd != null;
    }
?>
