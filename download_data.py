import math, os, sys, urllib.request

DATA = "data"
REGION = dict(lat_n=30.0, lat_s=8.0, lon_w=212.0, lon_e=240.0)
PDS3 = "https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x"
PDS4 = "https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived"
FILES = {
    "megdr16":  [f"{PDS3}/meg016/megt90n000eb.img", f"{PDS3}/meg016/megt90n000eb.lbl"],
    "megdr128": [f"{PDS4}/meg128/megt44n180hb.img", f"{PDS4}/meg128/megt44n180hb.xml"],
    "tes_ti":   ["https://se.psi.edu/inertia/nmap2003.bin"],
}
BLEND = "https://planetarymaps.usgs.gov/mosaic/Mars/HRSC_MOLA_Blend/Mars_HRSC_MOLA_BlendDEM_Global_200mp_v2.tif"
R = 3396190.0