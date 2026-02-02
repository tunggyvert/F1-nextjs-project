from fastapi import APIRouter, HTTPException
import fastf1
from services.cache import redis_cache
import pandas as pd
import json

router = APIRouter()

@router.get("/standings/drivers/{year}")
async def get_driver_standings(year: int):
    cache_key = f"driver_standings_{year}"
    cached_data = redis_cache.get(cache_key)
    if cached_data:
        return cached_data

    try:
        # FastF1 doesn't have a direct standings API, we might need to rely on Ergast or calculate it.
        # However, for simplicity, let's use Ergast via FastF1 if available or just raw Ergast.
        # Actually, FastF1 provides event data. Standings are usually per season.
        # Let's use the ergast API directly or via a wrapper if FastF1 doesn't support it easily.
        # Wait, FastF1 is mostly for telemetry.
        # For standings, we might need to fetch from Ergast.
        # Let's use `fastf1.ergast` if available or just `requests` to ergast.com for now.
        # FastF1 has an ergast interface.
        from fastf1.ergast import Ergast
        ergast = Ergast()
        standings = ergast.get_driver_standings(season=year)
        
        # Convert DataFrame to dict
        data = standings.content[0].to_dict(orient='records')
        
        redis_cache.set(cache_key, data)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/standings/constructors/{year}")
async def get_constructor_standings(year: int):
    cache_key = f"constructor_standings_{year}"
    cached_data = redis_cache.get(cache_key)
    if cached_data:
        return cached_data

    try:
        from fastf1.ergast import Ergast
        ergast = Ergast()
        standings = ergast.get_constructor_standings(season=year)
        data = standings.content[0].to_dict(orient='records')
        redis_cache.set(cache_key, data)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/schedule/{year}")
async def get_schedule(year: int):
    cache_key = f"schedule_{year}"
    cached_data = redis_cache.get(cache_key)
    if cached_data:
        return cached_data

    try:
        schedule = fastf1.get_event_schedule(year)
        # Convert Timestamp objects to strings
        data = json.loads(schedule.to_json(orient='records'))
        redis_cache.set(cache_key, data)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{year}/{race_id}/{session_type}")
async def get_session_data(year: int, race_id: str, session_type: str):
    # This is heavy, we definitely need caching
    cache_key = f"session_{year}_{race_id}_{session_type}"
    # cached_data = redis_cache.get(cache_key) # Commented out for now to ensure we get fresh data during dev
    # if cached_data: return cached_data

    try:
        # race_id can be int (round number) or string (name/location)
        # FastF1 handles both if passed as second arg
        if race_id.isdigit():
            race_id = int(race_id)
            
        session = fastf1.get_session(year, race_id, session_type)
        session.load()
        
        # Laps data
        laps = session.laps
        # Pick relevant columns
        laps_data = laps[['Driver', 'LapTime', 'LapNumber', 'Stint', 'Compound', 'TyreLife', 'Position']].copy()
        laps_data['LapTime'] = laps_data['LapTime'].dt.total_seconds()
        
        # Telemetry for the fastest lap
        fastest_lap = laps.pick_fastest()
        telemetry = fastest_lap.get_telemetry()
        telemetry_data = telemetry[['Date', 'Speed', 'RPM', 'nGear', 'Throttle', 'Brake', 'DRS', 'Time']].copy()
        telemetry_data['Date'] = telemetry_data['Date'].astype(str)
        telemetry_data['Time'] = telemetry_data['Time'].dt.total_seconds()

        # Weather data
        weather = session.weather_data
        weather_data = weather[['Time', 'AirTemp', 'TrackTemp', 'Humidity', 'Rainfall', 'WindSpeed', 'WindDirection']].copy()
        weather_data['Time'] = weather_data['Time'].dt.total_seconds()

        # Team Pace (only for Race)
        team_pace_data = []
        if session_type == 'R':
            quick_laps = laps.pick_quicklaps()
            team_pace = quick_laps.groupby('Team')['LapTime'].mean().reset_index()
            team_pace['LapTime'] = team_pace['LapTime'].dt.total_seconds()
            team_pace = team_pace.sort_values('LapTime')
            team_pace_data = team_pace.to_dict(orient='records')

        # Track Map (Corners and Path)
        # We use the fastest lap telemetry for the path
        track_map_data = {}
        try:
            circuit_info = session.get_circuit_info()
            corners = circuit_info.corners[['Number', 'Letter', 'X', 'Y', 'Angle', 'Distance']].copy()
            
            # Path
            path = fastest_lap.get_telemetry()[['X', 'Y', 'Z']].copy()
            
            track_map_data = {
                "corners": corners.to_dict(orient='records'),
                "path": path.to_dict(orient='records')
            }
        except Exception as e:
            print(f"Error getting track map: {e}")


        # Results
        results = session.results
        results_data = results[['BroadcastName', 'FullName', 'Abbreviation', 'TeamName', 'Position', 'GridPosition', 'Status', 'Points']].copy()
        # Handle NaN in results
        import numpy as np
        results_data = results_data.replace({np.nan: None})

        import numpy as np
        laps_data = laps_data.replace({np.nan: None})
        telemetry_data = telemetry_data.replace({np.nan: None})
        weather_data = weather_data.replace({np.nan: None})

        result = {
            "laps": laps_data.to_dict(orient='records'),
            "fastest_lap_telemetry": telemetry_data.to_dict(orient='records'),
            "weather": weather_data.to_dict(orient='records'),
            "results": results_data.to_dict(orient='records'),
            "team_pace": team_pace_data,
            "track_map": track_map_data
        }
        
        # redis_cache.set(cache_key, result)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{year}/{race_id}/{session_type}/driver/{driver_number}")
async def get_driver_telemetry(year: int, race_id: str, session_type: str, driver_number: str):
    cache_key = f"telemetry_{year}_{race_id}_{session_type}_{driver_number}"
    # cached_data = redis_cache.get(cache_key)
    # if cached_data: return cached_data

    try:
        if race_id.isdigit():
            race_id = int(race_id)
            
        session = fastf1.get_session(year, race_id, session_type)
        session.load()
        
        laps = session.laps
        driver_laps = laps.pick_driver(driver_number)
        if len(driver_laps) == 0:
             raise HTTPException(status_code=404, detail="Driver not found")
             
        fastest_lap = driver_laps.pick_fastest()
        telemetry = fastest_lap.get_telemetry()
        
        telemetry_data = telemetry[['Date', 'Speed', 'RPM', 'nGear', 'Throttle', 'Brake', 'DRS', 'Time']].copy()
        telemetry_data['Date'] = telemetry_data['Date'].astype(str)
        telemetry_data['Time'] = telemetry_data['Time'].dt.total_seconds()
        
        import numpy as np
        telemetry_data = telemetry_data.replace({np.nan: None})
        
        data = telemetry_data.to_dict(orient='records')
        # redis_cache.set(cache_key, data)
        return data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/qualifying/{year}/{race_id}")
async def get_qualifying_results(year: int, race_id: str):
    cache_key = f"qualifying_{year}_{race_id}"
    cached_data = redis_cache.get(cache_key)
    if cached_data:
        return cached_data

    try:
        if race_id.isdigit():
            race_id = int(race_id)
            
        session = fastf1.get_session(year, race_id, 'Q')
        session.load()
        
        results = session.results
        # Select relevant columns
        # Q1, Q2, Q3 times are Timedelta, need to convert
        cols = ['Abbreviation', 'TeamName', 'Position', 'Q1', 'Q2', 'Q3']
        # Check if columns exist (some might be missing if session didn't have Q3 etc)
        available_cols = [c for c in cols if c in results.columns]
        
        quali_data = results[available_cols].copy()
        
        for col in ['Q1', 'Q2', 'Q3']:
            if col in quali_data.columns:
                quali_data[col] = quali_data[col].dt.total_seconds()
                
        import numpy as np
        quali_data = quali_data.replace({np.nan: None})
        
        data = quali_data.to_dict(orient='records')
        redis_cache.set(cache_key, data)
        return data
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
