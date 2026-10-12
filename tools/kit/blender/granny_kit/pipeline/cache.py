import hashlib
import json
import os

import bpy
import numpy as np

PIPELINE_VERSION = "2"

IGNORED_NODE_PROPERTIES = {
    "rna_type", "name", "label", "location", "location_absolute", "width", "height",
    "dimensions", "select", "hide", "mute", "show_options", "show_preview", "show_texture",
    "use_custom_color", "color", "parent", "warning_propagation", "internal_links",
    "bl_idname", "bl_label", "bl_description", "bl_icon", "bl_static_type", "bl_width_default",
    "bl_width_min", "bl_width_max", "bl_height_default", "bl_height_min", "bl_height_max",
    "type", "inputs", "outputs", "is_active_output", "color_tag",
}

MAPPING_INPUTS = {"Location", "Rotation", "Scale"}


def digest(*parts):
    hasher = hashlib.sha256(PIPELINE_VERSION.encode())
    for part in parts:
        hasher.update(part if isinstance(part, bytes) else repr(part).encode())
    return hasher.hexdigest()[:16]


def material_signature(material, texture_size):
    return digest(tree_signature(material.node_tree), texture_size, material.use_backface_culling)


def tree_signature(tree):
    nodes = []
    for node in sorted(tree.nodes, key=lambda n: n.name):
        nodes.append((node.name, node.bl_idname, node_properties(node), socket_defaults(node)))
    links = sorted(
        (l.from_node.name, l.from_socket.identifier, l.to_node.name, l.to_socket.identifier)
        for l in tree.links
    )
    return (nodes, links)


def node_properties(node):
    values = []
    for prop in node.bl_rna.properties:
        if prop.identifier in IGNORED_NODE_PROPERTIES or prop.identifier.startswith("show_"):
            continue
        value = getattr(node, prop.identifier, None)
        if isinstance(value, bpy.types.Image):
            value = image_signature(value)
        elif isinstance(value, bpy.types.NodeTree):
            value = tree_signature(value)
        elif hasattr(value, "elements"):
            value = [(e.position, tuple(e.color)) for e in value.elements]
        elif hasattr(value, "curves"):
            value = [[tuple(point.location) for point in curve.points] for curve in value.curves]
        elif isinstance(value, bpy.types.ID):
            value = value.name
        elif value is not None and not isinstance(value, (int, float, str, bool)):
            value = type(value).__name__
        values.append((prop.identifier, value))
    return values


def socket_defaults(node):
    values = []
    for socket in node.inputs:
        if socket.is_linked or not hasattr(socket, "default_value"):
            continue
        if node.bl_idname == "ShaderNodeMapping" and socket.name in MAPPING_INPUTS:
            continue
        value = socket.default_value
        try:
            value = tuple(round(v, 5) for v in value)
        except TypeError:
            value = round(value, 5) if isinstance(value, float) else value
        values.append((socket.identifier, value))
    return values


def image_signature(image):
    if image.packed_file:
        return (image.name, tuple(image.size), image.packed_file.size)
    path = os.path.normpath(bpy.path.abspath(image.filepath))
    modified = os.path.getmtime(path) if os.path.exists(path) else None
    return (image.name, path, tuple(image.size), modified)


def mesh_signature(meshes):
    hasher = hashlib.sha256()
    for mesh in meshes:
        co = np.empty(len(mesh.vertices) * 3, np.float32)
        mesh.vertices.foreach_get("co", co)
        loops = np.empty(len(mesh.loops), np.int32)
        mesh.loops.foreach_get("vertex_index", loops)
        hasher.update(np.round(co, 4).tobytes())
        hasher.update(loops.tobytes())
    return hasher.hexdigest()[:16]


def read_json(path):
    if not os.path.exists(path):
        return None
    with open(path) as file:
        return json.load(file)


def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as file:
        json.dump(data, file, indent=2)
