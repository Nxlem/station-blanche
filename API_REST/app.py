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


if __name__ == '__main__':
    app.run(host='10.0.200.30', port=5000, debug=True)


 
