import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

RATE = 48000
PEAK = 0.8
BITRATE = "64k"
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "sounds", "clock")


def timeline(seconds):
    return np.arange(int(seconds * RATE)) / RATE


def resonance(t, frequency, decay, amplitude, phase=0.0):
    return amplitude * np.sin(2 * np.pi * frequency * t + phase) * np.exp(-t / decay)


def burst(rng, t, decay):
    return rng.normal(0, 1, t.size) * np.exp(-t / decay)


def place(track, sound, start):
    begin = int(start * RATE)
    end = min(track.size, begin + sound.size)
    track[begin:end] += sound[: end - begin]


def strike(rng, partials, length, click_decay=0.0007, thump=None):
    t = timeline(length)
    sound = 0.35 * burst(rng, t, click_decay)
    for frequency, decay, amplitude in partials:
        sound += resonance(t, frequency, decay, amplitude, rng.uniform(0, 2 * np.pi))
    if thump:
        frequency, decay, amplitude = thump
        sound += resonance(t, frequency, decay, amplitude)
    return sound


def escapement(rng, pitch):
    partials = [(3100 * pitch, 0.012, 1.0), (4870 * pitch, 0.008, 0.6), (7300 * pitch, 0.005, 0.35), (1450 * pitch, 0.02, 0.3)]
    track = np.zeros(int(0.12 * RATE))
    place(track, strike(rng, partials, 0.1, thump=(190 * pitch, 0.01, 0.25)), 0.0)
    place(track, 0.4 * strike(rng, partials, 0.08), 0.0065)
    return track


def clunk(rng):
    partials = [(880, 0.045, 1.0), (1730, 0.028, 0.55), (2650, 0.016, 0.4), (4100, 0.008, 0.25)]
    track = np.zeros(int(0.3 * RATE))
    place(track, strike(rng, partials, 0.25, click_decay=0.0012, thump=(120, 0.035, 0.8)), 0.0)
    for delay, level in ((0.018, 0.35), (0.034, 0.2), (0.047, 0.1)):
        place(track, level * strike(rng, partials[1:], 0.06), delay)
    return track


def glitch(rng, length=2.0):
    t = timeline(length)
    steps = np.cumsum(rng.normal(0, 1, t.size // 480 + 1)) * 40
    pitch = 1150 + np.repeat(steps, 480)[: t.size]
    whine = np.sin(2 * np.pi * np.cumsum(pitch) / RATE)
    whine += 0.5 * np.sin(2 * np.pi * np.cumsum(pitch * 2.01) / RATE)
    gate_rate = 13 + 17 * np.abs(np.sin(2 * np.pi * 0.7 * t))
    gate = (np.sin(2 * np.pi * np.cumsum(gate_rate) / RATE) > -0.2).astype(float)
    hum = 0.6 * np.sign(np.sin(2 * np.pi * 50 * t)) * np.exp(-((t - 1.0) ** 2) / 0.5)
    sound = (0.7 * whine + 0.25 * rng.normal(0, 1, t.size)) * gate + hum
    crushed = np.round(sound * 6) / 6
    hold = np.repeat(crushed[::6], 6)[: t.size]
    mix = np.where(np.sin(2 * np.pi * 3.3 * t) > 0.3, hold, crushed)
    stutter = mix.copy()
    chunk = int(0.04 * RATE)
    for start in rng.choice(np.arange(0, t.size - 3 * chunk, chunk), 8, replace=False):
        stutter[start + chunk:start + 2 * chunk] = mix[start:start + chunk]
    envelope = np.minimum(1, t / 0.02) * np.minimum(1, (length - t) / 0.15)
    return np.tanh(1.6 * stutter) * envelope


def bell(rng, fundamental, length):
    ratios = [(1.0, 0.6, 1.0), (2.76, 0.3, 0.5), (5.40, 0.22, 0.28), (8.93, 0.12, 0.14), (13.34, 0.07, 0.07)]
    partials = [(fundamental * ratio, decay, amplitude) for ratio, decay, amplitude in ratios]
    return strike(rng, partials, length, click_decay=0.0005)


def ring(rng, ringing=2.6, tail=1.0, strikes_per_second=19):
    track = np.zeros(int((ringing + tail) * RATE))
    bells = (bell(rng, 2350, tail + 0.3), bell(rng, 2490, tail + 0.3))
    period = 1 / strikes_per_second
    for index in range(int(ringing / period)):
        start = index * period + rng.normal(0, 0.0015)
        swell = min(1.0, 0.4 + index * period * 3)
        place(track, swell * bells[index % 2], max(0.0, start))
    return track


def normalized(sound):
    return sound / np.max(np.abs(sound)) * PEAK


def write_ogg(name, sound):
    os.makedirs(OUTPUT, exist_ok=True)
    samples = (normalized(sound) * 32767).astype(np.int16)
    with tempfile.TemporaryDirectory() as directory:
        source = os.path.join(directory, f"{name}.wav")
        with wave.open(source, "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(RATE)
            wav.writeframes(samples.tobytes())
        target = os.path.join(OUTPUT, f"{name}.ogg")
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", source, "-c:a", "libopus", "-b:a", BITRATE, target],
            check=True,
        )
    print(f"{target}: {sound.size / RATE:.2f} s")


def main():
    rng = np.random.default_rng(int(sys.argv[1]) if len(sys.argv) > 1 else 6)
    write_ogg("tick", escapement(rng, 1.0))
    write_ogg("tock", escapement(rng, 0.82))
    write_ogg("clunk", clunk(rng))
    write_ogg("glitch", glitch(rng))
    write_ogg("ring", ring(rng))


main()
