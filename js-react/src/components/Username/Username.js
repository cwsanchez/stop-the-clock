import React from 'react';

function Username(props) {
  
  const usrInputRef = React.useRef('');
  const usrInputErr = React.useRef('');
  let submitUserInput = false;
  let submitClearInput = false;

  React.useEffect( () => {
    if (submitUserInput === true) {
      if ( !(isStringValid(usrInputRef.current)) ) {
        props.setNameErr("Only A-Z, a-z, -, and _ characters are permitted!");
       }
      else if ( (props.existingUsers.includes(usrInputRef.current)) ) {
        props.setNameErr("Username already exists!");
      }
      else {
        props.setUsername(usrInputRef.current);
      }
    }
  })

  React.useEffect( () => {
    if (submitClearInput === true) {
      props.setUsername('');
    }
  })

  const setSubmitClearInput = () => {
    submitClearInput = true;
  }

  const setSubmitUserTrue = () => {
    submitUserInput = true;
  }

  const isStringValid = (str) => {
    const pattern = /^[a-zA-Z_\-]+$/;

    return pattern.test(str)
  }

  const usernameField = () => {
    if ( !(props.username) ) {
      return (
        <div className="username-field" >
          <p>Enter a username ( A-Z, a-z, -, _ )</p>
          <input 
            type="text" 
            ref={usrInputRef}
          />
          <button 
            type="button" 
            onClick={ setSubmitUserTrue }
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
          <p>{props.username}</p>
        </div>
      )
    }
  }

  return(
    <div className="username">
      {usernameField()}
       <button type="button" onClick={ setSubmitClearInput }>
        Reset Username
       </button>
    </div>
  );
}

export default Username;
