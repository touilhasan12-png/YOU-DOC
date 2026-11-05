from manim import *
import random

class LittleStar(Scene):
    def construct(self):
        self.camera.background_color = "#10172e"
        rng = random.Random(14)
        stars = VGroup(*[Dot([rng.uniform(-7,7),rng.uniform(-.2,3.8),0], radius=rng.uniform(.012,.035), color="#fff0c2") for _ in range(65)])
        hills = VGroup(Ellipse(width=19,height=4,fill_color="#263b53",fill_opacity=1,stroke_width=0).move_to([0,-3.5,0]), Ellipse(width=16,height=2.5,fill_color="#182b38",fill_opacity=1,stroke_width=0).move_to([-2,-3.7,0]))
        tail = Polygon([-1,-.5,0],[-2.1,.2,0],[-1.85,-.9,0],[-.8,-1,0],color="#e98b3e",fill_opacity=1,stroke_width=0)
        tip = Polygon([-2.1,.2,0],[-1.85,-.25,0],[-1.72,.02,0],color="#fff0d5",fill_opacity=1,stroke_width=0)
        body = Ellipse(width=1.35,height=1.3,fill_color="#eb8b3d",fill_opacity=1,stroke_width=0).move_to([-.3,-.75,0])
        ears = VGroup(Polygon([-.8,.3,0],[-.72,1.3,0],[-.17,.7,0],color="#eb8b3d",fill_opacity=1,stroke_width=0), Polygon([.05,.7,0],[.6,1.3,0],[.68,.3,0],color="#eb8b3d",fill_opacity=1,stroke_width=0))
        head = Circle(radius=.68,fill_color="#f49a49",fill_opacity=1,stroke_width=0).move_to([-.05,.35,0])
        muzzle = Ellipse(width=.9,height=.42,fill_color="#ffe6c5",fill_opacity=1,stroke_width=0).move_to([-.05,.06,0])
        eyes = VGroup(Dot([-.29,.42,0],radius=.047,color="#172039"),Dot([.19,.42,0],radius=.047,color="#172039"),Dot([-.05,.16,0],radius=.055,color="#172039"))
        scarf = RoundedRectangle(width=1.08,height=.19,corner_radius=.08,fill_color="#51c2bd",fill_opacity=1,stroke_width=0).move_to([-.08,-.27,0])
        scarf_end = Polygon([.2,-.3,0],[.5,-.36,0],[.42,-.86,0],[.15,-.75,0],color="#51c2bd",fill_opacity=1,stroke_width=0)
        feet = VGroup(Ellipse(width=.42,height=.19,fill_color="#743e36",fill_opacity=1,stroke_width=0).move_to([-.7,-1.35,0]),Ellipse(width=.42,height=.19,fill_color="#743e36",fill_opacity=1,stroke_width=0).move_to([.2,-1.35,0]))
        fox = VGroup(tail,tip,body,ears,head,muzzle,eyes,scarf,scarf_end,feet).scale(.85).shift(LEFT*2.4+DOWN*.85)
        star = Star(n=5, outer_radius=.38, inner_radius=.18, color="#ffdc75", fill_opacity=1, stroke_width=0).move_to([2,1.35,0])
        glow = Circle(radius=.65,fill_color="#ffdc75",fill_opacity=.12,stroke_width=0).move_to(star)
        title = Text("THE LITTLE STAR", font_size=36, color="#fff4dc").to_edge(UP, buff=.45)
        caption = Text("One quiet night, a fox found a fallen star.", font_size=24, color="#fff4dc").to_edge(DOWN,buff=.35)
        self.add(stars,hills,glow,star,fox,title,caption)
        c2 = Text("It had forgotten how to shine.",font_size=24,color="#fff4dc").move_to(caption)
        c3 = Text("So the fox stayed close and shared its warmth.",font_size=24,color="#fff4dc").move_to(caption)
        c4 = Text("Little by little, the light returned.",font_size=24,color="#fff4dc").move_to(caption)
        c5 = Text("Even a small kindness can light the way.",font_size=24,color="#fff4dc").move_to(caption)
        self.play(fox.animate.shift(RIGHT*.65), star.animate.shift(DOWN*.45), glow.animate.shift(DOWN*.45), run_time=3, rate_func=smooth)
        self.play(Transform(caption,c2),star.animate.shift(DOWN*.5+LEFT*.4),glow.animate.shift(DOWN*.5+LEFT*.4),run_time=3,rate_func=smooth)
        self.play(Transform(caption,c3),fox.animate.shift(RIGHT*.8),star.animate.scale(1.13),glow.animate.scale(1.2),run_time=3,rate_func=smooth)
        self.play(Transform(caption,c4),star.animate.shift(UP*1.1).scale(1.13),glow.animate.shift(UP*1.1).scale(1.1),run_time=3,rate_func=smooth)
        self.play(Transform(caption,c5),star.animate.shift(UP*.65+RIGHT*.4).rotate(PI/5),glow.animate.shift(UP*.65+RIGHT*.4),run_time=3,rate_func=smooth)
