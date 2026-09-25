#!/bin/sh
# Re-downloads Google's official MediaPipe models used by the AR try-on into
# assets/models/ and verifies them against assets/models/SHA256SUMS.txt.
set -e
cd "$(dirname "$0")/../assets/models"
BASE="https://storage.googleapis.com/mediapipe-models"
get() { echo "→ $2"; curl -fL --retry 2 -o "$2.part" "$1" && mv "$2.part" "$2"; }
get "$BASE/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task" hand_landmarker.task
get "$BASE/face_landmarker/face_landmarker/float16/1/face_landmarker.task" face_landmarker.task
get "$BASE/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task" pose_landmarker_full.task
get "$BASE/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task" pose_landmarker_lite.task
get "$BASE/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite" hair_segmenter.tflite
if command -v sha256sum >/dev/null; then sha256sum -c SHA256SUMS.txt; else shasum -a 256 -c SHA256SUMS.txt; fi
