import logo from '../../logo.svg';
import './App.css';
import Clock from '../Clock/Clock.js';
import React from 'react';

function App() {

  const [time, setTime] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [username, setUsername] = React.useState('');

  const randomList = [ 'buddy', 'pal', 'bro' ];

  const isStringValid = (str) => {
    const pattern = /^[a-zA-Z_\-]+$/;

    return pattern.test(str)
  }

  const submitUsername = (username) => {
   if ( !(isStringValid(username)) ) {
    return "Only A-Z, a-z, -, and _ characters are permitted!"
   }
   else if ( !(randomList.includes(username)) ) { 
    return "Username already exists!"
   }
   else {
    setUsername(username); 
   }
  }

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
