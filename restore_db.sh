#!/bin/bash

DB_NAME="station_blanche"
DB_USER="admin"
DB_PASSWORD="252106"

# Vérifier que 1 argument est fourni
if [ $# -ne 1 ]; then
    echo "Usage: $0 <fichier_de_backup.sql>"
    exit 1
fi

FILE=$1

# Vérifier que le fichier existe
if [ ! -f "$FILE" ]; then
    echo "Erreur : le fichier n'existe pas"
    exit 1
fi

# Vérifier que c'est une extension .sql
EXT="${FILE##*.}"

if [ "$EXT" != "sql" ]; then
    echo "Erreur : le fichier doit être au format .sql"
    exit 1
fi

# Vérifier que le fichier n'est pas vide
if [ ! -s "$FILE" ]; then
    echo "Erreur : le fichier est vide"
    exit 1
fi

# Demander confirmation
echo "Vous êtes sur le point de restaurer la base '$DB_NAME' avec le fichier : $FILE"
read -p "Confirmer la restauration ? (oui/non) : " confirm

if [ "$confirm" != "oui" ]; then
    echo "Restauration annulée"
    exit 0
fi

# Lancer la restauration
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$FILE"

# Vérifier si la commande a réussi
if [ $? -eq 0 ]; then
    echo "Restauration terminée avec succès"
else
    echo "Erreur lors de la restauration"
    exit 1
fi
