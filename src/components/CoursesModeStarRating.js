import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

export default function StarRating({numStars, maxStars}) {
    const starArray = Array.from({length: maxStars}, (_, i) => i + 1);

    return(
        <div aria-label={numStars + " stars out of " + maxStars}>
            {starArray.map((i) => {
                return(
                <span key={i}
                      className={(i <= numStars) ? 
                                   "star-selected" : "star-unselected"}>
                    <FontAwesomeIcon icon="star"/>
                </span> );
                })
            }
        </div>
    );
}