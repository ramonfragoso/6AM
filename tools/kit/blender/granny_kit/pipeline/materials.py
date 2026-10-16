import math
import os
import re
from dataclasses import dataclass, field

import bpy
import numpy as np
from mathutils import Euler, Matrix

from . import cache, images, parts, progress
from .parts import UV_OCCLUSION, UV_ORIGINAL, UV_UNIQUE, surface_area

TEXTURE_SIZE_PROPERTY = "granny_texture_size"
SURFACE_PROPERTY = "granny_surface"
PACK_UV_PROPERTY = "granny_pack_uv"
SOLID_SURFACE = 1
PAINTING_SURFACE = 2
CLEAR_GLASS_SURFACE = 3
GLOW_SURFACE = 4
GLOW_SUFFIX = "__glow"
CLEAR_GLASS_OPACITY = 0.15
CLEAR_GLASS_ABSORPTION = 0.6
CLEAR_GLASS_ROUGHNESS = 0.05
CLEAR_GLASS_TINT = (0.9, 0.9, 0.88, 1.0)
LUMINANCE = (0.2126, 0.7152, 0.0722)
PAINTING_LONG_SIDE = 1024
PAINTING_MIN_SIDE = 64
PAINTING_WHITE = (1.0, 1.0, 1.0, 1.0)
PAINTING_PLACEHOLDER_SIDE = 4
UNOCCLUDED = 1.0
CAMERA_RAY_PATH = {"Is Camera Ray": 1.0}
CERTAIN = 0.001
MAX_TEXTURE_SIZE = 2048
MIN_TEXTURE_SIZE = 256
UNIQUE_TEXELS_PER_METER = 256
PACKING_SLACK = 1.4
SWATCH_SAMPLES = 4
BAKE_MARGIN = 16
MASK_EDGE = 0.02
MASK_MAX_PARTIAL_SHARE = 0.1
OPAQUE_ALPHA = 0.99
SWATCH_UV = "UVMap"

GEOMETRY_DEPENDENT = {
    "ShaderNodeNewGeometry", "ShaderNodeAttribute", "ShaderNodeBevel",
    "ShaderNodeLayerWeight", "ShaderNodeFresnel", "ShaderNodeObjectInfo", "ShaderNodeWireframe",
    "ShaderNodeLightPath", "ShaderNodeCameraData", "ShaderNodeTangent", "ShaderNodeHairInfo",
    "ShaderNodeParticleInfo", "ShaderNodePointInfo", "ShaderNodeUVAlongStroke",
}
OCCLUSION_NODE = "ShaderNodeAmbientOcclusion"
TINT_NODE = "ShaderNodeVertexColor"
NON_PROCEDURAL_TEXTURE_NODES = {"ShaderNodeTexImage", "ShaderNodeTexCoord"}
AO_IMAGE_HINTS = ("ambientocclusion", "ambient_occlusion", "ambient occlusion", "_ao.", "_ao_", " ao.", "-ao.")
PRINCIPLED_INPUTS = {
    "base": "Base Color",
    "roughness": "Roughness",
    "metallic": "Metallic",
    "alpha": "Alpha",
    "specular": "Specular IOR Level",
    "emission": "Emission Color",
    "transmission": "Transmission Weight",
}
CONSTANT_INPUTS = (
    "Base Color", "Roughness", "Metallic", "Alpha", "IOR", "Specular IOR Level", "Specular Tint",
    "Coat Weight", "Coat Roughness", "Sheen Weight", "Sheen Roughness", "Sheen Tint",
    "Emission Color", "Emission Strength", "Transmission Weight",
)
CHANNEL_ORDER = ("base", "alpha", "roughness", "metallic", "specular", "emission", "transmission", "normal")
MATH_OPERATIONS = {
    "ADD": lambda a, b, c: a + b,
    "SUBTRACT": lambda a, b, c: a - b,
    "MULTIPLY": lambda a, b, c: a * b,
    "DIVIDE": lambda a, b, c: a / b if b else 0.0,
    "MULTIPLY_ADD": lambda a, b, c: a * b + c,
    "POWER": lambda a, b, c: a ** b if a >= 0 else 0.0,
    "MINIMUM": lambda a, b, c: min(a, b),
    "MAXIMUM": lambda a, b, c: max(a, b),
    "LESS_THAN": lambda a, b, c: 1.0 if a < b else 0.0,
    "GREATER_THAN": lambda a, b, c: 1.0 if a > b else 0.0,
    "ABSOLUTE": lambda a, b, c: abs(a),
}


@dataclass
class Analysis:
    material: object
    principled: object = None
    mapping: np.ndarray = field(default_factory=lambda: np.identity(4))
    uv_name: str = None
    reasons: list = field(default_factory=list)
    tint_layers: list = field(default_factory=list)
    ao_image: object = None
    size: int = MIN_TEXTURE_SIZE
    needs: set = field(default_factory=set)
    constants: dict = field(default_factory=dict)
    solid: bool = False
    pack_uv: bool = False
    painting: bool = False
    clear_glass: bool = False
    glow: bool = False
    dropped: list = field(default_factory=list)
    notes: list = field(default_factory=list)

    @property
    def tileable(self):
        return not self.reasons


@dataclass
class TextureSet:
    slug: str
    base: str = None
    orm: str = None
    normal: str = None
    emission: str = None
    base_has_alpha: bool = False
    alpha_mode: str = "OPAQUE"
    constants: dict = field(default_factory=dict)

    def to_meta(self):
        return {
            "slug": self.slug,
            "base": self.base and os.path.basename(self.base),
            "orm": self.orm and os.path.basename(self.orm),
            "normal": self.normal and os.path.basename(self.normal),
            "emission": self.emission and os.path.basename(self.emission),
            "base_has_alpha": self.base_has_alpha,
            "alpha_mode": self.alpha_mode,
            "constants": self.constants,
        }

    @classmethod
    def from_meta(cls, directory, meta):
        def path(key):
            return meta.get(key) and os.path.join(directory, meta[key])
        return cls(
            meta["slug"], path("base"), path("orm"), path("normal"), path("emission"),
            meta["base_has_alpha"], meta["alpha_mode"], meta["constants"],
        )


def slug(material):
    base = re.sub(r"\.\d{3}$", "", material.name)
    return re.sub(r"[^a-z0-9]+", "_", base.lower()).strip("_")


def output_node(tree):
    outputs = [n for n in tree.nodes if n.bl_idname == "ShaderNodeOutputMaterial"]
    return next((n for n in outputs if n.is_active_output), outputs[0] if outputs else None)


def linked_source(socket):
    while socket.is_linked:
        link = socket.links[0]
        if link.is_muted:
            return None
        if link.from_node.bl_idname == "NodeReroute":
            socket = link.from_node.inputs[0]
            continue
        return link.from_socket
    return None


def upstream_nodes(socket, skip=()):
    found, stack = [], [socket]
    while stack:
        current = stack.pop()
        if (current.node.name, current.identifier) in skip:
            continue
        source = linked_source(current)
        if source is None or source.node in found:
            continue
        found.append(source.node)
        stack.extend(source.node.inputs)
    return found


def camera_value(socket):
    source = linked_source(socket)
    if source is None:
        value = getattr(socket, "default_value", None)
        return float(value) if isinstance(value, (int, float)) else None
    node = source.node
    if node.bl_idname == "ShaderNodeLightPath":
        return CAMERA_RAY_PATH.get(source.name, 0.0)
    if node.bl_idname == "ShaderNodeValue":
        return float(node.outputs[0].default_value)
    if node.bl_idname == "ShaderNodeMath" and node.operation in MATH_OPERATIONS:
        values = [camera_value(s) for s in node.inputs[:3]]
        if any(v is None for v in values[:2]):
            return None
        result = MATH_OPERATIONS[node.operation](*[v or 0.0 for v in values])
        return min(1.0, max(0.0, result)) if node.use_clamp else result
    return None


def camera_shader(socket):
    source = linked_source(socket)
    while source is not None and source.node.bl_idname == "ShaderNodeMixShader":
        factor = camera_value(source.node.inputs[0])
        if factor is None or CERTAIN < factor < 1 - CERTAIN:
            break
        source = linked_source(source.node.inputs[1 if factor <= CERTAIN else 2])
    return source.node if source else None


def stored_property(material, name):
    system = material.bl_system_properties_get() if hasattr(material, "bl_system_properties_get") else None
    for store in (system, material):
        if store is not None and name in store:
            return int(store[name])
    return 0


def group_nodes(tree):
    for node in tree.nodes:
        yield node
        if node.bl_idname == "ShaderNodeGroup" and node.node_tree:
            yield from group_nodes(node.node_tree)


def constant_vector(socket):
    if not socket.is_linked:
        return tuple(socket.default_value)
    source = linked_source(socket)
    if source is not None and source.node.bl_idname == "ShaderNodeValue":
        return (source.node.outputs[0].default_value,) * 3
    return None


def mapping_matrix(node):
    loc = constant_vector(node.inputs["Location"]) if "Location" in node.inputs else (0, 0, 0)
    rot = constant_vector(node.inputs["Rotation"])
    scale = constant_vector(node.inputs["Scale"])
    if node.vector_type == "VECTOR":
        loc = (0, 0, 0)
    point = (
        Matrix.Translation((loc[0], loc[1], 0))
        @ Euler(rot, "XYZ").to_matrix().to_4x4()
        @ Matrix.Diagonal((scale[0], scale[1], 1, 1))
    )
    matrix = point.inverted() if node.vector_type == "TEXTURE" else point
    return np.array(matrix)


def mapping_key(node):
    values = [tuple(round(v, 5) for v in constant_vector(node.inputs[n]))
              for n in ("Location", "Rotation", "Scale") if n in node.inputs]
    return (node.vector_type, tuple(values))


def coordinates_reason(image_node):
    source = linked_source(image_node.inputs["Vector"])
    while source is not None:
        node = source.node
        if node.bl_idname == "ShaderNodeTexCoord":
            return None if source.name == "UV" else f"{source.name} coordinates"
        if node.bl_idname == "ShaderNodeUVMap":
            return None
        if node.bl_idname != "ShaderNodeMapping":
            return f"coordinates through {node.bl_label}"
        source = linked_source(node.inputs["Vector"])
    return None


def chosen_texture_size(material):
    return stored_property(material, TEXTURE_SIZE_PROPERTY)


def texture_size(material, image_nodes):
    if chosen_texture_size(material) > 0:
        return chosen_texture_size(material)
    sizes = [max(n.image.size) for n in image_nodes if n.image and n.image.size[0] > 0]
    largest = max(sizes, default=MIN_TEXTURE_SIZE)
    return int(min(MAX_TEXTURE_SIZE, max(MIN_TEXTURE_SIZE, 2 ** round(math.log2(largest)))))


def analyze(material):
    analysis = Analysis(material)
    if not material.use_nodes or material.node_tree is None:
        analysis.constants = {
            "Base Color": tuple(material.diffuse_color),
            "Roughness": material.roughness,
            "Metallic": material.metallic,
        }
        return analysis
    tree = material.node_tree
    out = output_node(tree)
    if out is None or not out.inputs["Surface"].is_linked:
        analysis.reasons.append("no surface shader")
        return analysis
    analysis.solid = stored_property(material, SURFACE_PROPERTY) == SOLID_SURFACE
    analysis.glow = stored_property(material, SURFACE_PROPERTY) == GLOW_SURFACE
    surface = camera_shader(out.inputs["Surface"])
    if surface is None:
        analysis.reasons.append("no surface shader")
        return analysis
    if surface.bl_idname == "ShaderNodeBsdfPrincipled":
        analysis.principled = surface
    if stored_property(material, SURFACE_PROPERTY) == CLEAR_GLASS_SURFACE:
        analysis.clear_glass = True
        analysis.constants = clear_glass_constants(analysis.principled or first_principled(tree))
        return analysis
    if is_painting(material):
        analysis.painting = True
        analysis.constants = {**constant_inputs(analysis.principled), "Base Color": PAINTING_WHITE}
        return analysis
    drop_missing_images(analysis, surface)
    drop_unrepeatable_detail_normals(analysis, surface)
    nodes = [surface] + [n for s in surface.inputs for n in upstream_nodes(s, analysis.dropped)]
    nodes = list(dict.fromkeys(nodes))
    inner = [n for g in nodes if g.bl_idname == "ShaderNodeGroup" and g.node_tree for n in group_nodes(g.node_tree)]
    every = nodes + inner
    image_nodes = [n for n in every if n.bl_idname == "ShaderNodeTexImage" and n.image]
    analysis.tint_layers = sorted({n.layer_name for n in every if n.bl_idname == TINT_NODE})
    analysis.size = texture_size(material, image_nodes)
    collect_tile_reasons(analysis, nodes)
    collect_group_reasons(analysis, nodes)
    analysis.pack_uv = bool(stored_property(material, PACK_UV_PROPERTY))
    if analysis.pack_uv:
        analysis.reasons.append("its used UV islands are repacked into a new atlas")
    analysis.ao_image = unused_occlusion_image(tree, nodes)
    if any(n.bl_idname == OCCLUSION_NODE for n in every):
        analysis.notes.append("its Ambient Occlusion node is baked as unoccluded (the Kit bakes its own AO)")
    analysis.needs = channels_needed(analysis, every)
    analysis.constants = constant_inputs(analysis.principled)
    return analysis


def first_principled(tree):
    return next((n for n in tree.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled"), None)


def clear_glass_constants(principled):
    color = principled and principled.inputs["Base Color"]
    tint = tuple(color.default_value) if color and not color.is_linked else CLEAR_GLASS_TINT
    luminance = sum(channel * weight for channel, weight in zip(tint, LUMINANCE))
    return {
        "Base Color": (*tint[:3], 1.0),
        "Roughness": CLEAR_GLASS_ROUGHNESS,
        "Metallic": 0.0,
        "Alpha": CLEAR_GLASS_OPACITY + CLEAR_GLASS_ABSORPTION * (1 - luminance),
    }


def drop_missing_images(analysis, surface):
    nodes = [n for s in surface.inputs for n in upstream_nodes(s)]
    for node in (n for n in nodes if n.bl_idname == "ShaderNodeTexImage" and n.image and n.image.size[0] == 0):
        for output in node.outputs:
            analysis.dropped += [(link.to_node.name, link.to_socket.identifier) for link in output.links]
        analysis.notes.append(f"left out '{node.image.name}', which is missing on disk")


def drop_unrepeatable_detail_normals(analysis, surface):
    nodes = [n for s in surface.inputs for n in upstream_nodes(s, analysis.dropped)]
    for bump in (n for n in nodes if n.bl_idname == "ShaderNodeBump"):
        socket = bump.inputs["Normal"]
        if not socket.is_linked:
            continue
        probe = Analysis(analysis.material)
        detail = upstream_nodes(socket, analysis.dropped)
        collect_tile_reasons(probe, detail)
        collect_group_reasons(probe, detail)
        if probe.reasons:
            analysis.dropped.append((bump.name, socket.identifier))
            analysis.notes.append(f"dropped a detail normal that cannot repeat ({'; '.join(probe.reasons)})")


def collect_group_reasons(analysis, nodes):
    for group in (n for n in nodes if n.bl_idname == "ShaderNodeGroup" and n.node_tree):
        contents = list(group_nodes(group.node_tree))
        if any(n.bl_idname == "ShaderNodeTexImage" or is_procedural_texture(n) or n.bl_idname in GEOMETRY_DEPENDENT for n in contents):
            analysis.reasons.append(f"node group '{group.node_tree.name}' has textures inside")


def is_procedural_texture(node):
    return node.bl_idname.startswith("ShaderNodeTex") and node.bl_idname not in NON_PROCEDURAL_TEXTURE_NODES


def collect_tile_reasons(analysis, nodes):
    for node in nodes:
        if node.bl_idname in GEOMETRY_DEPENDENT:
            analysis.reasons.append(f"uses a {node.bl_label} node")
        elif is_procedural_texture(node):
            analysis.reasons.append(f"procedural {node.bl_label} texture")
        elif node.bl_idname == "ShaderNodeTexImage" and node.image:
            if node.extension != "REPEAT":
                analysis.reasons.append(f"'{node.image.name}' does not repeat")
            if node.projection != "FLAT":
                analysis.reasons.append(f"'{node.image.name}' uses {node.projection.lower()} projection")
            reason = coordinates_reason(node)
            if reason:
                analysis.reasons.append(f"'{node.image.name}' uses {reason}")
        elif node.bl_idname == "ShaderNodeTexCoord":
            for socket in node.outputs:
                if socket.is_linked and socket.name != "UV":
                    analysis.reasons.append(f"uses {socket.name} coordinates")
    mappings = [n for n in nodes if n.bl_idname == "ShaderNodeMapping"]
    if any(constant_vector(s) is None for m in mappings for s in m.inputs if s.name != "Vector") or any(
        m.vector_type == "NORMAL" for m in mappings
    ):
        analysis.reasons.append("Mapping node driven by other nodes")
    elif len({mapping_key(m) for m in mappings}) > 1:
        analysis.reasons.append("several different Mapping nodes")
    elif mappings:
        analysis.mapping = mapping_matrix(mappings[0])
    uv_names = {n.uv_map for n in nodes if n.bl_idname in ("ShaderNodeUVMap", "ShaderNodeNormalMap") and n.uv_map}
    if len(uv_names) > 1:
        analysis.reasons.append("several UV maps")
    analysis.uv_name = next(iter(uv_names), None)


def unused_occlusion_image(tree, reachable):
    for node in tree.nodes:
        if node.bl_idname == "ShaderNodeTexImage" and node.image and node not in reachable:
            name = node.image.name.lower()
            if any(hint in name for hint in AO_IMAGE_HINTS):
                return node.image
    return None


def channels_needed(analysis, nodes):
    principled = analysis.principled
    if principled is None:
        normal = any(n.bl_idname in ("ShaderNodeNormalMap", "ShaderNodeBump") for n in nodes)
        return {"base", "roughness"} | ({"normal"} if normal else set())
    needs = {channel for channel, name in PRINCIPLED_INPUTS.items() if principled.inputs[name].is_linked}
    strength = principled.inputs["Emission Strength"]
    if not strength.is_linked and strength.default_value <= 0:
        needs.discard("emission")
    if not analysis.solid:
        needs.discard("transmission")
    if principled.inputs["Normal"].is_linked:
        needs.add("normal")
    return needs


def constant_inputs(principled):
    if principled is None:
        return {"Metallic": 0.0}
    values = {}
    for name in CONSTANT_INPUTS:
        socket = principled.inputs.get(name)
        if socket is None or socket.is_linked:
            continue
        value = socket.default_value
        values[name] = tuple(value) if hasattr(value, "__len__") else float(value)
    return values


def mapping_of(material):
    analysis = analyze(material)
    return analysis.mapping, analysis.uv_name


def redirect_uvs(tree, layer):
    nodes, links = tree.nodes, tree.links
    uv_node = nodes.new("ShaderNodeUVMap")
    uv_node.uv_map = layer
    for node in list(nodes):
        if node.bl_idname == "ShaderNodeTexCoord":
            for link in list(node.outputs["UV"].links):
                links.new(uv_node.outputs["UV"], link.to_socket)
        elif node.bl_idname in ("ShaderNodeUVMap", "ShaderNodeNormalMap") and node is not uv_node:
            node.uv_map = layer
        elif node.bl_idname == "ShaderNodeTexImage" and not node.inputs["Vector"].is_linked:
            links.new(uv_node.outputs["UV"], node.inputs["Vector"])


def channel_material(analysis, channel, uv_layer, bypass_mapping, target, all_principled):
    copy = analysis.material.copy()
    copy.name = f"_granny_{channel}_{analysis.material.name}"
    tree = copy.node_tree
    nodes, links = tree.nodes, tree.links
    out = output_node(tree)
    for link in list(out.inputs["Displacement"].links):
        links.remove(link)
    if bypass_mapping:
        for node in nodes:
            if node.bl_idname == "ShaderNodeMapping":
                for name, value in (("Location", 0), ("Rotation", 0), ("Scale", 1)):
                    if name in node.inputs:
                        for link in list(node.inputs[name].links):
                            links.remove(link)
                        node.inputs[name].default_value = (value, value, value)
    for node_name, identifier in analysis.dropped:
        socket = next(s for s in nodes[node_name].inputs if s.identifier == identifier)
        for link in list(socket.links):
            links.remove(link)
    if analysis.principled is not None:
        links.new(nodes[analysis.principled.name].outputs[0], out.inputs["Surface"])
    flatten_occlusion_nodes(tree)
    redirect_uvs(tree, uv_layer)
    image_node = nodes.new("ShaderNodeTexImage")
    image_node.image = target
    nodes.active = image_node
    if channel == "normal":
        return copy
    if all_principled and analysis.principled is not None:
        emit_channel(tree, out, nodes[analysis.principled.name], channel, analysis)
    return copy


def flatten_occlusion_nodes(tree):
    nodes, links = tree.nodes, tree.links
    for node in [n for n in nodes if n.bl_idname == OCCLUSION_NODE]:
        unoccluded = nodes.new("ShaderNodeValue")
        unoccluded.outputs[0].default_value = UNOCCLUDED
        for link in list(node.outputs["AO"].links):
            links.new(unoccluded.outputs[0], link.to_socket)
        color = linked_source(node.inputs["Color"])
        if color is None:
            constant = nodes.new("ShaderNodeRGB")
            constant.outputs[0].default_value = node.inputs["Color"].default_value
            color = constant.outputs[0]
        for link in list(node.outputs["Color"].links):
            links.new(color, link.to_socket)


def emit_channel(tree, out, principled, channel, analysis):
    nodes, links = tree.nodes, tree.links
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Strength"].default_value = 1
    socket = principled.inputs[PRINCIPLED_INPUTS[channel]]
    source = linked_source(socket)
    if source is None:
        value = socket.default_value
        emission.inputs["Color"].default_value = tuple(value) if hasattr(value, "__len__") else (value, value, value, 1)
    elif channel == "base" and analysis.ao_image:
        occlusion = next(n for n in nodes if n.bl_idname == "ShaderNodeTexImage" and n.image == analysis.ao_image)
        multiply = nodes.new("ShaderNodeMix")
        multiply.data_type = "RGBA"
        multiply.blend_type = "MULTIPLY"
        multiply.inputs["Factor"].default_value = 1
        links.new(source, multiply.inputs[6])
        links.new(occlusion.outputs["Color"], multiply.inputs[7])
        links.new(multiply.outputs[2], emission.inputs["Color"])
    else:
        links.new(source, emission.inputs["Color"])
    for link in list(out.inputs["Surface"].links):
        links.remove(link)
    links.new(emission.outputs[0], out.inputs["Surface"])


def bake(objects, bake_type, samples):
    bpy.context.scene.cycles.samples = samples
    for obj in bpy.context.selected_objects:
        obj.select_set(False)
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    options = dict(type=bake_type, margin=BAKE_MARGIN, margin_type="ADJACENT_FACES", use_clear=True,
                   target="IMAGE_TEXTURES", save_mode="INTERNAL")
    if bake_type == "DIFFUSE":
        options["pass_filter"] = {"COLOR"}
    if bake_type == "NORMAL":
        options["normal_space"] = "TANGENT"
    bpy.ops.object.bake(**options)


def bake_channels(objects, analyses, size, uv_layer, bypass_mapping):
    needed = set().union(*(a.needs for a in analyses.values()))
    all_principled = all(a.principled is not None for a in analyses.values())
    results = {}
    for channel in (c for c in CHANNEL_ORDER if c in needed):
        if not all_principled and channel in ("alpha", "metallic", "specular"):
            continue
        target = images.new_bake_image(f"_granny_{channel}", size)
        copies = {
            source: channel_material(a, channel, uv_layer, bypass_mapping, target, all_principled)
            for source, a in analyses.items()
        }
        for obj in objects:
            for index, slot in enumerate(obj.material_slots):
                slot.link = "OBJECT"
                slot.material = copies.get(obj.data.materials[index])
        bake_type = "NORMAL" if channel == "normal" else ("EMIT" if all_principled else {"base": "DIFFUSE", "roughness": "ROUGHNESS"}[channel])
        bake(objects, bake_type, SWATCH_SAMPLES)
        results[channel] = images.pixels(target)
        for copy in copies.values():
            bpy.data.materials.remove(copy)
        bpy.data.images.remove(target)
    return results


def solid_over_darkness(results, constants):
    constants = dict(constants)
    shape = next(iter(results.values())).shape[:2] if results else None
    alpha = results.pop("alpha")[..., 0] if "alpha" in results else constants.get("Alpha", 1.0)
    transmission = results.pop("transmission")[..., 0] if "transmission" in results else constants.get("Transmission Weight", 0.0)
    visible = np.asarray(alpha) * (1 - np.asarray(transmission))
    if "base" in results:
        results["base"] = results["base"].copy()
        results["base"][..., :3] *= np.broadcast_to(visible, shape)[..., None]
    elif np.ndim(visible) > 0:
        base = np.array(constants.get("Base Color", (0.8, 0.8, 0.8, 1))[:3])
        results["base"] = np.concatenate([base * visible[..., None], np.ones((*shape, 1))], -1)
    else:
        color = constants.get("Base Color", (0.8, 0.8, 0.8, 1))
        constants["Base Color"] = (*[c * float(visible) for c in color[:3]], 1.0)
    constants.pop("Alpha", None)
    constants.pop("Transmission Weight", None)
    return results, constants


def write_texture_set(directory, name, results, analyses, constants, solid=False):
    if solid:
        results, constants = solid_over_darkness(dict(results), constants)
    textures = TextureSet(name, constants=dict(constants))
    shape = next(iter(results.values())).shape[:2] if results else None
    if "emission" in results:
        textures.emission = images.save_png(
            os.path.join(directory, f"{name}_emission.png"), images.to_srgb(results["emission"][..., :3]), "sRGB"
        )
    if "base" in results or "alpha" in results:
        base_constant = np.array(constants.get("Base Color", (0.8, 0.8, 0.8, 1))[:3])
        rgb = results["base"][..., :3] if "base" in results else np.broadcast_to(base_constant, (*shape, 3))
        alpha = results["alpha"][..., 0] if "alpha" in results else np.ones(shape)
        textures.base = images.save_png(
            os.path.join(directory, f"{name}_basecolor.png"),
            np.concatenate([images.to_srgb(rgb), alpha[..., None]], -1), "sRGB",
        )
        if "alpha" in results:
            textures.base_has_alpha = True
            textures.alpha_mode = alpha_mode_of(alpha)
    if "roughness" in results or "metallic" in results:
        roughness = results["roughness"][..., 0] if "roughness" in results else np.full(shape, constants.get("Roughness", 0.5))
        metallic = results["metallic"][..., 0] if "metallic" in results else np.full(shape, constants.get("Metallic", 0.0))
        textures.orm = images.save_png(
            os.path.join(directory, f"{name}_orm.png"),
            np.stack([np.ones(shape), roughness, metallic], -1), "Non-Color",
        )
    if "normal" in results:
        textures.normal = images.save_png(
            os.path.join(directory, f"{name}_normal.png"), results["normal"][..., :3], "Non-Color"
        )
    if "specular" in results:
        textures.constants["Specular IOR Level"] = float(results["specular"][..., 0].mean())
    if textures.alpha_mode == "OPAQUE" and constants.get("Alpha", 1) < OPAQUE_ALPHA:
        textures.alpha_mode = "BLEND"
    meta = textures.to_meta()
    cache.write_json(os.path.join(directory, "meta.json"), meta)
    return TextureSet.from_meta(directory, cache.read_json(os.path.join(directory, "meta.json")))


def alpha_mode_of(alpha):
    if alpha.min() > OPAQUE_ALPHA:
        return "OPAQUE"
    partial = np.mean((alpha > MASK_EDGE) & (alpha < 1 - MASK_EDGE))
    return "MASK" if partial < MASK_MAX_PARTIAL_SHARE else "BLEND"


def swatch(analysis, texture_dir, force):
    material = analysis.material
    name = slug(material)
    if analysis.painting:
        return painting_placeholder(texture_dir, name, analysis.constants)
    if analysis.clear_glass:
        return TextureSet(name, alpha_mode="BLEND", constants=dict(analysis.constants))
    directory = os.path.join(texture_dir, "swatches", f"{name}_{cache.material_signature(material, (analysis.size, analysis.solid))}")
    meta = cache.read_json(os.path.join(directory, "meta.json"))
    if meta and not force:
        return TextureSet.from_meta(directory, meta)
    plane = swatch_plane(analysis.tint_layers)
    plane.data.materials.append(material)
    try:
        results = bake_channels([plane], {material: analysis}, analysis.size, SWATCH_UV, bypass_mapping=True)
    finally:
        mesh = plane.data
        bpy.data.objects.remove(plane)
        bpy.data.meshes.remove(mesh)
    for note in analysis.notes:
        progress.warn(f"{material.name}: {note}")
    return write_texture_set(directory, name, results, {material: analysis}, analysis.constants, analysis.solid)


def painting_placeholder(texture_dir, name, constants):
    side = PAINTING_PLACEHOLDER_SIDE
    path = os.path.join(texture_dir, "swatches", f"{name}_painting", f"{name}_basecolor.png")
    images.save_png(path, np.ones((side, side, 4)), "sRGB")
    return TextureSet(name, base=path, constants=dict(constants))


def swatch_plane(tint_layers):
    mesh = bpy.data.meshes.new("_granny_swatch")
    mesh.from_pydata([(0, 0, 0), (1, 0, 0), (1, 1, 0), (0, 1, 0)], [], [(0, 1, 2, 3)])
    layer = mesh.uv_layers.new(name=SWATCH_UV)
    layer.data.foreach_set("uv", [0, 0, 1, 0, 1, 1, 0, 1])
    for name in tint_layers:
        attribute = mesh.color_attributes.new(name, "FLOAT_COLOR", "CORNER")
        attribute.data.foreach_set("color", [1.0] * 16)
    obj = bpy.data.objects.new("_granny_swatch", mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def unique(piece, analyses, texture_dir, force):
    unique_parts = [p for p in piece.parts if p.unique]
    sources = {m for p in unique_parts for m in p.sources if m}
    size = unique_size(unique_parts, [m for m in sources if not analyses[m].tileable])
    pack_uv = any(analyses[m].pack_uv for m in sources)
    meshes = [p.obj.data for p in unique_parts]
    key = cache.digest(
        cache.mesh_signature(meshes), sorted(cache.material_signature(m, size) for m in sources), size, pack_uv,
    )
    name = f"{piece.name}_unique"
    directory = os.path.join(texture_dir, "unique", f"{name}_{key}")
    uvs = os.path.join(directory, "uvs.npz")
    meta = cache.read_json(os.path.join(directory, "meta.json"))
    if meta and not force and parts.load_uvs(uvs, unique_parts, UV_UNIQUE):
        return TextureSet.from_meta(directory, meta)
    if pack_uv:
        parts.repack([p.obj for p in unique_parts], UV_UNIQUE, UV_ORIGINAL, size)
    else:
        parts.unwrap([p.obj for p in unique_parts], UV_UNIQUE, size)
    parts.save_uvs(uvs, unique_parts, UV_UNIQUE)
    temporary = []
    for part in unique_parts:
        obj = bpy.data.objects.new("_granny_unique", part.obj.data)
        bpy.context.scene.collection.objects.link(obj)
        layer = part.obj.data.uv_layers[UV_UNIQUE]
        part.obj.data.uv_layers.active = layer
        layer.active_render = True
        temporary.append(obj)
    try:
        results = bake_channels(temporary, {m: analyses[m] for m in sources}, size, UV_ORIGINAL, bypass_mapping=False)
    finally:
        for obj in temporary:
            bpy.data.objects.remove(obj)
    constants = analyses[next(iter(sources))].constants
    return write_texture_set(directory, name, results, analyses, constants)


def unique_size(unique_parts, unique_materials):
    chosen = max((chosen_texture_size(m) for m in unique_materials), default=0)
    if chosen > 0:
        wanted = chosen * math.sqrt(len(unique_materials))
        return int(min(MAX_TEXTURE_SIZE, 2 ** math.floor(math.log2(wanted) + 0.5)))
    area = sum(surface_area(p.obj.data) for p in unique_parts)
    wanted = math.sqrt(area) * UNIQUE_TEXELS_PER_METER * PACKING_SLACK
    return int(min(MAX_TEXTURE_SIZE, max(MIN_TEXTURE_SIZE, 2 ** math.ceil(math.log2(max(1, wanted))))))


def uv_of(mesh, name):
    layer = mesh.uv_layers[name]
    data = np.empty(len(layer.data) * 2, np.float32)
    layer.data.foreach_get("uv", data)
    return data


def occlusion_output_group():
    name = "glTF Material Output"
    group = bpy.data.node_groups.get(name)
    if group:
        return group
    group = bpy.data.node_groups.new(name, "ShaderNodeTree")
    group.interface.new_socket("Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    return group


WEIGHTED_LAYERS = {
    "Coat Weight": ("Coat Roughness", "Coat IOR"),
    "Sheen Weight": ("Sheen Roughness", "Sheen Tint"),
}


def effective_constants(constants):
    values = dict(constants)
    for weight, settings in WEIGHTED_LAYERS.items():
        if values.get(weight, 0.0) <= 0:
            for setting in settings:
                values.pop(setting, None)
    return values


def gltf_material(name, source, textures, occlusion_path, occlusion_uv, tint_layers, load_image):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.use_backface_culling = source.use_backface_culling
    nodes, links = material.node_tree.nodes, material.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    links.new(bsdf.outputs[0], out.inputs["Surface"])
    for input_name, value in effective_constants(textures.constants).items():
        socket = bsdf.inputs.get(input_name)
        if socket is not None:
            socket.default_value = value

    def texture(path, colorspace):
        node = nodes.new("ShaderNodeTexImage")
        node.image = load_image(path, colorspace)
        return node

    color = None
    if textures.base:
        base = texture(textures.base, "sRGB")
        color = base.outputs["Color"]
        if textures.base_has_alpha and textures.alpha_mode != "OPAQUE":
            alpha = base.outputs["Alpha"]
            if textures.alpha_mode == "MASK":
                clip = nodes.new("ShaderNodeMath")
                clip.operation = "ROUND"
                links.new(alpha, clip.inputs[0])
                alpha = clip.outputs[0]
            links.new(alpha, bsdf.inputs["Alpha"])
    for layer in tint_layers[:1]:
        tint = nodes.new("ShaderNodeVertexColor")
        tint.layer_name = layer
        multiply = nodes.new("ShaderNodeMix")
        multiply.data_type = "RGBA"
        multiply.blend_type = "MULTIPLY"
        multiply.inputs["Factor"].default_value = 1
        if color is None:
            multiply.inputs[6].default_value = textures.constants.get("Base Color", (0.8, 0.8, 0.8, 1))
        else:
            links.new(color, multiply.inputs[6])
        links.new(tint.outputs["Color"], multiply.inputs[7])
        color = multiply.outputs[2]
    if color is not None:
        links.new(color, bsdf.inputs["Base Color"])
    if textures.orm:
        split = nodes.new("ShaderNodeSeparateColor")
        links.new(texture(textures.orm, "Non-Color").outputs["Color"], split.inputs[0])
        links.new(split.outputs["Green"], bsdf.inputs["Roughness"])
        links.new(split.outputs["Blue"], bsdf.inputs["Metallic"])
    if textures.emission:
        links.new(texture(textures.emission, "sRGB").outputs["Color"], bsdf.inputs["Emission Color"])
    if textures.normal:
        normal_map = nodes.new("ShaderNodeNormalMap")
        links.new(texture(textures.normal, "Non-Color").outputs["Color"], normal_map.inputs["Color"])
        links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])
    if occlusion_path:
        occlusion = texture(occlusion_path, "Non-Color")
        uv = nodes.new("ShaderNodeUVMap")
        uv.uv_map = occlusion_uv
        links.new(uv.outputs["UV"], occlusion.inputs["Vector"])
        split = nodes.new("ShaderNodeSeparateColor")
        links.new(occlusion.outputs["Color"], split.inputs[0])
        group = nodes.new("ShaderNodeGroup")
        group.node_tree = occlusion_output_group()
        links.new(split.outputs["Red"], group.inputs["Occlusion"])
    return material


def assign_gltf_materials(pieces, analyses, swatches, uniques, occlusion_paths):
    created = {}
    load_image = images.twin_sharing_loader()
    for piece in pieces.values():
        for part in piece.parts:
            slots = part.obj.material_slots
            for index, source in enumerate(part.sources):
                if source is None:
                    continue
                mode = "unique" if part.unique else "swatch"
                texture_key = repr(uniques[piece.name]) if part.unique else repr(swatches[source])
                glow = source.name if analyses[source].glow else None
                key = (piece.name, mode, texture_key, source.use_backface_culling, tuple(analyses[source].tint_layers), glow)
                if key not in created:
                    if part.unique:
                        textures = TextureSet(
                            uniques[piece.name].slug, uniques[piece.name].base, uniques[piece.name].orm,
                            uniques[piece.name].normal, uniques[piece.name].emission, uniques[piece.name].base_has_alpha,
                            uniques[piece.name].alpha_mode, dict(analyses[source].constants),
                        )
                        tint, uv = [], UV_OCCLUSION
                    else:
                        textures = swatches[source]
                        tint, uv = analyses[source].tint_layers, UV_OCCLUSION
                    name = gltf_name(source, piece, part, analyses[source])
                    created[key] = gltf_material(
                        name, source, textures, occlusion_paths.get(piece.name), uv, tint, load_image
                    )
                slots[index].link = "OBJECT"
                slots[index].material = created[key]
    return created


def gltf_name(source, piece, part, analysis):
    if analysis.painting:
        return f"kit_painting_canvas__{piece.name}"
    return f"kit_{slug(source)}__{piece.name}" + ("__unique" if part.unique else "") + (GLOW_SUFFIX if analysis.glow else "")


def is_painting(material):
    return stored_property(material, SURFACE_PROPERTY) == PAINTING_SURFACE


def painting_image(material):
    if not material.use_nodes:
        return None
    return next((n.image for n in material.node_tree.nodes if n.bl_idname == "ShaderNodeTexImage" and n.image), None)


def painting_textures():
    paintings = {}
    for material in sorted((m for m in bpy.data.materials if is_painting(m)), key=lambda m: m.name):
        image = painting_image(material)
        path = image and os.path.normpath(bpy.path.abspath(image.filepath, library=image.library))
        if not path or not os.path.isfile(path):
            progress.warn(f"{material.name}: its painting image is not a file on disk, so it was skipped")
            continue
        name = re.sub(r"[^a-z0-9]+", "_", os.path.splitext(os.path.basename(path))[0].lower()).strip("_")
        width, height = painting_size(image.size, chosen_texture_size(material) or PAINTING_LONG_SIDE)
        paintings[name] = {"path": path, "width": width, "height": height, "material": material.name}
    return paintings


def painting_size(size, long_side):
    width, height = size
    aspect = width / height if height else 1.0

    def nearest_power(value):
        return max(PAINTING_MIN_SIDE, 2 ** round(math.log2(max(1.0, value))))

    if aspect >= 1:
        return long_side, nearest_power(long_side / aspect)
    return nearest_power(long_side * aspect), long_side
