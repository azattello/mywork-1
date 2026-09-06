import React from 'react';
import { Marker } from 'react-native-maps';
import { getApplicationCoordinate } from './map.service';

const RequestMapMarker = ({ application, onPress }) => {
  const coordinate = getApplicationCoordinate(application);
  if (!coordinate) return null;

  return (
    <Marker
      coordinate={coordinate}
      title={application.title}
      description={`${application.summ || 0} ₸${application.address ? ` • ${application.address}` : ''}`}
      onPress={() => onPress(application)}
      tracksViewChanges={false}
    />
  );
};

export default RequestMapMarker;