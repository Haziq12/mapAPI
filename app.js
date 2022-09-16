'use strict';


const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
    this.coordinates = coordinates,
    this.distance = distance,
    this.duration = duration
  }
}

class Running extends Workout {
  constructor(coordinates, distance, duration, cadence) {
    super(coordinates, distance, duration)
    this.cadence = cadence
    this.calcPace()
  }

  calcPace() {
    this.pace = this.duration / this.distance
    return this.pace 
  }
}



class Cycling extends Workout {
  constructor(coordinates, distance, duration, elevationGain) {
    super(coordinates, distance, duration)
    this.elevationGain = elevationGain
    this.calcSpeed()
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60)
    return this.speed
  }
}

class App {
  #map
  #mapEvent
  #workouts = []

  constructor() {
    this._getPosition(),

      form.addEventListener('submit', this._newWorkout.bind(this)),

      inputType.addEventListener('change', this._toggleElevationField)
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
    this.#map = L.map('map').setView(coordinates, 13);

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

    this.#workouts.push(workout)
    console.log(workout)

    // Show workout on the map as a marker
    
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${type}-popup`
      }))
      .setPopupContent('Workout')
      .openPopup();

    // clear input fields
    inputDistance.value = inputDuration.value = inputElevation.value = inputCadence.value = ''
    

    
  }
}

const app = new App()