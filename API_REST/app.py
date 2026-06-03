from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
from dotenv import load_dotenv
import pymysql
import datetime
import re
import bcrypt

load_dotenv()

app = Flask(__name__)

CORS(app)

def hash_password(password):
    """Crypte un mot de passe avec bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def is_bcrypt_hash(value):
    return isinstance(value, str) and re.match(r'^\$2[aby]\$.{56}$', value) is not None


def parse_date_for_mysql(value):
    if value is None:
        return None
    if isinstance(value, datetime.datetime):
        return value.strftime('%Y-%m-%d %H:%M:%S')
    if isinstance(value, datetime.date):
        return value.strftime('%Y-%m-%d')
    if not isinstance(value, str):
        return None

    text = value.strip()
    if text == '':
        return None

    if text.endswith('Z'):
        text = text[:-1]
    text = text.replace('T', ' ')

    for fmt in ('%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d'):
        try:
            dt = datetime.datetime.strptime(text, fmt)
            return dt.strftime('%Y-%m-%d %H:%M:%S')
        except ValueError:
            continue

    try:
        dt = datetime.datetime.fromisoformat(text)
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except ValueError:
        return None

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


@app.route('/user', methods=['POST'])
def create_user():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Données requises'}), 400

    # Pour la création, le mot de passe est obligatoire
    if not data.get('mdp'):
        return jsonify({'error': 'Le mot de passe est requis'}), 400

    conn = get_db_connection()
    try:
        mdp_crypte = hash_password(data.get('mdp'))
        with open('/tmp/api_debug.log', 'a') as f:
            f.write(f"Mot de passe original: {data.get('mdp')}\n")
            f.write(f"Mot de passe crypté: {mdp_crypte}\n")
        
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO user (role, mdp, pin, nom, prenom, email, date_creation)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
            """, (data.get('role'), mdp_crypte, data.get('pin'), data.get('nom'), data.get('prenom'), data.get('email')))
            conn.commit()
            with open('/tmp/api_debug.log', 'a') as f:
                f.write(f"Utilisateur créé avec ID: {cur.lastrowid}\n")
            return jsonify({'message': 'Utilisateur créé', 'id': cur.lastrowid}), 201
    except Exception as e:
        conn.rollback()
        with open('/tmp/api_debug.log', 'a') as f:
            f.write(f"Erreur lors de la création: {str(e)}\n")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/user/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Données requises'}), 400

    conn = get_db_connection()
    try:
        # Si un mot de passe est fourni (et non vide), on le crypte
        mdp_crypte = None
        if data.get('mdp') and data.get('mdp').strip():
            mdp_crypte = hash_password(data.get('mdp'))

        with conn.cursor() as cur:
            if mdp_crypte:
                # Mise à jour avec nouveau mot de passe
                cur.execute("""
                    UPDATE user SET role=%s, mdp=%s, pin=%s, nom=%s, prenom=%s, email=%s
                    WHERE id_user=%s
                """, (data.get('role'), mdp_crypte, data.get('pin'), data.get('nom'), data.get('prenom'), data.get('email'), user_id))
            else:
                # Mise à jour sans changer le mot de passe
                cur.execute("""
                    UPDATE user SET role=%s, pin=%s, nom=%s, prenom=%s, email=%s
                    WHERE id_user=%s
                """, (data.get('role'), data.get('pin'), data.get('nom'), data.get('prenom'), data.get('email'), user_id))
            conn.commit()
            return jsonify({'message': 'Utilisateur mis à jour'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/user/import', methods=['POST'])
def import_users():
    body = request.get_json()
    if not body:
        return jsonify({'error': 'Données requises'}), 400

    users = body.get('users') if isinstance(body, dict) and 'users' in body else body
    if not isinstance(users, list):
        return jsonify({'error': "Le format doit être une liste d'utilisateurs"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    summary = {'imported': 0, 'updated': 0, 'skipped': 0, 'errors': []}

    try:
        for raw_user in users:
            if not isinstance(raw_user, dict):
                summary['skipped'] += 1
                continue

            role = raw_user.get('role')
            nom = raw_user.get('nom')
            prenom = raw_user.get('prenom')
            email = raw_user.get('email')
            if not role or not nom or not prenom or not email:
                summary['skipped'] += 1
                continue

            id_user = raw_user.get('id_user')
            pin = raw_user.get('pin')
            date_creation = parse_date_for_mysql(raw_user.get('date_creation'))
            mdp_value = raw_user.get('mdp')
            mdp_hash = None
            if mdp_value and isinstance(mdp_value, str):
                if is_bcrypt_hash(mdp_value):
                    mdp_hash = mdp_value
                else:
                    mdp_hash = hash_password(mdp_value)

            existing_user = None
            if id_user:
                cur.execute("SELECT id_user FROM user WHERE id_user=%s", (id_user,))
                existing_user = cur.fetchone()
            if not existing_user:
                cur.execute("SELECT id_user FROM user WHERE email=%s", (email,))
                existing_user = cur.fetchone()

            if existing_user:
                update_fields = ['role=%s', 'pin=%s', 'nom=%s', 'prenom=%s', 'email=%s']
                values = [role, pin, nom, prenom, email]
                if mdp_hash:
                    update_fields.append('mdp=%s')
                    values.append(mdp_hash)
                if date_creation is not None:
                    update_fields.append('date_creation=%s')
                    values.append(date_creation)
                values.append(existing_user['id_user'])
                cur.execute(f"UPDATE user SET {', '.join(update_fields)} WHERE id_user=%s", tuple(values))
                summary['updated'] += 1
            else:
                insert_fields = ['role', 'mdp', 'pin', 'nom', 'prenom', 'email']
                insert_values = [role, mdp_hash or hash_password('password123'), pin, nom, prenom, email]
                if date_creation is not None:
                    insert_fields.append('date_creation')
                    insert_values.append(date_creation)
                if id_user:
                    insert_fields.insert(0, 'id_user')
                    insert_values.insert(0, id_user)
                placeholders = ', '.join(['%s'] * len(insert_fields))
                cur.execute(f"INSERT INTO user ({', '.join(insert_fields)}) VALUES ({placeholders})", tuple(insert_values))
                summary['imported'] += 1

        conn.commit()
        return jsonify(summary), 200
    except Exception as e:
        conn.rollback()
        summary['errors'].append(str(e))
        return jsonify({'error': str(e), 'summary': summary}), 500
    finally:
        cur.close()
        conn.close()


@app.route('/user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM user WHERE id_user=%s", (user_id,))
            conn.commit()
            return jsonify({'message': 'Utilisateur supprimé'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


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


@app.route('/import-logs', methods=['POST'])
def import_logs():
    data = request.get_json()
    if not data or 'type' not in data:
        return jsonify({"error": "Invalid data format"}), 400
    
    log_type = data['type']
    
    # Déterminer le chemin du fichier log
    if log_type == 'usb':
        log_path = '/home/station-blanche/logs/log_usb.log'
    elif log_type == 'file':
        log_path = '/home/station-blanche/logs/log_fichier.log'
    elif log_type == 'scan':
        log_path = '/home/station-blanche/logs/log_scan.log'
    else:
        return jsonify({"error": "Unsupported log type"}), 400
    
    if not os.path.exists(log_path):
        return jsonify({"error": f"Log file for {log_type} not found"}), 404
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        with open(log_path, 'r') as f:
            lines = f.read().splitlines()
        
        for line in lines:
            if line.strip():  # Ignorer les lignes vides
                try:
                    log_entry = json.loads(line)
                    if log_type == 'usb':
                        cur.execute(
                            "INSERT IGNORE INTO usb (id_usb, nom, filesystem, taille, date_insertion) VALUES (%s, %s, %s, %s, %s)",
                            (log_entry['id_usb'], log_entry['nom'], log_entry['filesystem'], log_entry['taille'], log_entry['date_insertion'])
                        )
                    elif log_type == 'file':
                        cur.execute(
                            "INSERT IGNORE INTO fichiers (id_fichier, id_scan, nom, chemin, taille, statut) VALUES (%s, %s, %s, %s, %s, %s)",
                            (log_entry['id_fichier'], log_entry['id_scan'], log_entry['nom'], log_entry['chemin'], log_entry['taille'], log_entry['statut'])
                        )
                    elif log_type == 'scan':
                        cur.execute(
                            "INSERT IGNORE INTO scans (id_scan, id_usb, date_scan, nb_fichier, etat_scan, infecte, duree) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                            (log_entry['id_scan'], log_entry['id_usb'], log_entry['date_scan'], log_entry['nb_fichier'], log_entry['etat_scan'], log_entry['infecte'], log_entry['duree'])
                        )
                except json.JSONDecodeError:
                    continue  # Ignorer les lignes mal formées
        
        conn.commit()
        return jsonify({"message": f"Logs {log_type} imported successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Partie Etudiant 3

REPORTS_DIR = "/home/station-blanche/rapports"

# Endpoint pour lister les rapports disponibles
@app.route('/reports', methods=['GET'])
def list_reports():
    try:
        if not os.path.exists(REPORTS_DIR):
            return jsonify({'error': 'Dossier introuvable'}), 404

        files = []

        for filename in os.listdir(REPORTS_DIR):
            filepath = os.path.join(REPORTS_DIR, filename)

            # uniquement les fichiers texte
            if os.path.isfile(filepath) and filename.endswith('.txt'):
                stat = os.stat(filepath)

                files.append({
                    'name': filename,
                    'size': stat.st_size,
                    'modified': datetime.datetime.fromtimestamp(
                        stat.st_mtime
                    ).isoformat()
                })

        return jsonify({'reports': files}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint pour récupérer le contenu d'un rapport spécifique
@app.route('/reports/<path:filename>', methods=['GET'])
def get_report(filename):

    # sécurité anti path traversal
    if '..' in filename or filename.startswith('/'):
        return jsonify({'error': 'Nom de fichier invalide'}), 400

    filepath = os.path.join(REPORTS_DIR, filename)

    if not os.path.isfile(filepath):
        return jsonify({'error': 'Fichier introuvable'}), 404

    # uniquement les .txt
    if not filename.endswith('.txt'):
        return jsonify({'error': 'Format non autorisé'}), 403

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        return jsonify({
            'filename': filename,
            'content': content
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='192.168.2.113', port=5000, debug=True)

 
