import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useState} from 'react';

export default function StarRatingWidget({maxStars, startVal, allowEdit, updateVal}) {
    const [starRating, setStarRating] = useState(startVal);
    const [hover, setHover] = useState(startVal);
    const starArray = Array.from({length: maxStars}, (_, i) => i + 1);

    return(
        <div className="rating">
            {starArray.map((i) => {
                return(
                <button key={i}
                      className={((i <= hover || i <= starRating) ? 
                                   "star-selected" : "star-unselected") + 
                                   (allowEdit ? "" : " star-no-edit")}
                      onClick={allowEdit ? ()=>setStarRating(i) : null}
                      onMouseEnter={allowEdit ? ()=> setHover(i) : null}              
                      onDoubleClick={allowEdit ? () => {setHover(0); setStarRating(0)} : null}>
                    <FontAwesomeIcon icon="star"/>
                </button> );
                })
            }
        </div>
    );
}