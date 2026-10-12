import os

import bpy
import numpy as np

SAME_PIXELS = 1.5 / 255
FINGERPRINT_SAMPLES = 32


def to_srgb(linear):
    c = np.clip(linear, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def new_bake_image(name, width, height=None):
    if name in bpy.data.images:
        bpy.data.images.remove(bpy.data.images[name])
    return bpy.data.images.new(name, width, height or width, alpha=True, float_buffer=True)


def pixels(image):
    width, height = image.size
    data = np.empty(width * height * 4, np.float32)
    image.pixels.foreach_get(data)
    return data.reshape(height, width, 4)


def box_blur(data, passes):
    result = data
    for _ in range(passes):
        padded = np.pad(result, ((1, 1), (1, 1), (0, 0)), mode="edge")
        result = sum(
            padded[dy:dy + result.shape[0], dx:dx + result.shape[1]]
            for dy in range(3)
            for dx in range(3)
        ) / 9
    return result


def save_png(path, data, colorspace):
    height, width = data.shape[:2]
    rgba = data if data.shape[2] == 4 else np.concatenate([data, np.ones((height, width, 1))], -1)
    image = bpy.data.images.new("_granny_save", width, height, alpha=True)
    image.colorspace_settings.name = colorspace
    image.pixels.foreach_set(np.clip(rgba, 0, 1).astype(np.float32).ravel())
    os.makedirs(os.path.dirname(path), exist_ok=True)
    image.filepath_raw = path
    image.file_format = "PNG"
    image.save()
    bpy.data.images.remove(image)
    return path


def load_png(path, colorspace):
    image = bpy.data.images.load(path, check_existing=True)
    image.colorspace_settings.name = colorspace
    return image


def twin_sharing_loader():
    loaded = []

    def load(path, colorspace):
        image = load_png(path, colorspace)
        if any(entry[0] == image for entry in loaded):
            return image
        data = pixels(image)
        fingerprint = sampled(data)
        for twin, twin_colorspace, twin_fingerprint in loaded:
            if (
                twin_colorspace == colorspace
                and tuple(twin.size) == tuple(image.size)
                and np.abs(twin_fingerprint - fingerprint).max() <= SAME_PIXELS
                and np.abs(pixels(twin) - data).max() <= SAME_PIXELS
            ):
                bpy.data.images.remove(image)
                return twin
        loaded.append((image, colorspace, fingerprint))
        return image

    return load


def sampled(data):
    height, width = data.shape[:2]
    return data[:: max(1, height // FINGERPRINT_SAMPLES), :: max(1, width // FINGERPRINT_SAMPLES)].copy()


def downsized(data, size):
    height, width = data.shape[:2]
    if width <= size:
        return data
    factor = width // size
    return data.reshape(height // factor, factor, width // factor, factor, -1).mean((1, 3))
