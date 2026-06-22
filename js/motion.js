// Motion One — animaties uitgeschakeld om iOS scroll-interferentie te voorkomen.
// JS-animaties (translateY/opacity via Motion One) creëren compositor-layers
// op alle kaarten, wat iOS scroll-momentum kan blokkeren.
export function revealView(_view) {
  // no-op: CSS-overgangen zijn voldoende; geen JS-animaties bij tab-wissel.
}
