// initialize map
var map = new maplibregl.Map({
  container: 'map',
  style: 'historical-style.JSON', // stylesheet location
  center: [-95, 40], // starting position [lng, lat]
  zoom: 3, // starting zoom
  attributionControl: {
    customAttribution: '<a href="https://www.openhistoricalmap.org/">OpenHistoricalMap</a>',
  },
  preserveDrawingBuffer: true
});

let isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
let colorStyle = "Light"

//show everything but the whitelist on load 
// CURRENTLY TAKES A WHILE TO WORK AFTER MAP LOADS
// only run this once (I know it's jank, it works) otherwise it gets triggered on map.filterByDate()
let once = false;
map.on("styledata", () => {
  if(!once) {
    map.setProjection({type: 'mercator'})
    updateMapLayers()
    colorStyle = isDarkMode ? "Dark" : "Light"
    swapDarkModeImages(isDarkMode)
    map.filterByDate(slider.value)
    // const language = new MapboxLanguage();
    // map.addControl(language)
    setLanguage('en')
    once = true;
    map.addSource('custom-markers', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
    map.addLayer({
      id: 'custom-markers-layer',
      type: 'symbol',
      source: 'custom-markers',
      visibility: "visible",
      layout: {
        'icon-allow-overlap': true,
        'text-allow-overlap': true,
        'symbol-z-order': 'auto',
        'text-line-height': 1, 
        'text-size': [
          'interpolate',
          [
            "linear"
          ],
          [
            "zoom"
          ],
          0,
          8,
          3,
          12,
          6,
          20,
          10,
          22
        ],
        'symbol-avoid-edges': false,
        "text-font": [
          'OpenHistorical Bold'
        ],
        "symbol-placement": "point",
        "text-justify": "center",
        "visibility": "visible",
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-max-width": 7
      },
      paint: {
        "text-color": [
          "interpolate",
          [
            "linear"
          ],
          [
            "zoom"
          ],
          0,
          "#495049",
          5,
          "#6d786d"
        ],
        "text-halo-width": 1.5,
        "text-halo-color": [
          "interpolate",
          [
            "linear"
          ],
          [
            "zoom"
          ],
          0,
          "rgba(252, 255, 254, 0.75)",
          3,
          "rgba(240, 244, 216, 1)",
          5,
          "rgba(246,247,227, 1)",
          7,
          "rgba(255, 255, 255, 1)"
        ],
        "text-halo-blur": 1,
        "text-opacity": 1,
        "text-translate-anchor": "map"
      }
    })
    updateColors()
  }
})

map.on('load', () => {
  setLanguage('en')
})

let isPhone = window.innerWidth <= 600 && 'ontouchstart' in window;
window.addEventListener('resize', () => {
  let isPhone = window.innerWidth <= 600 && 'ontouchstart' in window;
})

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



let whitelist = [
  "custom-markers-layer",
  "ohm_landcover_hillshade",
  "landuse_areas_earth",
  "water_areas",
  "background",
  "land"
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

let customColors = [
  {
    name: "Light",
    font: "Openhistorical Bold",
    text_color: "#6d786d",
    text_halo: "#fff",
    colors: {
      land: "#fff",
      background: "#99E0DE",
      water_areas: "#99E0DE",
      country_boundaries: "#828282",
      state_lines_admin_4: "#A8C1B7",
    },
    useLandCover: true
  },
  {
    name: "Dark",
    font: "Openhistorical Bold",
    text_color: "#fff",
    text_halo: "#000",
    colors: {
      land: "#040100ff",
      background: "#315F8B",
      water_areas: "#315F8B",
      water_lines_river: "#315F8B",
      country_boundaries: "#fff",
      state_lines_admin_4: "#31353A"
    },
    useLandCover: false
  }
]
// used to loop through and add event listeners automatically
// list consists of lists of lists OH NO
// where the structure of each list inside the list is
// ["elementID", ["layers", "that", "it", "toggles", "off"], default-checked-boolean, "Pretty Name"]
let filterList = [
  {
    id: "borders",
    quickMenu: true,
    toggledLayers: [
      "country_boundaries",
      "state_lines_admin_4"
    ],
    prettyName: "Borders",
    isDefaultOn: true,
    subcategories: [
      {
        id: "state_lines",
        toggledLayers: [
          "state_lines_admin_4"
        ],
        prettyName: "State Lines"
      }
    ]
  },
  {
    id: "labels",
    quickMenu: false,
    toggledLayers: [
      "city_locality_labels_other_z11",
      "city_labels_other_z11",
      "city_labels_town_z8",
      "city_labels_z11",
      "city_labels_z6",
      "country_points_labels_cen", 
      "country_points_labels",
      "county_labels_z11_admin_7-8_centroids",
      "county_labels_z11_admin_6_centroids",
      "water_point_labels_ocean_sea",
      "state_points_labels_centroids",
      "city_capital_labels_z6",
      "statecapital_labels_z10",
      "state_points_labels",
      "county_labels_z11",
      "other_countries",
      "placearea_label",
      "custom-markers-layer"
    ],
    prettyName: "Labels",
    subcategories: [
      {
        id: "major-cities",
        toggledLayers: [
          "city_labels_z6"
        ],
        prettyName: "Major-Cities"
      },
      {
        id: "minor-cities",
        toggledLayers: [
          "city_locality_labels_other_z11",
          "city_labels_other_z11",
          "city_labels_town_z8",
          "city_labels_z11",
        ],
        prettyName: "Minor Cities"
      },
      {
        id: "state-labels",
        toggledLayers: [
          "state_points_labels_centroids",
          "state_points_labels"
        ]
      },
      {
        id: "custom-markers",
        toggledLayers: [
          "custom-markers-layer"
        ]
      }
    ]
  },
  {
    id: "rivers",
    quickMenu: false,
    toggledLayers: [
      "water_lines_stream_no_name",
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
      "water_lines_river"
    ]
  }
]

let toggleableObjects = [
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
    "state_points_labels_centroids",
    "city_capital_labels_z6",
    "statecapital_labels_z10",
    "state_points_labels",
    "county_labels_z11",
    "other_countries",
    "placearea_label",
    "custom-markers-layer"], 
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

function closeAllOpenMenus() {
  optionsContainer.classList.add("invisible")
  layerSelection.classList.add("invisible")
  saveAsScreen.classList.add("invisible")
}

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
  clickOnBackgroundToClose = false
  closeAllOpenMenus()
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
let layers = [];
let appliedLayers = []
function updateMapLayers() {
  const style = map.getStyle();
  layers = []
  appliedLayers = []
  for (const layer of style.layers) {
    if (!whitelist.includes(layer.id) && applyWhitelist || layer.id == "ohm_landcover_hillshade" && isDarkMode) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    } else {
      map.setLayoutProperty(layer.id, "visibility", "visible")
      appliedLayers.push(layer.id)
      // console.log(layer.id)
    }
    layers.push(layer.id);
    // console.log(layers)
  }

}

let applyColors = true;


function updateColors() {
  const style = map.getStyle()
  let targetLayers = []
  let styleIndex = customColors.findIndex(f => f.name == colorStyle)
  for (layer of style.layers) {
    if (customColors[styleIndex].colors.hasOwnProperty(layer.id)) {
      let paintProperty = "background-color";
      let secondaryProperty
      if (layer.type == "background") {
        paintProperty = "background-color"
      } else if (layer.type == "fill") {
        paintProperty = "fill-color"
      } else if (layer.type == "line") {
        paintProperty = "line-color"
      }
         customColors[styleIndex].colors[layer.id]
      map.setPaintProperty(
         layer.id,
         paintProperty,
         customColors[styleIndex].colors[layer.id]
      )
    }
    if (layer.type == "symbol") {
      if (customColors[styleIndex].text_color){
        map.setPaintProperty(
          layer.id,
          "text-color",
          customColors[styleIndex].text_color
        )
      }
      if (customColors[styleIndex].text_halo) {
        map.setPaintProperty(
          layer.id,
          "text-halo-color",
          customColors[styleIndex].text_halo
        )
      }
    }
  }
  if (customColors[styleIndex].useLandCover != null) {
    if(customColors[styleIndex].useLandCover) {
      map.setLayoutProperty("ohm_landcover_hillshade", "visibility", "visible")
    } else {
      map.setLayoutProperty("ohm_landcover_hillshade", "visibility", "none")
    }
  }
}

// handle Dark Mode from browser
function swapDarkModeImages(isDarkMode) {
  const saveImg = document.getElementById("save-img")
  const filterImg = document.getElementById("filter-img")
  const logoImg = document.getElementById("logo-img")
  const plusImg = document.getElementById('zoom-in-img')
  const minusImg = document.getElementById('zoom-out-img')
  const globeImg = document.getElementById('globe-img')
  const layerImg = document.getElementById('layers-img')
  const filterCloseButton = document.getElementById('filter-close-button')
  const saveAsCloseButton = document.getElementById('save-as-close-button')

  if (isDarkMode) {
    saveImg.src = "/images/icons/save-dark.png"
    filterImg.src = "/images/icons/filter-dark.png"
    logoImg.src = "/images/icons/logo-dark.png"
    plusImg.src = "/images/icons/plus-dark.svg"
    minusImg.src = "/images/icons/minus-dark.svg"
    globeImg.src = "/images/icons/globe-dark.svg"
    layerImg.src = "/images/icons/layers-dark.svg"
    filterCloseButton.src = "/images/icons/close-dark.svg"
    saveAsCloseButton.src = "/images/icons/close-dark.svg"
  } else {
    saveImg.src = "/images/icons/save.png"
    filterImg.src = "/images/icons/filter.png"
    logoImg.src = "/images/icons/logo.png"
    plusImg.src = "/images/icons/plus.svg"
    minusImg.src = "/images/icons/minus.svg"
    globeImg.src = "/images/icons/globe.svg"
    layerImg.src = "/images/icons/layers.svg"
    filterCloseButton.src = "/images/icons/close.svg"
    saveAsCloseButton.src = "/images/icons/close.svg"
  }
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  isDarkMode = e.matches;
  colorStyle = isDarkMode ? "Dark" : "Light"
  updateColors()
  swapDarkModeImages(isDarkMode)
});

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


// custom map controls for dark mode
const zoomIn = document.getElementById('zoom-in')
const zoomOut = document.getElementById('zoom-out')
const globeControl = document.getElementById('globe')
const layersControl = document.getElementById('layers-control')

zoomIn.addEventListener('mousedown', (e) => {
  e.preventDefault()
})
zoomIn.addEventListener('click', () => {
  map.zoomIn()
})
zoomOut.addEventListener('mousedown', (e) => {
  e.preventDefault()
})
zoomOut.addEventListener('click', () => {
  map.zoomOut()
})
globeControl.addEventListener('mousedown', (e) => {
  e.preventDefault
})
layersControl.addEventListener('mousedown', (e) => {
  e.preventDefault
})
layersControl.addEventListener('click', () => {
  // show layer selection menu, right now only light and dark mode
})

globeControl.addEventListener('click', () => {
  const currentProjection = map.getProjection()
  console.log
  if (currentProjection) {
    if (currentProjection.type == 'mercator') {
      map.setProjection({type: 'globe'})
    } else {
      map.setProjection({type: 'mercator'})
    }
  } else {
    map.setProjection({type: 'globe'})
  }
  
})

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
    if (minEraInput.value == "BC") {
      slider.min = Math.abs(minDateInput.value) * -1
    } else {
      slider.min = Math.abs(minDateInput.value)
    }
    setFill()
  }
});
minDateInput.addEventListener('focusout', () => {
  let date = minDateInput.value
  if (isValidDate(minDateInput.value, minEraDisplay) && isLessThanDate()) {
    if (minEraInput.value == 'BC') {
      slider.min = (Math.abs(date) * -1)
    } else {
      slider.min = Math.abs(date)
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
      slider.min = (Math.abs(minDateInput.value) * -1)
    } else {
      slider.min = Math.abs(minDateInput.value)
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
    if (maxEraInput.value == "BC") {
      slider.max = (Math.abs(maxDateInput.value) * -1)
    } else {
      slider.max = Math.abs(maxDateInput.value)
    }
    setFill()
  }
});
maxDateInput.addEventListener('focusout', () => {
  let date = maxDateInput.value
  if (isValidDate(maxDateInput.value, maxEraDisplay) && isLessThanDate()) {
    if (maxEraInput.ivalue == 'BC') {
      slider.max = (Math.abs(date) * -1)
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
      slider.max = (Math.abs(maxDateInput.value) * -1)
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
  let sliderWidth = slider.offsetWidth - 50 // subtract padding
  if (isPhone) {
    sliderWidth = slider.offsetWidth - 40
  }
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
slider.addEventListener("touchstart", () => {
  dateDisplay.classList.remove("invisible");
  updateDateDisplay();
});

slider.addEventListener("mouseleave", () => {
  dateDisplay.classList.add("invisible")
  updateDateDisplay()
})
slider.addEventListener("touchend", () => {
  dateDisplay.classList.add("invisible")
  updateDateDisplay()
})
slider.addEventListener("touchcancel", () => {
  dateDisplay.classList.add("invisible")
  updateDateDisplay()
})
updateDateDisplay()

// event listener to update the map date based on the slider
slider.addEventListener('change', () => {
  updateDate();
});

// smth for debug
map.on('click', (e) => {
  const features = map.queryRenderedFeatures(e.point);
  console.log(features.map(f => f.id), features.map(f => f.properties));
});

// right click functionality
let rightClickMenuOpen = false
const menu = document.getElementById('right-click')
let rightClickList = document.getElementById('right-click-list')

function addToRightClick(text, isLink = false, link) {
  let li = document.createElement('li')
  li.textContent = text
  if(link) {
    li.textContent = ''
    li.innerHTML = `<a href ="${link}" target="_blank">${text}</a>`
  }
  rightClickList.appendChild(li)
}
document.addEventListener('contextmenu', (e) => {
  e.preventDefault()
})

function addToRightClickTop(text) {
  let li = document.createElement('li') 
  li.textContent = text
  if (rightClickList.firstChild) {
    rightClickList.insertBefore(li, rightClickList.firstChild)
  } else {
    rightClickList.appendChild(li)
  }
}



let markers = []

function addMarker(text = "haha", lng, lat) {
  const source = map.getSource('custom-markers')
  const data = source._data
  let markerId = Date.now()
  data.features.push({
    id: markerId,
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: { "name:en": text, name: text }
  })
  source.setData(data)
}

function removeGeneratedItems() {
  rightClickList.innerHTML = ''
  let li = document.createElement('li')
  li.textContent = 'Add Marker'
  li.id = 'add-marker'
  rightClickList.appendChild(li)
}

function closeMenu(target = null) {
  if (menu.contains(target)) return;
  rightClickMenuOpen = false
  menu.classList.add('invisible')
  removeGeneratedItems()
}

function getWikidataId(id) {
  url = "https://corsproxy.io/?key=4ffc06b1&url=https://overpass-api.openhistoricalmap.org/api/interpreter"
  query = `
  [out:json];
  (
  node(${id});
  way(${id});
  relation(${id});
  );
  out tags;
  `;
  return fetch(url, {
    method: "POST",
    body: query,
    headers: { "Content-Type": "text/plain"}
  })
    .then(response => response.json())
    .then(data => {
      if (data['elements'][0]) {
        const tags = data['elements'][0]['tags']   
        let wikidata = tags.wikidata
        let wikipedia = tags.wikipedia     
        return [wikidata, wikipedia]
      }
    })
}

function wikipediaTagToUrl(wikipediaTag) {
  if (!wikipediaTag || !wikipediaTag.includes(':')) return null;
  const [lang, ...titleParts] = wikipediaTag.split(':');
  const title = titleParts.join(':').replace(/ /g, '_');
  return `https://${lang}.wikipedia.org/wiki/${title}`;
}

function fetchPopulation(id) {
  const url = "https://corsproxy.io/?key=4ffc06b1&url=https://query.wikidata.org/sparql"
  const query = `
  SELECT ?population ?populationYear WHERE {
  VALUES ?item { wd:${id} }
  ?item p:P1082 ?populationStatement.
  ?populationStatement ps:P1082 ?population. 
  OPTIONAL { ?populationStatement pq:P585 ?populationYear. }
  SERVICE wikibase:label {bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?populationYear)`

  return fetch(url, {
    method: "POST",
    headers: { "Accept": "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded" },
    body: "query=" + encodeURIComponent(query)
  })
    .then(response => response.json())
    .then(data => {
      populationsList = data["results"]["bindings"]
      populations = []
      for (item of populationsList) {
        let isoString = new Date(item.populationYear.value)
        populations.push([item.population.value, isoString.getFullYear()])
      }
      return populations;
    })
}

async function fetchPopulationForYear(id, year) {
  const populations = await fetchPopulation(id)
  let closestYear = 300099998; 
  let closestPopulation = null;
  for ([population, date] of populations) {
    if (Math.abs(date - year) < Math.abs(date - closestYear)) {
      closestYear = date;
      closestPopulation = population
    }
  } 
  console.log(closestYear, closestPopulation)
  return [closestYear, closestPopulation]
}

function fetchStartEndYear(id) {
  const url = "https://corsproxy.io/?key=4ffc06b1&url=https://query.wikidata.org/sparql"
  const query = `
  SELECT ?population ?populationYear WHERE {
  VALUES ?item { wd:${id} }
  ?item p:P1082 ?populationStatement.
  ?populationStatement ps:P1082 ?population. 
  OPTIONAL { ?populationStatement pq:P585 ?populationYear. }
  SERVICE wikibase:label {bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?populationYear)`

  fetch(url, {
    method: "POST",
    headers: { "Accept": "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded" },
    body: "query=" + encodeURIComponent(query)
  })
    .then(response => response.json())
    .then(data => {
      populationsList = data["results"]["bindings"]
      populations = []
      for (item of populationsList) {
        populations.push([item.population.value, item.populationYear.value])
      }
    })
}

function deleteFeature(featureId, layer) {
  const source = map.getSource(layer)
  const data = source._data
  const i = data.features.findIndex(f => f.id == featureId)
  if (i != -1) {
    data.features.splice(i, 1)
    source.setData(data)
  }
}

map.on('contextmenu', (e) => {
  // move the box to the mouse and display it
  rightClickMenuOpen = true
  e.preventDefault()
  menu.classList.remove('invisible')
  menu.style.display = 'block';
  menu.style.left = e.originalEvent.clientX + 'px'
  menu.style.top = e.originalEvent.clientY + 'px'

  // add marker functionality
  const {lng: lng, lat: lat} = e.lngLat.wrap()
  addMarkerEventListener(lng, lat)


  // fetch features for that point 
  let features = map.queryRenderedFeatures(e.point);
  
  (async () => {
    let id = features.map(f => f.id)[0]
    let properties = features.map(f => f.properties)
    let source = features.map(f => f.source)
    let wikidata, wikipedia;
    if(id && source[0] != "osm_land" && source[0] != "custom-markers") {
        [wikidata, wikipedia] = await getWikidataId(id)
        console.log(wikidata, wikipedia)
    }
    // add them to the list
    if (properties.length > 0 && source != "osm_land" && source != "custom-markers") {
      let hr = document.createElement('hr')
      rightClickList.appendChild(hr)
      const includedProperties = ["name_en"]
      for (property in properties[0]) {
        if(properties[0].hasOwnProperty(property)) {
          if (includedProperties.includes(property)) {
            addToRightClick(properties[0][property])
          }
        }
      }
      if(wikidata) {
        addToRightClick("Wikidata", true, `https://www.wikidata.org/wiki/${wikidata}`)
      }
      if(wikipedia) {
        addToRightClick("Wikipedia " + wikipedia, true, wikipediaTagToUrl(wikipedia))
      }
    }

    // delete user created markers functionality
    for (layer of features) {
      if (layer.source == "custom-markers") {
        let deleteButton = document.createElement('li')
        deleteButton.textContent = "Delete Marker"
        rightClickList.appendChild(deleteButton)
        deleteButton.addEventListener('click', () => {
          let features = map.queryRenderedFeatures(e.point)
          const id = features.map(f => f.id)
          deleteFeature(id[0], "custom-markers")
          closeMenu()
        })
      }
    }
  })();  
})

function addMarkerEventListener(lng, lat) {
  const addMarkerButton = document.getElementById('add-marker')
  addMarkerButton.addEventListener('mousedown', (e) => {
    e.stopPropagation;
  })
  addMarkerButton.addEventListener('click', function handler() {
    let textSelect = document.createElement('input')
    textSelect.type = "text"
    rightClickList.insertBefore(textSelect, rightClickList.firstChild) 
    addMarkerButton.remove()
    textSelect.focus()
    textSelect.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (textSelect.value) {
          addMarker(textSelect.value, lng, lat)
        }
        closeMenu()
      }
    })
  })
}



document.addEventListener('mousedown', (e) => {
  closeMenu(e.target)
})

map.on('zoom', (e) => {
  closeMenu()
})

