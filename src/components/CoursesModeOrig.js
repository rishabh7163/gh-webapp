 /*************************************************************************
 * File: coursesModeOrig.js
 * This file defines the CoursesMode react component, which implements
 * SpeedScore's "Courses" mode
 ************************************************************************/
 import {useState, useRef} from 'react';
 import {FontAwesomeIcon } from '@fortawesome/react-fontawesome'
 
 function CoursesMode() {
     const [showDialog, setShowDialog] = useState(false);
     const [autocomplete, setAutocomplete] = useState({boxContents: "", suggestions: [], validCourseChosen: false});
     const dialog = useRef();
     const addBtn = useRef();
     const cancelBtn = useRef();
     const courseSearch = useRef();
     const autocompleteService = new window.google.maps.places.AutocompleteService();
     let  autocompleteSessionToken = null; //null == no current session
     let newSearchValue = "";
 
     /*************************************************************************
      * @function handleClick 
      * @Desc 
      * When the user clicks any button, invoke the external JavaScript function
      *  transitionFromDialog (if showDialog is true) or transitionToDialog 
      * (if showDialog is false) to hide/display banner bar and mode tabs. Then
      * toggle the showDialog state variable to force a re-rendering of the 
      * component.
      *************************************************************************/
     function handleClick() {
         if (showDialog) {
             setAutocomplete({boxContents: "", suggestions: []});
             window.transitionFromDialog(null);
         } else {
             window.transitionToDialog(null,"Add Course",function(){});
         }
         setShowDialog(!showDialog);
     }
 
     /*************************************************************************
      * @function handleAutocompleteItemClick 
      * @Desc 
      * When the user clicks on an item in the autocomplete dropdown, we 
      * place that item in the autocomplete box and set the list of automatches to
      * empty (signifying the end of an autocomplete session).
      * This forces a re-render.  
      *************************************************************************/
     function handleAutocompleteItemClick(item) {
         autocompleteSessionToken = null; //Session is over
         setAutocomplete({boxContents: item.name, suggestions: [], validCourseChosen: true}); //Force re-render    
     }
 
     /*************************************************************************
      * @function updateAutocompleteMatches 
      * @param suggestions, an array of suggestions returned by getPlacePredictions()
      * @Desc status, the status returned by getPlacePredictions()
      * This is the function called by the Google Places API 
      * getPlacePredictions() function after it retrieves the suggestions based on
      * the latest contents of the autocomplete field. We update the 
      * autocompleteMatches state variable with the latest suggestions, triggering a 
      * re-rendering of the component.
      *************************************************************************/
     function updateAutocomplete(suggestions, status) {
         if (status !== window.google.maps.places.PlacesServiceStatus.OK || 
             !suggestions) {
             setAutocomplete({boxContents: newSearchValue, suggestions: [], validCourseChosen: false});
             return;
         }
         let filteredSuggestions = [];
         suggestions.forEach((suggestion) => {
             const items = suggestion.description.split(",");
             if (items[0].includes("Golf") && 
                 (items[0].includes("Course") || items[0].includes("Links") || 
                     items[0].includes("Resort") || items[0].includes("Club")) &&
                     !items[0].includes("Disc") && !items[0].includes("Academy") &&
                     !items[0].includes("Driving Range"))
             {
                 filteredSuggestions.push({name: suggestion.description, id: suggestion.place_id});
             }
         });
         setAutocomplete({boxContents: newSearchValue, 
                          suggestions: filteredSuggestions, 
                          validCourseChosen: false}); //force re-render
     }
 
     /*************************************************************************
      * @function handleKeyPress 
      * @Desc 
      * When the user presses a key, check if it is the tab, enter, or escape
      * key (the three keys we care about). If so, determine which element had
      * the focus and act accordingly: If tab or shift-tab, then shift the focus
      * to next or previous element. If Enter, then call upon handleClick().
      *************************************************************************/
     async function handleKeyPress(event) {   
         //event.preventDefault();
         if (event.code === "Escape") {
             handleClick();
             return;
         } 
         if (event.code === "Enter" && (document.activeElement === addBtn.current || document.activeElement === cancelBtn.current)) {
             handleClick();
             return;
         }
         if (document.activeElement === dialog.current && event.code === "Tab" && event.shiftKey) {
                 cancelBtn.current.focus();
                 return;
         }
         if (document.activeElement === dialog.current && event.code === "Tab") {
             addBtn.current.focus();
             return;
         }
         if (document.activeElement === addBtn.current && event.code === "Tab" && event.shiftKey) {
             dialog.current.focus();
             event.stopPropagation();
             return;
         }
         if (document.activeElement === addBtn.current && event.code === "Tab") {
             cancelBtn.current.focus();
             event.stopPropagation();
             return;
         }
         if (document.activeElement === cancelBtn.current && event.code === "Tab" &&  event.shiftKey) {
             addBtn.current.focus();
             event.stopPropagation();
             return;
         }
         if (document.activeElement === cancelBtn.current && event.code === "Tab") {
             dialog.current.focus();
             event.stopPropagation();
             return;
         }
     }
 
     function handleAutocompleteChange(event) {
         newSearchValue = event.target.value;
         if (newSearchValue === "") {
             setAutocomplete({boxContents: "", suggestions: [], validCourseChosen: false});
             return;
         }
         if (autocompleteSessionToken === null) { //start new session
             autocompleteSessionToken = new window.google.maps.places.AutocompleteSessionToken();
         }
         autocompleteService.getPlacePredictions({
             input: newSearchValue + " Golf",
             types: ['establishment'],
             sessionToken: autocompleteSessionToken}, 
             updateAutocomplete); 
     }
 
     /* JSX code to render the component */
     if (!showDialog) {
         return (
             <>
             <h1 className="mode-page-header">Courses</h1>
             <p className="mode-page-content">This page is under construction"</p>
             <img className="mode-page-icon" src="sslogo_lg.png" alt="SpeedScore logo"/>
             <button className="float-btn" onClick={handleClick}>
                 <FontAwesomeIcon icon="map-pin" />&nbsp;Add Course</button>
             </>
         );
     } else { //showDialog!
       return (
         <div id="coursesModeDialog" ref={dialog} tabIndex="0"
             className="action-dialog centered" role="dialog" 
             aria-modal="true" aria-labelledby="newCourseHeader" 
             onKeyDown={handleKeyPress}>
             <h1>Add Course</h1>
             <div className="mb-3 centered">
                 <label htmlFor="courseSearch" className="form-label">Search for Course:</label><br/>
                 <div className="autocomplete-wrapper">
                     <input id="courseSearch" 
                             ref={courseSearch} type="text" 
                             className="form-control-lg centered autocomplete-input"
                             placeholder="Enter a golf course" 
                             aria-describedby="courseSearchDescr"
                             value={autocomplete.boxContents}
                             onChange={handleAutocompleteChange} />
                     <div className="autocomplete-results-wrapper"> 
                         <ul className="autocomplete-results">
                             {autocomplete.suggestions.map((item) => {
                                 return (
                                     <li key={item.id} 
                                         className="autocomplete-item" 
                                         onClick={()=>handleAutocompleteItemClick(item)}>
                                         {item.name}
                                         {/* List of results go here */}
                                     </li>);
                             })}
                         </ul>
                     </div>
                 </div>
                 <div id="courseSearchDescr" className="form-text">
                       Enter a golf course to search for 
                 </div>
             </div>
             <div className="mode-page-btn-container">
             <button id="coursesModeAddBtn" ref ={addBtn} tabIndex="0"
                     className={autocomplete.validCourseChosen ? 
                             "mode-page-btn action-dialog action-button" : 
                             "mode-page-btn action-dialog action-button disable-btn"}
                     type="button" onClick={handleClick} 
                     onKeyDown={handleKeyPress}>Add Course</button>
             <button id="coursesModeCancelBtn" ref={cancelBtn} tabIndex="0"
                     className="mode-page-btn action-dialog cancel-button"
                     type="button" onClick={handleClick}
                     onKeyDown={handleKeyPress}>Cancel</button>
             </div>
         </div> 
       );
     }
 }
 
 export default CoursesModeOrig;