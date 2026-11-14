"""
Render anh 360 (equirectangular) tu canh olympus_scene.blend.
  blender -b -P blender_pano.py -- model3d <x_km> <y_km> <z_m_mat_dat> <do_cao_mat_m> <ten> [exag]
vd: blender -b -P blender_pano.py -- model3d -283.2 75.9 -1364 1500 plain_west 2
"""
import math, os, sys
import bpy

a = sys.argv[sys.argv.index("--") + 1:]
D = os.path.abspath(a[0]); X, Y, ZG, H = map(float, a[1:5]); NAME = a[5]; EXAG = float(a[6]) if len(a) > 6 else 2.0
bpy.ops.wm.open_mainfile(filepath=os.path.join(D, "olympus_scene.blend"))
scn = bpy.context.scene
old = bpy.data.objects["OlympusMons"].scale[2]
bpy.data.objects["OlympusMons"].scale[2] = EXAG
for ob in bpy.data.objects:
    if ob.name.startswith("route_"):
        ob.scale[2] = EXAG / old          
scn.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
cam = scn.camera
for c in list(cam.constraints): cam.constraints.remove(c)
cam.data.type = "PANO"
cam.data.panorama_type = "EQUIRECTANGULAR"
cam.data.clip_start = 0.05
cam.location = (X, Y, ZG / 1000 * EXAG + H / 1000)
cam.rotation_euler = (math.radians(90), 0, math.radians(-90))   
scn.render.resolution_x, scn.render.resolution_y = 4096, 2048
scn.cycles.samples = 32
scn.render.image_settings.file_format = "JPEG"; scn.render.image_settings.quality = 88
scn.render.filepath = os.path.join(D, f"pano_{NAME}.jpg")
bpy.ops.render.render(write_still=True)
print("saved", scn.render.filepath)
