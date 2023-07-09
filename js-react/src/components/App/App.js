import logo from '../../logo.svg';
import './App.css';
import { getScores, submitScore } from '../../utilities/backendRequests.js';
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
  const [submitUserCond, setSubmitUser] = React.useState();
  const [submitScoreCond, setSubmitScore] = React.useState();
  const [refreshLeaderboard, setRefreshLeaderboard] = React.useState();

/*
  const [users, setUsers] = React.useState(
    ['buddy', 'pal', 'bro' ]
  );
*/

  const [topScores, setTopScores] = React.useState( {} );

  React.useEffect( () => {
    if (
      (running === false) &&
      ( ((time / 10) % 100) === 0 ) &&
      (time > 0)
    ) {
      setScore( score + 1 )
    }
  }, [ running, time ] )

/*
  React.useEffect( () => {
    if (username) {addUser()}
  } )
*/
  
  React.useEffect( () => {
    if (submitScoreCond) {
      addScore();
      setSubmitScore(false);
    }
  } )

  React.useEffect( () => {
    if (refreshLeaderboard) {
      getScores.then(
        (listOfScores) => {
          let scores = Object.fromEntries(listOfScores);
          setTopScores(scoresObject);
          setRefreshLeaderboard(false);
        }    
      )    
    }  
  } )


  const addScore = () => {
    submitScore(username, score).then( () => { return } );
  }

  const checkUsernameAvailability = (newUsername) => {
    getScores.then( 
      (listOfScores) => {
        let scores = Object.fromEntries(listOfScores);
        let usernames = Object.keys(scores);
        return usernames.includes(newUsername)
      }
    )
  }

/*
  const addUser = () => {
    let newUsers = users;
    newUsers.push(username);
    setUsers(newUsers);
  }\
*/
 
/* 
  const removeUser = () => {
    let newUsers = users;
    userIndex = newUsers.indexOf(username);
    newUsers.splice(userIndex, 1);
    setUsers(newUsers);
  }
*/

  return (
    <div className="App">
      <Username
        username={username}
        setUsername={setUsername}
        checkUsernameAvailability={checkUsernameAvailability}
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
        setSubmitScore={setSubmitScore}
      />
      <Score
        score={score}
      />
      <Leaderboard
        leaderboard={topScores}
        submitScore={submitScoreCond}
        refreshLeaderboard={refreshLeaderboard}
        setRefreshScore={setRefreshLeaderboard}
      />
    </div>
  );

}

export default App;
