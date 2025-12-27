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

function setLanguage(lang) {
  const style = map.getStyle();
  if (!style || !style.layers) return; // guard if style not ready
  
  for (const layer of style.layers) {
    // check if it's a symbol layer with text-field
    if (layer.type === 'symbol') {
      try {
        const textField = map.getLayoutProperty(layer.id, 'text-field');
        if (textField) {
          map.setLayoutProperty(layer.id, 'text-field', [
            'coalesce',
            ['get', `name_${lang}`],
            ['get', 'name']
          ]);
        }
      } catch (e) {
        // layer may not be ready yet, skip it
      }
    }
  }
}

map.addControl(new maplibregl.NavigationControl());

let whitelist = [
  "ohm_admin_boundaries",
  "ohm_landcover_hillshade",
  "background",
  "land",
  "state_lines_admin_4",
  "city_locality_labels_other_z11",
  "city_labels_other_z11",
  "city_labels_town_z8",
  "city_labels_z11",
  "city_labels_z6",
  "country_points_labels_cen",
  "country_points_labels",
  "country-boundaries"
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
  ["land", ["land", "ohm_landcover_hillshade"], true],
  ["background", ["background"], true],
  ["borders", ["country-boundaries"], true],
  ["labels", ["city_locality_labels_other_z11",
  "city_labels_other_z11",
  "city_labels_town_z8",
  "city_labels_z11",
  "city_labels_z6",
  "country_points_labels_cen", 
  "country_points_labels",
  "placearea_label"], true],
  ["rivers", [], false]
];

// toggle event listeners

for (const [id, layers, defaultChecked] of toggleableObjects) {
  const el = document.getElementById(id)
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
    if (el.classList.contains('greyed-out')) {
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
applyWhitelist = false;
function updateMapLayers() {
  const style = map.getStyle();
  let layers = [];
  for (const layer of style.layers) {
    if (!whitelist.includes(layer.id) && applyWhitelist) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    } else {
      map.setLayoutProperty(layer.id, "visibility", "visible")
      // console.log(layer.id)
    }
    layers.push(layer.id);
    console.log(layers)
  }
}

function isValidDate(year, era) {
  const CurrentYear = new Date().GetFullyear()
  if(year <= 0){
    return false;
  }
  if(era == 'AD' && year > CurrentYear) {
    return false
  }
  if(era == 'BC' && year > 3000) {
    return false
  } else {
    return true
  }
}
// date range event listeners
const minDateSelection = document.getElementById('min-date-selection')
const maxDateSelection = document.getElementById('max-date-selection')
const minDateDisplay = document.getElementById('min-date')
const maxDateDisplay = document.getElementById('max-date')
const minEraDisplay = document.getElementById('min-era')
const maxEraDisplay = document.getElementById('max-era')
const minEraInput = document.getElementById('min-era-select')
const maxEraInput = document.getElementById('max-era-select')
const minDateInput = document.getElementById('min-date-input')
const maxDateInput = document.getElementById('max-date-input')

minDateSelection.classList.add('invisible')
maxDateSelection.classList.add('invisible')
const minDate = document.getElementById('min-date-container')
const maxDate = document.getElementById('max-date-container')

minDate.addEventListener('mouseenter', () => {
  minDateSelection.classList.remove('invisible')
})
minDate.addEventListener('mouseleave', () => {
  minDateSelection.classList.add('invisible')
  
})
maxDate.addEventListener('mouseenter', () => {
  maxDateSelection.classList.remove('invisible')
})
maxDate.addEventListener('mouseleave', () => {
  maxDateSelection.classList.add('invisible')
})

minDateInput.addEventListener('input', () => {
  minDateDisplay.innerHTML = minDateInput.value
  if (minEraDisplay.innerHTML == 'BC') {
    slider.min = (minDateInput.value * -1)
  } else {
    slider.min = minDateInput.value
  }
  setFill()
});
minEraInput.addEventListener('input', () => {
  minEraDisplay.innerHTML = minEraInput.value
  if (minEraInput.innerHTML == 'BC') {
    slider.min = (minDateInput.value * -1)
  } else {
    slider.min = minDateInput.value
  }
  setFill()
});
maxDateInput.addEventListener('input', () => {
  maxDateDisplay.innerHTML = maxDateInput.value
  if (maxEraDisplay.innerHTML == 'BC') {
    slider.max = (maxDateInput.value * -1)
  } else {
    slider.max = maxDateInput.value
  }
  setFill()
});
maxEraInput.addEventListener('input', () => {
  maxEraDisplay.innerHTML = maxEraInput.value
  if (maxEraInput.innerHTML == 'BC') {
    slider.max = (maxDateInput.value * -1)
  } else {
    slider.max = maxDateInput.value
  }
  setFill()
});

// date display stuf
const dateDisplay = document.getElementById('current-date-display')

function updateDateDisplay() {
  const val = Number(slider.value)
  const min = Number(slider.min)
  const max = Number(slider.max)
  const percent = (val - min) / (max - min)
  const sliderWidth = slider.offsetWidth - 50 // subtract padding
  const displayWidth = dateDisplay.offsetWidth
  const sliderOffset = percent * (sliderWidth);
  const displayHalfWidth = displayWidth / 2;
  dateDisplay.style.left = `${sliderOffset - (displayHalfWidth - 35)}px`
  // console.log(`sliderOffset: ${sliderOffset - (displayHalfWidth - 35)}, sliderWidth: ${sliderWidth} displayHalfWidth: ${displayHalfWidth}, displayhalfwidth - 35: ${(displayHalfWidth - 35)}`)

  if (val < 0) {
    dateDisplay.innerHTML = `${Math.abs(val)} BC`
  } else {
    dateDisplay.innerHTML = `${val} AD`
  }
}

slider.addEventListener('input', () =>{
  updateDateDisplay();
})
slider.addEventListener("mouseenter", () => {
  dateDisplay.classList.remove("invisible")
  updateDateDisplay()
})
slider.addEventListener("mouseleave", () => {
  dateDisplay.classList.add("invisible")
  updateDateDisplay()
})
updateDateDisplay()

// event listener to update the map date based on the slider
slider.addEventListener('mouseup', () => {
  date = Number(slider.value)
  date = date.toString()
  // console.log(date)
  // console.log(slider.value)
  map.filterByDate(date)
});

// smth for debug
map.on('click', (e) => {
  const features = map.queryRenderedFeatures(e.point);
  console.log(features.map(f => f.properties));
});

//show everything but the whitelist on load 
// CURRENTLY TAKES A WHILE TO WORK AFTER MAP LOADS
// only run this once (I know it's jank, it works) otherwise it gets triggered on map.filterByDate()
let once = false;
map.on("styledata", () => {
  if(!once) {
    updateMapLayers()
    map.filterByDate(slider.value)
    // const language = new MapboxLanguage();
    // map.addControl(language)
    setLanguage('en')
    once = true;
  }
});

map.on('load', () => {
  setLanguage('en')
})
