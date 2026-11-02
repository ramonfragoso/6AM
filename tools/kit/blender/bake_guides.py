import json
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

PAPER = "paper_plane"
PAPER_COLOR_NODE = "Image Texture.001"
TEXT = "guide_text"
GUIDE_IMAGE = "guide"
HAUNT_COUNT_IMAGE = "haunts_left_{count}"
GUIDE_CANVAS_WIDTH = 0.6
GUIDE_CANVAS_HEIGHT = 0.7655990719795227
SIDE_MARGIN = 0.2
HAUNT_COUNT_SIDE_MARGIN = 0.3
HAUNT_COUNT_MARGIN = 0.3
INK_COLOR = (0.019, 0.011, 0.008, 1.0)
LONG_SIDE_PIXELS = 2048
SAMPLES = 16
PIXEL_FILTER = 1.2
CAMERA_DISTANCE = 5.0
PAPER_COVER = 1.2
BAKE_SCENE = "guide_bake"


def settings_from_arguments():
    arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if not arguments:
        raise SystemExit("Usage: blender <copy.blend> --background --python bake_guides.py -- <settings.json>")
    return json.loads(arguments[0])


def haunt_count_text(count):
    if count == 1:
        return "There is 1 haunt\nthat you have not found."
    return f"There are {count} haunts\nthat you have not found."


def emission_material(name, color_socket_of=None, color=None):
    material = bpy.data.materials.new(name)
    tree = material.node_tree
    tree.nodes.clear()
    output = tree.nodes.new("ShaderNodeOutputMaterial")
    emission = tree.nodes.new("ShaderNodeEmission")
    tree.links.new(emission.outputs["Emission"], output.inputs["Surface"])
    if color is not None:
        emission.inputs["Color"].default_value = color
    if color_socket_of is not None:
        color_socket_of(tree, emission.inputs["Color"])
    return material


def paper_color_from(source):
    def connect(tree, target):
        original = source.node_tree.nodes[PAPER_COLOR_NODE]
        image = tree.nodes.new("ShaderNodeTexImage")
        image.image = original.image
        image.interpolation = original.interpolation
        image.extension = "REPEAT"
        coordinates = tree.nodes.new("ShaderNodeTexCoord")
        tree.links.new(coordinates.outputs["UV"], image.inputs["Vector"])
        tree.links.new(image.outputs["Color"], target)

    return connect


def bake_scene():
    scene = bpy.data.scenes.new(BAKE_SCENE)
    scene.render.engine = "CYCLES"
    scene.cycles.samples = SAMPLES
    scene.cycles.use_denoising = False
    scene.cycles.max_bounces = 0
    scene.cycles.filter_width = PIXEL_FILTER
    scene.cycles.device = "CPU"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    scene.display_settings.display_device = "sRGB"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    return scene


def render(scene, camera, paper, center, width, height, path):
    camera.data.ortho_scale = width
    camera.location = (center.x, center.y - CAMERA_DISTANCE, center.z)
    scale = PAPER_COVER * max(width, height) / 2
    paper.matrix_world = Matrix.LocRotScale(
        Vector((center.x, paper.matrix_world.translation.y, center.z)),
        paper.matrix_world.to_quaternion(),
        Vector((scale, scale, scale)),
    )
    if width >= height:
        scene.render.resolution_x = LONG_SIDE_PIXELS
        scene.render.resolution_y = round(LONG_SIDE_PIXELS * height / width)
    else:
        scene.render.resolution_y = LONG_SIDE_PIXELS
        scene.render.resolution_x = round(LONG_SIDE_PIXELS * width / height)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True, scene=scene.name)


def main():
    settings = settings_from_arguments()
    output_dir = settings["output_dir"]
    most = settings["most"]
    os.makedirs(output_dir, exist_ok=True)

    source_paper = bpy.data.objects[PAPER]
    source_text = bpy.data.objects[TEXT]
    scene = bake_scene()

    paper = source_paper.copy()
    scene.collection.objects.link(paper)
    paper.matrix_world = Matrix.LocRotScale(
        source_paper.matrix_world.translation, source_paper.matrix_world.to_quaternion(), Vector((1, 1, 1))
    )
    paper.material_slots[0].link = "OBJECT"
    paper.material_slots[0].material = emission_material(
        "guide_bake_paper", color_socket_of=paper_color_from(source_paper.material_slots[0].material)
    )

    text = source_text.copy()
    text.data = source_text.data.copy()
    text.data.materials.clear()
    text.data.materials.append(emission_material("guide_bake_ink", color=INK_COLOR))
    scene.collection.objects.link(text)

    camera = bpy.data.objects.new("guide_bake_camera", bpy.data.cameras.new("guide_bake_camera"))
    camera.data.type = "ORTHO"
    camera.data.sensor_fit = "HORIZONTAL"
    camera.rotation_euler = (math.pi / 2, 0, 0)
    scene.collection.objects.link(camera)
    scene.camera = camera

    view_layer = scene.view_layers[0]

    def bounds():
        text.data.update_tag()
        view_layer.update()
        depsgraph = view_layer.depsgraph
        evaluated = text.evaluated_get(depsgraph)
        corners = [evaluated.matrix_world @ Vector(corner) for corner in evaluated.bound_box]
        low = Vector([min(c[axis] for c in corners) for axis in range(3)])
        high = Vector([max(c[axis] for c in corners) for axis in range(3)])
        return low, high

    low, high = bounds()
    guide_width = (high.x - low.x) + 2 * SIDE_MARGIN
    guide_height = guide_width * GUIDE_CANVAS_HEIGHT / GUIDE_CANVAS_WIDTH
    meters_per_unit = GUIDE_CANVAS_WIDTH / guide_width
    center = (low + high) / 2
    render(scene, camera, paper, center, guide_width, guide_height, os.path.join(output_dir, f"{GUIDE_IMAGE}.png"))

    widest = None
    for count in range(1, most + 1):
        text.data.body = haunt_count_text(count)
        low, high = bounds()
        size = high - low
        widest = size if widest is None else Vector([max(widest[i], size[i]) for i in range(3)])
    count_width = widest.x + 2 * HAUNT_COUNT_SIDE_MARGIN
    count_height = widest.z + 2 * HAUNT_COUNT_MARGIN
    for count in range(1, most + 1):
        text.data.body = haunt_count_text(count)
        low, high = bounds()
        path = os.path.join(output_dir, f"{HAUNT_COUNT_IMAGE.format(count=count)}.png")
        render(scene, camera, paper, (low + high) / 2, count_width, count_height, path)

    sizes = {
        "guide": {"width": GUIDE_CANVAS_WIDTH, "height": GUIDE_CANVAS_HEIGHT},
        "haunt_count": {"width": count_width * meters_per_unit, "height": count_height * meters_per_unit},
    }
    with open(os.path.join(output_dir, "guide_sizes.json"), "w") as file:
        json.dump(sizes, file, indent=2)
    print("GUIDE_SIZES", json.dumps(sizes))


main()
