import sgMail from '@sendgrid/mail'
sgMail.setApiKey(process.env.EMAIL_KEY!)

const VERIFY_EMAIL_TEMPLATE = `Hello {username}!
Someone has registered on <a href="https://pxl.blue">pxl.blue</a> with your email.
Follow this link to verify your email.
<a href="{link}">{link}</a>`

const VERIFY_EMAIL_SUCCESS_TEMPLATE = `Hello {username}!
Your account signup and verification was a success!
Login at <a href="https://pxl.blue">pxl.blue</a> and get started using your account.`

const UNBAN_USER_TEMPLATE = `Hello {username}!

Your suspension has been lifted from pxl.blue.
You may login and use your account again.`

const BAN_USER_TEMPLATE = `Hello {username}!

Your account has been suspended from pxl.blue for reason

{reason}

You may appeal your suspension by emailing appeals@pxl.blue from the email on your account.`

export async function sendMail(to: string, subject: string, html: string) {
  sgMail.setApiKey(process.env.EMAIL_KEY!)
  sgMail
  return sgMail.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    html,
  })
}

function replaceTemplate(templ: string, replacers: { [x: string]: string }) {
  let n = templ
  Object.keys(replacers).forEach((key) => {
    let regexp = new RegExp(`{${key}}`, 'gi')
    n = n.replace(regexp, replacers[key])
  })
  return n
}

export async function sendEmailVerification(
  to: string,
  username: string,
  link: string
) {
  sgMail.setApiKey(process.env.EMAIL_KEY!)
  return sgMail.send({
    from: process.env.EMAIL_FROM!,
    to,
    templateId: 'd-7c7f8988915245d1a0cf04daeb103647',
    dynamicTemplateData: {
      username,
      text:
        'Someone (hopefully you) signed up for pxl.blue using your email address.',
      cta_pretext:
        'If this was you, press the button below to activate your account',
      cta_link: link,
      cta_text: 'Verify your Account',
    },
  })
}
export function verifyEmailTemplate(username: string, link: string) {
  return replaceTemplate(VERIFY_EMAIL_TEMPLATE, { username, link })
}

export function verifyEmailSuccessTemplate(username: string) {
  return replaceTemplate(VERIFY_EMAIL_SUCCESS_TEMPLATE, { username })
}

export function unbanUserTemplate(username: string) {
  return replaceTemplate(UNBAN_USER_TEMPLATE, { username })
}

export function banUserTemplate(username: string, reason: string) {
  return replaceTemplate(BAN_USER_TEMPLATE, { username, reason })
}
