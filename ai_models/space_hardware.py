#!/usr/bin/env python3
"""Switch the AI models Space between a demo GPU, free CPU, and paused.

    python ai_models/space_hardware.py status
    python ai_models/space_hardware.py gpu     # before a demo
    python ai_models/space_hardware.py cpu     # afterwards: free, slower
    python ai_models/space_hardware.py pause   # afterwards: free, AI offline

GPU time is billed per minute while the Space is starting or running, so the
gpu mode always sets a sleep timer as a safety net in case nobody switches it
back.
"""

from __future__ import annotations

import argparse

from huggingface_hub import HfApi, SpaceHardware


SPACE = "Atasatti20/Guardora_AI_models"
DEMO_GPU = SpaceHardware.T4_SMALL
GPU_SLEEP_SECONDS = 30 * 60


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("mode", choices=["status", "gpu", "cpu", "pause"])
    args = parser.parse_args()

    api = HfApi()
    if args.mode == "gpu":
        api.request_space_hardware(SPACE, DEMO_GPU, sleep_time=GPU_SLEEP_SECONDS)
    elif args.mode == "cpu":
        api.request_space_hardware(SPACE, SpaceHardware.CPU_BASIC)
    elif args.mode == "pause":
        api.pause_space(SPACE)

    runtime = api.get_space_runtime(SPACE)
    # A paused Space stays paused after a hardware change until restarted.
    if args.mode in {"gpu", "cpu"} and runtime.stage == "PAUSED":
        api.restart_space(SPACE)
        runtime = api.get_space_runtime(SPACE)

    print(
        f"{SPACE}: stage={runtime.stage} hardware={runtime.hardware} "
        f"requested={runtime.requested_hardware} sleep_time={runtime.sleep_time}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
