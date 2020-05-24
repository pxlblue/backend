import {
  Entity,
  Column,
  BaseEntity,
  PrimaryColumn,
  ManyToOne,
  OneToMany
} from 'typeorm'
import { User } from './User'
import { Report } from './Report'

@Entity()
export class Image extends BaseEntity {
  @PrimaryColumn()
  id: string

  @Column()
  shortId: string

  @ManyToOne(
    type => User,
    user => user.images
  )
  uploader: User

  @Column()
  host: string

  @Column()
  contentType: string

  @Column()
  uploadDate: Date

  @Column()
  size: number

  @Column()
  hash: string

  @Column()
  url: string

  @Column()
  path: string

  @Column()
  originalName: string

  @Column({
    default: false
  })
  deleted: boolean

  @Column({
    default: 'N/A'
  })
  deletionReason: string

  @OneToMany(
    type => Report,
    report => report.image
  )
  reports: Report[]

  @Column({
    nullable: true
  })
  uploaderIp: string

  userSerialize() {
    return {
      id: this.id,
      shortId: this.shortId,
      host: this.host,
      contentType: this.contentType,
      hash: this.hash,
      uploadDate: this.uploadDate,
      size: this.size,
      url: this.url,
      path: this.path,
      originalName: this.originalName,
      deleted: this.deleted,
      deletionReason: this.deletionReason,
      uploaderIp: this.uploaderIp
    }
  }
  serialize() {
    return {
      id: this.id,
      shortId: this.shortId,
      host: this.host,
      contentType: this.contentType,
      hash: this.hash,
      uploadDate: this.uploadDate,
      size: this.size,
      url: this.url,
      path: this.path,
      originalName: this.originalName,
      deleted: this.deleted,
      deletionReason: this.deletionReason,
      uploaderIp: this.uploaderIp,
      uploader: {
        id: this.uploader.id,
        username: this.uploader.username,
        email: this.uploader.email
      }
    }
  }
}
