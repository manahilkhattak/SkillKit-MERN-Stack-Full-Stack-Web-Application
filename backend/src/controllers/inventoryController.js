const ToolKit = require('../models/ToolKit');
const ToolItem = require('../models/ToolItem');
const { ok, err } = require('../utils/response');
const { generateSerialNumber } = require('../utils/ids');
const AuditLog = require('../models/AuditLog');

// ── ToolKit (master catalog) ─────────────────────────────────

// GET /api/kits  (public — lessees see available kit types)
const getKits = async (req, res, next) => {
  try {
    const kits = await ToolKit.find({ isActive: true }).sort({ trade: 1, name: 1 });
    // Attach live counts from ToolItem collection
    const withCounts = await Promise.all(kits.map(async (kit) => {
      const [available, onLease, maintenance] = await Promise.all([
        ToolItem.countDocuments({ toolKitId: kit._id, status: 'available' }),
        ToolItem.countDocuments({ toolKitId: kit._id, status: 'on_lease' }),
        ToolItem.countDocuments({ toolKitId: kit._id, status: 'under_maintenance' }),
      ]);
      return { ...kit.toObject(), counts: { available, onLease, maintenance, total: available + onLease + maintenance } };
    }));
    return ok(res, { kits: withCounts });
  } catch (e) { next(e); }
};

// GET /api/kits/:id
const getKit = async (req, res, next) => {
  try {
    const kit = await ToolKit.findById(req.params.id);
    if (!kit) return err(res, 'Kit not found', 404);
    const items = await ToolItem.find({ toolKitId: kit._id }).sort({ status: 1, createdAt: -1 });
    return ok(res, { kit, items });
  } catch (e) { next(e); }
};

// POST /api/admin/kits  (admin only)
const createKit = async (req, res, next) => {
  try {
    const { name, trade, description, components, monthlyRent, replacementCost, leaseDuration } = req.body;
    const kit = await ToolKit.create({ name, trade, description, components, monthlyRent, replacementCost, leaseDuration, createdBy: req.user._id });
    await AuditLog.create({ actorId: req.user._id, action: 'CREATE_KIT', targetType: 'toolkit', targetId: kit._id, details: { name } });
    return ok(res, { kit }, 'Tool kit created', 201);
  } catch (e) { next(e); }
};

// PUT /api/admin/kits/:id
const updateKit = async (req, res, next) => {
  try {
    const kit = await ToolKit.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!kit) return err(res, 'Kit not found', 404);
    return ok(res, { kit }, 'Kit updated');
  } catch (e) { next(e); }
};

// PATCH /api/admin/kits/:id/toggle
const toggleKit = async (req, res, next) => {
  try {
    const kit = await ToolKit.findById(req.params.id);
    if (!kit) return err(res, 'Kit not found', 404);
    kit.isActive = !kit.isActive;
    await kit.save();
    return ok(res, { kit }, `Kit ${kit.isActive ? 'activated' : 'deactivated'}`);
  } catch (e) { next(e); }
};

// ── ToolItem (individual physical items) ─────────────────────

// GET /api/admin/items  (admin — all items with filters)
const getItems = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.toolKitId) filter.toolKitId = req.query.toolKitId;
    if (req.query.status)    filter.status = req.query.status;
    const items = await ToolItem.find(filter)
      .populate('toolKitId', 'name trade monthlyRent')
      .populate('currentLesseeId', 'name email phone')
      .sort({ status: 1, createdAt: -1 });
    return ok(res, { items, count: items.length });
  } catch (e) { next(e); }
};

// POST /api/admin/items  (admin adds a new physical item)
const addItem = async (req, res, next) => {
  try {
    const { toolKitId, condition, purchaseCost, purchaseDate, notes, quantity = 1 } = req.body;
    const kit = await ToolKit.findById(toolKitId);
    if (!kit) return err(res, 'Tool kit not found', 404);

    const created = [];
    for (let i = 0; i < quantity; i++) {
      const serialNumber = generateSerialNumber(kit.trade);
      const item = await ToolItem.create({
        toolKitId, serialNumber, condition, purchaseCost, purchaseDate, notes, addedBy: req.user._id,
      });
      created.push(item);
    }

    await AuditLog.create({ actorId: req.user._id, action: 'ADD_ITEM', targetType: 'toolitem', details: { toolKitId, quantity, kit: kit.name } });
    return ok(res, { items: created }, `${created.length} item(s) added to inventory`, 201);
  } catch (e) { next(e); }
};

// PATCH /api/admin/items/:id/status
const updateItemStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const allowed = ['available', 'under_maintenance', 'retired'];
    if (!allowed.includes(status)) return err(res, 'Invalid status. Use: available, under_maintenance, retired', 400);

    const item = await ToolItem.findById(req.params.id);
    if (!item) return err(res, 'Item not found', 404);
    if (item.status === 'on_lease') return err(res, 'Cannot change status of an item currently on lease', 400);

    item.status = status;
    if (notes) item.notes = notes;
    await item.save();

    await AuditLog.create({ actorId: req.user._id, action: 'UPDATE_ITEM_STATUS', targetType: 'toolitem', targetId: item._id, details: { status, notes } });
    return ok(res, { item });
  } catch (e) { next(e); }
};

// PATCH /api/admin/items/:id/condition
const updateItemCondition = async (req, res, next) => {
  try {
    const { condition, notes } = req.body;
    const item = await ToolItem.findByIdAndUpdate(req.params.id, { condition, notes }, { new: true });
    if (!item) return err(res, 'Item not found', 404);
    return ok(res, { item });
  } catch (e) { next(e); }
};

module.exports = { getKits, getKit, createKit, updateKit, toggleKit, getItems, addItem, updateItemStatus, updateItemCondition };
