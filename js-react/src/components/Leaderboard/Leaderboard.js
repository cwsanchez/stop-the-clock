function Leaderboard(props) {
  
  let listOfLeaders = Object.keys(props.leaderboard).map(
    (user) => { 
      return ( <li>{user} : {props.leaderboard[user]}</li> )
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
