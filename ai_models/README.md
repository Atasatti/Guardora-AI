---
title: Guardora AI models
emoji: 🛡️
colorFrom: blue
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
---

# Guardora AI model pack

Guardora uses local, open-source AI wherever a suitable model exists. Every
model is enabled by default. **`MODEL_LICENSES.md` records which ones may be
used commercially.** The full replacement/training roadmap is in
`PRODUCTION_MODEL_PLAN.md`.

| Capability | Current model | Commercial use |
| --- | --- | --- |
| Text moderation | Granite Guardian 3.0 2B via Ollama | Yes, Apache-2.0 |
| Face detection | OpenCV YuNet | Yes, MIT |
| Face recognition | OpenCV SFace | Yes, Apache-2.0 |
| Fire and smoke (live streams) | RF-DETR Small, trained on D-Fire | Yes, Apache-2.0 + CC0 data |
| Weapons and dangerous objects | Threat Detection YOLOv8n | No, AGPL-3.0 Ultralytics |
| Fire and smoke (AI Lab comparison) | Fire-Smoke YOLOv8n | No, AGPL-3.0 |
| Violence in video | Real-time X3D checkpoint | No, research-only |

Every source repository is pinned to an immutable commit in `models.json`.
Primary weight files also have their byte size and SHA-256 digest recorded
there. This makes the checked-in binaries reproducible and detects incomplete
downloads.

The RF-DETR checkpoint (`fire_smoke_RFDETR/checkpoint_best_total.pth`, 127 MB)
is over GitHub's file limit and is not published anywhere, so it is not
committed and `download_models.py` cannot fetch it. Copy it into
`fire_smoke_RFDETR/` by hand. Without it the service still starts and reports
the model as unavailable.

## Local text moderation

Install the practical 2B Granite Guardian model and keep Ollama running:

```bash
ollama pull granite3-guardian:2b
```

The backend defaults to `MODERATION_PROVIDER=ollama`,
`OLLAMA_URL=http://127.0.0.1:11434`, and
`OLLAMA_MODERATION_MODEL=granite3-guardian:2b`. A Gemini API key is optional
and is used only as a fallback.

## Verify

```bash
python3 verify_models.py
```

## Re-download

```bash
python3 -m pip install -r requirements.txt
python3 download_models.py
python3 verify_models.py
```

## Local WebSocket service

The service supplies the exact endpoints expected by the surveillance UI and
the AI Lab. The full model pack needs Python 3.10+ (RF-DETR requires it):

```bash
python3.10 -m venv .venv-ai
.venv-ai/bin/python -m pip install -r service/requirements-full.txt
.venv-ai/bin/python runtime_check.py
.venv-ai/bin/python -m uvicorn service.app:app \
  --host 127.0.0.1 --port 8001
```

All six vision models load at startup. Live streams run face recognition,
weapon detection and RF-DETR fire/smoke on every frame. The YOLO fire model and
X3D violence classifier are used in the AI Lab. On an Apple M-series machine
RF-DETR runs on the GPU (MPS) at about 60 ms a frame, and six concurrent streams
each sustain about 1.5 frames per second.

Check status at `http://127.0.0.1:8001/health` (send `x-ai-service-key` for the
per-model detail). Add authorized reference images to `face_gallery/` to enable
banned-person matching. With an empty gallery the service detects and annotates
faces but never raises an identity alert.

`service/requirements.txt` alone gives a light face-only service (no torch).
The other models then show as unavailable with the import error.

For a commercial deployment, turn off the models that are not licensed for it.
See `MODEL_LICENSES.md`:

```bash
GUARDORA_ALLOW_AGPL_MODELS=false GUARDORA_ALLOW_RESEARCH_MODELS=false \
  .venv-ai/bin/python -m uvicorn service.app:app \
  --host 127.0.0.1 --port 8001
```

Detection and recognition outputs require calibrated thresholds, human review,
audit logging, and representative local evaluation.

## Service authentication

Every endpoint is authenticated. The service refuses traffic that carries
neither credential, so both variables must be set before the streams work —
including locally.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `GUARDORA_AI_SERVICE_API_KEY` | Guardora API → service | Static shared key sent as `x-ai-service-key` on `/models`, `/lab/*`, `/gallery/*`, and `/face/match`. Must equal the API's `AI_SERVICE_API_KEY`. |
| `GUARDORA_AI_STREAM_TOKEN_SECRET` | Browser → service | HMAC secret used to verify the short-lived stream tokens the API mints for `/ws/*`, `/ws_camera/*`, and `/ws_face`. Must equal the API's `AI_STREAM_TOKEN_SECRET`. |

Browsers never hold the service key. The API authorises the request — including
camera ownership — then signs a token scoped to that one stream, and the service
verifies the signature, expiry, scope, and camera binding before accepting the
WebSocket. Keep `AI_STREAM_TOKEN_SECRET` distinct from `JWT_SECRET_KEY` so that
compromising this service cannot mint user sessions.

```bash
GUARDORA_AI_SERVICE_API_KEY="$(openssl rand -hex 32)" \
GUARDORA_AI_STREAM_TOKEN_SECRET="$(openssl rand -hex 32)" \
  .venv-ai/bin/python -m uvicorn service.app:app \
  --host 127.0.0.1 --port 8001
```

## AI Model Lab

The Guardora dashboard exposes an admin-only `/ai-lab` route for controlled
text, image, and video testing of every model, using the same service. Each
model's badge shows its license and whether it is cleared for commercial use.
Uploaded Model Lab media is limited to 50 MB and removed by the backend after
inference.

## Primary upstream references

- [IBM Granite Guardian](https://github.com/ibm-granite/granite-guardian)
- [RF-DETR](https://github.com/roboflow/rf-detr)
- [OpenCV YuNet](https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet)
- [OpenCV SFace](https://github.com/opencv/opencv_zoo/tree/main/models/face_recognition_sface)
- [PyTorchVideo](https://github.com/facebookresearch/pytorchvideo)
- [MMPose](https://github.com/open-mmlab/mmpose)
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
