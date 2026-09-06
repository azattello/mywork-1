import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import ClusteredMapView from 'react-native-map-clustering';
import { getApplicationCoordinate } from './map.service';
import RequestMapMarker from './RequestMapMarker';

const DEFAULT_REGION = {
  latitude: 51.1694,
  longitude: 71.4491,
  latitudeDelta: 0.8,
  longitudeDelta: 0.8,
};

const RequestMap = ({ applications, onSelect, loading }) => {
  const mapRef = useRef(null);
  const coordinates = useMemo(
    () => applications.map(getApplicationCoordinate).filter(Boolean),
    [applications]
  );

  useEffect(() => {
    if (!mapRef.current || !coordinates.length) return;
    const timer = setTimeout(() => {
      if (coordinates.length === 1) {
        mapRef.current.animateToRegion({ ...coordinates[0], latitudeDelta: 0.08, longitudeDelta: 0.08 }, 350);
      } else {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 80, right: 40, bottom: 180, left: 40 },
          animated: true,
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [coordinates]);

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator color="#EC1B23" size="large" /><Text style={styles.loadingText}>Загрузка карты...</Text></View>;
  }

  return (
    <ClusteredMapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={DEFAULT_REGION}
      showsUserLocation={false}
      clusterColor="#EC1B23"
      radius={48}
      minPoints={2}
      animationEnabled
    >
      {applications.map((application) => (
        <RequestMapMarker key={application._id} application={application} onPress={onSelect} />
      ))}
    </ClusteredMapView>
  );
};

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F8F8' },
  loadingText: { marginTop: 12, color: '#666' },
});

export default RequestMap;