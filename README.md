# Station-blanche

## Présentation

Station Blanche est une solution de sécurisation de supports USB permettant de scanner les périphériques connectés, de détecter les fichiers potentiellement malveillants et de centraliser les informations dans une interface d'administration.

Le projet est composé de deux parties principales :

* Une API REST développée en Python avec Flask.
* Une interface d'administration développée en PHP.

---

## Fonctionnalités principales

### Gestion des périphériques USB

* Enregistrement des périphériques USB détectés.
* Consultation des informations des périphériques.
* Historique des insertions.

### Gestion des scans

* Enregistrement des analyses réalisées.
* Suivi de l'état des scans.
* Consultation de la durée des analyses.
* Détection des supports infectés.

### Gestion des fichiers

* Liste des fichiers analysés.
* Consultation du statut des fichiers.
* Historique des fichiers traités.

### Gestion des utilisateurs

* Authentification des utilisateurs.
* Gestion des rôles.
* Contrôle des accès selon les permissions.

### Gestion des journaux

* Consultation des actions réalisées.
* Historique des opérations administrateur.

### Rapports

* Génération de rapports statistiques.
* Export des données au format CSV.

### Quarantaine

* Consultation des fichiers mis en quarantaine.
* Suivi des éléments suspects.

---

## Architecture du projet

### API REST

Dossier :

```text
API_REST/
```

Technologies :

* Python
* Flask
* PyMySQL
* Bcrypt

L'API permet l'accès aux données stockées dans la base de données.

### Interface d'administration

Dossier :

```text
interface_admin/
```

Technologies :

* PHP
* HTML
* CSS
* JavaScript

L'interface permet aux administrateurs de consulter et gérer les données du système.

---

## Endpoints API

### GET /file

Retourne la liste des fichiers enregistrés dans la base de données.

### GET /scan

Retourne la liste des scans effectués.

### GET /usb

Retourne la liste des périphériques USB enregistrés.

### GET /user

Retourne la liste des utilisateurs enregistrés.

### POST /import-logs

Permet d'importer les données contenues dans les fichiers de logs de la Station Blanche vers la base de données.

#### Fonctionnement :

Reçoit un type de log au format JSON (usb, file ou scan).
Lit le fichier de log correspondant sur le serveur.
Parcourt chaque entrée du fichier.
Convertit les données JSON en enregistrements SQL.
Insère les informations dans les tables correspondantes de la base de données.

#### Types pris en charge :

- usb : importe les périphériques USB détectés.
- file : importe les fichiers analysés.
- scan : importe les scans réalisés.

## Gestion des rôles

### Super-admin

Accès complet à l'ensemble des modules.

### Admin

Accès :

* Logs
* Gestion des utilisateurs
* Rapports

### Auditeur

Accès :

* Logs
* Rapports

### Employé

Aucun accès à l'interface d'administration.

---

## Installation

### Prérequis

* Python 3
* PHP, HTML, JS, CSS
* MySQL
* Apache

### Démarrage de l'API

Lancer l'API :

```bash
cd /home/station-blanche/API_REST
source venv/bin/activate
python3 app.py
```

### Installation de l'interface

Déployer le dossier :

```text
interface_admin/
```

sur un serveur web compatible PHP.

---

## Connexion

L'accès à l'interface se fait via :

```text
https://station-blanche.local/interface_admin/connexion.php
```

### Comptes de démonstration

| Rôle        | Email       | Mot de passe |
| ----------- | ----------- | ------------ |
| Super-admin | super@admin.fr | super  |
| Admin       | admin@admin.fr | admin  |
| Auditeur    | auditeur@auditeur.fr | auditeur  |
| Employe    | employe@employe.fr | employe  |

---

## Sauvegarde et restauration

### Sauvegarde

```bash
./backup_db.sh
```

### Restauration

```bash
./restore_db.sh <backup_fichier.sql>
```

---
## Mot de passe essentiels

### Rasperry
login : station-blanche
mdp : 252106

## MySQL
login : admin
mdp : 252106
nom de la bdd : station_blanche

---

## Auteur

Chirokoff Melvin

