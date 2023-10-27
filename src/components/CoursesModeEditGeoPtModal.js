import {useRef, useState, useEffect} from 'react';
 
 /*************************************************************************
 * File: coursesModeEditGeoPtModal.js
 * This file defines the CoursesModeEditGeoPtModal React component, which 
 * displays a modal dialog box for entering one or more geo points
 * consisting of a latitude, longitude, and elevation (in feet).
 * The component accepts the following props:
 *   title: The title to display in the dialog's header
 *   prompt: The prompt to present to the user in the dialog's body
 *   buttonLabel: The label of the button to save data  
 *   geoFence: An object with 'east', 'west' 'north' and 'south' props
 *   delineating the boundaries of valid geopoints.
 *   updateData: Function to call to save the data
 *               when user chooses save button in dialog
 *   cancelUpdate: Function to call to cancel saving data when user
 *                 chooses "Cancel" or "X" button
 ************************************************************************/

export default function CoursesModeEditGeoPtModal({title, prompt, value, buttonLabel, viewport, updateData, cancelUpdate}) {
const geoTol = 0.2; /* Number of degrees east, west, north, 
                             or south of course viewport that a geopt could reasonably be. */
const geoFence = {west: viewport.west - geoTol,
                  east: viewport.east + geoTol,
                  north: viewport.north + geoTol,
                  south: viewport.south - geoTol};

const editModalRef = useRef();
const startingVal = (Object.keys(value) === 0 ? {lat: "", lng: "", elv: ""} :
                      {lat: value.lat, lng: value.lng, elv: value.elv});
const [geoPt,setGeoPt] =  useState(startingVal);

useEffect(() => {
    const bsModal =  window.bootstrap.Modal.getOrCreateInstance(editModalRef.current);
    bsModal.show();
},[]);

function handleChange(event) {
    const newGeoPt = {...geoPt, [event.target.name]: Number(event.target.value)};
    setGeoPt(newGeoPt);
}

function geoPtValid() {
    const result =  geoPt.lng > geoFence.west &&
    geoPt.lng < geoFence.east && geoPt.lat < geoFence.north &&
    geoPt.lat > geoFence.south &&
    !isNaN(parseFloat(geoPt.elv)) && isFinite(geoPt.elv);
    return (result);
}

function closeAndCancel() {
    const bsModal =  window.bootstrap.Modal.getInstance(editModalRef.current);
    bsModal.hide();
    cancelUpdate();
}

function closeAndSave() {
    const bsModal =  window.bootstrap.Modal.getInstance(editModalRef.current);
    bsModal.hide();
    updateData(geoPt);
}


return (
  <div ref={editModalRef} id="textEditModal" 
       data-bs-backdrop="static" className="modal fade" 
       tabIndex="-1">
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" aria-label="Close"
                    onClick={closeAndCancel}></button>
        </div>
        <div className="modal-body centered">
          <div>{prompt}</div>
          <div className="mb-3 centered">
           <label className="form-label" htmlFor="lat">Latitude:
              <input type="number" id="lat" name="lat" value={geoPt.lat} 
                     className="form-control centered" 
                     onChange={handleChange} /> 
            </label>
          </div>
          <div className="mb-3 centered">
            <label className="form-label" htmlFor="long">Longitude:
              <input type="number" id="long" name="lng" value={geoPt.lng} 
                     className="form-control centered" 
                     onChange={handleChange} /> 
            </label>
          </div>
          <div className="mb-3 centered">
            <label className="form-label" htmlFor="elev">Elevation (ft):
              <input type="number" id="elev" name="elv" value={geoPt.elv} 
                     className="form-control centered" 
                     onChange={handleChange} /> 
            </label>
          </div>
        </div>
        <div className="modal-footer">
            <button type="button" 
                    className="btn btn-secondary" 
                    onClick={closeAndCancel}>
                Cancel
            </button>
            <button type="button" 
                    className={"btn btn-primary" + 
                    (!geoPtValid() ? " disabled" : "")}
                    onClick={closeAndSave} >
                {buttonLabel}
            </button>
        </div>
      </div>
    </div>
  </div>
);
}