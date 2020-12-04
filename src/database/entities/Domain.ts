import {
  Entity,
  Column,
  BaseEntity,
  PrimaryGeneratedColumn
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
  ownerId: number

  @Column({ default: false })
  disabled: boolean

  @Column({
    default: true,
  })
  wildcard: boolean

  serialize() {
    return {
      id: this.id,
      domain: this.domain,
      public: this.public,
      system: this.system,
      ownerId: this.ownerId,
      disabled: this.disabled,
      wildcard: this.wildcard,
    }
  }
}
