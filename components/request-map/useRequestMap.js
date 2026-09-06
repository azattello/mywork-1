import { useCallback, useEffect, useMemo, useState } from 'react';
import { filterApplications, getApplicationCoordinate, loadMapApplications } from './map.service';

export const useRequestMap = (filters) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setApplications(await loadMapApplications());
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredApplications = useMemo(
    () => filterApplications(applications, filters),
    [applications, filters]
  );
  const mappableApplications = useMemo(
    () => filteredApplications.filter((application) => getApplicationCoordinate(application)),
    [filteredApplications]
  );

  return {
    applications: filteredApplications,
    mappableApplications,
    loading,
    refreshing,
    error,
    reload: load,
  };
};