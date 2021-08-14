// TODO: use got
import axios from 'axios'

export async function facebook(token) {
  const fields = 'id, name, email, picture'
  const url = 'https://graph.facebook.com/me'
  const params = { access_token: token, fields }
  const response = await axios.get(url, { params })
  const { id, name, email, picture } = response.data
  return {
    service: 'facebook',
    picture: picture.data.url,
    id,
    name,
    email,
  }
}

export async function google(token) {
  const url = 'https://www.googleapis.com/oauth2/v3/userinfo'
  const params = { access_token: token }
  const response = await axios.get(url, { params })
  const { sub, name, email, picture } = response.data
  return {
    service: 'google',
    picture,
    id: sub,
    name,
    email,
  }
}
