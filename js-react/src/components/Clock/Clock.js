function Clock() {

  useEffect(() => {
    let interval;
    if (this.props.clockIsRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 10);
      }, 10);
    } else if (!this.props.clockIsRunning) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [this.props.clockIsRunning]);

  return (
    <div className="stopwatch">
      <div className="numbers">
        <span>{("0" + Math.floor((time / 60000) % 60)).slice(-2)}:</span>
        <span>{("0" + Math.floor((time / 1000) % 60)).slice(-2)}:</span>
        <span>{("0" + ((time / 10) % 100)).slice(-2)}</span>
      </div>
      <div className="buttons">
        <button onClick={() => this.props.setClockIsRunning(true)}>Start</button>
        <button onClick={() => this.props.setClockIsRunning(false)}>Stop</button>
        <button onClick={() => this.props.setTime(0)}>Reset</button>       
      </div>
    </div>
  );
};
