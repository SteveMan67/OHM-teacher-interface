// initialize map
var map = new maplibregl.Map({
  container: 'map',
  style: 'historical-style.JSON', // stylesheet location
  center: [-74.5, 40], // starting position [lng, lat]
  zoom: 9, // starting zoom
  attributionControl: {
    customAttribution: '<a href="https://www.openhistoricalmap.org/">OpenHistoricalMap</a>',
  },
});

map.addControl(new maplibregl.NavigationControl());

let whitelist = [
  "ohm_admin_boundaries",
  "boundary",
  "boundaries",
  "background",
  "land",
  "state_lines_admin_4",
  "city_locality_labels_other_z11",
  "city_labels_other_z11",
  "city_labels_town_z8",
  "city_labels_z11",
  "city_labels_z6",
  "boundaries_admin_34",
  "boundaries_admin_12",
  "country_points_labels_cen",
  "country_points_labels"
];

// set --val so that I can have the background to the right of the slider a different color
const slider = document.getElementById("slider")
const setFill = () => {
    const min = Number(slider.min)
    const max = Number(slider.max)
    const val = ((slider.value - min) / (max - min)) * 100;
    slider.style.setProperty('--val', `${val}%`); 
}
slider.addEventListener('input', setFill);
setFill()

// used to loop through and add event listeners automatically
// list consists of lists of lists OH NO
// where the structure of each list inside the list is
// ["elementID", ["layers", "that", "it", "toggles", "off"], default-checked-boolean]
let toggleableObjects = [
  ["land", ["land"], true],
  ["background", ["background"], true],
  ["borders", ["boundaries_admin_34",
  "boundaries_admin_12",], true],
  ["labels", ["city_locality_labels_other_z11",
  "city_labels_other_z11",
  "city_labels_town_z8",
  "city_labels_z11",
  "city_labels_z6",
  "country_points_labels_cen", 
  "country_points_labels"], true]
];

// toggle event listeners

for (const [id, layers, defaultChecked] of toggleableObjects) {
  const el = document.getElementById(id)
  const isOn = () => !el.classList.contains('greyed-out')
  console.log(isOn())
  // apply default on/off values 
  el.classList.add('greyed-out')
  if (defaultChecked) {
    el.classList.toggle('greyed-out')
  }
  if(defaultChecked) {
    for (const i of layers) {
      if (!whitelist.includes(i)) {
        whitelist.push(i)
      }
    } 
  } else {
    for (const i of layers) {
      if (whitelist.includes(i)) {
        whitelist = whitelist.filter(f => f !== i)
      }
    }
  }

  // EVENT LISTENER!!! [scheming silently]
  el.addEventListener("click", () => {
    if (isOn()) {
      for (const i of layers) {
        if (!whitelist.includes(i)) {
          whitelist.push(i)
        }
      }
      el.classList.toggle('greyed-out')
    } else {
      for (const i of layers) {
        if (whitelist.includes(i)) {
          whitelist = whitelist.filter(f => f !== i)
        }
      }
      el.classList.toggle('greyed-out')
    }
    updateMapLayers()
  })
}

  // add a function to update the map when the user clicks a toggle to show/hide something
function updateMapLayers() {
  const style = map.getStyle();
  let layers = [];
  for (const layer of style.layers) {
    if (!whitelist.includes(layer.id)) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    } else {
      map.setLayoutProperty(layer.id, "visibility", "visible")
    }
    layers.push(layer.id);
  }
}


//show everything but the whitelist on load 
// CURRENTLY TAKES A WHILE TO WORK AFTER MAP LOADS
map.on("styledata", () => {
  updateMapLayers()
  map.filterByDate("1997")
});
