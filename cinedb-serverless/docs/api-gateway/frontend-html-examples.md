# Frontend HTML Integration Examples

This document provides HTML examples that integrate with the API Gateway endpoints. The examples are meant for educational purposes and include detailed comments explaining each implementation.

## Movie List Page Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CineDB - Movie List</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>CineDB</h1>
        <nav>
            <ul>
                <li><a href="index.html" class="active">Movies</a></li>
                <li><a href="admin.html">Admin</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="container">
            <h2>Movie Catalog</h2>
            
            <!-- Loading indicator -->
            <div id="loading" class="loading-spinner">Loading...</div>
            
            <!-- Error message container -->
            <div id="error-message" class="error-message" style="display: none;"></div>
            
            <!-- Movie grid will be populated by JavaScript -->
            <div id="movie-grid" class="movie-grid"></div>
        </section>
    </main>

    <footer>
        <p>&copy; 2025 CineDB</p>
    </footer>

    <!-- Movie card template (will be cloned by JavaScript) -->
    <template id="movie-card-template">
        <div class="movie-card">
            <img class="movie-poster" src="" alt="Movie Poster">
            <div class="movie-info">
                <h3 class="movie-title"></h3>
                <div class="movie-rating"></div>
                <p class="movie-director"></p>
                <a href="#" class="view-details-btn">View Details</a>
            </div>
        </div>
    </template>

    <script>
        // API configuration
        const API_CONFIG = {
            baseUrl: 'https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod'
        };
        
        // Elements
        const movieGrid = document.getElementById('movie-grid');
        const loadingIndicator = document.getElementById('loading');
        const errorMessage = document.getElementById('error-message');
        const movieCardTemplate = document.getElementById('movie-card-template');
        
        // Load movies when page loads
        document.addEventListener('DOMContentLoaded', fetchMovies);
        
        // Fetch all movies from API
        async function fetchMovies() {
            try {
                // Show loading indicator
                loadingIndicator.style.display = 'block';
                errorMessage.style.display = 'none';
                
                // Fetch movies from API Gateway endpoint
                const response = await fetch(`${API_CONFIG.baseUrl}/movies`);
                
                // Check if request was successful
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                // Parse response as JSON
                const movies = await response.json();
                
                // Render movies
                renderMovies(movies);
                
            } catch (error) {
                console.error('Error fetching movies:', error);
                errorMessage.textContent = 'Failed to load movies. Please try again later.';
                errorMessage.style.display = 'block';
            } finally {
                // Hide loading indicator
                loadingIndicator.style.display = 'none';
            }
        }
        
        // Render movies to the page
        function renderMovies(movies) {
            // Clear existing content
            movieGrid.innerHTML = '';
            
            if (movies.length === 0) {
                movieGrid.innerHTML = '<p class="no-movies">No movies found.</p>';
                return;
            }
            
            // Create a document fragment to improve performance
            const fragment = document.createDocumentFragment();
            
            // Loop through movies and create cards
            movies.forEach(movie => {
                // Clone the template
                const movieCard = document.importNode(movieCardTemplate.content, true);
                
                // Populate with movie data
                const poster = movieCard.querySelector('.movie-poster');
                poster.src = movie.poster || 'images/no-poster.png';
                poster.alt = `${movie.title} Poster`;
                
                movieCard.querySelector('.movie-title').textContent = movie.title;
                movieCard.querySelector('.movie-rating').textContent = `Rating: ${movie.rating}/10`;
                
                if (movie.director) {
                    movieCard.querySelector('.movie-director').textContent = `Director: ${movie.director}`;
                }
                
                // Set up "View Details" link
                const detailsLink = movieCard.querySelector('.view-details-btn');
                detailsLink.href = `movie-details.html?id=${movie.id}`;
                
                // Add to fragment
                fragment.appendChild(movieCard);
            });
            
            // Add all cards to the grid at once (more efficient)
            movieGrid.appendChild(fragment);
        }
    </script>
</body>
</html>
```

## Add Movie Form Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CineDB - Add Movie</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>CineDB Admin</h1>
        <nav>
            <ul>
                <li><a href="index.html">Movies</a></li>
                <li><a href="admin.html" class="active">Admin</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="container">
            <h2>Add New Movie</h2>
            
            <!-- Status message containers -->
            <div id="success-message" class="success-message" style="display: none;"></div>
            <div id="error-message" class="error-message" style="display: none;"></div>
            
            <!-- 
                IMPORTANT: Don't set enctype in the form tag
                The fetch API will automatically set the correct content type with boundary
                when using FormData
             -->
            <form id="add-movie-form" class="movie-form">
                <div class="form-group">
                    <label for="title">Title:</label>
                    <input type="text" id="title" name="title" required>
                </div>
                
                <div class="form-group">
                    <label for="director">Director:</label>
                    <input type="text" id="director" name="director" required>
                </div>
                
                <div class="form-group">
                    <label for="year">Year:</label>
                    <input type="number" id="year" name="year" min="1900" max="2099" required>
                </div>
                
                <div class="form-group">
                    <label for="rating">Rating:</label>
                    <input type="number" id="rating" name="rating" min="0" max="10" step="0.1" required>
                </div>
                
                <div class="form-group">
                    <label for="cast">Cast (comma separated):</label>
                    <input type="text" id="cast" name="cast" required>
                </div>
                
                <div class="form-group">
                    <label for="synopsis">Synopsis:</label>
                    <textarea id="synopsis" name="synopsis" rows="4" required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="poster">Poster Image:</label>
                    <input type="file" id="poster" name="poster" accept="image/*">
                    <p class="form-help">Max file size: 5MB. Recommended size: 300x450 pixels.</p>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn primary">Add Movie</button>
                    <a href="admin.html" class="btn secondary">Cancel</a>
                </div>
            </form>
        </section>
    </main>

    <footer>
        <p>&copy; 2025 CineDB</p>
    </footer>

    <script>
        // API configuration
        const API_CONFIG = {
            baseUrl: 'https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod'
        };
        
        // Elements
        const form = document.getElementById('add-movie-form');
        const successMessage = document.getElementById('success-message');
        const errorMessage = document.getElementById('error-message');
        
        // Add event listener to form submission
        form.addEventListener('submit', handleSubmit);
        
        async function handleSubmit(event) {
            // Prevent default form submission
            event.preventDefault();
            
            try {
                // Hide previous messages
                successMessage.style.display = 'none';
                errorMessage.style.display = 'none';
                
                // Create FormData object from the form
                const formData = new FormData(form);
                
                // Show loading state
                const submitButton = form.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = 'Adding...';
                
                // Send POST request to API Gateway
                const response = await fetch(`${API_CONFIG.baseUrl}/movies`, {
                    method: 'POST',
                    // IMPORTANT: Do NOT set Content-Type header manually
                    // The browser will set it correctly with the boundary parameter
                    body: formData
                });
                
                // Check if request was successful
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `API error: ${response.status}`);
                }
                
                // Parse response
                const result = await response.json();
                
                // Show success message
                successMessage.textContent = 'Movie added successfully!';
                successMessage.style.display = 'block';
                
                // Reset form
                form.reset();
                
                // Optionally redirect to the movie detail page
                // window.location.href = `movie-details.html?id=${result.movie.id}`;
                
            } catch (error) {
                console.error('Error adding movie:', error);
                errorMessage.textContent = error.message || 'Failed to add movie. Please try again.';
                errorMessage.style.display = 'block';
            } finally {
                // Reset button state
                const submitButton = form.querySelector('button[type="submit"]');
                submitButton.disabled = false;
                submitButton.textContent = 'Add Movie';
            }
        }
    </script>
</body>
</html>
```

## Edit Movie Form Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CineDB - Edit Movie</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>CineDB Admin</h1>
        <nav>
            <ul>
                <li><a href="index.html">Movies</a></li>
                <li><a href="admin.html" class="active">Admin</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="container">
            <h2>Edit Movie</h2>
            
            <!-- Loading, success, and error messages -->
            <div id="loading" class="loading-spinner">Loading...</div>
            <div id="success-message" class="success-message" style="display: none;"></div>
            <div id="error-message" class="error-message" style="display: none;"></div>
            
            <!-- The form will be hidden until data is loaded -->
            <form id="edit-movie-form" class="movie-form" style="display: none;">
                <!-- Hidden input for movie ID -->
                <input type="hidden" id="movie-id" name="id">
                
                <div class="form-group">
                    <label for="title">Title:</label>
                    <input type="text" id="title" name="title" required>
                </div>
                
                <div class="form-group">
                    <label for="director">Director:</label>
                    <input type="text" id="director" name="director" required>
                </div>
                
                <div class="form-group">
                    <label for="year">Year:</label>
                    <input type="number" id="year" name="year" min="1900" max="2099" required>
                </div>
                
                <div class="form-group">
                    <label for="rating">Rating:</label>
                    <input type="number" id="rating" name="rating" min="0" max="10" step="0.1" required>
                </div>
                
                <div class="form-group">
                    <label for="cast">Cast (comma separated):</label>
                    <input type="text" id="cast" name="cast" required>
                </div>
                
                <div class="form-group">
                    <label for="synopsis">Synopsis:</label>
                    <textarea id="synopsis" name="synopsis" rows="4" required></textarea>
                </div>
                
                <div class="form-group">
                    <label>Current Poster:</label>
                    <div class="current-poster-container">
                        <img id="current-poster" src="" alt="Current Movie Poster">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="poster">Upload New Poster (optional):</label>
                    <input type="file" id="poster" name="poster" accept="image/*">
                    <p class="form-help">Leave empty to keep the current poster.</p>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn primary">Update Movie</button>
                    <a href="admin.html" class="btn secondary">Cancel</a>
                </div>
            </form>
        </section>
    </main>

    <footer>
        <p>&copy; 2025 CineDB</p>
    </footer>

    <script>
        // API configuration
        const API_CONFIG = {
            baseUrl: 'https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod'
        };
        
        // Elements
        const form = document.getElementById('edit-movie-form');
        const loadingIndicator = document.getElementById('loading');
        const successMessage = document.getElementById('success-message');
        const errorMessage = document.getElementById('error-message');
        const currentPosterImg = document.getElementById('current-poster');
        
        // Get movie ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');
        
        // If no movie ID is provided, redirect to admin page
        if (!movieId) {
            window.location.href = 'admin.html';
        }
        
        // Load movie data when page loads
        document.addEventListener('DOMContentLoaded', fetchMovieData);
        
        // Add event listener to form submission
        form.addEventListener('submit', handleSubmit);
        
        // Fetch movie data from API
        async function fetchMovieData() {
            try {
                // Show loading indicator
                loadingIndicator.style.display = 'block';
                errorMessage.style.display = 'none';
                form.style.display = 'none';
                
                // Fetch movie from API Gateway endpoint
                const response = await fetch(`${API_CONFIG.baseUrl}/movies/${movieId}`);
                
                // Check if request was successful
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                // Parse response as JSON
                const movie = await response.json();
                
                // Populate form with movie data
                populateForm(movie);
                
                // Hide loading indicator and show form
                loadingIndicator.style.display = 'none';
                form.style.display = 'block';
                
            } catch (error) {
                console.error('Error fetching movie data:', error);
                errorMessage.textContent = 'Failed to load movie data. Please try again later.';
                errorMessage.style.display = 'block';
                loadingIndicator.style.display = 'none';
            }
        }
        
        // Populate form with movie data
        function populateForm(movie) {
            document.getElementById('movie-id').value = movie.id;
            document.getElementById('title').value = movie.title || '';
            document.getElementById('director').value = movie.director || '';
            document.getElementById('year').value = movie.year || '';
            document.getElementById('rating').value = movie.rating || '';
            document.getElementById('synopsis').value = movie.synopsis || '';
            
            // Handle cast array - convert to comma-separated string
            if (Array.isArray(movie.cast)) {
                document.getElementById('cast').value = movie.cast.join(', ');
            } else {
                document.getElementById('cast').value = movie.cast || '';
            }
            
            // Set poster image
            if (movie.poster) {
                currentPosterImg.src = movie.poster;
                currentPosterImg.alt = `${movie.title} Poster`;
            } else {
                currentPosterImg.src = 'images/no-poster.png';
                currentPosterImg.alt = 'No Poster Available';
            }
        }
        
        // Handle form submission
        async function handleSubmit(event) {
            // Prevent default form submission
            event.preventDefault();
            
            try {
                // Hide previous messages
                successMessage.style.display = 'none';
                errorMessage.style.display = 'none';
                
                // Create FormData object from the form
                const formData = new FormData(form);
                
                // Show loading state
                const submitButton = form.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = 'Updating...';
                
                // Send PUT request to API Gateway
                const response = await fetch(`${API_CONFIG.baseUrl}/movies/${movieId}`, {
                    method: 'PUT',
                    // IMPORTANT: Do NOT set Content-Type header manually
                    body: formData
                });
                
                // Check if request was successful
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `API error: ${response.status}`);
                }
                
                // Parse response
                const result = await response.json();
                
                // Show success message
                successMessage.textContent = 'Movie updated successfully!';
                successMessage.style.display = 'block';
                
                // Update the UI with the new data
                populateForm(result.movie);
                
                // Scroll to top of page to show success message
                window.scrollTo(0, 0);
                
            } catch (error) {
                console.error('Error updating movie:', error);
                errorMessage.textContent = error.message || 'Failed to update movie. Please try again.';
                errorMessage.style.display = 'block';
                window.scrollTo(0, 0);
            } finally {
                // Reset button state
                const submitButton = form.querySelector('button[type="submit"]');
                submitButton.disabled = false;
                submitButton.textContent = 'Update Movie';
            }
        }
    </script>
</body>
</html>
```

## Movie Details Page Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CineDB - Movie Details</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>CineDB</h1>
        <nav>
            <ul>
                <li><a href="index.html" class="active">Movies</a></li>
                <li><a href="admin.html">Admin</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="container">
            <div id="back-link" class="back-link">
                <a href="index.html">&larr; Back to Movies</a>
            </div>
            
            <!-- Loading indicator -->
            <div id="loading" class="loading-spinner">Loading...</div>
            
            <!-- Error message container -->
            <div id="error-message" class="error-message" style="display: none;"></div>
            
            <!-- Movie details container -->
            <div id="movie-details" class="movie-details" style="display: none;">
                <!-- Content will be populated by JavaScript -->
            </div>
        </section>
    </main>

    <footer>
        <p>&copy; 2025 CineDB</p>
    </footer>

    <script>
        // API configuration
        const API_CONFIG = {
            baseUrl: 'https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod'
        };
        
        // Elements
        const movieDetails = document.getElementById('movie-details');
        const loadingIndicator = document.getElementById('loading');
        const errorMessage = document.getElementById('error-message');
        
        // Get movie ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');
        
        // If no movie ID is provided, redirect to home page
        if (!movieId) {
            window.location.href = 'index.html';
        }
        
        // Load movie data when page loads
        document.addEventListener('DOMContentLoaded', fetchMovieDetails);
        
        // Fetch movie details from API
        async function fetchMovieDetails() {
            try {
                // Show loading indicator
                loadingIndicator.style.display = 'block';
                errorMessage.style.display = 'none';
                movieDetails.style.display = 'none';
                
                // Fetch movie from API Gateway endpoint
                const response = await fetch(`${API_CONFIG.baseUrl}/movies/${movieId}`);
                
                // Check if request was successful
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                // Parse response as JSON
                const movie = await response.json();
                
                // Update page title
                document.title = `CineDB - ${movie.title}`;
                
                // Render movie details
                renderMovieDetails(movie);
                
                // Hide loading indicator and show details
                loadingIndicator.style.display = 'none';
                movieDetails.style.display = 'block';
                
            } catch (error) {
                console.error('Error fetching movie details:', error);
                errorMessage.textContent = 'Failed to load movie details. Please try again later.';
                errorMessage.style.display = 'block';
                loadingIndicator.style.display = 'none';
            }
        }
        
        // Render movie details to the page
        function renderMovieDetails(movie) {
            // Create movie details HTML
            const detailsHTML = `
                <div class="movie-detail-content">
                    <div class="movie-poster-container">
                        <img class="movie-detail-poster" src="${movie.poster || 'images/no-poster.png'}" alt="${movie.title} Poster">
                    </div>
                    <div class="movie-info-container">
                        <h2 class="movie-detail-title">${movie.title}</h2>
                        <div class="movie-meta">
                            ${movie.year ? `<span class="movie-year">${movie.year}</span>` : ''}
                            <span class="movie-rating">Rating: ${movie.rating}/10</span>
                        </div>
                        ${movie.director ? `<p class="movie-director"><strong>Director:</strong> ${movie.director}</p>` : ''}
                        ${movie.cast && movie.cast.length ? `
                            <div class="movie-cast">
                                <strong>Cast:</strong>
                                <ul>
                                    ${Array.isArray(movie.cast) 
                                        ? movie.cast.map(actor => `<li>${actor}</li>`).join('') 
                                        : `<li>${movie.cast}</li>`
                                    }
                                </ul>
                            </div>
                        ` : ''}
                        <div class="movie-synopsis">
                            <h3>Synopsis</h3>
                            <p>${movie.synopsis}</p>
                        </div>
                        <div class="movie-actions">
                            <a href="edit-movie.html?id=${movie.id}" class="btn secondary">Edit Movie</a>
                        </div>
                    </div>
                </div>
            `;
            
            // Set the HTML to the container
            movieDetails.innerHTML = detailsHTML;
        }
    </script>
</body>
</html>
```

## Common HTML/Frontend Issues and Solutions

### 1. Form Submission with File Uploads

A common mistake is to set the enctype attribute on the form. When using the Fetch API with FormData, you should **not** set the enctype attribute:

```html
<!-- INCORRECT - Setting enctype -->
<form id="movie-form" enctype="multipart/form-data">
    <!-- form fields -->
</form>

<!-- CORRECT - Let the Fetch API handle it -->
<form id="movie-form">
    <!-- form fields -->
</form>
```

### 2. Handling Arrays in Form Submissions

For fields like "cast" that should be arrays in the backend, provide clear instructions:

```html
<div class="form-group">
    <label for="cast">Cast (comma separated):</label>
    <input type="text" id="cast" name="cast" placeholder="Actor 1, Actor 2, Actor 3">
    <!-- Clear instruction on format -->
    <span class="field-hint">Enter actor names separated by commas</span>
</div>
```

### 3. Showing Loading States

Always provide feedback during API operations:

```html
<button type="submit" id="submit-btn" class="btn primary">
    <span class="btn-text">Add Movie</span>
    <span class="btn-loading" style="display: none">
        <img src="images/spinner.gif" alt="Loading" class="spinner"> Adding...
    </span>
</button>

<script>
    // Show loading state
    function showLoading() {
        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.querySelector('.btn-text').style.display = 'none';
        btn.querySelector('.btn-loading').style.display = 'inline-block';
    }
    
    // Hide loading state
    function hideLoading() {
        const btn = document.getElementById('submit-btn');
        btn.disabled = false;
        btn.querySelector('.btn-text').style.display = 'inline-block';
        btn.querySelector('.btn-loading').style.display = 'none';
    }
</script>
```

### 4. Error Handling and Display

Provide clear error messages to users:

```html
<div id="error-container" class="error-container" style="display: none;">
    <div class="error-icon">⚠️</div>
    <div id="error-message" class="error-message"></div>
    <button id="dismiss-error" class="dismiss-btn">×</button>
</div>

<script>
    // Display error message
    function showError(message) {
        const container = document.getElementById('error-container');
        const errorMsg = document.getElementById('error-message');
        
        errorMsg.textContent = message;
        container.style.display = 'flex';
        
        // Scroll to error
        container.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Dismiss error
    document.getElementById('dismiss-error').addEventListener('click', function() {
        document.getElementById('error-container').style.display = 'none';
    });
</script>
``` 