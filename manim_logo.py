from manim import *

class ManimaticLogo(Scene):
    def construct(self):
        # Set background to black (brutalist theme)
        self.camera.background_color = "#000000"

        # Create the M shape using overlapping rectangles and polygons for sharp geometric brutalism
        
        # Left stem
        left_stem = Rectangle(width=0.8, height=4.0, color=WHITE, fill_opacity=1).set_stroke(width=0)
        left_stem.shift(LEFT * 1.5)
        
        # Right stem
        right_stem = Rectangle(width=0.8, height=4.0, color=WHITE, fill_opacity=1).set_stroke(width=0)
        right_stem.shift(RIGHT * 1.5)
        
        # Middle V part using a polygon
        # Coordinates: top-left, bottom-center, top-right, inner-right, inner-bottom, inner-left
        v_shape = Polygon(
            [-1.5, 2, 0],
            [0, -1.5, 0],
            [1.5, 2, 0],
            [0.5, 2, 0],
            [0, 0.5, 0],
            [-0.5, 2, 0],
            color=WHITE,
            fill_opacity=1
        ).set_stroke(width=0)

        logo = VGroup(left_stem, right_stem, v_shape)
        
        # Center the logo
        logo.move_to(ORIGIN)
        
        self.add(logo)
