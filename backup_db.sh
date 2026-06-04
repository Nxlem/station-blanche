#!/bin/bash

DATE=$(date +"%d-%m-%Y_%H_%M")

# Sauvegarde de la BDD dans le fichier
mysqldump -u admin -p252106 station_blanche > /home/station-blanche/backups/backup_$DATE.sql
