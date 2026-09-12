import argparse
import hashlib
import json
import math
import struct
import sys
import time
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector


def read_asset(source):
    if source.suffix.lower() != ".glb" or not source.is_file():
        raise ValueError("Input must be an existing GLB file.")
    if source.stat().st_size > 128 * 1024 * 1024:
        raise ValueError("GLB input exceeds the 128 MB limit.")
    content = source.read_bytes()
    if len(content) < 20:
        raise ValueError("Truncated GLB file.")
    magic, version, length, json_length, chunk_type = struct.unpack_from("<5I", content)
    if magic != 0x46546C67 or version != 2 or length != len(content) or chunk_type != 0x4E4F534A or json_length > 16 * 1024 * 1024:
        raise ValueError("Invalid or unsupported GLB header.")
    document = json.loads(content[20:20 + json_length])
    for resource in document.get("buffers", []) + document.get("images", []):
        if "uri" in resource:
            raise ValueError("Only self-contained GLBs with embedded buffers and images are accepted.")
    metadata = next((node["extras"] for node in document.get("nodes", []) if isinstance(node.get("extras"), dict) and "physicalSpecification" in node["extras"]), None)
    if not metadata or metadata.get("outputUnits") != "metres":
        raise ValueError("Use a metre-scale GLB exported by the jewellery studio.")
    job = metadata.get("renderJob", {})
    if job and job.get("schema") != "tjc.cycles-job.v1":
        raise ValueError("Unsupported render job schema.")
    return metadata, job, hashlib.sha256(content).hexdigest()


def bounded(value, default, minimum, maximum):
    number = float(default if value is None else value)
    if not math.isfinite(number) or not minimum <= number <= maximum:
        raise ValueError(f"Render setting must be between {minimum} and {maximum}.")
    return number


def configure_device(scene, requested):
    scene.cycles.device = "CPU"
    if requested == "cpu":
        return "CPU"
    preferences = bpy.context.preferences.addons["cycles"].preferences
    for backend in ("METAL", "OPTIX", "CUDA", "HIP", "ONEAPI"):
        try:
            preferences.compute_device_type = backend
            preferences.refresh_devices()
            devices = [device for device in preferences.devices if device.type != "CPU"]
            if not devices:
                continue
            for device in preferences.devices:
                device.use = device.type != "CPU"
            scene.cycles.device = "GPU"
            return f"{backend}: {', '.join(device.name for device in devices)}"
        except (TypeError, RuntimeError):
            continue
    if requested == "gpu":
        raise RuntimeError("No supported Cycles GPU found. Retry with --device cpu.")
    return "CPU (no supported GPU found)"


def point_at(object_to_aim, target):
    object_to_aim.rotation_euler = (target - object_to_aim.location).to_track_quat("-Z", "Y").to_euler()


def make_area(name, center, span, offset, power, dimensions, color):
    light = bpy.data.lights.new(name, "AREA")
    light.energy = power * span * span
    light.shape = "RECTANGLE"
    light.size = dimensions[0] * span
    light.size_y = dimensions[1] * span
    light.color = color
    if hasattr(light.cycles, "is_caustics_light"):
        light.cycles.is_caustics_light = True
    object_light = bpy.data.objects.new(name, light)
    bpy.context.collection.objects.link(object_light)
    object_light.location = center + Vector(offset) * span
    point_at(object_light, center)
    return object_light


def prepare_scene(source, job, settings):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(source))
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1
    scene.render.engine = "CYCLES"
    scene.cycles.samples = settings["samples"]
    scene.cycles.seed = settings["seed"]
    scene.cycles.max_bounces = settings["maxBounces"]
    scene.cycles.transmission_bounces = settings["transmissionBounces"]
    scene.cycles.glossy_bounces = 12
    scene.cycles.diffuse_bounces = 6
    scene.cycles.transparent_max_bounces = 16
    scene.cycles.use_denoising = True
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.01
    scene.cycles.adaptive_min_samples = min(32, settings["samples"])
    scene.cycles.caustics_reflective = True
    scene.cycles.caustics_refractive = True
    scene.render.resolution_x = settings["resolution"]
    scene.render.resolution_y = settings["resolution"]
    scene.render.resolution_percentage = 100
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = settings["background"] == "Transparent"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    meshes = [item for item in scene.objects if item.type == "MESH"]
    if not meshes:
        raise ValueError("No mesh objects found in the exported GLB.")
    corners = [item.matrix_world @ Vector(corner) for item in meshes for corner in item.bound_box]
    minimum = Vector([min(point[axis] for point in corners) for axis in range(3)])
    maximum = Vector([max(point[axis] for point in corners) for axis in range(3)])
    center = (minimum + maximum) * 0.5
    span = max(maximum - minimum)
    if not 0.0005 <= span <= 2:
        raise ValueError(f"Implausible jewellery bounds: {span:.6f} m. Check input units.")
    for item in meshes:
        if hasattr(item.cycles, "is_caustics_caster"):
            item.cycles.is_caustics_caster = True
    camera_data = bpy.data.cameras.new("Studio macro camera")
    camera = bpy.data.objects.new("Studio macro camera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    direction = {"Three-Quarter": (0.8, -1.5, 0.8), "Profile": (1.8, -0.2, 0.25), "Top": (0.1, -0.1, 1.8)}[settings["view"]]
    camera.location = center + Vector(direction).normalized() * span * 2.5
    point_at(camera, center)
    camera_data.lens = 65
    camera_data.clip_start = span * 0.001
    camera_data.clip_end = span * 100
    focus = bpy.data.objects.new("Focus target", None)
    scene.collection.objects.link(focus)
    gemstones = [item for item in meshes if item.get("isGem")]
    focus.location = max(gemstones, key=lambda item: math.prod(item.dimensions)).matrix_world.translation if gemstones else center
    camera_data.dof.use_dof = settings["aperture"] > 0
    camera_data.dof.focus_object = focus
    camera_data.dof.aperture_fstop = max(1, settings["aperture"])
    make_area("Key softbox", center, span, (-1.2, -1.1, 1.8), 65, (1.6, 0.65), (1, 0.96, 0.89))
    make_area("Tall reflection strip", center, span, (1.3, 0.2, 0.9), 45, (0.2, 2), (0.85, 0.92, 1))
    make_area("Overhead edge", center, span, (-0.3, 1.0, 1.9), 75, (1.2, 0.25), (1, 1, 1))
    make_area("Front fill", center, span, (0, -2, 0.15), 14, (0.8, 1.4), (1, 1, 1))
    world = bpy.data.worlds.new("Neutral studio")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.22, 0.24, 0.28, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.22
    if settings["background"] != "Transparent":
        bpy.ops.mesh.primitive_plane_add(size=span * 200, location=(center.x, center.y, minimum.z - span * 0.0001))
        ground = bpy.context.object
        ground.name = "Studio ground"
        material = bpy.data.materials.new("Matte studio surface")
        material.use_nodes = True
        shader = material.node_tree.nodes.get("Principled BSDF")
        shader.inputs["Base Color"].default_value = (0.62, 0.58, 0.50, 1) if settings["background"] == "Ivory" else (0.017, 0.021, 0.023, 1)
        shader.inputs["Roughness"].default_value = 0.7
        ground.data.materials.append(material)
        if hasattr(ground.cycles, "is_caustics_receiver"):
            ground.cycles.is_caustics_receiver = True
    gem_shaders = []
    for material in bpy.data.materials:
        if not material.use_nodes:
            continue
        for shader in material.node_tree.nodes:
            if shader.type != "BSDF_PRINCIPLED":
                continue
            if shader.inputs["Transmission Weight"].default_value > 0.5 and not shader.inputs["IOR"].is_linked:
                gem_shaders.append((shader, shader.inputs["IOR"].default_value))
    bounds = {"minimumMetres": list(minimum), "maximumMetres": list(maximum), "spanMetres": span, "meshObjects": len(meshes)}
    return scene, gem_shaders, bounds


def render_outputs(scene, gem_shaders, job, settings, destination, progress):
    passes = ["red", "green", "blue"] if settings["transport"] == "Three-Band" else ["rgb"]
    sample_iors = job.get("gemIors", [2.402, 2.428, 2.459])
    if not isinstance(sample_iors, list) or len(sample_iors) != 3:
        raise ValueError("Three gemstone IOR samples are required.")
    sample_iors = [bounded(value, 1.5, 1, 4) for value in sample_iors]
    reference_ior = bounded(job.get("referenceIor"), 2.417, 1, 4)
    combined = None
    temporary_images = []
    for channel, name in enumerate(passes):
        progress({"phase": "rendering", "pass": name, "passIndex": channel + 1, "passCount": len(passes)})
        print(f"TJC: rendering {name} pass ({channel + 1}/{len(passes)})", flush=True)
        for shader, original_ior in gem_shaders:
            shader.inputs["IOR"].default_value = max(1.0001, original_ior + sample_iors[channel] - reference_ior) if len(passes) == 3 else original_ior
        scene.render.image_settings.file_format = "OPEN_EXR"
        scene.render.image_settings.color_depth = "32"
        scene.render.image_settings.exr_codec = "ZIP"
        scene.render.filepath = str(destination / f"pass-{name}.exr")
        cancelled = False
        def on_cancel(*unused):
            nonlocal cancelled
            cancelled = True

        bpy.app.handlers.render_cancel.append(on_cancel)
        try:
            result = bpy.ops.render.render(write_still=True)
        finally:
            bpy.app.handlers.render_cancel.remove(on_cancel)
        if cancelled or "CANCELLED" in result:
            raise KeyboardInterrupt("Render cancelled before the pass completed.")
        if not Path(scene.render.filepath).is_file():
            raise RuntimeError("The renderer did not write the expected EXR pass.")
        rendered = bpy.data.images.load(scene.render.filepath, check_existing=False)
        temporary_images.append(rendered)
        pixels = np.empty(settings["resolution"] ** 2 * 4, dtype=np.float32)
        rendered.pixels.foreach_get(pixels)
        pixels = pixels.reshape((-1, 4))
        if not np.isfinite(pixels).all():
            raise RuntimeError("The renderer produced non-finite image values.")
        if combined is None:
            combined = pixels.copy()
        if len(passes) == 3:
            combined[:, channel] = pixels[:, channel]
            combined[:, 3] = np.maximum(combined[:, 3], pixels[:, 3])
    for shader, original_ior in gem_shaders:
        shader.inputs["IOR"].default_value = original_ior
    progress({"phase": "compositing-and-saving", "passCount": len(passes)})
    result = bpy.data.images.new("Jewellery linear composite", width=settings["resolution"], height=settings["resolution"], alpha=True, float_buffer=True)
    result.pixels.foreach_set(combined.ravel())
    result.save_render(str(destination / "jewellery.exr"), scene=scene)
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_depth = "16"
    result.save_render(str(destination / "jewellery.png"), scene=scene)
    result.filepath_raw = str(destination / "jewellery.exr")
    for rendered in temporary_images:
        bpy.data.images.remove(rendered)
    scene.render.filepath = str(destination / "jewellery.png")
    bpy.ops.wm.save_as_mainfile(filepath=str(destination / "jewellery.blend"))
    return {"passes": passes, "gemMaterials": len(gem_shaders), "linearMaximum": float(combined[:, :3].max()), "linearMean": float(combined[:, :3].mean())}


def main():
    parser = argparse.ArgumentParser(description="Render a jewellery studio GLB with Blender Cycles.")
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--resolution", type=int)
    parser.add_argument("--samples", type=int)
    parser.add_argument("--device", choices=("auto", "cpu", "gpu"), default="cpu")
    parser.add_argument("--transport", choices=("RGB", "Three-Band"))
    parser.add_argument("--background", choices=("Charcoal", "Ivory", "Transparent"))
    arguments = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    source = arguments.source.expanduser().resolve()
    destination = arguments.output.expanduser().resolve()
    metadata, job, digest = read_asset(source)
    settings = {
        "resolution": int(bounded(arguments.resolution if arguments.resolution is not None else job.get("resolution"), 2048, 64, 8192)),
        "samples": int(bounded(arguments.samples if arguments.samples is not None else job.get("samples"), 256, 1, 4096)),
        "seed": int(bounded(job.get("seed"), 1, 0, 2147483647)),
        "maxBounces": int(bounded(job.get("maxBounces"), 24, 8, 64)),
        "transmissionBounces": int(bounded(job.get("transmissionBounces"), 20, 4, 64)),
        "transport": arguments.transport or job.get("transport", "RGB"),
        "background": arguments.background or job.get("background", "Charcoal"),
        "view": job.get("view", "Three-Quarter"),
        "aperture": bounded(job.get("aperture"), 0, 0, 64)
    }
    if settings["transport"] not in ("RGB", "Three-Band") or settings["background"] not in ("Charcoal", "Ivory", "Transparent") or settings["view"] not in ("Three-Quarter", "Profile", "Top"):
        raise ValueError("Unsupported render presentation option.")
    if settings["transport"] == "Three-Band" and not job:
        raise ValueError("Three-band transport requires an exported Cycles job containing IOR samples.")
    if destination.exists() and any(destination.iterdir()):
        raise ValueError("Choose an empty output directory; existing renders will not be overwritten.")
    destination.mkdir(parents=True, exist_ok=True)
    manifest = {"schema": "tjc.render-manifest.v1", "status": "running", "inputSha256": digest, "inputFile": source.name, "blenderVersion": bpy.app.version_string, "settings": settings, "asset": metadata, "productionValidated": False}
    manifest_path = destination / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    started = time.monotonic()
    def progress(details):
        manifest["progress"] = details
        manifest["elapsedSeconds"] = round(time.monotonic() - started, 3)
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    try:
        progress({"phase": "scene-setup"})
        scene, gem_shaders, bounds = prepare_scene(source, job, settings)
        progress({"phase": "device-selection"})
        manifest["device"] = configure_device(scene, arguments.device)
        manifest["bounds"] = bounds
        manifest["image"] = render_outputs(scene, gem_shaders, job, settings, destination, progress)
        manifest["status"] = "complete"
        manifest["progress"] = {"phase": "complete"}
        manifest["outputs"] = ["jewellery.png", "jewellery.exr", "jewellery.blend"]
    except BaseException as error:
        manifest["status"] = "cancelled" if isinstance(error, KeyboardInterrupt) else "failed"
        manifest["error"] = str(error)
        raise
    finally:
        manifest["elapsedSeconds"] = round(time.monotonic() - started, 3)
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"TJC render complete: {destination / 'jewellery.png'}", flush=True)


if __name__ == "__main__":
    main()
