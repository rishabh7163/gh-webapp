import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import DefaultGolfCoursePic from './../images/DefaultGolfCoursePic.jpg';
import {useState, useEffect} from 'react';

 /*************************************************************************
 * File: coursesModeTable.js
 * This file defines the CoursesModeTable React component, which implements
 * the searchable/filterable table of courses in SpeedScore's database.
 ************************************************************************/
 export default function CoursesModeTable({courses, numCourses, showCourseDetails}) { 

    const [coursesToDisplay, setCoursesToDisplay] = useState(courses);

    useEffect(() => {
        setCoursesToDisplay(courses);
    }, [courses]);

  return(
    <div className="table-responsive">
    <table id="coursesTable" className="table caption-top mx-auto w-auto">
          <caption id="roundsTableCaption" aria-live="polite" className="caption-center">
            {Object.keys(coursesToDisplay).length === numCourses ? 
              "Displaying all " + numCourses + " golf courses in SpeedScore's database" :
              "Displaying " + Object.keys(coursesToDisplay).length + 
              " golf courses that meet search/filter criteria"}
          </caption>
          <thead>
            <th scope="col" aria-label="Course picture"></th>
            <th scope="col" aria-label="Course info"></th>
          </thead>
          <tbody>
            {Object.keys(coursesToDisplay).map((c) => {
                return [
                    <tr key={c} className="d-flex">
                      <td><img src={coursesToDisplay[c].imageUrl === "Default" ? 
                                    DefaultGolfCoursePic : coursesToDisplay[c].imageUrl} 
                               alt={coursesToDisplay[c].shortName} 
                               className="img-fluid img-course" />
                      </td>
                      <td tabIndex="0">
                        <strong>{coursesToDisplay[c].shortName}</strong><br/>
                        {coursesToDisplay[c].address}<br/><br/>
                            <a href={coursesToDisplay[c].website} target="_blank" rel="noopener noreferrer" className="btn btn-sm info-btn">
                                <FontAwesomeIcon icon="globe" />
                                &nbsp;Web
                            </a>
                            <a href={coursesToDisplay[c].mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm info-btn">
                                <FontAwesomeIcon icon="map"/>
                                &nbsp;Map
                            </a>
                            <a href ={"tel:" + coursesToDisplay[c].phoneNumber} target="_blank" rel="noopener noreferrer" className="btn btn-sm info-btn">
                            <FontAwesomeIcon icon="phone"/>
                            &nbsp;Call
                            </a>
                            <button type="button" className="btn btn-sm info-btn" onClick={() => showCourseDetails(courses[c])}>
                            <FontAwesomeIcon icon="eye"/>
                            &nbsp;Details
                            </button>
                      </td>
                    </tr> 
                ]
            }) }
          </tbody>
    </table>    
    </div>
  );
}