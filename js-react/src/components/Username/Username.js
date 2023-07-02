import React from 'react';

function Username(props) {

  const [username, setUsername] = React.useState('');
  const [nameErr, setNameErr] = React.useState('');
  const usrInputRef = React.useRef('');

  React.useEffect( () => { 
    if (username) { 
      props.setUsername(username) 
    } 
    else if ( !(username) ) {
      props.setUsername('')
    }
  } )

  const handleUsernameSubmit = () => {
    if ( !(isStringValid(usrInputRef.current.value)) ) {
      setNameErr("Only A-Z, a-z, -, and _ characters are permitted!");
     }
    else if ( 
      props.checkUsernameAvailability(usrInputRef.current.value) 
    ) {
      setNameErr("Username already exists!");
    }
    else {
      setNameErr(null);
      setUsername(usrInputRef.current.value);
      props.addUser()
    }
  }
  
  const isStringValid = (str) => {
    const pattern = /^[a-zA-Z_\-]+$/;

    return pattern.test(str)
  }

  const usernameField = () => {
    if ( !(username) ) {
      return (
        <div className="username-field" >
          <p>Enter a username ( A-Z, a-z, -, _ )</p>
          <input 
            type="text" 
            ref={usrInputRef}
          />
          <button 
            type="button" 
            onClick={ handleUsernameSubmit }
          >
            Submit
          </button>
        </div>
      )
    }
    else {
      return (
        <div className="username-display">
          <p>Username:</p>
          <p>{username}</p>
        </div>
      )
    }
  }

  const displayUsernameErr = () => {
    if ( nameErr ) {
      return <p id="name-err" >{nameErr}</p>
    }
    else {
      return null
    }
  }

  return(
    <div className="username">
      {usernameField()}
      {displayUsernameErr()}
       <button type="button" onClick={ () => { setUsername('') } }>
        Reset Username
       </button>
    </div>
  );
}

export default Username;
