const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const geocodeAddress = async (address, cityName = '') => {
  const query = [address, cityName].filter(Boolean).join(', ');
  if (!query.trim()) return null;

  const response = await fetch(`${NOMINATIM_URL}?format=jsonv2&limit=1&countrycodes=kz&q=${encodeURIComponent(query)}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'mywork-app/1.0 (support@mywork.kz)',
    },
  });

  if (!response.ok) throw new Error(`Geocoding failed with status ${response.status}`);
  const results = await response.json();
  if (!results.length) return null;

  const latitude = Number(results[0].lat);
  const longitude = Number(results[0].lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { latitude, longitude };
};

module.exports = { geocodeAddress };