import {
  Entity,
  Column,
  BaseEntity,
  PrimaryColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity()
export class Domain extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  domain: string

  @Column({
    default: true,
  })
  public: boolean

  @Column({
    default: false,
  })
  system: boolean

  @Column()
  host: string

  @Column()
  ownerId: number

  serialize() {
    return {
      id: this.id,
      domain: this.domain,
      public: this.public,
      system: this.system,
      host: this.host,
      ownerId: this.ownerId,
    }
  }
}
