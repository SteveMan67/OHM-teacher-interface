// initialize map
var map = new maplibregl.Map({
  container: 'map',
  style: 'historical-style.JSON', // stylesheet location
  center: [-95, 40], // starting position [lng, lat]
  zoom: 3, // starting zoom
  attributionControl: {
    customAttribution: '<a href="https://www.openhistoricalmap.org/">OpenHistoricalMap</a>',
  },
  preserveDrawingBuffer: true,
});
map.addControl(new maplibregl.NavigationControl(), 'top-left');
map.addControl(new maplibregl.GlobeControl, 'top-left')
map.addControl(new maplibregl.FullscreenControl, 'top-left')


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

const list = document.getElementById("filters")
const optionsContainer = document.getElementById("options-container")
const layerSelection = document.getElementById("layer-selection")
const loadingScreen = document.getElementById('loading-screen')
const loadingText = document.getElementById('load-text')
const saveAsScreen = document.getElementById('save-img-select')

async function downloadAsPng(width = 3840, height = 2160, filename = 'MapThingy-download.png') {
  optionsContainer.classList.remove('invisible')
  loadingScreen.classList.remove('invisible')
  const container = map.getContainer()
  const originalZoom = map.getZoom()
  const { lng: originalLng, lat: originalLat } = map.getCenter()
  const originalBearing = map.getBearing()
  const originalPitch = map.getPitch()
  const originalBounds = map.getBounds()

  container.style.width = `${width}px`
  container.style.height = `${height}px`
  map.jumpTo({center: [originalLng, originalLat], zoom: originalZoom})

  map.resize()
  map.fitBounds(originalBounds, {padding: 0, duration: 0, bearing: originalBearing, pitch: originalPitch})

  await new Promise(resolve => map.once('idle', resolve))

  // export that thang!
  map.getCanvas().toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename;
    a.click()
    URL.revokeObjectURL(url)

    container.style.width = `100%`
    container.style.height = `100%`
    map.resize()
    map.jumpTo({ center: [originalLng, originalLat], zoom: originalZoom, bearing: originalBearing, pitch: originalPitch })
  }, 'image/png')
  optionsContainer.classList.add('invisible')
  loadingScreen.classList.add('invisible')
}



const saveButtons = [document.getElementById('save-img'), document.getElementById('save-button')]

for (el of saveButtons) {
  el.addEventListener('click', () => {
    downloadAsPng(1920, 1080)
  })
}



let whitelist = [];

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
// ["elementID", ["layers", "that", "it", "toggles", "off"], default-checked-boolean, "Pretty Name"]
let toggleableObjects = [
  ["land", ["ohm_landcover_hillshade", "landuse_areas_earth", "land"], true, "Land Cover"],
  ["background", ["water_areas", "background"], true, "Background"],
  ["borders", ["country_boundaries", "state_lines_admin_4",], true, "Borders"],
  ["labels", 
    ["city_locality_labels_other_z11",
    "city_labels_other_z11",
    "city_labels_town_z8",
    "city_labels_z11",
    "city_labels_z6",
    "country_points_labels_cen", 
    "country_points_labels",
    "county_labels_z11_admin_7-8_centroids",
    "county_labels_z11_admin_6_centroids",
    "water_point_labels_ocean_sea",
    "county_labels_z11",
    "other_countries",
    "placearea_label"], 
    true, "Labels"],
  ["rivers", 
    ["water_lines_stream_no_name",
    "water_lines_stream_name",
    "water_lines_ditch",
    "water_lines_aqueduct",
    "water_lines_labels",
    "water_lines_labels_cliff",
    "water_lines_labels_dam",
    "water_areas_labels_z15",
    "county_labels_z11",
    "water_areas_labels_z12",
    "water_areas_labels_z8",
    "water_lines_river"], 
    false, "Rivers"]
];

// toggle event listeners

for (const [id, layers, defaultChecked, name] of toggleableObjects) {
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
  // Add to the bigger list
  const li = document.createElement('li')
  li.textContent = name
  list.appendChild(li)
  li.classList.add('greyed-out')
  if (defaultChecked) {
    li.classList.remove('greyed-out')
  } 
  li.addEventListener("click", () => {
    if (li.classList.contains('greyed-out')) {
      for (const i of layers) {
        if (!whitelist.includes(i)) {
          whitelist.push(i)
        }
      }
      li.classList.toggle('greyed-out')
    } else {
      for (const i of layers) {
        if (whitelist.includes(i)) {
          whitelist = whitelist.filter(f => f !== i)
        }
      }
      li.classList.toggle('greyed-out')
    }
    updateMapLayers()
  })
}


filterButtons = [document.getElementById("filter-img"), document.getElementById("more-filters")]
let clickOnBackgroundToClose = false

// filter page
for (el of filterButtons) {
  el.addEventListener("click", () => {
    clickOnBackgroundToClose = true
    optionsContainer.classList.remove("invisible")
    layerSelection.classList.remove("invisible")
  })
}
const filterCloseButton = document.getElementById("filter-close-button")
filterCloseButton.addEventListener("click", () => {
  clickOnBackgroundToClose = false
  optionsContainer.classList.add("invisible")
  layerSelection.classList.add("invisible")
})
optionsContainer.addEventListener("click", (e) => {
  if (layerSelection.contains(e.target) || saveAsScreen.contains(e.target) ||!clickOnBackgroundToClose) return;
  optionsContainer.classList.add("invisible")
  layerSelection.classList.add("invisible")
})


// download as page
const saveAs = document.getElementById("save-as")
saveAs.addEventListener("click", () => {
  clickOnBackgroundToClose = true;
  optionsContainer.classList.remove("invisible")
  saveAsScreen.classList.remove("invisible")
})
const saveAsCloseButton = document.getElementById("save-as-close-button")
saveAsCloseButton.addEventListener("click", () => {
  clickOnBackgroundToClose = false
  optionsContainer.classList.add("invisible")
  saveAsScreen.classList.add("invisible")
})

const filenameSelector = document.getElementById('filename')
const filetypeSelector = document.getElementById('filetype')
const resolutionSelector = document.getElementById('resolution')
const downloadButton = document.getElementById('download-button')

function sanitizeFilename(raw, ext = '.png') {
  const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  let name = (raw || '').trim().replace(/[^a-z0-9._-]+/gi, '_');
  name = name.slice(0, 80);
  if (reserved.test(name)) name = `_${name}`;
  if (!name.toLowerCase().endsWith(ext.toLowerCase())) name += ext;
  return name;
}

downloadButton.addEventListener('click', () => {
  saveAsScreen.classList.add('invisible')
  optionsContainer.classList.add('invisible')
  let filename = filenameSelector.value
  let filetype = filetypeSelector.value
  let resolution = resolutionSelector.value
  clickOnBackgroundToClose = false;
  if (!filename) {
    filename = 'MapThingyDownload'
  } else {
    filename = filename + String(filetype)
  }
  const ext = filetype
  const safeName = sanitizeFilename(filename, ext)
  const container = map.getContainer()
  let res_x
  let res_y
  if(resolution == "current") {
    res_x = container.style.width
    res_y = container.style.height
  } else if (resolution == "1080p") {
    res_x = 1920;
    res_y = 1080;
  } else {
    res_x = 3160;
    res_y = 2160;
  }
  downloadAsPng(res_x, res_y, safeName)
})


applyWhitelist = true;
function toggleWhitelist() {
  if (applyWhitelist) {
    applyWhitelist = false
  } else {
    applyWhitelist = true
  }
  updateMapLayers()
}

// add a function to update the map when the user clicks a toggle to show/hide something
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
    // console.log(layers)
  }
}

function isValidDate(year, era) {
  const CurrentYear = 2026
  if(year == "") {
    console.log("`year is blank")
    return false;
  } if(year < 0) {
    console.log(`${year} is less than 0`)
    return false;
  } else if(era == 'AD' && year > CurrentYear) {
    console.log(`${year} is more than current year`)
    return false
  } else if (era == 'BC' && year > 3000) {
    console.log(`${year} is less than 3000 BC`)
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

function isLessThanDate(date = minDateInput.value, era = minEraInput.value, compareDate = maxDateInput.value, compareEra = maxEraInput.value) {
  date = Number(date)
  compareDate = Number(compareDate)
  console.log(date, era, compareDate, compareEra)
  if (era == "BC") {
    if (compareEra == "BC") {
      // dates are both bc, higher number is older
      return (date > compareDate)
    } else {
      // BC dates cannot be more than AD dates
      return true
    } 
  } else {
    if (compareEra == "BC") {
      // AD dates always are more than BC dates
      return false
    } else {
      // dates are both AD, higher number is younger
      return (date < compareDate)
    }
  }
}
function updateDate() {
  date = Number(slider.value)
  date = date.toString()
  // console.log(date)
  // console.log(slider.value)
  map.filterByDate(date)
}

let lastValidMin = 1776
let lastValidMax = 2025

minDate.addEventListener('mouseenter', () => {
  minDateSelection.classList.remove('invisible')
  minDateDisplay.classList.add('invisible')
  minEraDisplay.classList.add('invisible')
})
minDate.addEventListener('mouseleave', () => {
  minDateSelection.classList.add('invisible')
  minDateDisplay.classList.remove('invisible')
  minEraDisplay.classList.remove('invisible')
  
})
maxDate.addEventListener('mouseenter', () => {
  maxDateSelection.classList.remove('invisible')
  maxDateDisplay.classList.add('invisible')
  maxEraDisplay.classList.add('invisible')
})
maxDate.addEventListener('mouseleave', () => {
  maxDateSelection.classList.add('invisible')
  maxDateDisplay.classList.remove('invisible')
  maxEraDisplay.classList.remove('invisible')
})


// check date validity only on focusout, but update slider on 
// input to make it look better 
minDateInput.addEventListener('input', () => {
  if(isValidDate(minDateInput.value)) {
    if (era = "BC") {
      slider.min = minDateInput.value * -1
    } else {
      slider.min = minDateInput.value
    }
    setFill()
  }
});
minDateInput.addEventListener('focusout', () => {
  let date = minDateInput.value
  if (isValidDate(minDateInput.value, minEraDisplay) && isLessThanDate()) {
    if (minEraInput.innerHTML == 'BC') {
      slider.min = (date * -1)
    } else {
      slider.min = date
    }
    minDateDisplay.innerHTML = date
    lastValidMin = date
    map.filterByDate(slider.value)
    setFill()
  } else {
    minDateInput.value = lastValidMin
  }
})

minEraInput.addEventListener('input', () => {
  if (isLessThanDate()) {
    minEraDisplay.innerHTML = minEraInput.value
    if (minEraInput.value == 'BC') {
      slider.min = (minDateInput.value * -1)
    } else {
      slider.min = minDateInput.value
    } 
  setFill()
  } else {
    if (minEraInput.value == "BC") {
      minEraInput.value = "AD"
    } else {
      minEraInput.value = "BC"
    }
  }
  updateDate()
});

maxDateInput.addEventListener('input', () => {
  if(isValidDate(maxDateInput.value)) {
    if (era = "BC") {
      slider.max = maxDateInput.value * -1
    } else {
      slider.max = maxDateInput.value
    }
    setFill()
  }
});
maxDateInput.addEventListener('focusout', () => {
  let date = maxDateInput.value
  if (isValidDate(maxDateInput.value, maxEraDisplay) && isLessThanDate()) {
    if (maxEraInput.innerHTML == 'BC') {
      slider.max = (date * -1)
    } else {
      slider.max = date
    }
    maxDateDisplay.innerHTML = date
    lastValidMax = date
    map.filterByDate(slider.value)
    setFill()
  } else {
    maxDateInput.value = lastValidMax
  }
})

maxEraInput.addEventListener('input', () => {
  if(isLessThanDate()) {
    maxEraDisplay.innerHTML = maxEraInput.value
    if (maxEraInput.value == 'BC') {
      slider.max = (maxDateInput.value * -1)
    } else {
      slider.max = maxDateInput.value
    }
    setFill()
  } else {
    if (maxEraInput.value == "BC") {
      maxEraInput.value = "AD"
    } else {
      maxEraInput.value = "AD"
    }
  }
  updateDate()
});

// input resizing 
function resizeInput(input) {
  input.style.width = 'calc(' + (input.value.length || 1) + 'ch + 15px)';
}

minDateInput.addEventListener('input', () => {
  resizeInput(minDateInput)
})
resizeInput(minDateInput)
maxDateInput.addEventListener('input', () => {
  resizeInput(maxDateInput)
})
resizeInput(maxDateInput)

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
slider.addEventListener('input', () => {
  updateDate();
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
