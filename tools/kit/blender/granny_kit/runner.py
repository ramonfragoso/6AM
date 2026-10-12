import os
import queue
import subprocess
import threading
import time

BAKE_SHARE = 0.8
PROGRESS_TAG = "GRANNY_PROGRESS"
WARNING_TAG = "GRANNY_WARNING"
COMPRESS_TAG = "COMPRESS_PROGRESS"
LOG_TAIL = 12


class ExportJob:
    def __init__(self, bake_command, compress_command, project_dir, environment, log_path, output_path):
        self.commands = [("bake", bake_command, None), ("compress", compress_command, project_dir)]
        self.environment = environment
        self.log_path = log_path
        self.output_path = output_path
        self.lines = queue.Queue()
        self.stage_index = -1
        self.process = None
        self.progress = 0.0
        self.message = "Starting"
        self.warnings = []
        self.tail = []
        self.started = time.time()
        self.finished = None
        self.error = None
        self.log = open(log_path, "w")

    @property
    def running(self):
        return self.finished is None

    @property
    def seconds(self):
        return (self.finished or time.time()) - self.started

    def start(self):
        self.next_stage()

    def next_stage(self):
        self.stage_index += 1
        _, command, directory = self.commands[self.stage_index]
        self.log.write(f"\n$ {' '.join(command)}\n")
        self.process = subprocess.Popen(
            command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1,
            env=self.environment, cwd=directory,
        )
        threading.Thread(target=self.read, args=(self.process,), daemon=True).start()

    def read(self, process):
        for line in process.stdout:
            self.lines.put(line.rstrip("\n"))

    def poll(self):
        while not self.lines.empty():
            self.handle(self.lines.get())
        if not self.running or self.process.poll() is None or not self.lines.empty():
            return
        if self.process.returncode != 0:
            self.fail(f"{self.commands[self.stage_index][0].capitalize()} step failed (exit {self.process.returncode})")
        elif self.stage_index + 1 < len(self.commands):
            self.next_stage()
        else:
            self.finish()

    def handle(self, line):
        self.log.write(line + "\n")
        self.log.flush()
        self.tail = (self.tail + [line])[-LOG_TAIL:]
        if line.startswith(PROGRESS_TAG):
            _, fraction, message = line.split(" ", 2)
            self.progress = float(fraction) * BAKE_SHARE
            self.message = message
        elif line.startswith(WARNING_TAG):
            self.warnings.append(line[len(WARNING_TAG) + 1:])
        elif line.startswith(COMPRESS_TAG):
            _, counter, name = (line.split(" ", 2) + [""])[:3]
            done, total = (int(n) for n in counter.split("/"))
            self.progress = BAKE_SHARE + (1 - BAKE_SHARE) * done / max(1, total)
            self.message = f"Compressing textures ({done + 1}/{total})"

    def finish(self):
        self.progress = 1.0
        size = os.path.getsize(self.output_path) / 1e6
        self.message = f"kit.glb updated: {size:.1f} MB in {self.seconds:.0f} s"
        self.close()

    def fail(self, reason):
        self.error = reason
        self.message = reason
        self.close()

    def cancel(self):
        if self.process and self.process.poll() is None:
            self.process.terminate()
        self.fail("Cancelled")

    def close(self):
        self.finished = time.time()
        self.log.close()
