/*
 * 2019, 2020 Tarpeeksi Hyvae Soft
 * 
 * Software: RallySportED-js
 * 
 * A stripped-down version of the retro n-gon renderer's polygon filler.
 * Includes only the features required by RallySportED-js, helping to
 * boost FPS.
 * 
 */

"use strict";

{ // A block to limit the scope of the unit-global variables we set up, below.

// We'll sort the n-gon's vertices into those on its left side and those on its
// right side.
const leftVerts = new Array(500);
const rightVerts = new Array(500);

// Then we'll organize the sorted vertices into edges (lines between given two
// vertices). Once we've got the edges figured out, we can render the n-gon by filling
// in the spans between its edges.
const leftEdges = new Array(500).fill().map(e=>({}));
const rightEdges = new Array(500).fill().map(e=>({}));

let numLeftVerts = 0;
let numRightVerts = 0;
let numLeftEdges = 0;
let numRightEdges = 0;

// Rasterizes into the internal pixel buffer all n-gons currently stored in the
// internal n-gon cache.
//
// Note: Consider this the inner render loop; it may contain ugly things like
// code repetition for the benefit of performance. If you'd like to refactor the
// code, please benchmark its effects on performance first - maintaining or
// improving performance would be great, losing performance would be bad.
//
Rngon.ngon_filler = function(auxiliaryBuffers = [])
{
    const pixelBuffer = Rngon.internalState.pixelBuffer.data;
    const renderWidth = Rngon.internalState.pixelBuffer.width;
    const renderHeight = Rngon.internalState.pixelBuffer.height;

    const vertexSorters =
    {
        verticalAscending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y < vertB.y)? -1 : 1)),
        verticalDescending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y > vertB.y)? -1 : 1))
    }

    // Rasterize the n-gons.
    for (let n = 0; n < Rngon.internalState.ngonCache.count; n++)
    {
        const ngon = Rngon.internalState.ngonCache.ngons[n];
        const material = ngon.material;
        const texture = ngon.material.texture;

        Rngon.assert && (ngon.vertices.length < leftVerts.length)
                     || Rngon.throw("Overflowing the vertex buffer");

        numLeftVerts = 0;
        numRightVerts = 0;
        numLeftEdges = 0;
        numRightEdges = 0;

        // In theory, we should never receive n-gons that have no vertices, but let's check
        // to make sure.
        if (ngon.vertices.length <= 0)
        {
            continue;
        }

        // Rasterize a line.
        if (ngon.vertices.length === 2)
        {
            Rngon.line_draw(ngon.vertices[0], ngon.vertices[1], material.color, n, false);

            continue;
        }
        // Rasterize a polygon with 3 or more vertices.
        else
        {
            // Figure out which of the n-gon's vertices are on its left side and which on the
            // right. The vertices on both sides will be arranged from smallest Y to largest
            // Y, i.e. top-to-bottom in screen space. The top-most vertex and the bottom-most
            // vertex will be shared between the two sides.
            {
                // Generic algorithm for n-sided convex polygons.
                {
                    // Sort the vertices by height from smallest Y to largest Y.
                    ngon.vertices.sort(vertexSorters.verticalAscending);

                    const topVert = ngon.vertices[0];
                    const bottomVert = ngon.vertices[ngon.vertices.length-1];

                    leftVerts[numLeftVerts++] = topVert;
                    rightVerts[numRightVerts++] = topVert;

                    // Trace a line along XY between the top-most vertex and the bottom-most vertex;
                    // and for the intervening vertices, find whether they're to the left or right of
                    // that line on X. Being on the left means the vertex is on the n-gon's left side,
                    // otherwise it's on the right side.
                    for (let i = 1; i < (ngon.vertices.length - 1); i++)
                    {
                        const lr = Rngon.lerp(topVert.x, bottomVert.x, ((ngon.vertices[i].y - topVert.y) / (bottomVert.y - topVert.y)));

                        if (ngon.vertices[i].x >= lr)
                        {
                            rightVerts[numRightVerts++] = ngon.vertices[i];
                        }
                        else
                        {
                            leftVerts[numLeftVerts++] = ngon.vertices[i];
                        }
                    }

                    leftVerts[numLeftVerts++] = bottomVert;
                    rightVerts[numRightVerts++] = bottomVert;
                }
            }

            // Create edges out of the vertices.
            {
                for (let l = 1; l < numLeftVerts; l++) add_edge(leftVerts[l-1], leftVerts[l], true);
                for (let r = 1; r < numRightVerts; r++) add_edge(rightVerts[r-1], rightVerts[r], false);

                function add_edge(vert1, vert2, isLeftEdge)
                {
                    const startY = Math.min(renderHeight, Math.max(0, Math.round(vert1.y)));
                    const endY = Math.min(renderHeight, Math.max(0, Math.round(vert2.y)));
                    const edgeHeight = (endY - startY);
                    
                    // Ignore horizontal edges.
                    if (edgeHeight === 0) return;

                    const startX = Math.min(renderWidth, Math.max(0, Math.round(vert1.x)));
                    const endX = Math.min(renderWidth, Math.max(0, Math.ceil(vert2.x)));
                    const deltaX = ((endX - startX) / edgeHeight);

                    const edge = (isLeftEdge? leftEdges[numLeftEdges++] : rightEdges[numRightEdges++]);
                    edge.startY = startY;
                    edge.endY = endY;
                    edge.startX = startX;
                    edge.deltaX = deltaX;
                }
            }

            // Draw the n-gon. On each horizontal raster line, there will be two edges: left and right.
            // We'll render into the pixel buffer each horizontal span that runs between the two edges.
            if (material.hasFill)
            {
                let curLeftEdgeIdx = 0;
                let curRightEdgeIdx = 0;
                let leftEdge = leftEdges[curLeftEdgeIdx];
                let rightEdge = rightEdges[curRightEdgeIdx];
                
                if (!numLeftEdges || !numRightEdges) continue;

                // Note: We assume the n-gon's vertices to be sorted by increasing Y.
                const ngonStartY = leftEdges[0].startY;
                const ngonEndY = leftEdges[numLeftEdges-1].endY;
                
                // Rasterize the n-gon in horizontal pixel spans over its height.
                for (let y = ngonStartY; y < ngonEndY; y++)
                {
                    const spanStartX = Math.min(renderWidth, Math.max(0, Math.round(leftEdge.startX)));
                    const spanEndX = Math.min(renderWidth, Math.max(0, Math.round(rightEdge.startX)));
                    const spanWidth = ((spanEndX - spanStartX) + 1);

                    if (spanWidth > 0)
                    {
                        // Assumes the pixel buffer consists of 4 elements per pixel (e.g. RGBA).
                        let pixelBufferIdx = (((spanStartX + y * renderWidth) * 4) - 4);

                        // Draw the span into the pixel buffer.
                        for (let x = spanStartX; x < spanEndX; x++)
                        {
                            // Will hold the texture coordinates used if we end up drawing
                            // a textured pixel at the current x,y screen location.
                            let u = 0.0, v = 0.0;

                            // Update values that're interpolated horizontally along the span.
                            pixelBufferIdx += 4;

                            // The color we'll write into the pixel buffer for this pixel; assuming
                            // it passes the alpha test, the depth test, etc.
                            let red = 0;
                            let green = 0;
                            let blue = 0;

                            // Solid fill.
                            if (!texture)
                            {
                                red   = material.color.red;
                                green = material.color.green;
                                blue  = material.color.blue;
                            }
                            // Textured fill.
                            else
                            {
                                // Screen-space UV mapping, as used e.g. in the DOS game Rally-Sport.
                                {
                                    const ngonHeight = (ngonEndY - ngonStartY);

                                    // Pixel coordinates relative to the polygon.
                                    const ngonX = (x - spanStartX + 1);
                                    const ngonY = (y - ngonStartY + 1);

                                    u = (ngonX * (texture.width / spanWidth));
                                    v = (ngonY * (texture.height / ngonHeight));

                                    // The texture image is flipped, so we need to flip V as well.
                                    v = (texture.height - v);
                                }

                                const texel = texture.pixels[(~~u) + (~~v) * texture.width];

                                // Make sure we gracefully exit if accessing the texture out of bounds.
                                if (!texel) continue;

                                // Alpha-test the texture. If the texel isn't fully opaque, skip it.
                                if (texel.alpha !== 255) continue;

                                red   = (texel.red   * material.color.unitRange.red);
                                green = (texel.green * material.color.unitRange.green);
                                blue  = (texel.blue  * material.color.unitRange.blue);
                            }

                            // The pixel passed its alpha test, depth test, etc., and should be drawn
                            // on screen.
                            {
                                pixelBuffer[pixelBufferIdx + 0] = red;
                                pixelBuffer[pixelBufferIdx + 1] = green;
                                pixelBuffer[pixelBufferIdx + 2] = blue;
                                pixelBuffer[pixelBufferIdx + 3] = 255;

                                for (let b = 0; b < auxiliaryBuffers.length; b++)
                                {
                                    if (material.auxiliary[auxiliaryBuffers[b].property] !== null)
                                    {
                                        // Buffers are expected to consist of one element per pixel.
                                        auxiliaryBuffers[b].buffer[pixelBufferIdx/4] = material.auxiliary[auxiliaryBuffers[b].property];
                                    }
                                }
                            }
                        }
                    }

                    // Update values that're interpolated vertically along the edges.
                    {
                        leftEdge.startX      += leftEdge.deltaX;
                        rightEdge.startX     += rightEdge.deltaX;
                    }

                    // We can move onto the next edge when we're at the end of the current one.
                    if (y === (leftEdge.endY - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
                    if (y === (rightEdge.endY - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
                }
            }

            // Draw a wireframe around any n-gons that wish for one.
            if (Rngon.internalState.showGlobalWireframe ||
                material.hasWireframe)
            {
                for (let l = 1; l < numLeftVerts; l++)
                {
                    Rngon.line_draw(leftVerts[l-1], leftVerts[l], material.wireframeColor, n);
                }

                for (let r = 1; r < numRightVerts; r++)
                {
                    Rngon.line_draw(rightVerts[r-1], rightVerts[r], material.wireframeColor, n);
                }
            }
        }
    }

    return;
}

}
