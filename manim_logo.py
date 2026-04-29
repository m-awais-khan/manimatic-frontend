from manim import *

class ManimaticLogo(Scene):
    def construct(self):
        self.camera.background_color = "#000000"
        
        # 1. Text Appears
        text = Text("MANIMATIC", font="sans-serif", weight=BOLD, font_size=72)
        text.set_color(WHITE)
        
        # Spread letters out slightly for a premium feel
        text.arrange(RIGHT, buff=0.2)
        text.move_to(ORIGIN)
        
        self.play(FadeIn(text, shift=UP*0.5, lag_ratio=0.1), run_time=1.5)
        self.wait(0.5)
        
        # 2. Build the Logo geometry (invisible at first)
        v1 = np.array([-2.5, -2, 0])
        v2 = np.array([-1.25, 2, 0])
        v3 = np.array([0, -0.8, 0])
        v4 = np.array([1.25, 2, 0])
        v5 = np.array([2.5, -2, 0])
        
        y_bar = -0.5
        x1 = (y_bar - 6) / 3.2
        x2 = (y_bar + 0.8) / -2.24
        
        p_bar_left = np.array([x1, y_bar, 0])
        p_bar_right = np.array([x2, y_bar, 0])

        thickness = 60
        
        m_path = VMobject(color=WHITE)
        m_path.set_points_as_corners([v1, v2, v3, v4, v5])
        m_path.set_stroke(width=thickness)
        
        bar = Line(p_bar_left, p_bar_right, color=WHITE, stroke_width=thickness)

        ma_logo = VGroup(m_path, bar)
        ma_logo.scale(0.8) # Scale down slightly to match text mass
        ma_logo.move_to(ORIGIN)
        
        # 3. Animate the compression
        # The letters squish together tightly in the center
        self.play(
            text.animate.arrange(RIGHT, buff=-0.1).move_to(ORIGIN),
            run_time=1.0
        )
        self.wait(0.2)
        
        # 4. The "Line Crush" Transition
        # Crush the text vertically until it becomes a thin bright line
        self.play(
            text.animate.stretch_to_fit_height(0.05),
            run_time=0.8,
            rate_func=rate_functions.ease_in_cubic
        )
        
        # Seamlessly swap the crushed text for an actual vector Line
        flat_line = Line(text.get_left(), text.get_right(), color=WHITE, stroke_width=10)
        self.add(flat_line)
        self.remove(text)
        
        # The line dynamically bends and transforms into the M/A logo
        self.play(
            ReplacementTransform(flat_line, ma_logo),
            run_time=1.2,
            rate_func=rate_functions.ease_out_elastic
        )
        
        # 5. Final polish: a subtle pulse to indicate locking into place
        self.play(
            ma_logo.animate.set_stroke(width=thickness + 10),
            run_time=0.4,
            rate_func=there_and_back
        )
        self.wait(1.5)
        
        # 6. Smooth reverse to create a perfect loop
        text_loop = Text("MANIMATIC", font="sans-serif", weight=BOLD, font_size=72)
        text_loop.set_color(WHITE)
        text_loop.arrange(RIGHT, buff=-0.1).move_to(ORIGIN)
        
        # Save original height before crushing
        original_height = text_loop.height
        text_loop.stretch_to_fit_height(0.05)
        
        flat_line_loop = Line(text_loop.get_left(), text_loop.get_right(), color=WHITE, stroke_width=10)
        
        self.play(
            ReplacementTransform(ma_logo, flat_line_loop),
            run_time=1.2,
            rate_func=rate_functions.ease_in_back
        )
        
        self.add(text_loop)
        self.remove(flat_line_loop)
        
        # Expand the text back to normal height
        self.play(
            text_loop.animate.stretch_to_fit_height(original_height),
            run_time=0.8,
            rate_func=rate_functions.ease_out_cubic
        )
        
        self.play(
            text_loop.animate.arrange(RIGHT, buff=0.2).move_to(ORIGIN),
            run_time=1.0
        )
        
        # 7. Fade out gracefully
        self.play(FadeOut(text_loop, shift=DOWN*0.5, lag_ratio=0.1), run_time=1.5)
        self.wait(0.5)
