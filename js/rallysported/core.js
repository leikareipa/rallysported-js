/*
 * Most recent known filename: js/main.js
 *
 * Tarpeeksi Hyvae Soft 2018 /
 * RallySportED-js
 *
 */

"use strict";

Rsed.core = (function()
{
    // Set to true while the core is running (e.g. as a result of calling run()).
    let isRunning = false;

    // The project we've currently got loaded. When the user makes edits or requests a save,
    // this is the target project.
    let project = Rsed.project.placeholder;

    const renderScalingMultiplier = 0.25;

    // Whether to display an FPS counter to the user.
    const fpsCounterEnabled = (()=>
    {
        const params = new URLSearchParams(window.location.search);
        return (params.has("showFramerate") && (Number(params.get("showFramerate")) === 1));
    })();

    // Initialize the renderer.
    const renderer = new Rsed.renderer_o("render_container", renderScalingMultiplier);
    {
        // This function will run before each frame is painted.
        renderer.set_prerefresh_callback(function()
        {
            // Create the scene mesh to be rendered.
            {
                renderer.meshes = [];

                if (Rsed.ui_view_n.current_view() !== "2d-topdown")
                {
                    renderer.register_mesh(Rsed.worldBuilder().track_mesh({x: Math.floor(Rsed.camera_n.pos_x()),
                                                                           y: 0,
                                                                           z: Math.floor(Rsed.camera_n.pos_z())}))
                }
            }

            Rsed.ui_input_n.enact_inputs();
        });

        // This function will be called whenever the size of the render surface changes.
        renderer.set_resize_callback(function()
        {
            Rsed.ui_draw_n.prebake_palat_pane();
        });
    }

    const htmlUI = (function()
    {
        const uiContainer = new Vue(
        {
            el: "#html-ui",
            data:
            {
                // The display name of the track that's currently open in the editor.
                trackName: "",

                propList: [],

                // Whether the UI should be displayed or kept invisible at this time.
                uiVisible: false,
            },
            methods:
            {
                // Called when the user selects a prop from the prop dropdown menu.
                /// TODO: Needs to be somewhere more suitable, and named something more descriptive.
                activate_prop: function(name = "")
                {
                    Rsed.core.current_project().props.change_prop_type(Rsed.core.current_project().track_id(),
                                                                       Rsed.ui_input_n.mouse_hover_args().trackId,
                                                                       Rsed.core.current_project().props.id_for_name(name));
                    window.close_dropdowns();

                    return;
                },
                
                refresh: function()
                {
                    this.trackName = Rsed.core.current_project().name;
                    this.propList = Rsed.core.current_project().props.names()
                                                    .filter(propName=>(!propName.startsWith("finish"))) /// Temp hack. Finish lines are not to be user-editable.
                                                    .map(propName=>({propName}));

                    return;
                }
            }
        });

        const publicInterface = {};
        {
            publicInterface.refresh = function()
            {
                uiContainer.refresh();

                return;
            };
    
            publicInterface.set_visible = function(isVisible)
            {
                uiContainer.uiVisible = isVisible;

                return;
            };
        }
        return publicInterface;
    })();

    const publicInterface =
    {
        // Starts up RallySportED with the given project to edit.
        run: async function(startupArgs = {})
        {
            Rsed.assert && ((typeof startupArgs.project.dataLocality !== "undefined") &&
                            (typeof startupArgs.editMode !== "undefined"))
                        || Rsed.throw("Missing startup parameters for launching RallySportED.");

            isRunning = false;

            // Hide the UI while we load up the project's data etc.
            htmlUI.set_visible(false);

            verify_browser_compatibility();

            await load_project(startupArgs);

            htmlUI.refresh();
            htmlUI.set_visible(true);

            isRunning = true;
        },

        // Terminate RallySporED with an error message.
        panic: (errorMessage)=>
        {
            renderer.indicate_error(errorMessage);
            htmlUI.set_visible(false);
            isRunning = false;
        },

        // Gets called when something is dropped onto RallySportED's render canvas. We expect
        // the drop to be a zip file containing the files of a RallySportED project for us to
        // load up. If it's not, we'll ignore the drop.
        drop_handler: function(event)
        {
            // Don't let the browser handle the drop.
            event.preventDefault();

            // See if the drop delivers a zip file.
            const zipFile = [].map.call(event.dataTransfer.items, (item)=>{return item.getAsFile()})
                                  .filter(file=>(file != null))
                                  .filter(file=>(file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase() === "zip"))
                                  [0] || null;
 
            if (!zipFile)
            {
                k_message("The drop contained no RallySportED zip files. Ignoring it.");
                return;
            }

            // Launch RallySportED with project data from the given zip file.
            this.run(
            {
                editMode: "local",
                project:
                {
                    dataLocality: "client",
                    dataIdentifier: zipFile,
                }
            });

            // Clear the address bar's parameters to reflect the fact that the user has loaded a local
            // track resource instead of specifying a server-side resource via the address bar.
            const basePath = (window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1));
            window.history.replaceState({}, document.title, basePath);
        },

        current_project: ()=>
        {
            Rsed.assert && (project !== null)
                        || Rsed.throw("Attempting to access an uninitialized project.");

            return project;
        },
        
        is_running: ()=>isRunning,
        render_width: ()=>renderer.render_width(),
        render_height: ()=>renderer.render_height(),
        render_latency: ()=>renderer.previousFrameLatencyMs,
        render_surface_id: ()=>renderer.renderSurfaceId,
        fps_counter_enabled: ()=>fpsCounterEnabled,
        scaling_multiplier: ()=>renderScalingMultiplier,
        mouse_pick_buffer_value_at: (x, y)=>renderer.mouse_pick_buffer_value_at(x, y),
    }

    return publicInterface;

    // Test various browser compatibility factors, and give the user messages of warning where appropriate.
    function verify_browser_compatibility()
    {
        // We expect to export projects with JSZip using blobs.
        /// TODO: Doesn't need to be checked in shared mode, since it doesn't use JSZip for saving.
        if (!JSZip.support.blob)
        {
            alert("NOTE: This browser doesn't support saving RallySportED projects. Any changes you make to a track in this session will be lost.");
        }
    }

    async function load_project(args = {})
    {
        Rsed.assert && ((typeof args.editMode !== "undefined") &&
                        (typeof args.project.dataIdentifier !== "undefined"))
                    || Rsed.throw("Missing required arguments for loading a project.");
            
        if (args.editMode === "shared")
        {
            await Rsed.shared_mode_n.register_as_participant_in_project(startupArgs.project.dataIdentifier);
        }
        else
        {
            Rsed.shared_mode_n.unregister_current_registration();
        }

        project = await Rsed.project(args.project);

        Rsed.apply_manifesto(project);
        
        Rsed.camera_n.reset_camera_position();

        Rsed.palette.set_palette(project.track_id() === 4? 1 :
                                 project.track_id() === 7? 3 : 0);

        /// TODO. This needs to be implemented in a better way and/or somewhere
        /// else - ideally so you don't have to manually start the poll loop;
        /// so you don't risk starting it twice or whatever.
        if (Rsed.shared_mode_n.enabled())
        {
            Rsed.shared_mode_n.start_polling_server();
        }
    }
})();
