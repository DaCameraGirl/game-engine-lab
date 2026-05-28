extends CharacterBody2D

const SPEED    = 200.0
const JUMP_VEL = -450.0
const GRAVITY  = 980.0

var score: int = 0
var lives: int = 3

@onready var sprite    = $Sprite2D
@onready var score_lbl = $HUD/ScoreLabel
@onready var lives_lbl = $HUD/LivesLabel

func _physics_process(delta: float) -> void:
    # Gravity
    if not is_on_floor():
        velocity.y += GRAVITY * delta

    # Jump
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = JUMP_VEL

    # Horizontal movement
    var dir = Input.get_axis("ui_left", "ui_right")
    velocity.x = dir * SPEED

    # Flip sprite based on direction
    if dir != 0:
        sprite.flip_h = dir < 0

    move_and_slide()

func collect_coin() -> void:
    score += 10
    score_lbl.text = "SCORE: %d" % score

func take_damage() -> void:
    lives -= 1
    lives_lbl.text = "LIVES: %d" % lives
    if lives <= 0:
        get_tree().reload_current_scene()
