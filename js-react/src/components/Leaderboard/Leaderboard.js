function Leaderboard(props) {
  
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
