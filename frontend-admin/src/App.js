import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import MovieList from './components/MovieList';
import MovieForm from './components/MovieForm';

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route exact path="/admin" component={MovieList} />
          <Route path="/admin/add" component={MovieForm} />
          <Route path="/admin/edit/:id" component={MovieForm} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;