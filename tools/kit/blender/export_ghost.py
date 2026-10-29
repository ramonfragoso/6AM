"""Export the rigged ghost (made by rig_ghost.py) as a skinned, animated glTF.

    blender <rigged.blend> --background --factory-startup --python-exit-code 1 \
        --python tools/kit/blender/export_ghost.py -- '{"output": "<raw.glb>", "work_dir": "<dir>"}'
    npm run kit:compress -- <raw.glb> public/models/ghost.glb

Works on the open file without saving it. The rig goes to the origin, facing +Z
in the game. The body's material (a flat skin image mixed with cyan, plus a
procedural bump) becomes its flat color, since glTF has no Mix node; the eyes
keep their color; the two decals keep their images, scaled to powers of two
because WebGPU needs compressed textures in whole 4 px blocks. The clips are the
rig's NLA tracks (`idle`, `walk`), sampled at the scene's 60 fps.
"""

import json
import math
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Matrix

RIG = "ghost_rig"
MESH = "ghost"
CLIP_FPS = 60
MATERIAL_NAMES = ["ghost_body", "ghost_eyes", "ghost_decal_1", "ghost_decal_2"]
DECAL_SIZE_LIMIT = 512


def main(options):
    scene = bpy.context.scene
    scene.render.fps = CLIP_FPS
    scene.render.fps_base = 1
    rig = bpy.data.objects[RIG]
    mesh = bpy.data.objects[MESH]
    rig.matrix_world = Matrix.Identity(4)
    rig.animation_data.action = None
    rig.data.pose_position = "POSE"
    work = Path(options["work_dir"])
    work.mkdir(parents=True, exist_ok=True)

    slots = mesh.data.materials
    replaced = [
        flat_material(MATERIAL_NAMES[0], body_color(slots[0])),
        flat_material(MATERIAL_NAMES[1], principled(slots[1]).inputs["Base Color"].default_value),
        decal_material(MATERIAL_NAMES[2], slots[2], work),
        decal_material(MATERIAL_NAMES[3], slots[3], work),
    ]
    for index, material in enumerate(replaced):
        slots[index] = material

    for obj in bpy.context.selected_objects:
        obj.select_set(False)
    for obj in (rig, mesh):
        obj.hide_set(False)
        obj.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(
        filepath=options["output"],
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_tangents=False,
        export_vertex_color="NONE",
        export_attributes=False,
        export_extras=False,
        export_skins=True,
        export_all_influences=False,
        export_morph=False,
        export_animations=True,
        export_animation_mode="NLA_TRACKS",
        export_force_sampling=True,
        export_frame_step=1,
        export_optimize_animation_size=True,
        export_reset_pose_bones=True,
        export_image_format="AUTO",
    )
    print("GHOST exported", options["output"])


def principled(material):
    return next(node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED")


def body_color(material):
    nodes = material.node_tree.nodes
    mix = nodes["Mix"]
    image = nodes["Image Texture"].image
    pixels = np.array(image.pixels[:]).reshape(-1, image.channels)
    skin = [srgb_to_linear(value) for value in pixels[:, :3].mean(0)]
    tint = socket(mix, "B_Color").default_value
    share = socket(mix, "Factor_Float").default_value
    return [skin[channel] * (1 - share) + tint[channel] * share for channel in range(3)] + [1]


def socket(node, identifier):
    return next(entry for entry in node.inputs if entry.identifier == identifier)


def flat_material(name, color):
    material = fresh_material(name)
    principled(material).inputs["Base Color"].default_value = tuple(color)
    return material


def decal_material(name, source, work):
    image = principled(source).inputs["Base Color"].links[0].from_node.image
    scaled = image.copy()
    scaled.name = name
    width, height = (power_of_two(size) for size in image.size)
    scaled.scale(width, height)
    path = work / f"{name}.png"
    scaled.filepath_raw = str(path)
    scaled.file_format = "PNG"
    scaled.save()
    material = fresh_material(name)
    material.surface_render_method = "BLENDED"
    tree = material.node_tree
    texture = tree.nodes.new("ShaderNodeTexImage")
    texture.image = scaled
    texture.extension = "CLIP"
    shader = principled(material)
    tree.links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    tree.links.new(texture.outputs["Alpha"], shader.inputs["Alpha"])
    return material


def fresh_material(name):
    old = bpy.data.materials.get(name)
    if old:
        bpy.data.materials.remove(old)
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    return material


def power_of_two(size):
    return min(2 ** round(math.log2(size)), DECAL_SIZE_LIMIT)


def srgb_to_linear(value):
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def options_from_argv():
    arguments = sys.argv[sys.argv.index("--") + 1 :]
    return json.loads(arguments[0])


main(options_from_argv())
