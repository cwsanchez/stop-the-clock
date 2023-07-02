const getScores = async () => {
  try {
    const response = await fetch('http://localhost:5000/users');
    if (!response.ok) {
      throw new Error('Error retrieving users');
    }
    const data = await response.json();
    const users = data.users;
    return users;
  } catch (error) {
    console.error('Error retrieving users:', error);
  }
};

const submitScore = async (username, score) => {
  try {
    const response = await fetch('http://localhost:5000/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        score,
      }),
    });
    if (!response.ok) {
      throw new Error('Error submitting score');
    }
    const data = await response.json();
    console.log(data.message);
  } catch (error) {
    console.error('Error submitting score:', error);
  }
};

export { getScore, submitScore };
