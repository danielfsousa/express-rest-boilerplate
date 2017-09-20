const r2 = require('r2');

exports.facebook = async (accessToken) => {
  const fields = 'id, name, email, picture';
  const url = `https://graph.facebook.com/me?access_token=${accessToken}&fields=${fields}`;
  const { id, name, email, picture } = await r2(url).json;
  return {
    service: 'facebook',
    picture: picture.data.url,
    id,
    name,
    email,
  };
};

exports.google = async (accessToken) => {
  const url = `https://www.googleapis.com/userinfo/v2/me?access_token=${accessToken}`;
  const { id, name, email, picture } = await r2(url).json;
  return {
    service: 'google',
    picture,
    id,
    name,
    email,
  };
};
