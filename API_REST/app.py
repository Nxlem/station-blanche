from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
from dotenv import load_dotenv
import pymysql

load_dotenv()

app = Flask(__name__)

CORS(app)

##Connexion à la base de données MySQL avec pymysql
def get_db_connection():
    conn = pymysql.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        db=os.getenv('DB_NAME', 'station_blanche'),
        user=os.getenv('DB_USER', 'admin'),
        password=os.getenv('DB_PASSWORD', '252106'),
        cursorclass=pymysql.cursors.DictCursor,
        charset='utf8mb4',
        autocommit=False
    )
    return conn
    
def fetch_db_rows(table, columns):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            col_str = ', '.join(columns)
            cur.execute(f"SELECT {col_str} FROM {table}")
            return cur.fetchall()
    finally:
        conn.close()

##Endpoints pour récupérer les données de la table fichiers de la bdd et les retourner au format JSON
@app.route('/file', methods=['GET'])
def get_log_file():
    try:
        ##Récupération des données de la table fichiers
        rows = fetch_db_rows('fichiers', ['id_fichier', 'id_scan', 'nom', 'chemin', 'taille', 'statut'])
        ##Retour des données au format JSON
        return jsonify({'fichiers': rows})
    except Exception as e:
        ##Connexion impossible à la base de données, ou autre erreur lors de la récupération des données
        return jsonify({'error': f'Erreur base de données fichiers : {str(e)}'}), 500


@app.route('/scan', methods=['GET'])
def get_log_scan():
    try:
        rows = fetch_db_rows('scans', ['id_scan', 'id_usb', 'date_scan', 'nb_fichier', 'etat_scan', 'infecte', 'duree'])

        for row in rows:
            if isinstance(row.get('date_scan'), (datetime.datetime, datetime.date)):
                row['date_scan'] = row['date_scan'].isoformat()
            if isinstance(row.get('duree'), datetime.timedelta):
                row['duree'] = str(row['duree'])

        return jsonify({'scans': rows})
    except Exception as e:
        return jsonify({'error': f'Erreur base de données scans : {str(e)}'}), 500


@app.route('/usb', methods=['GET'])
def get_log_usb():
    try:
        rows = fetch_db_rows('usb', ['id_usb', 'nom', 'filesystem', 'taille', 'date_insertion'])
        return jsonify({'usb': rows})
    except Exception as e:
        return jsonify({'error': f'Erreur base de données usb : {str(e)}'}), 500

@app.route('/user', methods=['GET'])
def get_log_user():
    try:
        rows = fetch_db_rows('user', ['id_user', 'role', 'mdp', 'pin', 'nom', 'prenom', 'email', 'date_creation'])
        return jsonify({'user': rows})
    except Exception as e:
        return jsonify({'error': f'Erreur base de données user : {str(e)}'}), 500
        
@app.route('/acces', methods=['GET'])
def get_log_acces():
    try:
        rows = fetch_db_rows('acces_log', ['id_access', 'id_user', 'methode_auth', 'resultat', 'porte', 'date_acces'])
        return jsonify({'acces_log': rows})
    except Exception as e:
        return jsonify({'error': f'Erreur base de données acces_log   : {str(e)}'}), 500


@app.route('/action_admin', methods=['GET'])
def get_log_action_admin():
    try:
        rows = fetch_db_rows('action_admin', ['id_action', 'id_user', 'action', 'date_action', 'detail'])
        # normalize date_action to isoformat if needed
        for row in rows:
            if isinstance(row.get('date_action'), (datetime.datetime, datetime.date)):
                row['date_action'] = row['date_action'].isoformat()
        return jsonify({'action_admin': rows})
    except Exception as e:
        return jsonify({'error': f'Erreur base de données action_admin : {str(e)}'}), 500


if __name__ == '__main__':
    app.run(host='10.0.200.30', port=5000, debug=True)


 
