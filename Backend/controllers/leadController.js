const Lead = require('../models/Lead');
const asyncHandler = require('../middleware/asyncHandler');
const ActivityLog = require('../models/ActivityLog');

exports.getLeads = asyncHandler(async (req, res) => {
  const leads = await Lead.find().sort({ createdAt: -1 });
  res.json(leads);
});

exports.createLead = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!data.whatsapp && data.phone) {
    data.whatsapp = data.phone;
  }
  if (!data.location) {
    data.location = 'Tamil Nadu, India';
  }
  const lead = new Lead(data);
  const saved = await lead.save();
  try {
    await new ActivityLog({
      action: 'Stove Inquiry Captured',
      details: `Inquiry from ${saved.name} (${saved.whatsapp || saved.phone}) for ${saved.stoveModel || 'Stove'} - ${saved.purpose || 'Commercial'}`
    }).save();
  } catch (logErr) {
    console.warn('Could not save activity log for lead:', logErr.message);
  }
  res.status(201).json(saved);
});

exports.updateLeadStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes, notes } = req.body;
  const updateData = { updatedAt: Date.now() };
  if (status) updateData.status = status;
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
  if (notes !== undefined) updateData.notes = notes;

  const updated = await Lead.findByIdAndUpdate(id, updateData, { new: true });
  if (!updated) {
    return res.status(404).json({ message: 'Inquiry not found' });
  }

  try {
    await new ActivityLog({
      action: 'Stove Inquiry Updated',
      details: `Status updated to ${status || updated.status} for ${updated.name}`
    }).save();
  } catch (logErr) {}

  res.json(updated);
});

exports.deleteLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await Lead.findByIdAndDelete(id);
  if (!deleted) {
    return res.status(404).json({ message: 'Inquiry not found' });
  }
  try {
    await new ActivityLog({
      action: 'Stove Inquiry Deleted',
      details: `Inquiry ID ${id} (${deleted.name}) deleted`
    }).save();
  } catch (logErr) {}

  res.json({ message: 'Inquiry deleted successfully', id });
});
