import logo from './logo.svg';
import './App.css';
import Clock from '../Clock/Clock.js";

function App() {

  const [time, setTime] = useState(0);
  const [clockIsRunning, setClockIsRunning] = useState(false);

  return (
    <div className="App">
      <Clock 
        time={time}
        setTime={setTime}
        clockIsRunning={clockIsRunning}
        setClockIsRunning={setClockIsRunning}
      />
    </div>
  );
}

export default App;
