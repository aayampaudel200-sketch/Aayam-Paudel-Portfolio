from PIL import Image
from pathlib import Path

images_dir = Path('assets/images')

conversions = [
    ('Documentation for visas.png', 'namaste-suman-visa-documentation.jpg', 'namaste-suman-visa-documentation.webp', (1600, 600)),
    ('namaste suman1.jpg', 'namaste-suman-storefront-gaindakot.jpg', 'namaste-suman-storefront-gaindakot.webp', (1200, 1600)),
    ('namaste suman 2.jpg', 'namaste-suman-service-counter.jpg', 'namaste-suman-service-counter.webp', (1200, 1600)),
    ('banner design.jpg', 'namaste-suman-flex-banner-design.jpg', 'namaste-suman-flex-banner-design.webp', (1177, 663)),
    ('card design.jpg', 'namaste-suman-visiting-card-design.jpg', 'namaste-suman-visiting-card-design.webp', (1200, 1615)),
    ('some extrs designs.jpg', 'namaste-suman-graphic-promotions.jpg', 'namaste-suman-graphic-promotions.webp', (1200, 1200)),
    ('anju-gyawali.jpg', 'anju-gyawali.jpg', 'anju-gyawali.webp', (640, 640)),
    ('aayam-paudel-web-developer-nepal.jpg', 'aayam-paudel-web-developer-nepal.jpg', 'aayam-paudel-web-developer-nepal.webp', (1122, 1402)),
    ('aayam-paudel-working-on-laptop.jpeg', 'aayam-paudel-working-on-laptop.jpeg', 'aayam-paudel-working-on-laptop.webp', (1536, 1024)),
    ('aayam-paudel-haat-bazzar-marketplace.jpg', 'aayam-paudel-haat-bazzar-marketplace.jpg', 'aayam-paudel-haat-bazzar-marketplace.webp', (1200, 750)),
    ('aayam-paudel-citizenship-recommendation-portal.jpg', 'aayam-paudel-citizenship-recommendation-portal.jpg', 'aayam-paudel-citizenship-recommendation-portal.webp', (1200, 750)),
    ('aayam-paudel-social-preview.jpg', 'aayam-paudel-social-preview.jpg', 'aayam-paudel-social-preview.webp', (1200, 630)),
    ('aayam-paudel-ai-car-drift.jpg', 'aayam-paudel-ai-car-drift.jpg', 'aayam-paudel-ai-car-drift.webp', (1280, 720)),
]

for src_name, jpg_name, webp_name, max_size in conversions:
    src_path = images_dir / src_name
    if not src_path.exists():
        print(f"Skipping {src_name}, not found")
        continue

    with Image.open(src_path) as im:
        if im.mode in ('RGBA', 'P') and jpg_name.endswith(('.jpg', '.jpeg')):
            rgb_im = Image.new('RGB', im.size, (255, 255, 255))
            if im.mode == 'RGBA':
                rgb_im.paste(im, mask=im.split()[3])
            else:
                rgb_im.paste(im.convert('RGB'))
            img_to_save = rgb_im
        else:
            img_to_save = im.convert('RGB') if im.mode != 'RGB' else im

        # If image exceeds max_size, resize keeping aspect ratio
        if img_to_save.size[0] > max_size[0] or img_to_save.size[1] > max_size[1]:
            img_to_save.thumbnail(max_size, Image.Resampling.LANCZOS)

        # Save optimized JPG if not overwriting same file with lower quality or if new file
        jpg_out = images_dir / jpg_name
        if src_name != jpg_name or src_name.endswith('.png'):
            img_to_save.save(jpg_out, 'JPEG', quality=85, optimize=True)
            print(f"Saved {jpg_name}: {jpg_out.stat().st_size} bytes (orig: {src_path.stat().st_size})")

        # Save WebP
        webp_out = images_dir / webp_name
        img_to_save.save(webp_out, 'WEBP', quality=82, method=6)
        print(f"Saved {webp_name}: {webp_out.stat().st_size} bytes")
