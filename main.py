from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from rembg import remove
from PIL import Image, ImageFilter, ImageChops
import io
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("outputs", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")


@app.post("/create-sticker")
async def create_sticker(
    image: UploadFile = File(...),
    border_color: str = Form("white"),
    border_size: int = Form(10),
    shadow: str = Form("true"),          
):
    shadow_bool = shadow.lower() == "true"  

    # Read uploaded image
    image_data = await image.read()

    # Remove background
    removed_bg = remove(image_data)

    # Convert to RGBA
    img = Image.open(io.BytesIO(removed_bg)).convert("RGBA")

    PAD = 60  # padding on each side so border/shadow have room

    
    canvas_w = img.width  + PAD * 2
    canvas_h = img.height + PAD * 2

    # Place original image onto padded transparent canvas
    padded = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    padded.paste(img, (PAD, PAD), img)

    # Extract alpha from padded image — now has room to expand
    alpha = padded.split()[3]

    # Expand alpha outward using MaxFilter (creates the border thickness)
    filter_size = border_size * 2 + 1
    if filter_size % 2 == 0:
        filter_size += 1
    outline = alpha.filter(ImageFilter.MaxFilter(filter_size))

    # Optionally smooth the outline edge slightly
    outline = outline.filter(ImageFilter.GaussianBlur(1))

    # Border color map
    colors = {
        "white": (255, 255, 255, 255),
        "black": (0, 0, 0, 255),
        "red":   (255, 0, 0, 255),
        "blue":  (0, 0, 255, 255),
        "green": (0, 255, 0, 255),
        "pink":  (255, 20, 147, 255),
    }
    selected_color = colors.get(border_color, (255, 255, 255, 255))

    # Create border layer — same size as padded canvas
    border_layer = Image.new("RGBA", (canvas_w, canvas_h), selected_color)
    border_layer.putalpha(outline)         
    # Final composite canvas
    final = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))

    # Optional drop shadow
    if shadow_bool:                        
        shadow_alpha = outline.filter(ImageFilter.GaussianBlur(12))
        shadow_layer = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 180))
        shadow_layer.putalpha(shadow_alpha)  
        # Offset shadow slightly down-right
        final.paste(shadow_layer, (8, 8), shadow_layer)

    # Paste border behind image
    final = Image.alpha_composite(final, border_layer)

    # Paste original image on top
    final = Image.alpha_composite(final, padded)

    # Save
    save_path = "outputs/sticker.png"
    final.save(save_path)

    return {
        "message": "Sticker created!",
        "saved_to": f"https://kunjalsaharan25-sticker-studio-api.hf.space/{save_path}"
        "border_color": border_color,
        "shadow": shadow_bool,
    }