import got from 'got'

export async function facebook(token) {
  const fields = 'id, name, email, picture'
  const url = 'https://graph.facebook.com/me'
  const searchParams = { access_token: token, fields }
  const response = await got.get(url, { searchParams }).json()
  const { id, name, email, picture } = response
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
  const searchParams = { access_token: token }
  const response = await got.get(url, { searchParams }).json()
  const { sub, name, email, picture } = response
  return {
    service: 'google',
    picture,
    id: sub,
    name,
    email,
  }
}
