import Patient from '../models/Patient.js';
import Prescription from '../models/Prescription.js';
import InventoryItem from '../models/InventoryItem.js';
import Invoice from '../models/Invoice.js';
import Bed from '../models/Bed.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const role = req.user.role;
    const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
    const canViewPrescriptions = isAdmin || role === 'PHARMACIST';
    const canViewInventory = isAdmin || role === 'PHARMACIST';
    const canViewBilling = isAdmin || role === 'ACCOUNTANT' || role === 'RECEPTIONIST';
    const canViewAdmissions = isAdmin || role === 'NURSE' || role === 'RECEPTIONIST';
    const [
      totalPatients,
      pendingPrescriptions,
      lowStockCount,
      bedStats,
      unpaidInvoiceCount,
      recentPatients,
    ] = await Promise.all([
      Patient.countDocuments({ tenantId }),
      canViewPrescriptions
        ? Prescription.countDocuments({ tenantId, status: 'PRESCRIBED' })
        : 0,
      canViewInventory
        ? InventoryItem.countDocuments({
            tenantId,
            isActive: true,
            $expr: { $lte: ['$quantity', '$reorderLevel'] },
          })
        : 0,
      canViewAdmissions
        ? Bed.aggregate([
            { $match: { tenantId } },
            {
              $group: {
                _id: null,
                totalBeds: { $sum: 1 },
                occupiedBeds: { $sum: { $cond: [{ $eq: ['$isOccupied', true] }, 1, 0] } },
              },
            },
          ])
        : [],
      canViewBilling
        ? Invoice.countDocuments({ tenantId, status: 'UNPAID' })
        : 0,
      Patient.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName patientId gender createdAt'),
    ]);

    const totalBeds = bedStats[0]?.totalBeds || 0;
    const occupiedBeds = bedStats[0]?.occupiedBeds || 0;

    const stats = { totalPatients };
    if (canViewPrescriptions) stats.pendingPrescriptions = pendingPrescriptions;
    if (canViewInventory) stats.lowStockCount = lowStockCount;
    if (canViewBilling) stats.unpaidInvoiceCount = unpaidInvoiceCount;
    if (canViewAdmissions) {
      stats.totalBeds = totalBeds;
      stats.occupiedBeds = occupiedBeds;
      stats.availableBeds = totalBeds - occupiedBeds;
    }

    res.status(200).json({
      success: true,
      stats,
      recentPatients,
    });
  } catch (error) {
    console.error('Get Dashboard Summary Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
