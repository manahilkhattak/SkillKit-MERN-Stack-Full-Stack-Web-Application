require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User        = require('./models/User');
const Wallet      = require('./models/Wallet');
const ToolKit     = require('./models/ToolKit');
const ToolItem    = require('./models/ToolItem');
const { generateSerialNumber } = require('./utils/ids');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding SkillKit...\n');

  // ── Admin ──────────────────────────────────────────────────
  let admin = await User.findOne({ email: 'admin@skillkit.pk' });
  if (!admin) {
    admin = await User.create({
      name: 'SkillKit Admin', email: 'admin@skillkit.pk',
      passwordHash: await bcrypt.hash('Admin@1234', 12),
      role: 'admin', status: 'active',
    });
    console.log('✓ Admin  →  admin@skillkit.pk  /  Admin@1234');
  }

  // ── Test lessees ───────────────────────────────────────────
  const lessees = [
    { name: 'Hamza Ali', email: 'hamza@test.com', phone: '03001111111', cnic: '3520212340001', institute: 'NAVTTC Rawalpindi', trade: 'Plumbing' },
    { name: 'Anand Kumar', email: 'anand@test.com', phone: '03002222222', cnic: '3520212340002', institute: 'NAVTTC Lahore', trade: 'Electrical' },
    { name: 'Sara Malik', email: 'sara@test.com', phone: '03003333333', cnic: '3520212340003', institute: 'NAVTTC Islamabad', trade: 'Welding' },
  ];
  for (const l of lessees) {
    if (!await User.findOne({ email: l.email })) {
      const u = await User.create({ ...l, passwordHash: await bcrypt.hash('Test@1234', 12), role: 'lessee', status: 'active' });
      await Wallet.create({ userId: u._id, balance: 15000, totalDeposited: 15000 });
      console.log(`✓ Lessee →  ${l.email}  /  Test@1234  (wallet: PKR 15,000)`);
    }
  }

  // ── Tool Kit catalog ───────────────────────────────────────
  const kitDefs = [
    {
      name: 'Plumbing Starter Kit', trade: 'Plumbing',
      description: 'Complete starter kit for certified NAVTTC plumbing graduates.',
      components: [
        { name: 'Hilti SDS Drill', quantity: 1, unit: 'piece' },
        { name: 'Pipe Threader', quantity: 1, unit: 'piece' },
        { name: 'Pipe Wrench', quantity: 2, unit: 'piece' },
        { name: 'Pipe Cutter', quantity: 1, unit: 'piece' },
        { name: 'Professional Tool Bag', quantity: 1, unit: 'piece' },
      ],
      monthlyRent: 4500, replacementCost: 65000, leaseDuration: 12,
      units: 5,
    },
    {
      name: 'Electrical Starter Kit', trade: 'Electrical',
      description: 'Essential tools for newly certified NAVTTC electricians.',
      components: [
        { name: 'Digital Multimeter', quantity: 1, unit: 'piece' },
        { name: 'Wire Stripper Set', quantity: 1, unit: 'set' },
        { name: 'Insulated Screwdriver Set', quantity: 1, unit: 'set' },
        { name: 'Voltage Tester', quantity: 1, unit: 'piece' },
        { name: 'Cable Fish Tape (30m)', quantity: 1, unit: 'piece' },
        { name: 'Tool Belt', quantity: 1, unit: 'piece' },
      ],
      monthlyRent: 3800, replacementCost: 45000, leaseDuration: 12,
      units: 4,
    },
    {
      name: 'Welding Starter Kit', trade: 'Welding',
      description: 'Professional welding setup for NAVTTC welding graduates.',
      components: [
        { name: 'Arc Welder (200A)', quantity: 1, unit: 'piece' },
        { name: 'Auto-Darkening Welding Helmet', quantity: 1, unit: 'piece' },
        { name: 'Angle Grinder (4½")', quantity: 1, unit: 'piece' },
        { name: 'Electrode Holder + Ground Clamp', quantity: 1, unit: 'set' },
        { name: 'Welding Gloves', quantity: 1, unit: 'pair' },
        { name: 'Wire Brush Set', quantity: 1, unit: 'set' },
      ],
      monthlyRent: 5200, replacementCost: 80000, leaseDuration: 12,
      units: 3,
    },
    {
      name: 'HVAC Starter Kit', trade: 'HVAC',
      description: 'Complete refrigeration and AC servicing toolkit.',
      components: [
        { name: 'Manifold Gauge Set (R410A)', quantity: 1, unit: 'piece' },
        { name: 'Digital Refrigerant Scale', quantity: 1, unit: 'piece' },
        { name: 'Flaring & Swaging Tool Kit', quantity: 1, unit: 'set' },
        { name: 'Pipe Bender (¼" – ⅝")', quantity: 1, unit: 'piece' },
        { name: 'Electronic Leak Detector', quantity: 1, unit: 'piece' },
        { name: 'Vacuum Pump (2-stage)', quantity: 1, unit: 'piece' },
      ],
      monthlyRent: 6000, replacementCost: 95000, leaseDuration: 12,
      units: 2,
    },
    {
      name: 'Tiling & Masonry Kit', trade: 'Tiling',
      description: 'Professional tiling and masonry starter kit.',
      components: [
        { name: 'Angle Grinder with Diamond Blade', quantity: 1, unit: 'piece' },
        { name: 'Manual Tile Cutter (60cm)', quantity: 1, unit: 'piece' },
        { name: 'Notched Trowel Set', quantity: 1, unit: 'set' },
        { name: 'Spirit Level (1.2m)', quantity: 1, unit: 'piece' },
        { name: 'Rubber Mallet', quantity: 1, unit: 'piece' },
        { name: 'Grout Float', quantity: 1, unit: 'piece' },
      ],
      monthlyRent: 3200, replacementCost: 38000, leaseDuration: 12,
      units: 3,
    },
  ];

  for (const def of kitDefs) {
    let kit = await ToolKit.findOne({ name: def.name });
    if (!kit) {
      const { units, ...kitData } = def;
      kit = await ToolKit.create({ ...kitData, createdBy: admin._id });
      console.log(`✓ Kit created: ${kit.name}`);

      // Add individual items
      for (let i = 0; i < units; i++) {
        const conditions = ['new', 'new', 'good', 'good', 'fair'];
        await ToolItem.create({
          toolKitId: kit._id,
          serialNumber: generateSerialNumber(kit.trade),
          condition: conditions[i] || 'good',
          purchaseCost: kit.replacementCost,
          purchaseDate: new Date(),
          addedBy: admin._id,
        });
      }
      console.log(`  └── ${units} physical items added (serials auto-generated)`);
    }
  }

  console.log('\n🚀 Seed complete!\n');
  console.log('Admin:   admin@skillkit.pk   /  Admin@1234');
  console.log('Lessee:  hamza@test.com      /  Test@1234  (wallet: PKR 15,000)');
  console.log('Lessee:  anand@test.com      /  Test@1234');
  console.log('Lessee:  sara@test.com       /  Test@1234');
  process.exit(0);
};

seed().catch(e => { console.error(e); process.exit(1); });
