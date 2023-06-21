import logo from '../../logo.svg';
import './App.css';
import Clock from '../Clock/Clock.js';
import Username from '../Username/Username.js';
import React from 'react';

function App() {

  const [time, setTime] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [nameErr, setNameErr] = React.useState('');

  const randomList = [ 'buddy', 'pal', 'bro' ];

  return (
    <div className="App">
      <Username
        existingUsers={randomList}
        username={username}
        setUsername={setUsername}
        nameErr={nameErr}
        setNameErr={setNameErr}
      />
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
