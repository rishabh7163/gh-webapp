import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useState} from 'react';
import CoursesModeEditTextModal from './CoursesModeEditTextModal';
import CoursesModeDetailsBasic from './CoursesModeDetailsBasic';
import CoursesModeDetailsSG from './CoursesModeDetailsSG'
import CoursesModeDetailsTees from './CoursesModeDetailsTees';
import CoursesModeDetailsHoleTable from './CoursesModeDetailsHoleTable';
import CoursesModeDetailsHoleMap from './CoursesModeDetailsHoleMap';
import * as SGCalcs from '../speedgolfCalculations';
   
 /*************************************************************************
 * File: coursesModeDetails.js
 * This file defines the CoursesModeDetails React component, which enables
 * users to view and edit a course's 'basic' and 'tees' data in 
 * different tabs. 
 ************************************************************************/

export default function CoursesModeDetails({course, updateCourseDetails, closeCourseDetails}) {

    const [addEditTeeDialog, setAddEditTeeDialog] = useState({show: false});
    const [updatedCourse, setUpdatedCourse] = useState(course);
    const [selectedTee, setSelectedTee] = 
      useState(course.tees === "" ? null: Object.keys(course.tees)[0]);
    const [distUnits, setDistUnits] = useState("Imperial");

    const sgRatingFactors = ["sgMembership", "sgRoundDiscount", "sgStandingTeeTimes", "sgPlay"];


    /*************************************************************************
     * @function handleSelectedTeeChange
     * @param event, the event object returned by the event handler
     * @Desc 
     * Update the selected tee to the tee chosen.
     *************************************************************************/
    function handleSelectedTeeChange(event) {
        setSelectedTee(event.target.value);
    }

    /*************************************************************************
     * @function toggleUnits
     * @param event, the event object returned by the event handler
     * @Desc 
     * Set the distance units when the user clicks on "Imperial" or "Metric"
     * radio button.
     *************************************************************************/
    function toggleUnits(event) {
        setDistUnits(event.target.value);
    }

    /*************************************************************************
     * @function addEditTee
     * @param teeName, the name of the tee being added or edited
     * @Desc 
     * If the user is changing the name of the current tee, update that name.
     * Otherwise, add a new tee with name teeName and set it as current tee.
     *************************************************************************/
    function addEditTee(teeName) {
        const updatedTees = (updatedCourse.tees === "" ? {} : {...updatedCourse.tees});
        if (addEditTeeDialog.prevTee !== "") {
            updatedTees[teeName] = updatedCourse.tees[addEditTeeDialog.prevTee];
            delete updatedTees[addEditTeeDialog.prevTee];
        } else {
            const newTee = {
              name: teeName,
              golfDistance: "",
              runningDistance: "",
              mensStrokePar: "",
              womensStrokePar: "",
              womensTimePar: "",
              mensTimePar: "",
              mensSlope: "",
              womensSlope: "",
              mensRating: "",
              womensRating: "",
              holes: Array.from({length: updatedCourse.numHoles}, (_, i) => ({
                number: i+1,
                name: "",
                golfDistance: "",
                runDistance: "",
                transRunDistance: "",
                golfRunDistance: "",
                womensHandicap: "",
                mensHandicap: "",
                womensStrokePar: "",
                mensStrokePar: "",
                womensTimePar: "",
                mensTimePar: "",
                teeLoc: "",
                flagLoc: "",
                golfPath: "",
                golfPathSampled: "",
                transitionPath: "",
                transitionPathSampled: "",
                green: "",
                teebox: "",
            })),
            numHolesGolfDataComplete: 0,
            numHolesPathDataComplete: 0,
            numHolesPolyDataComplete: 0,
            pathInsertionPoint: {path: 'golfPath', holeNum: 1},
            polyInsertionPoint: {poly: 'teebox', holeNum: 1}
          };
          updatedTees[teeName] = newTee;
        }
        setSelectedTee(teeName);
        updateTees(updatedTees);
        setAddEditTeeDialog({show: false});
    }

    /*************************************************************************
     * @function cancelAddEditTee
     * @Desc 
     * Close the Add/Edit tee dialog box without making changes.
     *************************************************************************/
    function cancelAddEditTee() {
        setAddEditTeeDialog({show: false});
    }

    /*************************************************************************
     * @function openAddEditTeeDialog
     * @param editing, a boolean indicating whether the user is editing the
     * name of the current tee
     * @Desc 
     * Open a dialog box to allow the user to either edit the current tee's
     * name or add a new tee.
     *************************************************************************/
    function openAddEditTeeDialog(editing) {
        const dialogData = {
            val: (editing ? selectedTee : ""),
            type: "text",
            size: 20,
            emptyAllowed: false,
            disallowed: (updatedCourse.tees === "" ? [] : Object.keys(updatedCourse.tees))
        };
        setAddEditTeeDialog({show: true, data: dialogData, prevTee: (editing ? selectedTee : "")});
    }
    
    /*************************************************************************
     * @function updateCourseVal
     * @param prop, the property whose value is to be updated
     * @param val, the new value for prop
     * @Desc 
     * Create a new updatedCourse object with the updated property value,
     * forcing a state change and re-render.
     *************************************************************************/
    function updateCourseVal(prop, val) {
        const newUpdatedCourse = {...updatedCourse};
        newUpdatedCourse[prop] = val;
        if (newUpdatedCourse.sgPlay === "sgNotAllowed") {
            newUpdatedCourse.sgMembership = false;
            newUpdatedCourse.sgRoundDiscount = false;
            newUpdatedCourse.sgStandingTeeTimes = false;
        }
        if (sgRatingFactors.includes(prop)) {
            let rating = 0;
            switch (newUpdatedCourse.sgPlay) {
                case "sgAnytime":
                    rating = 3;
                break;
                case "sgRegularTeeTimesOnly":
                    rating = 2;
                break;
                case "sgSpecialArrangementOnly":
                    rating = 1;
                break;
                default:
                break;
            }
            if (rating > 0) {
                if (newUpdatedCourse.sgStandingTeeTimes)
                    rating++;
                if (newUpdatedCourse.sgMembership || newUpdatedCourse.sgRoundDiscount)
                    rating++;
            }
            newUpdatedCourse.sgFriendlinessRating = rating;
        }
        setUpdatedCourse(newUpdatedCourse);
    }

    /*************************************************************************
     * @function updateNumHolesPathDataComplete
     * @param newHoles, the updated holes array
     * @Desc 
     * Return the number of holes for which we have complete golf data (i.e.,
     * golfDistance, womensStrokePar, and mensStrokePar data)
     *************************************************************************/
    function updateNumHolesPathDataComplete(newHoles) {
        let count = 0;
        for (let i=0; i < newHoles.length; ++i) {
            switch (i) {
                case 0: //Special case: First hole
                  if (Object.hasOwn("startPath")) {
                    if (newHoles[0].startPath !== "" && newHoles[0].golfPath !== "" && 
                      newHoles[0].transitionPath !== "") {
                      count++;
                    } 
                  }  else {
                    if (newHoles[0].startPath !== "" && newHoles[0].golfPath !== "") {
                      count++
                    }
                  }
                break;
                case newHoles.length-1: //Special case: Last hole
                    if (Object.hasOwn("finishPath")) {
                        if (newHoles[newHoles.length-1].finishPath !== "" && newHoles[newHoles.length-1].golfPath !== "" && 
                          newHoles[newHoles.length-1].transitionPath !== "") {
                          count++;
                        } 
                      }  else {
                        if (newHoles[newHoles.length-1].startPath !== "" && newHoles[newHoles.length-1].golfPath !== "") {
                          count++;
                        }
                      }
                break;
                default: //General case
                  if (newHoles[i].golfPath !== "" && 
                      newHoles[i].transitionPath !== "") {
                        count++;
                  }
                break;
            }

        }
        return count;
    }

    /*************************************************************************
     * @function updatePathInsertionPoint
     * @param newHoles, the updated holes array
     * @Desc 
     * Return an object indicating the path type ('startPath', 'transitionPath',
     * 'golfPath' or 'finishPath) and hole number where the user must define
     * the next path. If all paths have been defined, the object's 'path' 
     * prop is set to ""
     *************************************************************************/
    function updatePathInsertionPoint(newHoles) {
        const pt = {
            path: "",
            holeNum: newHoles.length
        };
        for (let i=0; i < newHoles.length; ++i) {
            if (i===0 && Object.hasOwn(newHoles[i],'startPath') && newHoles[i].startPath === "") {
                pt.path = 'startPath';
                pt.holeNum = i+1;
                return pt;
            }
            if (i !== 0 && newHoles[i].transitionPath === "") {
                pt.path = 'transitionPath';
                pt.holeNum = i+1;
                return pt;
            }
            if (newHoles[i].golfPath === "") {
                pt.path = 'golfPath';
                pt.holeNum = i+1;
                return pt;
            }
            if (i===newHoles.length-1 && Object.hasOwn(newHoles[i],'finishPath') && newHoles[i].finishPath === "") {
                pt.path = 'finishPath';
                pt.hole = i+1;
                return pt;
            }
        }
        return pt;
    }

    
    /*************************************************************************
     * @function updateNumHolesPolyDataComplete
     * @param newHoles, the updated holes array
     * @Desc 
     * Return the number of holes for which we have complete polygon data (i.e.,
     * teebox and green data)
     *************************************************************************/
    function updateNumHolesPolyDataComplete(newHoles) {
        let count = 0;
        for (let i = 0; i < newHoles.length; ++i) {
            if (newHoles[i].teebox !== "" && newHoles[i].green !== "") {
                count++;
            }
        }
        return count;
    }

     /*************************************************************************
     * @function updatePolyInsertionPoint
     * @param newHoles, the updated holes array
     * @Desc 
     * Return an object indicating the poly type ('teebox', 'green') and 
     * hole number where the user must define
     * the next polygon. If all polygons have been defined, the object's 
     * 'poly' prop is set to "".
     *************************************************************************/
     function updatePolyInsertionPoint(newHoles) {
        const pt = {
            poly: "",
            holeNum: newHoles.length
        };
        for (let i = 0; i < newHoles.length; ++i) {
            if (newHoles[i].teebox === "") {
                pt.poly = 'teebox';
                pt.holeNum = i+1;
                return pt;
            }
            if (newHoles[i].green === "") {
                pt.poly = 'green';
                pt.holeNum = i+1;
                return pt;
            }
        }
        return pt;
    }

    /*************************************************************************
     * @function updateNumHolesGolfDataComplete
     * @param newHoles, the updated holes array
     * @Desc 
     * Return the number of holes for which we have complete golf data (i.e.,
     * golfDistance, womensStrokePar, and mensStrokePar data)
     *************************************************************************/
    function updateNumHolesGolfDataComplete(newHoles) {
        let count = 0;
        for (let i=0; i < newHoles.length; ++i) {
            if (newHoles[i].golfDistance !== "" && 
                newHoles[i].womensStrokePar !== "" &&
                newHoles[i].mensStrokePar !== "") {
                count++;
            }
        }
        return count;
    }

    /*************************************************************************
     * @function updateTees
     * @param newTees, a tee object
     * @Desc 
     * Create a new updatedCourse object whose tees prop is assigned to tees
     *************************************************************************/
    function updateTees(newTees) {
        updateCourseVal("tees",newTees);
    }

    /*************************************************************************
     * @function updateHoles
     * @param newHoles, a holes array
     * @Desc 
     * Create a new updatedCourse object whose tees[selectedTee] prop 
     * is assigned to holes
     *************************************************************************/
    function updateHoles(newHoles) {
        const newTees = {...updatedCourse.tees};
        newTees[selectedTee].holes = newHoles;
        newTees[selectedTee].numHolesGolfDataComplete = updateNumHolesGolfDataComplete(newHoles);
        updateCourseVal("tees",newTees); 
      }

    /*************************************************************************
     * @function updateFeature
     * @param holeNum, the number of the hole whose feature is to be updated
     * @param featureType: 'startPath', 'transitionPath', 'golfPath',
     *        'finishPath', 'teebox', 'green'
     * @param featureCoords, an array of coord objects {lat, lng, elv} defining
     *        the feature
     * @param sampledPathCoords, an array of coord objects in 50' intervals
     *        defining the path. Apply only to paths. Used to compute 
     *        running stats but not displayed on the map.
     * @Desc 
     * Upate the hole's featureType with the new coords; if the feature
     * is a path, use SGCalcs.getHoleRunningStats() to update the 
     * corresponding hole's running distances and time pars. Note that
     * SGCalcs.getHoleRunningStats() is cleverly designed to return empty
     * data if any required path data is missing. This means we don't need
     * to worry about checking for this here.
     *************************************************************************/
      function updateFeature(holeNum,featureType,featureCoords, sampledPathCoords=null) {
        const updatedTees = {...updatedCourse.tees};
        const thisHole = {...updatedTees[selectedTee].holes[holeNum-1]};
        //const numHoles = updatedTees[selectedTee].holes.length; //TODO declared but never used.
        let runStats;
        thisHole[featureType] = featureCoords;
        if (featureType === 'teebox' || featureType === 'green') {
            //Simple case: Feature is a polygon.
            thisHole[featureType] = featureCoords;
            updatedTees[selectedTee].holes[holeNum-1] = thisHole;
            updatedTees[selectedTee].numHolesPolyDataComplete = updateNumHolesPolyDataComplete(updatedTees[selectedTee].holes);
            updatedTees[selectedTee].polyInsertionPoint = updatePolyInsertionPoint(updatedTees[selectedTee].holes);
            updateTees(updatedTees);
        } else {
            //Tricky case: Feature is a path
            thisHole[featureType + "Sampled"] = sampledPathCoords;
            if (holeNum === 1) {
                //CASE 1: Starting hole--could have startPath
                if (Object.hasOwn(thisHole,"startPath")) {
                    runStats = SGCalcs.getHoleRunningStats(thisHole.startPathSampled, thisHole.golfPathSampled,
                        thisHole.womensStrokePar, thisHole.mensStrokePar);
                }
                else {
                    //Calculate stats based on empty start path
                    runStats = SGCalcs.getHoleRunningStats([], thisHole.golfPathSampled,
                        thisHole.womensStrokePar, thisHole.mensStrokePar);
                }
            } else if (holeNum === updatedTees[selectedTee].holes.length) {
                //CASE 2: Finishing hole--could have finishPath
                if (Object.hasOwn(thisHole,"finishPath")) {
                    runStats = SGCalcs.getHoleRunningStats(thisHole.transitionPathSampled, thisHole.golfPathSampled,
                        thisHole.womensStrokePar, thisHole.mensStrokePar, thisHole.finishPathSampled);
                }
                else {
                    //Calculate stats based on no finish path
                    runStats = SGCalcs.getHoleRunningStats(thisHole.transitionPathSampled, thisHole.golfPathSampled,
                        thisHole.womensStrokePar, thisHole.mensStrokePar);
                }
            } else {
                //CASE 3: General case: Not start or finish hole
                runStats = SGCalcs.getHoleRunningStats(thisHole.transitionPathSampled, thisHole.golfPathSampled,
                    thisHole.womensStrokePar, thisHole.mensStrokePar);
            }
            thisHole.runDistance = runStats.runDistance;
            thisHole.transRunDistance = runStats.transPathRunDistance;
            thisHole.golfRunDistance = runStats.golfPathRunDistance;
            if (Object.hasOwn(thisHole,"finishPath")) {
                thisHole.finishPathRunDistance = runStats.finishPathRunDistance;
            }
            thisHole.womensTimePar = runStats.womensTimePar;
            thisHole.mensTimePar = runStats.mensTimePar;
            updatedTees[selectedTee].holes[holeNum-1] = thisHole;
            updatedTees[selectedTee].numHolesPathDataComplete = updateNumHolesPathDataComplete(updatedTees[selectedTee].holes);
            updatedTees[selectedTee].pathInsertionPoint = updatePathInsertionPoint(updatedTees[selectedTee].holes);
            updateTees(updatedTees);
        }
    } 
  
    return (
      addEditTeeDialog.show ? 
        <CoursesModeEditTextModal 
          title={addEditTeeDialog.prevTee === "" ? "Add Tee" : "Update Tee Name"} 
          prompt={addEditTeeDialog.prevTee === "" ? "Enter a new tee name:" : "Enter updated name for tee:"} 
          buttonLabel={addEditTeeDialog.prevTee === "" ? "Add" : "Edit"}
          data={addEditTeeDialog.data}
          updateData={addEditTee}
          cancelUpdate={cancelAddEditTee} /> :
     <section>
       <h1 className="centered">{updatedCourse.shortName}</h1>
       <div className="flex-container-centered centered">
        <div>
            <label className="form-label" htmlFor="tees">Selected Tees:</label><br></br>
            <select className="form-select-sm centered" 
                    value={selectedTee === null ? "": selectedTee} 
                    id="tees" onChange={handleSelectedTeeChange}>
                {selectedTee === null ? 
                    <option value="No tees defined">Choose '+' to add a tee</option> :
                Object.keys(updatedCourse.tees).map((t) => {
                    return [
                    <option key={t} value={t}>{t}</option>
                    ]
                })}
            </select>&nbsp;
            <button className="btn-theme" aria-label="Add New Tee"
                    onClick={()=>openAddEditTeeDialog(false)} title="Add a set of tees">               
                <FontAwesomeIcon icon="plus"/>
            </button>&nbsp;
            {updatedCourse.tees === "" ? null :
                <button className="btn-theme" aria-label="Edit Name of Tee"
                    onClick={()=>openAddEditTeeDialog(true)} title="Edit name of selected set of tees">               
                <FontAwesomeIcon icon="edit"/>
                </button>
            }
        </div>
        <div>
            <label>Distance Units:</label>
                <div className="form-check" role="radiogroup">
                    <input className="centered" 
                            type="radio" name="Imperial" id="Imperial" 
                            onChange={toggleUnits}
                            value="Imperial" checked={distUnits==="Imperial"} />
                    <label className="form-check-label centered" htmlFor="Imperial">
                      &nbsp;Imperial
                    </label>&nbsp;&nbsp;&nbsp;
                    <input className="centered" 
                            type="radio" name="Metric" id="Metric" 
                            onChange={toggleUnits}
                            value="Metric" checked={distUnits==="Metric"}/>
                    <label className="form-check-label centered" htmlFor="Metric">
                      &nbsp;Metric
                    </label>
                </div>
            </div>
        </div>
        <ul className="nav nav-tabs" id="myTab" role="tablist">
            <li className="nav-item" role="presentation">
                <button className="nav-link active" 
                        id="basic-info-tab" data-bs-toggle="tab" data-bs-target="#basic-info" 
                        type="button" role="tab" aria-controls="basic-info" 
                        aria-selected="true">
                    Basic Info
                </button>
            </li>
            <li className="nav-item" role="presentation">
                <button className="nav-link" id="speedgolf-tab" 
                        data-bs-toggle="tab" data-bs-target="#speedgolf-info" 
                        type="button" role="tab" aria-controls="speedgolf-info" 
                        aria-selected="false">
                    Speedgolf Info
                </button>
            </li>
            <li className="nav-item" role="presentation">
                    <button className={"nav-link" + ((selectedTee === null) ? " disabled":"")} 
                        id="tees-tab" 
                        data-bs-toggle="tab" data-bs-target="#tees-info" 
                        type="button" role="tab" aria-controls="tees-info" 
                        disabled={selectedTee === null}
                        aria-selected="false">
                    Tees Info
                </button>
            </li>
            <li className="nav-item" role="presentation">
                <button className={"nav-link" + ((selectedTee === null) ? " disabled":"")}
                        id="holes-table-tab" 
                        data-bs-toggle="tab" data-bs-target="#holes-info" 
                        type="button" role="tab" aria-controls="holes-info" 
                        disabled={selectedTee === null}
                        aria-selected="false">
                    Holes Info
                </button>
            </li>
            <li className="nav-item" role="presentation">
                <button className={"nav-link" + ((selectedTee === null) ? " disabled":"")} 
                        id="holes-map-tab" 
                        data-bs-toggle="tab" data-bs-target="#path-map" 
                        type="button" role="tab" aria-controls="path-map" 
                        disabled={selectedTee === null}
                        aria-selected="false">
                    Hole Map
                </button>
            </li>
        </ul>
        <div className="tab-content" id="detailsTabContent">
            <div className="tab-pane fade show active" id="basic-info" role="tabpanel" aria-labelledby="home-tab">
                <CoursesModeDetailsBasic course={updatedCourse} updateCourseVal={updateCourseVal}/>
            </div>
            <div className="tab-pane fade" id="speedgolf-info" role="tabpanel" aria-labelledby="speedgolf-tab">
                <CoursesModeDetailsSG course={updatedCourse} updateCourseVal={updateCourseVal}/> 
            </div>
            <div className="tab-pane fade" id="tees-info" role="tabpanel" aria-labelledby="tees-tab">
                <CoursesModeDetailsTees tees={updatedCourse.tees} 
                                        updateTees={updateTees} selectedTee={selectedTee}
                                        distUnits={distUnits}/>
            </div>
            <div className="tab-pane fade" id="holes-info" role="tabpanel" aria-labelledby="holes-table-tab">
              {selectedTee === null ? null : 
                <CoursesModeDetailsHoleTable selectedTee={selectedTee} holes={updatedCourse.tees[selectedTee].holes} 
                                             updateHoles={updateHoles} distUnits={distUnits}/>}
            </div>
            <div className="tab-pane fade" id="path-map" role="tabpanel" aria-labelledby="holes-map-tab">
              {selectedTee === null ? null:
                <CoursesModeDetailsHoleMap holes={updatedCourse.tees[selectedTee].holes} 
                                           pathInsertionPt={updatedCourse.tees[selectedTee].pathInsertionPoint}
                                           polyInsertionPt={updatedCourse.tees[selectedTee].polyInsertionPoint}
                                           mapCenter={updatedCourse.geoLocation}
                                           updateFeature={updateFeature} 
                                           distUnits={distUnits} />}
            </div>
        </div>
        <br/>
        <div className="mode-page-btn-container">

            <button className="dialog-primary-btn"
                type="button" onClick={()=>updateCourseDetails(updatedCourse)}>
                <FontAwesomeIcon icon="save"/>&nbsp;Save Changes 
            </button>
            <button className="dialog-cancel-btn"
                type="button" onClick={closeCourseDetails}>
                <FontAwesomeIcon icon="xmark"/>&nbsp;Cancel</button>
            </div>
     </section>    
    );
 };