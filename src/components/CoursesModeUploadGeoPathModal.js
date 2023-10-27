import {useRef, useState, useEffect} from 'react';
import Papa from "papaparse";
 
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

export default function CoursesModeUploadGeoPathModal({title, prompt, buttonLabel, updateData, cancelUpdate}) {

const uploadModalRef = useRef();
const [uploadedPath, setUploadedPath] = useState(null);

useEffect(() => {
    const bsModal =  window.bootstrap.Modal.getOrCreateInstance(uploadModalRef.current);
    bsModal.show();
},[]);

function handleChange(event) {
    Papa.parse(event.target.files[0], {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            /* Build JSON object of path */
            const path = results.data.map((d) => {
              return({
                    lat: d.Lat,
                    lng: d.Lng,
                    dist: d["Distance (feet)"],
                    elv: d["Elevation (feet)"],
                    slope: d["Slope (degrees)"]
             });
            });
            alert(JSON.stringify(path));
            setUploadedPath(path);
        }
    });
}


function closeAndCancel() {
    const bsModal =  window.bootstrap.Modal.getInstance(uploadModalRef.current);
    bsModal.hide();
    cancelUpdate();
}

function closeAndSave() {
    const bsModal =  window.bootstrap.Modal.getInstance(uploadModalRef.current);
    bsModal.hide();
    updateData(uploadedPath);
}


return (
  <div ref={uploadModalRef} id="uploadModal" 
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
           <label className="form-label" htmlFor="file">Select File:
              <input type="file" name="file" id="file" 
                     className="form-control centered" 
                     onChange={handleChange} 
                     accept=".csv" /> 
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
                    (uploadedPath==null ? " disabled" : "")}
                    onClick={closeAndSave}>
                {buttonLabel}
            </button>
        </div>
      </div>
    </div>
  </div>
);
}