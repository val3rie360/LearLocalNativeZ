import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

// Platform-specific map component
let MapView: any;
let Marker: any;

if (Platform.OS === 'web') {
  // Web fallback - show a placeholder
  MapView = ({ children, style, initialRegion, region, ...props }: any) => (
    <View style={[styles.webMapPlaceholder, style]}>
      <View style={styles.webMapContent}>
        <Ionicons name="map" size={48} color="#4B1EB4" />
        <Text style={styles.webMapText}>
          Map View (Mobile Only)
        </Text>
        <Text style={styles.webMapSubtext}>
          Please use the mobile app to view maps
        </Text>
      </View>
      {children}
    </View>
  );
  
  Marker = ({ children, ...props }: any) => (
    <View {...props}>{children}</View>
  );
} else {
  // Native platforms - use actual react-native-maps
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
}

const styles = StyleSheet.create({
  webMapPlaceholder: {
    backgroundColor: '#E5E0FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  webMapContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  webMapText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B1EB4',
    textAlign: 'center',
  },
  webMapSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default MapView;
export { Marker };

