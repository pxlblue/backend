import {
  Entity,
  Column,
  BaseEntity,
  PrimaryGeneratedColumn
} from 'typeorm'
@Entity()
export class ShortURL extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  shortId: string

  @Column()
  creator: number

  @Column()
  host: string

  @Column('timestamp with time zone')
  creationTime: Date

  @Column()
  creatorIp: string

  @Column()
  url: string

  @Column()
  destination: string

  serialize() {
    return {
      id: this.id,
      shortId: this.shortId,
      creator: this.creator,
      host: this.host,
      creationTime: this.creationTime,
      creatorIp: this.creatorIp,
      url: this.url,
      destination: this.destination,
    }
  }
}
