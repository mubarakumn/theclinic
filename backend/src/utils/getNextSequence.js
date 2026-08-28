import Counter from "../models/Counter.js";

const getNextSequence = async (tenantId, modelName) => {
  const counter = await Counter.findOneAndUpdate(
    { tenantId, model: modelName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return counter.seq;
};

export default getNextSequence;
