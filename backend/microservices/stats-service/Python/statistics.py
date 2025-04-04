import os
import pandas as pd
import matplotlib.pyplot as plt
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime

# Configuración
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
MONGO_URI = os.getenv('MONGO_URI')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '../public/graphs')
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_daily_jumps():
    """Obtiene saltos diarios desde MongoDB"""
    try:
        client = MongoClient(MONGO_URI)
        db = client['flappybird']
        stats = list(db['Stat'].find({}, {'_id': 0, 'date': 1, 'jumps': 1}))
        
        if not stats:
            print("⚠️ No hay datos en la colección Stat")
            return None
            
        df = pd.DataFrame(stats)
        df['date'] = pd.to_datetime(df['date']).dt.date  # Convertir a fecha sin hora
        return df.groupby('date')['jumps'].sum().reset_index()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None
    finally:
        if 'client' in locals():
            client.close()

def generate_daily_jumps_plot(df):
    """Genera gráfico de saltos por día"""
    plt.figure(figsize=(12, 6))
    
    # Gráfico de barras
    bars = plt.bar(
        df['date'], 
        df['jumps'], 
        color='#4CAF50',  # Verde
        width=0.8, 
        edgecolor='black',
        alpha=0.8
    )
    
    # Personalización
    plt.title('Saltos Totales por Día', pad=20, fontsize=16)
    plt.xlabel('Fecha', fontsize=12)
    plt.ylabel('Total de Saltos', fontsize=12)
    plt.grid(axis='y', linestyle='--', alpha=0.4)
    
    # Formato de fechas
    plt.gca().xaxis.set_major_formatter(plt.matplotlib.dates.DateFormatter('%d-%b'))
    plt.xticks(rotation=45, ha='right')
    
    # Añadir valores en las barras
    for bar in bars:
        height = bar.get_height()
        plt.text(
            bar.get_x() + bar.get_width()/2., 
            height, 
            f'{int(height)}', 
            ha='center', 
            va='bottom',
            fontsize=9
        )
    
    plt.tight_layout()
    plt.savefig(
        os.path.join(OUTPUT_DIR, 'saltos_diarios.png'), 
        dpi=150, 
        bbox_inches='tight'
    )
    plt.close()

if __name__ == "__main__":
    print("\n📊 Generando gráfico de saltos diarios...")
    
    data = get_daily_jumps()
    
    if data is not None:
        print(f"\n📅 Datos desde {data['date'].min()} hasta {data['date'].max()}")
        print(f"📌 Total de días: {len(data)}")
        
        generate_daily_jumps_plot(data)
        print(f"\n✅ Gráfico guardado en: {OUTPUT_DIR}/saltos_diarios.png")
    else:
        print("\n❌ No se pudieron obtener datos")