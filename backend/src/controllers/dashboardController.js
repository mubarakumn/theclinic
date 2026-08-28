import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";
import InventoryItem from "../models/InventoryItem.js";
import Invoice from "../models/Invoice.js";
import Bed from "../models/Bed.js";

/**
 * @desc    Get dashboard summary statistics & recent patient queue
 * @route   GET /api/dashboard/summary
 * @access  Private (admin, super_admin, doctor, receptionist, staff)
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const [
      totalActivePatients,
      pendingPrescriptions,
      lowStockCount,
      bedStats,
      unpaidInvoiceStats,
      recentPatients,
    ] = await Promise.all([
      // 1. Total active patients
      Patient.countDocuments({ isActive: true }),

      // 2. Pending prescriptions in Pharmacy
      Prescription.countDocuments({ status: "Pending" }),

      // 3. Low-stock inventory items
      InventoryItem.countDocuments({
        isActive: true,
        $expr: { $lte: ["$quantity", "$reorderLevel"] },
      }),

      // 4. Bed occupancy statistics
      Bed.aggregate([
        {
          $group: {
            _id: null,
            totalBeds: { $sum: 1 },
            occupiedBeds: {
              $sum: { $cond: [{ $eq: ["$isOccupied", true] }, 1, 0] },
            },
          },
        },
      ]),

      // 5. Unpaid invoice balances
      Invoice.aggregate([
        {
          $match: {
            status: { $in: ["Issued", "Partially Paid"] },
          },
        },
        {
          $group: {
            _id: null,
            totalUnpaidBalance: { $sum: "$balance" },
            unpaidInvoiceCount: { $sum: 1 },
          },
        },
      ]),

      // 6. Recent patient list (5 most recent)
      Patient.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name cardNo gender status createdAt"),
    ]);

    const totalBeds = bedStats[0]?.totalBeds || 0;
    const occupiedBeds = bedStats[0]?.occupiedBeds || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalPatients: totalActivePatients,
        pendingPrescriptions,
        lowStockCount,
        totalBeds,
        occupiedBeds,
        availableBeds: totalBeds - occupiedBeds,
        unpaidInvoiceCount: unpaidInvoiceStats[0]?.unpaidInvoiceCount || 0,
        totalUnpaidBalance: unpaidInvoiceStats[0]?.totalUnpaidBalance || 0,
      },
      recentPatients,
    });
  } catch (error) {
    console.error("Get Dashboard Summary Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};