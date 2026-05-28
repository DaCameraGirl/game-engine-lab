-- Solar2D (Corona SDK) — Engine Lab Demo
-- Endless runner: tap/click to jump, avoid obstacles, collect gems.
-- Run with the Solar2D Simulator.

local physics = require("physics")
physics.start()
physics.setGravity(0, 28)

local W, H = display.contentWidth, display.contentHeight
local score, speed, alive = 0, 3, true

-- Background
local bg = display.newRect(display.contentCenterX, display.contentCenterY, W, H)
bg:setFillColor(0.04, 0.04, 0.08)

-- Ground
local ground = display.newRect(W/2, H - 20, W, 40)
ground:setFillColor(0, 0.96, 1)
physics.addBody(ground, "static", { friction=0.5, bounce=0 })

-- Player ship
local player = display.newPolygon(80, H - 80, {
    0,-18, -14,14, -7,8, 0,18, 7,8, 14,14
})
player:setFillColor(0, 0.96, 1, 0.2)
player:setStrokeColor(0, 0.96, 1)
player.strokeWidth = 2
physics.addBody(player, "dynamic", { density=1, friction=0.3, bounce=0.1, radius=16 })
player.isFixedRotation = true

local jumpCount = 0
local maxJumps  = 2

-- Score display
local scoreTxt = display.newText({
    text = "SCORE: 0",
    x = 10, y = 20,
    font = native.systemFontBold,
    fontSize = 16,
    align = "left"
})
scoreTxt:setFillColor(0, 0.96, 1)
scoreTxt.anchorX = 0

-- HUD label
local hint = display.newText("TAP TO JUMP (double-jump enabled)", W/2, H-50, native.systemFont, 12)
hint:setFillColor(0.4, 0.4, 0.5)

-- Jump logic
local function doJump()
    if not alive then return end
    if jumpCount < maxJumps then
        player:setLinearVelocity(player:getLinearVelocity() * Vector2.new(1,0) or 0, -420)
        player:setLinearVelocity(0, -420)
        jumpCount = jumpCount + 1
    end
end

-- Reset jump on ground contact
local function onCollision(event)
    if event.phase == "began" and event.other == ground then
        jumpCount = 0
    end
end
player:addEventListener("collision", onCollision)

-- Input
Runtime:addEventListener("tap", function() doJump() end)
Runtime:addEventListener("key", function(e)
    if e.phase == "down" and (e.keyName == "space" or e.keyName == "up") then
        doJump()
    end
end)

-- Spawn obstacles and gems
local obstacles, gems = {}, {}

local function spawnObstacle()
    local h = math.random(30, 80)
    local obs = display.newRect(W + 20, H - 40 - h/2, 22, h)
    obs:setFillColor(1, 0, 0.4)
    physics.addBody(obs, "static", {})
    obs._speed = speed
    obs:addEventListener("collision", function(e)
        if e.other == player and alive then
            alive = false
            scoreTxt.text = "GAME OVER  //  FINAL: " .. score
            hint.text = "RESTART THE SIMULATOR TO PLAY AGAIN"
        end
    end)
    obstacles[#obstacles+1] = obs
end

local function spawnGem()
    local gem = display.newCircle(W + 20, H - math.random(80, 200), 8)
    gem:setFillColor(1, 0.93, 0, 0.3)
    gem:setStrokeColor(1, 0.93, 0)
    gem.strokeWidth = 2
    physics.addBody(gem, "static", { isSensor=true, radius=8 })
    gem:addEventListener("collision", function(e)
        if e.other == player then
            score = score + 50
            scoreTxt.text = "SCORE: " .. score
            gem:removeSelf()
        end
    end)
    gems[#gems+1] = gem
end

-- Game loop
local spawnDelay, spawnAcc = 1.8, 0
local frame = 0

Runtime:addEventListener("enterFrame", function(event)
    if not alive then return end

    local dt = event.time / 1000
    frame = frame + 1
    score = score + 1
    if frame % 10 == 0 then scoreTxt.text = "SCORE: " .. score end

    speed = 3 + score / 400

    spawnAcc = spawnAcc + (1/60)
    if spawnAcc >= spawnDelay then
        spawnObstacle()
        if math.random() > 0.5 then spawnGem() end
        spawnDelay = math.random() * 1.2 + 0.8
        spawnAcc = 0
    end

    for i = #obstacles, 1, -1 do
        local o = obstacles[i]
        o.x = o.x - speed * 2
        if o.x < -40 then o:removeSelf(); table.remove(obstacles, i) end
    end
    for i = #gems, 1, -1 do
        local g = gems[i]
        if g and g.x then
            g.x = g.x - speed * 2
            if g.x < -40 then g:removeSelf(); table.remove(gems, i) end
        end
    end
end)
