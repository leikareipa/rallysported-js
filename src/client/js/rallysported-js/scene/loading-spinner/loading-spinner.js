/*
 * Most recent known filename: js/scene/loading-spinner/loading-spinner.js
 *
 * 2021 Tarpeeksi Hyvae Soft
 * 
 * Software: RallySportED-js
 *
 */

"use strict";

// Displays an infinite loading animation.
Rsed.scenes["loading-spinner"] = (function()
{
    let rotation = 0;

    // Rally-Sport's grassy texture.
    const texture = Rngon.texture_rgba({
        width: 16,
        height: 16,
        pixels: [
            8,64,16,255,	16,96,36,255,	24,128,48,255,	8,64,16,255,
            16,96,36,255,	24,128,48,255,	24,128,48,255,	16,96,36,255,
            8,64,16,255,	24,128,48,255,	24,128,48,255,	16,96,36,255,
            24,128,48,255,	16,96,36,255,	24,128,48,255,	16,96,36,255,
            24,128,48,255,	16,96,36,255,	8,64,16,255,	8,64,16,255,
            24,128,48,255,	24,128,48,255,	8,64,16,255,	16,96,36,255,
            16,96,36,255,	8,64,16,255,	24,128,48,255,	16,96,36,255,
            16,96,36,255,	8,64,16,255,	24,128,48,255,	16,96,36,255,
            8,64,16,255,	24,128,48,255,	16,96,36,255,	16,96,36,255,
            8,64,16,255,	24,128,48,255,	16,96,36,255,	24,128,48,255,
            24,128,48,255,	16,96,36,255,	8,64,16,255,	16,96,36,255,
            24,128,48,255,	16,96,36,255,	8,64,16,255,	24,128,48,255,
            24,128,48,255,	8,64,16,255,	24,128,48,255,	8,64,16,255,
            24,128,48,255,	16,96,36,255,	16,96,36,255,	16,96,36,255,
            16,96,36,255,	16,96,36,255,	24,128,48,255,	24,128,48,255,
            16,96,36,255,	8,64,16,255,	24,128,48,255,	8,64,16,255,
            8,64,16,255,	16,96,36,255,	8,64,16,255,	16,96,36,255,
            24,128,48,255,	8,64,16,255,	24,128,48,255,	16,96,36,255,
            16,96,36,255,	8,64,16,255,	16,96,36,255,	24,128,48,255,
            24,128,48,255,	24,128,48,255,	8,64,16,255,	24,128,48,255,
            16,96,36,255,	16,96,36,255,	16,96,36,255,	8,64,16,255,
            24,128,48,255,	24,128,48,255,	8,64,16,255,	24,128,48,255,
            8,64,16,255,	24,128,48,255,	8,64,16,255,	16,96,36,255,
            24,128,48,255,	24,128,48,255,	24,128,48,255,	8,64,16,255,
            8,64,16,255,	24,128,48,255,	24,128,48,255,	24,128,48,255,
            8,64,16,255,	24,128,48,255,	16,96,36,255,	24,128,48,255,
            8,64,16,255,	8,64,16,255,	24,128,48,255,	8,64,16,255,
            8,64,16,255,	24,128,48,255,	16,96,36,255,	24,128,48,255,
            24,128,48,255,	8,64,16,255,	24,128,48,255,	8,64,16,255,
            24,128,48,255,	16,96,36,255,	16,96,36,255,	16,96,36,255,
            8,64,16,255,	8,64,16,255,	8,64,16,255,	16,96,36,255,
            8,64,16,255,	8,64,16,255,	24,128,48,255,	24,128,48,255,
            8,64,16,255,	24,128,48,255,	8,64,16,255,	16,96,36,255,
            16,96,36,255,	16,96,36,255,	24,128,48,255,	16,96,36,255,
            24,128,48,255,	24,128,48,255,	24,128,48,255,	8,64,16,255,
            8,64,16,255,	16,96,36,255,	8,64,16,255,	16,96,36,255,
            16,96,36,255,	8,64,16,255,	16,96,36,255,	24,128,48,255,
            8,64,16,255,	24,128,48,255,	24,128,48,255,	8,64,16,255,
            8,64,16,255,	8,64,16,255,	16,96,36,255,	24,128,48,255,
            24,128,48,255,	8,64,16,255,	24,128,48,255,	8,64,16,255,
            8,64,16,255,	16,96,36,255,	8,64,16,255,	24,128,48,255,
            16,96,36,255,	8,64,16,255,	16,96,36,255,	16,96,36,255,
            16,96,36,255,	16,96,36,255,	24,128,48,255,	16,96,36,255,
            8,64,16,255,	16,96,36,255,	24,128,48,255,	24,128,48,255,
            8,64,16,255,	16,96,36,255,	16,96,36,255,	8,64,16,255,
            16,96,36,255,	16,96,36,255,	8,64,16,255,	24,128,48,255,
            8,64,16,255,	16,96,36,255,	24,128,48,255,	24,128,48,255,
            24,128,48,255,	16,96,36,255,	24,128,48,255,	8,64,16,255,
            16,96,36,255,	8,64,16,255,	16,96,36,255,	24,128,48,255,
            24,128,48,255,	24,128,48,255,	24,128,48,255,	24,128,48,255,
            24,128,48,255,	8,64,16,255,	24,128,48,255,	16,96,36,255,
            16,96,36,255,	16,96,36,255,	24,128,48,255,	8,64,16,255,
            24,128,48,255,	24,128,48,255,	8,64,16,255,	16,96,36,255,
            24,128,48,255,	24,128,48,255,	24,128,48,255,	8,64,16,255,
            24,128,48,255,	24,128,48,255,	8,64,16,255,	16,96,36,255,
            16,96,36,255,	16,96,36,255,	24,128,48,255,	24,128,48,255,
            24,128,48,255,	8,64,16,255,	24,128,48,255,	24,128,48,255,
            24,128,48,255,	16,96,36,255,	8,64,16,255,	16,96,36,255,
            8,64,16,255,	16,96,36,255,	24,128,48,255,	16,96,36,255,
            24,128,48,255,	16,96,36,255,	24,128,48,255,	8,64,16,255,
            8,64,16,255,	16,96,36,255,	8,64,16,255,	24,128,48,255,
            8,64,16,255,	8,64,16,255,	16,96,36,255,	16,96,36,255,
            16,96,36,255,	8,64,16,255,	24,128,48,255,	16,96,36,255,
            24,128,48,255,	24,128,48,255,	16,96,36,255,	16,96,36,255],
    });

    const scene = Rsed.scene(
    {
        draw_mesh: function()
        {
            rotation += 1;

            const point = Rngon.ngon([
                Rngon.vertex(-1, -1, 0, 0, 0),
                Rngon.vertex( 1, -1, 0, 1, 0),
                Rngon.vertex( 1,  1, 0, 1, 1),
                Rngon.vertex(-1,  1, 0, 0, 1)], {
                    texture,
                    textureMapping: "affine",
                    hasWireframe: true,
                    wireframeColor: Rngon.color_rgba(255, 255, 0),
            });

            const mesh = Rngon.mesh([point], {
                rotation: Rngon.rotation_vector(0, rotation, rotation),
            });
            
            const renderInfo = Rngon.render(Rsed.visual.canvas.domElement, [mesh],
            {
                cameraPosition: Rngon.translation_vector(0, 0, -18),
                scale: 0.5,
            });

            // If the rendering was resized since the previous frame...
            if ((renderInfo.renderWidth !== Rsed.visual.canvas.width ||
                (renderInfo.renderHeight !== Rsed.visual.canvas.height)))
            {
                Rsed.visual.canvas.width = renderInfo.renderWidth;
                Rsed.visual.canvas.height = renderInfo.renderHeight;
            }
            
            return;
        },

        draw_ui: function()
        {
            const width = Rsed.visual.canvas.width;
            const height = Rsed.visual.canvas.height;

            if ((width <= 0) || (height <= 0))
            {
                return;
            }

            Rsed.ui.draw.begin_drawing(Rsed.visual.canvas);

            const text = "Loading...";
            const textWidth = Rsed.ui.font.width_in_pixels(text);
            Rsed.ui.draw.string(text, ((width / 2) - (textWidth / 2)), ((height / 2) + 60));

            Rsed.ui.draw.finish_drawing(Rsed.visual.canvas);

            return;
        },
    });

    return scene;
})();