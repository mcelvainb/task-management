import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { UserRole } from './user-role.entity';
import { Task } from './task.entity';
import { AuditLog } from './audit-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @ManyToOne(() => Organization, org => org.users, { eager: true })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => UserRole, userRole => userRole.user, { eager: true, cascade: true })
  roles: UserRole[];

  @OneToMany(() => Task, task => task.creator)
  createdTasks: Task[];

  @OneToMany(() => AuditLog, log => log.user)
  auditLogs: AuditLog[];

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}