const mongoose = require('mongoose');
const { SheetDefinition, SheetEntry, User, MonthlyReport } = require('../models');

const sampleLinks = [
  'https://kumaragurudtsteam-my.sharepoint.com/:b:/r/personal/office_it_kct_ac_in/Documents/Certificates/AAD_Report_2026.pdf',
  'https://kumaragurudtsteam-my.sharepoint.com/:b:/r/personal/office_it_kct_ac_in/Documents/FDP/Workshop_Completion_Nov2026.pdf',
  'https://kumaragurudtsteam-my.sharepoint.com/:b:/r/personal/office_it_kct_ac_in/Documents/Research/Conference_Paper_IEEE.pdf',
  'https://kumaragurudtsteam-my.sharepoint.com/:b:/r/personal/office_it_kct_ac_in/Documents/Students/Internship_Offer_Letter.pdf'
];

const sampleAgencies = ['Saama Technologies', 'Bosch Global Software', 'Cognizant', 'Infosys', 'Presidio Solutions', 'CovanLabs', 'Apophis Solutions'];
const sampleDepts = ['IT', 'CSE', 'ECE', 'AI&DS', 'Mechanical'];
const sampleVenues = ['Hall A, Admin Block', 'Virtual (MS Teams)', 'Auditorium', 'Smart Classroom 204'];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFieldVal(col, idx, staff) {
  const key = col.fieldKey.toLowerCase();
  if (key === 's_no' || key === 'sno' || key === 'sl_no' || key === 'serial_no') {
    return idx + 1;
  }
  if (col.type === 'Date') {
    const day = String((idx % 25) + 1).padStart(2, '0');
    return `2026-11-${day}`;
  }
  if (col.type === 'Number') {
    if (key.includes('participant') || key.includes('count')) return 20 + ((idx * 7) % 180);
    if (key.includes('day')) return 1 + (idx % 5);
    if (key.includes('amount') || key.includes('fund') || key.includes('stipend')) return 5000 + (idx * 2500);
    return 1 + (idx % 10);
  }
  if (col.type === 'File') {
    return randomChoice(sampleLinks);
  }
  if (key.includes('dept') || key.includes('department')) return randomChoice(sampleDepts);
  if (key.includes('coordinator') || key.includes('faculty') || key.includes('author') || key.includes('mentor')) {
    return `${staff.displayName}, Dr. A. Raman, Prof. K. Soundar`;
  }
  if (key.includes('emp') || key.includes('code')) return `KCT0${1800 + idx}`;
  if (key.includes('roll')) return `23BIT0${(idx % 90) + 10}`;
  if (key.includes('student') || key.includes('name')) return `Student ${String.fromCharCode(65 + (idx % 26))} Kumar`;
  if (key.includes('batch')) return '2023-2027';
  if (key.includes('agency') || key.includes('company') || key.includes('industry')) return randomChoice(sampleAgencies);
  if (key.includes('venue') || key.includes('place')) return randomChoice(sampleVenues);
  if (key.includes('alumni') || key.includes('external')) return (idx % 2 === 0) ? 'Yes' : 'No';
  if (key.includes('title') || key.includes('programme') || key.includes('project')) {
    const titles = [
      'Advanced Cloud Infrastructure and Container Security',
      'Hands-on Machine Learning Pipeline Optimization',
      'Industrial IoT Deployment and Edge Computing Architecture',
      'Full Stack Web Development with Next.js and Microservices',
      'Autonomous Systems and AI Driven Robotics Workshop'
    ];
    return titles[idx % titles.length];
  }
  if (key.includes('type')) return (idx % 2 === 0) ? 'Workshop' : 'FDP';
  if (key.includes('level')) return (idx % 3 === 0) ? 'National' : (idx % 3 === 1 ? 'State' : 'College');
  return `Record detail ${idx + 1}`;
}

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://sad2_db:27017/sad_db';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const staffMembers = await User.find({ role: 'STAFF' });
  const activeMonth = await MonthlyReport.findOne({ status: 'ACTIVE', monthName: 'November' }) || await MonthlyReport.findOne({ status: 'ACTIVE' });
  const sheets = await SheetDefinition.find();

  console.log(`Targeting Month: ${activeMonth.monthName} (${activeMonth._id})`);
  console.log(`Staff Members (${staffMembers.length}):`, staffMembers.map(s => s.displayName));
  console.log(`Total sheets available: ${sheets.length}`);

  let totalEntriesCreated = 0;
  let emptySheetsCount = 0;

  for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
    const sheet = sheets[sIdx];

    // Leave around 15% sheets completely empty for pristine blank states
    if (sIdx % 7 === 0) {
      emptySheetsCount++;
      continue;
    }

    // For each staff member, generate 2 to 10 random entries
    for (const staff of staffMembers) {
      const count = Math.floor(Math.random() * 9) + 2; // [2, 10]
      const docs = [];

      for (let i = 0; i < count; i++) {
        const dataMap = new Map();
        for (const col of sheet.columns) {
          const val = generateFieldVal(col, i, staff);
          dataMap.set(col.fieldKey, val);
        }

        docs.push({
          sheetId: sheet._id,
          sheetKey: sheet.sheetKey,
          monthId: activeMonth._id,
          ownerId: staff._id,
          createdBy: staff._id,
          data: dataMap,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      await SheetEntry.insertMany(docs);
      totalEntriesCreated += docs.length;
    }
  }

  console.log(`Successfully generated ${totalEntriesCreated} dummy entries across sheets!`);
  console.log(`Left ${emptySheetsCount} sheets completely empty.`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
