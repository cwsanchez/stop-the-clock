import React from 'react';

function Leaderboard(props) {
  const [submitScore, setSubmitScore] = React.useState(false);
  const [refreshLeaderboard, setRefreshLeaderboard] = React.useState();
  
  React.useEffect( () => {
    if (props.submitScore) { 
      setSubmitScore(true);
      props.setSubmitScore(false);
    }
  })    

  React.useEffect ( () => {
    if (props.refreshLeaderboard) {
      setRefreshLeaderboard(true);
      props.setRefreshLeaderboard(false);
    }
  })
 
  let listOfLeaders = Object.keys(props.leaderboard).map(
    (user) => { 
      return ( <li key={user} >{user} : {props.leaderboard[user]}</li> )
    }  
  )
  
  return (
    <div className="leaderboard" >
      <ol>
        {listOfLeaders}
        <button onClick={ () => setRefreshScore(true) } />Refresh</button>
      </ol>
    </div>  
  )
}

export default Leaderboard;
