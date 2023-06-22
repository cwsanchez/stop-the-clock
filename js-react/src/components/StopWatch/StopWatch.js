import React from 'react';

function StopWatch(props) {

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

  const stopStartButton = () => {
    if ( props.running === true ) {
      return (
        <div id="buttons" >
          <button onClick={() => props.setRunning(false)}>Stop</button>
          <button onClick={() => props.setTime(0)}>Reset</button>
        </div>
       )
    }
    else if ( props.time > 0 ) {
      return (
        <div id="buttons" >
          <button onClick={() => props.setRunning(true)}>Start</button>
          <button onClick={() => props.setTime(0)}>Reset</button>
         </div>
       )
     }
     else {
      return (
        <button onClick={() => props.setRunning(true)}>Start</button>
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
