import MapboxDraw from '@mapbox/mapbox-gl-draw';

//use draw_line_string mode as starting point

export const drawPathMode = MapboxDraw.modes.draw_line_string;

/* drawPath is initialized with the start and end marker to snap to. 
   These are mapbox gl marker objects.
   If startMarker is defined, user can only begin path by clicking inside of
   startMarker. If endMarker is defined, user can only end path by single- or
   double-clicking within endMarker.
*/

setMarkerColor(markerElement, color) {
    markerElement
      .querySelectorAll('svg g[fill="' + marker._color + '"]')[0]
      .setAttribute("fill", color);
    marker._color = color;
  }

drawPath.onSetup = function(opts) {
    opts = opts || {};
    const featureId = opts.featureId;
    const state = {};
    state.startMarker = Object.hasOwn(opts,"startMaker") ? opts.startMarker : null;
    state.endMarker = Object.hasOwn(opts,"endMarker") ? opts.endMarker : null;
    if (opts.startMarker !== null) {
        const startDiv = startMarker.getElement();
        startDiv.addEventListener('mouseenter', ()=>setMarkerColor(startDiv,'#FFFF00')); //yellow
        startDiv.addEventListener('mouseleave', ()=>setMarkerColor(startDiv, '#000000')); //need original color
    }
    if (opts.endMarker !== null) {
        const endDiv = endMarker.getElement();
        endDiv.addEventListener('mouseenter', ()=>setMarkerColor(endDiv,'#FFFF00')); //yellow
        endDiv.addEventListener('mouseleave',/* set back to original color */);
    }
    let line, currentVertexPosition;
    let direction = 'forward';
    if (featureId) {
        line = this.getFeature(featureId);
        if (!line) {
        throw new Error('Could not find a feature with the provided featureId');
        }
        let from = opts.from;
        if (from && from.type === 'Feature' && from.geometry && from.geometry.type === 'Point') {
        from = from.geometry;
        }
        if (from && from.type === 'Point' && from.coordinates && from.coordinates.length === 2) {
        from = from.coordinates;
        }
        if (!from || !Array.isArray(from)) {
        throw new Error('Please use the `from` property to indicate which point to continue the line from');
        }
        const lastCoord = line.coordinates.length - 1;
        if (line.coordinates[lastCoord][0] === from[0] && line.coordinates[lastCoord][1] === from[1]) {
        currentVertexPosition = lastCoord + 1;
        // add one new coordinate to continue from
        line.addCoordinate(currentVertexPosition, ...line.coordinates[lastCoord]);
        } else if (line.coordinates[0][0] === from[0] && line.coordinates[0][1] === from[1]) {
        direction = 'backwards';
        currentVertexPosition = 0;
        // add one new coordinate to continue from
        line.addCoordinate(currentVertexPosition, ...line.coordinates[0]);
        } else {
        throw new Error('`from` should match the point at either the start or the end of the provided LineString');
        }
    } else {
        line = this.newFeature({
        type: Constants.geojsonTypes.FEATURE,
        properties: {},
        geometry: {
            type: Constants.geojsonTypes.LINE_STRING,
            coordinates: []
        }
        });
        currentVertexPosition = 0;
        this.addFeature(line);
    }
    
    this.clearSelectedFeatures();
    doubleClickZoom.disable(this);
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.LINE);
    this.setActionableState({
        trash: true
    });
    
    return {
        line,
        currentVertexPosition,
        direction
    };
}

