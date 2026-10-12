import os
import time

import bpy

from . import cache, materials, occlusion, parts, progress

KIT_COLLECTION = "Modular Kit"
EXPORT_COLLECTION = "_granny_export"


def stage(start, end):
    def report(fraction, message):
        progress.report(start + (end - start) * fraction, message)
    return report


def run(output_path, texture_dir, cache_dir, force=False, collection=KIT_COLLECTION):
    started = time.time()
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")

    progress.report(0.02, "Copying pieces")
    export_collection = bpy.data.collections.new(EXPORT_COLLECTION)
    scene.collection.children.link(export_collection)
    pieces = parts.build_pieces(collection, export_collection, materials.mapping_of)
    if not pieces:
        raise RuntimeError(f'No "prefab_*" empties found in the "{collection}" collection')

    progress.report(0.08, "Analyzing materials")
    sources = {m for piece in pieces.values() for part in piece.parts for m in part.sources if m}
    analyses = {m: materials.analyze(m) for m in sources}
    for material, analysis in analyses.items():
        if not analysis.tileable:
            progress.warn(f"{material.name}: baked uniquely per piece ({'; '.join(analysis.reasons)})")
    for piece in pieces.values():
        for part in piece.parts:
            part.unique = any(m and not analyses[m].tileable for m in part.sources)
    for piece in pieces.values():
        piece.pack_uv = any(analyses[m].pack_uv for part in piece.parts for m in part.sources if m)
    parts.add_variants(pieces, export_collection)

    occlusion_paths = occlusion.bake_all(pieces, cache_dir, force, stage(0.1, 0.6))

    swatch_sources = sorted(
        {m for piece in pieces.values() for part in piece.parts if not part.unique for m in part.sources if m},
        key=lambda m: m.name,
    )
    report = stage(0.6, 0.85)
    swatches = {}
    for index, material in enumerate(swatch_sources):
        report(index / max(1, len(swatch_sources)), f"Material: {material.name}")
        swatches[material] = materials.swatch(analyses[material], texture_dir, force)

    uniques = {}
    for name, piece in sorted(pieces.items()):
        if not any(part.unique for part in piece.parts):
            continue
        if piece.uv_owner:
            uniques[name] = uniques[piece.uv_owner]
            continue
        progress.report(0.86, f"Unique textures: {name}")
        uniques[name] = materials.unique(piece, analyses, texture_dir, force)

    progress.report(0.9, "Building glTF materials")
    materials.assign_gltf_materials(pieces, analyses, swatches, uniques, occlusion_paths)
    finalized = set()
    for piece in pieces.values():
        for part in piece.parts:
            if part.obj.data.name not in finalized:
                parts.finalize_uvs(part)
                finalized.add(part.obj.data.name)

    progress.report(0.93, "Writing glTF")
    exported = parts.placed(pieces)
    export(exported, output_path)
    summary = {
        "output": output_path,
        "seconds": round(time.time() - started, 1),
        "pieces": sorted(exported),
        "unique_materials": sorted(m.name for m, a in analyses.items() if not a.tileable),
        "paintings": materials.painting_textures(),
    }
    cache.write_json(os.path.splitext(output_path)[0] + ".summary.json", summary)
    progress.report(1.0, f"Exported {len(exported)} pieces in {summary['seconds']}s")
    return summary


def export(pieces, output_path):
    for obj in bpy.context.selected_objects:
        obj.select_set(False)
    for piece in pieces.values():
        piece.root.select_set(True)
        for obj in [part.obj for part in piece.parts] + piece.anchors:
            obj.select_set(True)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_tangents=True,
        export_vertex_color="MATERIAL",
        export_all_vertex_colors=False,
        export_attributes=False,
        export_extras=False,
        export_image_format="AUTO",
    )
