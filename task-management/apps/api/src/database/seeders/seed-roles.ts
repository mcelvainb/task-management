import { DataSource } from 'typeorm';
import { Role, RoleType } from '../../entities/role.entity';

export async function seedRoles(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);

  const roles = [
    {
      name: RoleType.OWNER,
      description: 'Full access to organization and all tasks',
    },
    {
      name: RoleType.ADMIN,
      description: 'Can manage tasks and users',
    },
    {
      name: RoleType.VIEWER,
      description: 'Read-only access to tasks',
    },
  ];

  for (const roleData of roles) {
    const existingRole = await roleRepository.findOne({
      where: { name: roleData.name },
    });

    if (!existingRole) {
      const role = roleRepository.create(roleData);
      await roleRepository.save(role);
      console.log(`Seeded role: ${roleData.name}`);
    }
  }
}