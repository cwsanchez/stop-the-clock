function Score(props) {

  return (
    <div className="score" >
      <p>Your current score:</p>
      {props.score}
    </div>
  )

}

export default Score;
