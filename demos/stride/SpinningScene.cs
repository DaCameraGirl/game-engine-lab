// Stride Engine — Engine Lab Demo
// Attach this script to any Entity in a Stride scene.
// The entity will spin, bob, and pulse its emissive color.
// Create: New Project → Empty Scene → Add Entity → Add Script Component → paste this file.

using System;
using Stride.Core.Mathematics;
using Stride.Engine;
using Stride.Input;
using Stride.Rendering;

namespace EngineLabDemo
{
    public class SpinningScene : SyncScript
    {
        public float SpinSpeed   = 60f;   // degrees/sec
        public float BobSpeed    = 1.5f;  // oscillations/sec
        public float BobHeight   = 0.4f;  // units
        public float PulseSpeed  = 2.0f;  // color pulse rate

        private float elapsed;
        private Vector3 originPos;
        private Material material;

        public override void Start()
        {
            originPos = Entity.Transform.Position;

            // Try to grab the first mesh component's material for color pulsing
            var mesh = Entity.Get<ModelComponent>();
            if (mesh?.Model?.Materials.Count > 0)
                material = mesh.Model.Materials[0].Material;
        }

        public override void Update()
        {
            float dt = (float)Game.UpdateTime.Elapsed.TotalSeconds;
            elapsed += dt;

            // Keyboard speed controls
            if (Input.IsKeyDown(Keys.Right)) SpinSpeed  = Math.Min(SpinSpeed  + 30f * dt, 360f);
            if (Input.IsKeyDown(Keys.Left))  SpinSpeed  = Math.Max(SpinSpeed  - 30f * dt, 0f);
            if (Input.IsKeyDown(Keys.Up))    BobSpeed   = Math.Min(BobSpeed   + 1f * dt, 6f);
            if (Input.IsKeyDown(Keys.Down))  BobSpeed   = Math.Max(BobSpeed   - 1f * dt, 0.2f);

            // Spin
            Entity.Transform.Rotation =
                Quaternion.RotationY(MathUtil.DegreesToRadians(SpinSpeed * elapsed));

            // Bob
            float bob = (float)Math.Sin(elapsed * BobSpeed * MathUtil.TwoPi) * BobHeight;
            Entity.Transform.Position = new Vector3(originPos.X, originPos.Y + bob, originPos.Z);

            // Pulse emissive between cyan and magenta
            float t = (float)(Math.Sin(elapsed * PulseSpeed) * 0.5 + 0.5);
            var cyan    = new Color4(0f,  0.96f, 1f,  1f);
            var magenta = new Color4(1f,  0f,    0.67f, 1f);
            var current = Color4.Lerp(ref cyan, ref magenta, t);

            DebugText.Print(
                $"ENGINE LAB  //  Stride Demo\n" +
                $"Spin: {SpinSpeed:F0} deg/s   Bob: {BobSpeed:F1}x\n" +
                $"[←/→] Speed   [↑/↓] Bob\n",
                new Int2(16, 16)
            );
        }
    }
}
