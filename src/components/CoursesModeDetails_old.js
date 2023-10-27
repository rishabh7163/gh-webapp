import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useState, useEffect, useRef} from 'react';
import CoursesModeStarRating from './CoursesModeStarRating';
import CoursesModeEditTextModal from './CoursesModeEditTextModal';
import CoursesModeEditImageModal from './CoursesModeEditImageModal';
   
 /*************************************************************************
 * File: coursesModeDetails.js
 * This file defines the CoursesModeDetails React component, which enables
 * users to view and edit the full range of data stored on a golf course.
 * Ultimately, the geodata on a golf course will be editable through a 
 * geomap user interface in Mapbox. However, the geodata can also be
 * entered by hand through this UI.
 ************************************************************************/

export default function CoursesModeDetails({course, updateCourseDetails, closeCourseDetails}) {

    const [updatedCourse, setUpdatedCourse] = useState(course);
    const [showEditTextModal, setShowEditTextModal] = useState({show: false});
    const [showEditImageModal, setShowEditImageModal] = useState(false);
    
    //Ensure all expected course props are present; create them if not
    useEffect(() => {
        const newUpdatedCourse = {...updatedCourse};
        if (!Object.hasOwn(updatedCourse,'website'))
            newUpdatedCourse.website = "";
        if (!Object.hasOwn(updatedCourse,'mapsUrl'))
            newUpdatedCourse.mapsUrl = "";
        if (!Object.hasOwn(updatedCourse,'numHoles'))
            newUpdatedCourse.numHoles = 18;
        if (!Object.hasOwn(updatedCourse,'sgContactName'))
            newUpdatedCourse.sgContactName = "";
        if (!Object.hasOwn(updatedCourse,'sgContactDetails'))
            newUpdatedCourse.sgContactDetails = "";
        if (!Object.hasOwn(updatedCourse,'sgNotes'))
            newUpdatedCourse.sgNotes = "";
        if (!Object.hasOwn(updatedCourse,'sgFriendlinessRating'))
            newUpdatedCourse.sgFriendlinessRating = 0;
        if (!Object.hasOwn(updatedCourse,'tees'))
            newUpdatedCourse.tees = "";
        setUpdatedCourse(newUpdatedCourse);
    },[]);
   
    function openTextEditModal(propertyDisplayName, propertyName, propertyData) {
        setShowEditTextModal({show: true, 
                          propDisplayName: propertyDisplayName,
                          propName: propertyName,
                          propData: propertyData});
    }

    function updateDataFromModal(newVal) {
        updateCourseVal(showEditTextModal.propName,newVal);
        setShowEditTextModal({show: false});
    }

    function updateImageFromModal(newVal) {
        updateCourseVal("imageUrl",newVal);
        setShowEditImageModal(false);
    }

    function cancelUpdateTextFromModal() {
        setShowEditTextModal(false);
    }

    function updateCourseVal(prop, val) {
        const newUpdatedCourse = {...updatedCourse};
        newUpdatedCourse[prop] = val;
        setUpdatedCourse(newUpdatedCourse);
    }

    return (
    <>  {showEditTextModal.show ? 
          <CoursesModeEditTextModal 
            title={"Update " + showEditTextModal.propDisplayName} 
            prompt={"Enter new " + showEditTextModal.propDisplayName + ":"}
            data={showEditTextModal.propData}
            updateData = {updateDataFromModal} 
            cancelUpdate={()=>setShowEditTextModal({show:false})} /> : null
        }
        {showEditImageModal ?
          <CoursesModeEditImageModal 
            title={"Update Course Image"}
            prompt={"Enter new URL for Course Image"}
            imageUrl={updatedCourse.imageUrl}
            updateImage={updateImageFromModal}
            cancelUpdate={()=>setShowEditImageModal(false)} /> : null
        }
        <div className="img-with-button-container">
            <img className="img-course" src={updatedCourse.imageUrl} alt="Golf Course" />
            <button className="btn-overlaid" onClick={()=>setShowEditImageModal(true)}>
                <FontAwesomeIcon icon="edit"/>
            </button>
        </div>
        <div className="centered">
            <div className="float-center">
                <h3>{updatedCourse.shortName}</h3>&nbsp;
                <button className="btn-theme" 
                        onClick={()=>openTextEditModal("Course Name","shortName",
                                     {val: updatedCourse.shortName,
                                      type: "text",
                                      size: "30",
                                      emptyAllowed: false})}>
                    <FontAwesomeIcon icon="edit"/>
                </button>
            </div>
            <label className="bold" htmlFor="addr">Address:</label>
            <div id="addr" className="float-center">
                <div>{updatedCourse.address}</div>&nbsp;
                <button className="btn-theme" 
                         onClick={()=>openTextEditModal("Course Address","address",
                         {val: updatedCourse.address,
                          type: "text",
                          size: "50",
                          emptyAllowed: false})}>
                    <FontAwesomeIcon icon="edit"/>
                </button>
            </div>
            <label className="bold" htmlFor="state">State/Province:</label>
            <div id="state" className="float-center">
                <div>{updatedCourse.state}</div>&nbsp;
                <button className="btn-theme"
                        onClick={()=>openTextEditModal("Course State/Province","state",
                        {val: updatedCourse.state,
                         type: "text",
                         size: "20",
                         emptyAllowed: false})}>
                    <FontAwesomeIcon icon="edit"/>
                </button>
            </div>
            <label className="bold" htmlFor="country">Country:</label>
            <div id="country" className="float-center">
                <div>{updatedCourse.country}</div>&nbsp;
                <button className="btn-theme"
                        onClick={()=>openTextEditModal("Course Country","country",
                                     {val: updatedCourse.country,
                                      type: "text",
                                      size: "20",
                                      emptyAllowed: false})}>
                    <FontAwesomeIcon icon="edit"/>
                </button>
            </div>
            <label className="bold" htmlFor="phone">Phone Number:</label>
            <div id="phone" className="float-center">
                <div>{updatedCourse.phoneNumber}</div>&nbsp;
                <button className="btn-theme"
                         onClick={()=>openTextEditModal("Course Phone Number","phoneNumber",
                                     {val: updatedCourse.phoneNumber,
                                      type: "tel",
                                      size: "15",
                                      emptyAllowed: false})}>
                    <FontAwesomeIcon icon="edit"/>
                </button>
            </div>
            <label className="bold" htmlFor="sgContact">Website:</label>
            <div id="website" className="float-center">
                <div><a href={updatedCourse.website} target="_blank">{updatedCourse.website}</a></div>&nbsp;
                <button className="btn-theme"
                         onClick={()=>openTextEditModal("Course Web Site","website",
                                     {val: updatedCourse.website,
                                      type: "url",
                                      size: "50",
                                      emptyAllowed: false})}>
                    <FontAwesomeIcon icon="edit"/>
                </button>
            </div>
            <label className="bold" htmlFor="sgContact">Google Maps Page:</label>
            <div id="website" className="float-center">
                <div><a href={updatedCourse.mapsUrl} target="_blank">{updatedCourse.mapsUrl}</a></div>&nbsp;
                <button className="btn-theme"
                         onClick={()=>openTextEditModal("Course Google Maps Page","mapsUrl",
                                     {val: updatedCourse.mapsUrl,
                                      type: "url",
                                      size: "50",
                                      emptyAllowed: false})}>
                    <FontAwesomeIcon icon="edit"/>
                </button>
            </div>
            <label className="bold" htmlFor="sgContact">Number of Holes:</label>
                        <div id="state" className="float-center">
                <div>{updatedCourse.numHoles}</div>&nbsp;
                <button className="btn-theme"
                        onClick={()=>openTextEditModal("Number of Holes","numHoles",
                        {val: updatedCourse.numHoles,
                         type: "number",
                         min: "1",
                         max: "22",
                         emptyAllowed: false})}>
                    <FontAwesomeIcon icon="edit"/>
                </button>
            </div>
            <label className="bold" htmlFor="sgContact">Speedgolf Contact Name:</label>
                        <div id="state" className="float-center">
                <div>{updatedCourse.sgContactName}</div>&nbsp;
                <button className="btn-theme"
                        onClick={()=>openTextEditModal("Speedgolf Contact Name","sgContactName",
                        {val: updatedCourse.sgContactName,
                         type: "text",
                         size: "30",
                         emptyAllowed: true})}>
                    <FontAwesomeIcon icon="edit"/>
                </button>
            </div>
            <label className="bold" htmlFor="sgContactDetails">Speedgolf Contact Email:</label>
                        <div id="state" className="float-center">
                <div>{updatedCourse.sgContactDetails}</div>&nbsp;
                <button className="btn-theme"
                        onClick={()=>openTextEditModal("Speedgolf Contact Email","sgContactDetails",
                                     {val: updatedCourse.sgContactDetails,
                                      type: "email",
                                      size: "30",
                                      emptyAllowed: true})}>
                    <FontAwesomeIcon icon="edit"/>
                </button>
            </div>
            <label className="bold" htmlFor="sgFriendliness">Speedgolf Friendliness Rating:</label>
            <div id="sgFriendliness" className="float-center">
                <CoursesModeStarRating maxStars={5} numStars={updatedCourse.sgFriendlinessRating} />  
                <button className="btn-theme"
                        onClick={()=>openTextEditModal("Speedgolf Friendliness Rating","sgFriendlinessRating",
                        {val: updatedCourse.sgFriendlinessRating,
                         type: "number",
                         min: "0",
                         max: "5",
                         emptyAllowed: false})}>
                    <FontAwesomeIcon icon="edit"/>
                </button>
            </div>
            <label className="bold" htmlFor="sgNotes">Speedgolf Notes:</label>
                        <div id="state" className="float-center txt-wrap">
                <div className="notes-div">{updatedCourse.sgNotes}</div>&nbsp;
                <button className="btn-theme"
                        onClick={()=>openTextEditModal("Speedgolf Notes","sgNotes",
                        {val: updatedCourse.sgNotes,
                         type: "textarea",
                         size: "40",
                         lines: "5",
                         emptyAllowed: true})}>
                    <FontAwesomeIcon icon="edit"/>
                </button>
            </div>         
        </div>
        <div className="mode-page-btn-container">
            <button className="dialog-primary-btn"
                type="button" onClick={()=>updateCourseDetails(updatedCourse)}>
                <FontAwesomeIcon icon="save"/>&nbsp;Save Changes 
            </button>
            <button className="dialog-cancel-btn"
                type="button" onClick={closeCourseDetails}>
                <FontAwesomeIcon icon="xmark"/>&nbsp;Cancel</button>
            </div>
     </>    
    );

 };