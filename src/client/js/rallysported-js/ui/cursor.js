/*
 * Most recent known filename: js/ui/cursor.js
 *
 * 2020 Tarpeeksi Hyvae Soft
 * 
 * Software: RallySportED-js
 * 
 */

"use strict";

Rsed.ui.cursor = (function()
{
    const cursors = {
        arrow: "./client/assets/cursors/rsed-cursor-arrow.png",
        openHand: "./client/assets/cursors/rsed-cursor-openhand.png",
        openHand2: "./client/assets/cursors/rsed-cursor-openhand2.png",
        closedHand: "./client/assets/cursors/rsed-cursor-closedhand.png",
        groundSmoothing: "./client/assets/cursors/rsed-cursor-arrowsmooth.png",
        blocked: "./client/assets/cursors/rsed-cursor-blocked.png",
    };

    cursors.default = cursors.arrow;

    let currentCursor = cursors.default;

    const publicInterface = {
        // Inspect the app's current state (e.g. of user input), and select
        // the most appropriate cursor.
        update_cursor: function()
        {
            const cursor = (()=>
            {
                const mouseHover = Rsed.ui.inputState.current_mouse_hover();
                const mouseGrab = Rsed.ui.inputState.current_mouse_grab();

                if (mouseGrab &&
                    (mouseGrab.type == "prop"))
                {
                    if (Rsed.ui.inputState.right_mouse_button_down())
                    {
                        return cursors.openHand2;
                    }

                    return cursors.closedHand;
                }

                if (mouseHover &&
                    (mouseHover.type == "prop"))
                {
                    return cursors.openHand;
                }

                if (Rsed.ui.groundBrush.brushSmoothens &&
                    (Rsed.core.current_scene() == Rsed.scenes["3d"]))
                {
                    return cursors.groundSmoothing;
                }

                return cursors.default;
            })();

            set_cursor(cursor);
            
            return;
        },
    };

    return publicInterface;

    function set_cursor(cursor = cursors.default)
    {
        if (!cursor)
        {
            cursor = cursors.default;
        }

        if (currentCursor == cursor)
        {
            return;
        }

        document.body.style.cursor = `url(${cursor}), auto`;
        currentCursor = cursor;

        return;
    }
})();
