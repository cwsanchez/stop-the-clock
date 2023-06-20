function Username(props) {

  const isStringValid = (str) => {
    const pattern = /^[a-zA-Z_\-]+$/;

    return pattern.test(str)
  }

  const submitUsername = (usernameInput) => {
   if ( !(isStringValid(usernameInput)) ) {
    return "Only A-Z, a-z, -, and _ characters are permitted!"
   }
   else if ( !(props.existingUsers.includes(usernameInput)) ) {
    return "Username already exists!"
   }
   else {
    props.setUsername(usernameInput);
   }

  let usernameField = () => {
    if ( !(props.username) ) {
      return (
        <input 
          type="text" 
          onChange={ (newUser) => {submitUsername(newUser)} } 
        />
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

}

export default Username;
