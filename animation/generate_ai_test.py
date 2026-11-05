from pathlib import Path
import torch
from optimum.intel.openvino import OVStableDiffusionPipeline

Path("ai_test_images").mkdir(exist_ok=True)
pipeline = OVStableDiffusionPipeline.from_pretrained("rupeshs/sd-turbo-openvino", ov_config={"CACHE_DIR": ""})
base = "2d animation film frame, same cute orange fox with teal scarf, standing on grassy hill, purple twilight, glowing star in sky, cinematic storybook illustration, consistent character, no words, "
actions = ["fox looking up", "fox looks at a shining star", "fox approaches the star", "fox gazes at the star", "fox watches the star rise"]
for i, action in enumerate(actions):
    print("Generating AI image", i+1, flush=True)
    image = pipeline(prompt=base+action, width=512, height=512, num_inference_steps=1, guidance_scale=1.0, generator=torch.Generator().manual_seed(17)).images[0]
    image.save(f"ai_test_images/frame_{i+1:04d}.png")
    print("Saved", i+1, flush=True)
