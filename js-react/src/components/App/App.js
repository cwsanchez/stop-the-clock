import logo from '../../logo.svg';
import './App.css';
import Clock from '../Clock/Clock.js';
import React from 'react';

function App() {

  const [time, setTime] = React.useState(0);
  const [running, setRunning] = React.useState(false);

  return (
    <div className="App">
      <Clock 
        time={time}
        setTime={setTime}
        running={running}
        setRunning={setRunning}
      />
    </div>
  );
}

export default App;
