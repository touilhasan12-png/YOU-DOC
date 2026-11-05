from pathlib import Path
from PIL import Image
import torch
from optimum.intel.openvino import OVStableDiffusionPipeline

out = Path("storyboard_test")
out.mkdir(exist_ok=True)
pipeline = OVStableDiffusionPipeline.from_pretrained("rupeshs/sd-turbo-openvino", ov_config={"CACHE_DIR": ""})
prompt = "animation storyboard sheet, 15 equal rectangular panels arranged in exactly three columns and five rows, same small orange fox with blue scarf in every single panel, same fixed background, character gradually turns head to look at a golden star, continuous chronological action poses, clean 2d animation drawings, neat grid of equal sized frames, no text, no numbers"
img = pipeline(prompt=prompt, width=512, height=512, num_inference_steps=1, guidance_scale=1.0, generator=torch.Generator().manual_seed(74)).images[0].convert("RGB")
img.save(out/"storyboard.png")
w,h=img.size
frames=out/"frames"
frames.mkdir(exist_ok=True)
for row in range(5):
    for col in range(3):
        box=(round(col*w/3),round(row*h/5),round((col+1)*w/3),round((row+1)*h/5))
        img.crop(box).resize((512,512),Image.Resampling.LANCZOS).save(frames/f"frame_{row*3+col+1:04d}.png")
print("Saved storyboard and 15 crops; panel layout not verified.")
