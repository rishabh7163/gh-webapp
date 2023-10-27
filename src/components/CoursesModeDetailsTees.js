 /*************************************************************************
 * File: coursesModeDetailsTees.js
 * This file defines the CoursesModeDetailsTees React component, which enables
 * users to view and edit information on the golf course's tee sets.
 ************************************************************************/
import * as Conversions from './../conversions';

export default function CoursesModeDetailsTees({tees, updateTees, 
                                                selectedTee,
                                                distUnits}) {

    /*************************************************************************
     * @function handleTeeDataChange
     * @param event, the event object returned by the event handler
     * @Desc 
     * Update tee data to include the data entered.
     *************************************************************************/
        function handleTeeDataChange(event) {
          const updatedTees = {...tees};
          updatedTees[selectedTee][event.target.name] = Number(event.target.value);
          updateTees(updatedTees);
      }

     /*************************************************************************
     * @function handleStartFinishCheck
     * @param event, the event object returned by the event handler
     * @Desc 
     * Toggle "Tee has starting/finish" line value when user checks/unchecks box.
     *************************************************************************/
    function handleStartFinishCheck(event) {
      const updatedTees = {...tees};
      if (event.target.name === "startPath") {
        if (Object.hasOwn(updatedTees[selectedTee].holes[0],"startPath")) {
          delete updatedTees[selectedTee].holes[0].startPath;
        }
        else {
          updatedTees[selectedTee].holes[0].startPath = "";
        }
      } else { //event.target.name === "finishPath"
        if (Object.hasOwn(updatedTees[selectedTee].holes[updatedTees[selectedTee].holes.length-1],"finishPath")) {
          delete updatedTees[selectedTee].holes[updatedTees[selectedTee].holes.length-1].finishPath;
        } else {
          updatedTees[selectedTee].holes[updatedTees[selectedTee].holes.length-1].finishPath = "";
        }
      }
      updateTees(updatedTees);
    }

    /*************************************************************************
     * @function computeTotal
     * @param prop, the name of the hole prop over which to compute the total
     *          
     * @Desc 
     * Compute the total sum over all holes
     *************************************************************************/
    function computeTotal(prop) {
      const total = tees[selectedTee].holes.reduce((acc,h) =>
                           acc + (h[prop] === "" ? 0 : h[prop]),0);
      return total;
    }

    return(
            (selectedTee === null) ? null :
              <div>
                <fieldset className="centered">
                <legend>{selectedTee + " Tees Starting and Finish Lines"}</legend>
                <div className="form-check-inline">
                  <input className="form-check-input" type="checkbox" name="startPath"
                         onChange={handleStartFinishCheck}
                         checked={Object.hasOwn(tees[selectedTee].holes[0],"startPath")} />
                  <label className="form-check-label" htmlFor="flexCheckDefault">
                    &nbsp;Speedgolfers run from a starting line to first tee
                  </label>
                </div>
                <br />
                <div className="form-check-inline">
                  <input className="form-check-input" type="checkbox" name="finishPath"
                         onChange={handleStartFinishCheck}
                         checked={Object.hasOwn(tees[selectedTee].holes[tees[selectedTee].holes.length-1],"finishPath")} />
                  <label className="form-check-label" htmlFor="flexCheckChecked">
                    &nbsp;Speedgolfers  run from last hole to a finish line
                  </label>
                </div>
                </fieldset>
                <fieldset className="centered">
                <legend>
                  {"Distances and Pars from " + selectedTee + " Tees"}
                  <br/>
                  <i className="font-small">{"(based on " + tees[selectedTee].numHolesGolfDataComplete +
                    " holes with complete golf data and " + tees[selectedTee].numHolesPathDataComplete +
                    " holes with complete running path data)"}</i>
                </legend>
                <table className="table table-sm table-bordered table-narrow">
                  <tbody>
                    <tr>
                      <td className="text-end bold">Golf Distance:</td>
                      <td className="text-start">{distUnits==="Imperial" ? 
                              Conversions.toYards(computeTotal("golfDistance")) + " yards":
                              Conversions.toMeters(computeTotal("golfDistance")) + " meters"}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-end bold">Running Distance:</td>
                      <td className="text-start">{distUnits==="Imperial" ? 
                              Conversions.toMiles(computeTotal("runDistance")) + " miles" :
                              Conversions.toKilometers(computeTotal("runDistance")) + " km"}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-end bold">Stroke Par :</td>
                      <td className="text-start">
                        {computeTotal("womensStrokePar") + " (women), " + 
                          computeTotal("mensStrokePar") + " (men)"}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-end bold">Time Par:</td>
                      <td className="text-start">
                        {Conversions.toTimePar(computeTotal("womensTimePar")) + " (women), " + 
                          Conversions.toTimePar(computeTotal("mensTimePar")) + " (men)"}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p></p>
                </fieldset>
                <fieldset className="centered">
                  <legend>{"Course Rating/Slope for " + selectedTee + " Tees"}</legend>
                  <div className="mb-3 centered">
                    <label className="form-label" htmlFor="numHoles">Women's Course Rating:
                    <input id="womensRating"
                          className="form-control centered"
                          type="number" 
                          name="womensRating" 
                          value={tees[selectedTee].womensRating} 
                          onChange={handleTeeDataChange} 
                          aria-describedby="womensRating-descr" />
                    </label>
                  <div id="womensRating-descr" className="form-text">
                    {"Women's course rating for the " + selectedTee + " tee, as listed on scorecard"}
                  </div>
                </div>
                <div className="mb-3 centered">
                  <label className="form-label" htmlFor="numHoles">Women's Course Slope:
                  <input id="womensSlope" 
                        className="form-control centered"
                        type="number" 
                        name="womensSlope" 
                        value={tees[selectedTee].womensSlope} 
                        onChange={handleTeeDataChange} 
                        aria-describedby="womensSlope-descr" />
                  </label>
                  <div id="womensSlope-descr" className="form-text">
                  {"Women's course slope for the " + selectedTee + " tee, as listed on scorecard"}
                  </div>
                </div>
                  <div className="mb-3 centered">
                  <label className="form-label" htmlFor="numHoles">Men's Course Rating:
                  <input id="mensRating" 
                        className="form-control centered"
                        type="number" 
                        name="mensRating" 
                        value={tees[selectedTee].mensRating} 
                        onChange={handleTeeDataChange} 
                        aria-describedby="mensRating-descr" />
                  </label>
                  <div id="mensRating-descr" className="form-text">
                  {"Men's course rating for the " + selectedTee + " tee, as listed on scorecard"}
                  </div>
                </div>
                <div className="mb-3 centered">
                  <label className="form-label" htmlFor="numHoles">Men's Course Slope:
                  <input id="mensSlope" 
                        className="form-control centered"
                        type="number" 
                        name="mensSlope" 
                        value={tees[selectedTee].mensSlope} 
                        onChange={handleTeeDataChange} 
                        aria-describedby="mensSlope-descr" />
                  </label>
                  <div id="mensRating-descr" className="form-text">
                  {"Men's course rating for the " + selectedTee + " tee, as listed on scorecard"}
                  </div>
                </div>
                </fieldset>  
                <br/>    
              </div>
    );
    

}
