# Guardora AI models service for a Hugging Face Docker Space.
# Deployed with deploy_space.py, which uploads the weights and demo videos too.
FROM python:3.11-slim

# git: Hugging Face runs a git config step in every Docker Space build.
# libgl1, libglib2.0-0: runtime libraries OpenCV needs.
RUN apt-get update \
 && apt-get install -y --no-install-recommends git libgl1 libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

# Spaces run the container as uid 1000.
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    GUARDORA_VIDEO_DIR=/home/user/app/videos \
    GUARDORA_FACE_GALLERY=/home/user/app/face_gallery
WORKDIR /home/user/app

# The default PyPI torch wheels include CUDA, so the same image runs on CPU
# Basic and on a GPU.
COPY --chown=user service/requirements.txt service/requirements-full.txt service/
RUN pip install --no-cache-dir --user -r service/requirements-full.txt

COPY --chown=user . .
# Fails the build if any weight is missing, corrupt or will not load.
RUN python runtime_check.py

EXPOSE 7860
CMD ["python", "-m", "uvicorn", "service.app:app", "--host", "0.0.0.0", "--port", "7860"]
