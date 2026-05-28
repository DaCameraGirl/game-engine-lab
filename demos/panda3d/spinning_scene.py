from direct.showbase.ShowBase import ShowBase
from direct.task import Task
from direct.gui.OnscreenText import OnscreenText
from panda3d.core import (
    AmbientLight, DirectionalLight, PointLight,
    Vec4, Vec3, LColor, TextNode, WindowProperties
)
import math

class EngineLabDemo(ShowBase):
    def __init__(self):
        ShowBase.__init__(self)

        # Window setup
        props = WindowProperties()
        props.setTitle("The Engine Lab — Panda3D Demo")
        props.setSize(800, 600)
        self.win.requestProperties(props)

        self.setBackgroundColor(0.04, 0.04, 0.08, 1)
        self.disableMouse()

        # Load and position the default panda model
        self.panda_model = self.loader.loadModel("panda")
        self.panda_model.reparentTo(self.render)
        self.panda_model.setScale(0.25)
        self.panda_model.setPos(0, 12, -1)

        # Camera
        self.camera.setPos(0, -8, 3)
        self.camera.lookAt(0, 0, 0)

        # Lighting setup
        ambient = AmbientLight("ambient")
        ambient.setColor(LColor(0.2, 0.3, 0.4, 1))
        self.render.setLight(self.render.attachNewNode(ambient))

        sun = DirectionalLight("sun")
        sun.setColor(LColor(0.8, 0.9, 1.0, 1))
        sun_node = self.render.attachNewNode(sun)
        sun_node.setHpr(-30, -60, 0)
        self.render.setLight(sun_node)

        cyan_light = PointLight("cyan")
        cyan_light.setColor(LColor(0, 0.9, 1.0, 1))
        cyan_light.setAttenuation(Vec3(0, 0, 0.02))
        cyan_np = self.render.attachNewNode(cyan_light)
        cyan_np.setPos(-5, 8, 3)
        self.render.setLight(cyan_np)

        magenta_light = PointLight("magenta")
        magenta_light.setColor(LColor(1.0, 0, 0.65, 1))
        magenta_light.setAttenuation(Vec3(0, 0, 0.02))
        magenta_np = self.render.attachNewNode(magenta_light)
        magenta_np.setPos(5, 8, 3)
        self.render.setLight(magenta_np)

        # HUD
        OnscreenText(
            text="THE ENGINE LAB  //  Panda3D Demo",
            pos=(-1.3, 0.92), scale=0.055,
            fg=(0, 0.96, 1, 1), align=TextNode.ALeft, mayChange=False
        )
        self.score_text = OnscreenText(
            text="SPIN SPEED: 1.0x",
            pos=(-1.3, -0.9), scale=0.045,
            fg=(0, 1, 0.53, 1), align=TextNode.ALeft, mayChange=True
        )
        OnscreenText(
            text="[←/→] SPEED   [↑/↓] TILT   [ESC] QUIT",
            pos=(1.3, -0.9), scale=0.04,
            fg=(0.4, 0.4, 0.5, 1), align=TextNode.ARight, mayChange=False
        )

        self.spin_speed = 1.0
        self.tilt = 0.0
        self.elapsed = 0.0

        # Input
        self.accept("arrow_right",       lambda: self._adjust_speed(0.25))
        self.accept("arrow_left",        lambda: self._adjust_speed(-0.25))
        self.accept("arrow_up",          lambda: self._adjust_tilt(5))
        self.accept("arrow_down",        lambda: self._adjust_tilt(-5))
        self.accept("arrow_right-repeat",lambda: self._adjust_speed(0.25))
        self.accept("arrow_left-repeat", lambda: self._adjust_speed(-0.25))
        self.accept("escape",            self.userExit)

        self.taskMgr.add(self.update_loop, "update")

    def _adjust_speed(self, delta):
        self.spin_speed = max(0.0, min(5.0, self.spin_speed + delta))
        self.score_text.setText(f"SPIN SPEED: {self.spin_speed:.1f}x")

    def _adjust_tilt(self, delta):
        self.tilt = max(-45.0, min(45.0, self.tilt + delta))

    def update_loop(self, task):
        dt = globalClock.getDt()
        self.elapsed += dt

        # Spin and bob
        self.panda_model.setH(self.panda_model.getH() + self.spin_speed * 60 * dt)
        self.panda_model.setR(self.tilt)
        bob = math.sin(self.elapsed * 1.5) * 0.3
        self.panda_model.setZ(-1 + bob)

        # Orbit lights
        cx = math.cos(self.elapsed * 0.7) * 5
        cz = math.sin(self.elapsed * 0.7) * 3
        self.render.findAllMatches("**/cyan").getPath(0).setPos(cx, 8, cz)
        self.render.findAllMatches("**/magenta").getPath(0).setPos(-cx, 8, -cz)

        return Task.cont


app = EngineLabDemo()
app.run()
