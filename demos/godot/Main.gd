extends Node2D

# Main scene script — spawns platforms and coins procedurally.
# GDScript note: this reads almost exactly like Python. That's intentional.

const PLATFORM_W = 96
const PLATFORM_H = 20
const COIN_RADIUS = 8

var rng := RandomNumberGenerator.new()
var platform_color := Color(0, 0.96, 1.0)   # cyan
var coin_color     := Color(1.0, 0.93, 0.0) # yellow
var bg_color       := Color(0.04, 0.04, 0.08)

func _ready() -> void:
    rng.randomize()
    RenderingServer.set_default_clear_color(bg_color)
    _spawn_ground()
    _spawn_platforms(8)
    _spawn_coins(12)

func _spawn_ground() -> void:
    var body := StaticBody2D.new()
    var shape := CollisionShape2D.new()
    var rect  := RectangleShape2D.new()
    rect.size = Vector2(640, 20)
    shape.shape = rect
    body.add_child(shape)
    body.position = Vector2(320, 390)
    add_child(body)

func _spawn_platforms(count: int) -> void:
    for i in range(count):
        var body := StaticBody2D.new()
        var shape := CollisionShape2D.new()
        var rect  := RectangleShape2D.new()
        rect.size = Vector2(PLATFORM_W, PLATFORM_H)
        shape.shape = rect

        var draw := ColorRect.new()
        draw.size = Vector2(PLATFORM_W, PLATFORM_H)
        draw.position = Vector2(-PLATFORM_W / 2.0, -PLATFORM_H / 2.0)
        draw.color = platform_color

        body.add_child(shape)
        body.add_child(draw)
        body.position = Vector2(
            rng.randf_range(60, 580),
            rng.randf_range(100, 340)
        )
        add_child(body)

func _spawn_coins(count: int) -> void:
    for i in range(count):
        var area   := Area2D.new()
        var shape  := CollisionShape2D.new()
        var circle := CircleShape2D.new()
        circle.radius = COIN_RADIUS
        shape.shape = circle

        area.position = Vector2(rng.randf_range(30, 610), rng.randf_range(60, 360))
        area.add_child(shape)
        area.connect("body_entered", _on_coin_collected.bind(area))
        add_child(area)

func _on_coin_collected(body: Node, area: Area2D) -> void:
    if body.has_method("collect_coin"):
        body.collect_coin()
        area.queue_free()
