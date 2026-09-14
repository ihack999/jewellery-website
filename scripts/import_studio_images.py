"""Import reviewed built-in image edits; format conversion only, no pixel retouching.

Run once after adding approved entries to docs/studio-image-prompts.json.
Source PNGs and all original product photographs remain available.
"""
import json
import shutil
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
record = ROOT / 'docs/studio-image-prompts.json'
data = json.loads(record.read_text())
names = {
    'rise': ('rise-ring', 'the-rise-ring', 'rise-ring-polished'),
    'monogram': ('signature-monogram-ring', 'signature-monogram-ring', 'signature-monogram-ring'),
    'half-eternity': ('half-eternity-pinky-band', 'half-eternity-band-for-your-pinky', 'half-eternity-pinky-band'),
    'oval-bracelet': ('oval-bezel-diamond-bracelet', 'oval-bezel-diamond-bracelet', 'oval-bezel-diamond-bracelet'),
    'hand-chain': ('gold-bezel-hand-chain', 'diamond-hand-chain-bracelet', 'diamond-hand-chain'),
    'graduated-necklace': ('15-carat-graduated-diamond-tennis-necklace', '15-carat-graduated-diamond-tennis-necklace', 'graduated-diamond-necklace'),
    'estate-halo': ('estate-cushion-halo-diamond-ring', 'estate-cushion-halo-diamond-ring', 'estate-cushion-halo'),
    'blue-ring': ('pear-halo-ring', 'rare-blue-diamond-ring', 'rare-blue-diamond-ring'),
    'tennis-necklace': ('diamond-tennis-necklace', 'diamond-tennis-necklace', 'diamond-tennis-necklace'),
    'tennis-bracelet': ('diamond-bracelet-stack', 'diamond-tennis-bracelet', 'quiet-power-tennis-bracelet'),
    'yellow-earrings': ('vintage-halo-stud-earrings', 'yellow-diamond-oval-stud-earrings', 'yellow-diamond-oval-studs'),
    'cushion-ring': ('cushion-diamond-ring', 'cushion-cut-diamond-ring', 'cushion-cut-diamond-ring'),
    'patek-watch': (None, None, 'patek-philippe-detail'),
    'piaget-watch': (None, None, 'piaget-detail'),
    'royal-oak-watch': (None, None, 'royal-oak-detail'),
    'emerald-floral-earring': (None, None, 'emerald-floral-earring'),
    'white-birkin': (None, None, 'white-birkin'),
}
for job in data['jobs']:
    slug, url, stem = names[job['id']]
    job.update(slug=slug, urlSlug=url, asset=f'/assets/images/studio/{stem}.webp')
    source = ROOT / f'assets/images/studio/sources/{stem}.png'
    source.parent.mkdir(parents=True, exist_ok=True)
    if not source.exists():
        shutil.copy2(job['generatedPath'], source)
    with Image.open(source) as im:
        photo = ImageOps.exif_transpose(im).convert('RGB')
        photo.save(ROOT / job['asset'].lstrip('/'), 'WEBP', quality=90, method=6)
        job.update(width=photo.width, height=photo.height, source='/' + str(source.relative_to(ROOT)))
record.write_text(json.dumps(data, indent=2) + '\n')
print(f"Imported {len(data['jobs'])} approved studio images; originals preserved.")
