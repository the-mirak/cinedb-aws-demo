# Frontend Integration with API Gateway

This document demonstrates how to integrate the frontend with the API Gateway endpoints. The code examples include detailed comments for educational purposes.

## Base API URL Configuration

```javascript
// Configuration for API Gateway
const API_CONFIG = {
  // Base URL for API Gateway endpoints - replace with your actual API Gateway URL
  // For development, you can use the direct API Gateway URL
  baseUrl: 'https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod',
  
  // For production, you would use the CloudFront distribution URL
  // baseUrl: 'https://d123example.cloudfront.net/api',
  
  // Default headers to include with all requests
  defaultHeaders: {
    'Content-Type': 'application/json'
  }
};
```

## Fetching Movies (GET /movies)

```javascript
/**
 * Fetch all movies from the API
 * @returns {Promise} Promise that resolves to an array of movie objects
 */
async function fetchAllMovies() {
  try {
    // Simple GET request to the /movies endpoint
    const response = await fetch(`${API_CONFIG.baseUrl}/movies`, {
      method: 'GET',
      headers: API_CONFIG.defaultHeaders
    });
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    // Parse and return the JSON response
    const movies = await response.json();
    return movies;
  } catch (error) {
    console.error('Error fetching movies:', error);
    throw error;
  }
}

// Example usage:
// fetchAllMovies().then(movies => {
//   movies.forEach(movie => {
//     // Add movie to the UI
//     renderMovieCard(movie);
//   });
// }).catch(error => {
//   showErrorMessage('Failed to load movies');
// });
```

## Fetching a Single Movie (GET /movies/{id})

```javascript
/**
 * Fetch a specific movie by ID
 * @param {string} movieId - The ID of the movie to fetch
 * @returns {Promise} Promise that resolves to a movie object
 */
async function fetchMovieById(movieId) {
  try {
    // GET request with movie ID as path parameter
    const response = await fetch(`${API_CONFIG.baseUrl}/movies/${movieId}`, {
      method: 'GET',
      headers: API_CONFIG.defaultHeaders
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const movie = await response.json();
    return movie;
  } catch (error) {
    console.error(`Error fetching movie ${movieId}:`, error);
    throw error;
  }
}

// Example usage:
// const movieId = 'abc123';
// fetchMovieById(movieId).then(movie => {
//   // Display movie details
//   updateMovieDetailView(movie);
// }).catch(error => {
//   showErrorMessage(`Failed to load movie details for ID: ${movieId}`);
// });
```

## Creating a New Movie (POST /movies)

```javascript
/**
 * Create a new movie with multipart form data (for file uploads)
 * @param {Object} movieData - Object containing movie properties
 * @param {File} posterFile - The poster image file
 * @returns {Promise} Promise that resolves to the created movie
 */
async function createMovie(movieData, posterFile) {
  try {
    // Create a FormData object for multipart/form-data submission
    // This is necessary for file uploads (poster image)
    const formData = new FormData();
    
    // Add all movie data fields to the form
    for (const [key, value] of Object.entries(movieData)) {
      formData.append(key, value);
    }
    
    // Add the poster file if provided
    if (posterFile) {
      formData.append('poster', posterFile);
    }
    
    // POST request with FormData - browser will automatically set the correct
    // Content-Type with boundary for multipart/form-data
    const response = await fetch(`${API_CONFIG.baseUrl}/movies`, {
      method: 'POST',
      // Do NOT set Content-Type header manually here - browser will set it
      // with the correct boundary value
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const newMovie = await response.json();
    return newMovie;
  } catch (error) {
    console.error('Error creating movie:', error);
    throw error;
  }
}

// Example usage:
// document.getElementById('addMovieForm').addEventListener('submit', async function(event) {
//   event.preventDefault();
//   
//   const title = document.getElementById('title').value;
//   const synopsis = document.getElementById('synopsis').value;
//   const rating = document.getElementById('rating').value;
//   const director = document.getElementById('director').value;
//   const year = document.getElementById('year').value;
//   const cast = document.getElementById('cast').value;
//   const posterFile = document.getElementById('poster').files[0];
//   
//   try {
//     const newMovie = await createMovie({
//       title,
//       synopsis,
//       rating,
//       director,
//       year,
//       cast
//     }, posterFile);
//     
//     showSuccessMessage('Movie added successfully!');
//     redirectToMovieDetail(newMovie.id);
//   } catch (error) {
//     showErrorMessage('Failed to add movie');
//   }
// });
```

## Updating a Movie (PUT /movies/{id})

```javascript
/**
 * Update an existing movie with multipart form data
 * @param {string} movieId - The ID of the movie to update
 * @param {Object} movieData - Object containing movie properties to update
 * @param {File} posterFile - The new poster image file (optional)
 * @returns {Promise} Promise that resolves to the updated movie
 */
async function updateMovie(movieId, movieData, posterFile) {
  try {
    // Create a FormData object for multipart/form-data submission
    const formData = new FormData();
    
    // Add all movie data fields to the form
    for (const [key, value] of Object.entries(movieData)) {
      formData.append(key, value);
    }
    
    // Add the poster file if provided
    if (posterFile) {
      formData.append('poster', posterFile);
    }
    
    // PUT request with FormData
    const response = await fetch(`${API_CONFIG.baseUrl}/movies/${movieId}`, {
      method: 'PUT',
      // Do NOT set Content-Type header manually - browser will set it with boundary
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const updatedMovie = await response.json();
    return updatedMovie;
  } catch (error) {
    console.error(`Error updating movie ${movieId}:`, error);
    throw error;
  }
}

// Example usage:
// document.getElementById('editMovieForm').addEventListener('submit', async function(event) {
//   event.preventDefault();
//   
//   const movieId = document.getElementById('movieId').value;
//   const title = document.getElementById('title').value;
//   const synopsis = document.getElementById('synopsis').value;
//   const rating = document.getElementById('rating').value;
//   const director = document.getElementById('director').value;
//   const year = document.getElementById('year').value;
//   const cast = document.getElementById('cast').value;
//   
//   // Only get the file if a new one was selected
//   const posterInput = document.getElementById('poster');
//   const posterFile = posterInput.files.length > 0 ? posterInput.files[0] : null;
//   
//   try {
//     const updatedMovie = await updateMovie(movieId, {
//       title,
//       synopsis,
//       rating,
//       director,
//       year,
//       cast
//     }, posterFile);
//     
//     showSuccessMessage('Movie updated successfully!');
//     refreshMovieDetails(updatedMovie);
//   } catch (error) {
//     showErrorMessage('Failed to update movie');
//   }
// });
```

## Deleting a Movie (DELETE /movies/{id})

```javascript
/**
 * Delete a movie by ID
 * @param {string} movieId - The ID of the movie to delete
 * @returns {Promise} Promise that resolves when the movie is deleted
 */
async function deleteMovie(movieId) {
  try {
    // Simple DELETE request
    const response = await fetch(`${API_CONFIG.baseUrl}/movies/${movieId}`, {
      method: 'DELETE',
      headers: API_CONFIG.defaultHeaders
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json(); // Usually contains a success message
  } catch (error) {
    console.error(`Error deleting movie ${movieId}:`, error);
    throw error;
  }
}

// Example usage:
// document.getElementById('deleteMovieButton').addEventListener('click', async function() {
//   if (confirm('Are you sure you want to delete this movie?')) {
//     const movieId = this.dataset.movieId;
//     
//     try {
//       await deleteMovie(movieId);
//       showSuccessMessage('Movie deleted successfully!');
//       redirectToMoviesList();
//     } catch (error) {
//       showErrorMessage('Failed to delete movie');
//     }
//   }
// });
```

## Common Mistakes and Troubleshooting

### 1. Handling CORS Issues

```javascript
// INCORRECT: Trying to use credentials with wildcard CORS
fetch(`${API_CONFIG.baseUrl}/movies`, {
  method: 'GET',
  credentials: 'include', // This won't work with Access-Control-Allow-Origin: *
  headers: API_CONFIG.defaultHeaders
});

// CORRECT: Either don't use credentials with wildcard CORS
fetch(`${API_CONFIG.baseUrl}/movies`, {
  method: 'GET',
  // No credentials
  headers: API_CONFIG.defaultHeaders
});

// Or if you need credentials, the API must allow specific origin(s)
// and you must update the CORS configuration in API Gateway
```

### 2. Multipart Form Data Content-Type

```javascript
// INCORRECT: Setting Content-Type manually for multipart/form-data
const formData = new FormData();
formData.append('title', 'New Movie');
// ...

fetch(`${API_CONFIG.baseUrl}/movies`, {
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data' // DON'T do this - boundary will be missing
  },
  body: formData
});

// CORRECT: Let the browser set the Content-Type header
fetch(`${API_CONFIG.baseUrl}/movies`, {
  method: 'POST',
  // No Content-Type header
  body: formData
});
```

### 3. Handling API Errors

```javascript
// INCORRECT: Not checking response status
fetch(`${API_CONFIG.baseUrl}/movies/invalid-id`)
  .then(response => response.json())  // What if response.ok is false?
  .then(data => console.log(data));

// CORRECT: Check response.ok before proceeding
fetch(`${API_CONFIG.baseUrl}/movies/invalid-id`)
  .then(response => {
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  })
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

## Testing the API with Frontend Code

For testing the API from the frontend during development, you can use this simple function:

```javascript
/**
 * Test all API endpoints from the frontend
 */
async function testApiEndpoints() {
  console.log('Testing API endpoints...');
  
  // Test GET /movies
  try {
    const movies = await fetchAllMovies();
    console.log('GET /movies success:', movies);
    
    if (movies.length > 0) {
      // Test GET /movies/{id} with the first movie
      const movieId = movies[0].id;
      try {
        const movie = await fetchMovieById(movieId);
        console.log(`GET /movies/${movieId} success:`, movie);
      } catch (error) {
        console.error(`GET /movies/${movieId} failed`);
      }
      
      // Don't test DELETE in automatic tests
      // console.log(`Not testing DELETE /movies/${movieId} to avoid data loss`);
    }
  } catch (error) {
    console.error('GET /movies failed');
  }
  
  console.log('API endpoint tests completed');
}

// Uncomment to run tests
// testApiEndpoints();
``` 