import axios from "axios";
import React, { useEffect, useState } from "react"
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styles from "./Weather.module.css"
import Loader from "../loader/Loader";

export default function Weather() {
  // State variables
  const [isLoading, setIsLoading] = useState(true)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [selectedCity, setSelectedCity] = useState(null)
  const [selectedFlag, setSelectedFlag] = useState(null)
  const [noOfDays, setNoOfDays] = useState(6)
  const [sunDetails, setSunDetails] = useState(null)
  const [timezone, setTimezone] = useState(null)
  const [city, setCity] = useState('')
  const [temp, setTemp] = useState('')
  const [currDate, setCurrDate] = useState(new Date())
  const [foreCastedTemp, setForeCastedTemp] = useState({ tempArr: [], avgTempArray:[] })
  const [allWeatherDetails, setAllWeatherDetails] = useState({ time: [], humidity: [], pressure: [], wind_speed: [] })

  //Carousel settings
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          initialSlide: 1
        }
      }
    ]
  }

  useEffect(() => {
    if (latitude && longitude) {
      fetchTempData();
      fetchAllWeatherDetails()
      setIsLoading(false)
    }
  }, [latitude, longitude])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        let paramString = position.coords.latitude.toString() + "+" + position.coords.longitude.toString()
        await setLatitudeAndLongitudeDetails(paramString)
      });
    }
  }, []);

  //fetch forecasting details of a place
  const fetchTempData = async () => {
    const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&forecast_days=${noOfDays}&timezone=auto`)
    if (response.request.status === 200) {
      console.log(response.data)
      setTemp(response.data.daily.temperature_2m_min[0] + " - " + response.data.daily.temperature_2m_max[0])
      let tempArray = []
      let avgTempArray = [];
      for(let index = 1; index < response.data.daily.temperature_2m_max.length; index++){
        const minTemp = response.data.daily.temperature_2m_min[index];
        const maxTemp = response.data.daily.temperature_2m_max[index];
      
      tempArray.push(minTemp.toString() + " - " + maxTemp.toString());
        
        avgTempArray.push((minTemp + maxTemp) / 2);
      }
      response.data.daily.time.shift()
      setForeCastedTemp({ ...foreCastedTemp, tempArr: tempArray,  avgTempArray: avgTempArray,time: response.data.daily.time})
    }
  }

  //fetch weather details of a place
  const fetchAllWeatherDetails = async () => {
    const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=relative_humidity_2m,pressure_msl,windspeed_10m&forecast_days=1&timezone=auto`)
    if (response.request.status === 200) {
      console.log(response.data)
      console.log(response.data.hourly.time)
      setAllWeatherDetails({
        ...allWeatherDetails,
        time: response.data.hourly.time,
        humidity: response.data.hourly.relative_humidity_2m,
        pressure: response.data.hourly.pressure_msl,
        wind_speed: response.data.hourly.windspeed_10m
      })
    }
  }

  //Event handlers/ Utility functions
  const searchButton = async (city) => {
    await setLatitudeAndLongitudeDetails(city)
  }
  
  function estimateWeather(humidity, pressure, windSpeed) {
    if (humidity < 50 && pressure > 1015 && windSpeed < 5) {
        return "☀️";
    } else if (humidity >= 50 && humidity <= 80 && pressure >= 1005 && pressure <= 1015 && windSpeed < 10) {
        return "🌥️";
    } else if (humidity > 80 && pressure < 1005 && windSpeed >= 5 && windSpeed <= 15) {
        return "🌧️";
    } else if (humidity > 85 && pressure < 995 && windSpeed > 15) {
        return "🌩️🌧️";
    } else if (humidity > 90 && windSpeed < 5) {
        return "🌫️"; 
    } else {
        return "🌥️";
    }
}

const getTempIcon = (temperature) => {
  console.log("temp",temperature)
  if (temperature >= 30) return "🔥"; // Hot
  if (temperature >= 20) return "☀️"; // Warm/Sunny
  if (temperature >= 15) return "🌦️"; // Mild, with a chance of rain
  if (temperature >= 10) return "⛅"; // Cool/Partly Cloudy
  if (temperature >= 5) return "🌫️"; // Chilly/Foggy
  if (temperature < 5) return "❄️"; // Cold
  return "☀️"; // Default Sunny icon
};

  const getDay = (date, next=false) => {
    if(next)
      date.setDate(date.getDate() + 1);

    const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });

    const day = date.getDate();

    const getOrdinalSuffix = (day) => {
      if (day >= 11 && day <= 13) {
        return 'th';
      }
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${dayOfWeek} ${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  };

  const setLatitudeAndLongitudeDetails = async (params) => {
    const { lat, long, city, flag, sun: sunDetails, timezone } = await getCoordinates(params);
    setSelectedFlag(flag)
    setSelectedCity(city)
    setSunDetails(sunDetails)
    setTimezone(timezone)
    setLongitude(long)
    setLatitude(lat)
  }

  //Conversion of place to co-ordinates
  const getCoordinates = async (params) => {
    const apiKey = '684bdad58a554b759ee82e0f866e2530';
    const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${params}&key=${apiKey}`);

    if (response.status === 200 && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry;
      const { flag, sun, timezone } = response.data.results[0].annotations;
      const city = response.data.results[0].formatted
      return { lat: lat, long: lng, flag, sun, timezone, city };
    } else {
      throw new Error('Unable to find location');
    }
  }

return (
  <>
    {/* Input details */}
    <form className={styles.searchForm}>
      <input
        type="search"
        className={styles.searchInput}
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Enter the city"
        required
        autoComplete="off"
      />
      <br />
      <br />
      <button
        className={styles.searchButton}
        onClick={(e) => {
          e.preventDefault();
          searchButton(city);
        }}
      >
        Search
      </button>
    </form>

    {/* Data Loading */}
    {isLoading ? (
      <Loader />
    ) : (
      <div style={{ margin: "50px", color: "white" }}>
        <Slider {...settings}>
          {temp && (
            <div
              style={{
                border: "2px solid red",
                padding: "20px",
                textAlign: "center",
              }}
            >
              <div className={styles.location}>
                <p
                  className={styles.textStyle}
                  style={{ fontSize: "20px", marginBottom: "10px" }}
                >
                  {selectedCity} {selectedFlag}
                </p>
              </div>

              <div className={styles.currentTemp}>
                {/* Current temperature icon based on weather */}
                <p style={{ fontSize: "50px" }}>
                {foreCastedTemp.avgTempArray.length > 0 && getTempIcon(foreCastedTemp.avgTempArray[0])}

                </p>

                <p className={styles.textStyle} style={{ marginBottom: "10px" }}>
                  <span className={styles.tempValue}>{temp}</span>
                  <span className={styles.tempUnit}>&#8451;</span>
                </p>
                <p className={styles.textStyle}>{getDay(currDate)}</p>
              </div>
              <h2 className={styles.temp}>
                Forecasted Temperature for next {noOfDays - 1} Days
              </h2>
              <div className={styles.outerContainer}>
                {foreCastedTemp.tempArr.map((temp, index) => (
                  <div key={index} className={styles.container}>
                    {/* Daily forecast icon based on weather */}
                    <p style={{ fontSize: "50px" }}>
                    {foreCastedTemp.avgTempArray.length > 0 && getTempIcon(foreCastedTemp.avgTempArray[index])}
                  </p>

                    <p>
                      <span className={styles.tempValue}>{temp}</span>
                      <span className={styles.tempUnit}>&#8451;</span>
                    </p>
                    <p>
                      <span className={styles.tempValue}>
                        {getDay(new Date(foreCastedTemp.time[index]))}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className={styles.location}>
              <p
                className={styles.textStyle}
                style={{ fontSize: "20px", marginBottom: "10px" }}
              >
                {selectedCity} {selectedFlag}
              </p>
            </div>
            <h2 className={styles.temp} style={{ marginBottom: "20px" }}>
              Weather Details - {getDay(currDate)}
            </h2>
            {allWeatherDetails.time.length > 0 && (
              <div className={styles.outerContainerTemp}>
                {allWeatherDetails.time.map((time, index) => (
                  <div key={index} className={styles.container}>
                    {/* Hourly weather icon */}
                    <p style={{ fontSize: "50px" }}>
                      <strong>
                        {estimateWeather(
                          allWeatherDetails.humidity[index],
                          allWeatherDetails.pressure[index],
                          allWeatherDetails.wind_speed[index]
                        )}
                      </strong>
                    </p>
                    <p>
                      <strong>Time:</strong> {new Date(time).toLocaleTimeString()}
                    </p>
                    <p>
                      <strong>Humidity:</strong> {allWeatherDetails.humidity[index]} %
                    </p>
                    <p>
                      <strong>Pressure:</strong> {allWeatherDetails.pressure[index]} hPa
                    </p>
                    <p>
                      <strong>Wind Speed:</strong> {allWeatherDetails.wind_speed[index]} km/h
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Slider>
      </div>
    )}
  </>
);

}

