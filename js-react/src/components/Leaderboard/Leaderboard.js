import React from 'react';

function Leaderboard(props) {
  const [submitScore, setSubmitScore] = React.useState(false);
  
  React.useEffect( () => {
    if (props.submitScore) { 
      setSubmitScore(true);
      setSubmitScore(false);
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
      </ol>
    </div>  
  )
}

export default Leaderboard;
