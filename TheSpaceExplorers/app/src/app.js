const META = __META__;
const B64 = "__TERRAIN_B64__";

const GEO_DATA = __GEO_DATA__;
// giai ma du lieu
const raw = Uint8Array.from(atob(B64), c => c.charCodeAt(0));
const H = META.H, W = META.W, N = H * W;
const Z = new Float32Array(N), SITE = new Uint8Array(N);
{ const dv = new DataView(raw.buffer);
 for (let k = 0; k < N; k++) Z[k] = dv.getInt16(2 * k, true);
 SITE.set(raw.subarray(2 * N, 3 * N)); }
const R = 3396.19e3, PPD = META.ppd;
const LAT = new Float64Array(H), LON = new Float64Array(W), DX = new Float64Array(H);
const DY = R * (Math.PI / 180) / PPD;
for (let i = 0; i < H; i++) { LAT[i] = META.lat_n - (i + .5) / PPD; DX[i] = DY * Math.cos(LAT[i] * Math.PI / 180) }
for (let j = 0; j < W; j++) LON[j] = META.lon_w + (j + .5) / PPD;
const MIN_DX = Math.min(...DX);

//dia chat USGS SIM 3292 (grid don vi, he so)
const GU = GEO_DATA.units, GEO = new Uint8Array(N), GF = new Float32Array(GU.map(u => u.f));
{ let o = 0; for (const tk of GEO_DATA.rle.split(",")) { if (!tk) continue; const v = +tk[0], n = parseInt(tk.slice(1), 16); GEO.fill(v, o, o + n); o += n }
 if (o !== N) console.warn("GEO length", o, N) }
const GEO_RGB = GU.map(u => [1, 3, 5].map(k => parseInt(u.color.slice(k, k + 2), 16)));
const VIK_IMG = new Image(); VIK_IMG.src = "__VIKING_JPG__";
const VIK_REF = __VIK_REF__;
VIK_IMG.onload = () => { if (st.layer === "img") {paintRaster(); V3D.terrainDirty(); drawMini() } };
const vikReady = () => VIK_IMG.complete && VIK_IMG.naturalWidth > 0;
const STRUCT_NAME = ["vách xói mòn", "trục rãnh sụt (graben)", "dòng dung nham thùy", "vành hõm chảo", "gờ yardang", "trục lòng dẫn", "gờ"];
function drawGeoOverlay(ctx, sx, sy, labels) {
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const pass of [0, 1]) for (const s of GEO_DATA.struct) {
    ctx.beginPath(); for (let k = 1; k < s.length; k += 2) { const x = s[k] * sx, y = s[k + 1] * sy; k === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }
    ctx.strokeStyle = pass ? (s[0] === 3 ? "#ffffff" : "rgba(21,25,29,.9)") : "rgba(255,255,255,.45)";
    ctx.lineWidth = (pass ? 1.1 : 2.6) * Math.max(1, sx / 2.2); ctx.stroke() }
