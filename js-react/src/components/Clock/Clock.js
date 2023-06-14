import React from 'react';

function Clock(props) {

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
  }, [props.running]);

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
      <div className="buttons">
        <button onClick={() => props.setRunning(true)}>Start</button>
        <button onClick={() => props.setRunning(false)}>Stop</button>
        <button onClick={() => props.setTime(0)}>Reset</button>       
      </div>
    </div>
  );
};

export default Clock;
