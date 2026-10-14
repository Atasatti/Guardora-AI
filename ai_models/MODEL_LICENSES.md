# Model licenses: commercial use

Every model below is **enabled by default** so the full feature set runs in
development and demos. This file records which of them Guardora may use in a
paid product or a hosted service that customers use.

*This is an engineering summary of the upstream terms, not legal advice. Have
counsel confirm it before the first paying customer.*

## At a glance

| Feature | Model | License | Commercial use |
| --- | --- | --- | --- |
| Face detection | OpenCV YuNet | MIT | ✅ Yes |
| Banned-person recognition | OpenCV SFace | Apache-2.0 | ✅ Yes |
| Fire & smoke (live streams) | RF-DETR Small, trained by Guardora | Apache-2.0, trained on CC0 data | ✅ Yes |
| Text moderation | IBM Granite Guardian 3.0 2B (Ollama) | Apache-2.0 | ✅ Yes |
| Text moderation fallback (optional) | Google Gemini API | Google API terms | ✅ Yes, as a paid cloud API |
| Weapon & threat detection | Threat-Detection YOLOv8n | AGPL-3.0 (Ultralytics) | ❌ No |
| Fire & smoke (AI Lab comparison only) | Fire-Smoke YOLOv8n | AGPL-3.0 | ❌ No |
| Violence detection | X3D-M realtime checkpoint | Research / non-commercial | ❌ No |

## Commercial: safe to ship

**OpenCV YuNet** (`face_yunet/`, `face-detection-yunet`). MIT license in
`face_yunet/LICENSE`.

**OpenCV SFace** (`face_sface/`, `face-recognition-sface`). Apache-2.0 license
in `face_sface/LICENSE`. The software license permits commercial use. Storing
and matching faces of named people is still biometric processing, so consent,
retention and data-protection law apply independently of the model license.

**RF-DETR Small fire/smoke** (`fire_smoke_RFDETR/`,
`fire-smoke-rfdetr-small`). The RF-DETR code and the Small base weights are
Apache-2.0. Guardora fine-tuned it on the D-Fire dataset, which is released
under CC0-1.0 (public domain). Guardora owns the resulting weights. This is the
fire/smoke model the live streams use.

**IBM Granite Guardian 3.0 2B**. Apache-2.0. The backend runs it locally
through Ollama (`granite3-guardian:2b`).

**Google Gemini.** Used only when `GEMINI_API_KEY` is set. It is a cloud API,
not a model Guardora ships, so Google's API terms govern its use.

YuNet and SFace were trained by their authors on academic face datasets. The
model licenses themselves are permissive. Mention this when counsel reviews
the face features.

## Not commercial: development and demos only

**Threat-Detection YOLOv8n** (`weapon_threat_yolov8n/`,
`weapon-threat-yolov8n`). The upstream card is tagged MIT, but the model was
fine-tuned from Ultralytics YOLOv8n and runs on the `ultralytics` library.
Ultralytics states that all models trained with its framework are AGPL-3.0 by
default. AGPL-3.0 §13 counts serving users over a network as distribution, so
a hosted Guardora would have to publish its complete source under AGPL. That
conflicts with Guardora's proprietary license. The card also describes the
model as "for research and educational purposes", and the training dataset's
license is not stated.

**Fire-Smoke YOLOv8n** (`fire_smoke_yolov8n/`, `fire-smoke-yolov8n`). Declared
AGPL-3.0 upstream, with the same Ultralytics conditions. Live streams already
use RF-DETR instead, so this model only appears in the AI Lab for comparison.

**X3D-M violence checkpoint** (`violence_x3d/`, `violence-x3d`). The card is
tagged MIT, but its license section limits use to research and non-commercial
purposes. It was trained on RWF-2000, whose owners (SMIIP Lab) forbid
commercial use without their approval.

### Making these commercial

| Model | Options |
| --- | --- |
| Weapon YOLOv8n | Buy an Ultralytics Enterprise license, **or** train RF-DETR on licensed weapon footage (planned in `PRODUCTION_MODEL_PLAN.md`) |
| Fire-Smoke YOLOv8n | Nothing needed. RF-DETR already replaces it. |
| Violence X3D | Retrain X3D (PyTorchVideo, Apache-2.0) on footage Guardora has rights to, **or** get written approval from the RWF-2000 owners and the checkpoint author |

## Switching to commercial-only mode

Two environment variables on the AI service turn the non-commercial models
off. Both default to `true`.

```bash
GUARDORA_ALLOW_AGPL_MODELS=false      # both YOLOv8n models
GUARDORA_ALLOW_RESEARCH_MODELS=false  # X3D violence
```

With both set to `false`, face detection, banned-person recognition, RF-DETR
fire/smoke and text moderation keep working. Weapon and violence detection
show as disabled in the AI Lab, with the reason. The AI Lab badge on each model
also says `commercial OK` or `non-commercial`, and `GET /models` on the
service returns a `commercialUse` flag per model. The same flag is stored as
`commercial_use` in `models.json`.

## Sources

- Ultralytics licensing: <https://www.ultralytics.com/license>
- RF-DETR license: <https://github.com/roboflow/rf-detr>
- D-Fire dataset (CC0-1.0): <https://github.com/gaia-solutions-on-demand/DFireDataset>
- RWF-2000 terms: <https://github.com/mchengny/RWF2000-Video-Database-for-Violence-Detection>
- Granite Guardian 3.0 2B: <https://huggingface.co/ibm-granite/granite-guardian-3.0-2b>
- Upstream cards and licenses kept in each model directory
