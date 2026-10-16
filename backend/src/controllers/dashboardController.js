import Patient from '../models/Patient.js';
import Prescription from '../models/Prescription.js';
import InventoryItem from '../models/InventoryItem.js';
import Invoice from '../models/Invoice.js';
import Bed from '../models/Bed.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [
      totalPatients,
      pendingPrescriptions,
      lowStockCount,
      bedStats,
      unpaidInvoiceCount,
      recentPatients,
    ] = await Promise.all([
      Patient.countDocuments({ tenantId }),
      Prescription.countDocuments({ tenantId, status: 'PRESCRIBED' }),
      InventoryItem.countDocuments({
        tenantId,
        isActive: true,
        $expr: { $lte: ['$quantity', '$reorderLevel'] },
      }),
      Bed.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: null,
            totalBeds: { $sum: 1 },
            occupiedBeds: { $sum: { $cond: [{ $eq: ['$isOccupied', true] }, 1, 0] } },
          },
        },
      ]),
      Invoice.countDocuments({ tenantId, status: 'UNPAID' }),
      Patient.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName patientId gender createdAt'),
    ]);

    const totalBeds = bedStats[0]?.totalBeds || 0;
    const occupiedBeds = bedStats[0]?.occupiedBeds || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalPatients,
        pendingPrescriptions,
        lowStockCount,
        totalBeds,
        occupiedBeds,
        availableBeds: totalBeds - occupiedBeds,
        unpaidInvoiceCount,
      },
      recentPatients,
    });
  } catch (error) {
    console.error('Get Dashboard Summary Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
