// API Endpoint - Uses environment or mock API for local testing
const API_ENDPOINT = isLocalDevelopment() 
    ? 'http://localhost:3000' 
    : 'https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod';

// Function to check if we're running locally
function isLocalDevelopment() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
}

// Function to add authentication headers when needed
function getHeaders() {
    const headers = {};
    
    // Only add Authorization header if not in demo mode
    // Demo mode bypasses API Gateway authorization
    if (typeof isDemoMode === 'function' && isDemoMode()) {
        // In demo mode, no auth header needed
        return headers;
    }
    
    // Add Cognito JWT token for authenticated requests
    // API Gateway Cognito authorizer expects the token directly (no "Bearer" prefix)
    const token = sessionStorage.getItem('authToken');
    if (token && token !== 'demo-mode-token') {
        headers['Authorization'] = token;
    }
    
    return headers;
}

// Function to fetch all movies
async function fetchMovies() {
    try {
        const response = await fetch(`${API_ENDPOINT}/movies`, {
            headers: getHeaders()
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        // Return the movies array from the response
        return data.movies || data;
    } catch (error) {
        console.error('Error fetching movies:', error);
        throw error;
    }
}

// Function to fetch a single movie
async function getMovie(id) {
    try {
        const response = await fetch(`${API_ENDPOINT}/movies/${id}`, {
            headers: getHeaders()
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error('Error fetching movie:', error);
        throw error;
    }
}

// Function to add a movie (for admin use)
async function addMovie(movieData, posterFile) {
    try {
        // Create a FormData object for multipart/form-data submission
        const formData = new FormData();
        
        // Add all movie data fields to the form
        for (const [key, value] of Object.entries(movieData)) {
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        }
        
        // Add the poster file if provided
        if (posterFile) {
            formData.append('poster', posterFile);
        }
        
        // Headers for authentication (don't set Content-Type - browser will set it)
        const headers = getHeaders();
        
        const response = await fetch(`${API_ENDPOINT}/movies`, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error('Error adding movie:', error);
        throw error;
    }
}

// Function to update a movie (for admin use)
async function updateMovie(movieData, posterFile) {
    try {
        // Create a FormData object for multipart/form-data submission
        const formData = new FormData();
        
        // Add all movie data fields to the form
        for (const [key, value] of Object.entries(movieData)) {
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        }
        
        // Add the poster file if provided
        if (posterFile) {
            formData.append('poster', posterFile);
        }
        
        // Headers for authentication (don't set Content-Type - browser will set it)
        const headers = getHeaders();
        
        const response = await fetch(`${API_ENDPOINT}/movies/${movieData.id}`, {
            method: 'PUT',
            headers: headers,
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error('Error updating movie:', error);
        throw error;
    }
}

// Function to delete a movie (for admin use)
async function deleteMovie(id) {
    try {
        const response = await fetch(`${API_ENDPOINT}/movies/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return true;
    } catch (error) {
        console.error('Error deleting movie:', error);
        throw error;
    }
} 