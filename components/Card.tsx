import { View, Text, StyleSheet, Image, TouchableOpacity, ViewStyle } from 'react-native';

interface CardProps {
  title: string;
  description?: string;
  imageUrl?: string;
  onPress?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export default function Card({
  title,
  description,
  imageUrl,
  onPress,
  style,
  children,
}: CardProps) {
  const CardContainer = onPress ? TouchableOpacity : View;
  
  return (
    <CardContainer 
      style={[styles.card, style]} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {imageUrl && (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
        
        {children && (
          <View style={styles.childrenContainer}>
            {children}
          </View>
        )}
      </View>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  childrenContainer: {
    marginTop: 12,
  },
});