import math
import os
import re
from dataclasses import dataclass, field

import bmesh
import bpy
import numpy as np
from mathutils import Matrix

from . import progress

PREFAB_PREFIX = "prefab_"
CONTEXT_ONLY_PROPERTY = "granny_context_only"
OCCLUSION_SIZE_PROPERTY = "granny_occlusion_size"
ANCHOR_PREFIX = "anchor_"
ANCHOR_SEPARATOR = "__"
EXPORT_PREFIX = "kit_"
UV_MAPPED = "UVMap"
UV_ORIGINAL = "UVorig"
UV_OCCLUSION = "AO"
UV_UNIQUE = "Unique"
SMART_PROJECT_ANGLE = math.radians(66)
ISLAND_MARGIN = 0.02
PACK_MARGIN_PIXELS = 8
REPACK_MARGIN_PIXELS = 4
PACK_ATTEMPTS = 3
PACK_TOLERANCE = 0.001
VARIANT_SEPARATOR = "__"
COLUMN_VARIANTS = {"col_start": (True, False), "col_end": (False, True), "col_both": (True, True)}
PLACED_WALL_VARIANTS = {
    "wall_2m": ("col_both",),
    "wall_4m": ("col_start", "col_end", "col_both"),
    "wall_6m": ("col_start", "col_end", "col_both"),
}
PLACEMENT_VARIANTS = {"column_corner": ("far",), "safe_room_exterior": ("end",)}
WALL_PATTERN = re.compile(r"wall_\d+m$")
PLACEHOLDER_MATERIAL = "_granny_unassigned"
PLACEHOLDER_COLOR = (0.5, 0.5, 0.5, 1.0)
PLACEHOLDER_ROUGHNESS = 0.8


@dataclass
class Part:
    piece: str
    name: str
    obj: bpy.types.Object
    sources: list
    unique: bool = False


@dataclass
class Piece:
    name: str
    root: bpy.types.Object
    parts: list = field(default_factory=list)
    anchors: list = field(default_factory=list)
    uv_owner: str = None
    pack_uv: bool = False
    context_only: bool = False
    occlusion_size: int = 0

    @property
    def meshes(self):
        return [part.obj.data for part in self.parts]


def prefab_roots(collection_name):
    collection = bpy.data.collections[collection_name]
    roots = [o for o in collection.all_objects if o.name.startswith(PREFAB_PREFIX)]
    return sorted(roots, key=lambda o: o.name)


def descendants(obj):
    for child in sorted(obj.children, key=lambda o: o.name):
        if child.name.startswith(PREFAB_PREFIX):
            continue
        yield child
        yield from descendants(child)


def build_pieces(collection_name, export_collection, mapping_of, only=None):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    kit_objects = set(bpy.data.collections[collection_name].all_objects)
    pieces = {}
    for root in prefab_roots(collection_name):
        name = root.name[len(PREFAB_PREFIX):]
        if only is not None and name not in only:
            continue
        members = [o for o in descendants(root) if o in kit_objects]
        meshes = [o for o in members if o.type == "MESH"]
        if not meshes:
            progress.warn(f"{root.name}: skipped, it has no mesh parts")
            continue
        export_root = bpy.data.objects.new(EXPORT_PREFIX + name, None)
        export_collection.objects.link(export_root)
        piece = Piece(
            name, export_root, context_only=bool(root.get(CONTEXT_ONLY_PROPERTY, False)),
            occlusion_size=int(root.get(OCCLUSION_SIZE_PROPERTY, 0)),
        )
        to_root = root.matrix_world.inverted()
        for source in meshes:
            piece.parts.append(
                export_part(name, source, to_root, depsgraph, export_collection, export_root, mapping_of)
            )
        for source in (o for o in members if o.type == "EMPTY" and o.name.startswith(ANCHOR_PREFIX)):
            piece.anchors.append(export_anchor(name, source, to_root, export_collection, export_root))
        pieces[name] = piece
    return pieces


def export_anchor(piece, source, to_root, collection, export_root):
    anchor = bpy.data.objects.new(f"{EXPORT_PREFIX}{piece}{ANCHOR_SEPARATOR}{source.name}", None)
    collection.objects.link(anchor)
    anchor.parent = export_root
    anchor.matrix_parent_inverse = Matrix.Identity(4)
    anchor.matrix_basis = to_root @ source.matrix_world
    return anchor


def export_part(piece, source, to_root, depsgraph, collection, export_root, mapping_of):
    loc, rot, scale = (to_root @ source.matrix_world).decompose()
    mesh = bpy.data.meshes.new_from_object(
        source.evaluated_get(depsgraph), preserve_all_data_layers=True, depsgraph=depsgraph
    )
    name = f"{EXPORT_PREFIX}{piece}_{source.name}"
    mesh.name = name
    if not np.allclose(tuple(scale), 1, atol=1e-4):
        mesh.transform(Matrix.Diagonal((*scale, 1)))
        if np.prod(tuple(scale)) < 0:
            mesh.flip_normals()
    triangulate(mesh)
    evaluated = source.evaluated_get(depsgraph)
    sources = [slot.material or placeholder_material() for slot in evaluated.material_slots]
    sources = sources or [placeholder_material()]
    material_indices = np.zeros(len(mesh.polygons), np.int32)
    mesh.polygons.foreach_get("material_index", material_indices)
    mesh.materials.clear()
    for material in sources:
        mesh.materials.append(material)
    mesh.polygons.foreach_set("material_index", material_indices)
    prepare_uvs(mesh, sources, mapping_of)
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.parent = export_root
    obj.matrix_parent_inverse = Matrix.Identity(4)
    obj.matrix_basis = Matrix.LocRotScale(loc, rot, None)
    return Part(piece, source.name, obj, sources)


def placeholder_material():
    material = bpy.data.materials.get(PLACEHOLDER_MATERIAL)
    if material:
        return material
    material = bpy.data.materials.new(PLACEHOLDER_MATERIAL)
    material.use_nodes = True
    principled = next(n for n in material.node_tree.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled")
    principled.inputs["Base Color"].default_value = PLACEHOLDER_COLOR
    principled.inputs["Roughness"].default_value = PLACEHOLDER_ROUGHNESS
    return material


def triangulate(mesh):
    b = bmesh.new()
    b.from_mesh(mesh)
    bmesh.ops.triangulate(b, faces=b.faces[:], quad_method="BEAUTY", ngon_method="BEAUTY")
    b.to_mesh(mesh)
    b.free()


def uv_array(layer):
    data = np.empty(len(layer.data) * 2, np.float32)
    layer.data.foreach_get("uv", data)
    return data.reshape(-1, 2)


def prepare_uvs(mesh, sources, mapping_of):
    render_layer = next((u for u in mesh.uv_layers if u.active_render), mesh.uv_layers[0] if mesh.uv_layers else None)
    default_name = render_layer.name if render_layer else None
    layers = {u.name: uv_array(u) for u in mesh.uv_layers}
    empty = np.zeros((len(mesh.loops), 2), np.float32)
    mappings = [mapping_of(m) if m else (np.identity(4), None) for m in sources]
    original = empty.copy()
    mapped = empty.copy()
    for polygon in mesh.polygons:
        matrix, uv_name = mappings[polygon.material_index] if mappings else (np.identity(4), None)
        source = layers.get(uv_name or default_name, empty)
        loops = slice(polygon.loop_start, polygon.loop_start + polygon.loop_total)
        uv = source[loops]
        points = np.c_[uv, np.zeros(len(uv)), np.ones(len(uv))]
        original[loops] = uv
        mapped[loops] = (points @ matrix.T)[:, :2]
    replace_uv_layers(mesh, [(UV_MAPPED, mapped), (UV_ORIGINAL, original)])


def replace_uv_layers(mesh, named_arrays):
    while mesh.uv_layers:
        mesh.uv_layers.remove(mesh.uv_layers[0])
    for name, data in named_arrays:
        layer = mesh.uv_layers.new(name=name, do_init=False)
        layer.data.foreach_set("uv", np.asarray(data, np.float32).ravel())
    mesh.uv_layers[0].active_render = True
    mesh.uv_layers.active = mesh.uv_layers[0]


def finalize_uvs(part):
    mesh = part.obj.data
    occlusion = uv_array(mesh.uv_layers[UV_OCCLUSION])
    mapped = uv_array(mesh.uv_layers[UV_UNIQUE if part.unique else UV_MAPPED])
    replace_uv_layers(mesh, [(UV_MAPPED, mapped), (UV_OCCLUSION, occlusion)])


def edit_uv_layer(objects, layer_name):
    for obj in objects:
        mesh = obj.data
        mesh.uv_layers.active = mesh.uv_layers.get(layer_name) or mesh.uv_layers.new(name=layer_name, do_init=False)
    for obj in bpy.context.selected_objects:
        obj.select_set(False)
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.reveal(select=True)
    bpy.ops.mesh.select_all(action="SELECT")


def packed_extent(objects, layer_name):
    return max(float(uv_array(obj.data.uv_layers[layer_name]).max()) for obj in objects)


def pack_selected_islands(objects, layer_name, size, margin_pixels=PACK_MARGIN_PIXELS):
    for attempt in range(PACK_ATTEMPTS):
        bpy.ops.uv.select_all(action="SELECT")
        bpy.ops.uv.pack_islands(
            rotate=True, rotate_method="AXIS_ALIGNED", margin_method="FRACTION",
            margin=margin_pixels / 2 ** attempt / size, udim_source="ACTIVE_UDIM",
        )
        bpy.ops.object.mode_set(mode="OBJECT")
        if packed_extent(objects, layer_name) <= 1 + PACK_TOLERANCE or attempt == PACK_ATTEMPTS - 1:
            return
        edit_uv_layer(objects, layer_name)


def unwrap(objects, layer_name, size):
    edit_uv_layer(objects, layer_name)
    bpy.ops.uv.smart_project(
        angle_limit=SMART_PROJECT_ANGLE, island_margin=ISLAND_MARGIN, area_weight=0.0,
        correct_aspect=True, scale_to_bounds=False,
    )
    pack_selected_islands(objects, layer_name, size)


def repack(objects, layer_name, source_layer_name, size):
    for obj in objects:
        mesh = obj.data
        layer = mesh.uv_layers.get(layer_name) or mesh.uv_layers.new(name=layer_name, do_init=False)
        layer.data.foreach_set("uv", uv_array(mesh.uv_layers[source_layer_name]).ravel())
    edit_uv_layer(objects, layer_name)
    pack_selected_islands(objects, layer_name, size, REPACK_MARGIN_PIXELS)


def save_uvs(path, parts, layer_name):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    np.savez(path, **{part.name: uv_array(part.obj.data.uv_layers[layer_name]) for part in parts})


def load_uvs(path, parts, layer_name):
    if not os.path.exists(path):
        return False
    saved = np.load(path)
    if any(part.name not in saved or len(saved[part.name]) != len(part.obj.data.loops) for part in parts):
        return False
    for part in parts:
        mesh = part.obj.data
        layer = mesh.uv_layers.get(layer_name) or mesh.uv_layers.new(name=layer_name, do_init=False)
        layer.data.foreach_set("uv", saved[part.name].ravel())
    return True


def surface_area(mesh):
    return sum(polygon.area for polygon in mesh.polygons)


def is_wall(name):
    return bool(WALL_PATTERN.match(name))


def columns_of(name):
    suffix = name.split(VARIANT_SEPARATOR)[1] if VARIANT_SEPARATOR in name else None
    return COLUMN_VARIANTS.get(suffix, (False, False))


def add_variants(pieces, collection):
    variants = {**PLACED_WALL_VARIANTS, **PLACEMENT_VARIANTS}
    wanted = [(name, suffix) for name, suffixes in variants.items() if name in pieces for suffix in suffixes]
    for name, suffix in wanted:
        add_variant(pieces, collection, name, suffix)


def placed(pieces):
    return {name: piece for name, piece in pieces.items() if not is_wall(name)}


def add_variant(pieces, collection, name, suffix):
    base = pieces[name]
    variant_name = f"{name}{VARIANT_SEPARATOR}{suffix}"
    root = bpy.data.objects.new(EXPORT_PREFIX + variant_name, None)
    collection.objects.link(root)
    variant = Piece(variant_name, root, uv_owner=name, occlusion_size=base.occlusion_size)
    for part in base.parts:
        obj = bpy.data.objects.new(f"{EXPORT_PREFIX}{variant_name}_{part.name}", part.obj.data)
        collection.objects.link(obj)
        obj.parent = root
        obj.matrix_parent_inverse = Matrix.Identity(4)
        obj.matrix_basis = part.obj.matrix_basis.copy()
        variant.parts.append(Part(variant_name, part.name, obj, part.sources, part.unique))
    pieces[variant_name] = variant
