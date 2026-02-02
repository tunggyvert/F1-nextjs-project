import fastf1
import os

# Setup Cache
CACHE_DIR = os.path.join(os.getcwd(), 'backend', 'cache')
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)
fastf1.Cache.enable_cache(CACHE_DIR)

try:
    print("Getting session...")
    session = fastf1.get_session(2023, 1, 'R')
    print("Loading session...")
    session.load()
    print("Session loaded.")
    
    laps = session.laps
    print(f"Laps: {len(laps)}")
    
    fastest_lap = laps.pick_fastest()
    telemetry = fastest_lap.get_telemetry()
    print("Telemetry loaded.")
    
    telemetry_data = telemetry[['Date', 'Speed', 'RPM', 'nGear', 'Throttle', 'Brake', 'DRS', 'Time']].copy()
    telemetry_data['Date'] = telemetry_data['Date'].astype(str)
    telemetry_data['Time'] = telemetry_data['Time'].dt.total_seconds()
    
    print("Telemetry processed successfully.")
    print(telemetry_data.head())
    
except Exception as e:
    import traceback
    traceback.print_exc()
