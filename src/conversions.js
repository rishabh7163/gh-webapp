 /*************************************************************************
 * File: conversions.js
 * This file contains functions for converting from feet (the units in
 * which distances and elevations are stored in SpeedScore's database) 
 * and various imperial and metric units. In addition, a function 
 * toTimePar() converts seconds to a pretty-printed time par (or
 * speedgolf score) in the format 'mm:ss'.
 ************************************************************************/

export function toTimePar(sec) {
    const intSec = parseInt(sec);
    return (Math.floor(intSec/60)) + ":" + (intSec % 60 < 10 ? "0" + intSec % 60 : intSec % 60);
}

export function toYards(ft) {
  if (ft === "")
    return "";
  return Math.round(Number(ft)/3);
}

export function toMiles(ft) {
  if (ft === "")
    return "";
  return (parseInt(ft)/5280).toFixed(2);

}

export function toMeters(ft) {
  if (ft === "")
    return "";
  return Math.round(parseInt(ft)/3.28084);
}

export function toKilometers(ft) {
  if (ft === "")
    return "";
  return (parseInt(ft)/3280.84).toFixed(2);

}

export function yardsToFeet(yards) {
  return yards * 3;
}

export function metersToFeet(meters) {
  return meters * 3.28084;
}