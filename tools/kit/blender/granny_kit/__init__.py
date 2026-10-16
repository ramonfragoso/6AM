import glob
import json
import os
import shutil
import tempfile

import bpy

from .runner import ExportJob

KIT_COLLECTION = "Modular Kit"
TEXTURE_FOLDER = os.path.join("assets", "kit_gltf")
GAME_KIT_PATH = os.path.join("public", "models", "kit.glb")
COMPRESS_SCRIPT = os.path.join("tools", "kit", "compress-model.mjs")
CLI_SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cli.py")
TIMER_SECONDS = 0.25
EXPORT_MEMORY_GB = 4.0
MEMINFO = "/proc/meminfo"
SHOWN_WARNINGS = 6

TEXTURE_SIZES = [
    ("0", "Auto", "Largest source image, at most 2048 px", 0),
    ("256", "256 px", "", 256),
    ("512", "512 px", "", 512),
    ("1024", "1024 px", "", 1024),
    ("2048", "2048 px", "", 2048),
]

SURFACE_MODES = [
    ("DEFAULT", "As in Blender", "Export transparency and transmission as they are", 0),
    ("SOLID", "Solid over darkness", "Opaque in the game: opacity and transmission darken the color instead, like glass over a void", 1),
    ("PAINTING", "Painting", "Its image is exported as its own texture in public/models/paintings, so the game can swap paintings; Texture size sets the long side", 2),
    ("CLEAR_GLASS", "Clear glass", "See-through in the game: one tint from its base color, with an opacity that grows as the tint darkens; textures and transmission are left out", 3),
    ("GLOW", "Glow", "Exported as its own material, never merged with the rest of its Piece, so the game can make it glow (the Ceiling Lamp's disc)", 4),
]

BAKE_DEVICES = [
    ("AUTO", "Cycles preference", "Use the device chosen in Preferences > System"),
    ("CPU", "CPU", ""),
    ("CUDA", "CUDA", ""),
    ("OPTIX", "OptiX", ""),
    ("HIP", "HIP", ""),
    ("ONEAPI", "oneAPI", ""),
]


class State:
    job = None


def find_node():
    found = shutil.which("node")
    if found:
        return found
    candidates = sorted(glob.glob(os.path.expanduser("~/.nvm/versions/node/*/bin/node")))
    return candidates[-1] if candidates else ""


def find_ktx():
    return shutil.which("ktx") or next((p for p in ("/usr/bin/ktx", "/usr/local/bin/ktx") if os.path.exists(p)), "")


class GrannyKitPreferences(bpy.types.AddonPreferences):
    bl_idname = __package__

    project_dir: bpy.props.StringProperty(name="Game project", subtype="DIR_PATH")
    node_path: bpy.props.StringProperty(name="Node.js", subtype="FILE_PATH", default=find_node())
    ktx_path: bpy.props.StringProperty(name="KTX-Software ktx", subtype="FILE_PATH", default=find_ktx())
    device: bpy.props.EnumProperty(name="Bake device", items=BAKE_DEVICES, default="AUTO")

    def draw(self, context):
        layout = self.layout
        layout.prop(self, "project_dir")
        layout.prop(self, "node_path")
        layout.prop(self, "ktx_path")
        layout.prop(self, "device")


def preferences(context):
    return context.preferences.addons[__package__].preferences


def bake_device(prefs, context):
    if prefs.device != "AUTO":
        return prefs.device
    cycles = context.preferences.addons.get("cycles")
    chosen = cycles.preferences.compute_device_type if cycles else "NONE"
    return "CPU" if chosen == "NONE" else chosen


def available_memory_gb():
    try:
        with open(MEMINFO) as file:
            for line in file:
                if line.startswith("MemAvailable:"):
                    return int(line.split()[1]) / 1024 / 1024
    except OSError:
        return None
    return None


def problems(prefs):
    found = []
    available = available_memory_gb()
    if available is not None and available < EXPORT_MEMORY_GB:
        found.append(f"Only {available:.1f} GB of memory free; the export needs about {EXPORT_MEMORY_GB:.0f} GB. Save, restart Blender or close apps")
    if not bpy.data.filepath:
        found.append("Save the .blend file first")
    if KIT_COLLECTION not in bpy.data.collections:
        found.append(f'No "{KIT_COLLECTION}" collection')
    project = bpy.path.abspath(prefs.project_dir)
    if not os.path.exists(os.path.join(project, COMPRESS_SCRIPT)):
        found.append("Set the game project folder in the add-on preferences")
    if not os.path.isfile(bpy.path.abspath(prefs.node_path)):
        found.append("Node.js not found: set it in the add-on preferences")
    if not os.path.isfile(bpy.path.abspath(prefs.ktx_path)):
        found.append("ktx not found: install KTX-Software")
    return found


def create_job(context, force):
    prefs = preferences(context)
    project = bpy.path.abspath(prefs.project_dir)
    work = tempfile.mkdtemp(prefix="granny_kit_")
    source = os.path.join(work, "kit_source.blend")
    bpy.ops.wm.save_as_mainfile(filepath=source, copy=True, relative_remap=True)
    texture_dir = os.path.join(os.path.dirname(bpy.data.filepath), TEXTURE_FOLDER)
    raw = os.path.join(work, "kit_raw.glb")
    settings = {
        "output": raw,
        "texture_dir": texture_dir,
        "cache_dir": os.path.join(texture_dir, "cache"),
        "force": force,
        "device": bake_device(prefs, context),
        "collection": KIT_COLLECTION,
    }
    bake = [
        bpy.app.binary_path, source, "--background", "--factory-startup", "--python-exit-code", "1",
        "--python", CLI_SCRIPT, "--", json.dumps(settings),
    ]
    output = os.path.join(project, GAME_KIT_PATH)
    node = bpy.path.abspath(prefs.node_path)
    compress = [node, os.path.join(project, COMPRESS_SCRIPT), raw, output]
    environment = dict(os.environ)
    tool_dirs = [os.path.dirname(node), os.path.dirname(bpy.path.abspath(prefs.ktx_path))]
    environment["PATH"] = os.pathsep.join(tool_dirs + [environment.get("PATH", "")])
    return ExportJob(bake, compress, project, environment, os.path.join(work, "export.log"), output)


def redraw(context):
    for window in context.window_manager.windows:
        for area in window.screen.areas:
            if area.type == "VIEW_3D":
                area.tag_redraw()


class GRANNY_OT_export_kit(bpy.types.Operator):
    bl_idname = "granny.export_kit"
    bl_label = "Export Kit"
    bl_description = "Bake the Modular Kit and write public/models/kit.glb in the game project"

    _timer = None

    @classmethod
    def poll(cls, context):
        return State.job is None or not State.job.running

    def execute(self, context):
        found = problems(preferences(context))
        if found:
            self.report({"ERROR"}, found[0])
            return {"CANCELLED"}
        State.job = create_job(context, context.window_manager.granny_force_rebake)
        State.job.start()
        self._timer = context.window_manager.event_timer_add(TIMER_SECONDS, window=context.window)
        context.window_manager.modal_handler_add(self)
        return {"RUNNING_MODAL"}

    def modal(self, context, event):
        if event.type != "TIMER":
            return {"PASS_THROUGH"}
        job = State.job
        job.poll()
        redraw(context)
        if job.running:
            return {"PASS_THROUGH"}
        context.window_manager.event_timer_remove(self._timer)
        if job.error:
            self.report({"ERROR"}, f"Kit export: {job.error}")
        else:
            self.report({"INFO"}, job.message)
        return {"FINISHED"}


class GRANNY_OT_cancel_export(bpy.types.Operator):
    bl_idname = "granny.cancel_export"
    bl_label = "Cancel"
    bl_description = "Stop the running kit export"

    @classmethod
    def poll(cls, context):
        return State.job is not None and State.job.running

    def execute(self, context):
        State.job.cancel()
        return {"FINISHED"}


class GRANNY_OT_open_export_log(bpy.types.Operator):
    bl_idname = "granny.open_export_log"
    bl_label = "Open Log"
    bl_description = "Open the full log of the last kit export"

    @classmethod
    def poll(cls, context):
        return State.job is not None and os.path.exists(State.job.log_path)

    def execute(self, context):
        bpy.ops.wm.path_open(filepath=State.job.log_path)
        return {"FINISHED"}


def panel_materials(obj):
    if obj is None:
        return []
    found = [obj.active_material] if obj.active_material else []
    for modifier in (m for m in obj.modifiers if m.type == "NODES" and m.node_group):
        for item in modifier.node_group.interface.items_tree:
            if getattr(item, "socket_type", None) == "NodeSocketMaterial" and item.in_out == "INPUT":
                material = getattr(modifier.properties.inputs, item.identifier).value
                if material is not None and material not in found:
                    found.append(material)
    return found


class VIEW3D_PT_granny_kit(bpy.types.Panel):
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Granny Kit"
    bl_label = "Granny Kit"

    def draw(self, context):
        layout = self.layout
        job = State.job
        prefs = preferences(context)
        if job and job.running:
            layout.progress(factor=job.progress, type="BAR", text=job.message)
            layout.operator(GRANNY_OT_cancel_export.bl_idname, icon="CANCEL")
        else:
            layout.operator(GRANNY_OT_export_kit.bl_idname, icon="EXPORT")
        layout.prop(context.window_manager, "granny_force_rebake")
        for problem in problems(prefs):
            layout.label(text=problem, icon="ERROR")
        if job and not job.running:
            self.draw_result(layout, job)
        for material in panel_materials(context.object):
            box = layout.box()
            box.label(text=material.name, icon="MATERIAL")
            box.prop(material, "granny_texture_size", text="Texture size")
            box.prop(material, "granny_surface", text="Game surface")
            box.prop(material, "granny_pack_uv")
        box = layout.box()
        box.label(text="Settings", icon="PREFERENCES")
        box.prop(prefs, "project_dir", text="")
        box.prop(prefs, "device")

    def draw_result(self, layout, job):
        box = layout.box()
        box.label(text=job.message, icon="ERROR" if job.error else "CHECKMARK")
        if job.error:
            for line in job.tail[-4:]:
                box.label(text=line[:80])
        for warning in job.warnings[:SHOWN_WARNINGS]:
            box.label(text=warning[:80], icon="INFO")
        if len(job.warnings) > SHOWN_WARNINGS:
            box.label(text=f"… {len(job.warnings) - SHOWN_WARNINGS} more in the log")
        box.operator(GRANNY_OT_open_export_log.bl_idname, icon="TEXT")


CLASSES = (
    GrannyKitPreferences,
    GRANNY_OT_export_kit,
    GRANNY_OT_cancel_export,
    GRANNY_OT_open_export_log,
    VIEW3D_PT_granny_kit,
)


def register():
    for cls in CLASSES:
        bpy.utils.register_class(cls)
    bpy.types.Material.granny_texture_size = bpy.props.EnumProperty(
        name="Texture size", items=TEXTURE_SIZES, default="0",
        description="Resolution of this material's textures in the game",
    )
    bpy.types.Material.granny_surface = bpy.props.EnumProperty(
        name="Game surface", items=SURFACE_MODES, default="DEFAULT",
        description="How transparency and transmission export to the game",
    )
    bpy.types.Material.granny_pack_uv = bpy.props.BoolProperty(
        name="Repack UV", default=False,
        description="Bake this material uniquely into a new atlas that packs only the UV islands its meshes still use, "
        "so deleted parts leave no unused texture",
    )
    bpy.types.WindowManager.granny_force_rebake = bpy.props.BoolProperty(
        name="Rebake everything", description="Ignore the cache and bake every texture again",
    )


def unregister():
    del bpy.types.WindowManager.granny_force_rebake
    del bpy.types.Material.granny_pack_uv
    del bpy.types.Material.granny_surface
    del bpy.types.Material.granny_texture_size
    for cls in reversed(CLASSES):
        bpy.utils.unregister_class(cls)
