import Role from '../models/Role';

const initializeTenantWorkspace = async (tenantId) => {
  const defaultRoles = [
    {
      tenantId,
      name: 'Admin',
      description: 'Full system control',
      permissions: ['all']
    },
    {
      tenantId,
      name: 'Doctor',
      description: 'Medical care and prescriptions',
      permissions: ['patients_read', 'patients_write', 'medical_records_manage', 'lab_read', 'pharmacy_read']
    },
    {
      tenantId,
      name: 'Nurse',
      description: 'Patient admissions and vitals',
      permissions: ['patients_read', 'vitals_write', 'admissions_manage']
    },
    {
      tenantId,
      name: 'Pharmacist',
      description: 'Medication inventory and dispensing',
      permissions: ['pharmacy_manage', 'inventory_manage']
    },
    {
      tenantId,
      name: 'Receptionist',
      description: 'Patient registration and front-desk ops',
      permissions: ['patients_write', 'billing_read']
    }
  ];

  await Role.insertMany(defaultRoles);
};

export initializeTenantWorkspace;