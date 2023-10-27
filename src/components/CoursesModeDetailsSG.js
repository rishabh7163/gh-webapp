import CoursesModeStarRating from './CoursesModeStarRating';

   
 /*************************************************************************
 * File: coursesModeDetailsBasic.js
 * This file defines the CoursesModeDetails React component, which enables
 * users to view and edit the basic data on a golf course.
 ************************************************************************/

export default function CoursesModeDetailsSG({course, updateCourseVal}) {
      
    function handleChange(event) {
        updateCourseVal(event.target.name, event.target.value);

    }

    function handleChecked(event) {
        updateCourseVal(event.target.name, event.target.checked);
    }

    function handleRadio(event) {
        updateCourseVal("sgPlay", event.target.value);
    }

    return (
        <form>     
          <div className="mb-3 centered">
            <label className="form-label" htmlFor="contactName">Speedgolf Contact Name:
              <input id="contactName" 
                     className="form-control centered"
                     type="text" 
                     size="50"
                     name="sgContactName" 
                     aria-describedby="contactName-descr"
                     value={course.sgContactName} 
                     onChange={handleChange}/>
            </label>
            <div id="contactName-descr" className="form-text">
                Name of person to contact if you want to inquire about speedgolf at this course
            </div>
          </div>
          <div className="mb-3 centered">
            <label className="form-label" htmlFor="contactEmail">Speedgolf Contact Details:
              <input id="contactEmail" 
                     className="form-control centered"
                     type="email" 
                     size="50"
                     name="sgContactDetails" 
                     aria-describedby= "contactEmail-descr"
                     value={course.sgContactDetails} 
                     onChange={handleChange}/>  
            </label>    
            <div id="contactEmail-descr" className="form-text">
                Email address, phone number, and/or other means of reaching speedgolf contact person
            </div>
          </div>
          <div className="mb-3 centered">
            <label className="form-label" htmlFor="starRating">Speedgolf Friendliness Rating:
              <CoursesModeStarRating numStars={course.sgFriendlinessRating} maxStars={5} />
            </label>    
            <div id="friendlinessRating-descr" className="form-text">
                Course's speedgolf friendliness rating (0 to 5 stars), automatically calculated based on factors below.  
            </div>
          </div>
          <fieldset className="centered">
          <div className="mb-3">
            <div className="form-check" role="radiogroup">
            <legend id="sgAllowedLabel" className="form-label" htmlFor="sgAllowed">
                Speedgolf Play Policy
            </legend>
            <input id="sgAnytime" 
                     className="centered"
                     type="radio" 
                     value="sgAnytime"
                     checked={course.sgPlay === "sgAnytime"} 
                     onChange={handleRadio}/>
            <label htmlFor="sgRegularOnly">&nbsp;Allowed <i>anytime</i>, including before regular tee times</label> 
            <br></br>   
            <input id="sgRegularOnly" 
                     className="centered"
                     type="radio" 
                     value="sgRegularTeeTimesOnly" 
                     checked={course.sgPlay === "sgRegularTeeTimesOnly"} 
                     onChange={handleRadio}/>
            <label htmlFor="sgSpecialOnly">&nbsp;Allowed only within regular tee times</label> 
            <br></br>
            <input id="sgSpecialOnly" 
                     className="centered"
                     type="radio" 
                     value="sgSpecialArrangementOnly" 
                     checked={course.sgPlay === "sgSpecialArrangementOnly"} 
                     onChange={handleRadio}/>
            <label htmlFor="sgSpecialOnly">&nbsp;Allowed only by special arrangement</label> 
            <br></br>
            <input id="sgNotAllowed" 
                     className="centered"
                     type="radio" 
                     value="sgNotAllowed" 
                     checked={course.sgPlay === "sgNotAllowed"} 
                     onChange={handleRadio}/> 
            <label htmlFor="sgSpecialOnly">&nbsp;Not allowed</label>
          </div>
          </div>
          </fieldset>
          <fieldset className="centered" disabled={course.sgPlay === "sgNotAllowed"}>
          <legend>Speedgolf Perks</legend>
          <div className="mb-3">
            <div className="form-checked">
            <input id="membership" 
                     className="form-check-input"
                     type="checkbox" 
                     name="sgMembership" 
                     checked={course.sgMembership} 
                     onChange={handleChecked}/>
            <label className="form-check-label" htmlFor="membership">
            &nbsp;Speedgolf Memberships Available
            </label> 
            </div>   
          </div>
          <div className="mb-3">
            <div className="form-checked">
            <input id="roundDiscount" 
                     className="form-check-input"
                     type="checkbox" 
                     name="sgRoundDiscount" 
                     checked={course.sgRoundDiscount} 
                     onChange={handleChecked}/>
            <label className="form-check-label" htmlFor="roundDiscount">
            &nbsp;Speedgolf Round Discounts Available
            </label>    
            </div>
          </div>
          <div className="mb-3">
            <div className="form-checked">
            <input id="standingTeeTimes" 
                     className="form-check-input"
                     type="checkbox" 
                     name="sgStandingTeeTimes" 
                     checked={course.sgStandingTeeTimes} 
                     onChange={handleChecked}/>
            <label className="form-check-label" htmlFor="standingTeeTimes">
            &nbsp;Standing Speedgolf Tee Times Available
            </label> 
            </div>   
          </div>
          </fieldset>
          <div className="mb-3 centered">
          <label htmlFor="sgNotes" className="centered">Speedgolf Notes:</label><br></br>
          <textarea id="sgNotes" className="text-wrap" rows="7" cols="75" 
                    name="sgNotes" value={course.sgNotes} onChange={handleChange} 
                    aria-describedby='notes-descr'/>
           <div id="notes-descr" className="form-text">
                Notes and tips for speedgolfers who want to play this courses, including 
                details on the course's speedgolf policies and perks.
            </div>
          </div>
        </form>
   
    );

 };