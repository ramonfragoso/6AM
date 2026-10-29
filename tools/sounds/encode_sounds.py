import os
import subprocess
import sys
from dataclasses import dataclass

import numpy as np

RATE = 48000
PEAK_DB = -1.0
SILENCE_BELOW_PEAK_DB = -45.0
EDGE_FADE_SECONDS = 0.01
TAIL_SECONDS = 0.03
HERE = os.path.dirname(os.path.abspath(__file__))
SOURCES = os.path.join(HERE, "sources")
OUTPUT = os.path.join(HERE, "..", "..", "public", "sounds")

MONO = 1
STEREO = 2


@dataclass
class Sound:
    source: str
    output: str
    channels: int
    bitrate: str
    trim: str = "both"
    loop_crossfade: float = 0.0
    keep_seconds: float = 0.0


SOUNDS = [
    Sound("clock_tick.flac", "clock/clock_tick.ogg", MONO, "64k"),
    Sound("clock_bug.wav", "clock/clock_bug.ogg", MONO, "64k"),
    Sound("clock_ring.mp3", "clock/clock_ring.ogg", MONO, "64k", trim="start"),
    Sound("candle.wav", "fire/candle.ogg", MONO, "64k", trim="none", loop_crossfade=1.0),
    Sound("ambient_loop.mp3", "ambience/ambient_loop.ogg", STEREO, "96k", trim="start", loop_crossfade=3.0),
    Sound("ambient_loop2.wav", "ambience/ambient_loop2.ogg", STEREO, "96k", trim="start", loop_crossfade=3.0),
    Sound("door_opening.mp3", "passage/door_opening.ogg", STEREO, "96k"),
    Sound("wood_step.mp3", "steps/wood_step.ogg", MONO, "64k"),
    Sound("tile_step.wav", "steps/tile_step.ogg", MONO, "64k"),
    Sound("wood_creak.ogg", "creaks/wood_creak.ogg", MONO, "64k"),
    Sound("wood_creak2.ogg", "creaks/wood_creak2.ogg", MONO, "64k"),
    Sound("wood_creak3.ogg", "creaks/wood_creak3.ogg", MONO, "64k"),
    Sound("piano_sting.wav", "stings/piano_sting.ogg", STEREO, "96k", trim="start"),
    Sound("piano_sting2.wav", "stings/piano_sting2.ogg", STEREO, "96k", trim="start"),
    Sound("violin_stinger.wav", "stings/violin_stinger.ogg", STEREO, "96k", trim="start"),
    Sound("violin_stinger2.flac", "stings/violin_stinger2.ogg", STEREO, "96k", trim="start"),
    Sound("violin_stinger3.flac", "stings/violin_stinger3.ogg", STEREO, "96k", trim="start"),
    Sound("jumpscare.mp3", "stings/jumpscare.ogg", STEREO, "96k", trim="start"),
    Sound("ending_music.mp3", "music/ending_music.ogg", STEREO, "128k", trim="none"),
    Sound("angry_door_slam.wav", "haunts/angry_door_slam.ogg", MONO, "64k"),
    Sound("door_slam.wav", "haunts/door_slam.ogg", MONO, "64k"),
    Sound("chair_move.aiff", "haunts/chair_move.ogg", MONO, "64k", trim="none", keep_seconds=0.7),
    Sound("crawling_bug.wav", "haunts/crawling_bug.ogg", MONO, "64k", trim="none"),
]


def decode(path, channels):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", str(channels), "-ar", str(RATE), "-f", "f32le", "-"],
        check=True,
        capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, channels).astype(np.float64)


def encode(samples, path, channels, bitrate):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-v", "error", "-y",
            "-f", "f32le", "-ar", str(RATE), "-ac", str(channels), "-i", "-",
            "-c:a", "libopus", "-b:a", bitrate, "-vbr", "on", "-application", "audio",
            "-map_metadata", "-1", path,
        ],
        input=samples.astype(np.float32).tobytes(),
        check=True,
    )


def decibels(db):
    return 10 ** (db / 20)


def trimmed(samples, ends):
    level = np.abs(samples).max(axis=1)
    audible = np.flatnonzero(level > level.max() * decibels(SILENCE_BELOW_PEAK_DB))
    fade = int(EDGE_FADE_SECONDS * RATE)
    start = max(audible[0] - fade, 0)
    end = min(audible[-1] + int(TAIL_SECONDS * RATE), len(samples)) if ends == "both" else len(samples)
    kept = samples[start:end].copy()
    kept[:fade] *= np.linspace(0, 1, fade)[:, None]
    if ends == "both":
        kept[-fade:] *= np.linspace(1, 0, fade)[:, None]
    return kept


def kept_start(samples, seconds):
    kept = samples[: int(seconds * RATE)].copy()
    fade = int(EDGE_FADE_SECONDS * RATE)
    kept[-fade:] *= np.linspace(1, 0, fade)[:, None]
    return kept


def seamless_loop(samples, seconds):
    overlap = int(seconds * RATE)
    angle = np.linspace(0, np.pi / 2, overlap)[:, None]
    tail = samples[-overlap:] * np.cos(angle)
    head = samples[:overlap] * np.sin(angle)
    return np.concatenate([samples[overlap:-overlap], tail + head])


def normalized(samples):
    return samples * (decibels(PEAK_DB) / np.abs(samples).max())


def build(sound):
    samples = decode(os.path.join(SOURCES, sound.source), sound.channels)
    if sound.trim != "none":
        samples = trimmed(samples, sound.trim)
    if sound.keep_seconds:
        samples = kept_start(samples, sound.keep_seconds)
    if sound.loop_crossfade:
        samples = seamless_loop(samples, sound.loop_crossfade)
    output = os.path.join(OUTPUT, sound.output)
    encode(normalized(samples), output, sound.channels, sound.bitrate)
    seconds = len(samples) / RATE
    print(f"{sound.output}: {seconds:.3f} s, {os.path.getsize(output) / 1024:.0f} KB")


def main(names):
    for sound in SOUNDS:
        if not names or sound.source in names or sound.output in names:
            build(sound)


if __name__ == "__main__":
    main(sys.argv[1:])
