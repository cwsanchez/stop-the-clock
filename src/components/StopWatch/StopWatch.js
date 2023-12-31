import React from 'react';

function StopWatch(props) {
  
  const [submitScore, setSubmitScore] = React.useState(false);

  React.useEffect(() => {
    let interval;
    if (props.running) {
      interval = setInterval(() => {
        props.setTime((prevTime) => prevTime + 10);
      }, 10);
    } else if (!props.running) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  });

  React.useEffect(() => {
    if (submitScore) { 
      props.setSubmitScore(true);
      setSubmitScore(false);
    }
  }, [submitScore]);

  const milliseconds = ((props.time / 10) % 100);

  const resetTimeScore = () => {
    props.setTime(0);
    props.setScore(0);
  }

  const stopStartButton = () => {
    if ( props.running === true ) {
      return (
        <div id="buttons" >
          <button onClick={() => props.setRunning(false)}>Stop</button>
        </div>
       )
    }
    else if ( milliseconds === 0 ) {
      return (
        <div id="buttons" >
          <button onClick={() => props.setRunning(true)}>Start</button>
         </div>
       )
     }
    else if ( (props.score > 0) && (props.username) ) { 
      return (
        <div id="buttons" >
          <button onClick={resetTimeScore}>Reset</button>
          <button onClick={() => setSubmitScore(true)}>Submit Score</button>
        </div>
      )
    }
    else if ( (props.score > 0) && (!(props.username)) ) {
      return (
        <div id="buttons" >
          <p>Enter a username to submit score!</p> 
          <button onClick={resetTimeScore}>Reset</button>
        </div>
      )
    }
    else {
      return (
        <button onClick={resetTimeScore}>Reset</button>
      )
     }
  }

  return (
    <div className="stopwatch">
      <div className="numbers">
        <span>
          {("0" + Math.floor((props.time / 60000) % 60)).slice(-2)}:
        </span>
        <span>
          {("0" + Math.floor((props.time / 1000) % 60)).slice(-2)}:
        </span>
        <span>
          {("0" + ((props.time / 10) % 100)).slice(-2)}
        </span>
      </div>
      {stopStartButton()}
    </div>
  )
}

export default StopWatch;
