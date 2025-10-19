import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database with sample data...');

  // Add sample clips
  const clips = await prisma.clip.createMany({
    data: [
      {
        name: 'Ocean Diving Adventure',
        description: 'Deep sea exploration with amazing marine life encounters',
        duration: 45,
        filePath: './samples/clips/clip01.mp4'
      },
      {
        name: 'Coral Garden Discovery',
        description: 'Vibrant coral formations and tropical fish species',
        duration: 38,
        filePath: './samples/clips/clip02.mp4'
      },
      {
        name: 'Underwater Cave Exploration',
        description: 'Mysterious underwater caves with unique formations',
        duration: 52,
        filePath: './samples/clips/clip03.mp4'
      },
      {
        name: 'Sea Turtle Encounter',
        description: 'Peaceful swimming with gentle sea turtles',
        duration: 29,
        filePath: './samples/clips/clip04.mp4'
      }
    ]
  });

  console.log(`✅ Created ${clips.count} sample clips`);

  // Add a sample job
  const firstClip = await prisma.clip.findFirst();
  if (firstClip) {
    const job = await prisma.job.create({
      data: {
        clipId: firstClip.id,
        platform: 'YOUTUBE',
        status: 'QUEUED'
      }
    });
    console.log(`✅ Created sample job: ${job.id}`);
  }

  console.log('🎉 Database seeded successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });