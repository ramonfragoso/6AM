"""Rig the ghost with the Mixamo skeleton and bake its two clips.

Run inside Blender (Text Editor, or headless with --python), with the ghost mesh
in the open file:

    blender house_interior.blend --background --python tools/kit/blender/rig_ghost.py -- \
        '{"save": "<rigged.blend>"}'

Mixamo's skin-less downloads hold the skeleton in a T-pose, while the ghost mesh
stands in an A-pose. So the script poses a copy of the skeleton into the mesh's
pose (arms aimed through the mesh's elbows and wrists), applies that as the rest
pose, skins the mesh with automatic weights (on the body only; the eyes and the
decals take the nearest body weights), and bakes each clip onto it by copying
every bone's world rotation and location from the imported skeleton. The result
is the "ghost" collection: `ghost_rig` (armature, NLA tracks `idle` and `walk`)
and `ghost` (the skinned mesh). The original mesh is hidden, never changed.
"""

import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

SOURCE_MESH = "Male body reference"
COLLECTION = "ghost"
RIG = "ghost_rig"
MESH = "ghost"
BODY_MATERIAL = 0
BONE_PREFIX = "mixamorig:"
DOWNLOADS = Path.home() / "Downloads"
CLIPS = {"idle": DOWNLOADS / "Sad Idle.fbx", "walk": DOWNLOADS / "Walking.fbx"}
CLIP_FPS = 60
MAX_INFLUENCES = 4
RING_WIDTH = 0.015
ARM_CONE_DEGREES = 20
ARMS = ("Left", "Right")
PLANTED_HEIGHT = 0.005


def main(options):
    scene = bpy.context.scene
    source = bpy.data.objects[SOURCE_MESH]
    remove_previous()
    collection = bpy.data.collections.new(COLLECTION)
    scene.collection.children.link(collection)

    skeletons = {clip: import_skeleton(path) for clip, path in CLIPS.items()}
    scene.render.fps = CLIP_FPS
    scene.render.fps_base = 1
    reference = next(iter(skeletons.values()))

    rig = copy_rest_skeleton(reference, collection)
    fit = mesh_to_rig(source, rig)
    mesh = rig_space_copy(source, fit, collection)
    pose_arms_like_mesh(rig, mesh)
    apply_pose_as_rest(rig)
    rename_bones(rig)
    skin(mesh, rig)
    for clip, skeleton in skeletons.items():
        bake_clip(rig, skeleton, clip)
    report_walk_speed(rig)
    for skeleton in skeletons.values():
        remove_skeleton(skeleton)

    rig.matrix_world = source.matrix_world @ fit.inverted()
    source.hide_set(True)
    source.hide_render = True
    if options.get("save"):
        bpy.ops.wm.save_as_mainfile(filepath=options["save"], copy=True)


def remove_previous():
    old = bpy.data.collections.get(COLLECTION)
    if not old:
        return
    for obj in list(old.all_objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.collections.remove(old)
    for action in list(bpy.data.actions):
        if action.name.startswith("ghost_"):
            bpy.data.actions.remove(action)


def import_skeleton(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=str(path), automatic_bone_orientation=False)
    imported = [obj for obj in bpy.data.objects if obj not in before]
    skeleton = next(obj for obj in imported if obj.type == "ARMATURE")
    for obj in imported:
        if obj is not skeleton:
            bpy.data.objects.remove(obj, do_unlink=True)
    return skeleton


def remove_skeleton(skeleton):
    action = skeleton.animation_data and skeleton.animation_data.action
    data = skeleton.data
    bpy.data.objects.remove(skeleton, do_unlink=True)
    bpy.data.armatures.remove(data)
    if action and action.users == 0:
        bpy.data.actions.remove(action)


def copy_rest_skeleton(reference, collection):
    rig = reference.copy()
    rig.data = reference.data.copy()
    rig.name = RIG
    rig.data.name = RIG
    rig.animation_data_clear()
    collection.objects.link(rig)
    select_only(rig)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for bone in rig.pose.bones:
        bone.matrix_basis = Matrix.Identity(4)
    return rig


def mesh_to_rig(source, rig):
    turn = Matrix.Rotation(math.radians(90), 4, "Z")
    points = vertices_of(source.data, turn)
    ankle_z = bone_head(rig, "LeftFoot").z
    neck = bone_head(rig, "Neck")
    ankles = band(points, ankle_z)
    middle = np.median(ankles[:, 0])
    left = ankles[ankles[:, 0] > middle].mean(0)
    right = ankles[ankles[:, 0] <= middle].mean(0)
    rig_ankles = (bone_head(rig, "LeftFoot") + bone_head(rig, "RightFoot")) / 2
    neck_ring = band(points, neck.z)
    neck_ring = neck_ring[np.abs(neck_ring[:, 0] - neck_ring[:, 0].mean()) < 0.12]
    mesh_neck = neck_ring.mean(0)
    offsets = [
        np.array(rig_ankles)[:2] - (left + right)[:2] / 2,
        np.array(neck)[:2] - mesh_neck[:2],
    ]
    shift = np.mean(offsets, axis=0)
    print("GHOST fit offsets", offsets, "ankle line", right - left)
    return Matrix.Translation((shift[0], shift[1], 0)) @ turn


def rig_space_copy(source, fit, collection):
    data = source.data.copy()
    data.name = MESH
    data.transform(fit)
    mesh = bpy.data.objects.new(MESH, data)
    collection.objects.link(mesh)
    mesh.vertex_groups.clear()
    return mesh


def pose_arms_like_mesh(rig, mesh):
    body = body_points(mesh)
    select_only(rig)
    bpy.ops.object.mode_set(mode="POSE")
    for side in ARMS:
        shoulder = bone_head(rig, f"{side}Arm")
        upper = (bone_head(rig, f"{side}ForeArm") - shoulder).length
        lower = (bone_head(rig, f"{side}Hand") - bone_head(rig, f"{side}ForeArm")).length
        outward = 1 if side == "Left" else -1
        arm = body[(body[:, 0] * outward > abs(shoulder.x) + 0.05) & (body[:, 2] < shoulder.z)]
        tip = arm[np.argmax(np.linalg.norm(arm - np.array(shoulder), axis=1))]
        elbow = ring_centroid(body, np.array(shoulder), upper, tip)
        wrist = ring_centroid(body, elbow, lower, tip)
        print("GHOST", side, "elbow", elbow, "wrist", wrist, "tip", tip)
        aim(rig, f"{side}Arm", f"{side}ForeArm", Vector(elbow))
        aim(rig, f"{side}ForeArm", f"{side}Hand", Vector(wrist))
    bpy.ops.object.mode_set(mode="OBJECT")


def aim(rig, name, child, target):
    bpy.context.view_layer.update()
    bone = rig.pose.bones[BONE_PREFIX + name]
    head = bone.head.copy()
    reach = rig.pose.bones[BONE_PREFIX + child].head - head
    turn = reach.rotation_difference(target - head).to_matrix().to_4x4()
    bone.matrix = Matrix.Translation(head) @ turn @ Matrix.Translation(-head) @ bone.matrix
    bpy.context.view_layer.update()


def apply_pose_as_rest(rig):
    select_only(rig)
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode="OBJECT")


def rename_bones(rig):
    for bone in rig.data.bones:
        bone.name = bone.name.removeprefix(BONE_PREFIX)


def skin(mesh, rig):
    body = mesh.copy()
    body.data = mesh.data.copy()
    mesh.users_collection[0].objects.link(body)
    keep_only_material(body.data, BODY_MATERIAL)
    select_only(body)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")

    for group in body.vertex_groups:
        mesh.vertex_groups.new(name=group.name)
    transfer = mesh.modifiers.new("weights", "DATA_TRANSFER")
    transfer.object = body
    transfer.use_vert_data = True
    transfer.data_types_verts = {"VGROUP_WEIGHTS"}
    transfer.vert_mapping = "POLYINTERP_NEAREST"
    transfer.layers_vgroup_select_src = "ALL"
    transfer.layers_vgroup_select_dst = "NAME"
    select_only(mesh)
    bpy.ops.object.modifier_apply(modifier=transfer.name)
    bpy.ops.object.vertex_group_limit_total(group_select_mode="ALL", limit=MAX_INFLUENCES)
    bpy.ops.object.vertex_group_normalize_all(group_select_mode="ALL", lock_active=False)
    bpy.data.objects.remove(body, do_unlink=True)

    mesh.parent = rig
    mesh.matrix_parent_inverse = Matrix.Identity(4)
    deform = mesh.modifiers.new("rig", "ARMATURE")
    deform.object = rig
    unweighted = unweighted_count(mesh)
    print("GHOST vertices without weights:", unweighted)


def bake_clip(rig, skeleton, clip):
    action = skeleton.animation_data.action
    start, end = (int(round(frame)) for frame in action.frame_range)
    select_only(rig)
    bpy.ops.object.mode_set(mode="POSE")
    for bone in rig.pose.bones:
        source_name = BONE_PREFIX + bone.name
        if source_name not in skeleton.pose.bones:
            continue
        for kind in ("COPY_LOCATION", "COPY_ROTATION"):
            constraint = bone.constraints.new(kind)
            constraint.target = skeleton
            constraint.subtarget = source_name
    rig.animation_data_create()
    rig.animation_data.action = None
    bpy.ops.nla.bake(
        frame_start=start,
        frame_end=end,
        only_selected=False,
        visual_keying=True,
        clear_constraints=True,
        use_current_action=False,
        bake_types={"POSE"},
        channel_types={"LOCATION", "ROTATION"},
    )
    bpy.ops.object.mode_set(mode="OBJECT")
    baked = rig.animation_data.action
    baked.name = f"ghost_{clip}"
    baked.use_fake_user = True
    track = rig.animation_data.nla_tracks.new()
    track.name = clip
    track.strips.new(clip, start, baked)
    rig.animation_data.action = None
    for bone in rig.pose.bones:
        bone.matrix_basis = Matrix.Identity(4)
    print("GHOST baked", clip, start, end)


def report_walk_speed(rig):
    scene = bpy.context.scene
    walk = bpy.data.actions["ghost_walk"]
    rig.animation_data.action = walk
    start, end = (int(round(frame)) for frame in walk.frame_range)
    feet = [rig.pose.bones[f"{side}Foot"] for side in ARMS]
    tracks = []
    for frame in range(start, end + 1):
        scene.frame_set(frame)
        tracks.append([(rig.matrix_world @ foot.head).copy() for foot in feet])
    floor = min(head.z for heads in tracks for head in heads)
    speeds = []
    for before, after in zip(tracks, tracks[1:]):
        for was, now in zip(before, after):
            if max(was.z, now.z) < floor + PLANTED_HEIGHT:
                speeds.append(math.hypot(now.x - was.x, now.y - was.y) * CLIP_FPS)
    rig.animation_data.action = None
    print(
        "GHOST walk cycle seconds",
        (end - start) / CLIP_FPS,
        "planted foot speed median",
        float(np.median(speeds)),
    )


def vertices_of(data, transform):
    points = np.empty(len(data.vertices) * 3)
    data.vertices.foreach_get("co", points)
    points = points.reshape(-1, 3)
    rotation = np.array(transform.to_3x3())
    return points @ rotation.T + np.array(transform.translation)


def body_points(mesh):
    data = mesh.data
    used = {index for poly in data.polygons if poly.material_index == BODY_MATERIAL for index in poly.vertices}
    points = vertices_of(data, Matrix.Identity(4))
    return points[sorted(used)]


def band(points, height):
    return points[np.abs(points[:, 2] - height) < RING_WIDTH]


def ring_centroid(points, center, radius, toward):
    direction = (toward - center) / np.linalg.norm(toward - center)
    offsets = points - center
    distance = np.linalg.norm(offsets, axis=1)
    cosine = (offsets @ direction) / np.maximum(distance, 1e-9)
    ring = (np.abs(distance - radius) < RING_WIDTH) & (cosine > math.cos(math.radians(ARM_CONE_DEGREES)))
    return points[ring].mean(0)


def bone_head(rig, name):
    bone = rig.data.bones.get(BONE_PREFIX + name) or rig.data.bones[name]
    return rig.matrix_world @ bone.head_local


def keep_only_material(data, index):
    editable = bmesh.new()
    editable.from_mesh(data)
    bmesh.ops.delete(editable, geom=[face for face in editable.faces if face.material_index != index], context="FACES")
    loose = [vert for vert in editable.verts if not vert.link_faces]
    bmesh.ops.delete(editable, geom=loose, context="VERTS")
    editable.to_mesh(data)
    editable.free()


def unweighted_count(mesh):
    return sum(1 for vertex in mesh.data.vertices if not any(group.weight > 0 for group in vertex.groups))


def select_only(obj):
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    for other in bpy.context.selected_objects:
        other.select_set(False)
    obj.hide_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def options_from_argv():
    if "--" not in sys.argv:
        return {}
    arguments = sys.argv[sys.argv.index("--") + 1 :]
    return json.loads(arguments[0]) if arguments else {}


main(options_from_argv())
