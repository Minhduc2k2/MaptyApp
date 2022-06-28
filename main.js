'use strict';



const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class Workout {
    date = new Date();
    id = Date.now();
    click = 0;
    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }
    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type.charAt(0).toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}`
    }
    _click() {
        this.click++;
    }
}
class Cycling extends Workout {
    type = "cycling";
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
class Running extends Workout {
    type = "running";
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class App {
    #map;
    #mapEvent;
    #workouts = []
    constructor() {
        this._getPosition();


        this._getDatafromLocalStorage();

        //TODO: Handle submit Form -> Show popup
        form.addEventListener("submit", this._newWorkout.bind(this))
        //TODO: Handle change inputType -> Change html
        inputType.addEventListener("change", this._toggleElevationField.bind(this))
        //TODO: Handle click in list -> Move to popup
        containerWorkouts.addEventListener("click", this._moveToPopup.bind(this))
    }

    _getPosition() {
        //TODO: Get location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function (error) { alert(error) })
        }
    }
    _loadMap(position) {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude];
        //? Get position in google map
        console.log(`https://www.google.com/maps/@${latitude},${longitude},hl=vi-VN`)

        //TODO: Here we create a map in the 'map' div in html, add tiles of our choice, and then add a marker with some text in a popup
        //? setView(coordinates, zoom percentage)
        this.#map = L.map('map').setView(coords, 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);


        //TODO: Handle Map Event -> Mark point in map -> Show Form
        this.#map.on('click', this._showForm.bind(this))

        //TODO: Render Workout Marker From LocalStorage
        this.#workouts.forEach(workout => {
            //!Nếu renderWorkoutMarker tại đây thì map đã được load xong sẽ thành công
            this._renderWorkoutMarker(workout)
        })
    }
    _showForm(mapE) {
        console.log(mapE)
        this.#mapEvent = mapE;
        form.classList.remove("hidden")
    }
    _toggleElevationField() {
        inputCadence.parentElement.classList.toggle("form__row--hidden")
        inputElevation.parentElement.classList.toggle("form__row--hidden")
        //! OR
        //inputCadence.closest(".form__row").classList.toggle("form__row--hidden")
        //inputElevation.closest(".form__row").classList.toggle("form__row--hidden")
    }
    _newWorkout(e) {
        e.preventDefault();

        const { lat, lng } = this.#mapEvent.latlng;
        //TODO: Get data from Form
        const type = inputType.value;
        const distance = + inputDistance.value;
        const duration = + inputDuration.value;
        const cadence = + inputCadence.value;
        const elevation = + inputElevation.value;

        //TODO: CheckValid
        const isNumber = (...inputs) => inputs.every((input) => Number.isFinite(input))
        const isPositive = (...inputs) => inputs.every((input) => input > 0)

        let workout;
        //TODO: If workout running, create running object
        if (type == "running") {
            if (!isNumber(distance, duration, cadence) || !isPositive(distance, duration, cadence)) {
                alert("Inputs must be a positive number");
                return;
            }
            workout = new Running([lat, lng], distance, duration, cadence)
        }
        //TODO: If workout cycling, create cycling object
        if (type == "cycling") {
            if (!isNumber(distance, duration, cadence) || !isPositive(distance, duration)) {
                alert("Inputs must be a positive number");
                return;
            }
            workout = new Cycling([lat, lng], distance, duration, elevation)
        }
        this.#workouts.push(workout);
        console.log(this.#workouts)


        //TODO: Show popup
        this._renderWorkoutMarker(workout)

        //TODO: Show into list
        this._renderWorkoutIntoList(workout)

        //TODO: Hide Form & Clear Input
        this._hideMap()

        //TODO: Set data to LocalStorage
        this._setDatatoLocalStorage()
    }
    _hideMap() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = ""
        form.classList.add("hidden")
    }
    _moveToPopup(e) {
        const workoutEl = e.target.closest(".workout")
        if (!workoutEl)
            return;
        const workout = this.#workouts.find(workout => workout.id == workoutEl.dataset.id)

        this.#map.setView(workout.coords, 15, {
            animate: true,
            duration: 1.5
        });

        //workout._click();

    }
    _renderWorkoutMarker(workout) {
        //? If you want to just bind a popup to marker click and then open it, it's really easy:
        //! marker.bindPopup(popupContent).openPopup();

        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 300,
                minWidth: 50,
                autoClose: false, //* closing when another popup is opened
                closeOnClick: false,
                className: `${workout.type}-popup`
            }))
            .setPopupContent(`${workout.type == "running" ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();
    }
    _renderWorkoutIntoList(workout) {

        var html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type == "running" ? '🏃‍♂️' : '🚴‍♀️'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div >
        <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
        </div>`
        if (workout.type == "running") {
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`
        }
        else {
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`
        }
        form.insertAdjacentHTML("afterend", html);
    }
    _setDatatoLocalStorage() {
        localStorage.setItem("workouts", JSON.stringify(this.#workouts))
    }
    _getDatafromLocalStorage() {
        this.#workouts = JSON.parse(localStorage.getItem("workouts"));
        if (!this.#workouts)
            return;
        //TODO: Render Workout Into List From LocalStorage
        this.#workouts.forEach(workout => {
            this._renderWorkoutIntoList(workout)
            //!Nếu renderWorkoutMarker tại đây thì map chưa được load xong sẽ gây ra lỗi
            //!this._renderWorkoutMarker(workout)
        })
    }
}
const app = new App();



