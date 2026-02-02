import fastf1
import json
from collections import Counter

# Enable cache
fastf1.Cache.enable_cache('/Users/jakkapat/Library/Caches/fastf1')

years = range(2020, 2026)

for year in years:
    print(f"Checking schedule for {year}")
    try:
        schedule = fastf1.get_event_schedule(year)
        data = json.loads(schedule.to_json(orient='records'))

        rounds = [e.get('RoundNumber') for e in data]
        counts = Counter(rounds)

        duplicates = {k: v for k, v in counts.items() if v > 1}
        
        if duplicates:
            print(f"  Duplicate RoundNumbers in {year}: {duplicates}")
            for event in data:
                if event.get('RoundNumber') in duplicates:
                    print(f"    Round: {event.get('RoundNumber')}, Name: {event.get('EventName')}")
        else:
            print(f"  No duplicates in {year}")
            
    except Exception as e:
        print(f"  Error checking {year}: {e}")
