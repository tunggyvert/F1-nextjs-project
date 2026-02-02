from fastf1.ergast import Ergast
import pandas as pd

ergast = Ergast()
standings = ergast.get_constructor_standings(season=2023)
data = standings.content[0].to_dict(orient='records')
print(data[0].keys())
print(data[0])
