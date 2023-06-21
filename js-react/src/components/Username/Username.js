import React from 'react';

function Username(props) {
  
  //console.log(props);
  const usrInputRef = React.useRef('');
  const submitUserInput = React.useRef(false);

  console.log(submitUserInput.current);

  React.useEffect( () => {
    if (submitUserInput.current === true) {
      submitUsername();
    }
  })

  const setSubmitUserTrue = () => {
    submitUserInput.current = true;
  }

  const isStringValid = (str) => {
    const pattern = /^[a-zA-Z_\-]+$/;

    return pattern.test(str)
  }

  const submitUsername = () => {
    let newUsername = usrInputRef.current.value;

    //console.log(newUsername)

    if ( !(isStringValid(newUsername)) ) {
      //console.log(isStringValid(newUsername));
      return "Only A-Z, a-z, -, and _ characters are permitted!"
     }
    else if ( (props.existingUsers.includes(newUsername)) ) {
      //console.log(props.existingUsers.includes(newUsername));
      return "Username already exists!"
    }
    else {
      props.setUsername(newUsername);
    }
  }

  const usernameField = () => {
    if ( !(props.username) ) {
      return (
        <div className="username-field" >
          <input 
            type="text" 
            ref={usrInputRef}
          />
          <button 
            type="button" 
            onClick={ setSubmitUserTrue() }
          >
            Submit
          </button>
        </div>
      )
    }
    else {
      return <p className="username-display">{props.username}</p>
    }
  }

  return(
    <div className="username">
      <p>Enter a username (A-Z, a-z, -, _)</p>
      {usernameField()}
       <button type="button" onClick={props.setUsername('')}>
        Reset Username
       </button>
    </div>
  );
}

export default Username;
