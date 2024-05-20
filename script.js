//June 2, 2023
//Bao Tran
//CMP621A -- class of 2022-2023 (second sem)
//Map Project -- Teacher: Mr. Andrew MacDougald


const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const locateBtn=document.querySelector(".hidden.locateMe");
const htmlTxt=document.getElementById("htmlTxt");
const additionTxt=document.querySelector(".additionTxt.hidden");
const arrInner=document.querySelectorAll(".innerTxt");
const moreInfo=document.querySelector(".moreInfo");
const image=document.getElementById("imgInfo");
const gmail=document.getElementById("gmailInfo");
const invalidInput=document.querySelector(".invalidInput");

//Variables
let map;
let mapEvent;
let lastInputType=0;  //0: Running, 1: Cycling
let workouts=[];
let html="";
let markerGroup;
let mainMarker;
let cnt=0;
let innerCnt=0;
//Color for the Markers
const myCustomColour1 = "crimson";
const myCustomColour2 = "darkgreen";
const myCustomColour4 = "darkgoldenrod";
const myCustomColour3 = "navy";

const markerHtmlStyles1 = `
  background-color: ${myCustomColour1};
  width: 5rem;
  height: 5rem;
  display: block;
  left: -1.5rem;
  top: -1.5rem;
  position: relative;
  border-radius: 3rem 3rem 0;
  transform: rotate(45deg);
  border: 1px solid #FFFFFF`
const markerHtmlStyles2 = `
  background-color: ${myCustomColour2};
  width: 5rem;
  height: 5rem;
  display: block;
  left: -1.5rem;
  top: -1.5rem;
  position: relative;
  border-radius: 3rem 3rem 0;
  transform: rotate(45deg);
  border: 1px solid #FFFFFF`
const markerHtmlStyles4 = `
  background-color: ${myCustomColour4};
  width: 5rem;
  height: 5rem;
  display: block;
  left: -1.5rem;
  top: -1.5rem;
  position: relative;
  border-radius: 3rem 3rem 0;
  transform: rotate(45deg);
  border: 1px solid #FFFFFF`
const markerHtmlStyles3 = `
  background-color: ${myCustomColour3};
  width: 5rem;
  height: 5rem;
  display: block;
  left: -1.5rem;
  top: -1.5rem;
  position: relative;
  border-radius: 3rem 3rem 0;
  transform: rotate(45deg);
  border: 1px solid #FFFFFF`
//Icons to add to the markers so that they look better
const Icon1 = L.divIcon({
  className: "my-custom-pin",
  iconAnchor: [0, 24],
  labelAnchor: [-6, 0],
  popupAnchor: [0, -36],
  html: `<span style="${markerHtmlStyles1}" />`
})
const Icon2 = L.divIcon({
    className: "my-custom-pin",
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles2}" />`
})
const Icon4 = L.divIcon({
    className: "my-custom-pin",
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles4}" />`
})
const Icon3 = L.divIcon({
    className: "my-custom-pin",
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles3}" />`
})

class Workout {
    date = new Date();
    id=(Date.now()+"").slice(-10);
    constructor(coords, distance, duration, idd, count, inp, type) {
        this.coords=coords;
        this.distance=distance;
        this.duration=duration;
        this.marker_id=idd;
        this.cnt=count;
        this.type=type;
        this.setDescription();
        if (this.type=="Running") {
            this.cadence=inp;
            this.calcPace1();
        } else {
            this.elevation=inp;
            this.calcPace2();
        }
    }
    setDescription() {
        this.description=`${this.type} -- ${this.date.toDateString()} -- #${this.cnt}`;
    }
    calcPace1() {
        this.pace=this.duration/this.distance;
        this.pace=this.pace.toFixed(1);
    }
    calcPace2() {
        this.pace=this.distance/this.duration;
        this.pace=this.pace.toFixed(1);
    }
}

navigator.geolocation.getCurrentPosition(
    function (position) {
        const latitude=position.coords.latitude;
        const longitude=position.coords.longitude;
        const coords=[latitude,longitude];

        map = L.map("map").setView(coords, 13);
        
        var openstreetmap = L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "Map data &copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a>"}) //Normal theme
        var openstreetmapHot = L.tileLayer(
            "http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
            attribution: "Map data &copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a>"}) //Hot theme
        //Toggle map theme 
        var openMapOptions={
            "Normal Theme":openstreetmap,
            "Hot Theme":openstreetmapHot
        };
        //Use the last theme before reloading the pagge
        //If there is none before theme, use the normal theme
        const dataT=JSON.parse(localStorage.getItem("theme"));
        var selectedLayer=(dataT && dataT=="Hot Theme")? openstreetmapHot:openstreetmap;
        selectedLayer.addTo(map);
        L.control.layers(openMapOptions).addTo(map);
        
        map.on("baselayerchange", function (eventLayer) {
            // Update the selected layer name
            var selectedLayerName = eventLayer.name;
            localStorage.setItem("theme", JSON.stringify(selectedLayerName));
        });

		markerGroup=L.featureGroup(); //The group of markers

        //Get data from the local storage
        const dataW=JSON.parse(localStorage.getItem("workouts"));
        const dataM=JSON.parse(localStorage.getItem("markerGroup"));
        
        if (dataW && dataW.length && dataM) {
            workouts=dataW;
            markerGroup=L.geoJSON(dataM);
            //Load the data if there is any
            loadData();
            //In this program, the workout inside the workouts array and their correspond marker stored inside
            //the markerGroup are connected by using leaflet_id. However, the leaflet_id cannot be stored in the local
            //storage. Therefore, I assign the leaflet_id to the properties of the marker with the name marker_id. 
            //This marker_id is the same in this correstponding workout instance.

            //However, there is still another problem. The leaflet_id is changed everytime the page reloads. So in order
            //for the 'deleteMarker' function to work, we have to update a new marker_id everytime the page reloads.
        } else {        
            //If there is no data stored, create the 'current-location' marker and
            //then add to the markerGroup
            mainMarker=L.marker(coords, {icon:Icon1});
            mainMarker.addTo(markerGroup).bindPopup(L.popup({
                className: "current-location"
            })).setPopupContent("You").openPopup();
            //Assign a properties call marker_id so that we know this is the 'current-location' marker
            mainMarker.feature={};
            mainMarker.feature.type="Feature"; 
            mainMarker.feature.properties={};
            mainMarker.feature.properties.marker_id=0;
        }
        markerGroup.addTo(map);

        map.on("click", function(mapE) {
            mapEvent=mapE;
            
            form.classList.remove("hidden");    //Allow the user to enter the input
            //Allow the user to press this button to locate the map back to current location
			locateBtn.classList.remove("hidden");   
            inputDistance.focus();
        });
    },
    function () {
        alert("Could Not Get Position");
    }
);
function loadData() {
    for (let workout of workouts) {
        //Go through each marker and setIcon to make them look better
        //Also, update the marker_id of the workout instances
		markerGroup.eachLayer(function(layer) {
            if (layer.feature.properties.marker_id==workout.marker_id) {
                layer.setIcon((workout.type=="Running")? Icon2:Icon4);
				layer.bindPopup(L.popup({
					autoClose:false,
					closeOnClick:false,
					className: (workout.type=="Running")? "running-popup":"cycling-popup",
				})).setPopupContent(`#${workout.cnt}`);
				workout.marker_id=layer._leaflet_id; //Update the new marker_id for workout instance
            }
			if (layer.feature.properties.marker_id==0) {
				//Set Icon for the 'current-location' marker
				mainMarker=layer;
                layer.setIcon(Icon1);
                layer.bindPopup(L.popup({
                    className: "current-location"
                })).setPopupContent("You");
            }
            //Hover the mouse over to popup the content
            layer.on("mouseover", function() {
                this.openPopup()
            });
        })
        //Load the data on the left side bar
        html+=htmlCreate(workout);
        cnt=workout.cnt;
    }
    htmlTxt.innerHTML=html;
	markerGroup.eachLayer(function(layer) {
        if (layer.feature.properties.marker_id) {
		    layer.feature.properties.marker_id=layer._leaflet_id;   //Update new marker_id for the marker
        }
	})
	locateBtn.classList.remove("hidden");   //Enable the 'locate-me' button
}
function htmlCreate(workout) {
    var tempHtml="";
    if (workout.type=="Running") {
        tempHtml+=
            `<li class="workout workout--running" data-id=${workout.id}>
                <h2 class="workout__title">${workout.description}</h2>
                <div class="workout__details">
                    <span class="workout__icon">🏃‍♂️</span>
                    <span class="workout__value">${numberWithCommas(workout.distance)}</span>
                    <span class="workout__unit">km</span>
                </div>
                    <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${numberWithCommas(workout.duration)}</span>
                    <span class="workout__unit">min</span>
                </div>
                    <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${numberWithCommas(workout.pace)}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${numberWithCommas(workout.cadence)}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>`;
    } else {
        tempHtml+=
            `<li class="workout workout--cycling" data-id=${workout.id}>
                <h2 class="workout__title">${workout.description}</h2>
                <div class="workout__details">
                    <span class="workout__icon">🚴‍♀️</span>
                    <span class="workout__value">${numberWithCommas(workout.distance)}</span>
                    <span class="workout__unit">km</span>
                </div>
                    <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${numberWithCommas(workout.duration)}</span>
                    <span class="workout__unit">min</span>
                </div>
                    <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${numberWithCommas(workout.pace)}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                    <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${numberWithCommas(workout.elevation)}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li>`;
    }
    return tempHtml;
}

function resetForm() {
    //Reset the input form
    form.reset();
    changeType();
}
function changeType() {
    //Toggle the Cadence and ELevationGain when the user chooses workout type
    if (inputType.value=="Running") {
        inputCadence.closest(".form__row").classList.remove("form__row--hidden");
        inputElevation.closest(".form__row").classList.add("form__row--hidden");
    } else {
        inputElevation.closest(".form__row").classList.remove("form__row--hidden");
        inputCadence.closest(".form__row").classList.add("form__row--hidden");
    }
}
function check(type) {
    //Check if the input is a number or not
    //If not, assign its value to be 0
    val=type.value;
    if (val.trim()=="") return 0;
    if (isNaN(parseFloat(val)) || val<0) {
        invalidInput.classList.remove("hidden");
        type.value="";
        type.focus();
        return 1;
    }
    return 0;
}
function numberWithCommas(x) {
    //Add the commas to the number when needed
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function sub(e) {
    e.preventDefault();
    //Check if the inputted value is a number or not
    if (check(inputDistance)||check(inputDuration)||check(inputCadence)||check(inputElevation)) {
        //Raise invalid input and make the user type in the input again
        return;
    }
    invalidInput.classList.add("hidden");

    cnt++;
    //Get the coordinates
    const lat=mapEvent.latlng.lat;
    const lng=mapEvent.latlng.lng;
    const coords=[lat,lng];
    //Add the marker to the markerGroup
    const markers=L.marker(coords);
	markers.addTo(markerGroup);

    //Assign the marker_id under the feature.properties
    //Console.log to see that the markers object actually has this variable
    markers.feature={};
    markers.feature.type="Feature"; 
    markers.feature.properties={};
    markers.feature.properties.marker_id=markers._leaflet_id; 

    const type=inputType.value;
    const distance=Number(inputDistance.value);
    const duration=Number(inputDuration.value);
    let workout;
    
    const inp=(Number(inputCadence.value))?Number(inputCadence.value):Number(inputElevation.value);
    workout=new Workout([lat,lng], distance, duration, markers._leaflet_id, cnt, inp, type);
    html+=htmlCreate(workout);
    
    //Change the marker color
    markers.setIcon((workout.type=="Running")? Icon2:Icon4);
    //Pop up content
    markers.bindPopup(L.popup({
        autoClose:false,
        closeOnClick:false,
        className: (workout.type=="Running")? "running-popup":"cycling-popup",
    })).setPopupContent(`#${workout.cnt}`).openPopup();
    //Add the hover function for the marker
    markers.on("mouseover", function() {
        this.openPopup();
    });

    workouts.push(workout);
    //Upload new workout on the left sidebar
    htmlTxt.innerHTML=html;
    //Save Data
    localStorage.setItem("workouts", JSON.stringify(workouts));
    localStorage.setItem("markerGroup", JSON.stringify(markerGroup.toGeoJSON()));
    //Reset the Form
    resetForm();
    //Set the lastInputType
    lastInputType=(type=="Running")?0:1;
    inputType.options[lastInputType].selected="selected";
    inputType.options[(lastInputType+1)%2].selected="";
}

function deleteMarker(workout) {
    //Remove the marker
    //workout.marker_id is the leaflet_id of the marker, which is needed to remove this marker
    markerGroup.removeLayer(workout.marker_id);

    //Remove the sidebar workout
    html=html.replace(htmlCreate(workout), ``);
    htmlTxt.innerHTML=html;

	//Remove the object from the workouts array
	for (let i=0; i<workouts.length; i++) {
		if (workouts[i]==workout) {
			workouts.splice(i, 1);
            if (workouts.length==0) cnt=0; //Reset the cnt back to zero
			break;
		}
	}
	//Save Data
    localStorage.setItem("workouts", JSON.stringify(workouts));
    localStorage.setItem("markerGroup", JSON.stringify(markerGroup.toGeoJSON()));
}

form.addEventListener("submit", sub);

inputType.addEventListener("change", () => {
    changeType();
    inputDistance.focus();  //Focus the cursor to input distance after toggle the input type
});

containerWorkouts.addEventListener("click", function(e) {
    //Targer Click
    const workoutEl=e.target.closest(".workout");
	if (!workoutEl) {
		return;
	}
	const workout=workouts.find((work) => work.id === workoutEl.dataset.id);
    //If the ctrlKey is pressed while clicked on this workout, delete this workout
    if (e.ctrlKey) {
        deleteMarker(workout);
        return;
    }
	let zoom=13;
    //If the user already zoom in, then keep that zoom size
	if (zoom<(map.getZoom())) {zoom=map.getZoom();}
	map.setView(workout.coords, zoom, {
		animate: true,
		pan: {
			duration: 1.5,
		},
	});
    //Set the color of the marker by setIcon
    markerGroup.eachLayer(function(layer){
        if (layer._leaflet_id==workout.marker_id) {
            layer.setIcon(Icon3);
        } else if (layer.feature.properties.marker_id) {
            for (const element of workouts) {
                if (layer._leaflet_id==element.marker_id) {
                    layer.setIcon((element.type=="Running")?Icon2:Icon4);
                }
            }
        }
    })
});

locateBtn.addEventListener("click", function() {
    //Locate our view back to the 'current-location'
	let coords=[mainMarker.getLatLng().lat, mainMarker.getLatLng().lng];
	map.setView(coords, 13, {
		animate: true,
		pan: {
			duration: 1.5,
		},
	});
});

moreInfo.addEventListener("click", function(e) {
    const moreInfo=e.target.closest("#imgInfo");
    if (!moreInfo) {
        return;
    }
    //Pop up some more content below
    innerCnt++;
    additionTxt.classList.toggle("hidden");
    if (innerCnt%2==0) {
        for (const inner of arrInner) {
            inner.innerHTML="";
        }
        return;
    }
    setTimeout(animateTxt, 1200);  
});

//Letter Animation
//Work both when the text are appeared vertically and horizontally
const delay=120;
const textsForVertical=
            [["Ctrl ", "Click ", "to ", "Remove ", "Workout "],
            ["Can ", "Toggle ", "Map ", "Theme "],
            ["Capable ", "of ", "Different ", "Screen ", "Size "]];

//Create a desired number of span
function spanCreate(n) {
    var spanTemp=""
    for (let i=0; i<n; i++) {
        spanTemp+=`<span></span>`;
    }
    return spanTemp;
}
//Animate letter by letter 
function animateTxt() {
    for (let i=0; i<textsForVertical.length; i++) {
        arrInner[i].innerHTML=spanCreate(textsForVertical[i].length);
    }
    for (let i=0; i<textsForVertical.length; i++) {
        const span=arrInner[i].querySelectorAll("span");
        let lineIndex=0, charIndex=0;
        function animateLine() {
            const animatedtext=span[lineIndex];
            const line=textsForVertical[i][lineIndex];
            const cur=line.substring(0, charIndex+1);
            animatedtext.innerHTML=cur;
            charIndex++;
            if (charIndex<line.length) {
                setTimeout(animateLine, delay);
            } else {
                lineIndex++;
                charIndex=0;
                if (lineIndex<textsForVertical[i].length) {
                    setTimeout(animateLine, delay)
                }
            }
        }
        animateLine();
    }
}