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
            run_time=1.2
        )
        self.wait(0.2)
        
        # 4. Transform into the logo with a dynamic swooping path
        self.play(
            ReplacementTransform(text, ma_logo),
            run_time=1.5,
            path_arc=PI/3
        )
        
        # 5. Final polish: a subtle pulse to indicate locking into place
        self.play(
            ma_logo.animate.scale(1.05),
            run_time=0.4,
            rate_func=there_and_back
        )
        self.wait(1.5)
        
        # 6. Smooth reverse to create a perfect loop
        # We need a fresh text object for the reverse transform since the original was destroyed
        text_loop = Text("MANIMATIC", font="sans-serif", weight=BOLD, font_size=72)
        text_loop.set_color(WHITE)
        text_loop.arrange(RIGHT, buff=-0.1).move_to(ORIGIN)
        
        self.play(
            ReplacementTransform(ma_logo, text_loop),
            run_time=1.5,
            path_arc=-PI/3
        )
        
        self.play(
            text_loop.animate.arrange(RIGHT, buff=0.2).move_to(ORIGIN),
            run_time=1.2
        )
        
        # 7. Fade out gracefully
        self.play(FadeOut(text_loop, shift=DOWN*0.5, lag_ratio=0.1), run_time=1.5)
        self.wait(0.5)
