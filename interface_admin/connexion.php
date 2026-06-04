<?php 
    session_start();
    
    //Traitement du formulaire de connexion
    if(isset($_POST["email"]) && isset($_POST["mdp"]) && !empty($_POST["email"]) && !empty($_POST["mdp"])){
        $email = $_POST["email"];
        $mdp = $_POST["mdp"];
        
        // Utiliser l'API au lieu de se connecter directement à MySQL
        $api_url = "http://192.168.2.113:5000/user";
        
        $context = stream_context_create([
            "http" => [
                "method" => "GET",
                "header" => "Content-Type: application/json\r\n"
            ]
        ]);
        
        $response = file_get_contents($api_url, false, $context);
        
        if($response !== false){
            $data = json_decode($response, true);
            
            if(isset($data['user'])){
                $utilisateurs = $data['user'];
                $_SESSION["debug"] = "Utilisateurs trouvés via API: " . count($utilisateurs);
                
                // Debug: afficher les emails
                $emails = array_column($utilisateurs, 'email');
                $_SESSION["debug"] .= " | Emails: " . implode(', ', $emails);
                
                $utilisateur_trouve = false;
                $mdp_correct = false;
                
                foreach ($utilisateurs as $user){
                    if($email == $user['email']){
                        $utilisateur_trouve = true;
                        $_SESSION["debug"] .= " | Utilisateur trouvé: " . $user['email'];
                        $_SESSION["debug"] .= " | Role: " . ($user['role'] ?? 'non défini');
                        $_SESSION["debug"] .= " | Hash en BDD: " . substr($user['mdp'], 0, 20) . "...";
                        $_SESSION["debug"] .= " | Mot de passe saisi: '" . $mdp . "'";
                        
                        if(password_verify($mdp, $user['mdp'])){
                            $_SESSION["debug"] .= " | Vérification RÉUSSIE";
                            $mdp_correct = true;
                            $_SESSION['id_user'] = $user['id_user'];
                            $_SESSION['user_email'] = $user['email'];
                            $_SESSION['role'] = isset($user['role']) ? strtolower($user['role']) : '';
                            break;
                        }
                        else {
                            $_SESSION["debug"] .= " | Vérification ÉCHOUÉE";
                        }
                    }
                }
                
                if($utilisateur_trouve && $mdp_correct){
                    // Refuse l'accès aux employés
                    if(isset($_SESSION['role']) && $_SESSION['role'] === 'employe'){
                        $_SESSION["message"] = "Vous n'êtes pas autorisé à vous connecter";
                    } else {
                        $_SESSION["login"] = $email;
                        $_SESSION['last_activity'] = time();
                        header("Location: index.php");
                        exit();
                    }
                }
                else {
                    if($utilisateur_trouve){
                        $_SESSION["message"] = "Identifiants incorrects";
                    }
                    else {
                        $_SESSION["message"] = "Identifiants incorrects";
                    }
                }
            }
            else {
                $_SESSION["message"] = "Erreur: pas de données utilisateur dans la réponse API";
            }
        }
        else {
            $_SESSION["message"] = "Erreur de connexion à l'API";
        }
    }
    else if(isset($_POST["email"]) || isset($_POST["mdp"])){
        $_SESSION["message"] = "Veuillez remplir tous les champs";
    }
?>


<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authentification</title>
        <link rel="icon" type="image/png" href="img/logo.png">
        <link rel="stylesheet" href="connexion.css">
        <style>
            
        </style>
    </head>

    <body>
        <div class="login-container">
            <h1>Authentification</h1>
            <p class="subtitle">Connectez-vous à votre compte</p>

            <?php
                // Test de connexion à l'API
                $api_url = "http://192.168.2.113:5000/user";
                $context = stream_context_create([
                    "http" => [
                        "method" => "GET",
                        "header" => "Content-Type: application/json\r\n"
                    ]
                ]);
                $response = file_get_contents($api_url, false, $context);
            ?>

            <?php 
                if(isset($_SESSION["message"])){
                    $isError = strpos($_SESSION["message"], "incorrect") !== false || strpos($_SESSION["message"], "Erreur") !== false;
            ?>
            <div class="message <?php echo $isError ? 'error' : 'success'; ?>">
                <?php echo $_SESSION['message']; ?>
            </div>
            <?php } ?>

            <form method="POST">
                <div class="form-group">
                    <label for="email">Email :</label>
                    <input type="email" id="email" name="email" value='<?php echo isset($_POST["email"]) ? htmlspecialchars($_POST["email"]) : "" ?>' required/>
                </div>

                <div class="form-group">
                    <label for="mdp">Mot de passe :</label>
                    <input type="password" id="mdp" name="mdp" required/>
                </div>

                <button type="submit" class="btn-submit">Connexion</button>
            </form>

        </div>
    </body>

</html>

        



