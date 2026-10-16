import json
import sys

import bpy

TEXTURE_SIZE_PROPERTY = "granny_texture_size"
FAKE_USER_KINDS = ("materials", "images", "node_groups", "meshes", "textures", "actions", "texts")


def settings_from_arguments():
    arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if not arguments:
        raise SystemExit("Usage: blender <copy.blend> --background --python lean_copy.py -- <settings.json>")
    return json.loads(arguments[0])


def with_descendants(roots):
    found = set()
    stack = list(roots)
    while stack:
        obj = stack.pop()
        if obj in found:
            continue
        found.add(obj)
        stack.extend(obj.children)
    return found


def context_collection(name, prefab_names):
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    objects = with_descendants(bpy.data.objects[prefab] for prefab in prefab_names)
    for obj in objects:
        collection.objects.link(obj)
    return objects


def main():
    settings = settings_from_arguments()
    kept = set()
    for name in settings["collections"]:
        kept |= set(bpy.data.collections[name].all_objects)
    context = settings.get("context")
    if context:
        kept |= context_collection(context["name"], context["prefabs"])
    bpy.data.batch_remove([obj for obj in bpy.data.objects if obj not in kept])
    for kind in FAKE_USER_KINDS:
        for block in getattr(bpy.data, kind):
            block.use_fake_user = False
    bpy.data.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    for material, size in settings.get("texture_sizes", {}).items():
        bpy.data.materials[material].bl_system_properties_get(do_create=True)[TEXTURE_SIZE_PROPERTY] = size
    bpy.ops.wm.save_as_mainfile(filepath=settings["output"])


main()
