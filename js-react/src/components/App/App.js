import logo from '../../logo.svg';
import './App.css';
import React from 'react';
import StopWatch from '../StopWatch/StopWatch.js';
import Username from '../Username/Username.js';
import Score from '../Score/Score.js';

function App() {

  const [time, setTime] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [score, setScore] = React.useState(0);

  React.useEffect( () => {
    if (
      (running === false) &&
      ( ((time / 10) % 100) === 0 ) &&
      (time > 0)
    ) {
      setScore( score + 1 )
    }
  }, [ running, time ] )

  const randomList = [ 'buddy', 'pal', 'bro' ];

  return (
    <div className="App">
      <Username
        existingUsers={randomList}
        username={username}
        setUsername={setUsername}
      />
      <StopWatch
        time={time}
        setTime={setTime}
        running={running}
        setRunning={setRunning}
        setScore={setScore}
      />
      <Score
        score={score}
      />
    </div>
  );

}

export default App;
