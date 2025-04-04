import pymongo
import matplotlib.pyplot as plt
import numpy as np
import os
from dotenv import load_dotenv
from pathlib import Path

# Carregar variables d'entorn des de .env
load_dotenv()

# Configuració de rutes
DIRECTORI_IMATGES = Path("backend/microservices/stats-service/Python-imatge")
DIRECTORI_IMATGES.mkdir(parents=True, exist_ok=True)  # Crear directori si no existeix

# Configuració de MongoDB
MONGO_URI = os.getenv('MONGO_URI')
NOM_BD = 'flappybird'  # Nom de la base de dades segons el teu .env
NOM_COLLECCIO = 'stats'  # Nom de la col·lecció (basat en el teu model)

def obtenir_mitjana_salts_per_jugador():
    """Obté la mitjana de salts per jugador des de MongoDB"""
    try:
        # Connectar a MongoDB
        client = pymongo.MongoClient(MONGO_URI)
        db = client[NOM_BD]
        colleccio = db[NOM_COLLECCIO]
        
        # Pipeline d'agregació per calcular la mitjana de salts per jugador
        pipeline = [
            {
                "$group": {
                    "_id": "$playerName",
                    "mitjanaSalts": {"$avg": "$jumps"},
                    "partidesJugades": {"$sum": 1}
                }
            },
            {"$sort": {"mitjanaSalts": -1}},
            {"$limit": 10}  # Limitar als 10 millors per a una millor visualització
        ]
        
        resultats = list(colleccio.aggregate(pipeline))
        return resultats
        
    except Exception as e:
        print(f"Error en connectar amb MongoDB: {e}")
        return None
    finally:
        if 'client' in locals():
            client.close()

def generar_grafic_mitjana_salts(dades):
    """Genera un gràfic de barres amb la mitjana de salts per jugador"""
    if not dades:
        print("No hi ha dades per graficar")
        return
    
    jugadors = [item['_id'] for item in dades]
    mitjanes = [item['mitjanaSalts'] for item in dades]
    
    # Configurar el gràfic
    plt.figure(figsize=(12, 6))
    barres = plt.bar(jugadors, mitjanes, color='skyblue')
    
    # Afegir els valors sobre cada barra
    for barra in barres:
        alcada = barra.get_height()
        plt.text(barra.get_x() + barra.get_width()/2., alcada,
                 f'{alcada:.1f}',
                 ha='center', va='bottom')
    
    # Personalitzar el gràfic
    plt.title('Mitjana de Salts per Jugador', fontsize=16)
    plt.xlabel('Jugador', fontsize=12)
    plt.ylabel('Mitjana de Salts', fontsize=12)
    plt.xticks(rotation=45, ha='right')
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Ajustar el disseny perquè no es retallin els noms
    plt.tight_layout()
    
    # Ruta completa per guardar la imatge
    ruta_imatge = DIRECTORI_IMATGES / 'mitjana_salts.png'
    
    # Guardar el gràfic com a imatge
    plt.savefig(ruta_imatge)
    print(f"Gràfic guardat a: {ruta_imatge}")
    
    # Mostrar el gràfic (opcional)
    plt.show()

if __name__ == "__main__":
    print("Obtenint dades de MongoDB...")
    dades_salts = obtenir_mitjana_salts_per_jugador()
    
    if dades_salts:
        print("\nResultats trobats:")
        for item in dades_salts:
            print(f"{item['_id']}: {item['mitjanaSalts']:.1f} salts (en {item['partidesJugades']} partides)")
        
        print("\nGenerant gràfic...")
        generar_grafic_mitjana_salts(dades_salts)
    else:
        print("No s'han trobat dades per generar el gràfic")