import fastf1
import pandas as pd
import numpy as np

# Enable cache
fastf1.Cache.enable_cache('/Users/jakkapat/Library/Caches/fastf1')

year = 2023
race = 'Bahrain'

print("--- Qualifying Results ---")
try:
    quali = fastf1.get_session(year, race, 'Q')
    quali.load()
    print(quali.results[['Abbreviation', 'TeamName', 'Position', 'Q1', 'Q2', 'Q3']].head())
except Exception as e:
    print(f"Error fetching Quali: {e}")

print("\n--- Team Pace ---")
try:
    race_session = fastf1.get_session(year, race, 'R')
    race_session.load()
    laps = race_session.laps.pick_quicklaps()
    # Group by team and calculate mean lap time
    team_pace = laps.groupby('Team')['LapTime'].mean()
    print(team_pace)
except Exception as e:
    print(f"Error fetching Race Pace: {e}")

print("\n--- Track Map ---")
try:
    circuit_info = race_session.get_circuit_info()
    print("Corners:", circuit_info.corners.head())
    # We also need the track path (x, y)
    lap = race_session.laps.pick_fastest()
    telemetry = lap.get_telemetry()
    print("Track Path Sample:", telemetry[['X', 'Y']].head())
except Exception as e:
    print(f"Error fetching Track Map: {e}")
