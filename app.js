'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  // Using Public Field Declarations:
  date = new Date()
  id = (Date.now() + '').slice(-10)

  constructor(coordinates, distance, duration) {
    this.coordinates = coordinates
    this.distance = distance
    this.duration = duration
  }

  _setDescription() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
  }
}

class Running extends Workout {
  type = 'running'
  constructor(coordinates, distance, duration, cadence) {
    super(coordinates, distance, duration)
    this.cadence = cadence
    this.calcPace()
    this._setDescription()
  }

  calcPace() {
    this.pace = this.duration / this.distance
    return this.pace 
  }
}



class Cycling extends Workout {
  type = 'cycling'
  constructor(coordinates, distance, duration, elevationGain) {
    super(coordinates, distance, duration)
    this.elevationGain = elevationGain
    this.calcSpeed()
    this._setDescription()
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60)
    return this.speed
  }
}

class App {
  #map
  #mapZoomLevel = 13
  #mapEvent
  #workouts = []

  constructor() {
    this._getPosition()
    this._getLocalStorage()
    form.addEventListener('submit', this._newWorkout.bind(this))
    inputType.addEventListener('change', this._toggleElevationField)
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this))
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
        alert('Could not get your position')
      })
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords
    const { longitude } = position.coords

    const coordinates = [latitude, longitude]
    this.#map = L.map('map').setView(coordinates, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this))
  }

  _showForm(event) {
    this.#mapEvent = event
    form.classList.remove('hidden')
    inputDistance.focus()
  }

  _hideForm() {
    inputDistance.value = inputDuration.value = inputElevation.value = inputCadence.value = ''
    form.style.display = 'none'
    form.classList.add('hidden')
    setTimeout(() => form.style.display = 'grid', 1000)
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
  }

  _newWorkout(e) {

    const validInputs = (...inputs) => inputs.every(num => Number.isFinite(num))
    const isPositive = (...inputs) => inputs.every(num => num > 0) 

    e.preventDefault()

    // Get form data
    const type = inputType.value 
    const distance = Number(inputDistance.value )
    const duration = Number(inputDuration.value)
    const { lat, lng } = this.#mapEvent.latlng 
    let workout 

    if (type === 'running') {
      const cadence = Number(inputCadence.value)

      if (!validInputs(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)) {
        return alert('Please enter a positive number value:')
      }
      workout = new Running([lat, lng], distance, duration, cadence)
    } 

    if(type === 'cycling') {
      const elevation = Number(inputElevation.value)

      if (!validInputs(distance, duration, elevation) ||
        !isPositive(distance, duration))
        return alert('Please enter a positive number value:')

        workout = new Cycling([lat, lng], distance, duration, elevation)
    }

    // adding object to workouts array
    this.#workouts.push(workout)

    // Show workout on the map as a marker
    this._renderWorkoutMarker(workout) 

    // call render workout to render workout in list 
    this._renderWorkout(workout)
    
    // clear input fields
    this._hideForm()

    // Adding all workouts to local storage 
    this._setLocalStorage()
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coordinates)
    .addTo(this.#map)
    .bindPopup(L.popup({
      maxWidth: 250,
      minWidth: 100,
      autoClose: false,
      closeOnClick: false,
      className: `${workout.type}-popup`
    }))
    .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.description}`)
    .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">
              ${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}
            </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`
    if (workout.type === 'running') {
      html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`
    }
    if(workout.type === 'cycling') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`
    }
    form.insertAdjacentHTML('afterend', html)
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout')
    
    //guard clause
    if(!workoutEl) return 

    const workout = this.#workouts.find(workout => workout.id === workoutEl.dataset.id)

    this.#map.setView(workout.coordinates, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1
      }
    })
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts))
  }
  _getLocalStorage() {
    const data = localStorage.getItem('workouts') 
    console.log(data) 
  }
 }

const app = new App()