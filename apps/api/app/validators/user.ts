import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * Validator to use when performing self-registration
 */
export const registerValidator = vine.create({
  fullName: vine.string().nullable(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
  // Remembered on the row, because order emails are sent from webhooks and
  // background jobs where there is no request to read a locale from.
  locale: vine.enum(['en', 'fi']).optional(),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})

/**
 * Validator to use when requesting a password reset link.
 * Intentionally has no `.unique()`/existence check — the response
 * must stay identical whether or not the email is registered.
 */
export const forgotPasswordValidator = vine.create({
  email: email(),
  locale: vine.enum(['en', 'fi']).optional(),
})

/**
 * Validator to use when submitting a new password via a reset token
 */
export const resetPasswordValidator = vine.create({
  email: email(),
  token: vine.string(),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/**
 * The parts of an account anyone may change about themselves without
 * re-proving who they are. Deliberately excludes email and password: those
 * are the credentials, and each has its own validator below.
 */
export const updateProfileValidator = vine.create({
  fullName: vine.string().trim().maxLength(255).nullable(),
  // The language order emails are written in. Sent from webhooks and
  // background jobs, where there is no request to read a locale from.
  locale: vine.enum(['en', 'fi']),
})

/**
 * Changing the login identity. `unique` skips the row being edited, or
 * re-saving your own address would fail against yourself.
 */
export const updateEmailValidator = vine.withMetaData<{ userId: string }>().create({
  email: email().unique({
    table: 'users',
    column: 'email',
    filter: (query, _value, field) => {
      query.whereNot('id', field.meta.userId)
    },
  }),
  // Not `password()`: an existing password only has to match what is already
  // stored, and holding it to today's length rules would lock out anyone who
  // set theirs before those rules existed.
  currentPassword: vine.string(),
})

export const updatePasswordValidator = vine.create({
  currentPassword: vine.string(),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/** Closing an account is irreversible, so it asks who you are one more time. */
export const closeAccountValidator = vine.create({
  currentPassword: vine.string(),
})
