#!/usr/bin/env python3
"""Deploy the AI models service to its Hugging Face Space as one commit.

Uploads the service code, every primary weight in models.json (including the
RF-DETR checkpoint, which is not in git) and the demo videos the surveillance
page streams. Files on the Space that are no longer part of the service are
removed. Hugging Face rebuilds the image after every commit.

The Hub rejects model binaries sent with a plain git push, which is why this
uses the Hub API instead of the backend's git subtree push.

    python ai_models/deploy_space.py
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

from huggingface_hub import CommitOperationAdd, CommitOperationDelete, HfApi


ROOT = Path(__file__).resolve().parent
REPO_ROOT = ROOT.parent
SPACE = "Atasatti20/Guardora_AI_models"
SERVICE_FILES = [
    "Dockerfile",
    "README.md",
    "MODEL_LICENSES.md",
    "models.json",
    "runtime_check.py",
    "verify_models.py",
    "service/app.py",
    "service/violence.py",
    "service/requirements.txt",
    "service/requirements-full.txt",
    "face_gallery/README.md",
    "fire_smoke_RFDETR/guardora_model_card.json",
]


def files_to_upload() -> dict[str, Path]:
    files = {name: ROOT / name for name in SERVICE_FILES}
    manifest = json.loads((ROOT / "models.json").read_text(encoding="utf-8"))
    for model in manifest["models"]:
        for weight in model["weights"]:
            files[weight["path"]] = ROOT / weight["path"]
        license_file = ROOT / model["local_dir"] / "LICENSE"
        if license_file.is_file():
            files[f"{model['local_dir']}/LICENSE"] = license_file
    for video in sorted((REPO_ROOT / "frontend" / "public" / "videos").glob("*.mp4")):
        files[f"videos/{video.name}"] = video

    missing = sorted(name for name, path in files.items() if not path.is_file())
    if missing:
        sys.exit("Missing files: " + ", ".join(missing))
    return files


def git(*args: str) -> str:
    return subprocess.run(
        ["git", *args], cwd=REPO_ROOT, capture_output=True, text=True, check=True
    ).stdout.strip()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--allow-dirty",
        action="store_true",
        help="deploy even if tracked files being uploaded have uncommitted changes",
    )
    args = parser.parse_args()

    files = files_to_upload()
    # Like the backend deploy: what runs on the Space should be a commit.
    dirty = git("status", "--porcelain", "--", *(str(path) for path in files.values()))
    if dirty and not args.allow_dirty:
        sys.exit(f"Commit these changes before deploying:\n{dirty}")

    api = HfApi()
    remote = set(api.list_repo_files(SPACE, repo_type="space"))
    operations: list[CommitOperationAdd | CommitOperationDelete] = [
        CommitOperationDelete(path_in_repo=name)
        for name in sorted(remote - set(files) - {".gitattributes"})
    ]
    operations += [
        CommitOperationAdd(path_in_repo=name, path_or_fileobj=str(path))
        for name, path in sorted(files.items())
    ]

    commit = api.create_commit(
        repo_id=SPACE,
        repo_type="space",
        operations=operations,
        commit_message=f"Deploy {git('rev-parse', '--short', 'HEAD')}",
    )
    print(f"Deployed {len(files)} files to {SPACE}: {commit.oid}")
    print(f"Build logs: https://huggingface.co/spaces/{SPACE}?logs=build")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
