import React from 'react';

function Username(props) {
  
  //console.log(props);
  const usrInputRef = React.useRef('');
  const usrInputErr = React.useRef('');
  const submitUserInput = React.useRef(false);
  const submitClearInput = React.useRef(false);

  //console.log(submitUserInput.current);

  React.useEffect( () => {
    if (submitUserInput.current === true) {
      let newUsername = usrInputRef.current;

      //console.log(newUsername)

      if ( !(isStringValid(newUsername)) ) {
        //console.log(isStringValid(newUsername));
        usrInputErr.current = "Only A-Z, a-z, -, and _ characters are permitted!";
       }
      else if ( (props.existingUsers.includes(newUsername)) ) {
        //console.log(props.existingUsers.includes(newUsername));
        usrInputErr.current = "Username already exists!"
      }
      else {
        props.setUsername(newUsername);
      }
    }
  })

  React.useEffect( () => {
    if (submitClearInput.current === true) {
      props.setUsername('');
    }
  })

  const setSubmitClearInput = () => {
    submitClearInput.current = true;
  }

  const setSubmitUserTrue = () => {
    submitUserInput.current = true;
  }

  const isStringValid = (str) => {
    const pattern = /^[a-zA-Z_\-]+$/;

    return pattern.test(str)
  }

  const usernameField = () => {
    if ( !(props.username) ) {
      return (
        <div className="username-field" >
          <p>Enter a username (A-Z, a-z, -, _)</p>
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
