import React from 'react';
import MovieList from './components/MovieList';

const App = () => {
    return (
        <div className="App">
            <header className="App-header">
                <h1>Welcome to CineDB</h1>
            </header>
            <main>
                <MovieList />
            </main>
        </div>
    );
};

export default App;
