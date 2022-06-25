const generateMsg = (username, text) => {
  return {
    username,
    text,
    createdAt: new Date().getTime(),
  };
};

const generateLocationMsg = (username, latitude, longitude) => {
  return {
    username,
    url: `https://google.com/maps?q=${latitude},${longitude}`,
    createdAt: new Date().getTime(),
  };
};

module.exports = {
  generateMsg,
  generateLocationMsg,
};
