import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';

const StarRating = ({ maxStars = 5, rating, setRating }) => {
  const renderStars = () => {
    let stars = [];
    for (let i = 1; i <= maxStars; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <Text style={i <= rating ? styles.starSelected : styles.star}>★</Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return <View style={styles.starContainer}>{renderStars()}</View>;
};

const ReviewComponent = () => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const handleSubmit = () => {
    // Логика отправки отзыва на сервер или Firebase
    console.log(`Оценка: ${rating}, Отзыв: ${reviewText}`);
  };

  return (
    <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.name}>Алексей</Text>
          <Text style={styles.status}>В сети 29 июн в 09:24</Text>
        </View>
        <View style={styles.containerPadding}>

            <Text style={styles.title}>Оставьте ваш отзыв</Text>
            
            <StarRating rating={rating} setRating={setRating} />
            
            <TextInput
                style={styles.input}
                placeholder="Напишите ваш отзыв здесь"
                placeholderTextColor="gray"
                multiline
                numberOfLines={4}
                onChangeText={text => setReviewText(text)}
                value={reviewText}
            />
            <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Откликнуться</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerPadding:{
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 30,
  },
  starContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  star: {
    fontSize: 40,
    color: '#b4b4b4',
    marginHorizontal: 5,
  },
  starSelected: {
    fontSize: 40,
    color: 'gold',
    marginHorizontal: 5,
  },
  input: {
    height: 150,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    backgroundColor: 'white',
    color: 'black',
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 20,
    backgroundColor: '#1E90FF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  button: {
    backgroundColor: '#B23439',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,

    position: 'fixed',
    top: 250,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  status: {
    color: '#666',
  },
});

export default ReviewComponent;
