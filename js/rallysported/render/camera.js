/*
 * Most recent known filename: js/render/camera.js
 *
 * Tarpeeksi Hyvae Soft 2018 /
 * RallySportED-js
 *
 */

"use strict";

Rsed.camera_n = (function()
{
    // The camera's position, in track tile units.
    const position = new Rsed.geometry_n.vector3_o(15, 0, 13);
    
    const direction = new Rsed.geometry_n.vector3_o(0, 0, 0);

    const moveSpeed = 0.4;

    const publicInterface = {};
    {
        // Restore the camera's default position.
        publicInterface.reset_camera_position = function()
        {
            position.x = 15;
            position.y = 0;
            position.z = 13;
        }

        publicInterface.move_camera = function(deltaX, deltaY, deltaZ, enforceBounds = true)
        {
            position.x += (deltaX * moveSpeed);
            position.y += (deltaY * moveSpeed);
            position.z += (deltaZ * moveSpeed);

            if (enforceBounds)
            {
                if (position.x < 0) position.x = 0;
                if (position.z < 1) position.z = 1;
                if (position.x > (Rsed.maasto_n.track_side_length() - this.view_width())) position.x = (Rsed.maasto_n.track_side_length() - this.view_width());
                if (position.z > (Rsed.maasto_n.track_side_length() - this.view_height()+1)) position.z = (Rsed.maasto_n.track_side_length() - this.view_height()+1);
            }
        }

        publicInterface.rotate_camera = function(rotX, rotY, rotZ)
        {
            Rsed.throw("This function has not yet been prepared for use.");
        }

        publicInterface.pos_x = function() { return position.x; }
        publicInterface.pos_y = function() { return position.y; }
        publicInterface.pos_z = function() { return position.z; }

        publicInterface.movement_speed = function() { return moveSpeed; }

        // How many tiles horizontally and vertically should be visible on screen with this camera.
        publicInterface.view_width = function() { return 17; }
        publicInterface.view_height = function() { return 17; }
    }
    return publicInterface;
})();