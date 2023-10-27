 /*************************************************************************
 * File: coursesMode.js
 * This file defines the CoursesMode react component, which implements
 * SpeedScore's "Courses" mode
 ************************************************************************/
import CoursesModeAdd from './CoursesModeAdd.js';
import CoursesModeMain from './CoursesModeMain.js';
import {useState} from 'react';


export default function CoursesMode() {
    const [showDialog, setShowDialog] = useState(false);
    const coursesDB = JSON.parse(localStorage.getItem("courses"));
    const [courses, setCourses] = useState(coursesDB == null ? {} : coursesDB);
    const [displayedCourses, setDisplayedCourses] = useState(courses);

    /*************************************************************************
     * @function addCourse
     * @param course, an object containing course info from the Google 
     * 'getPlacePredictions() function.  
     * @Desc 
     * Add the course to the courses database in local storage, and update
     * courses state variable.
     *************************************************************************/
    function addCourse(course) {
        const newCourses = {...courses,[course.id]: course}; //build new object
        localStorage.setItem("courses",JSON.stringify(newCourses));
        setCourses(newCourses);
        setDisplayedCourses(newCourses);
    }
  
    /*************************************************************************
     * @function filterCourses
     * @param searchString, the target search string
     * @param searchScope: the scope of the search (either "Name", "State",
     *         or "Country"
     * @Desc 
     * Update displayedCourses to include only courses that meet search
     * criteria.
     *************************************************************************/
    function filterCourses(searchString, searchScope) {
        let coursesList = {};
        if (searchString === "") {
            coursesList = {...courses};
        } else {
            Object.keys(courses).forEach((c) => {
            if (searchScope==="Name" && courses[c].shortName.toUpperCase().includes(searchString.toUpperCase())) {
                coursesList[c] = courses[c];
            } else if (searchScope==="State" && courses[c].state.toUpperCase().includes(searchString.toUpperCase())) {
                coursesList[c] = courses[c]; 
            } else if (searchScope==="Country" && courses[c].country.toUpperCase().includes(searchString.toUpperCase())) {
                coursesList[c] = courses[c];
            }
            });
        }
        setDisplayedCourses(coursesList);
    }

    /*************************************************************************
     * @function updateCourse
     * @param course, an object containing updated course info 
     * obtained from the'Course Details" dialog 
     * @Desc 
     * Update the object in the courses database in local storage, and update
     * courses state variable.
     *************************************************************************/
    function updateCourse(course) {
        const newCourses = {...courses}
        newCourses[course.id] = course;
        localStorage.setItem("courses",JSON.stringify(newCourses));
        setCourses(newCourses);
        setDisplayedCourses(newCourses);
    }
    
    /*************************************************************************
     * @function openAddCourseDialog 
     * @Desc 
     * When the user opens the "Add Course" dialog, call the 
     * external JavaScript function transitionToDialog hide banner bar 
     * and mode tabs. Finally, set the showDialog state variable to true to
     * re-render the component to display the "Add Course" dialog.
     *************************************************************************/
    function openAddCourseDialog() {
        window.transitionToDialog(null,"Add Course",function(){});
        setShowDialog(true);
    }

    /*************************************************************************
     * @function closeAddCourseDialog 
     * @Desc 
     * When the user closes the "Add Course" dialog, add the selected course
     * (if any) to SpeedScore's database and then call the 
     * external JavaScript function transitionFromDialog redisplay banner bar 
     * and mode tabs. Finally, set the showDialog state variable to false
     * re-render the component to display the "main" page.
     *************************************************************************/
    function closeAddCourseDialog(course) {
        if (course !== null) {
            addCourse(course);
        } 
        window.transitionFromDialog(null);
        setShowDialog(false);
    }

    return(
      (showDialog) ?
         <CoursesModeAdd closeDialog={closeAddCourseDialog} /> :
         <> 
           <CoursesModeMain courses={displayedCourses} 
                            numCourses={Object.keys(courses).length}
                            updateCourse={updateCourse}
                            filterCourses={filterCourses}
                            openAddCourseDialog={openAddCourseDialog}/>
        </> 
    );
}  