import React from 'react';
import { View, Image, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native';
import { theme } from '../theme';
import { format } from 'date-fns';

interface ImageItem {
  id: string;
  url: string;
  timestamp: string;
}

interface DeviceImageGalleryProps {
  images: ImageItem[];
}

const DeviceImageGallery: React.FC<DeviceImageGalleryProps> = ({ images }) => {
  const renderImageItem = ({ item }: { item: ImageItem }) => (
    <TouchableOpacity style={styles.imageContainer}>
      <Image source={{ uri: item.url }} style={styles.image} />
      <View style={styles.timestampContainer}>
        <Text style={styles.timestamp}>
          {format(new Date(item.timestamp), 'MMM d, h:mm a')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={images}
      renderItem={renderImageItem}
      keyExtractor={(item) => item.id}
      numColumns={1}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.white,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  timestampContainer: {
    padding: 12,
    backgroundColor: theme.colors.white,
  },
  timestamp: {
    fontFamily: 'Roboto',
    fontSize: 14,
    color: theme.colors.textLight,
  },
});

export default DeviceImageGallery;