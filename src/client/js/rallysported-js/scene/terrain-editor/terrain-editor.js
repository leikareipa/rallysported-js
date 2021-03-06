/*
 * Most recent known filename: js/scene/terrain-editor/terrain-editor.js
 *
 * 2019-2021 Tarpeeksi Hyvae Soft
 * 
 * Software: RallySportED-js
 *
 */

"use strict";

// A 3D view displaying the track's MAASTO and VARIMAA data. Lets the user edit
// these data.
Rsed.scenes["terrain-editor"] = (function()
{
    // Lets us keep track of mouse position delta between frames; e.g. for dragging props.
    let prevMousePos = {x:0, y:0};

    const sceneSettings = {
        // Whether to draw a wireframe around the scene's polygons. Note that we default to
        // not showing the wireframe on mobile devices, since we assume that they have small
        // screens and so not enough resolution to show the wireframe as anything but a
        // pixely mess.
        showWireframe: false,

        // Whether to show the PALAT pane; i.e. a side panel that displays all the available
        // PALA textures.
        showPalatPane: false,

        // Whether to render props (track-side 3d objects - like trees, billboards, etc.).
        showProps: true,

        // Whether the currently-selected brush PALA texture should be painted over the
        // ground tile over which the mouse cursor is currently hovering. This gives the
        // user a preview of what that texture would look like, without modifying the
        // tile's actual texture.
        showHoverPala: false,
    }
    
    // In which direction(s) the camera is currently moving. This is affected
    // by e.g. user input.
    const cameraMovement = {
        up: false,
        down: false,
        left: false,
        right: false,
        msSinceLastUpdate: 0,
        isMobileControls: false,
    };

    // Load UI components.
    let uiComponents = null;
    (async()=>
    {
        uiComponents = {
            activePala:   Rsed.ui.component.activePala.instance(),
            footerInfo:   Rsed.ui.component.groundHoverInfo.instance(),
            minimap:      Rsed.ui.component.tilemapMinimap.instance(),
            palatPane:    Rsed.ui.component.palatPane.instance(),
            fpsIndicator: Rsed.ui.component.fpsIndicator.instance(),
            viewLabel:    Rsed.ui.component.label.instance(),
        };
    })();

    const scene = Rsed.scene(
    {
        on_key_release: function(key)
        {
            function key_is(compared)
            {
                return (key.localeCompare(compared, undefined, {sensitivity: "accent"}) == 0);
            }

            if (key_is("s"))
            {
                cameraMovement.up = false;
            }
            else if (key_is("f"))
            {
                cameraMovement.down = false;
            }
            else if (key_is("e"))
            {
                cameraMovement.left = false;
            }
            else if (key_is("d"))
            {
                cameraMovement.right = false;
            }

            return;
        },

        on_key_fire: function(key, repeat = false)
        {
            function key_is(compared)
            {
                return (key.localeCompare(compared, undefined, {sensitivity: "accent"}) == 0);
            }
            
            if (key_is("s"))
            {
                cameraMovement.up = true;
            }
            else if (key_is("f"))
            {
                cameraMovement.down = true;
            }
            else if (key_is("e"))
            {
                cameraMovement.left = true;
            }
            else if (key_is("d"))
            {
                cameraMovement.right = true;
            }
            else if (key_is("a") && !repeat)
            {
                sceneSettings.showPalatPane = !sceneSettings.showPalatPane;

                // Prevent a mouse click from acting on the ground behind the pane when the pane
                // is brought up, and on the pane when the pane has been removed.
                Rsed.core.forceUpdateMouseHoverOnTickEnd = true;
            }
            else if (key_is("z"))
            {
                if (Rsed.ui.inputState.key_down("control") &&
                    Rsed.ui.inputState.key_down("shift"))
                {
                    Rsed.ui.undoStack.redo();
                }
                else if (Rsed.ui.inputState.key_down("control"))
                {
                    Rsed.ui.undoStack.undo();
                }
            }
            else if (key_is("y") &&
                     Rsed.ui.inputState.key_down("control") )
            {
                Rsed.ui.undoStack.redo();
            }
            else if (key_is("q"))
            {
                Rsed.$currentScene = "tilemap-editor";
            }
            else if (key_is("t"))
            {
                const mouseHover = Rsed.ui.inputState.current_mouse_hover();

                if (mouseHover && mouseHover.texture)
                {
                    Rsed.scenes["texture-editor"].set_texture(mouseHover.texture);
                }

                Rsed.$currentScene = "texture-editor";
            }
            else if (key_is("arrowup") ||
                     key_is("arrowdown"))
            {
                const mouseHover = Rsed.ui.inputState.current_mouse_hover();

                if (mouseHover && (mouseHover.type == "ground"))
                {
                    const delta = (key_is("arrowup")? 1 : -1);

                    Rsed.ui.groundBrush.apply_brush_to_terrain(Rsed.ui.groundBrush.brushAction.changeHeight,
                                                               delta,
                                                               mouseHover.groundTileX,
                                                               mouseHover.groundTileY);
                }
            }
            else if (key_is("w") && !repeat)
            {
                sceneSettings.showWireframe = !sceneSettings.showWireframe;
            }
            else if (key_is("g") && !repeat)
            {
                sceneSettings.showHoverPala = !sceneSettings.showHoverPala;
            }
            else if (key_is("l") && !repeat)
            {
                const newHeight = parseInt(window.prompt("Level the terrain to a height of..."), 10);

                if (!isNaN(newHeight))
                {
                    for (let y = 0; y < Rsed.$currentProject.maasto.height; y++)
                    {
                        for (let x = 0; x < Rsed.$currentProject.maasto.width; x++)
                        {
                            Rsed.ui.assetMutator.user_edit("maasto", {
                                command: "set-height",
                                target: {x, y},
                                data: newHeight,
                            });
                        }
                    }
                }
            }
            else if (key_is("b") && !repeat)
            {
                sceneSettings.showProps = !sceneSettings.showProps;
            }
            else if (key_is(" ") && !repeat)
            {
                Rsed.ui.groundBrush.brushSmoothens = !Rsed.ui.groundBrush.brushSmoothens;
            }
            else
            {
                for (const brushSizeKey of ["1", "2", "3", "4", "5"])
                {
                    if (key_is(brushSizeKey))
                    {
                        Rsed.ui.groundBrush.set_brush_size((brushSizeKey == 5)? 8 : (brushSizeKey - 1));
                    }
                }
            }

            return;
        },

        draw_ui: function()
        {
            if ((Rsed.visual.canvas.width <= 0) ||
                (Rsed.visual.canvas.height <= 0))
            {
                return;
            }

            Rsed.ui.draw.begin_drawing(Rsed.visual.canvas);

            if (uiComponents) // Once the UI components have finished async loading.
            {
                const margin = 4;

                if (!Rsed.browserMetadata.isMobile)
                {
                    uiComponents.viewLabel.update("Editor: Terrain");
                    uiComponents.viewLabel.draw(margin, margin);

                    uiComponents.activePala.update(sceneSettings);
                    uiComponents.activePala.draw((Rsed.visual.canvas.width - 88), margin);

                    uiComponents.footerInfo.update(sceneSettings);
                    uiComponents.footerInfo.draw(margin, (Rsed.visual.canvas.height - Rsed.ui.font.nativeHeight - 5));
                }

                uiComponents.minimap.update({camera: scene.camera});
                uiComponents.minimap.draw((Rsed.visual.canvas.width - margin), margin);

                if (sceneSettings.showPalatPane)
                {
                    uiComponents.palatPane.update(sceneSettings);
                    uiComponents.palatPane.draw((Rsed.visual.canvas.width - margin), 43);
                }

                if (Rsed.browserMetadata.has_url_param("showFPS"))
                {
                    uiComponents.fpsIndicator.update(sceneSettings);
                    uiComponents.fpsIndicator.draw(margin, 11);
                }
            }

            Rsed.ui.draw.finish_drawing(Rsed.visual.canvas);

            return;
        },

        draw_mesh: function()
        {
            move_camera();

            const trackMesh = scene.meshBuilder.track_mesh(
            {
                camera: scene.camera,
                jaggedCameraMovement: (cameraMovement.isMobileControls? false : true),
                solidProps: sceneSettings.showProps,
                includeWireframe: sceneSettings.showWireframe,
                paintHoverPala: sceneSettings.showHoverPala,
            });

            // Transform the n-gons into screen space using Rally-Sport's one-point perspective.
            {
                // The vanishing point. Defaults to the top middle of the screen, like in
                // the game.
                const vanishX = (Rngon.renderable_width_of(Rsed.visual.canvas.domElement, Rsed.visual.canvas.scalingFactor) / 2);
                const vanishY = (4 - (scene.camera.tilt * 2));

                for (const ngon of trackMesh.ngons)
                {
                    // We don't want the renderer applying proper perspective projection.
                    ngon.material.allowTransform = false;

                    for (const vertex of ngon.vertices)
                    {
                        // Tweak the ground mesh's positioning so it matches the game's.
                        vertex.y *= -1;
                        vertex.x += (Rsed.constants.groundTileSize * 2);
                        vertex.y += (Rsed.constants.groundTileSize * 1);
                        vertex.z += (Rsed.constants.groundTileSize * 14.5);
                        
                        // Transform the vertex into screen space via simple depth division
                        // toward the vanishing point.
                        const z = Math.max(Number.MIN_VALUE, (vertex.z / 600));
                        vertex.x = (vanishX + ((vertex.x - vanishX) / z));
                        vertex.y = (vanishY + ((vertex.y - vanishY) / z));
                    }
                }
            }

            const renderInfo = Rngon.render(Rsed.visual.canvas.domElement, [trackMesh],
            {
                cameraPosition: Rngon.translation_vector(0, 0, 0),
                cameraDirection: scene.camera.rotation(),
                scale: Rsed.visual.canvas.scalingFactor,
                fov: 30,
                nearPlane: 300,
                farPlane: 10000,
                clipToViewport: true,
                depthSort: "painter",
                useDepthBuffer: false,
                auxiliaryBuffers: [{buffer:Rsed.visual.canvas.mousePickingBuffer, property:"mousePickId"}],
                modules: {
                    ngonFill: Rsed.scenes["terrain-editor"].minimal_rngon_filler,
                    transformClipLight: Rsed.scenes["terrain-editor"].minimal_rngon_tcl,
                },
            });

            // If the rendering was resized since the previous frame...
            if ((renderInfo.renderWidth !== Rsed.visual.canvas.width ||
                (renderInfo.renderHeight !== Rsed.visual.canvas.height)))
            {
                Rsed.visual.canvas.width = renderInfo.renderWidth;
                Rsed.visual.canvas.height = renderInfo.renderHeight;

                window.close_dropdowns();
            }

            return;
        },

        handle_user_interaction: function()
        {
            handle_mouse_input();
            update_cursor_graphic();

            /// EXPERIMENTAL. Temporary testing of mobile controls.
            const touchDelta = Rsed.ui.inputState.get_touch_move_delta();
            scene.camera.move_by(-touchDelta.x, 0, -touchDelta.y);

            Rsed.visual.canvas.mousePickingBuffer.fill(null);
        },
    });

    function move_camera()
    {
        cameraMovement.isMobileControls = Rsed.browserMetadata.isMobile;
        cameraMovement.msSinceLastUpdate += Rsed.core.tickDeltaMs;

        if (cameraMovement.isMobileControls)
        {
            const movementSpeed = (0.03 * Rsed.core.tickDeltaMs);
            const cameraMoveVector = Rngon.vector3((cameraMovement.up? -1 : cameraMovement.down? 1 : 0),
                                                   0,
                                                   (cameraMovement.left? -1 : cameraMovement.right? 1 : 0));

            Rngon.vector3.normalize(cameraMoveVector);

            /// TODO: Implement Rngon.vector3.scale(movementMult). 
            cameraMoveVector.x *= (movementSpeed * 0.5);
            cameraMoveVector.y *= movementSpeed;
            cameraMoveVector.z *= movementSpeed;
            
            scene.camera.move_by(cameraMoveVector.x, cameraMoveVector.y, cameraMoveVector.z);
        }
        else
        {
            const msIntervalToMoveCamera = 30;

            if (cameraMovement.msSinceLastUpdate > msIntervalToMoveCamera)
            {
                const movementMult = Math.round(cameraMovement.msSinceLastUpdate / msIntervalToMoveCamera);
                const cameraMoveVector = Rngon.vector3((movementMult * (cameraMovement.up? -1 : cameraMovement.down? 1 : 0)),
                                                       0,
                                                       (movementMult * (cameraMovement.left? -1 : cameraMovement.right? 1 : 0)));

                scene.camera.move_by(cameraMoveVector.x, cameraMoveVector.y, cameraMoveVector.z);

                cameraMovement.msSinceLastUpdate = 0;
            }
        }

        return;
    }

    function update_cursor_graphic()
    {
        const cursors = Rsed.ui.cursorHandler.cursors;

        const currentCursor = (()=>
        {
            const mouseHover = Rsed.ui.inputState.current_mouse_hover();
            const mouseGrab = Rsed.ui.inputState.current_mouse_grab();

            if (mouseHover && mouseHover.cursor)
            {
                return mouseHover.cursor;
            }

            if (mouseGrab && (mouseGrab.type == "prop"))
            {
                if (Rsed.ui.inputState.right_mouse_button_down())
                {
                    return cursors.openHand2;
                }

                return cursors.closedHand;
            }

            if (mouseHover)
            {
                switch (mouseHover.type)
                {
                    case "prop": return cursors.openHand;
                    case "ground":
                    {
                        if (Rsed.ui.inputState.key_down("tab"))
                        {
                            return cursors.eyedropper;
                        }
                    }
                }
            }

            if (Rsed.ui.groundBrush.brushSmoothens)
            {
                return cursors.groundSmoothing;
            }

            return cursors.default;
        })();

        Rsed.ui.cursorHandler.set_cursor(currentCursor);
        
        return;
    }

    function handle_mouse_input()
    {
        if (Rsed.ui.inputState.mouse_wheel_scroll())
        {
            scene.camera.tilt_by(-Rsed.ui.inputState.mouse_wheel_scroll() / 2);
            Rsed.ui.inputState.reset_wheel_scroll();
        }

        if (Rsed.ui.inputState.mouse_button_down())
        {
            // Note: A mouse grab can be either a transient click or a longer
            // press.
            const grab = Rsed.ui.inputState.current_mouse_grab();
            const hover = Rsed.ui.inputState.current_mouse_hover();

            if (!grab) return;

            switch (grab.type)
            {
                case "ground":
                {
                    // Note: We'll access the mouse-picking info via hover instead of grab,
                    // since grab will be the tile over which the user pressed down the
                    // mouse button regardless of whether the mouse is moved after that;
                    // while hover indicates the tile over which the mouse - with the button
                    // held down - is currently over.
                    if (!hover) break;

                    if (hover.type !== "ground") break;

                    // Eyedropper.
                    if (Rsed.ui.inputState.left_mouse_button_down() &&
                        Rsed.ui.inputState.left_mouse_click_modifiers().includes("tab"))
                    {
                        const palaIdx = Rsed.$currentProject.varimaa.tile_at(hover.groundTileX, hover.groundTileY);

                        Rsed.ui.groundBrush.set_brush_pala_idx(palaIdx);

                        break;
                    }

                    // Add a new prop.
                    if (Rsed.ui.inputState.left_mouse_button_down() &&
                        Rsed.ui.inputState.left_mouse_click_modifiers().includes("shift"))
                    {
                        Rsed.ui.assetMutator.user_edit("prop", {
                            command: "add",
                            target: Rsed.$currentProject.props.id_for_name("tree"),
                            data: {
                                x: (hover.groundTileX * Rsed.constants.groundTileSize),
                                z: (hover.groundTileY * Rsed.constants.groundTileSize),
                            },
                        });

                        Rsed.ui.inputState.reset_mouse_hover();
                        Rsed.ui.inputState.reset_mouse_grab();

                        break;
                    }

                    // Raise/lower the terrain.
                    if (Rsed.ui.inputState.left_mouse_button_down() ||
                        Rsed.ui.inputState.right_mouse_button_down())
                    {
                        // Left button raises, right button lowers. Holding down Ctrl  reduces
                        // the rate of change.
                        const delta = (Rsed.ui.inputState.left_mouse_button_down()? 2 : -2);
                        
                        Rsed.ui.groundBrush.apply_brush_to_terrain(Rsed.ui.groundBrush.brushAction.changeHeight,
                                                                   delta,
                                                                   hover.groundTileX,
                                                                   hover.groundTileY);

                        break;
                    }

                    // Paint the terrain.
                    if (!Rsed.ui.inputState.key_down("shift") &&
                        Rsed.ui.inputState.mid_mouse_button_down())
                    {
                        Rsed.ui.groundBrush.apply_brush_to_terrain(Rsed.ui.groundBrush.brushAction.changePala,
                                                                   Rsed.ui.groundBrush.brush_pala_idx(),
                                                                   hover.groundTileX,
                                                                   hover.groundTileY);

                        break;
                    }

                    break;
                }
                
                case "prop":
                {
                    if (Rsed.ui.inputState.left_mouse_button_down())
                    {
                        // Remove the selected prop.
                        if (Rsed.ui.inputState.left_mouse_click_modifiers().includes("shift"))
                        {
                            Rsed.ui.assetMutator.user_edit("prop", {
                                command: "remove",
                                target: hover.propTrackIdx,
                            });

                            Rsed.ui.inputState.reset_mouse_hover();
                            Rsed.ui.inputState.reset_mouse_grab();
                        }
                        // Drag the prop.
                        else
                        {
                            // For now, don't allow moving the starting line (always prop #0).
                            if (grab.propTrackIdx === 0)
                            {
                                Rsed.alert("The finish line can't be moved.");

                                // Prevent the same input from registering again next frame, before
                                // the user has had time to release the mouse button.
                                Rsed.ui.inputState.reset_mouse_buttons_state();

                                break;
                            }
                            else
                            {
                                const mousePosDelta =
                                {
                                    x: (Rsed.ui.inputState.mouse_pos().x - prevMousePos.x),
                                    y: (Rsed.ui.inputState.mouse_pos().y - prevMousePos.y),
                                }

                                Rsed.ui.assetMutator.user_edit("prop", {
                                    command: "move",
                                    target: grab.propTrackIdx,
                                    data: {
                                        x: (mousePosDelta.x * 1.5),
                                        z: (mousePosDelta.y * 5),
                                    },
                                });
                            }
                        }
                    }

                    break;
                }

                default: break;
            }
        }

        prevMousePos = Rsed.ui.inputState.mouse_pos();

        return;
    }

    return scene;
})();
