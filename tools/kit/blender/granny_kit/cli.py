import json
import os
import sys

import bpy


def settings_from_arguments():
    arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if not arguments:
        raise SystemExit("Usage: blender <file.blend> --background --python cli.py -- <settings.json>")
    if os.path.exists(arguments[0]):
        with open(arguments[0]) as file:
            return json.load(file)
    return json.loads(arguments[0])


def use_gpu(device_type):
    if device_type in (None, "NONE", "CPU"):
        return
    preferences = bpy.context.preferences.addons["cycles"].preferences
    preferences.compute_device_type = device_type
    preferences.get_devices()
    for device in preferences.devices:
        device.use = True
    bpy.context.scene.cycles.device = "GPU"


def main():
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from pipeline import export

    settings = settings_from_arguments()
    use_gpu(settings.get("device"))
    export.run(
        settings["output"],
        settings["texture_dir"],
        settings["cache_dir"],
        settings.get("force", False),
        settings.get("collection", export.KIT_COLLECTION),
    )


main()
