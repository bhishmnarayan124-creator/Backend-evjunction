const axios = require("axios");
const Charger = require("../models/Charger");

// convert city → coordinates
const getCoordinates = async (place) => {
  const response = await axios.get(
    "https://api.openrouteservice.org/geocode/search",
    {
      params: {
        api_key: process.env.ORS_API_KEY,
        text: place + ", India",
        size: 1,
      },
    }
  );

  if (!response.data.features.length)
    throw new Error("Location not found");

  return response.data.features[0].geometry.coordinates;
};

// tourist places fetch
const getTopPlaces = async (city) => {
  try {
    const geo = await axios.get(
      "https://api.geoapify.com/v1/geocode/search",
      {
        params: {
          text: city,
          apiKey: process.env.GEOAPIFY_API_KEY,
        },
      }
    );

    if (!geo.data.features.length) return [];

    const { lat, lon } =
      geo.data.features[0].properties;

    const places = await axios.get(
      "https://api.geoapify.com/v2/places",
      {
        params: {
          categories:
            "tourism.sights,tourism.attraction",
          filter: `circle:${lon},${lat},5000`,
          limit: 10,
          apiKey: process.env.GEOAPIFY_API_KEY,
        },
      }
    );

    return places.data.features.map(
      (p) => p.properties.name
    );
  } catch {
    return [];
  }
};

exports.calculateTrip = async (req, res) => {
  try {
    const { from, to, range, battery } =
      req.body;

    if (!from || !to || !range || !battery)
      return res.status(400).json({
        message: "Missing trip data",
      });

    const origin =
      await getCoordinates(from);

    const destination =
      await getCoordinates(to);

    const routeResponse =
      await axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car",
        {
          coordinates: [origin, destination],
        },
        {
          headers: {
            Authorization:
              process.env.ORS_API_KEY,
          },
        }
      );

    const summary =
      routeResponse.data.routes[0].summary;

    const distanceKm =
      summary.distance / 1000;

    const durationMinutes =
      summary.duration / 60;

    const effectiveRange =
      (range * battery) / 100;

    const chargesNeeded = Math.max(
      0,
      Math.ceil(
        distanceKm / effectiveRange
      ) - 1
    );

    let chargers =
      await Charger.find().limit(
        chargesNeeded
      );

    // fallback stops if DB empty
    if (
      chargers.length === 0 &&
      chargesNeeded > 0
    ) {
      chargers = Array.from(
        { length: chargesNeeded },
        (_, i) => ({
          city: `Charging Stop ${
            i + 1
          }`,
        })
      );
    }

    const arrivalBattery =
      battery -
      Math.round(
        (distanceKm / range) * 100
      );

    const cost =
      chargesNeeded > 0
        ? `₹${chargesNeeded * 400}`
        : "₹0";

    const topPlaces =
      await getTopPlaces(to);

    res.json({
      from,
      to,
      distance:
        distanceKm.toFixed(1) + " km",
      time:
        Math.round(durationMinutes) +
        " mins",
      chargesNeeded,
      stops: chargers.map(
        (c) => c.city
      ),
      arrivalBattery:
        arrivalBattery > 5
          ? arrivalBattery
          : 5,
      cost,
      highway: "NH Route",
      topPlaces,
    });
  } catch (err) {
    console.log(err.message);

    res.status(500).json({
      message: "Trip calculation failed",
    });
  }
};