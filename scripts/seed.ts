/**
 * Seed script — sample donors, requests, and notifications
 * Run: bun scripts/seed.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const donorCount = await db.donor.count();
  if (donorCount > 0) {
    console.log("Seed skipped — data already exists");
    return;
  }

  const donors = [
    { name: "Rakib Hasan", phone: "01711223344", bloodGroup: "O+", district: "Dhaka", area: "Mirpur", lastDonation: new Date("2026-08-14"), available: true },
    { name: "Nusrat Jahan", phone: "01822334455", bloodGroup: "A+", district: "Dhaka", area: "Uttara", lastDonation: new Date("2026-07-02"), available: true },
    { name: "Tanvir Ahmed", phone: "01933445566", bloodGroup: "B+", district: "Dhaka", area: "Dhanmondi", lastDonation: null, available: true },
    { name: "Sumaiya Akter", phone: "01644556677", bloodGroup: "O-", district: "Dhaka", area: "Mohakhali", lastDonation: new Date("2026-06-20"), available: true },
    { name: "Mehedi Chowdhury", phone: "01555667788", bloodGroup: "AB+", district: "Chattogram", area: "Agrabad", lastDonation: new Date("2026-05-11"), available: true },
    { name: "Farhana Rahman", phone: "01766778899", bloodGroup: "A-", district: "Chattogram", area: "Khulshi", lastDonation: null, available: true },
    { name: "Arif Mahmud", phone: "01877889900", bloodGroup: "O+", district: "Chattogram", area: "Panchlaish", lastDonation: new Date("2026-09-01"), available: true },
    { name: "Sadia Islam", phone: "01988990011", bloodGroup: "B+", district: "Khulna", area: "Sonadanga", lastDonation: new Date("2026-04-25"), available: true },
    { name: "Imran Kabir", phone: "01699001122", bloodGroup: "O-", district: "Sylhet", area: "Zindabazar", lastDonation: new Date("2026-03-18"), available: true },
    { name: "Puja Das", phone: "01500112233", bloodGroup: "AB-", district: "Rajshahi", area: "Shaheb Bazar", lastDonation: null, available: true },
    { name: "Shahin Alam", phone: "01722113344", bloodGroup: "B-", district: "Dhaka", area: "Badda", lastDonation: new Date("2026-02-10"), available: false },
    { name: "Lamia Karim", phone: "01833224455", bloodGroup: "A+", district: "Cumilla", area: "Kandirpar", lastDonation: new Date("2026-08-30"), available: true },
  ];

  const createdDonors: { id: string; bloodGroup: string }[] = [];
  for (const d of donors) {
    const created = await db.donor.create({ data: d });
    createdDonors.push({ id: created.id, bloodGroup: created.bloodGroup });
  }

  const req1 = await db.bloodRequest.create({
    data: {
      patientName: "Abdul Karim", bloodGroup: "O+", district: "Dhaka",
      hospital: "Square Hospital", urgency: "URGENT", units: 2,
      contactName: "Rahim Karim", phone: "01799887766",
      note: "Surgery tomorrow morning. Please call anytime.", status: "OPEN",
      neededBy: new Date("2026-10-28"),
    },
  });

  await db.bloodRequest.create({
    data: {
      patientName: "Baby of Rina Akter", bloodGroup: "B+", district: "Khulna",
      hospital: "Khulna Medical College Hospital", urgency: "WITHIN_24H", units: 1,
      contactName: "Jashim Uddin", phone: "01811552299",
      note: "Thalassemia patient, monthly transfusion.", status: "OPEN",
    },
  });

  await db.bloodRequest.create({
    data: {
      patientName: "Moyna Begum", bloodGroup: "AB-", district: "Rajshahi",
      hospital: "Rajshahi Medical College Hospital", urgency: "NORMAL", units: 1,
      contactName: "Sohel Rana", phone: "01622446688", status: "OPEN",
    },
  });

  await db.bloodRequest.create({
    data: {
      patientName: "Jahangir Alam", bloodGroup: "O+", district: "Dhaka",
      hospital: "Dhaka Medical College Hospital", urgency: "URGENT", units: 3,
      contactName: "Kamal Hossain", phone: "01933669911",
      note: "Road accident, ICU. Donors needed immediately.", status: "FULFILLED",
    },
  });

  // Pre-made notifications for the Dhaka O+ donor (Rakib Hasan) & O- donor
  const rakib = createdDonors[0];
  const sumaiya = createdDonors[3];
  await db.notification.createMany({
    data: [
      {
        donorId: rakib.id, requestId: req1.id,
        title: "Blood needed: O+ at Square Hospital",
        body: "An O+ blood request (2 units) was posted for Abdul Karim at Square Hospital, Dhaka — URGENT. Contact: Rahim Karim (01799887766).",
        channel: "SMS", smsStatus: "SIMULATED", read: false,
      },
      {
        donorId: sumaiya.id, requestId: req1.id,
        title: "Blood needed: O+ at Square Hospital",
        body: "Your blood group O- is compatible with requested O+. Patient Abdul Karim at Square Hospital, Dhaka — URGENT. Contact: Rahim Karim (01799887766).",
        channel: "SMS", smsStatus: "SIMULATED", read: false,
      },
    ],
  });

  await db.message.create({
    data: {
      name: "Rahim Karim", phone: "01799887766",
      subject: "Thanks for the platform",
      content: "I found a donor for my father within 2 hours through this site. Thank you!",
    },
  });

  console.log(`Seeded: ${createdDonors.length} donors, 4 requests, 2 notifications, 1 message`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
