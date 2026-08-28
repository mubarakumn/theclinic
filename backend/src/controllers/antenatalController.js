// controllers/antenatalController.js
import AntenatalRecord from '../models/AntenatalRecord.js';
import getNextSequence from '../utils/getNextSequence.js';

export const enrollAntenatal = async (req, res) => {
  try {
    const { patientId, lmp, gravida, para, riskFactors, bloodGroup, genotype } = req.body;
    const lmpDate = new Date(lmp);

    // Calculate EDD (+7 days, -3 months, +1 year)
    const eddDate = new Date(lmpDate);
    eddDate.setDate(eddDate.getDate() + 7);
    eddDate.setMonth(eddDate.getMonth() - 3);
    eddDate.setFullYear(eddDate.getFullYear() + 1);

    const ancSeq = await getNextSequence(req.user.tenantId, 'ANC');
    const ancNumber = `ANC-${new Date().getFullYear()}-${ancSeq.toString().padStart(4, '0')}`;

    const record = await AntenatalRecord.create({
      tenantId: req.user.tenantId,
      patientId,
      ancNumber,
      lmp: lmpDate,
      edd: eddDate,
      gravida,
      para,
      bloodGroup,
      genotype,
      riskFactors,
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error enrolling ANC patient', error: error.message });
  }
};

export const getAntenatalRecords = async (req, res) => {
  try {
    const records = await AntenatalRecord.find({ tenantId: req.user.tenantId })
      .populate('patientId', 'firstName lastName phone mrn')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching ANC records', error: error.message });
  }
};

export const addAntenatalVisit = async (req, res) => {
  try {
    const { fundalHeightCm, fetalHeartRate, bloodPressure, weightKg, notes } = req.body;
    const record = await AntenatalRecord.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    record.visits.push({
      fundalHeightCm,
      fetalHeartRate,
      bloodPressure,
      weightKg,
      notes,
      attendedBy: req.user._id,
    });

    await record.save();
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding visit note', error: error.message });
  }
};