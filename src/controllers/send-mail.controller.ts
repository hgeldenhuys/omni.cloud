import {authorize} from 'loopback4-authorization';
import {get, getModelSchemaRef, param, post} from '@loopback/openapi-v3';
import {RulesEngine} from '../models/rules-engine.model';
import {repository} from '@loopback/repository';
import {
  AccountRepositoryUnsafe,
  RegistrationLinkRepository,
  UserCredentialsRepository,
  UserRepositoryUnsafe,
} from '../repositories';
import * as crypto from 'crypto';
import {Account, User} from '../models';
import {inject} from '@loopback/context';
import {RestBindings} from '@loopback/rest';
import {Response} from 'express';

const nodemailer = require('nodemailer');

// async..await is not allowed in global scope, must use a wrapper
async function mail(to: string, message: string) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  // const testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "admin@omnirule.io", // generated ethereal user
      pass: "]TeqP8EX)yS7)" // generated ethereal password
    }
  });

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"OmniRule Admin 👻" <admin@omnirule.io>', // sender address
    to,
    subject: 'Verify registration', // Subject line
    // text: `Hi there, to verify your registration, click this link: http://localhost:3000/verify-email?verify=${code}&email=${to}`, // plain text body
    html: message // html body
  });

  console.log('Message sent: %s', info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

export class SendMailController {
  constructor(
    @repository(RegistrationLinkRepository)
    public registrationLinkRepository: RegistrationLinkRepository,
    @repository(UserRepositoryUnsafe)
    public userRepository: UserRepositoryUnsafe,
    @repository(UserRepositoryUnsafe)
    public userCredentialsRepository: UserCredentialsRepository,
    @repository(AccountRepositoryUnsafe)
    public accountRepository: AccountRepositoryUnsafe,
    @inject(RestBindings.Http.RESPONSE)
    private readonly response: Response,
  ) {
  }

  @authorize(["*"])
  @post('/register-email', {
    responses: {
      '200': {
        description: 'RulesEngine model instance',
        content: {'application/json': {schema: getModelSchemaRef(RulesEngine)}},
      },
    },
  })
  async register(
    @param.query.string('email') email: string,
  ): Promise<boolean> {
    if(await this.accountRepository.findOne(
      {
        where: {
          email
        }
      }
    )) {
      await mail(email, `You have already registered with this email. Please login if this was you, or if not, please ignore this email: http://localhost:3001/`);
      return true;
    }
    const currentDate = (new Date()).valueOf().toString();
    const random = Math.random().toString();
    const linkCode = crypto.createHash('sha1').update(currentDate + random).digest('hex');
    await this.registrationLinkRepository.set(email, {
      email,
      linkCode
    });
    const registrationLInk = await this.registrationLinkRepository.get(email);
    await mail(registrationLInk.email, `Hi there, to verify your registration, click this link: <br/>http://localhost:3000/verify-email?verify=${registrationLInk.linkCode}&email=${email}`);
    return true;
  }

  @authorize(["*"])
  @get('/verify-email', {
    responses: {
      '200': {
        description: 'RulesEngine model instance',
        content: {'application/json': {schema: getModelSchemaRef(RulesEngine)}},
      },
    },
  })
  async verifyEmail(
    @param.query.string('email') email: string,
    @param.query.string('code') code: string,
  ): Promise<boolean> {
    const registrationLInk = await this.registrationLinkRepository.get(email);
    if (email) {
      const
        user = await this.userRepository.create(new User({
          firstName: "firstname",
          middleName: "middleName",
          lastName: "lastName",
          defaultTenant: 1,
          username: email
        }));
      await this.accountRepository.create(new Account({
        userId: user.id,
        email,
        origin: "internal"
      }));

      await mail(registrationLInk.email, "You good :)");
      this.response.redirect("http://localhost:3001/");
    } else {
      this.response.redirect("http://localhost:3001/INTRUDER");
      await mail(registrationLInk.email, "SOMEONE TRIED BREAKING IN");
    }
    await this.registrationLinkRepository.delete(email);
    return true;
  }
}


