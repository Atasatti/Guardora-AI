# Third-party notices

Guardora's proprietary license applies only to original project material owned
by Ata Ul Haq (`@Atasatti`). It does not replace the licenses of dependencies,
AI models, model weights, or other third-party material.

## AI model pack

The model manifest in `ai_models/models.json` records immutable upstream
revisions and file checksums. `ai_models/MODEL_LICENSES.md` records which
models may be used commercially.

- Weapon Threat YOLOv8n — upstream declares MIT; trained with and run on
  Ultralytics, which is AGPL-3.0.
- Fire-Smoke YOLOv8n — upstream declares AGPL-3.0.
- Violence X3D — upstream model card describes MIT with
  research/non-commercial wording; trained on RWF-2000, which bars commercial
  use without the owners' approval.
- RF-DETR Small fire/smoke — RF-DETR is Apache-2.0; fine-tuned by Guardora on
  the D-Fire dataset (CC0-1.0).
- OpenCV YuNet — MIT.
- OpenCV SFace — Apache-2.0.

The upstream README, model card, and license files retained inside each model
directory control those materials.

## Software dependencies

JavaScript and Python dependencies are governed by their respective upstream
licenses. Package manifests and lockfiles identify the included dependencies.
Installing or distributing the project may create obligations under those
licenses.

## Assets and prior material

Any sample video, image, font, icon, or prior contribution not owned by
`@Atasatti` remains the property of its respective copyright owner and may only
be used according to its applicable terms.

