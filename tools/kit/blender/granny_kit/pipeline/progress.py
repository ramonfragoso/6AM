PROGRESS_TAG = "GRANNY_PROGRESS"
WARNING_TAG = "GRANNY_WARNING"
DETAIL_TAG = "GRANNY_DETAIL"


def report(fraction, message):
    print(f"{PROGRESS_TAG} {fraction:.3f} {message}", flush=True)


def warn(message):
    print(f"{WARNING_TAG} {message}", flush=True)


def detail(message):
    print(f"{DETAIL_TAG} {message}", flush=True)
