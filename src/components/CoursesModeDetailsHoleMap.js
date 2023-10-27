 /*************************************************************************
 * File: coursesModeDetailsHoleMap.js
 * This file defines the CoursesModeDetails React component, which enables
 * users to view and edit the basic data on a golf course.
 ************************************************************************/

import React, { useEffect, useState, useRef } from 'react';
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
//import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS
} from 'chart.js/auto';
import {
  Line,
} from 'react-chartjs-2';

import mapboxgl from 'mapbox-gl';
import CustomMap from './customMap';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import FontawesomeMarker from 'mapbox-gl-fontawesome-markers'
import * as SGCalcs from '../speedgolfCalculations'
import * as Conversions from '../conversions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { feature } from '@turf/turf';
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;


export default function CoursesModeDetailsHoleMap({holes, pathInsertionPt, polyInsertionPt, mapCenter, updateFeature, distUnits})  {

  /* Enumerated type for top-level state of "Hole Map" */
  const holeMapTool = {
    SELECT: 0,
    DEFINE_PATH: 1,
    DEFINE_POLYGON: 2
  };
  Object.freeze(holeMapTool);

   /* Static object mapping hole features to line colors */
   const lineColor = {
    golfPath: '#FF0000',
    transitionPath: '#FFFF00',
    startPath: '#FFFF00',
    finishPath: '#FFFF00',
    teebox: '#0000FF',
    green: '#90EE90',
  };
  Object.freeze(lineColor);

  /* Static object mapping hole features to text labels displayed on map */
  const featureLabel = {
    golfPath: 'Golf',
    transitionPath: 'Transition',
    teebox: 'Tee',
    green: 'Green',
  };
  Object.freeze(featureLabel);

    /* defineFeature describes the feature currently being edited, e.g., hole 1's transitino path . */
  const [defineFeature, setDefineFeature]  = useState(null);
  const feature = useRef(null);

  /* profileHole keeps track hole currently displayed in profile view. Will become part of 'status. */
  const [profileHole, setProfileHole] = useState(0);
  
  /* zoom, lng, and lat keep track of current zoom and focus of map */
  const [zoom, setZoom] = useState(15);
  const [lng, setLng] = useState(mapCenter.lng);
  const [lat, setLat] = useState(mapCenter.lat);

  /* status: Keeps track of app mode, the current selection, hole currently displayed in profiel view,
     length of current path, and autoAdvance mode */
  const [status] = useState({
    mode: holeMapTool.SELECT, 
    selection: null, 
    profileHole: 0,
    pathLength: null,
    autoAdvance: false});

  //The div containing the mapbox map object
  const mapContainer = useRef();

  //The mapbox map object
  const map = useRef();

  //The mapbox draw object
  const draw = useRef();

  //Array of layer ids of all paths added to the map
  const pathIds = useRef([]); 
  
  //Popup for displaying distance info when path is hovered over
  const pathPopup = useRef(new mapboxgl.Popup({closeButton: false}));

  //Layer Id of path currently selected.
  const selectedPathId = useRef(null); 

   //the teeFlagMarkers array keeps track of the start, tee, flag, and finish markers that are on the map
  const teeFlagMarkers = useRef(Array.from({length: holes.length}, (h) => {return {tee: null, flag: null}}));

  /*********************************************************************
   * @function handleDefineFeature 
   * @desc 
   * When the user chooses a feature (path or polygon) to define by
   * clicking on the item in the table in the left pane, we set the
   * defineFeature and toggle the draw tool.
   * @param holeNum, the hole number where the feature will be defined
   * @param featureType: startPath, transitionPath, golfPath, teebox,
   *        green, or finishPath
   ********************************************************************/
  function handleDefineFeature(holeNum, featureType) { 
    setDefineFeature({holeNum: holeNum, featureType: featureType});
    feature.current = {holeNum: holeNum, featureType: featureType};
  }

  /*********************************************************************
   * @function computeDestinationPoint 
   * @desc 
   * Compute a point along line defined by start and end that lies
   * d2 feet from start. Serves as ancillary function for getSampledPath().
   * @param start, end, the start and end points of the line
   * @param d2, the distance along the line to find the point
   * @returns the coordinates of the line on the path.
   ********************************************************************/
  function computeDestinationPoint(start, end, d2) {
    let xa = start.lng
    let ya = start.lat
    let xb = end.lng
    let yb = end.lat
    let d = Math.sqrt(Math.pow((xa - xb), 2) + Math.pow((ya - yb), 2))
    let xc = xa - ((d2 * (xa - xb)) / d)
    let yc = ya - ((d2 * (ya - yb)) / d)
    return {lng: xc, lat: yc}
  }

  /*********************************************************************
  * @function getSampledPath 
  * @desc 
  * Given a set of coords defining a line, create a new line
  * where the distance between each point is spaced
  * samplingDistanceInFeet apart.
  * @param map -- the mapbox GL object where the path is plotted
  * @param coords -- a set of coords ({lat, lng, elv} defining
  *        the path.
  * @param samplingDistInFeet -- the amount of distance in feet 
  *        between each point on the new line.
  * @returns an array of coordinates defining the newly sampled path 
  ********************************************************************/
  function getSampledPath(coords) {
    const metersTo10Km = 0.00001;
    const feetTo10Km = 0.3048 * metersTo10Km;
    const samplingDistance = SGCalcs.samplingDistInFeet * feetTo10Km;
    let arr = [];
    for(let i = 0; i < coords.length-1; i++) {
      const distance = Math.sqrt(Math.pow((coords[i].lng - coords[i+1].lng), 2) + Math.pow((coords[i].lat - coords[i+1].lat), 2))
      for(let j = 0; j <= distance / samplingDistance; j++) {
        const dest = computeDestinationPoint(coords[i], coords[i+1], samplingDistance * j)
        const elv = map.current.queryTerrainElevation(dest, {exaggerated: false}) * 3.280839895 // convert meters to feet
        arr.push({lat: dest.lat, lng: dest.lng, elv: elv})
      }
    }
    arr.push(coords[coords.length-1]); //Add final point of path to sampled path to ensure sampled path has same length.
    //console.dir(arr)
    return arr;
  }

  /*************************************************************************
   * @function enablePathCreation
   * @param holeNum, the hole number of the path
   * @param pathType, the type of the path 
   * @Desc 
   * Determines whether the '+' button associated with the path in the hole
   * pane should be enabled or disabled. Only the path at the current 
   * insertion point may be defined.
   * @return true if path is at current insertion point, false otherwise
   *************************************************************************/
  function enablePathCreation(holeNum, pathType) {
    return (holeNum === pathInsertionPt.holeNum && pathType === pathInsertionPt.path);
  }

  /*************************************************************************
   * @function enablePolyCreation
   * @param holeNum, the hole number of the polygon
   * @param pathType, the type of polygon 
   * @Desc 
   * Determines whether the '+' button associated with the polygon in the hole
   * pane should be enabled or disabled. Only the polygon at the current 
   * insertion point may be defined.
   * @return true if polygon is at current insertion point, false otherwise
   *************************************************************************/
  function enablePolyCreation(holeNum, polyType) {
    return (holeNum === polyInsertionPt.holeNum && polyType === polyInsertionPt.poly);
  }

  /*************************************************************************
   * useEffect() for map instantiation
   * Create the mapbox map and draw objects, and define event handlers for
   * these. 
   *************************************************************************/
  useEffect(() => {  
    if (map.current) return;
    //Instantiate a mapbox Map object and attach to mapContainer DOM element
     map.current = new CustomMap({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [lng, lat],
      zoom: zoom
    });
  }, [lat,lng,zoom]); //end use effect; should be executed only once


  /*************************************************************************
     * @function map on load handler (in useEffect)
     * @Desc 
     * When map is first loaded, add the mapbox 'terrain-rgb' source 
     * (satellite imagery with street and place labels), and set the terrain
     * to the source with an exaggeration of 1 (to give slight 3D appearance)
     *************************************************************************/
  useEffect(() => {
    if (!map.current) return;
    map.current.on('load', () => {
      if (map.current.getSource('mapbox-golf') === undefined) {
        map.current.addSource('mapbox-golf', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.terrain-rgb',
        'tileSize': 256,
        'maxzoom': 15
        });
        map.current.setTerrain({ 'source': 'mapbox-golf', 'exaggeration': 1 });
        addAllFeaturesToMap();
      } 
    });
    //return () => {if (map.current.loaded()) map.current.removeSource('mapbox-golf')};
   
  });

    /*************************************************************************
     * @function on render handler
     * @Desc 
     * This handler appears necessary to allow the user to scale the map to
     * consume the entire window
     *************************************************************************/
    useEffect(() => {
      if (!map.current) return;
      map.current.on('render', () => {
        map.current.resize();
      });
    });

    /*************************************************************************
    * @function on move handler
    * @Desc 
    * Update state vars when pan and zoom change, to ensure current pan
    * and zoom are maintained.
    *************************************************************************/
    useEffect(() => {
      map.current.on('move', () => {
        setLng(map.current.getCenter().lng.toFixed(4));
        setLat(map.current.getCenter().lat.toFixed(4));
        setZoom(map.current.getZoom().toFixed(2));
      });
      
    },[lng, lat, zoom]);

    /*************************************************************************
     * @function map.click event handler for path selection events
     * @param pathIds, the array of layer ids of all paths on the map
     *        This allows the handler to fire only when one of these layers
     *        is clicked on.
     * @param e, the event object
     * @Desc 
     * Invoked when the user clicks on a path on the map. If the path is 
     * currently selected, it is unselected. Otherwise, the path is selected
     * and the previously selected path (if any) is unselected. 
     *************************************************************************/
    useEffect(() => {
      map.current.on('click',pathIds.current, (e)=> {
        e.clickOnLayer = true; //Ensure that the event propagates no further
        const id = e.features[0].layer.id; //undocumented prop containing layer id clicked on
        selectPath(id,true);
      });
    });

    /*************************************************************************
     * @function map.click event handler for clicks outside of path
     * @param e, the event object
     * @Desc 
     * Invoked when the user clicks on the map in simpleSelect mode. We may need
     * to unselect currently selected feature. 
     *************************************************************************/
    useEffect(() => {
      map.current.on('click', (e) => {
        if (e.clickOnLayer) return;  //Don't execute if click was on layer
        if (selectedPathId.current !== null) {
          //unselect current selection
          map.current.setPaintProperty(selectedPathId.current,'line-width',3);
          selectedPathId.current = null;
        }
      });
    });

  /**********************************************************************
   * EVENT HANDLERS TO DISPLAY POPUPS WHEN PATHS ARE HOVERED
   **********************************************************************/

  /*************************************************************************
   * @function path mousenter event handler 
   * @param pathIds, the array of ids of the path layers (responds only to these)
   * @param e, the event object
   * @Desc 
   * When the user hovers over a path, change the cursor to a pointer and
   * show a popop that displays the path's distance. 
   * Note: the pathIds array allows us to specify this mousenter behavior
   * only for map layers that contain paths. Miraculously, we can obtain
   * the layer id of the path that was clicked via e.features[0].layer.id.
   * This is not documented; I discovered it via debugging.
   *************************************************************************/
    useEffect(() => {
      map.current.on("mouseenter", pathIds.current, (e) => {
        map.current.getCanvas().style.cursor = 'pointer';
        const id = e.features[0].layer.id;
        const hNum = parseInt(id.substr(1,2));
        const distProp = ((id[3] === 'g') ? 'golfRunDistance' : 'transRunDistance');
        const dist = ((distUnits === 'Imperial') ? `${Conversions.toYards(holes[hNum-1][distProp])} yards` :
                      `${Conversions.toMeters(holes[hNum-1][distProp])} meters`);
        //alert("in mousenter with id = " + id + ", hNum = " + hNum + ", dist = " + dist);
        pathPopup.current.setText(`Running distance: ${dist}`)
          .setLngLat(e.lngLat)
          .addTo(map.current);
      });
    },[distUnits, holes]);

  /*************************************************************************
   * @function path mouseleave event handler 
   * @param pathIds, the array of ids of the path layers (responds only to these)
   * @param e, the event object
   * @Desc 
   * When the mouse leaves a path that was hovered,, change the cursor
   * back to the hand and hide the popup displaying the path's distance. to a pointer and
   * show a popop that displays the path's distance. 
   *************************************************************************/
    useEffect(() => {
      map.current.on("mouseleave", pathIds.current, (e) => {
        map.current.getCanvas().style.cursor = '';
        pathPopup.current.remove();
      });
    });
  
  /**********************************************************************
   * DEFINITION OF DRAW OBJECT AND ASSOCIATED EVENT HANDLERS
   **********************************************************************/
 
    

  /*************************************************************************
   * Define Mapbox draw object
   * @Desc 
   * On map load, and when the draw mode changes, we need to instantiate 
   * a map draw object to accommondate the current mode. This is defined
   * within a useEffect
   *************************************************************************/
  useEffect(() => {
     if (!map.current) return;
     /* Need to define an object to style feature lines as they are being drawn.
     See https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/EXAMPLES.md */
     const lineStyleObj = {
        'id': 'gl-draw-line',
        'type': 'line', 
        'filter': ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']], 
        'layout': { 
          'line-cap': 'round', 
          'line-join': 'round' 
        },
        'paint': { 
          'line-width': 3, 
          'line-dasharray': [0.2, 2],
          'line-color': (defineFeature !== null ? 
            lineColor[defineFeature.featureType] : '#FFFFFF')
        }
      };
      const pointStyleObj =  {
        "id": "gl-draw-polygon-and-line-vertex-halo-active",
        "type": "circle",
       "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
       "paint": {
         "circle-radius": 5,
         "circle-color": (defineFeature !== null ? 
           lineColor[defineFeature.featureType] : '#FFFFFF')
       }
      };
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        defaultMode: defineFeature === null ? 'simple_select' :
          (defineFeature.featureType.includes('Path') ? 'draw_line_string' : 
            'draw_polygon'),
        styles: [lineStyleObj, pointStyleObj]
      });
      map.current.addControl(draw.current);
      return () => map.current.removeControl(draw.current); //removeControl on cleanup
     
    },[defineFeature]);

  useEffect(() => {   
    /*************************************************************************
     * @function processDrawnFeature
     * @desc
     * As the draw-create click handler, it is called when the user 
     * completes definition of a path or polygon by double-clicking. Based on
     * the feature being defined (in the defineFeature state variable), 
     * we do any snapping that's required, get the elevations of the points 
     * in the path, and finally add the new path feature using updateFeature().
     * NOTE: We have isolated this in its own function so that a new function 
     * closure can be formed every time the defineFeature state variable is updated. 
     *************************************************************************/
     function processDrawnFeature() {
        const lineData = draw.current.getAll();
        if (lineData.features.length > 0) {
          const line = lineData.features[0].geometry.coordinates;
          let startVertex, endVertex;
          //defineFeature replaces feature.current
          if (defineFeature.featureType.includes('Path')) {
            startVertex = getSnapStartVertex(defineFeature.holeNum, defineFeature.featureType);
            endVertex = getSnapEndVertex(defineFeature.holeNum, defineFeature.featureType);
          } else {
            startVertex = null;
            endVertex = null;
          }
          const featureCoords = [];
          for (let i = 0; i < line.length; ++i) {
            if (i===0 && startVertex !== null)
                featureCoords.push(startVertex);
            else if (i === line.length-1 && endVertex !== null)
                featureCoords.push(endVertex);
            else {
                const pt = {lng: line[i][0], lat: line[i][1]};
                const elev = map.current.queryTerrainElevation(pt, { exaggerated: false }) * 3.280839895 // convert meters to feet
                pt.elv = elev;
                featureCoords.push(pt);
            }    
          }
          //Add to map
          addFeatureToMap(defineFeature.holeNum, featureCoords, defineFeature.featureType, true);
          //Update for possible save to storage
          if (defineFeature.featureType.includes('Path')) {
            updateFeature(defineFeature.holeNum, defineFeature.featureType, featureCoords, getSampledPath(featureCoords));
          } else { //Polygon -- no need to get sampled path
            updateFeature(defineFeature.holeNum, defineFeature.featureType, featureCoords, null);
          }
          //We don't need the draw items anymore;
          draw.current.deleteAll();
          //Done with line drawing, so we can switch to select mode.
          draw.current.changeMode('simple_select');
        }
      }
        map.current.on('draw.create', processDrawnFeature);
        return () => map.current.off('draw.create', processDrawnFeature);
  },[defineFeature,lineColor]); 




  /**********************************************************************
   * PATH DRAWING, SELECTION, & DELETION
   **********************************************************************/

  /*************************************************************************
   * @function selectPath
   * @param pathId, the string id of the path to select.
   * @param unselectIfSame, a boolean. If true, unselect currently selected
   * path if it's the same as the path to select (so that NO path is selected).
   * If false, essentially ignore the request: keep the selected path the same
   * @Desc 
   * Invoked when the user clicks on a path on the map. If the path is 
   * currently selected, it is unselected. Otherwise, the path is selected
   * and the previously selected path (if any) is unselected. 
   *************************************************************************/
  function selectPath(pathId,unselectIfSame) {
    if (selectedPathId.current === pathId) {
      if (unselectIfSame) {
        //unselect path just clicked on
        map.current.setPaintProperty(pathId,'line-width',3); //normal width
        selectedPathId.current = null;
      }
      return;
    }
    //if here, we need to select a different path from currently selected path
    map.current.setPaintProperty(pathId,'line-width',6); //thick width
    if (selectedPathId.current !== null) {
      //unselect currently selected path
      map.current.setPaintProperty(selectedPathId.current,'line-width',3);
    }
    //Set current selection
    selectedPathId.current = pathId;
  }

  /*************************************************************************
   * @function getSnapStartVertex
   * @param holeNum, the hole number for which the user is drawing a path
   * @param featureType, either 'golfPath' or 'transitionPath' for now, but
   * eventually also 'startPath' and 'finishPath'
   * @desc Determine if the start of the path currently being drawn should
   * snap to the end of the previous path. If so, return the coordinates of
   * the vertex to snap to. 
   *************************************************************************/
  function getSnapStartVertex(holeNum, featureType) {
    if (featureType === 'golfPath') {
      if (holeNum === 1 && Object.hasOwn(holes[0],'startPath') && holes[0].startPath !== "") {
        //Only case in which hole 1 golfPath startpoint should be snapped
        return holes[0].startPath[holes[0].startPath.length-1];
      }
      if (holeNum === 1) {
        return null;
      }
      //If here, can assume hole >= 2
      if (holes[holeNum-1].transitionPath !== "") {
        //Snap to transition pah
        return holes[holeNum-1].transitionPath[holes[holeNum-1].transitionPath.length-1];
      }
      return null;
    } else if (featureType === 'transitionPath') {
      if (holeNum > 1 && holes[holeNum-2].golfPath !== "") {
        //Snap to previous hole's golf path
        return holes[holeNum-2].golfPath[holes[holeNum-2].golfPath.length-1];
      }
      return null;
    }
  }

   /*************************************************************************
   * @function getSnapEndVertex
   * @param holeNum, the hole number for which the user is drawing a path
   * @param featureType, either 'golfPath' or 'runningPath' for now, but
   * eventually also 'startPath' and 'finishPath'
   * @desc Determine if the end of the path currently being drawn should
   * snap to the start of the next path. If so, return the coordinates of
   * the vertex to snap to. 
   *************************************************************************/
  function getSnapEndVertex(holeNum, featureType) {
    if (featureType === 'golfPath') {
      if (holeNum === holes.length && Object.hasOwn(holes[holes.length-1],'finishPath') && holes[holes.length-1].finishPath !== "") {
        //Only case in which hole 1 golfPath endpoint should be snapped
        return holes[holes.length-1].finishPath[0];
      }
      if (holeNum === holes.length) {
        return null;
      }
      //If here, can assume hole is at least one less than last hole
      if (holes[holeNum].transitionPath !== "") {
        //Snap to transition pah
        return holes[holeNum].transitionPath[0];
      }
      return null;
    } else if (featureType === 'transitionPath') {
      if (holeNum < holes.length && holes[holeNum-1].golfPath !== "") {
        //Snap to current hole's golf path
        return holes[holeNum-1].golfPath[0];
      }
      return null;
    }
  }

  /**********************************************************************
   * END OF PATH DRAWING, SELECTION, DELETION, & EVENT HANDLING
   **********************************************************************/


  /**********************************************************************
   * FUNCTIONS TO ADD COURSE FEATURES TO MAP
   **********************************************************************/
  /*************************************************************************
   * @function addFeatureToMap
   * @param the holeNum associated with the feature to add to the map
   * @param featureCoords, an array of geocoord objects (with 'lat' 
   *        and 'lng' props) that define the feature.
   * @param featureType, the type of feature to add to the map 
   *        ('transitionPath', 'teebox', 'golfPath', or 'green')
   * @param createMarkers, a boolean indicating whether to create fresh tee and
   *        green markers (used only when featureType==='golfPath')
   * @returns the unique id of the feature added to the map
   * @Desc 
   * Display a feature (transition path, teebox, golf path, or green) on the 
   * map; label the feature on the map (TO DO)
   *************************************************************************/
   function addFeatureToMap(holeNum, featureCoords, featureType, createMarkers=true) {
    if (featureCoords.length === 0) return;
    const geojson = {
      'type': 'geojson',
      'data': { 
        'type': 'Feature',
        'properties': {
          'label': `Hole ${holeNum} ${featureLabel[featureType]}`
        },
        'geometry': {
          'type': 'LineString',
          'coordinates': featureCoords.map(pt => [pt.lng, pt.lat])                 
        }
      }
    };
    const id = ((holeNum < 10) ? `H0${holeNum}${featureType}`: `H${holeNum}${featureType}`);
    map.current.addSource(id,geojson); 
    //Add path layer
    map.current.addLayer({
      'id': id,
      'type': 'line',
      'source': id,
      'layout': {
        'line-join': 'round',
        'line-cap': 'round',
      },
      'paint': {
        'line-color': lineColor[featureType],
        'line-width': 3
      },
    });
    if (featureType==='golfPath' || featureType==='transitionPath') {
      //Add path label layer and add to pathIds array to enable
      //popup on event hover
      map.current.addLayer({
        'id': id + "_label",
        'type': "symbol",
        'source': id,
        'layout': {
          'symbol-placement': 'line-center',
          'text-max-angle': 90,
          'text-offset': [1,1],
          "text-font": ["Arial Unicode MS Regular"],
          "text-field": '{label}',
          "text-size": 12,
        },
        'paint': {
          'text-color': '#FFFFFF',
          'text-halo-color': '#000000',
          'text-halo-width': 0.5,
          'text-halo-blur': 0.5
        }
      });
      pathIds.current.push(id); //This array accumulates path ids so we can define a focused click handler.
    } 
    if (!createMarkers) return;
    //Add tee and flag markers, as appropriate...
    let flagPopup, flag, teePopup, tee, teeDiv, flagDiv;
    if (featureType === 'golfPath') {
      if (teeFlagMarkers.current[holeNum-1].tee === null) {
        teePopup = new mapboxgl.Popup({closeButton: false, maxWidth: 'none'})
      .setText(`Hole ${holeNum} Tee`);
      tee = new FontawesomeMarker({
        icon: 'fas fa-golf-ball-tee',
        iconColor: 'white',
        color: 'blue',
        draggable: true
      }).setLngLat([featureCoords[0].lng, 
          featureCoords[0].lat])
        .setPopup(teePopup)
        .addTo(map.current);
        teeDiv = tee.getElement();
        teeFlagMarkers.current[holeNum-1].tee = tee;
        console.dir("teeFlagMarker.current updated with hole " + holeNum + " tee marker.")
        tee.on('drag', ()=>handleTeeDrag(holeNum,tee));
        tee.on('dragend',()=>handleTeeDragEnd(holeNum,tee));
        teeDiv.addEventListener('mouseenter',()=>tee.togglePopup());
        teeDiv.addEventListener('mouseleave',()=>tee.togglePopup());
      }
      if (teeFlagMarkers.current[holeNum-1].flag === null) {
        flagPopup = new mapboxgl.Popup({closeButton: false, maxWidth: 'none'})
          .setText(`Hole ${holeNum} Flag`);
        flag = new FontawesomeMarker({
            icon: 'fas fa-flag',
            iconColor: 'white',
            color: 'lightgreen',
            draggable: true
          }).setLngLat([featureCoords[featureCoords.length-1].lng, 
                        featureCoords[featureCoords.length-1].lat])
            .setPopup(flagPopup)
            .addTo(map.current);
        flagDiv = flag.getElement();
        teeFlagMarkers.current[holeNum-1].flag = flag;
        console.dir("teeFlagMarker.current updated with hole " + holeNum + " flag marker.");
        flag.on('drag', ()=>handleFlagDrag(holeNum,flag));
        flag.on('dragend',()=>handleFlagDragEnd(holeNum,flag));
        flagDiv.addEventListener('mouseenter',()=>flag.togglePopup());
        flagDiv.addEventListener('mouseleave',()=>flag.togglePopup());
      }
    } else if (featureType === 'transitionPath') {
      if (teeFlagMarkers.current[holeNum-2].flag === null) {
        flagPopup = new mapboxgl.Popup({closeButton: false, maxWidth: 'none'})
        .setText(`Hole ${holeNum-1} Flag`);
      flag = new FontawesomeMarker({
          icon: 'fas fa-flag',
          iconColor: 'white',
          color: 'lightgreen',
          draggable: true
        }).setLngLat([featureCoords[0].lng, 
                      featureCoords[0].lat])
           .setPopup(flagPopup)
           .addTo(map.current);
      flagDiv = flag.getElement();
      teeFlagMarkers.current[holeNum-2].flag = flag;
      console.dir("teeFlagMarker.current updated with hole " + holeNum + " flag marker.");
      flag.on('drag', ()=>handleFlagDrag(holeNum-1,flag));
      flag.on('dragend',()=>handleFlagDragEnd(holeNum-1,flag));
      flagDiv.addEventListener('mouseenter',()=>flag.togglePopup());
      flagDiv.addEventListener('mouseleave',()=>flag.togglePopup());
      }
      if (teeFlagMarkers.current[holeNum-1].tee === null) {
        teePopup = new mapboxgl.Popup({closeButton: false, maxWidth: 'none'})
      .setText(`Hole ${holeNum} Tee`);
      tee = new FontawesomeMarker({
        icon: 'fas fa-golf-ball-tee',
        iconColor: 'white',
        color: 'blue',
        draggable: true
      }).setLngLat([featureCoords[featureCoords.length-1].lng, 
          featureCoords[featureCoords.length-1].lat])
        .setPopup(teePopup)
        .addTo(map.current);
        teeDiv = tee.getElement();
        teeFlagMarkers.current[holeNum-1].tee = tee;
        console.dir("teeFlagMarker.current updated with hole " + holeNum + " tee marker.");
        tee.on('drag', ()=>handleTeeDrag(holeNum,tee));
        tee.on('dragend',()=>handleTeeDragEnd(holeNum,tee));
        teeDiv.addEventListener('mouseenter',()=>tee.togglePopup());
        teeDiv.addEventListener('mouseleave',()=>tee.togglePopup());
      }
    } else if (featureType === 'startPath') {
      /******************************
       * TO DO: Add start marker
       * ***************************/
      if (teeFlagMarkers.current[0].tee === null) {
        teePopup = new mapboxgl.Popup({closeButton: false, maxWidth: 'none'})
      .setText(`Hole ${holeNum} Tee`);
      tee = new FontawesomeMarker({
        icon: 'fas fa-golf-ball-tee',
        iconColor: 'white',
        color: 'blue',
        draggable: true
      }).setLngLat([featureCoords[featureCoords.length-1].lng, 
          featureCoords[featureCoords.length-1].lat])
        .setPopup(teePopup)
        .addTo(map.current);
        teeDiv = tee.getElement();
        teeFlagMarkers.current[holeNum-1].tee = tee;
        tee.on('drag', ()=>handleTeeDrag(holeNum,tee));
        tee.on('dragend',()=>handleTeeDragEnd(holeNum,tee));
        teeDiv.addEventListener('mouseenter',()=>tee.togglePopup());
        teeDiv.addEventListener('mouseleave',()=>tee.togglePopup());
      }
    } else if (featureType === 'finishPath') {
      /******************************
       * TO DO: Add finish marker
       * ***************************/
      if (teeFlagMarkers.current[holes.length-1].flag === null) {
        flagPopup = new mapboxgl.Popup({closeButton: false, maxWidth: 'none'})
        .setText(`Hole ${holeNum} Flag`);
      flag = new FontawesomeMarker({
          icon: 'fas fa-flag',
          iconColor: 'white',
          color: 'lightgreen',
          draggable: true
        }).setLngLat([featureCoords[0].lng, 
                      featureCoords[0].lat])
           .setPopup(flagPopup)
           .addTo(map.current);
      flagDiv = flag.getElement();
      teeFlagMarkers.current[holeNum-1].flag = flag;
      flag.on('drag', ()=>handleFlagDrag(holeNum,flag));
      flag.on('dragend',()=>handleFlagDragEnd(holeNum,flag));
      flagDiv.addEventListener('mouseenter',()=>flag.togglePopup());
      flagDiv.addEventListener('mouseleave',()=>flag.togglePopup());
      }
    }
  }

  /*************************************************************************
   * @function addAllFeaturesToMap
   * @Desc 
   * Display all the features defined in the holes array (component prop).
   * Give each feature a unique id so that click handlers can be defined on
   * them. Give each feature a distinctive color according to our 
   * color legend: yellow for trans path, blue for tee box, red for 
   * golf path, and bright green for green.
   *************************************************************************/
  function addAllFeaturesToMap() {

    for (let h = 0; h < holes.length; h++) {
      if (holes[h].transitionPath !== "") {
        addFeatureToMap(h+1,holes[h].transitionPath,'transitionPath');
      }
      if (holes[h].golfPath !== "") {
        addFeatureToMap(h+1,holes[h].golfPath,'golfPath');
      }
      if (holes[h].teebox !== "") {
        addFeatureToMap(h+1,holes[h].teebox,'teebox');
      }
      if (holes[h].green!== "") {
        addFeatureToMap(h+1,holes[h].green,'green');
      }   
    }
  }

  /**********************************************************************
   * END OF FUNCTIONS TO ADD COURSE FEATURES TO MAP
   **********************************************************************/
  /*************************************************************************
   * @function handleKeyDown
   * @param e, the event object
   * @Desc 
   * When the user hits a key when the map window is focused, we potentially
   * need to respond. Here are the cases we currently support:
   * - Delete or backspace when feature selected: Delete the feature
   * - Escape when feature is being created: delete the feature in progress
   *************************************************************************/
  function handleKeyDown(e) {
    if (selectedPathId.current !== null && (e.keyCode === 8 || e.keyCode === 46)) {
      /**********************************
       * Delete selection
       * *******************************/
      map.current.removeLayer(selectedPathId.current);
      map.current.removeLayer(selectedPathId.current + "_label");
      map.current.removeSource(selectedPathId.current);
      const hNum = parseInt(selectedPathId.current.substr(1,2));
      const featureType = selectedPathId.current.substr(3);
      updateFeature(hNum, featureType, "","");
      selectedPathId.current = null; //path no longer selected
      if (featureType === 'golfPath') {
        if (hNum === 1) { //special case #1--trans path can be defined as empty array
          if (holes[hNum-1].transitionPath === "" || holes[hNum-1].transitionPath.length === 0) {
          teeFlagMarkers.current[hNum-1].tee.remove();
          teeFlagMarkers.current[hNum-1].tee = null;
          }
          if (holes[hNum].transitionPath === "") {
          teeFlagMarkers.current[hNum-1].flag.remove();
          teeFlagMarkers.current[hNum-1].flag = null;
          }
        } else if (hNum === holes.length) { //special case #2--could be finish path
          if (holes[hNum-1].transitionPath === "") {
            teeFlagMarkers.current[hNum-1].tee.remove();
            teeFlagMarkers.current[hNum-1].tee = null;
          } 
          if (!Object.hasOwn(holes[hNum-1],'finishPath') || holes[hNum-1].finishPath === "") {
            teeFlagMarkers.current[hNum-1].flag.remove();
            teeFlagMarkers.current[hNum-1].flag = null;
          }
        } else { //General case
          if (holes[hNum-1].transitionPath === "") {
            teeFlagMarkers.current[hNum-1].tee.remove();
            teeFlagMarkers.current[hNum-1].tee = null;
          }
          if (hNum < holes.length && holes[hNum].transitionPath === "") {
            teeFlagMarkers.current[hNum-1].flag.remove();
            teeFlagMarkers.current[hNum-1].flag = null;
          }  
        } 
      } else if (featureType === 'transitionPath') {
        if (holes[hNum-1].golfPath === "" ) {
          teeFlagMarkers.current[hNum-1].tee.remove();
          teeFlagMarkers.current[hNum-1].tee = null;
        }
        if (hNum > 1 && holes[hNum-2].golfPath === "") {
          teeFlagMarkers.current[hNum-2].flag.remove();
          teeFlagMarkers.current[hNum-2].flag = null;
        }
      } else if (featureType === 'startPath') {
        if (holes[hNum-1].golfPath === "") {
          teeFlagMarkers.current[hNum-1].tee.remove();
          teeFlagMarkers.current[hNum-1].tee = null;
        }

      } else if (featureType === 'finishPath') {
        if (holes[hNum-1].golfPath === "") {
          teeFlagMarkers.current[hNum-1].flag.remove();
          teeFlagMarkers.current[hNum-1].flag = null;
        }
      }
    } else if (defineFeature !== null && e.keyCode === 27) {
      // /**********************************
      //  * Cancel feature being drawn
      //  * *******************************/
      // for (let m = 0; m < pathMarkers.current.length; ++m) {
      //   map.current.removeLayer(pathMarkers.current[m]);
      // }
      draw.current.changeMode('simple_select');
      setDefineFeature(null);
    }
  }

  
  /**********************************************************************
   * MARKER DRAG EVENT HANDLERS
   **********************************************************************/

    function handleTeeDrag(holeNum, teeMarker) {
    //TBD: May need to write code here to update status box as marker is dragged
    }

    function handleFlagDrag(holeNum, flagMarker) {
    //TBD: May need to write code here to update status box as marker is dragged
    }

  /*************************************************************************
   * @function handleFlagDragEnd
   * @param the holeNum of the flag marker just dragged
   * @param flagMarker, the Mapbox marker object just dragged
   * @Desc 
   * Update the golf path leading up to the flag, along with the transition
   * path emanating from the tee (if present), such that they match the
   * flag's new dragged location 
   *************************************************************************/
    function handleFlagDragEnd(holeNum, flagMarker) {
      const lngLat = flagMarker.getLngLat();
      const elv = map.current.queryTerrainElevation(lngLat, {exaggerated: false}) * 3.280839895;
      const golfLayerId = ((holeNum < 10) ? `H0${holeNum}golfPath`:  `H${holeNum}golfPath`);
      const transLayerId = (((holeNum+1) < 10) ? `H0${holeNum+1}transitionPath`:  `H${holeNum+1}transitionPath`);
      let newPath;
      if (holes[holeNum-1].golfPath !== "") {
        map.current.removeLayer(golfLayerId);
        map.current.removeLayer(golfLayerId + "_label");
        map.current.removeSource(golfLayerId);
        newPath = [...holes[holeNum-1].golfPath];
        newPath[newPath.length-1].lat = lngLat.lat;
        newPath[newPath.length-1].lng = lngLat.lng;
        newPath[newPath.length-1].elv = elv; 
        addFeatureToMap(holeNum,newPath,'golfPath',false);
        updateFeature(holeNum,"golfPath",newPath, getSampledPath(newPath));
      }
      if (holeNum < holes.length && holes[holeNum].transitionPath !== "") {
        map.current.removeLayer(transLayerId);
        map.current.removeLayer(transLayerId + "_label");
        map.current.removeSource(transLayerId);
        newPath = [...holes[holeNum].transitionPath];
        newPath[0].lat = lngLat.lat;
        newPath[0].lng = lngLat.lng;
        newPath[0].elv = elv;
        addFeatureToMap(holeNum+1,newPath,'transitionPath',false);
        updateFeature(holeNum+1,"transitionPath",newPath, getSampledPath(newPath));
      } else if (holeNum === holes.length && Object.hasOwn(holes[holeNum-1],'finishPath') && 
                 holes[holeNum-1].finishPath !== "") {
          //Special case: Course has finish path and user dragged final flag
          const finishLayerId = ((holeNum < 10) ? `H0${holeNum}finishPath`:  `H${holeNum}finishPath`);
          map.current.removeLayer(finishLayerId);
          map.current.removeLayer(finishLayerId + "_label");
          map.current.removeSource(finishLayerId);
          newPath = [...holes[holeNum-1].finishPath];
          newPath[0].lat = lngLat.lat;
          newPath[0].lng = lngLat.lng;
          newPath[0].elv = elv;
          addFeatureToMap(holeNum,newPath,'finishPath',false);
          updateFeature(holeNum,"finishPath",newPath, getSampledPath(newPath));
      }
    }

  /*************************************************************************
   * @function handleTeeDragEnd
   * @param the holeNum of the tee marker just dragged
   * @param teeMarker, the Mapbox marker object just dragged
   * @Desc 
   * Update the transition path leading up to the tee, along with the golf
   * path emanating from the tee (if present), such that they match the
   * tee's new dragged location 
   *************************************************************************/
    function handleTeeDragEnd(holeNum, teeMarker) {
      const lngLat = teeMarker.getLngLat();
      const elv = map.current.queryTerrainElevation(lngLat, {exaggerated: false}) * 3.280839895;
      const transLayerId = ((holeNum < 10) ? `H0${holeNum}transitionPath`:`H${holeNum}transitionPath`);
      const golfLayerId = ((holeNum < 10) ? `H0${holeNum}golfPath`:`H${holeNum}golfPath`);
      let newPath;
      if (holeNum === 1 && Object.hasOwn(holes[0],'startPath' && holes[0].startPath !== "")) {
        //Special case: Tee has start path and user dragged first tee marker
        const startLayerId = ((holeNum < 10) ? `H0${holeNum}startPath`:`H${holeNum}startPath`);
        map.current.removeLayer(startLayerId);
        map.current.removeLayer(startLayerId + "_label");
        map.current.removeSource(startLayerId);
        newPath = [...holes[holeNum-1].startPath];
        newPath[newPath.length-1].lat = lngLat.lat;
        newPath[newPath.length-1].lng = lngLat.lng;
        newPath[newPath.length-1].elv = elv;
        addFeatureToMap(holeNum,newPath,'startPath');
        updateFeature(holeNum,"startPath",newPath, getSampledPath(newPath));
      } else if (holes[holeNum-1].transitionPath !== "" && holes[holeNum-1].transitionPath.length > 1) {
        map.current.removeLayer(transLayerId);
        map.current.removeLayer(transLayerId + "_label");
        map.current.removeSource(transLayerId);
        newPath = [...holes[holeNum-1].transitionPath];
        newPath[newPath.length-1].lat = lngLat.lat;
        newPath[newPath.length-1].lng = lngLat.lng;
        newPath[newPath.length-1].elv = elv;
        addFeatureToMap(holeNum,newPath,'transitionPath', false);
        updateFeature(holeNum,"transitionPath",newPath, getSampledPath(newPath));
      }
      if (holes[holeNum-1].golfPath !== "") {
        map.current.removeLayer(golfLayerId);
        map.current.removeLayer(golfLayerId + "_label");
        map.current.removeSource(golfLayerId);
        newPath = [...holes[holeNum-1].golfPath];
        newPath[0].lat = lngLat.lat;
        newPath[0].lng = lngLat.lng;
        newPath[0].elv = elv; 
        addFeatureToMap(holeNum,newPath,'golfPath',false);
        updateFeature(holeNum,"golfPath",newPath, getSampledPath(newPath));
      }
    }

  
  /**********************************************************************
   * END OF GLOBAL MAP EVENT HANDLERS
   **********************************************************************/

  
      

  /*************************************************************************
   * @function handleProfileClick
   * @param holeNum, the number of the hole whose "show profile" button was
   *        clicked.
   * @Desc 
   * Shows/hides the currently displayed hole profile pane.
   *************************************************************************/
  
  function handleProfileClick(holeNum) {
    if (profileHole === holeNum) {
      setProfileHole(0);
    }
    else {
      setProfileHole(holeNum);
      showHoleProfile(holeNum);
    }
  }
  //
  let metricType = useRef(1);
  useEffect(()=>{
    
    if (distUnits === "Imperial")
      metricType.current = 3
    else
      metricType.current = 3.281
    if (profileHole !== 0)
      showHoleProfile(profileHole);
  },[distUnits]);

  const [holeData, setHoleData] = useState({
    labels:[],
    datasets:[]
  })
  
  const options ={
    scales: {
        x: {
          type: 'linear',
          ticks: {
            display: true,
            stepSize: 50,
          },
          grid: {
            drawBorder: true,
            display: true,
          },
        },
        y: {
          ticks: {
            display: true,
            beginAtZero: true,
          },
          grid: {
            drawBorder: true,
            display: true,
          },
        }
      }
  }

  const holeProfileBackground = {
    id: "holeProfileBackground",
    beforeDatasetsDraw(chart, args, pluginOptions){
      const {ctx, chartArea: {top, bottom, left, right, width, height}} = chart;
      ctx.save()
      const grd = ctx.createLinearGradient(left, top, width, height);
      grd.addColorStop(0, "gray");
      grd.addColorStop(1, "white");
      ctx.fillStyle = grd
      ctx.fillRect(left, top, width, height)
    }
  }

  function showHoleProfile(holeNum){

    let currentHoleObj = holes[holeNum-1]
    let tempLabels = [];
    let transitionPathLength = currentHoleObj.transitionPathSampled.length;// / 3;
    let golfPathLength = currentHoleObj.golfPathSampled.length;// / 3;
    let currentDistance = 0;
    
    // 0, 18, 18, 22 ...
    let transitionPathData = [];
    for (var i = 0; i< transitionPathLength; i++){
      if (i === 0){
        tempLabels.push(0)
      }
      else{
        let tempDist = SGCalcs.getDistance([currentHoleObj.transitionPathSampled[i-1], currentHoleObj.transitionPathSampled[i]])
        currentDistance += parseInt(tempDist/metricType.current)
        tempLabels.push(currentDistance)
      
      }
      transitionPathData.push({x: tempLabels[i], y: currentHoleObj.transitionPathSampled[i].elv})
    }

    let golfPathData = [];
    for (i = 0; i< golfPathLength; i++){
      if (i !== 0){
          let tempDist = SGCalcs.getDistance([currentHoleObj.golfPathSampled[i-1], currentHoleObj.golfPathSampled[i]])
          currentDistance += parseInt(tempDist/metricType.current)
          tempLabels.push(currentDistance)
      }
      golfPathData.push({x: tempLabels[transitionPathLength + i - 1], y: currentHoleObj.golfPathSampled[i].elv})
    }
    
    setHoleData({
        labels: tempLabels.slice(0,tempLabels.length),
        datasets:[
              {
                label: "Transition Path",
                // fill: true,
                backgroundColor: ["yellow"],
                borderColor: ["yellow"],
                data: transitionPathData,
            },
            {
                label: "Golf Path",
                // fill: "start",
                backgroundColor: ["red"],
                borderColor: ["red"],
                data: golfPathData,
            }, 
          ]
    })
  }

   
  // Component's JSX Render Code
  return ( 
    <div className="map-container" onKeyDown={handleKeyDown}>
      <table className="table table-light table-sm w-auto">
        <thead>
          <tr className="font-small">
          <th>Hole</th>
          <th><span className="txt-yellow bg-black">Trans<br/>Path</span></th>
          <th><span className="txt-blue">Tee<br/>Box</span></th>
          <th><span className="txt-red">Golf<br/>Path</span></th>
          <th><span className="txt-green bg-black">Green</span></th>
          </tr>
        </thead>
        <tbody>
          {holes.map((h) => {
            return(
              <tr key={h.number}>
              <td><button className="btn btn-sm" disabled={(h.transitionPath === "" || h.golfPath === "")}
                          onClick={()=>handleProfileClick(h.number)}>
                   {h.number}
                   </button>
              </td>
              <td>
                <button className={"btn btn-sm" + 
                                  (h.number===1 ? 
                                    (!Object.hasOwn(h,"startPath") ? " btn-gray" :
                                      (h.startPath==="" ? 
                                        (enablePathCreation(h.number,'startPath') ? "" : " btn-gray") : "btn-green")) :  
                                    (h.transitionPath === "" ? 
                                      (enablePathCreation(h.number,'transitionPath') ? "" : " btn-gray") : " btn-green"))}
                        aria-label={"Hole " + h.number + " transition path " + 
                                    ((h.transitionPath === "") ? "(not yet defined)":"(defined)")}
                          onClick={h.number===1 && Object.hasOwn(h,"startPath") && h.startPath==="" ? ()=>handleDefineFeature(1,"startPath") :
                                   h.number !== 1 && h.transitionPath==="" ? ()=>handleDefineFeature(h.number,"transitionPath") :
                                   ()=>selectPath(((h.number < 10) ? `H0${h.number}transitionPath` : `H${h.number}transitionPath`))}>
                    <FontAwesomeIcon icon={h.number===1 && !Object.hasOwn(h,"startPath") ? "xmark" : 
                                           h.number===1 && Object.hasOwn(h,"startPath") ? h.startPath==="" ? "plus" : "check" :
                                           h.transitionPath === "" ? "plus" : "check"}/>
                </button>
              </td>
              <td>
              <button className={"btn btn-sm" + (h.teebox === "" ? (enablePolyCreation(h.number,'teebox') ? "" : " btn-gray") : " btn-green")}
                        aria-label={"Hole " + h.number + " tee box " + 
                                    ((h.transitionPath === "") ? "(not yet defined)":"(defined)")}
                          onClick={((h.transitionPath === "") ? ()=>handleDefineFeature(h.number,"teebox") : null)}>
                    <FontAwesomeIcon icon={((h.teebox === "") ? "plus" : "check")}/>
                </button>
              </td>
              <td>
              <button className={"btn btn-sm" + ((h.golfPath !== "") ? " btn-green" : (enablePathCreation(h.number,'golfPath') ? "" : " btn-gray"))}
                        aria-label={"Hole " + h.number + " golf path " + 
                                    ((h.golfPath === "") ? "(not yet defined)":"(defined)")}
                          onClick={((h.golfPath === "") ? ()=>handleDefineFeature(h.number,"golfPath") : 
                                   ()=>selectPath(((h.number < 10) ? `H0${h.number}golfPath` : `H${h.number}golfPath`)))}>
                    <FontAwesomeIcon icon={((h.golfPath === "") ? "plus" : "check")}/>
                </button>
              </td>
              <td>
                <button className={"btn btn-sm" + (h.green === "" ? (enablePolyCreation(h.number,'green') ? "" : " btn-gray") : " btn-green")}
                        aria-label={"Hole " + h.number + " green " + 
                                    ((h.green === "") ? "(not yet defined)":"(defined)")}
                          onClick={((h.green === "") ? ()=>handleDefineFeature(h.number,"green") : null)}>
                    <FontAwesomeIcon icon={((h.green === "") ? "plus" : "check")}/>
                </button>
              </td>
              </tr>
          );
          })}
          {!Object.hasOwn(holes[holes.length-1],"finishPath") ? null :
          <tr>
            <td colSpan={5}>
              Finish Path: 
              <button className={"btn btn-sm" + ((holes[holes.length-1].finishPath !== "") ? " btn-green" : "")}
                        aria-label={"Hole " + holes.length + " finish path " + 
                                    ((holes[holes.length-1].finishPath === "") ? "(not yet defined)":"(defined)")}
                          onClick={((holes[holes.length-1].finishPath === "") ? 
                                     ()=>handleDefineFeature(holes.length-1,"finishPath") : null)}>
                    <FontAwesomeIcon icon={((holes[holes.length-1].finishPat === "") ? "plus" : "check")}/>
              </button>
            </td>
          </tr>}
        </tbody>
      </table>
      <div className="map-box-container">
        <div ref={mapContainer} className="map-box-full">
        {status.mode === holeMapTool.DEFINE_PATH ? 
          <div className="status-box">
            <span className="txt-small-bold">Defining Hole 1 Transition Path...</span>
            <br/>
            <span>Click to start path and to define points along path; double-click to end path</span>
            <div className="txt-small small-pad">Path Length: 230 yards</div>
            <div className="form-check form-switch">
              <div className="layout-inline-block">
                <input className="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckChecked" checked={status.autoAdvance}/>
              </div>
              <label className="form-check-label" htmlFor="flexSwitchCheckChecked">Auto-advance path</label>
            </div>
          </div> : 
          <div className="status-box" tabIndex="0">     
            <span className="txt-small-bold">Tips:</span>
            <ul className="txt-small txt-align-left">
              <li>Click on a <FontAwesomeIcon icon="plus" /> icon in side panel to define a hole's
                  &nbsp;<span className="txt-yellow bg-black">Transition Path</span>, <span className="txt-red">Golf Path</span>,&nbsp;
                  <span className="txt-blue">Tee Box</span>, or&nbsp;<span className="txt-green bg-black">Green</span></li>
              <li>A <FontAwesomeIcon icon="check" className="btn-green"/> icon in side panel means the hole's path, tee box, or green has been defined. To redefine it, first delete it on map by selecting it and hitting 'delete' key.</li>
              <li>Click on a hole # to show/hide elevation profile of hole. (Available only if transition path AND golf path are defined for hole.)</li>
            </ul>
          </div>
        }

        </div>
        <div className="hole-profile" hidden={profileHole===0}>
            <div className="flex-container">
              <div><h5>{"Hole #" + profileHole + " Elevation Profile"}</h5></div>
              <div><button onClick={()=>setProfileHole(0)}><FontAwesomeIcon icon="xmark"/></button></div>
            </div>
            <div class="flex-container">
              <Line id="holeProfile" data={holeData} options= {options} plugins={[holeProfileBackground]} height={"10%"} width={"100%"}/>
            </div>
        </div>
      </div>
    </div>
  );
};