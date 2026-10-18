const { configuration, } = require('../configuration');
const nodemailer = require('nodemailer');

let _mailTransport = undefined;

const configureMailTransportAsync = async () => {
  const { host, port, isSecure, } = configuration.mailService;
  let { username, password, } = configuration.mailService;

  if (!username) {
    try {
      console.info('Creating test account because no username provided.');

      const testAccount = await nodemailer.createTestAccount();

      username = testAccount.user;
      password = testAccount.pass;
    } catch (error) {
      console.warn('An error occurred while creating test account.', error);
    }
  }

  try {
    _mailTransport = nodemailer.createTransport({
      host: host,
      port: port,
      secure: isSecure,
      auth: {
        user: username,
        pass: password,
      },
    });
  } catch (error) {
    console.error('An error occurred while creating transport.', error);
  }

  return _mailTransport;
};

const getMailTransportAsync = async () => {
  if (!_mailTransport) {
    _mailTransport = await configureMailTransportAsync();
  }

  return _mailTransport;
};

const sendEmailAsync = async ({ subject, message, sender, recipients, }) => {
  const mailTransport = await getMailTransportAsync();

  if (!mailTransport) {
    console.warn('Failed to send email because mail transport couldn\'t be initialized.', data);

    return;
  }

  const { username, } = configuration.mailService;

  try {
    const mailInformation = await mailTransport.sendMail({
      from: {
        name: 'CryptoSearch',
        address: username,
      },
      to: recipients,
      subject: subject,
      text: message,
    });

    console.info('Successfully sent email.', {
      subject: subject,
      message: message,
      sender: sender,
      recipients: recipients,
      messageId: mailInformation.messageId,
    });
  } catch (error) {
    console.error('An error occurred while sending email.', {
      subject: subject,
      message: message,
      sender: sender,
      recipients: recipients,
    });
  }
};

module.exports.sendEmailAsync = sendEmailAsync;
