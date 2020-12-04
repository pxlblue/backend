import {
  Entity,
  Column,
  BaseEntity,
  PrimaryGeneratedColumn
} from 'typeorm'

@Entity()
export class Testimonial extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  author: number

  @Column('timestamp with time zone')
  createdAt: Date

  @Column({ default: true })
  approved: boolean

  @Column({ length: '100' })
  testimonial: string

  serialize() {
    return {
      id: this.id,
      author: this.author,
      createdAt: this.createdAt,
      approved: this.approved,
      testimonial: this.testimonial,
    }
  }
}
