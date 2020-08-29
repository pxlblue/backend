import {
  Entity,
  Column,
  BaseEntity,
  PrimaryColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
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
    default: false,
  })
  mailAccountCreated: boolean

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

  serialize() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      registrationDate: this.registrationDate,
      lastLogin: this.lastLogin,
      uploadKey: this.uploadKey,
      registrationIp: this.registrationIp,
      moderator: this.moderator,
      admin: this.admin,
      mailAccess: this.mailAccess,
      mailAccountCreated: this.mailAccountCreated,
      banned: this.banned,
      banReason: this.banReason,
      imageCount: this.imageCount,
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      user: User
      loggedIn: boolean
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
