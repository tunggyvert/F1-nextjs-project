import fastf1
import pandas as pd

# Enable cache
fastf1.Cache.enable_cache('/Users/jakkapat/Library/Caches/fastf1')

session = fastf1.get_session(2023, 'Bahrain', 'R')
session.load()

laps = session.laps
# Check unique compounds
print("Unique Compounds:", laps['Compound'].unique())

# Check a sample driver's stints
driver = laps['Driver'].unique()[0]
driver_laps = laps[laps['Driver'] == driver]
print(f"\nStints for {driver}:")
print(driver_laps[['LapNumber', 'Stint', 'Compound', 'TyreLife']].head(20))
