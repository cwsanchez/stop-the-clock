import logo from '../../logo.svg';
import './App.css';
import React from 'react';
import StopWatch from '../StopWatch/StopWatch.js';
import Username from '../Username/Username.js';
import Score from '../Score/Score.js';
import Leaderboard from '../Leaderboard/Leaderboard.js';

function App() {

  const [time, setTime] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [score, setScore] = React.useState(0);

  const [users, setUsers] = React.useState(
    ['buddy', 'pal', 'bro' ]
  );

  const [topScores, setTopScores] = React.useState(
    {
      'buddy': 99,
      'pal': 1,
      'bro': 2
    }
      
  );

  React.useEffect( () => {
    if (
      (running === false) &&
      ( ((time / 10) % 100) === 0 ) &&
      (time > 0)
    ) {
      setScore( score + 1 )
    }
  }, [ running, time ] )

  const addUser = () => {
    let newUsers = users;
    newUsers.push(username);
    setUsers(newUsers);
  }
  
  const removeUser = () => {
    let newUsers = users;
    userIndex = newUsers.indexOf(username);
    newUsers.splice(userIndex, 1);
    setUsers(newUsers);
  }

  const addScore = () => {
    let newTopScores = topScores;
    newTopScores[username] = score;
    setTopScores(newTopScores);  
  }

  return (
    <div className="App">
      <Username
        existingUsers={users}
        username={username}
        setUsername={setUsername}
        addUser={addUser}
        removeUser={removeUser}
      />
      <StopWatch
        time={time}
        setTime={setTime}
        running={running}
        setRunning={setRunning}
        setScore={setScore}
        leaderboard={topScores}
        score={score}
        username={username}
        addScore={addScore}
      />
      <Score
        score={score}
      />
      <Leaderboard
        leaderboard={topScores}
      />
    </div>
  );

}

export default App;
