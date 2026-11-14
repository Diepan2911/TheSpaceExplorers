"""
Dung canh Blender cho Olympus Mons tu thu muc model3d/.

Chay khong giao dien (Blender 4.x / 5.x):
  blender -b -P blender_scene.py -- model3d 5            # 5 = he so phong dai chieu cao
Hoac mo Blender > Scripting > Open blender_scene.py > sua MODEL_DIR > Run Script.
Ket qua: model3d/olympus_scene.blend va model3d/olympus_render.png
"""
import math, os, sys
import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
MODEL_DIR = os.path.abspath(argv[0] if argv else "model3d")
EXAG = float(argv[1]) if len(argv) > 1 else 5.0      # nui that rong 600 km, cao 22 km -> rat thoai; 3-8 lan de nhin ro
RENDER = (argv[2] if len(argv) > 2 else "yes") == "yes"

bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene

# ---------- dia hinh ----------
bpy.ops.wm.obj_import(filepath=os.path.join(MODEL_DIR, "olympus_terrain.obj"), forward_axis="Y", up_axis="Z")
terrain = bpy.context.selected_objects[0]
terrain.name = "OlympusMons"
terrain.scale = (1, 1, EXAG)
bpy.ops.object.shade_smooth()
# vat lieu: anh mau + nham, khong bong
mat = bpy.data.materials.new("Mars"); mat.use_nodes = True
nt = mat.node_tree; bsdf = nt.nodes["Principled BSDF"]
tex = nt.nodes.new("ShaderNodeTexImage")
tex.image = bpy.data.images.load(os.path.join(MODEL_DIR, "olympus_texture.png"))
nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
bsdf.inputs["Roughness"].default_value = 0.95
terrain.data.materials.clear(); terrain.data.materials.append(mat)

# ---------- tuyen duong ----------
bpy.ops.wm.obj_import(filepath=os.path.join(MODEL_DIR, "olympus_routes.obj"), forward_axis="Y", up_axis="Z")
colors = {"optimal": (0.16, 0.47, 0.84, 1), "shortest": (0.92, 0.41, 0.20, 1)}
for ob in list(bpy.context.selected_objects):
    key = "optimal" if "optimal" in ob.name else "shortest"
    ob.name = f"route_{key}"
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.select_all(action="DESELECT"); ob.select_set(True)
    ob.scale = (1, 1, EXAG)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)   # de ong khong bi keo dai theo Z
    bpy.ops.object.convert(target="CURVE")
    ob.data.bevel_depth = 1.6          # km, du day de nhin ro tu xa
    ob.data.bevel_resolution = 2
    m = bpy.data.materials.new(f"route_{key}"); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = colors[key]
    b.inputs["Emission Color"].default_value = colors[key]
    b.inputs["Emission Strength"].default_value = 2.0
    ob.data.materials.append(m)

# ---------- anh sang + bau troi ----------
sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
sun.data.energy = 4.0; sun.data.angle = math.radians(1.5)
sun.rotation_euler = (math.radians(55), 0, math.radians(135))   # nang tu Tay Bac, giong hillshade
scn.collection.objects.link(sun)
world = bpy.data.worlds.new("MarsSky"); world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.55, 0.40, 0.30, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.35
scn.world = world

# ---------- camera nhin xien tu Tay Nam ----------
cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
cam.data.lens = 32; cam.data.clip_end = 20000
cam.location = (-560, -760, 260 + 12 * EXAG * 4)
target = bpy.data.objects.new("Target", None); target.location = (-60, 80, 6 * EXAG)
scn.collection.objects.link(target)
c = cam.constraints.new("TRACK_TO"); c.target = target; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
scn.collection.objects.link(cam); scn.camera = cam

# ---------- render ----------
scn.render.engine = "CYCLES"; scn.cycles.device = "CPU"; scn.cycles.samples = 24
scn.cycles.use_denoising = True
scn.render.resolution_x, scn.render.resolution_y = 1600, 900
scn.view_settings.view_transform = "AgX"
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(MODEL_DIR, "olympus_scene.blend"))
if RENDER:
    scn.render.filepath = os.path.join(MODEL_DIR, "olympus_render.png")
    bpy.ops.render.render(write_still=True)
print("done:", MODEL_DIR)
