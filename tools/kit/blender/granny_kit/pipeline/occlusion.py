import math
import os

import bpy
import numpy as np
from mathutils import Matrix

from . import cache, images, parts, progress
from .materials import BAKE_MARGIN, bake, unique_size
from .parts import UV_OCCLUSION, UV_ORIGINAL, columns_of, surface_area, uv_array

OCCLUSION_DISTANCE = 0.6
CAVITY_DISTANCE = 0.15
AO_NODE_SAMPLES = 16
RENDER_SAMPLES = 32
TEXELS_PER_METER = 200
PACKING_SLACK = 1.4
MIN_SIZE = 512
MIN_SEPARATE_SIZE = 128
PACKED_CHANNELS = {"roughness", "metallic"}
MAX_SIZE = 1024
BLUR_PASSES = 2
GRIME_VERSION = "grime-2"

CORRIDOR_HALF_WIDTH = 1.2
SEGMENT_LENGTH = 2.0
FLOOR_ROW_LENGTH = 2.505
SHELL_WALL = "wall_2m"

SIDE_HALF_WIDTH = 1.05
COLUMN_INSET = 0.1015
CORNER_LENGTH = 2.0
END_WALL_OFFSET = 0.05
SIDE_ROOF_OFFSET = 0.1455
DIVISION_HALF_LENGTH = 0.2015
CORNER_PIECES = {"column_corner", "column_corner__far", "column_narrow", "roof_corner", "wall_end", "floor_division"}
TILE_PIECES = ("floor_tile_1", "floor_tile_2")
TILES_ACROSS = 4
TILE_WIDTH = 0.425
TILE_LENGTH = 0.4
PAINTING_PREFIX = "painting_"
FLOOR_PROPS = {"square_table_set", "round_table_set", "chair", "round_table"}
CLOCK = "clock"
CLOCK_TABLE = "round_table"
COLUMN_LANTERN = "lantern"
CANDLE_SET_PREFIX = "candle_set_"
PAINTING_HEIGHT = 1.85
WALL_SURFACE = 0.05
SAFE_ROOM_PIECES = {"safe_room_half", "safe_room_doorway_wall", "safe_room_full_wall", "ceiling_lamp"}
SAFE_ROOM_EXTERIOR = "safe_room_exterior"
SAFE_ROOM_DOOR = "safe_room_door"
DOORLESS_SAFE_ROOM_PIECES = {"safe_room_half"}
SAFE_ROOM_DOOR_LINE = 2.05
END_DOOR_VARIANT = "__end"
TILED_CORRIDOR_LENGTH = 6.0
CONTEXT_PIECES = {"wall_2m", "roof", "drain", "floor", "floor_tile_1", "floor_tile_2"}
LAMP_PIECE = "ceiling_lamp"
LAMP_ANCHOR = "anchor_light_ceiling_lamp"
LAMP_RADIUS = 0.018
LAMP_POWER = 1000.0
LAMP_SAMPLES = 128
UNLIT = 1e-5
LAMP_VERSION = "lamp-1"

SETTINGS = (OCCLUSION_DISTANCE, CAVITY_DISTANCE, AO_NODE_SAMPLES, RENDER_SAMPLES, BLUR_PASSES, GRIME_VERSION)


def at(x, y=0.0, angle=0.0):
    return Matrix.Translation((x, y, 0)) @ Matrix.Rotation(angle, 4, "Z")


def piece_length(piece):
    xs = [
        (part.obj.matrix_basis @ vertex.co).x
        for part in piece.parts
        for vertex in part.obj.data.vertices
    ]
    return max(xs, default=0.0)


def piece_height(piece):
    zs = [
        (part.obj.matrix_basis @ vertex.co).z
        for part in piece.parts
        for vertex in part.obj.data.vertices
    ]
    return max(zs, default=0.0)


def corridor_shell(start, end, pieces):
    entries = []
    x = start
    while x < end - 1e-6:
        entries += [
            (SHELL_WALL, at(x, CORRIDOR_HALF_WIDTH)),
            (SHELL_WALL, at(x + SEGMENT_LENGTH, -CORRIDOR_HALF_WIDTH, math.pi)),
            ("roof", at(x)),
            ("drain", at(x, CORRIDOR_HALF_WIDTH)),
            ("drain", at(x + SEGMENT_LENGTH, -CORRIDOR_HALF_WIDTH, math.pi)),
        ]
        x += SEGMENT_LENGTH
    x = start - FLOOR_ROW_LENGTH
    while x < end:
        entries.append(("floor", at(x)))
        x += FLOOR_ROW_LENGTH
    return [entry for entry in entries if entry[0] in pieces]


def game(piece, x, z, rotation=0.0):
    return (piece, Matrix.Translation((x, -z, 0)) @ Matrix.Rotation(rotation, 4, "Z"))


def side_corridor(piece, along, across, rotation=0.0):
    origin_x, origin_z = CORNER_LENGTH / 2, CORRIDOR_HALF_WIDTH - COLUMN_INSET
    return game(piece, origin_x - across, origin_z + along, rotation - math.pi / 2)


def corner_scene():
    half = CORRIDOR_HALF_WIDTH
    entries = []
    for x in (-4.0, -2.0):
        entries += [
            game("wall_2m", x, -half), game("wall_2m", x + 2, half, math.pi), game("roof", x, 0),
            game("drain", x, -half), game("drain", x + 2, half, math.pi),
        ]
    entries += [
        game("column_corner", 0, half, math.pi), game("column_corner__far", CORNER_LENGTH, half, math.pi),
        game("column", 0, -half), game("column", CORNER_LENGTH, -half),
        game("wall_2m", 0, -half), game("drain", 0, -half),
        game("wall_end", CORNER_LENGTH + END_WALL_OFFSET, -half, -math.pi / 2),
        game("roof_corner", CORNER_LENGTH / 2, 0, math.pi),
        game("floor_division", CORNER_LENGTH / 2, half - COLUMN_INSET),
    ]
    x = -6.5
    while x < CORNER_LENGTH + 1.0:
        entries.append(game("floor", x, 0))
        x += FLOOR_ROW_LENGTH
    side = SIDE_HALF_WIDTH
    entries += [
        side_corridor("wall_4m", 0, -side), side_corridor("wall_4m", 4, side, math.pi),
        side_corridor("column_narrow", 4, -side), side_corridor("column_narrow", 4, side, math.pi),
        side_corridor("floor_division", 4, 0, math.pi / 2),
        side_corridor("wall_2m", 4, -side), side_corridor("wall_2m", 6, side, math.pi),
    ]
    entries += [side_corridor("roof", SIDE_ROOF_OFFSET + 2 * k, 0) for k in range(3)]
    for start, rows in ((DIVISION_HALF_LENGTH, 9), (4 + DIVISION_HALF_LENGTH, 5)):
        entries += [
            side_corridor(checker_tile(row, column), start + (row + 0.5) * TILE_LENGTH, tile_offset(column), math.pi / 2)
            for row in range(rows) for column in range(TILES_ACROSS)
        ]
    return entries


def checker_tile(row, column, first=TILE_PIECES[0], second=TILE_PIECES[1]):
    return first if (row + column) % 2 == 0 else second


def tile_offset(column):
    return (column - (TILES_ACROSS - 1) / 2) * TILE_WIDTH


def tile_recipe(name, pieces):
    other = next(p for p in TILE_PIECES if p != name)
    entries = [
        game(checker_tile(row, column, name, other), column * TILE_WIDTH, row * TILE_LENGTH)
        for row in (-1, 0, 1) for column in (-1, 0, 1)
    ]
    scene = [entry for entry in entries if entry[0] in pieces]
    index = next(i for i, entry in enumerate(scene) if same_matrix(entry[1], game(name, 0, 0)[1]))
    return scene[index][1], scene[:index] + scene[index + 1:]


def safe_room_scene(pieces):
    half_turn = at(0, 0, math.pi)
    entries = [
        ("safe_room_half", at(0)), ("safe_room_half", half_turn),
        ("safe_room_doorway_wall", at(0)), ("safe_room_doorway_wall", half_turn),
        (SAFE_ROOM_DOOR, at(0)), (SAFE_ROOM_DOOR, half_turn),
        ("ceiling_lamp", at(0)),
    ]
    return [entry for entry in entries if entry[0] in pieces]


def safe_room_recipe(name, pieces):
    scene = safe_room_scene(pieces)
    if name in DOORLESS_SAFE_ROOM_PIECES:
        scene = [entry for entry in scene if entry[0] != SAFE_ROOM_DOOR]
    if name == "safe_room_full_wall":
        far_side = at(0, 0, math.pi)
        far_door = ("safe_room_doorway_wall", SAFE_ROOM_DOOR)
        return at(0), [e for e in scene if not (e[0] in far_door and same_matrix(e[1], far_side))]
    index = next(i for i, entry in enumerate(scene) if entry[0] == name)
    return scene[index][1], scene[:index] + scene[index + 1:]


def first_corridor_shell(pieces):
    shell = corridor_shell(0, 3 * SEGMENT_LENGTH, pieces)
    return [e for e in shell if not (e[0] == "floor" and e[1].translation.x < 0)]


def tiled_corridor_shell(pieces):
    half = SIDE_HALF_WIDTH
    segments = int(TILED_CORRIDOR_LENGTH / SEGMENT_LENGTH)
    entries = []
    for k in range(segments):
        x = k * SEGMENT_LENGTH
        entries += [(SHELL_WALL, at(x, half)), (SHELL_WALL, at(x + SEGMENT_LENGTH, -half, math.pi))]
        entries.append(("roof", at(x - SIDE_ROOF_OFFSET)))
    rows = round(TILED_CORRIDOR_LENGTH / TILE_LENGTH)
    entries += [
        (checker_tile(row, column), at((row + 0.5) * TILE_LENGTH, tile_offset(column), math.pi / 2))
        for row in range(rows) for column in range(TILES_ACROSS)
    ]
    return [entry for entry in entries if entry[0] in pieces]


def safe_room_exterior_recipe(name, pieces):
    room_side = [(n, at(0)) for n in ("safe_room_doorway_wall", SAFE_ROOM_DOOR) if n in pieces]
    to_corridor = Matrix.Translation((0, -SAFE_ROOM_DOOR_LINE, 0)) @ Matrix.Rotation(-math.pi / 2, 4, "Z")
    shell = tiled_corridor_shell(pieces) if name.endswith(END_DOOR_VARIANT) else first_corridor_shell(pieces)
    return at(0), room_side + [(piece, to_corridor @ matrix) for piece, matrix in shell]


def corner_recipe(name, pieces):
    scene = [entry for entry in corner_scene() if entry[0] in pieces]
    index = next(i for i, entry in enumerate(scene) if entry[0] == name)
    return scene[index][1], scene[:index] + scene[index + 1:]


def floor_under_prop(pieces):
    return [("floor", at(x)) for x in (-FLOOR_ROW_LENGTH, 0.0) if "floor" in pieces]


def recipe(name, pieces):
    if name.startswith(SAFE_ROOM_EXTERIOR):
        return safe_room_exterior_recipe(name, pieces)
    if name in SAFE_ROOM_PIECES:
        return safe_room_recipe(name, pieces)
    if name in FLOOR_PROPS:
        return at(0), floor_under_prop(pieces)
    if name.startswith(CLOCK) and CLOCK_TABLE in pieces:
        on_table = Matrix.Translation((0, 0, piece_height(pieces[CLOCK_TABLE])))
        return on_table, [(CLOCK_TABLE, at(0))] if name == CLOCK else []
    if name.startswith(CANDLE_SET_PREFIX):
        columns = [("column", at(x, side * CORRIDOR_HALF_WIDTH, angle)) for x in (0.0, SEGMENT_LENGTH) for side, angle in ((1, 0.0), (-1, math.pi))]
        return at(0), corridor_shell(-SEGMENT_LENGTH, 2 * SEGMENT_LENGTH, pieces) + [c for c in columns if c[0] in pieces]
    if name == COLUMN_LANTERN:
        target = at(0, CORRIDOR_HALF_WIDTH)
        return target, corridor_shell(-SEGMENT_LENGTH, SEGMENT_LENGTH, pieces) + [("column", target)]
    if name in CORNER_PIECES:
        return corner_recipe(name, pieces)
    if name in TILE_PIECES:
        return tile_recipe(name, pieces)
    if name.startswith(PAINTING_PREFIX):
        target = Matrix.Translation((SEGMENT_LENGTH, CORRIDOR_HALF_WIDTH - WALL_SURFACE, PAINTING_HEIGHT))
        return target, corridor_shell(0, 2 * SEGMENT_LENGTH, pieces)
    if name == "door_frame":
        return at(0, 0, math.pi / 2), corridor_shell(0, 2 * SEGMENT_LENGTH, pieces)
    if name.startswith("wall"):
        length = piece_length(pieces[name])
        target = at(0, CORRIDOR_HALF_WIDTH)
        shell = corridor_shell(-SEGMENT_LENGTH, length + SEGMENT_LENGTH, pieces)
        shell = [e for e in shell if not (e[0] == SHELL_WALL and e[1].translation.y > 0 and 0 <= e[1].translation.x < length)]
        at_start, at_end = columns_of(name)
        joints = [x for x, wanted in ((0.0, at_start), (length, at_end)) if wanted]
        columns = [("column", at(x, side * CORRIDOR_HALF_WIDTH, angle)) for x in joints for side, angle in ((1, 0.0), (-1, math.pi))]
        return target, shell + [c for c in columns if c[0] in pieces]
    if name == "column":
        return at(0, CORRIDOR_HALF_WIDTH), corridor_shell(-SEGMENT_LENGTH, SEGMENT_LENGTH, pieces)
    if name == "door":
        return at(0, 0, math.pi / 2), corridor_shell(0, 2 * SEGMENT_LENGTH, pieces)
    if name == "floor":
        shell = [e for e in corridor_shell(-SEGMENT_LENGTH, 2 * SEGMENT_LENGTH, pieces) if e[0] != "floor"]
        rows = [("floor", at(offset)) for offset in (-FLOOR_ROW_LENGTH, FLOOR_ROW_LENGTH)]
        return at(0), shell + rows
    if name in ("roof", "drain"):
        target = at(0, CORRIDOR_HALF_WIDTH) if name == "drain" else at(0)
        shell = corridor_shell(-SEGMENT_LENGTH, 2 * SEGMENT_LENGTH, pieces)
        return target, [e for e in shell if not (e[0] == name and same_matrix(e[1], target))]
    return at(0), []


def roughness_texture_sizes(piece, analyses):
    unique_parts = [part for part in piece.parts if part.unique]
    unique_materials = [m for part in unique_parts for m in part.sources if m and not analyses[m].tileable]
    sizes = set()
    for part in piece.parts:
        for m in part.sources:
            if m is None or m not in analyses or not PACKED_CHANNELS & analyses[m].needs:
                continue
            sizes.add(unique_size(unique_parts, unique_materials) if part.unique else analyses[m].size)
    return sizes


def apart_from(size, taken):
    while size in taken and size > MIN_SEPARATE_SIZE:
        size //= 2
    return size


def lamp_position(name, pieces):
    if name not in SAFE_ROOM_PIECES or LAMP_PIECE not in pieces:
        return None
    anchor = next((a for a in pieces[LAMP_PIECE].anchors if a.name.endswith(LAMP_ANCHOR)), None)
    return None if anchor is None else anchor.matrix_basis.translation.copy()


def lamp_material():
    material = bpy.data.materials.new("_granny_lamp")
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    diffuse = nodes.new("ShaderNodeBsdfDiffuse")
    diffuse.inputs["Color"].default_value = (1, 1, 1, 1)
    links.new(diffuse.outputs[0], out.inputs["Surface"])
    image_node = nodes.new("ShaderNodeTexImage")
    nodes.active = image_node
    return material, image_node


def direct_light(targets, image):
    bpy.context.scene.cycles.samples = LAMP_SAMPLES
    for obj in bpy.context.selected_objects:
        obj.select_set(False)
    for obj in targets:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = targets[0]
    bpy.ops.object.bake(
        type="DIFFUSE", pass_filter={"DIRECT"}, margin=BAKE_MARGIN, margin_type="ADJACENT_FACES",
        use_clear=True, target="IMAGE_TEXTURES", save_mode="INTERNAL",
    )
    return images.pixels(image)[..., :3].mean(-1)


def lamp_visibility(targets, others, position, size, collection):
    scene = bpy.context.scene
    world = scene.world
    material, image_node = lamp_material()
    image = images.new_bake_image("_granny_lamp", size)
    image_node.image = image
    light = bpy.data.lights.new("_granny_lamp", "POINT")
    light.energy = LAMP_POWER
    light.shadow_soft_size = LAMP_RADIUS
    lamp = bpy.data.objects.new("_granny_lamp", light)
    collection.objects.link(lamp)
    lamp.location = position
    placed = targets + others
    try:
        scene.world = None
        for obj in placed:
            for slot in obj.material_slots:
                slot.material = material
        shadowed = direct_light(targets, image)
        for obj in placed:
            obj.visible_shadow = False
        unshadowed = direct_light(targets, image)
    finally:
        scene.world = world
        bpy.data.objects.remove(lamp)
        bpy.data.lights.remove(light)
        bpy.data.images.remove(image)
        bpy.data.materials.remove(material)
    lit = unshadowed > UNLIT
    return np.where(lit, np.clip(shadowed / np.where(lit, unshadowed, 1), 0, 1), 1)


def same_matrix(a, b):
    return all(abs(x - y) < 1e-4 for row_a, row_b in zip(a, b) for x, y in zip(row_a, row_b))


def atlas_size(piece):
    if piece.occlusion_size:
        return piece.occlusion_size
    area = sum(surface_area(mesh) for mesh in piece.meshes)
    wanted = math.sqrt(area) * TEXELS_PER_METER * PACKING_SLACK
    size = int(min(MAX_SIZE, max(MIN_SIZE, 2 ** math.ceil(math.log2(max(1, wanted))))))
    return MAX_SIZE if piece.pack_uv else size


def unwrap(piece, size):
    objects = [part.obj for part in piece.parts]
    if piece.pack_uv:
        parts.repack(objects, UV_OCCLUSION, UV_ORIGINAL, size)
    else:
        parts.unwrap(objects, UV_OCCLUSION, size)


def save_uvs(path, piece):
    parts.save_uvs(path, piece.parts, UV_OCCLUSION)


def load_uvs(path, piece):
    return parts.load_uvs(path, piece.parts, UV_OCCLUSION)


def occlusion_material():
    material = bpy.data.materials.new("_granny_occlusion")
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    nodes.clear()

    def math_node(operation, a, b=None, c=None, clamp=False):
        node = nodes.new("ShaderNodeMath")
        node.operation = operation
        node.use_clamp = clamp
        for index, value in enumerate((a, b, c)):
            if value is None:
                continue
            if isinstance(value, (int, float)):
                node.inputs[index].default_value = value
            else:
                links.new(value, node.inputs[index])
        return node.outputs[0]

    def occlusion(distance):
        node = nodes.new("ShaderNodeAmbientOcclusion")
        node.samples = AO_NODE_SAMPLES
        node.only_local = False
        node.inputs["Distance"].default_value = distance
        return node.outputs["AO"]

    def remap(value, from_min, from_max, to_min, to_max):
        node = nodes.new("ShaderNodeMapRange")
        node.interpolation_type = "SMOOTHSTEP"
        node.clamp = True
        links.new(value, node.inputs["Value"])
        for name, number in (("From Min", from_min), ("From Max", from_max), ("To Min", to_min), ("To Max", to_max)):
            node.inputs[name].default_value = number
        return node.outputs["Result"]

    def noise(position, scale, detail):
        node = nodes.new("ShaderNodeTexNoise")
        links.new(position, node.inputs["Vector"])
        node.inputs["Scale"].default_value = scale
        node.inputs["Detail"].default_value = detail
        node.inputs["Roughness"].default_value = 0.6
        return node.outputs["Fac"]

    out = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    links.new(emission.outputs[0], out.inputs["Surface"])
    geometry = nodes.new("ShaderNodeNewGeometry")
    position = nodes.new("ShaderNodeSeparateXYZ")
    links.new(geometry.outputs["Position"], position.inputs[0])
    normal = nodes.new("ShaderNodeSeparateXYZ")
    links.new(geometry.outputs["Normal"], normal.inputs[0])

    cavity = math_node("MULTIPLY", math_node("SUBTRACT", 1.0, occlusion(CAVITY_DISTANCE)), 2.0, clamp=True)
    near_floor = remap(position.outputs["Z"], 0.0, 0.6, 1.0, 0.0)
    facing_up = math_node("MAXIMUM", normal.outputs["Z"], 0.0)
    dirt = math_node("MULTIPLY_ADD", facing_up, 0.25, math_node("MULTIPLY_ADD", near_floor, 0.6, math_node("MULTIPLY", cavity, 0.8)))
    speckle = remap(noise(geometry.outputs["Position"], 6.0, 8.0), 0.35, 0.75, 0.0, 1.0)
    patches = remap(noise(geometry.outputs["Position"], 0.6, 2.0), 0.4, 0.65, 0.35, 1.0)
    grime = math_node("MULTIPLY", math_node("MULTIPLY", dirt, speckle), patches, clamp=True)

    combine = nodes.new("ShaderNodeCombineColor")
    links.new(occlusion(OCCLUSION_DISTANCE), combine.inputs["Red"])
    links.new(grime, combine.inputs["Green"])
    links.new(combine.outputs[0], emission.inputs["Color"])
    image_node = nodes.new("ShaderNodeTexImage")
    nodes.active = image_node
    return material, image_node


def place(entries, pieces, collection, material):
    placed = []
    for name, matrix in entries:
        for part in pieces[name].parts:
            obj = bpy.data.objects.new("_granny_context", part.obj.data)
            collection.objects.link(obj)
            obj.matrix_world = matrix @ part.obj.matrix_basis
            for slot in obj.material_slots:
                slot.link = "OBJECT"
                slot.material = material
            placed.append(obj)
    return placed


def bake_all(pieces, context, analyses, cache_dir, force, on_progress):
    scene = bpy.context.scene
    for obj in scene.objects:
        obj.hide_render = True
    collection = bpy.data.collections.new("_granny_context")
    scene.collection.children.link(collection)
    material, image_node = occlusion_material()
    pool = {**context, **pieces}
    signatures = {name: cache.mesh_signature(piece.meshes) for name, piece in pool.items()}
    results = {}
    try:
        for index, name in enumerate(sorted(pieces)):
            on_progress(index / len(pieces), f"Occlusion and grime: {name}")
            results[name] = bake_piece(
                name, pool, signatures, cache_dir, force, collection, material, image_node, analyses
            )
    finally:
        for obj in list(collection.objects):
            bpy.data.objects.remove(obj)
        bpy.data.collections.remove(collection)
        bpy.data.materials.remove(material)
        for obj in scene.objects:
            obj.hide_render = False
    return results


def bake_piece(name, pieces, signatures, cache_dir, force, collection, material, image_node, analyses):
    piece = pieces[name]
    target, neighbors = recipe(name, pieces)
    size = apart_from(atlas_size(piece), roughness_texture_sizes(piece, analyses))
    layout = [(entry, [round(v, 4) for row in matrix for v in row]) for entry, matrix in neighbors]
    lamp = lamp_position(name, pieces)
    lamp_key = None if lamp is None else ([round(v, 4) for v in lamp], LAMP_RADIUS, LAMP_SAMPLES, LAMP_VERSION)
    key = cache.digest(
        signatures[name], sorted((n, signatures[n]) for n in {e for e, _ in neighbors}), size, SETTINGS, layout,
        piece.pack_uv, *([lamp_key] if lamp_key else []),
    )
    directory = os.path.join(cache_dir, "occlusion", f"{name}_{key}")
    png = os.path.join(directory, f"{name}_occlusion.png")
    uvs = os.path.join(directory, "uvs.npz")
    if piece.uv_owner:
        key = cache.digest(key, *(uv_array(part.obj.data.uv_layers[UV_OCCLUSION]).tobytes() for part in piece.parts))
        directory = os.path.join(cache_dir, "occlusion", f"{name}_{key}")
        png = os.path.join(directory, f"{name}_occlusion.png")
        if not force and os.path.exists(png):
            return png
    elif not force and os.path.exists(png) and load_uvs(uvs, piece):
        return png
    else:
        unwrap(piece, size)
    image = images.new_bake_image("_granny_occlusion", size)
    image_node.image = image
    targets = place([(name, target)], pieces, collection, material)
    others = place(neighbors, pieces, collection, material)
    try:
        for part in piece.parts:
            part.obj.data.uv_layers.active = part.obj.data.uv_layers[UV_OCCLUSION]
        bake(targets, "EMIT", RENDER_SAMPLES)
        data = images.box_blur(images.pixels(image), BLUR_PASSES)
        lit = np.zeros(data.shape[:2])
        if lamp is not None:
            visibility = lamp_visibility(targets, others, lamp, size, collection)
            lit = images.box_blur(visibility[..., None], BLUR_PASSES)[..., 0]
        rgb = np.stack([data[..., 0], data[..., 1], lit], -1)
        images.save_png(png, rgb, "Non-Color")
        if not piece.uv_owner:
            save_uvs(uvs, piece)
    finally:
        for obj in targets + others:
            bpy.data.objects.remove(obj)
        bpy.data.images.remove(image)
    lamp_note = ", lamp shadows" if lamp is not None else ""
    progress.detail(f"{name}: {size}px occlusion{lamp_note}, {len(others)} neighbor parts")
    return png
