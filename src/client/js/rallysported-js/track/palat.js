/*
 * Most recent known filename: js/track/palat.js
 *
 * 2019 Tarpeeksi Hyvae Soft /
 * RallySportED-js
 *
 */

"use strict";

Rsed.track = Rsed.track || {};

// Provides information about and the means to modify a track's textures (which are called
// "PALA" in Rally-Sport). For more information about the track texture format used in Rally-
// Sport, check out https://github.com/leikareipa/rallysported/tree/master/docs.
//
// The palaWidth and palaHeight parameters give the dimensions of a single PALA texture; which
// would typically be 16 x 16. The data array contains the pixels of all of the track's PALA
// textures (normally, about 256 of them), arranged so that the first (width * height) bytes
// are the pixels of the first texture, the next (width * height) bytes those of the second
// texture, etc. Each byte in the array gives the corresponding pixel's RGB color as a palette
// index.
Rsed.track.palat = function(palaWidth = 0, palaHeight = 0, data = Uint8Array)
{
    Rsed.assert && (palaWidth === palaHeight)
                || Rsed.throw("Expected PALA width and height to be equal.");

    Rsed.assert && ((palaWidth > 0) &&
                    (palaHeight > 0))
                || Rsed.throw("Expected PALA width and height to be positive and non-zero.");

    const palatPixels = Array.from(data, (colorIdx)=>Rsed.visual.palette.color_at_idx(colorIdx, false));
    const palatPixelsWithAlpha = Array.from(data, (colorIdx)=>Rsed.visual.palette.color_at_idx(colorIdx, true));

    const palaSize = (palaWidth * palaHeight);

    // Pre-compute the individual PALA textures.
    const prebakedPalaTextures = new Array(256).fill().map((pala, idx)=>generate_texture(idx));

    const publicInterface = Object.freeze(
    {
        width: palaWidth,
        height: palaHeight,
        texture: Object.freeze(prebakedPalaTextures),

        // Rally-Sport by default has four different 'skins' for spectators, and decides
        // which skin a spectator will be given based on the spectator's XY ground tile
        // coordinates.
        //
        // This function returns the PALA index of the skin associated with the given
        // ground tile coordinates.
        spectator_pala_idx_at: function(tileX = 0, tileY = 0)
        {
            const firstSpectatorTexIdx = 236; // Index of the first PALA representing a (standing) spectator. Assumes consecutive arrangement.
            const numSkins = 4;
            const sameRows = ((Rsed.core.current_project().maasto.width === 128)? 16 : 32); // The game will repeat the same pattern of variants on the x axis this many times.

            const yOffs = (Math.floor(tileY / sameRows)) % numSkins;
            const texOffs = ((tileX + (numSkins - 1)) + (yOffs * (numSkins - 1))) % numSkins;

            const palaId = (firstSpectatorTexIdx + texOffs);

            return palaId;
        },

        // When used on ground tiles, some PALA textures are associated with billboards
        // - a flat upright polygon stood by the ground tile. For instance, spectators
        // and wooden poles are examples of billboards.
        //
        // This function returns the PALA texture index of the billboard associated
        // with the given PALA texture index; or null if the PALA index has no billboard
        // associated with it.
        billboard_idx: function(palaIdx, groundTileX = 0, groundTileZ = 0)
        {
            Rsed.throw_if_not_type("number", palaIdx,
                                             groundTileX,
                                             groundTileZ);

            switch (palaIdx)
            {
                // Spectators.
                case 240:
                case 241:
                case 242: return this.spectator_pala_idx_at(groundTileX, groundTileZ);

                // Shrubs.
                case 243: return 208;
                case 244: return 209;
                case 245: return 210;

                // Small poles.
                case 246:
                case 247: return 211;
                case 250: return 212;

                // Bridges.
                case 248:
                case 249: return 177;

                default: return null;
            }
        },
    });

    // Returns the given PALA's pixel data as a texture, whose arguments are set as given.
    function generate_texture(palaId = 0, args = {})
    {
        args =
        {
            ...{
                flipped: "vertical",
            },
            ...args,
        }
        
        const dataIdx = (palaId * palaSize);

        // For attempts to access the PALA data out of bounds, return a dummy texture.
        if ((dataIdx < 0) ||
            ((dataIdx + palaSize) >= data.byteLength))
        {
            return Rsed.visual.texture(
            {
                ...args,
                width: 1,
                height: 1,
                pixels: [Rsed.visual.palette.color_at_idx("black")],
                indices: [0],
            });
        }

        // Billboard PALAs will have alpha-testing enabled (so color index 0 is see-through),
        // while other PALAs will not.
        const isBillboardPala = ((palaId == 176) ||
                                 (palaId == 177) ||
                                ((palaId >= 208) && (palaId <= 239)));

        return Rsed.visual.texture(
        {
            ...args,
            width: palaWidth,
            height: palaHeight,
            pixels: (isBillboardPala? palatPixelsWithAlpha : palatPixels).slice(dataIdx, (dataIdx + palaSize)),
            indices: data.slice(dataIdx, (dataIdx + palaSize)),
            flipped: "no",
        });
    }
    
    return publicInterface;
};