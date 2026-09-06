import apiClient from '../../utils/apiClient';

export const loadMapApplications = async () => {
  const response = await apiClient.get('/api/applications', { params: { status: 'open' } });
  const data = response?.data?.data || response?.data || [];
  return Array.isArray(data) ? data : [];
};

export const getCityName = (city) => {
  if (!city) return 'Город не указан';
  if (typeof city === 'string') return city;
  return city.name || 'Город не указан';
};

export const getApplicationCoordinate = (application) => {
  const latitude = Number(application?.latitude);
  const longitude = Number(application?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
};

export const filterApplications = (applications, { categoryId, searchQuery, searchText }) => {
  const query = (searchText ?? searchQuery ?? '').trim().toLowerCase();
  return applications.filter((application) => {
    if (categoryId) {
      const categories = Array.isArray(application.categories) ? application.categories : [];
      const matchesCategory = categories.some((category) => String(category?._id || category?.id || category) === String(categoryId));
      if (!matchesCategory) return false;
    }

    if (!query) return true;
    return [application.title, application.info, application.address]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
};