import {
  Entity,
  Column,
  BaseEntity,
  PrimaryGeneratedColumn
} from 'typeorm'
import moment from 'moment'
import { IImageMiddlewareSettings } from '../../images/util'
@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  username: string

  @Column()
  email: string

  @Column()
  password: string

  @Column('timestamp with time zone')
  registrationDate: Date

  @Column('timestamp with time zone', {
    nullable: true,
  })
  lastLogin?: Date

  @Column({ default: false })
  emailVerified: boolean

  @Column()
  emailVerificationToken: string

  @Column()
  lowercaseUsername: string

  @Column()
  lowercaseEmail: string

  @Column()
  uploadKey: string

  @Column({
    nullable: true,
  })
  apiKey?: string

  @Column()
  registrationIp: string

  @Column('text', {
    array: true,
  })
  usedIps: string[]

  @Column({
    default: false,
  })
  moderator: boolean

  @Column({
    default: false,
  })
  admin: boolean

  @Column({
    default: false,
  })
  mailAccess: boolean

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
  })
  mailAccessExpires: Date

  @Column({
    default: false,
  })
  mailAccountCreated: boolean

  @Column({
    default: 5,
  })
  mailAliasLimit: number

  @Column({ default: false })
  banned: boolean

  @Column({
    default: '',
  })
  banReason: string

  @Column({
    default: 0,
  })
  imageCount: number

  @Column({
    nullable: true,
  })
  discordId?: string

  @Column({
    nullable: true,
  })
  discordTag?: string

  @Column({
    nullable: true,
  })
  discordState?: string

  @Column({
    default: false,
  })
  matrixAccountCreated: boolean

  @Column({
    default: false,
  })
  betaTester: false

  @Column({
    default: false,
  })
  settings_discordLink: boolean

  @Column({
    default: true,
  })
  settings_apiIpSecurity: boolean

  @Column({
    default: false,
  })
  settings_imageMiddleware: boolean

  @Column('text', {
    array: true,
    default: '{}',
  })
  settings_randomDomains: string[]

  @Column({ default: false })
  settings_secureURLs: boolean

  @Column({ default: false })
  settings_invisibleShortURLs: boolean

  @Column({ default: true })
  settings_ipSecurity: boolean

  @Column('json', {
    default: { middleware: [] },
  })
  imageMiddleware: IImageMiddlewareSettings

  @Column({ default: false })
  limited: boolean

  @Column({ nullable: true })
  limitedId: string

  @Column({ default: false })
  deactivated: boolean

  @Column({ default: false })
  embed: boolean

  @Column({
    default: true,
  })
  embedAuthor: boolean

  @Column({
    default: '',
  })
  embedAuthorStr: string

  @Column({
    default: '',
  })
  embedTitle: string

  @Column({
    default: '',
  })
  embedDescription: string

  @Column({ default: '#1070ca' })
  embedColor: string

  serialize() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      emailVerified: this.emailVerified,
      registrationDate: this.registrationDate,
      lastLogin: this.lastLogin,
      uploadKey: this.uploadKey,
      apiKey: this.apiKey,
      registrationIp: this.registrationIp,
      usedIps: this.usedIps,
      moderator: this.moderator,
      admin: this.admin,
      mailAccess: this.mailAccess,
      mailAccessExpires: this.mailAccessExpires,
      mailAccessExpiresFriendly:
        this.mailAccessExpires === null
          ? 'Never'
          : moment(this.mailAccessExpires).format('MMMM Do YYYY, h:mm:ss a'),
      mailAccountCreated: this.mailAccountCreated,
      mailAliasLimit: this.mailAliasLimit,
      banned: this.banned,
      banReason: this.banReason,
      imageCount: this.imageCount,
      discordId: this.discordId,
      discordTag: this.discordTag,
      matrixAccountCreated: this.matrixAccountCreated,

      betaTester: this.betaTester,

      limited: this.limited,
      limitedId: this.limitedId,
      deactivated: this.deactivated,

      settings_discordLink: this.settings_discordLink,
      settings_apiIpSecurity: this.settings_apiIpSecurity,
      settings_imageMiddleware: this.settings_imageMiddleware,
      settings_randomDomains: this.settings_randomDomains,
      settings_secureURLs: this.settings_secureURLs,
      settings_invisibleShortURLs: this.settings_invisibleShortURLs,
      settings_ipSecurity: this.settings_ipSecurity,
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      user: User
      loggedIn: boolean
      realIp: string
      flash: (clazz: string, message: string) => void
    }
  }
  namespace SocketIO {
    interface Socket {
      user: User
      loggedIn: boolean
    }
  }
}
