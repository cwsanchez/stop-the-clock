import React from 'react';

function Leaderboard(props) {
  const [submitScore, setSubmitScore] = React.useState(false);
  
  React.useEffect( () => {
    if (props.submitScore) { 
      setSubmitScore(true);
      setSubmitScore(false);
    }
  })    
 
  let sortLeaderboard = (scoreboard) => {
    const scores = Object.entries(scoreboard);
    scores.sort( (a,b) => b[1] - a[1] );

    return Object.fromEntries(scores);
  }

  let sortedLeaderboard = sortLeaderboard(props.leaderboard);

  let listOfLeaders = Object.keys(sortedLeaderboard).map(
    (user) => { 
      return ( <li key={user} >{user} : {props.leaderboard[user]}</li> )
    }  
  )
  
  return (
    <div className="leaderboard" >
      <ol>
        {listOfLeaders}
      </ol>
    </div>  
  )
}

export default Leaderboard;
