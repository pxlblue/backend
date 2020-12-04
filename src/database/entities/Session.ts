import {
  Entity,
  Column,
  BaseEntity,
  PrimaryGeneratedColumn
} from 'typeorm'
@Entity()
export class Session extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  sessionString: string

  @Column()
  userId: number

  @Column()
  ip: string

  @Column({
    default: false,
  })
  invalidated: boolean

  @Column({
    default: false,
  })
  rememberMe: boolean

  @Column('timestamp with time zone', {
    nullable: true,
  })
  expiresAt?: Date

  serialize() {
    return {
      id: this.id,
      user: this.userId,
      rememberMe: this.rememberMe,
      expiresAt: this.expiresAt,
    }
  }
}
