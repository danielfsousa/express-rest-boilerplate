import Joi from 'joi'

// POST /v1/auth/register
export const register = {
  body: {
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6).max(128),
  },
}

// POST /v1/auth/login
export const login = {
  body: {
    email: Joi.string().email().required(),
    password: Joi.string().required().max(128),
  },
}

// POST /v1/auth/facebook
// POST /v1/auth/google
export const oAuth = {
  body: {
    access_token: Joi.string().required(),
  },
}

// POST /v1/auth/refresh
export const refresh = {
  body: {
    email: Joi.string().email().required(),
    refreshToken: Joi.string().required(),
  },
}

// POST /v1/auth/refresh
export const sendPasswordReset = {
  body: {
    email: Joi.string().email().required(),
  },
}

// POST /v1/auth/password-reset
export const passwordReset = {
  body: {
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6).max(128),
    resetToken: Joi.string().required(),
  },
}
