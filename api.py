import os
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pipeline as pl

OUT = os.environ.get("NAV_OUT", "out16")
L = np.load(os.path.join(OUT, "layers.npz"))
Z, SLOPE, T, PRES, LATS, LONS = L["Z"], L["slope"], L["T_noon"], L["pressure"], L["lats"], L["lons"]
PPD = 1.0 / abs(LATS[1] - LATS[0])
DY = pl.R_MARS * np.radians(1 / PPD)
DX = DY * np.cos(np.radians(LATS))
SUMMARY = __import__("json").load(open(os.path.join(OUT, "summary.json")))

app = FastAPI(title="Mars Site Navigator API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"], allow_headers=["*"])