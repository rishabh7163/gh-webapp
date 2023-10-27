import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import CoursesModeSearchFilter from './CoursesModeSearchFilter';
import CoursesModeTable from './CoursesModeTable';
import CoursesModeDetails from './CoursesModeDetails';
import {useState} from 'react';

 /*************************************************************************
 * File: coursesModeMain.js
 * This file defines the CoursesModeMain React component, which implements
 * the main page (courses table) of SpeedScore's "Courses" mode
 ************************************************************************/

export default function CoursesModeMain({courses,numCourses, updateCourse, filterCourses, openAddCourseDialog}) {  
  //const [displayedCourses, setDisplayedCourses] = useState(courses);
  const [showCourseDetails, setShowCourseDetails] = useState(null);

  // useEffect(() => {
  //   setDisplayedCourses(courses);
  // },[courses]);

    function updateAndCloseCourseDetailsDialog(c) {
      updateCourse(c);
      window.transitionFromDialog(null);
      setShowCourseDetails(null);
    }

    function openCourseDetailsDialog(c) {
      window.transitionToDialog(null,"View/Edit Course Details for " + c.shortName,function(){});
      setShowCourseDetails(c);
    }

    function closeCourseDetailsDialog() {
      window.transitionFromDialog(null);
      setShowCourseDetails(null);
    }

    return(
    (showCourseDetails === null) ? 
     <>
     <h1 className="mode-page-header">Courses</h1>
     <CoursesModeSearchFilter updateSearchFilterVal={filterCourses} />
     <CoursesModeTable courses={courses} 
                       numCourses={numCourses}
                       showCourseDetails={openCourseDetailsDialog} />
      <button className="float-btn" onClick={openAddCourseDialog}>
        <FontAwesomeIcon icon="map-pin" />&nbsp;Add Course
      </button>
    </> :
     <CoursesModeDetails course={showCourseDetails}
                         updateCourseDetails={updateAndCloseCourseDetailsDialog}
                         closeCourseDetails={closeCourseDetailsDialog}/>

    );
  }