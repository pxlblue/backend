import {
  Entity,
  Column,
  BaseEntity,
  PrimaryGeneratedColumn
} from 'typeorm'

@Entity()
export class Voucher extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  type: string

  @Column()
  voucher: string

  @Column()
  duration: string

  @Column({ default: false })
  redeemed: boolean

  @Column({ nullable: true })
  redeemedBy: number

  serialize() {
    return {
      id: this.id,
      type: this.type,
      voucher: this.voucher,
      duration: this.duration,
      redeemed: this.redeemed,
      redeemedBy: this.redeemedBy,
    }
  }
}
